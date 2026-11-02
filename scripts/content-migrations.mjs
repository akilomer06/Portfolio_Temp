// Apply template-default changes without replacing content the owner has edited.
export function migrateContent(content, migrations) {
  let changes=0;
  for(const migration of migrations) {
    for(const [key,change] of Object.entries(migration.settings || {})) {
      if(content.settings[key]===change.from){content.settings[key]=change.to;changes++;}
    }
    if(migration.id.startsWith('2026-11-worldwide-india')) {
      if(/Orange County|Laguna Hills|Southern California/i.test(content.settings.location || '')){content.settings.location='India';changes++;}
      const tagline=content.settings.tagline.replace(/Orange County(?:,\s*(?:CA|California))?/gi,'India');
      if(tagline!==content.settings.tagline){content.settings.tagline=tagline;changes++;}
      for(const link of content.navigation)if(link.href==='/web-design/'){link.href='/#worldwide';if(link.label==='City guides')link.label='Working worldwide';changes++;}
    }
    for(const change of migration.pages) {
      const page=content.pages.find(p=>p.path===change.path);
      if(!page)continue;
      for(const key of ['title','description'])if(change[key]&&page[key]===change[key].from){page[key]=change[key].to;changes++;}
      const fields=new Map(page.fields.map(field=>[field.id,field]));
      for(const update of change.fields){const field=fields.get(update.id);if(field&&field.value===update.from){field.value=update.to;changes++;}}
      const removed=new Set(change.removeFields);
      if(page.fields.some(field=>removed.has(field.id))){page.fields=page.fields.filter(field=>!removed.has(field.id));changes++;}
      if(page.path==='/')for(const field of page.fields)if(['n145','n146','n147','n148','n149','n150'].includes(field.node))field.group='LOCAL ROOTS, global reach.';
    }
  }
  return changes;
}
