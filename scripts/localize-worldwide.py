"""Update templates and record a default-only CMS migration, preserving custom edits."""
from pathlib import Path
from bs4 import BeautifulSoup,NavigableString
import json,re

root=Path(__file__).resolve().parents[1]
seedfile=root/'cms.seed.json'
seed=json.loads(seedfile.read_text(encoding='utf-8'))
migrationfile=root/'cms.migrations.json'
if migrationfile.exists():
    raise SystemExit('Worldwide content migration already prepared; preserve existing editing IDs.')
migration={'id':'2026-11-worldwide-india','pages':[],'settings':{}}
for key,value in [('location','India'),('tagline','Websites & AI automation / India')]:
    migration['settings'][key]={'from':seed['settings'][key],'to':value}
    seed['settings'][key]=value

def replace_text(element,value):
    child=next((c for c in element.children if isinstance(c,NavigableString) and str(c).strip()),None)
    if child is not None: child.replace_with(value)

for page in seed['pages']:
    file=root/'dist'/page['path'].strip('/')/'index.html'
    soup=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser')
    for link in soup.select('.footer-top a[href="/web-design/orange-county/"]'):
        link['href']='/#worldwide';replace_text(link,'India')
    for link in soup.select('.footer-nav a[href="/web-design/"], #main-nav > a[href="/web-design/"]'):
        link['href']='/#worldwide';replace_text(link,'Working worldwide')
    # Replace self-location claims, retaining client and case-study place names.
    for element in soup.select('main [data-cms-node]'):
        for child in list(element.children):
            if not isinstance(child,NavigableString):continue
            value=str(child)
            updated=re.sub(r'(?i)(based|built|studio|designed|design studio) in (?:Laguna Hills(?:, California)?|Orange County(?:, California)?)',lambda m:m[1]+' in India',value)
            if updated!=value:child.replace_with(updated)
    if page['path']=='/':
        soup.select_one('.ed-issue-line p').string='WEBSITES & AI AUTOMATION / INDIA'
        p=soup.select_one('.ed-hero-lede > p')
        p.contents[2].replace_with('for businesses in India and around the world.')
        statement=soup.select_one('.hx-statement-text')
        statement.select_one('[data-cms-node="n64"]').string='everywhere,'
        statement.select_one('[data-cms-node="n73"]').string='India.'
        for node in ['n65','n66','n67','n68','n74']:
            statement.select_one(f'[data-cms-node="{node}"]').decompose()
        section=soup.select_one('.hx-map');section['id']='worldwide'
        updates={'n145':'Based in India','n146':'LOCAL ROOTS,','n147':'global reach.','n148':'We design and build from India, collaborating with businesses across borders and time zones. Wherever you are, a good conversation is all it takes to get started.','n149':'Start a conversation ','n150':'Dots trace the continents, with India highlighted as our studio’s home base.'}
        for node,value in updates.items():replace_text(section.select_one(f'[data-cms-node="{node}"]'),value)
        section.select_one('[data-cms-node="n149"]')['href']='/contact/'
        slot=section.select_one('.gx-lazy-svg');slot['data-src']='/media/world-map.svg';slot['style']='aspect-ratio:1200/590'
        section.select_one('.hx-map-list').decompose()
        soup.select_one('.oc-links').decompose()
        title='Web design & AI automation | Endcap'
        description='An independent web and AI studio based in India. Websites, identities and automation for businesses worldwide.'
        soup.title.string=title
        soup.select_one('meta[name="description"]')['content']=description
        soup.head.append(soup.new_tag('link',rel='stylesheet',href='/cms/world-map.css'))
        for meta in soup.select('meta[property="og:title"],meta[name="twitter:title"]'):meta['content']=title
        for meta in soup.select('meta[property="og:description"],meta[name="twitter:description"]'):meta['content']=description
    change={'path':page['path'],'fields':[],'removeFields':[]}
    fields=[]
    for field in page['fields']:
        element=soup.select_one(f'[data-cms-node="{field["node"]}"]')
        if element is None:
            change['removeFields'].append(field['id']);continue
        children=list(element.children)
        if field['index']<len(children) and isinstance(children[field['index']],NavigableString):
            value=str(children[field['index']])
            if value!=field['value']:
                change['fields'].append({'id':field['id'],'from':field['value'],'to':value})
                field['value']=value
        if page['path']=='/' and field['node'] in updates:field['group']='LOCAL ROOTS, global reach.'
        fields.append(field)
    page['fields']=fields
    for key,value in [('title',soup.title.get_text()),('description',soup.select_one('meta[name="description"]').get('content',''))]:
        if page[key]!=value:change[key]={'from':page[key],'to':value};page[key]=value
    if change['fields'] or change['removeFields'] or 'title' in change or 'description' in change:migration['pages'].append(change)
    file.write_text(str(soup),encoding='utf-8')
for nav in seed['navigation']:
    if nav['href']=='/web-design/':nav.update(label='Working worldwide',href='/#worldwide')
seedfile.write_text(json.dumps(seed,ensure_ascii=False,indent=2),encoding='utf-8')
migrationfile.write_text(json.dumps(migration,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pages_updated':len(migration['pages']),'default_field_updates':sum(len(p['fields']) for p in migration['pages'])}))
