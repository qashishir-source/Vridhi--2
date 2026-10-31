(function(){
/* Goal Planner clients (build 84): S.gpp = { active, profiles: { id: { name, d: {members,start,end,ret,retP,hor,goal,link,grat,assets}, created } } }.
   The top-level fields of S stay the ACTIVE person's (a mirror), so every Goal Planner view and calculation is unchanged;
   save() copies them into the active profile and switching copies a profile back into S. */
const MAXP=12,KEYS=GPP_KEYS;
const slug=n=>String(n).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24)||'client';
const nm=n=>String(n==null?'':n).replace(/\s+/g,' ').trim().slice(0,30);
const snap=s=>{const o={};for(const k of KEYS)o[k]=JSON.parse(JSON.stringify(s[k]));return o};
const defName=()=>{try{const m=S.members&&S.members[0],n=m&&nm(m.name);if(n&&n.toLowerCase()!=='self')return n}catch(e){}return'My portfolio'};
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

window.gppBarHTML=function(top){const id=top?'gpp-sel':'gpp-sel-m';
  return'<label class="fhp-l" for="'+id+'">Client</label><select id="'+id+'" class="gpp-sel" aria-label="Switch client">'+list().map(p=>'<option value="'+esc(p.id)+'"'+(p.active?' selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select><button type="button" class="fhp-add" data-gpp="add">+ Add Person</button>'};
window.gppHeroInner=function(){const P=ensure();if(!P)return'';const p=P.profiles[P.active],m=S.members&&S.members[0],M0=typeof cr==='function'?cr:null,nm=String(p.name||'').trim();if(!nm)return'';
  const bits=[];if(m&&Number.isFinite(+m.age))bits.push('Age '+(+m.age));if(Number.isFinite(+S.ret))bits.push('retiring at '+(+S.ret));if(Number.isFinite(+S.goal)&&M0)bits.push('goal '+String(M0(+S.goal)).replace('\u20b9 ','\u20b9'));
  const ini=nm.split(/\s+/).filter(Boolean).slice(0,2).map(w=>Array.from(w)[0].toUpperCase()).join('');
  return'<div class="dz-who"><span class="fhp-av sm" aria-hidden="true">'+esc(ini)+'</span><div class="fhp-ht"><span class="fhp-eb">Goal plan prepared for</span><div class="dz-nr"><h2 class="fhp-nm sm">'+esc(nm)+'</h2>'+(bits.length?'<span class="fhp-sub">'+bits.join(' \u00b7 ')+'</span>':'')+'</div></div></div>'};
window.gppMBar=function(){return typeof S!=='undefined'&&ensure()?'<div class="fhp fhp-m">'+window.gppBarHTML(false)+'</div>':''};
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
window.gppClients=function(){
  const P=ensure(),M0=typeof cr==='function'?cr:(x=>'\u20b9'+Math.round(x).toLocaleString('en-IN')),M=x=>String(M0(x)).replace('\u20b9 ','\u20b9'),L=list(),only=L.length<2;
  const cards=L.map(p=>{
    const m=metrics(p),hold=p.d.assets.length;
    let chip='<span class="fhp-chip">No holdings</span>',body='<p class="fhp-nil">No holdings yet. Switch to the plan and add the first holding.</p>';
    if(m){const ok=m.atRet>=m.goal;chip='<span class="fhp-chip '+(ok?'fhp-ok':'fhp-bad')+'">'+(ok?'On track':'Behind goal')+'</span>';
      const st=(l,v,c)=>'<div><small>'+l+'</small><b class="'+(c||'')+'">'+v+'</b></div>';
      body='<div class="fhp-g">'+st('Holdings',hold+' \u00b7 '+p.d.members.length+' member'+(p.d.members.length===1?'':'s'))+st('Worth today',M(m.today))+st('At retirement (age '+m.ret+')',M(m.atRet))+st('Goal',M(m.goal))+st(m.atRet>=m.goal?'Ahead by':'Short by',M(Math.abs(m.atRet-m.goal)),m.atRet>=m.goal?'fhp-pos':'fhp-neg')+st('Goal reached in',m.tm==null?'Not within plan':(Math.floor(m.tm/12)?Math.floor(m.tm/12)+' yr ':'')+(m.tm%12)+' m')+'<div class="fhp-sv" title="'+(m.fy?'Average of the '+m.sn+' saving years ('+m.fy+'). First year '+M(m.s1)+'. Year-by-year list: Reports > Annual Savings Schedule.':'')+'"><small>Savings per year'+(m.sn?' (average of '+m.sn+' saving year'+(m.sn===1?'':'s')+')':'')+'</small><b>'+(m.sav>0?M(m.sav):'\u2014')+'</b></div></div>'}
    return'<article class="fhp-card'+(p.active?' fhp-cur':'')+'" aria-label="'+esc(p.name)+'"><header><h3>'+esc(p.name)+'</h3>'+(p.active?'<span class="fhp-chip fhp-act">Active</span>':'')+chip+'</header>'+body+'<div class="fhp-acts"><button type="button" class="p" data-gpp="switch:'+esc(p.id)+'">Switch to Plan</button><button type="button" data-gpp="dup:'+esc(p.id)+'">Duplicate</button><button type="button" data-gpp="ren:'+esc(p.id)+'">Rename</button><button type="button" class="d" data-gpp="del:'+esc(p.id)+'"'+(only?' disabled title="Keep at least one person"':'')+'>Delete</button></div></article>'}).join('');
  return'<div class="rph"><div><h1>Client Portfolios</h1><div class="rpf">Every saved Goal Planner portfolio. Switch to a plan to see its holdings, summary and reports.</div></div><div class="rpr">'+window.rvTog()+'</div></div><div class="fhp-grid">'+cards+'<button type="button" class="fhp-new" data-gpp="add"><span aria-hidden="true">+</span>Add Person<small>Starts an empty Goal Planner portfolio</small></button></div>'};

function nameDialog(mode,id){const P=ensure(),cur=mode==='ren'&&P.profiles[id]?P.profiles[id].name:'';dg.className='';
  dg.innerHTML='<h2>'+(mode==='ren'?'Rename person':'Add person')+'</h2><form id="gpp-f" novalidate data-mode="'+mode+'" data-id="'+esc(id||'')+'"><p class="fh-note">'+(mode==='ren'?'Change the name shown in the client list.':'Opens the Start Your Goal Plan page for this person, with no holdings yet.')+'</p><label for="gpp-n">Name</label><input id="gpp-n" maxlength="30" autocomplete="off" placeholder="e.g. Deepak" value="'+esc(cur)+'"><div class="fh-err" id="gpp-e" role="alert"></div><div class="tb"><button type="button" id="gpp-x">Cancel</button><button type="submit" class="p">'+(mode==='ren'?'Save':'Create')+'</button></div></form>';
  dg.showModal();const i=document.getElementById('gpp-n');if(i){i.focus();i.select()}}
document.addEventListener('submit',e=>{const f=e.target&&e.target.id==='gpp-f'?e.target:null;if(!f)return;e.preventDefault();
  const name=document.getElementById('gpp-n').value,err=f.dataset.mode==='ren'?ren(f.dataset.id,name):add(name);
  if(err){document.getElementById('gpp-e').textContent=err;return}dg.close();toast(f.dataset.mode==='ren'?'Renamed':'Added '+nm(name))});
document.addEventListener('change',e=>{if(e.target&&e.target.classList&&e.target.classList.contains('gpp-sel'))sw(e.target.value)});
document.addEventListener('click',e=>{
  if(e.target&&e.target.id==='gpp-x'){dg.close();return}
  const b=e.target.closest&&e.target.closest('[data-gpp]');if(!b)return;
  const [act,id]=b.dataset.gpp.split(':'),P=ensure();if(!P)return;
  if(act==='add')nameDialog('add');
  else if(act==='ren')nameDialog('ren',id);
  else if(act==='switch'){sw(id,'Dashboard');window.scrollTo(0,0)}
  else if(act==='dup'){const n=dup(id);if(n)toast('Duplicated as '+n)}
  else if(act==='del'){if(Object.keys(P.profiles).length<2){toast('Keep at least one person');return}
    confirmBox('Delete \u201c'+P.profiles[id].name+'\u201d and their saved holdings? This cannot be undone.',()=>{const x=del(id);if(x)toast('Deleted '+x.snap.name,()=>restore(x))})}});
if(UI.rv==null)UI.rv='clients';
})();