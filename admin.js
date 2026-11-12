/* A&N admin back office (prototype). Reads and writes the same browser database as the customer site. */
(function(){
const {load,save,notify,estimate,peso,fmt,esc,STAGES,COLORS}=AN;
const $=s=>document.querySelector(s);
const PANELS=['overview','projects','inquiries','prices','users','reports','database'];
const QL={none:['Not yet prepared','tag-grey'],pending:['Awaiting your approval',''],approved:['Approved, awaiting customer','tag-blue'],accepted:['Accepted by customer','tag-green'],declined:['Declined by customer','tag-grey']};
let dbTable='USER_ACCOUNT';

/* ---------- helpers ---------- */
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
const clean=s=>String(s).replace(/&amp;/g,'&');
const nameOf=(d,e)=>{const u=d.users.find(x=>x.email===e);return u?u.name:(e||'Guest')};
const sizeTxt=p=>p.size?`${p.size.w.toFixed(2)} m × ${p.size.h.toFixed(2)} m`:'Not measured yet';
const total=p=>p.size?estimate(p.design,p.size).total:null;
const payTag=v=>v==='verified'?'<span class="tag tag-green">Verified</span>':'<span class="tag tag-grey">Pending</span>';
const stagesHTML=p=>STAGES.map((s,i)=>{const done=i<p.stage||p.stage===4,cur=i===p.stage&&p.stage<4;return `<div class="stage ${done?'done':cur?'current':''}"><div class="dot">${done?'✓':i+1}</div><b>${s[0]}</b><small>${s[1]}</small></div>`}).join('');
const top=(t,s)=>`<div class="portal-top"><div><h2>${t}</h2><p class="muted">${s}</p></div><div class="portal-user"><span class="tag tag-blue">Admin</span><span class="avatar-sm">AD</span></div></div>`;
const stat=(i,n,l)=>`<div class="card stat"><div class="icon">${i}</div><div><div class="num">${n}</div><span class="muted">${l}</span></div></div>`;
const wrap=h=>`<div class="table-wrap">${h}</div>`;
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

/* ---------- the centralized database, shown as the tables in the ERD ---------- */
function tables(d){
 const T={};
 T.USER_ACCOUNT=d.users.map(u=>({email:u.email,name:u.name,phone:u.phone||'',role:u.role,password:'••••••'}));
 T.INQUIRY=d.inquiries.map(i=>({id:i.id,date:i.date,name:i.name,email:i.email,phone:i.phone||'',gate_type:i.type,pattern:i.pattern,message:i.message||'',linked_account:i.owner||'(none)'}));
 T.PROJECT=d.projects.map(p=>({id:p.id,owner:p.owner,stage:STAGES[p.stage][0],gate_type:p.design.type,material:p.design.material,color:COLORS[p.design.color][0],pattern:p.design.pattern,width_m:p.size?p.size.w:'',height_m:p.size?p.size.h:''}));
 T.QUOTATION=d.projects.filter(p=>p.size).map(p=>({project_id:p.id,owner:p.owner,status:QL[p.quote][0],estimated_material_cost:total(p)}));
 T.QUOTATION_ITEM=[];d.projects.filter(p=>p.size).forEach(p=>estimate(p.design,p.size).rows.forEach(r=>T.QUOTATION_ITEM.push({project_id:p.id,material:clean(r[0]),qty:r[1],unit_price:r[2],subtotal:r[3]})));
 const pr=d.prices;
 T.MATERIAL=[{material:'Tubular steel (per length)',unit_price:pr.steel},{material:'Steel-with-panels multiplier',unit_price:pr.panel},{material:'Paint (per liter)',unit_price:pr.paint},{material:'Welding consumables (per lot)',unit_price:pr.weld},{material:'Hardware, swing (per lot)',unit_price:pr.hw.Swing},{material:'Hardware, sliding (per lot)',unit_price:pr.hw.Sliding},{material:'Hardware, folding (per lot)',unit_price:pr.hw.Folding}];
 T.PAYMENT=[];d.projects.forEach(p=>[['Downpayment',p.pay.down],['Final payment',p.pay.final]].forEach(x=>T.PAYMENT.push({project_id:p.id,owner:p.owner,type:x[0],status:x[1]==='verified'?'Verified by staff':'Pending'})));
 T.PROJECT_STATUS_LOG=d.log.map(l=>({date:l.date,owner:l.owner,new_stage:l.stage}));
 T.EMAIL_NOTIFICATION=d.notes.map(n=>({date:n.date,sent_to:n.owner,subject:n.title,body:n.body,read:n.read}));
 return T}

/* ---------- panels ---------- */
function overview(){const d=load(),cust=d.users.filter(u=>u.role==='customer').length,open=d.projects.filter(p=>p.stage<4).length,
 pend=d.projects.filter(p=>p.quote==='pending'&&p.size),ver=d.projects.reduce((n,p)=>n+(p.pay.down==='verified')+(p.pay.final==='verified'),0),
 val=d.projects.filter(p=>['approved','accepted'].includes(p.quote)&&p.size).reduce((n,p)=>n+total(p),0);
 return top('Overview','Business activity at a glance.')+`<div class="stack"><div class="grid g3">
 ${stat('👤',cust,'Customer accounts')}${stat('✉',d.inquiries.length,'Inquiries received')}${stat('⌗',open,'Active projects')}
 ${stat('₱',pend.length,'Quotes awaiting approval')}${stat('✓',ver,'Payments verified')}${stat('Σ',peso(val),'Approved estimate value')}</div>
 <div class="card"><h3 style="margin-bottom:12px">Needs your attention</h3>${pend.length?'<table class="table">'+pend.map(p=>`<tr><td><b>${esc(nameOf(d,p.owner))}</b><br><span class="muted">${p.design.type} gate · ${sizeTxt(p)}</span></td><td class="r">${peso(total(p))}</td><td class="r"><a class="btn btn-sm btn-primary" href="#projects">Review</a></td></tr>`).join('')+'</table>':'<p class="muted">No quotations are waiting for approval.</p>'}</div>
 <div class="card"><h3 style="margin-bottom:12px">Latest stage updates</h3>${d.log.length?'<table class="table">'+d.log.slice(-5).reverse().map(l=>`<tr><td><b>${esc(nameOf(d,l.owner))}</b></td><td>Moved to ${esc(l.stage)}</td><td class="r muted">${fmt(l.date)}</td></tr>`).join('')+'</table>':'<p class="muted">No stage updates recorded yet.</p>'}</div></div>`}

function projCard(d,p){const t=total(p),q=QL[p.quote],sz=p.size||{w:3.6,h:2.1};
 return `<div class="card adm-proj"><div class="adm-head"><div><h3>${esc(nameOf(d,p.owner))}</h3><span class="muted">${esc(p.owner)} · Project #${String(p.id).slice(-5)}</span></div><span class="tag ${q[1]}">${q[0]}</span></div>
 <div class="stages adm-stages">${stagesHTML(p)}</div>
 <div class="grid g3" style="margin-top:18px">
  <div><h4 style="margin-bottom:8px">Gate</h4><dl class="kv"><dt>Type</dt><dd>${p.design.type}</dd><dt>Material</dt><dd>${p.design.material}</dd><dt>Color</dt><dd>${COLORS[p.design.color][0]}</dd><dt>Pattern</dt><dd>${p.design.pattern}</dd><dt>Size</dt><dd>${sizeTxt(p)}</dd></dl></div>
  <div><h4 style="margin-bottom:8px">Payments</h4><dl class="kv"><dt>Downpayment</dt><dd>${payTag(p.pay.down)}</dd><dt>Final balance</dt><dd>${payTag(p.pay.final)}</dd></dl></div>
  <div><h4 style="margin-bottom:8px">Estimate</h4>${p.size?`<div class="num" style="font-size:22px;font-weight:800">${peso(t)}</div><span class="muted" style="font-size:12.5px">Material cost from current price list</span>`:'<span class="muted">Needs site measurement</span>'}</div></div>
 <div class="adm-actions"><input id="w${p.id}" type="number" step=".01" min=".5" value="${sz.w}" aria-label="Width m"><input id="h${p.id}" type="number" step=".01" min=".5" value="${sz.h}" aria-label="Height m">
  <button class="btn btn-sm btn-outline" data-act="size" data-id="${p.id}">Encode size</button>
  <button class="btn btn-sm btn-outline" data-act="approve" data-id="${p.id}">Approve quote</button>
  <button class="btn btn-sm btn-outline" data-act="down" data-id="${p.id}">Verify downpayment</button>
  <button class="btn btn-sm btn-outline" data-act="final" data-id="${p.id}">Verify final</button><span class="sp"></span>
  <button class="btn btn-sm btn-primary" data-act="next" data-id="${p.id}">Advance stage →</button></div></div>`}
function projects(){const d=load(),l=[...d.projects].reverse();
 return top('Projects & Quotations','Encode measurements, approve estimates, verify payments and update stages.')+(l.length?l.map(p=>projCard(d,p)).join(''):'<div class="card center" style="padding:40px"><h3>No projects yet</h3><p class="muted">Projects appear when a customer submits an inquiry.</p></div>')}

function inquiries(){const d=load(),l=[...d.inquiries].reverse();
 return top('Inquiries','Every request received from the Contact page.')+`<div class="card">${l.length?wrap('<table class="table"><tr><th>Date</th><th>Name</th><th>Email</th><th>Phone</th><th>Gate</th><th>Pattern</th><th>Message</th><th>Account</th></tr>'+l.map(i=>`<tr><td>${fmt(i.date)}</td><td>${esc(i.name)}</td><td>${esc(i.email)}</td><td>${esc(i.phone)||'—'}</td><td>${esc(i.type)}</td><td>${esc(i.pattern)}</td><td style="white-space:normal;min-width:200px">${esc(i.message)||'—'}</td><td>${i.owner?'<span class="tag tag-green">Registered</span>':'<span class="tag tag-grey">No account yet</span>'}</td></tr>`).join('')+'</table>'):'<p class="muted">No inquiries yet.</p>'}</div>`}

function prices(){const p=load().prices,f=(id,l,v,st)=>`<label for="${id}">${l}</label><input id="${id}" type="number" min="0" step="${st||1}" value="${v}">`;
 return top('Material Prices','The price list used by every cost estimate.')+`<div class="card form-card"><div class="adm-price">
 ${f('pr-steel','Tubular steel, per 6 m length (₱)',p.steel)}${f('pr-panel','Steel-with-panels multiplier (×)',p.panel,.01)}${f('pr-paint','Paint, per liter (₱)',p.paint)}${f('pr-weld','Welding consumables, per lot (₱)',p.weld)}
 ${f('pr-hs','Hardware, swing gate (₱)',p.hw.Swing)}${f('pr-hl','Hardware, sliding gate (₱)',p.hw.Sliding)}${f('pr-hf','Hardware, folding gate (₱)',p.hw.Folding)}</div>
 <p class="note" style="margin:16px 0">Saving updates the estimate shown on the Services page and in all quotations. Quotations that were already approved are re-priced too.</p>
 <button class="btn btn-sm btn-primary" data-act="prices">Save prices</button> <button class="btn btn-sm btn-outline" data-act="prices-default">Restore defaults</button></div>`}

function users(){const d=load();
 return top('User Accounts','Everyone who can log in to the system.')+`<div class="card">${wrap('<table class="table"><tr><th>Name</th><th>Email / username</th><th>Phone</th><th>Role</th><th class="r">Actions</th></tr>'+d.users.map(u=>`<tr><td><b>${esc(u.name)}</b></td><td>${esc(u.email)}</td><td>${esc(u.phone)||'—'}</td><td><span class="tag ${u.role==='admin'?'tag-blue':'tag-grey'}">${u.role}</span></td><td class="r"><button class="btn btn-sm btn-outline" data-act="pw" data-e="${esc(u.email)}">Reset password</button>${u.role==='admin'?'':` <button class="btn btn-sm btn-danger" data-act="rm" data-e="${esc(u.email)}">Remove</button>`}</td></tr>`).join('')+'</table>')}<p class="note" style="margin-top:12px">Removing a customer deletes the login only. Their inquiries and projects stay in the database.</p></div>`}

function reports(){const d=load(),l=[...d.projects].reverse();
 const prj=l.length?wrap('<table class="table"><tr><th>Customer</th><th>Gate</th><th>Stage</th><th>Quotation</th><th class="r">Est. material cost</th></tr>'+l.map(p=>`<tr><td>${esc(nameOf(d,p.owner))}</td><td>${p.design.type} · ${p.design.pattern}</td><td>${STAGES[p.stage][0]}</td><td>${QL[p.quote][0]}</td><td class="r">${p.size?peso(total(p)):'—'}</td></tr>`).join('')+'</table>'):'<p class="muted">No projects yet.</p>';
 const trn=l.length?wrap('<table class="table"><tr><th>Customer</th><th>Downpayment</th><th>Final payment</th></tr>'+l.map(p=>`<tr><td>${esc(nameOf(d,p.owner))}</td><td>${payTag(p.pay.down)}</td><td>${payTag(p.pay.final)}</td></tr>`).join('')+'</table>'):'<p class="muted">No transactions yet.</p>';
 return top('Reports','Project and transaction summaries.')+`<div class="stack"><div class="card"><div class="tool-bar"><h3>Project report</h3><button class="btn btn-sm btn-outline" data-act="csv">Export CSV</button></div>${prj}</div><div class="card"><h3 style="margin-bottom:10px">Transaction report</h3>${trn}<p class="note" style="margin-top:10px">Payments are made offline (cash or bank transfer) and verified by staff.</p></div></div>`}

function database(){const d=load(),T=tables(d),names=Object.keys(T),rows=T[dbTable]||[],cols=rows.length?Object.keys(rows[0]):[];
 return top('Database','Centralized database (prototype). Tables follow the entity relationship diagram.')+`<div class="stack"><div class="card"><div class="dbtabs">${names.map(n=>`<span class="chip ${n===dbTable?'on':''}" data-act="tbl" data-t="${n}">${n}<i>${T[n].length}</i></span>`).join('')}</div>
 ${rows.length?wrap('<table class="table"><tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr>'+rows.map(r=>'<tr>'+cols.map(c=>`<td>${esc(r[c])}</td>`).join('')+'</tr>').join('')+'</table>'):'<p class="muted">This table is empty.</p>'}</div>
 <div class="card"><h3 style="margin-bottom:6px">Backup and restore</h3><p class="muted" style="font-size:13.5px;margin-bottom:14px">All records live in one database object stored in this browser. Export it as a backup, restore a backup, or reset to the sample data.</p>
 <button class="btn btn-sm btn-outline" data-act="export">Export database (JSON)</button> <label class="btn btn-sm btn-outline" for="imp">Import database</label><input id="imp" type="file" accept=".json,application/json" hidden> <button class="btn btn-sm btn-danger" data-act="reset">Reset to sample data</button></div></div>`}

/* ---------- actions ---------- */
function upd(id,fn){const d=load(),p=d.projects.find(x=>String(x.id)===String(id));if(!p)return;const err=fn(d,p);if(err)return toast(err);save(d);render()}
const A={
 logout(){AN.adminLogout();location.hash='';location.reload()},
 tbl(t){dbTable=t.dataset.t;render()},
 size(t){const id=t.dataset.id,w=parseFloat($('#w'+id).value),h=parseFloat($('#h'+id).value);if(!(w>0&&h>0))return toast('Enter a valid width and height.');
  upd(id,(d,p)=>{if(p.stage>=2||p.pay.down==='verified')return 'Size is locked once the downpayment is verified.';
   p.size={w,h};if(p.quote!=='pending'){p.quote='pending'}notify(d,p.owner,'Measurements recorded','Site measurement: '+w.toFixed(2)+' m × '+h.toFixed(2)+' m.');toast('Size encoded. Quote is awaiting approval.')})},
 approve(t){upd(t.dataset.id,(d,p)=>{if(p.quote!=='pending'||!p.size)return 'Needs a measurement and a quote awaiting approval.';p.quote='approved';notify(d,p.owner,'Quotation approved','Your quotation is ready to review.')})},
 down(t){upd(t.dataset.id,(d,p)=>{if(p.pay.down==='verified')return 'Already verified.';if(p.quote!=='accepted')return 'Customer must accept the quotation first.';p.pay.down='verified';notify(d,p.owner,'Downpayment verified','Your payment has been recorded.')})},
 final(t){upd(t.dataset.id,(d,p)=>{if(p.pay.final==='verified')return 'Already verified.';if(p.stage<3||p.pay.down!=='verified')return 'Available once the gate is Ready for Installation.';p.pay.final='verified';notify(d,p.owner,'Final payment verified','Thank you, your balance is settled.')})},
 next(t){upd(t.dataset.id,(d,p)=>{if(p.stage>=4)return 'Project already complete.';
  if(p.stage===1&&!(p.quote==='accepted'&&p.pay.down==='verified'))return 'Needs an accepted quotation and verified downpayment.';
  if(p.stage===3&&p.pay.final!=='verified')return 'Verify the final payment first.';
  p.stage++;notify(d,p.owner,'Stage updated to '+STAGES[p.stage][0],STAGES[p.stage][1]+'.')})},
 prices(){const n=id=>parseFloat($('#'+id).value),v={steel:n('pr-steel'),panel:n('pr-panel'),paint:n('pr-paint'),weld:n('pr-weld'),hw:{Swing:n('pr-hs'),Sliding:n('pr-hl'),Folding:n('pr-hf')}};
  const bad=[v.steel,v.panel,v.paint,v.weld,v.hw.Swing,v.hw.Sliding,v.hw.Folding].some(x=>!(x>=0));if(bad||v.panel<1)return toast('Enter valid prices (the multiplier must be 1 or more).');
  const d=load();d.prices=v;save(d);render();toast('Price list saved')},
 'prices-default'(){if(!confirm('Restore the default price list?'))return;const d=load();d.prices={steel:480,panel:1.25,paint:350,weld:900,hw:{Swing:1200,Sliding:2400,Folding:1800}};save(d);render();toast('Defaults restored')},
 pw(t){const p=prompt('New password for '+t.dataset.e+' (at least 6 characters):');if(p===null)return;if(p.length<6)return toast('Password must be at least 6 characters.');
  const d=load(),u=d.users.find(x=>x.email===t.dataset.e);if(u){u.pass=p;save(d);render();toast('Password updated')}},
 rm(t){if(!confirm('Remove the login for '+t.dataset.e+'?'))return;const d=load();d.users=d.users.filter(u=>!(u.email===t.dataset.e&&u.role!=='admin'));save(d);render();toast('Account removed')},
 csv(){const d=load(),q=v=>'"'+String(v).replace(/"/g,'""')+'"',
  rows=[['Customer','Email','Gate','Pattern','Size (m)','Stage','Quotation','Est. material cost (PHP)','Downpayment','Final payment']].concat(d.projects.map(p=>[nameOf(d,p.owner),p.owner,p.design.type,p.design.pattern,p.size?p.size.w+' x '+p.size.h:'',STAGES[p.stage][0],QL[p.quote][0],p.size?total(p):'',p.pay.down,p.pay.final]));
  download('an-project-report.csv',rows.map(r=>r.map(q).join(',')).join('\r\n'),'text/csv')},
 export(){download('an-database-backup.json',JSON.stringify(load(),null,2),'application/json')},
 reset(){if(confirm('Reset ALL data (customers, inquiries, projects, prices) back to the sample data?')){AN.reset();location.hash='';location.reload()}}
};
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t||!A[t.dataset.act])return;if(t.tagName==='A')e.preventDefault();A[t.dataset.act](t)});
document.addEventListener('change',e=>{if(e.target.id!=='imp'||!e.target.files[0])return;const r=new FileReader();
 r.onload=()=>{try{const o=JSON.parse(r.result);if(!['users','inquiries','projects','notes'].every(k=>Array.isArray(o[k])))throw 0;if(!confirm('Replace the current database with this backup?'))return;AN.save(o);render();toast('Database restored')}catch(x){toast('That file is not a valid database backup.')}};r.readAsText(e.target.files[0])});

/* ---------- routing, render, login ---------- */
const route=()=>{const h=location.hash.slice(1);return PANELS.includes(h)?h:'overview'};
function render(){if(!AN.adminMe())return location.reload();const r=route();
 PANELS.forEach(id=>$('#'+id).style.display=id===r?'block':'none');
 document.querySelectorAll('.menu-item').forEach(a=>a.classList.toggle('act',a.getAttribute('href')==='#'+r));
 $('#'+r).innerHTML={overview,projects,inquiries,prices,users,reports,database}[r]()}
function authUI(){$('#auth').innerHTML=`<div class="auth"><div class="card"><a class="brand" href="index.html"><span class="brand-mark">A&amp;N</span><span><b>A&amp;N Construction</b><small>Admin back office</small></span></a>
 <h2>Admin log in</h2><p class="muted" style="font-size:13.5px;margin-bottom:14px">Authorized personnel only.</p>
 <form id="af"><div class="field"><label>Username</label><input name="u" autocomplete="username" required autofocus></div><div class="field"><label>Password</label><input name="p" type="password" autocomplete="current-password" required></div><div class="err" id="ae"></div><button class="btn btn-primary btn-block" type="submit">Log in</button></form>
 <p class="note" style="margin-top:12px"><a href="index.html" style="text-decoration:underline">Back to the website</a></p></div></div>`;
 $('#af').onsubmit=e=>{e.preventDefault();const f=e.target,r=AN.adminLogin(f.elements.u.value,f.elements.p.value);if(r.err)return $('#ae').textContent=r.err;start()}}
let wired=false;
function start(){if(AN.adminMe()){$('#auth').innerHTML='';$('#app').style.display='';if(!wired){addEventListener('hashchange',render);wired=true}render()}else{$('#app').style.display='none';authUI()}}
start();
})();
