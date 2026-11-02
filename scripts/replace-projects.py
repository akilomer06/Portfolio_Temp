from pathlib import Path
from bs4 import BeautifulSoup,NavigableString
import json,shutil,datetime
root=Path(__file__).resolve().parents[1];dist=root/'dist'
specs=[
('quality-kitchen','The Quality Kitchen','https://the-quality-kitchen.vercel.app/','Food & ordering','A food-focused website combining editorial typography and food photography with a filterable menu, portion selection, a basket, and WhatsApp enquiries.'),
('jrzees','JRZEES','https://www.jrzees.com/','Football storefront','A football-jersey storefront with a dark visual identity, collection navigation, regional currency selection, product browsing, and a shopping bag.'),
('prompt-pop','Prompt Pop 2K26','https://prompt-pop-2k26.vercel.app/','Competition platform','An AI prompting and design competition platform with team-code entry, a timed quiz, image recreation, a comedy bonus, logo design, and results access.'),
('acm-rocs','ACM ROCS 2026','https://crescent-acm-2026-tan.vercel.app/','Workshop website','A website for the ACM India research workshop at Crescent, presenting speakers, the programme, registration information, the venue, and organiser contacts.')]
('talent-hunt','Talent Hunt 2K26','https://talent-hunt-2k26-five.vercel.app/','Event website','A bold Crescent CSE event website featuring 16 technical and non-technical competitions, event discovery, schedules, venues, FAQs, and coordinators.'),
projects=[dict(id=i,name=n,url=u,category=c,description=d,image=f'/media/projects/{i}.jpg',screen='',alt=f'{n} homepage screenshot',status='published',featured=k==0,homeVisible=True,order=k) for k,(i,n,u,c,d) in enumerate(specs)]
nav=[dict(label='Services',href='/services/',visible=True),dict(label='Our work',href='/work/',visible=True),dict(label='Insights',href='/insights/',visible=True),dict(label='About',href='/about/',visible=True),dict(label='Let’s talk',href='/contact/',visible=True)]
def fragment(html):return BeautifulSoup(html,'html.parser')
def cards():
 return '<section class="shell ed-print-work portfolio-projects"><div class="ed-print-grid">'+''.join(f'<article data-project-id="{p["id"]}"><a class="ed-print-image" href="{p["url"]}" target="_blank" rel="noopener"><img src="{p["image"]}" alt="{p["alt"]}" width="1280" height="720" loading="lazy"></a><div class="ed-print-caption"><span>{k:02}</span><div><h3><a href="{p["url"]}" target="_blank" rel="noopener">{p["name"]}</a></h3><p>{p["category"]}</p><p class="portfolio-description">{p["description"]}</p></div></div></article>' for k,p in enumerate(projects,1))+'</div></section>'
home=fragment((dist/'index.html').read_text(encoding='utf-8'))
for sel in ['.hx-proof','.hx-statement','.re-services','.hx-paths','.hx-process','.ed-founder','.rb-band','.hx-faq','.hx-hero-proof']:
 for e in home.select(sel):e.decompose()
lede=home.select_one('.ed-hero-lede > p');lede.clear();lede.append('Digital projects, events, and experiments,');lede.append(home.new_tag('br'));lede.append('designed and built with care in India.')
cover=home.select_one('.ed-cover');cover['href']=projects[0]['url'];cover['target']='_blank';cover['rel']='noopener'
cover.select_one('.ed-device-scene').replace_with(fragment('<div class="personal-featured-image"><img class="ed-device-stage" src="/media/projects/quality-kitchen.jpg" alt="The Quality Kitchen homepage screenshot" width="1280" height="720"></div>'))
cover.select_one('h2').string=projects[0]['name'];cover.select_one('.ed-cover-lede').string=projects[0]['description'];cover.select_one('.ed-cover-note span').string=projects[0]['category'];cover.select_one('.eyebrow').string='Featured project'
caption=home.select_one('.ed-cover-caption')
if caption and caption.find('p'):caption.find('p').string='The Quality Kitchen / Personal project'
home.select_one('.ed-work-heading > p:last-child').string='Personal and college projects. Five different briefs. Five working websites.'
for section in home.select('.ed-print-work')[1:]:section.decompose()
home.select_one('#work').insert_after(fragment(cards()))
about='<section class="shell personal-about" id="about"><p class="eyebrow">About this collection</p><h2>LEARNING BY<br><em>building.</em></h2><p>A collection of personal and college projects exploring event platforms, food ordering, e-commerce, and interactive competitions. Each project is an opportunity to work through a different design and development challenge.</p></section>'
home.select_one('.portfolio-projects').insert_after(fragment(about))
for e in home.select('.re-invitation-bottom > p:first-child'):e.string='Have a project idea, a collaboration, or feedback on the work? Let’s start a conversation.'
statefile=root/'.local/content.json';state=json.loads(statefile.read_text(encoding='utf-8'));seed=json.loads((root/'cms.seed.json').read_text(encoding='utf-8'))
backup=root/'.local/before-personal-projects.json'
if not backup.exists():shutil.copyfile(statefile,backup)
pages=[]
for route in ['/','/work/','/about/','/contact/','/privacy/']:
 file=dist/route.strip('/')/'index.html';soup=home if route=='/' else fragment(file.read_text(encoding='utf-8'))
 if route=='/work/':
  main=soup.select_one('main');main.clear();main.append(fragment('<section class="shell interior-heading"><p class="eyebrow">Personal & college projects</p><h1>SELECTED<br><em>work.</em></h1><p>Five projects, ordered by visual polish and interface consistency.</p></section>'));main.append(fragment(str(cover)));main.append(fragment(cards()))
 if route=='/about/':
  main=soup.select_one('main');main.clear();main.append(fragment(about.replace('<h2>','<h1>').replace('</h2>','</h1>')))
 if route=='/contact/':
  for e in soup.select('main section')[1:]:e.decompose()
  for p in soup.select('main p'):
   if any(t in p.get_text() for t in ['Noah','real estate','No obligation']):p.string='For project ideas, college collaborations, or feedback on the work, get in touch.'
  for e in soup.select('blockquote'):e.decompose()
  for e in soup.select('.hx-brief'):e.decompose()
 for a in soup.select('a[href]'):
  if a['href'].startswith('/') and not a['href'].startswith(('/media/','/#')) and a['href'].split('#')[0] not in ['/','/work/','/about/','/contact/','/privacy/']:a['href']='/work/'
 for menu in soup.select('#main-nav,.footer-nav'):
  menu.clear()
  for item in nav:
   a=soup.new_tag('a',href=item['href']);a.string=item['label'];menu.append(a)
 for el in soup.select('[data-cms-node]'):del el['data-cms-node']
 for el in soup.select('.re-invitation-actions span'):
  if el.contents and isinstance(el.contents[0],NavigableString):el.contents[0].replace_with('or email ')
 if not soup.select_one('link[href="/cms/personal-portfolio.css"]'):soup.head.append(soup.new_tag('link',rel='stylesheet',href='/cms/personal-portfolio.css'))
 fields=[];counter=0
 for el in soup.select('header *,main *,footer *'):
  if el.name in ('script','style','svg','path','circle','rect','polygon','option','noscript') or el.find_parent(['svg','script','style']):continue
  for index,child in enumerate(list(el.children)):
   if not isinstance(child,NavigableString) or len(str(child).strip())<2 or str(child).strip().isdigit():continue
   if not el.get('data-cms-node'):el['data-cms-node']=f'p{counter}';counter+=1
   parent=el.find_parent(['section','header','footer']);h=parent.find(['h1','h2']) if parent else None
   fields.append(dict(id=f'{el["data-cms-node"]}:{index}',node=el['data-cms-node'],index=index,value=str(child),group=h.get_text(' ',strip=True)[:80] if h else 'Page content',tag=el.name))
 title={'/':'Personal & college projects','/work/':'Selected projects','/about/':'About this collection','/contact/':'Get in touch','/privacy/':'Privacy'}[route]+' | Portfolio'
 description='Five personal and college projects: The Quality Kitchen, Talent Hunt 2K26, JRZEES, Prompt Pop and ACM ROCS.'
 soup.title.string=title;soup.select_one('meta[name="description"]')['content']=description
 for meta in soup.select('meta[property="og:title"]'):meta['content']=title
 for meta in soup.select('meta[property="og:description"]'):meta['content']=description
 file.write_text(str(soup),encoding='utf-8');pages.append(dict(path=route,title=title,description=description,heading=soup.find('h1').get_text(' ',strip=True),fields=fields,visible=True))
seed.update(projects=projects,pages=pages,navigation=nav)
for content in [state['draft'],state['published']]:
 old={p['path']:p for p in content['pages']};content.update(projects=json.loads(json.dumps(projects)),pages=json.loads(json.dumps(pages)),navigation=json.loads(json.dumps(nav)))
 for p in content['pages']:
  if p['path'] in old:p['visible']=old[p['path']]['visible']
state['revision']+=1;state['activity'].insert(0,dict(id='personal-projects-update',action='Portfolio replaced',detail='Five personal and college projects with real screenshots',at=datetime.datetime.now(datetime.timezone.utc).isoformat()))
statefile.write_text(json.dumps(state,ensure_ascii=False),encoding='utf-8');(root/'cms.seed.json').write_text(json.dumps(seed,ensure_ascii=False,indent=2),encoding='utf-8')
print('Five projects installed in the public site and admin. Existing account and appearance preserved.')
