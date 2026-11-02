"""Create a self-contained, visually faithful static recreation of Endcap.

Only public GET resources are read. Original analytics and submission handlers
are excluded; the contact form stores a draft locally instead of sending mail.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
from urllib.request import Request, urlopen
import json
import re
import time
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
ORIGIN = 'https://endcap.design'
assets = set()
failures = []

def get(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=45) as response:
                return response.read()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)

def local_url(url, base):
    absolute = urljoin(base, url)
    parsed = urlsplit(absolute)
    if parsed.netloc != 'endcap.design':
        return None
    return parsed.path + ('?' + parsed.query if parsed.query else '')

def asset(url, base):
    url = local_url(url, base)
    if url and (url.startswith('/media/') or url.endswith(('.xml', '.pdf'))):
        assets.add(url.split('?')[0])
    return url

def rewrite_page(path, data, pages):
    soup = BeautifulSoup(data, 'html.parser')
    for script in soup.select('script[src]'):
        if 'analytics.' in script['src'] or '/form.' in script['src']:
            script.decompose()
    for tag in soup.select('script[type="application/ld+json"], link[rel="canonical"]'):
        tag.decompose()
    robots = soup.find('meta', attrs={'name': 'robots'})
    if robots:
        robots['content'] = 'noindex, nofollow'
    for tag in soup.find_all(True):
        for name in ('src', 'poster', 'data-src', 'href'):
            value = tag.get(name)
            if not isinstance(value, str) or value.startswith(('data:', '#', 'mailto:', 'tel:', 'javascript:')):
                continue
            local = asset(value, ORIGIN + path)
            if local:
                if local.startswith('/media/'):
                    tag[name] = local
                elif name == 'href' and tag.name == 'a':
                    parsed = urlsplit(urljoin(ORIGIN + path, value))
                    tag[name] = (parsed.path if parsed.path in pages else ORIGIN + parsed.path) + ('?' + parsed.query if parsed.query else '') + ('#' + parsed.fragment if parsed.fragment else '')
        if tag.has_attr('srcset'):
            for entry in tag['srcset'].split(','):
                asset(entry.strip().split(' ')[0], ORIGIN + path)
        if tag.has_attr('style'):
            for value in re.findall(r'url\([\"\']?([^\)\"\']+)', tag['style']):
                asset(value, ORIGIN + path)
    if soup.select_one('form'):
        script = soup.new_tag('script', src='/recreation.js', defer=True)
        soup.head.append(script)
    target = DIST / path.lstrip('/') / 'index.html'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(str(soup), encoding='utf-8')

def fetch_asset(path):
    target = DIST / unquote(path).lstrip('/')
    if target.exists():
        data = target.read_bytes()
    else:
        data = get(ORIGIN + path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    return path, data

def main():
    if (ROOT / 'cms.seed.json').exists():
        raise SystemExit('This site is indexed by the CMS. Re-import into a separate directory to preserve the existing editing IDs and content.')
    DIST.mkdir(parents=True, exist_ok=True)
    home = get(ORIGIN + '/')
    soup = BeautifulSoup(home, 'html.parser')
    pages = {'/'}
    for a in soup.select('a[href]'):
        local = local_url(a['href'], ORIGIN + '/')
        if local:
            path = urlsplit(local).path
            if not path.startswith(('/media/', '/api/')) and path.endswith('/'):
                pages.add(path)
    print(f'Recreating {len(pages)} linked pages', flush=True)
    rewrite_page('/', home, pages)
    with ThreadPoolExecutor(max_workers=5) as pool:
        jobs = {pool.submit(get, ORIGIN + path): path for path in sorted(pages - {'/'})}
        for i, job in enumerate(as_completed(jobs), 1):
            path = jobs[job]
            try:
                rewrite_page(path, job.result(), pages)
            except Exception as error:
                failures.append({'path': path, 'error': str(error)})
            if i % 15 == 0:
                print(f'Pages: {i + 1}/{len(pages)}', flush=True)
    # Scripts also refer to lazy-loaded maps and images, and CSS to local fonts.
    done = set()
    while assets - done:
        batch = sorted(assets - done)
        with ThreadPoolExecutor(max_workers=6) as pool:
            jobs = {pool.submit(fetch_asset, path): path for path in batch}
            for job in as_completed(jobs):
                path = jobs[job]
                done.add(path)
                try:
                    _, data = job.result()
                    if path.endswith(('.css', '.js', '.svg')):
                        text = data.decode('utf-8')
                        if path.endswith('.svg'):
                            # Lazy-inserted SVG maps contain their own city links.
                            def map_link(match):
                                value = match.group(2)
                                if value.startswith('/') and not value.startswith('/media/') and urlsplit(value).path not in pages:
                                    value = ORIGIN + value
                                return match.group(1) + value + match.group(3)
                            text = re.sub(r'(\bhref=[\"\'])([^\"\']+)([\"\'])', map_link, text)
                            (DIST / unquote(path).lstrip('/')).write_text(text, encoding='utf-8')
                        for value in re.findall(r'url\([\"\']?([^\)\"\']+)', text):
                            asset(value, ORIGIN + path)
                        for value in re.findall(r'[\"\'](/media/[^\"\'<>\s]+)', text):
                            asset(value, ORIGIN + path)
                except Exception as error:
                    failures.append({'path': path, 'error': str(error)})
        print(f'Assets: {len(done)} downloaded, {len(assets - done)} dependencies remaining', flush=True)
    manifest = {'reference': ORIGIN, 'pages': sorted(pages), 'asset_count': len(done), 'failures': failures}
    (ROOT / 'recreation-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps({'pages': len(pages), 'assets': len(done), 'failures': failures}), flush=True)

if __name__ == '__main__':
    main()
