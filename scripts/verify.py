"""Validate local page links, images, fonts, styles and scripts."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from bs4 import BeautifulSoup
import json
import re

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
missing = set()
page_count = 0

def check(value, base):
    if not value or value.startswith(('data:', '#', 'mailto:', 'tel:', 'javascript:')):
        return
    parsed = urlsplit(value)
    if parsed.netloc or parsed.scheme:
        return
    pathname = unquote(parsed.path)
    target = dist / pathname.lstrip('/') if pathname.startswith('/') else base.parent / pathname
    if target.is_dir():
        target /= 'index.html'
    if not target.exists():
        missing.add(str(target.relative_to(dist)))

for file in dist.rglob('*.html'):
    page_count += 1
    soup = BeautifulSoup(file.read_text(encoding='utf-8'), 'html.parser')
    assert soup.title and soup.select_one('main'), f'Incomplete page: {file}'
    assert not soup.select('script[src*="analytics."]'), f'Analytics included: {file}'
    for tag in soup.find_all(True):
        for name in ('src', 'href', 'poster', 'data-src'):
            if tag.has_attr(name):
                check(tag[name], file)
        for entry in tag.get('srcset', '').split(','):
            if entry.strip():
                check(entry.strip().split()[0], file)
        for value in re.findall(r'url\([\"\']?([^\)\"\']+)', tag.get('style', '')):
            check(value, file)

for file in dist.rglob('*.css'):
    for value in re.findall(r'url\([\"\']?([^\)\"\']+)', file.read_text(encoding='utf-8')):
        check(value, file)

for file in dist.rglob('*.svg'):
    for value in re.findall(r'\bhref=[\"\']([^\"\']+)', file.read_text(encoding='utf-8')):
        check(value, file)

manifest = json.loads((root / 'recreation-manifest.json').read_text(encoding='utf-8'))
print(json.dumps({'pages': page_count, 'assets': manifest['asset_count'], 'missing_local_resources': sorted(missing), 'download_errors': manifest['failures']}, indent=2))
raise SystemExit(bool(missing or manifest['failures']))
