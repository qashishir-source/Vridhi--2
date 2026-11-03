(function(){
/* Goal Planner clients (build 84): S.gpp = { active, profiles: { id: { name, d: {members,start,end,ret,retP,hor,goal,link,grat,assets}, created } } }.
   The top-level fields of S stay the ACTIVE person's (a mirror), so every Goal Planner view and calculation is unchanged;
   save() copies them into the active profile and switching copies a profile back into S. */
const MAXP=12,KEYS=GPP_KEYS;
const slug=n=>String(n).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24)||'client';
const nm=n=>String(n==null?'':n).replace(/\s+/g,' ').trim().slice(0,30);
const snap=s=>{const o={};for(const k of KEYS)o[k]=JSON.parse(JSON.stringify(s[k]));return o};
const defName=()=>{try{const m=S.members&&S.members[0],n=m&&nm(m.name);if(n&&n.toLowerCase()!=='self')return n}catch(e){}return'My portfolio'};
let drawerOpen=false,drawerCloseTimer=0;
function translate(key){return typeof tr==='function'?tr(key):key}
function ensure(){
  if(typeof S==='undefined'||!S)return null;
  let P=S.gpp;
  if(!P||!P.profiles||!Object.keys(P.profiles).length){const n=defName(),id=slug(n);P=S.gpp={active:id,profiles:{[id]:{name:n,d:snap(S),created:Date.now()}}}}
  if(!Object.prototype.hasOwnProperty.call(P.profiles,P.active))P.active=Object.keys(P.profiles)[0];
  return P}
window.gppSync=function(){const P=S&&S.gpp;if(P&&P.profiles&&P.profiles[P.active])P.profiles[P.active].d=snap(S)};
const list=()=>{const P=ensure();return P?Object.keys(P.profiles).map(id=>Object.assign({id,active:id===P.active},P.profiles[id])):[]};
const taken=(n,P,ex)=>Object.keys(P.profiles).some(id=>id!==ex&&P.profiles[id].name.toLowerCase()===n.toLowerCase());
const uid=(n,P)=>{const b=slug(n);let id=b,i=2;while(id in Object.prototype||Object.prototype.hasOwnProperty.call(P.profiles,id))id=b.slice(0,20)+'-'+i++;return id};
const fresh=n=>{const d=DEF();return{members:[MB(1,n,'Self',d.members[0].age)],start:d.start,end:d.end,ret:d.ret,retP:d.retP,hor:d.hor,goal:d.goal,link:false,grat:{basic:0,svc:0,rem:0,cap:0},policies:[],assets:[]}};

function sw(id,tab){
  const P=ensure();if(!P||!Object.prototype.hasOwnProperty.call(P.profiles,id))return false;
  window.gppSync();P.active=id;Object.assign(S,JSON.parse(JSON.stringify(P.profiles[id].d)));
  UI.q='';UI.cat='All';UI.sel=null;UI.rq='';UI.rsel=undefined;UI.rcl=undefined;
  if(tab)UI.tab=tab;save();render();return true}
function add(name){
  const P=ensure(),n=nm(name);if(!P)return'Could not add the person.';if(!n)return'Enter a name.';
  if(Object.keys(P.profiles).length>=MAXP)return'You can keep up to '+MAXP+' people.';
  if(taken(n,P))return'A person with this name already exists.';
  const id=uid(n,P);window.gppSync();P.profiles[id]={name:n,d:fresh(n),created:Date.now()};sw(id,'Holdings');return''}
function ren(id,name){const P=ensure(),n=nm(name);if(!P||!P.profiles[id])return'Could not rename.';if(!n)return'Enter a name.';if(taken(n,P,id))return'A person with this name already exists.';P.profiles[id].name=n;save();render();return''}
function dup(id){const P=ensure();if(!P||!P.profiles[id]||Object.keys(P.profiles).length>=MAXP)return null;window.gppSync();const src=P.profiles[id];let n=nm(src.name+' (copy)'),i=2;while(taken(n,P))n=nm(src.name).slice(0,24)+' (copy '+i+++')';P.profiles[uid(n,P)]={name:n,d:JSON.parse(JSON.stringify(src.d)),created:Date.now()};save();render();return n}
function del(id){const P=ensure();if(!P||!P.profiles[id]||Object.keys(P.profiles).length<2)return null;window.gppSync();const snapP=P.profiles[id],was=P.active===id;delete P.profiles[id];if(was)sw(Object.keys(P.profiles)[0]);else{save();render()}return{id,snap:snapP,was}}
function restore(x){const P=ensure();if(!P||!x||P.profiles[x.id])return;P.profiles[x.id]=x.snap;if(x.was)sw(x.id);else{save();render()}}

window.gppBarHTML=function(top){
  const clients=list(),active=clients.find(p=>p.active),label=active?active.name:translate('Add your first client');
  if(!top)return'';
  let portal=document.getElementById('gpp-drawer-portal');
  if(!portal){portal=document.createElement('div');portal.id='gpp-drawer-portal';document.body.appendChild(portal)}
  portal.innerHTML=window.gppDrawerHTML();
  return'<span class="fhp-l">'+esc(translate('Client'))+'</span><button type="button" class="client-trigger gpp-client-trigger" id="gpp-sel" data-gpp-drawer-trigger aria-expanded="'+drawerOpen+'" aria-controls="gpp-drawer" title="'+esc(label)+'"><span class="client-trigger-value">'+esc(label)+'</span><svg class="client-chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3 6 5 5 5-5"/></svg></button>'
};
window.gppHeroInner=function(){const P=ensure();if(!P)return'';const p=P.profiles[P.active],m=S.members&&S.members[0],M0=typeof cr==='function'?cr:null,nm=String(p.name||'').trim();if(!nm)return'';
  const bits=[];if(m&&Number.isFinite(+m.age))bits.push('Age '+(+m.age));if(Number.isFinite(+S.ret))bits.push('retiring at '+(+S.ret));if(Number.isFinite(+S.goal)&&M0)bits.push('goal '+String(M0(+S.goal)).replace('\u20b9 ','\u20b9'));
  const ini=nm.split(/\s+/).filter(Boolean).slice(0,2).map(w=>Array.from(w)[0].toUpperCase()).join('');
  return'<div class="dz-who"><span class="fhp-av sm" aria-hidden="true">'+esc(ini)+'</span><div class="fhp-ht"><span class="fhp-eb">Goal plan prepared for</span><div class="dz-nr"><h2 class="fhp-nm sm">'+esc(nm)+'</h2>'+(bits.length?'<span class="fhp-sub">'+bits.join(' \u00b7 ')+'</span>':'')+'</div></div></div>'};
window.gppMBar=function(){return''};
window.gppHoldingList=function(){/* read-only: every Goal Planner client with today's value of each holding (the same numbers as Current Corpus on the Goal Planner summary) */
  const P=ensure();if(!P)return[];window.gppSync();
  return Object.keys(P.profiles).map(function(id){const p=P.profiles[id];let items=[];
    try{const d=JSON.parse(JSON.stringify(p.d)),D=calc(d);items=(d.assets||[]).map(function(x,i){return{id:String(x.id),name:String(x.name||'Holding'),cat:String(x.cat||''),val:Math.round(+D.rows[0].v[i]||0),ca:String(x.ca||''),ma:String(x.ma||'')}})}catch(e){items=[]}
    return{id:id,name:p.name,active:id===P.active,items:items}})};

function metrics(p){
  if(!p.d.assets.length)return null;
  const keep=snap(S);
  try{Object.assign(S,JSON.parse(JSON.stringify(p.d)));const c=ctx();let sv=0,fy='';/* savings per year = yearly + monthly additions in the first financial year, same rule as Reports > Annual Savings Schedule */let sn=0,s1=0,f1='',f2='';try{const D=calc(S),lab=i=>'FY '+(S.start+i-1)+'-'+String(S.start+i).slice(2);let tot=0;for(let i=1;i<D.rows.length;i++){const v=D.rows[i].add||0;if(v>0){tot+=v;sn++;if(sn===1){s1=Math.round(v);f1=lab(i)}f2=lab(i)}}sv=sn?Math.round(tot/sn):0;fy=f1&&f1+' to '+f2}catch(e){sv=0}return{today:c.r0.tot,atRet:c.rr.tot,goal:c.G,yr:c.yr,tm:c.tm,ret:S.ret,sav:sv,fy:fy,sn:sn,s1:s1}}
  catch(e){return null}
  finally{Object.assign(S,keep)}}
window.gppActiveName=function(){const P=ensure();return P&&P.profiles[P.active]?String(P.profiles[P.active].name||''):''};
window.gppReportTitle=function(title){const name=window.gppActiveName();return esc(translate(title))+(name?' · '+esc(name):'')};
function clientCard(p){
  const M0=typeof cr==='function'?cr:(x=>'\u20b9'+Math.round(x).toLocaleString('en-IN')),M=x=>String(M0(x)).replace('\u20b9 ','\u20b9');
  const m=metrics(p),goal=+(p.d.goal||0),worth=m?m.today:0,atRet=m?m.atRet:0,pct=goal>0?Math.round(atRet/goal*100):0,ok=!!m&&atRet>=goal;
  const status=m?translate(ok?'On track':'Behind goal'):translate('No holdings');
  const progress='<div class="gpp-progress" role="progressbar" aria-label="'+esc(translate('Goal progress'))+'" aria-valuenow="'+Math.max(0,Math.min(100,pct))+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+Math.max(0,Math.min(100,pct))+'%"></span></div>';
  const reached=m?(m.tm==null?translate('Not within plan'):(Math.floor(m.tm/12)?Math.floor(m.tm/12)+' '+translate('yr')+' ':'')+(m.tm%12)+' '+translate('mo')):'\u2014';
  const savings=m&&m.sav>0?M(m.sav):'\u2014',members=p.d.members.length,holdings=p.d.assets.length;
  const savingsTitle=m&&m.fy?translate('Average of')+' '+m.sn+' '+translate('saving years')+' ('+m.fy+'). '+translate('First year')+' '+M(m.s1)+'. '+translate('Year-by-year list')+': '+translate('Reports')+' > '+translate('Annual Savings Schedule'):'';
  const reason=p.active?translate("You can't delete the active client"):list().length<2?translate("You can't delete the only client"):'';
  const menu='<details class="gpp-kebab"><summary aria-label="'+esc(translate('Client actions'))+'" title="'+esc(translate('Client actions'))+'"><span aria-hidden="true">⋮</span></summary><div class="gpp-menu" role="menu"><button type="button" role="menuitem" data-gpp="dup:'+esc(p.id)+'">'+esc(translate('Duplicate'))+'</button><button type="button" role="menuitem" data-gpp="ren:'+esc(p.id)+'">'+esc(translate('Rename'))+'</button><button type="button" role="menuitem" data-gpp="del:'+esc(p.id)+'"'+(reason?' disabled title="'+esc(reason)+'" aria-describedby="gpp-delete-reason-'+esc(p.id)+'"':'')+'>'+esc(translate('Delete'))+'</button>'+(reason?'<span class="gpp-delete-reason" id="gpp-delete-reason-'+esc(p.id)+'">'+esc(reason)+'</span>':'')+'</div></details>';
  return'<article class="gpp-client-card'+(p.active?' is-active':'')+'" data-gpp-card="'+esc(p.id)+'" data-gpp-card-name="'+esc(p.name.toLowerCase())+'" aria-label="'+esc(p.name)+'"><header><button type="button" class="gpp-client-select" data-gpp="switch:'+esc(p.id)+'" aria-label="'+esc(translate('Switch')+' '+p.name)+'" title="'+esc(p.name)+'">'+esc(p.name)+'</button>'+(p.active?'<span class="fhp-chip fhp-act">'+esc(translate('Active'))+'</span>':'')+menu+'</header><div class="gpp-card-summary"><span class="gpp-status">'+esc(status)+'</span><b>'+esc(M(worth))+'</b><span>'+pct+'% '+esc(translate('of'))+' '+esc(M(goal))+'</span></div>'+progress+(!m?'<p class="gpp-no-holdings">'+esc(translate('No holdings yet. Open the plan to add one.'))+'</p>':'')+'<details class="gpp-details"><summary>'+esc(translate('Details'))+'</summary><div class="gpp-detail-grid"><div><small>'+esc(translate('Holdings'))+'</small><b>'+holdings+' '+esc(translate(holdings===1?'holding':'holdings'))+'</b></div><div><small>'+esc(translate('Members'))+'</small><b>'+members+' '+esc(translate(members===1?'member':'members'))+'</b></div><div><small>'+esc(translate('Worth today'))+'</small><b>'+esc(M(worth))+'</b></div><div><small>'+esc(translate('At retirement'))+' '+(m?'('+esc(translate('age'))+' '+m.ret+')':'')+'</small><b>'+esc(m?M(m.atRet):'\u2014')+'</b></div><div><small>'+esc(translate('Goal'))+'</small><b>'+esc(M(goal))+'</b></div><div><small>'+esc(translate(ok?'Ahead by':'Short by'))+'</small><b>'+esc(m?M(Math.abs(m.atRet-m.goal)):'\u2014')+'</b></div><div><small>'+esc(translate('Goal reached in'))+'</small><b>'+esc(reached)+'</b></div><div title="'+esc(savingsTitle)+'"><small>'+esc(translate('Savings per year'))+(m&&m.sn?' ('+esc(translate('average'))+')':'')+'</small><b>'+esc(savings)+'</b></div></div></details></article>'}
window.gppDrawerHTML=function(){
  const L=list(),cards=L.map(clientCard).join('');
  if(!L.length)drawerOpen=true;
  return'<div class="gpp-overlay" id="gpp-drawer-overlay" data-gpp-overlay'+(drawerOpen?'':' hidden')+'><section class="gpp-drawer" id="gpp-drawer" role="dialog" aria-modal="true" aria-labelledby="gpp-drawer-title" tabindex="-1"><header class="gpp-drawer-header"><h2 id="gpp-drawer-title">'+esc(translate('Clients'))+'</h2><button type="button" class="gpp-close" data-gpp-close aria-label="'+esc(translate('Close'))+'">×</button></header>'+(L.length>5?'<label class="gpp-search"><span>'+esc(translate('Search clients'))+'</span><input type="search" data-gpp-search aria-label="'+esc(translate('Search clients'))+'"></label>':'')+'<div class="gpp-client-list" data-gpp-client-list>'+(L.length?cards:'<p class="gpp-empty">'+esc(translate('Add your first client'))+'</p>')+'</div><footer class="gpp-drawer-footer"><button type="button" class="gpp-add-client" data-gpp="add"><span aria-hidden="true">+</span>'+esc(translate('Add client'))+'</button></footer></section></div>'};

function nameDialog(mode,id){const P=ensure(),cur=mode==='ren'&&P.profiles[id]?P.profiles[id].name:'';dg.className='';
  dg.innerHTML='<h2>'+(mode==='ren'?translate('Rename'):translate('Add client'))+'</h2><form id="gpp-f" novalidate data-mode="'+mode+'" data-id="'+esc(id||'')+'"><p class="fh-note">'+(mode==='ren'?translate('Change the name shown in the client list.'):translate('Opens a new plan for this client with no holdings yet.'))+'</p><label for="gpp-n">'+translate('Name')+'</label><input id="gpp-n" maxlength="30" autocomplete="off" placeholder="e.g. Deepak" value="'+esc(cur)+'"><div class="fh-err" id="gpp-e" role="alert"></div><div class="tb"><button type="button" id="gpp-x">'+translate('Cancel')+'</button><button type="submit" class="p">'+(mode==='ren'?translate('Save'):translate('Create'))+'</button></div></form>';
  dg.showModal();const i=document.getElementById('gpp-n');if(i){i.focus();i.select()}}
let gppAddReturnFocus=null;
dg.addEventListener('close',()=>{
  if(!gppAddReturnFocus)return;
  const id=gppAddReturnFocus;gppAddReturnFocus=null;
  const trigger=document.getElementById(id);if(trigger)trigger.focus();
});
document.addEventListener('submit',e=>{const f=e.target&&e.target.id==='gpp-f'?e.target:null;if(!f)return;e.preventDefault();
  const name=document.getElementById('gpp-n').value,err=f.dataset.mode==='ren'?ren(f.dataset.id,name):add(name);
  if(err){document.getElementById('gpp-e').textContent=err;return}dg.close();toast(f.dataset.mode==='ren'?'Renamed':nm(name)+' added')});
document.addEventListener('keydown',e=>{
  const overlay=document.getElementById('gpp-drawer-overlay');if(!overlay||overlay.hidden)return;
  const dialog=document.getElementById('gpp-drawer');if(!dialog)return;
  if(e.key==='Escape'){e.preventDefault();closeDrawer(true);return}
  if(e.key!=='Tab')return;
  const focusable=Array.from(dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),summary')).filter(x=>!x.closest('details:not([open])'));
  if(!focusable.length){e.preventDefault();dialog.focus();return}
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
function closeDrawer(returnFocus,immediate){drawerOpen=false;const overlay=document.getElementById('gpp-drawer-overlay');if(overlay){const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;overlay.classList&&overlay.classList.toggle('gpp-closing',!immediate&&!reduced);if(immediate||reduced){overlay.hidden=true}else{clearTimeout(drawerCloseTimer);drawerCloseTimer=setTimeout(()=>{if(!drawerOpen){overlay.hidden=true;overlay.classList&&overlay.classList.remove('gpp-closing')}},180)}}const trigger=document.getElementById('gpp-sel');if(trigger){trigger.setAttribute('aria-expanded','false');if(returnFocus)trigger.focus()}}
function openDrawer(){clearTimeout(drawerCloseTimer);drawerOpen=true;const overlay=document.getElementById('gpp-drawer-overlay');if(overlay){overlay.classList&&overlay.classList.remove('gpp-closing');overlay.hidden=false}const trigger=document.getElementById('gpp-sel');if(trigger)trigger.setAttribute('aria-expanded','true');const target=document.querySelector('[data-gpp-search]')||document.querySelector('.gpp-close');if(target)target.focus()}
document.addEventListener('click',e=>{
  const trigger=e.target.closest&&e.target.closest('[data-gpp-drawer-trigger]');if(trigger){if(drawerOpen)closeDrawer(false);else openDrawer();return}
  if(e.target&&e.target.matches&&e.target.matches('[data-gpp-overlay]')){closeDrawer(true);return}
  if(e.target.closest&&e.target.closest('[data-gpp-close]')){closeDrawer(true);return}
  const card=e.target.closest&&e.target.closest('[data-gpp-card]');
  if(card&&!(e.target.closest('button,summary,details,input'))){const id=card.dataset.gppCard;drawerOpen=false;if(sw(id)){const t=document.getElementById('gpp-sel');if(t){t.setAttribute('aria-expanded','false');t.focus()}toast(translate('Switched to')+' '+ensure().profiles[id].name)}return}
  if(e.target&&e.target.id==='gpp-x'){dg.close();return}
  const b=e.target.closest&&e.target.closest('[data-gpp]');if(!b)return;
  const [act,id]=b.dataset.gpp.split(':'),P=ensure();if(!P)return;
  if(act==='add'){
    if(Object.keys(P.profiles).length>=MAXP){toast('Maximum 12 family members');return}
    gppAddReturnFocus='gpp-sel';drawerOpen=false;closeDrawer(false,true);nameDialog('add')
  }
  else if(act==='ren'){gppAddReturnFocus='gpp-sel';drawerOpen=false;closeDrawer(false,true);nameDialog('ren',id)}
  else if(act==='switch'){drawerOpen=false;if(sw(id)){const t=document.getElementById('gpp-sel');if(t){t.setAttribute('aria-expanded','false');t.focus()}toast(translate('Switched to')+' '+P.profiles[id].name)}}
  else if(act==='dup'){const n=dup(id);if(n)toast('Duplicated as '+n)}
  else if(act==='del'){if(Object.keys(P.profiles).length<2){toast('Keep at least one person');return}
    confirmBox('Delete \u201c'+P.profiles[id].name+'\u201d and their saved holdings? This cannot be undone.',()=>{const x=del(id);if(x)toast('Deleted '+x.snap.name,()=>restore(x))})}});
document.addEventListener('input',e=>{if(!e.target.matches||!e.target.matches('[data-gpp-search]'))return;const q=e.target.value.trim().toLowerCase();document.querySelectorAll('[data-gpp-card]').forEach(card=>{card.hidden=!card.dataset.gppCardName.includes(q)})});
if(UI.rv==null||UI.rv==='clients')UI.rv='year';
})();