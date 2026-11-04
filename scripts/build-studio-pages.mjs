import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { services,caseStudies,workPage,casePage,homeServices,servicesPage,servicePage,projectCards } from './portfolio-pages.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>fs.readFile(path.join(root,name),'utf8');
const write=async(name,data)=>{await fs.mkdir(path.dirname(path.join(root,name)),{recursive:true});await fs.writeFile(path.join(root,name),data);};
const field=(id,value,group,tag='p')=>({id:id+':0',node:id,index:0,value,group,tag});

export function addStudioContent(content){
  for(const project of content.projects)project.caseStudy={...caseStudies[project.id],...project.caseStudy};
  const work=content.pages.find(p=>p.path==='/work/');
  work.title='Our work — Websites & digital experiences | Webly';
  work.description='Explore Webly projects, from fragrance storefronts and food ordering to interactive competition platforms and event websites.';
  const serviceIndex=content.pages.find(p=>p.path==='/services/');
  serviceIndex.title='Website design, commerce & digital experiences | Webly';
  serviceIndex.description='Explore Webly services: website design and development, commerce, event platforms, visual direction, content management, and launch support.';
  const updates={
    'menu-heading':'GOOD DESIGN. BUILT TO WORK.',
    'menu-lead':'Websites, storefronts, and digital experiences. We bring design and development together, from the first conversation to the live site.'
  };
  for(const [node,value] of Object.entries(updates)){
    const existing=serviceIndex.fields.find(item=>item.node===node);
    if(existing)existing.value=value;else serviceIndex.fields.push(field(node,value,'Services introduction',node==='menu-heading'?'h1':'p'));
  }
  for(const service of services){
    if(content.pages.some(page=>page.path==='/services/'+service.id+'/'))continue;
    content.pages.push({path:'/services/'+service.id+'/',title:service.title+' | Webly',description:service.description,heading:service.title,visible:true,fields:[
      field('service-title',service.title,'Introduction','h1'),field('service-intro',service.intro,'Introduction'),field('service-body',service.body,'The approach'),...service.deliverables.map((value,i)=>field('deliverable-'+i,value,'What we can include')),field('service-outcome',service.outcome,'What you leave with','h2')
    ]});
  }
  return content;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const content=addStudioContent(JSON.parse(await read('cms.seed.json')));
  const clean=html=>html.replace(/<link\b[^>]*href="\/cms\/studio\.css"[^>]*>/g,'');
  const workTemplate=clean(await read('dist/work/index.html')),serviceTemplate=clean(await read('dist/services/index.html'));
  const shell=(template,main,title,description)=>template.replace(/<title>[\s\S]*?<\/title>/,'<title>'+title.replaceAll('&','&amp;')+'</title>').replace(/(<meta\b[^>]*name="description"[^>]*>)/,tag=>tag.replace(/content="[^"]*"/,'content="'+description.replaceAll('&','&amp;').replaceAll('"','&quot;')+'"')).replace(/<main\b[^>]*>[\s\S]*?<\/main>/,'<main id="main">'+main+'</main>').replace('</head>','<link rel="stylesheet" href="/cms/studio.css"></head>');
  await write('dist/work/index.html',shell(workTemplate,workPage(content),content.pages.find(p=>p.path==='/work/').title,content.pages.find(p=>p.path==='/work/').description));
  await write('dist/services/index.html',shell(serviceTemplate,servicesPage(content.pages.find(p=>p.path==='/services/')),content.pages.find(p=>p.path==='/services/').title,content.pages.find(p=>p.path==='/services/').description));
  for(const p of content.projects)await write('dist/work/'+p.id+'/index.html',shell(workTemplate,casePage(p,content),p.name+' — '+p.category+' | Webly',p.description));
  for(const service of services){const page=content.pages.find(p=>p.path==='/services/'+service.id+'/');await write('dist'+page.path+'index.html',shell(serviceTemplate,servicePage(service,page,content),page.title,page.description));}
  let home=clean(await read('dist/index.html'));
  home=home.replace(/<section\b[^>]*class="[^"]*portfolio-projects[^"]*"[^>]*>[\s\S]*?<\/section>/,projectCards(content.projects.filter(p=>p.status==='published'&&p.homeVisible!==false)));
  const homeSection=homeServices().replace('<section','<section data-webly-home-services');
  if(!home.includes('data-webly-home-services'))home=home.replace(/(<section\b[^>]*id="work"[^>]*>)/,homeSection+'$1');
  home=home.replace('</head>','<link rel="stylesheet" href="/cms/studio.css"></head>');
  await write('dist/index.html',home);
  await write('cms.seed.json',JSON.stringify(content,null,2)+'\n');
  const local=JSON.parse(await read('.local/content.json'));
  addStudioContent(local.draft);addStudioContent(local.published);local.revision++;
  await write('.local/content.json',JSON.stringify(local,null,2)+'\n');
  console.log('Built the work index, four project stories, services index, six service pages, and homepage services.');
}
