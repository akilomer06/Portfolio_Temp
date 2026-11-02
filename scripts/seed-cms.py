"""Index the existing website without changing its layout or text structure."""
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
import json, hashlib

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
seedfile = root / 'cms.seed.json'
if seedfile.exists():
    raise SystemExit('CMS is already indexed. Preserve cms.seed.json and existing field IDs.')
pages = []
home = None
for file in sorted(dist.rglob('index.html')):
    if file.parent.name == 'admin':
        continue
    route = '/' + file.parent.relative_to(dist).as_posix().strip('.')
    route = '/' if route == '/' else route.rstrip('/') + '/'
    soup = BeautifulSoup(file.read_text(encoding='utf-8'), 'html.parser')
    fields = []
    counter = 0
    for element in soup.select('header *, main *, footer *'):
        if element.name in ('script','style','svg','path','circle','rect','polygon','option','noscript') or element.find_parent(['svg','script','style']):
            continue
        for index, child in enumerate(list(element.children)):
            if not isinstance(child, NavigableString) or not str(child).strip() or str(child).strip().isdigit():
                continue
            if len(str(child).strip()) < 2:
                continue
            if not element.get('data-cms-node'):
                element['data-cms-node'] = f'n{counter}'
                counter += 1
            section = element.find_parent(['section','header','footer'])
            heading = section.find(['h1','h2']) if section else None
            group = heading.get_text(' ',strip=True)[:80] if heading else ('Navigation' if element.find_parent('header') else 'Footer' if element.find_parent('footer') else 'Page content')
            fields.append({'id':f"{element['data-cms-node']}:{index}", 'node':element['data-cms-node'], 'index':index, 'value':str(child), 'group':group, 'tag':element.name})
    meta = soup.find('meta',attrs={'name':'description'})
    heading = soup.find('h1')
    pages.append({'path':route, 'title':soup.title.string or '', 'description':meta.get('content','') if meta else '', 'heading':heading.get_text(' ',strip=True) if heading else route, 'fields':fields, 'visible':True})
    script = soup.new_tag('script',src='/cms/site.js',defer=True)
    soup.head.append(script)
    file.write_text(str(soup),encoding='utf-8')
    if route == '/':
        home = soup

projects = []
cover = home.select_one('.ed-cover')
projects.append({'id':'parker-associates','name':'Parker & Associates, Inc.','category':'Brokerage website','url':cover['href'],'image':cover.select_one('.ed-device-stage')['src'],'screen':cover.select_one('.ed-device-screen')['src'],'alt':cover.select_one('.ed-device-screen')['alt'],'description':cover.select_one('.ed-cover-lede').get_text(strip=True),'status':'published','featured':True,'order':0})
for i, article in enumerate(home.select('.ed-print-grid article'),1):
    link = article.select_one('h3 a')
    image = article.select_one('img')
    name = link.get_text(strip=True)
    project = {'id':hashlib.sha1(name.encode()).hexdigest()[:12], 'name':name,'category':article.select_one('.ed-print-caption p').get_text(strip=True),'url':link['href'],'image':image['src'],'screen':'','alt':image.get('alt',''),'description':'','status':'published','featured':False,'order':i,'template':str(article)}
    article['data-project-id'] = project['id']
    projects.append(project)
# Save project IDs after the homepage index pass.
(dist / 'index.html').write_text(str(home),encoding='utf-8')

nav = [{'label':a.get_text(strip=True),'href':a['href'],'visible':True} for a in home.select('#main-nav > a')]
seed = {
 'schema':1,
 'settings':{'siteName':'Endcap','tagline':'Websites & AI automation / Orange County, CA','email':'hello@endcap.design','phone':'(949) 424-7340','phoneLink':'+19494247340','location':'Orange County, California','copyright':'© 2026 Endcap Web Design','instagram':'https://www.instagram.com/endcap.design/','businessHours':'Monday–Friday, 9am–5pm','replyTime':'Within one business day'},
 'theme':{'accent':'#b7e1c4','paper':'#f8f7f3','ink':'#181a17','muted':'#5e6258','line':'#d4d6ca','bodyFont':'Hanken','headingFont':'Endcap Grotesk','serifFont':'Fraunces','bodySize':16,'headingScale':1,'animations':True},
 'navigation':nav,
 'projects':projects,
 'pages':pages
}
seedfile.write_text(json.dumps(seed,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pages':len(pages),'projects':len(projects),'editable_text_fields':sum(len(p['fields']) for p in pages),'seed_bytes':seedfile.stat().st_size}))
