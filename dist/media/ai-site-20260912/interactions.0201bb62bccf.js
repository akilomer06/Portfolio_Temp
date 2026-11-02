(()=>{
// Ad landing pages strip the site header (ad_landing.strip_chrome); without this guard the rest of the script,
// including the contact form handling below, never ran on them (found October 9, 2026).
const mast=document.querySelector('.mast');
if(mast&&mast.querySelector('.menu-toggle')&&mast.querySelector('nav')){
const menuButton=mast.querySelector('.menu-toggle');
const nav=mast.querySelector('nav');
mast.dataset.enhanced='true';
menuButton.hidden=false;
function setMenu(open,restoreFocus=false){
 mast.classList.toggle('menu-open',open);
 menuButton.setAttribute('aria-expanded',String(open));
 menuButton.innerHTML=open?'Close <span aria-hidden="true">−</span>':'Menu <span aria-hidden="true">+</span>';
 if(restoreFocus)menuButton.focus();
}
menuButton.addEventListener('click',()=>setMenu(menuButton.getAttribute('aria-expanded')!=='true'));
nav.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuButton.getAttribute('aria-expanded')==='true')setMenu(false,true);});
document.addEventListener('click',event=>{if(!mast.contains(event.target))setMenu(false);});
window.matchMedia('(min-width:901px)').addEventListener('change',()=>setMenu(false));
}

const legacySections={contact:'/contact/',inquiry:'/contact/',start:'/contact/',implementation:'/services/',studio:'/about/',services:'/services/','in-practice':'/work/'};
if(location.pathname==='/'&&legacySections[location.hash.slice(1)])location.replace(legacySections[location.hash.slice(1)]+location.search);

const ideas=JSON.parse(document.querySelector('#idea-data')?.textContent||'[]');
const ideaById=Object.fromEntries(ideas.map(idea=>[idea.id,idea]));
const form=document.querySelector('#review-form');
if(form){
 const message=form.querySelector('#message');
 const projectType=form.querySelector('#project-type');
 const selectedIdea=form.querySelector('#selected-idea');
 const selectedNote=form.querySelector('.selected-idea');
 const examples={brokerage:'Tell us about your brokerage, your current website, and what needs to change.',property:'Tell us about the property, the audience, and your timeline.',materials:'What listing materials or property branding do you need?',tools:'What do you do, what have you tried with AI, and where could you use some help?',search:'Tell us about your business, your website, and how customers find you.',unsure:'Tell us about the property or business, the materials you need, and your timeline.'};
 const landingPrompt=message.getAttribute('data-initial-placeholder');
 const updatePrompt=()=>{
  const idea=ideaById[selectedIdea.value];
  message.placeholder=idea?`Tell us how you handle ${idea.title.toLowerCase()} today, and what you’d like AI to take care of.`:((!projectType.value&&landingPrompt)||examples[projectType.value]||examples.unsure);
 };
 const chooseIdea=id=>{
  const idea=ideaById[id];
  if(!idea)return;
  selectedIdea.value=id;
  form.querySelector('[name="example"]').value=idea.title;
  selectedNote.textContent=`You’d like to explore: ${idea.title}`;
  selectedNote.hidden=false;
  projectType.value=idea.interest||'tools';
  updatePrompt();
 };
 const params=new URLSearchParams(location.search);new URLSearchParams(location.hash.slice(1)).forEach((v,k)=>{if(!params.has(k))params.set(k,v)});
 const interest=params.get('interest');
 if(['website','brokerage','property','materials','unsure'].includes(interest))projectType.value=interest;
 if(params.has('idea'))chooseIdea(params.get('idea'));
 projectType.addEventListener('change',()=>{
  selectedIdea.value='';form.querySelector('[name="example"]').value='';selectedNote.hidden=true;selectedNote.textContent='';updatePrompt();
 });
 document.querySelectorAll('[data-idea]').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();chooseIdea(link.dataset.idea);
  document.querySelector('#contact').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  document.querySelector('#contact-title').focus({preventScroll:true});
 }));
 updatePrompt();

}
const filters=document.querySelector('.idea-filters');
if(filters){
 filters.hidden=false;
 const count=document.querySelector('.idea-count');count.hidden=false;
 const cards=[...document.querySelectorAll('.idea-card')];
 filters.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  filters.querySelectorAll('[data-filter]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  cards.forEach(card=>{card.hidden=button.dataset.filter!=='All examples'&&card.dataset.category!==button.dataset.filter;});
  const visible=cards.filter(card=>!card.hidden).length;
  count.textContent=button.dataset.filter==='All examples'?'Showing all examples':`Showing ${visible} ${visible===1?'example':'examples'}`;
 }));
}

const tableFilter=document.querySelector('[data-filter-table]');
if(tableFilter){
 const table=document.getElementById(tableFilter.dataset.filterTable);
 const rows=[...table.tBodies[0].rows];
 const box=tableFilter.parentElement;
 const count=box.querySelector('[aria-live]');
 box.hidden=false;
 const run=()=>{
  const query=tableFilter.value.trim().toLowerCase();
  let shown=0;
  rows.forEach(row=>{
   const match=!query||(row.cells[0].textContent+' '+row.cells[1].textContent).toLowerCase().includes(query);
   row.hidden=!match;if(match)shown++;
  });
  count.textContent=query?`${shown} of ${rows.length} centers`:`${rows.length} centers`;
 };
 tableFilter.addEventListener('input',run);run();
}

const brandSection=document.querySelector('.brand-section');
if(brandSection){
 const brandTrack=brandSection.querySelector('.brand-track');
 const brandCopy=brandTrack.firstElementChild.cloneNode(true);
 brandCopy.setAttribute('aria-hidden','true');
 brandCopy.setAttribute('inert','');
 brandCopy.removeAttribute('aria-label');
 brandCopy.classList.add('brand-copy');
 brandTrack.append(brandCopy);
 brandSection.dataset.enhanced='true';
}

})();
