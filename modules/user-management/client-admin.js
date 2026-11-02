(function(){
var st={users:null,roles:[],allRoles:[],permissions:[],err:'',msg:'',loading:false,show:false,showRole:false,editingRole:'',resetId:'',busy:false,t:0};
function h(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function dt(s){if(!s)return '\u2014';var x=new Date(s);return isNaN(x)?'\u2014':x.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
function gen(){var a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789',n=16,b=new Uint32Array(n),o='';crypto.getRandomValues(b);for(var i=0;i<n;i++)o+=a[b[i]%a.length];return o}
function val(id){var x=document.getElementById(id);return x?x.value:''}
function access(){return window.VR_ACCESS&&!window.VR_ACCESS.error?window.VR_ACCESS:null}
function canManageRoles(){return !!(access()&&(access().permissions||[]).indexOf('manage_roles')>=0)}
function minPassword(roleId){var role=st.roles.find(function(r){return r.role_id===roleId});return role&&(role.permissions||[]).indexOf('manage_users')>=0?14:8}
function escapeKey(s){return String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40)}
function errMsg(e){var c=e&&e.status;if(c===404)return 'The user-management function is not deployed yet. Follow the RBAC setup steps in DEPLOY.md.';if(c===401)return 'Your sign-in was not accepted. Sign out and sign in again.';if(c===403)return e.message||'You are not allowed to perform this action.';return(e&&e.message)||'Something went wrong. Check your connection and try again.'}
function options(roles,selected){return roles.map(function(r){return'<option value="'+h(r.role_id)+'"'+(selected===r.role_id?' selected':'')+'>'+h(r.name)+'</option>'}).join('')}
function body(){
 if(!window.VRSB)return '<h2>Users and roles</h2><p class="mu">Not configured: add your Supabase settings to config.js.</p>';
 var a=access();
 if(window.VR_ACCESS&&window.VR_ACCESS.error)return '<h2>Users and roles</h2><p class="er" role="alert">'+h(window.VR_ACCESS.error)+'</p>';
 if(!a||!a.permissions.includes('manage_users'))return '<h2>Users and roles</h2><p class="mu">Your assigned user type does not allow user administration.</p>';
 var roleForm='';
 if(st.show){
  var defaultRole=st.roles.find(function(r){return r.role_id==='client'})||st.roles[0],createMin=minPassword(defaultRole&&defaultRole.role_id);
  roleForm='<div class="vr-umf"><h3>Create login</h3><label>Email<input id="vr-um-em" type="email" autocomplete="off" placeholder="person@example.com"></label><label>Temporary password<input id="vr-um-pw" type="text" minlength="'+createMin+'" maxlength="72" autocomplete="off" spellcheck="false"><small id="vr-pw-hint">Use '+createMin+' to 72 characters for this user type.</small></label><label>User type<select id="vr-um-role">'+options(st.roles,defaultRole&&defaultRole.role_id)+'</select></label><div class="tb"><button type="button" data-um="gen">Generate password</button><button type="button" data-um="copy">Copy</button><button type="button" class="p" data-um="create">Create login</button><button type="button" data-um="cancel">Cancel</button></div><p class="mu">Share the temporary password securely. Users can change it with the Password button.</p></div>';
 }
 if(st.showRole&&canManageRoles()){
  var editing=st.allRoles.find(function(r){return r.role_id===st.editingRole});
  var permChecks=st.permissions.map(function(p){return'<label class="vr-perm"><input type="checkbox" data-um-permission="'+h(p.permission_key)+'"'+(editing&&editing.permissions.indexOf(p.permission_key)>=0?' checked':'')+'><span><b>'+h(p.permission_key.replace(/_/g,' '))+'</b><small>'+h(p.description)+'</small></span></label>'}).join('');
  roleForm+='<div class="vr-umf"><h3>'+(editing?'Edit user type':'Create user type')+'</h3><label>Name<input id="vr-role-name" maxlength="60" value="'+h(editing?editing.name:'')+'" placeholder="e.g. Operations Viewer"></label><label>Identifier<input id="vr-role-id" maxlength="40" value="'+h(editing?editing.role_id:'')+'" placeholder="e.g. operations_viewer"'+(editing?' readonly':'')+'></label><label>Description<input id="vr-role-description" maxlength="240" value="'+h(editing?editing.description:'')+'"></label><fieldset class="vr-perms"><legend>Permissions</legend>'+permChecks+'</fieldset><div class="tb"><button type="button" class="p" data-um="'+(editing?'role-update':'role-create')+'">Save user type</button><button type="button" data-um="role-cancel">Cancel</button></div></div>';
 }
 var note=(st.err?'<p class="er" role="alert">'+h(st.err)+'</p>':'')+(st.msg?'<p class="vr-ok" role="status">'+h(st.msg)+'</p>':'');
 var head='<div class="hd2"><div><h2 style="margin:0">Users and roles</h2><p class="mu" style="margin:2px 0 0">Assign each account a user type. Role permissions are enforced by Supabase policies and the administration function.</p></div><div class="tb"><button type="button" data-um="refresh">Refresh</button><button type="button" class="p" data-um="add">+ Add user</button>'+(canManageRoles()?'<button type="button" data-um="role-new">Manage user types</button>':'')+'</div></div>';
 if(st.loading&&st.users===null)return head+roleForm+note+'<p class="mu">Loading\u2026</p>';
 var rows=(st.users||[]).map(function(u){
  var targetRole=st.roles.find(function(r){return r.role_id===u.role_id}),editable=u.manageable!==false;
  var current=targetRole?'<select data-role-user="'+h(u.id)+'">'+options(st.roles,u.role_id)+'</select>':'<span class="pill">'+h(u.role_name)+'</span>';
  var assignment=editable&&targetRole?'<button type="button" data-um="assign" data-id="'+h(u.id)+'">Save role</button>':'';
  var actions=editable&&u.id!==st.selfId?'<button type="button" data-um="reset" data-id="'+h(u.id)+'">Reset password</button><button type="button" class="d" data-um="del" data-id="'+h(u.id)+'" data-email="'+h(u.email)+'">Remove</button>':'';
  var row='<tr><td class="l"><b>'+h(u.email)+'</b>'+(u.id===st.selfId?' <span class="mu">(you)</span>':'')+'</td><td class="l">'+current+'</td><td class="l">'+dt(u.created_at)+'</td><td class="l">'+dt(u.last_sign_in_at)+'</td><td class="a">'+assignment+actions+'</td></tr>';
  if(st.resetId===u.id){var resetMin=minPassword(u.role_id);row+='<tr><td colspan="5"><div class="vr-rs"><label>New password for <b>'+h(u.email)+'</b><input id="vr-um-rp" type="password" minlength="'+resetMin+'" maxlength="72" autocomplete="new-password"><small>Use '+resetMin+' to 72 characters.</small></label><div class="tb"><button type="button" data-um="gen2">Generate</button><button type="button" data-um="copy2">Copy</button><button type="button" class="p" data-um="rsave" data-id="'+h(u.id)+'">Save password</button><button type="button" data-um="rcancel">Cancel</button></div></div></td></tr>'}
  return row
 }).join('');
 var roleRows=canManageRoles()?'<section class="vr-role-list"><h3>User types</h3><ul>'+st.allRoles.map(function(r){return'<li><span><b>'+h(r.name)+'</b>'+(r.is_system?' <span class="pill">Built-in</span>':'')+'<small>'+h(r.description)+'</small><small>'+h(r.permissions.join(', ')||'No permissions')+'</small></span>'+(r.is_system?'<span class="mu">Default type</span>':'<span class="tb"><button type="button" data-um="role-edit" data-role="'+h(r.role_id)+'">Edit</button><button type="button" class="d" data-um="role-delete" data-role="'+h(r.role_id)+'">Delete</button></span>')+'</li>'}).join('')+'</ul></section>':'';
 return head+roleForm+note+'<div class="tw"><table class="vr-ut"><thead><tr><th class="l">Email</th><th class="l">User type</th><th class="l">Created</th><th class="l">Last sign-in</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+roleRows+'<p class="mu" style="margin:10px 0 0">Removing a login permanently deletes that user\u2019s saved data.</p>'
}
function paint(){var el=document.getElementById('vr-um');if(!el)return;var keep={};['vr-um-em','vr-um-pw','vr-um-rp','vr-role-name','vr-role-id','vr-role-description'].forEach(function(id){var input=document.getElementById(id);if(input)keep[id]=input.value});el.innerHTML=body();Object.keys(keep).forEach(function(id){var input=document.getElementById(id);if(input)input.value=keep[id]})}
async function refresh(){var j=await window.VRSB.users({action:'list'});st.users=j.users||[];st.roles=j.roles||[];st.allRoles=j.all_roles||[];st.permissions=j.permissions||[];st.selfId=window.VR_ACCESS&&window.VR_ACCESS.user_id||'';st.err='';st.t=Date.now()}
async function load(){if(st.loading||!window.VRSB)return;st.loading=true;try{await refresh()}catch(e){st.err=errMsg(e)}finally{st.loading=false}paint()}
async function run(fn){st.busy=true;st.err='';st.msg='';paint();try{await fn()}catch(e){st.err=errMsg(e)}finally{st.busy=false;paint()}}
function selectedPermissions(){return Array.prototype.slice.call(document.querySelectorAll('[data-um-permission]:checked')).map(function(x){return x.getAttribute('data-um-permission')})}
document.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('[data-um]');if(!b||!document.getElementById('vr-um'))return;var action=b.dataset.um,id=b.dataset.id,roleId=b.dataset.role;if(st.busy)return;
 if(action==='add'){st.show=!st.show;st.showRole=false;st.err='';return paint()}
 if(action==='cancel'){st.show=false;return paint()}
 if(action==='refresh')return run(refresh);
 if(action==='gen'){var p=document.getElementById('vr-um-pw');if(p)p.value=gen();return}
 if(action==='gen2'){var p2=document.getElementById('vr-um-rp');if(p2)p2.value=gen();return}
 if(action==='copy'||action==='copy2'){var value=val(action==='copy'?'vr-um-pw':'vr-um-rp');if(value&&navigator.clipboard)navigator.clipboard.writeText(value).then(function(){b.textContent='Copied';setTimeout(function(){b.textContent=action==='copy'?'Copy':'Copy';},1500)},function(e){st.err='Could not copy the password. Copy it manually.';paint()});return}
 if(action==='create'){var email=val('vr-um-em').trim().toLowerCase(),password=val('vr-um-pw'),selectedRole=val('vr-um-role'),createMin=minPassword(selectedRole);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){st.err='Enter a valid email address.';return paint()}if(password.length<createMin||password.length>72){st.err='Password must be '+createMin+' to 72 characters for this user type.';return paint()}return run(async function(){await window.VRSB.users({action:'create',email:email,password:password,role_id:selectedRole});st.show=false;st.msg='Created '+email+'. Share the password securely.';await refresh()})}
 if(action==='reset'){st.resetId=id;st.err='';paint();var field=document.getElementById('vr-um-rp');if(field)field.focus();return}
 if(action==='rcancel'){st.resetId='';return paint()}
 if(action==='rsave'){var next=val('vr-um-rp'),target=st.users.find(function(u){return u.id===id}),resetMin=minPassword(target&&target.role_id);if(next.length<resetMin||next.length>72){st.err='Password must be '+resetMin+' to 72 characters for this user type.';return paint()}return run(async function(){await window.VRSB.users({action:'reset',id:id,password:next});st.resetId='';st.msg='Password updated. Share it securely.'})}
 if(action==='assign'){var sel=document.querySelector('[data-role-user="'+id+'"]');if(!sel)return;return run(async function(){await window.VRSB.users({action:'assign',id:id,role_id:sel.value});st.msg='User type updated.';await refresh()})}
 if(action==='del'){if(!confirm('Remove '+(b.dataset.email||'this user')+'? Their saved data is deleted permanently and this cannot be undone.'))return;return run(async function(){await window.VRSB.users({action:'delete',id:id});st.msg='User removed.';await refresh()})}
 if(action==='role-new'){st.showRole=true;st.show=false;st.editingRole='';return paint()}
 if(action==='role-cancel'){st.showRole=false;st.editingRole='';return paint()}
 if(action==='role-edit'){st.showRole=true;st.show=false;st.editingRole=roleId;return paint()}
 if(action==='role-create'||action==='role-update'){var name=val('vr-role-name').trim(),description=val('vr-role-description').trim(),newRoleId=action==='role-update'?st.editingRole:escapeKey(val('vr-role-id')),permissions=selectedPermissions();if(!name){st.err='Enter a user type name.';return paint()}if(!newRoleId){st.err='Enter a valid user type identifier.';return paint()}return run(async function(){await window.VRSB.users({action:action==='role-create'?'create_role':'update_role',role_id:newRoleId,name:name,description:description,permissions:permissions});st.showRole=false;st.editingRole='';st.msg='User type saved.';await refresh()})}
 if(action==='role-delete'){if(!confirm('Delete this custom user type? It must not be assigned to any users.'))return;return run(async function(){await window.VRSB.users({action:'delete_role',role_id:roleId});st.msg='User type deleted.';await refresh()})}
});
document.addEventListener('change',function(ev){if(!ev.target||ev.target.id!=='vr-um-role')return;var min=minPassword(ev.target.value),input=document.getElementById('vr-um-pw'),hint=document.getElementById('vr-pw-hint');if(input)input.minLength=min;if(hint)hint.textContent='Use '+min+' to 72 characters for this user type.'});
window.usersTab=function(){if(window.VRSB&&!st.loading&&(st.users===null||Date.now()-st.t>5000))setTimeout(load,0);return'<div class="card"><div id="vr-um">'+body()+'</div></div>'};
})();
