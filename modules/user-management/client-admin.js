(function(){
var st={users:null,err:'',msg:'',loading:false,show:false,rid:null,busy:false,t:0};
function h(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function dt(s){if(!s)return '\u2014';var x=new Date(s);return isNaN(x)?'\u2014':x.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
function gen(){var a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789',n=10,b=new Uint32Array(n),o='';crypto.getRandomValues(b);for(var i=0;i<n;i++)o+=a[b[i]%a.length];return o}
function errMsg(e){var c=e&&e.status;if(c===404)return 'The user-management function is not deployed yet. See DEPLOY.md, step "Add client logins".';if(c===401)return 'Your sign-in was not accepted. Sign out and sign in again.';if(c===403)return (e.message||'Only advisers can manage users.');return (e&&e.message)||'Something went wrong. Check your connection and try again.'}
function val(id){var x=document.getElementById(id);return x?x.value:''}
function body(){
 var V=window.VR_ADV;
 if(!window.VRSB)return '<h2>Users</h2><p class="mu">Not configured: add your Supabase settings to config.js.</p>';
 if(V===false)return '<h2>Users</h2><p class="mu">Only advisers can manage users.</p>';
 if(V===null)return '<h2>Users</h2><p class="er" role="alert">Could not check adviser access. Run the latest supabase/schema.sql and mark your login as adviser (see DEPLOY.md), then reload.</p>';
 var head='<div class="hd2"><div><h2 style="margin:0">Client logins</h2><p class="mu" style="margin:2px 0 0">Create a sign-in for each client. Every client gets their own private workspace and cannot see yours or another client\u2019s.</p></div><div class="tb"><button type="button" data-um="refresh">Refresh</button><button type="button" class="p" data-um="add">+ Add client</button></div></div>';
 var form=st.show?'<div class="vr-umf"><label>Client email<input id="vr-um-em" type="email" autocomplete="off" placeholder="client@example.com"></label><label>Temporary password (8 to 10 characters)<input id="vr-um-pw" type="text" maxlength="10" autocomplete="off" spellcheck="false"></label><div class="tb"><button type="button" data-um="gen">Generate</button><button type="button" data-um="copy">Copy</button><button type="button" class="p" data-um="create">Create client</button><button type="button" data-um="cancel">Cancel</button></div><p class="mu" style="margin:0">Share the password with the client through a secure channel. Clients can change it themselves with the Password button; you can also reset it here.</p></div>':'';
 var note=(st.err?'<p class="er" role="alert">'+h(st.err)+'</p>':'')+(st.msg?'<p class="vr-ok" role="status">'+h(st.msg)+'</p>':'');
 if(V===undefined||(st.users===null&&!st.err))return head+form+note+'<p class="mu">Loading\u2026</p>';
 var rows=(st.users||[]).map(function(u){var ad=u.role==='adviser',act='';
  if(!ad){act=st.rid===u.id?'<span class="mu">Resetting password\u2026</span>':'<button type="button" data-um="reset" data-id="'+h(u.id)+'">Reset password</button><button type="button" class="d" data-um="del" data-id="'+h(u.id)+'" data-email="'+h(u.email)+'">Remove</button>'}
  return '<tr><td class="l"><b>'+h(u.email)+'</b></td><td class="l"><span class="pill'+(ad?' ad':'')+'">'+(ad?'Adviser':'Client')+'</span></td><td class="l">'+dt(u.created_at)+'</td><td class="l">'+dt(u.last_sign_in_at)+'</td><td class="a">'+act+'</td></tr>'+(!ad&&st.rid===u.id?'<tr class="vr-rr"><td colspan="5"><div class="vr-rs"><label>New password for <b>'+h(u.email)+'</b> (8 to 10 characters)<input id="vr-um-rp" type="text" maxlength="10" autocomplete="off" spellcheck="false" placeholder="New password (8 to 10 characters)"></label><div class="tb"><button type="button" data-um="gen2">Generate</button><button type="button" data-um="copy2">Copy</button><button type="button" class="p" data-um="rsave" data-id="'+h(u.id)+'">Save</button><button type="button" data-um="rcancel">Cancel</button></div></div></td></tr>':'')}).join('');
 var n=(st.users||[]).filter(function(u){return u.role!=='adviser'}).length;
 return head+form+note+'<div class="tw"><table class="vr-ut"><thead><tr><th class="l">Email</th><th class="l">Role</th><th class="l">Created</th><th class="l">Last sign-in</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="mu" style="margin:10px 0 0">'+n+' client login'+(n===1?'':'s')+'. Removing a login permanently deletes that client\u2019s saved data. Adviser logins are managed in the Supabase dashboard.</p>'}
function paint(){var el=document.getElementById('vr-um');if(!el)return;var keep={};['vr-um-em','vr-um-pw','vr-um-rp'].forEach(function(i){var x=document.getElementById(i);if(x)keep[i]=x.value});el.innerHTML=body();Object.keys(keep).forEach(function(i){var x=document.getElementById(i);if(x)x.value=keep[i]})}
async function refresh(){try{var j=await window.VRSB.users({action:'list'});st.users=j.users||[];st.err=''}catch(e){st.err=errMsg(e)}st.t=Date.now()}
async function load(){if(st.loading||!window.VRSB)return;st.loading=true;try{if(window.VR_ADV===undefined||window.VR_ADV===null)window.VR_ADV=await window.VRSB.isAdviser();if(window.VR_ADV)await refresh()}finally{st.loading=false}paint()}
async function run(fn){st.busy=true;st.err='';st.msg='';paint();try{await fn()}catch(e){st.err=errMsg(e)}st.busy=false;paint()}
document.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('[data-um]');if(!b||!document.getElementById('vr-um'))return;var a=b.dataset.um,id=b.dataset.id;if(st.busy)return;
 if(a==='add'){st.show=!st.show;st.msg='';st.err='';return paint()}
 if(a==='cancel'){st.show=false;return paint()}
 if(a==='refresh'){return run(refresh)}
 if(a==='gen'){var x=document.getElementById('vr-um-pw');if(x)x.value=gen();return}
 if(a==='gen2'){var y=document.getElementById('vr-um-rp');if(y)y.value=gen();return}
 if(a==='copy2'){var v2=val('vr-um-rp');if(v2&&navigator.clipboard)navigator.clipboard.writeText(v2).then(function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1500)},function(){});return}
 if(a==='copy'){var v=val('vr-um-pw');if(v&&navigator.clipboard)navigator.clipboard.writeText(v).then(function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1500)},function(){});return}
 if(a==='create'){var em=val('vr-um-em').trim().toLowerCase(),pw=val('vr-um-pw');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){st.err='Enter a valid email address.';return paint()}
  if(pw.length<8||pw.length>10){st.err='Password must be 8 to 10 characters.';return paint()}
  return run(async function(){await window.VRSB.users({action:'create',email:em,password:pw});st.show=false;st.msg='Created '+em+'. Share the password with them securely.';await refresh()})}
 if(a==='reset'){st.rid=id;st.msg='';st.err='';paint();var rp=document.getElementById('vr-um-rp');if(rp){try{rp.scrollIntoView({block:'nearest'});rp.focus()}catch(x){}}return}
 if(a==='rcancel'){st.rid=null;return paint()}
 if(a==='rsave'){var np=val('vr-um-rp');if(np.length<8||np.length>10){st.err='Password must be 8 to 10 characters.';return paint()}
  return run(async function(){await window.VRSB.users({action:'reset',id:id,password:np});st.rid=null;st.msg='Password updated. Share it with the client securely.'})}
 if(a==='del'){if(!confirm('Remove '+(b.dataset.email||'this client')+'? Their saved data is deleted permanently and this cannot be undone.'))return;
  return run(async function(){await window.VRSB.users({action:'delete',id:id});st.msg='Removed '+(b.dataset.email||'the login')+'.';await refresh()})}
});
window.usersTab=function(){
 if(window.VRSB&&!st.loading&&(st.users===null||Date.now()-st.t>5000))setTimeout(load,0);
 return '<div class="card"><div id="vr-um">'+body()+'</div></div>'};
})();