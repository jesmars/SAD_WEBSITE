/* Customer portal logic */
(function(){
const {me,load,save,active,notify,estimate,tableHTML,peso,fmt,esc,STAGES,COLORS}=AN;
const $=s=>document.querySelector(s);
const IMG={Bars:'bars',Lattice:'lattice',Slats:'slats',Scroll:'scroll'};
const PRE=[['Classic vertical bars','Clean, simple and sturdy','bars','Bars',0],['Ornamental scroll','Decorative with scroll work','scroll','Scroll',0],['Horizontal slats','Modern, more privacy','slats','Slats',2],['Bronze lattice','Traditional diamond pattern','lattice-bronze','Lattice',1]];
const QL={none:['Not yet prepared','tag-grey'],pending:['Awaiting owner approval','tag-grey'],approved:['Approved by owner','tag-green'],accepted:['Accepted','tag-green'],declined:['Declined','tag-grey']};
const PANELS=['dashboard','inquiries','designs','quotes','notifications','profile'];
let draft=null,draftId=null,gate=null;const gateEl=document.createElement('div');gateEl.className='g3d';

function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function mut(fn){const d=load(),u=me(),p=active(u.email,d);const r=fn(d,p,u);save(d);render();return r}
const unread=()=>load().notes.filter(n=>n.owner===me().email&&!n.read).length;
const top=(t,s)=>`<div class="portal-top"><div><h2>${t}</h2><p class="muted">${s}</p></div><div class="portal-user"><a class="chip" href="#notifications">🔔 ${unread()}</a><span class="avatar-sm">${esc(me().name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase())}</span></div></div>`;
const empty=()=>`<div class="card center" style="padding:40px"><h3>No project yet</h3><p class="muted" style="margin:8px 0 18px">Submit an inquiry to start your gate project.</p><a class="btn btn-primary" href="contact.html">Submit an Inquiry</a></div>`;
const stagesHTML=p=>STAGES.map((s,i)=>{const done=i<p.stage||p.stage===4,cur=i===p.stage&&p.stage<4;return `<div class="stage ${done?'done':cur?'current':''}"><div class="dot">${done?'✓':i+1}</div><b>${s[0]}</b><small>${s[1]}</small></div>`}).join('');
const sizeTxt=p=>p.size?`${p.size.w.toFixed(2)} m × ${p.size.h.toFixed(2)} m`:'Awaiting site measurement';
const payTag=v=>v==='verified'?'<span class="tag tag-green">Verified by staff</span>':'<span class="tag tag-grey">Pending</span>';

function dash(){const u=me(),p=active(u.email),notes=load().notes.filter(n=>n.owner===u.email);
 let h=top('Welcome back, '+esc(u.name.split(' ')[0]),p?'Here is the status of your gate project.':'You have no active project yet.');
 if(!p)return h+empty();
 const q=QL[p.quote];
 return h+`<div class="stack"><div class="grid g3">
 <div class="card stat"><div class="icon">⌗</div><div><div class="num">${p.stage<4?1:0}</div><span class="muted">Active project</span></div></div>
 <div class="card stat"><div class="icon">₱</div><div><div class="num">${p.quote==='approved'?1:0}</div><span class="muted">Quotation to review</span></div></div>
 <div class="card stat"><div class="icon">✉</div><div><div class="num">${unread()}</div><span class="muted">New notifications</span></div></div></div>
 <div class="card" id="tracking" style="padding:26px 24px"><div style="display:flex;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:8px"><h3>Project tracking</h3><span class="tag">Current stage: ${STAGES[p.stage][0]}</span></div><div class="stages">${stagesHTML(p)}</div></div>
 <div class="grid" style="grid-template-columns:1.15fr 1fr">
  <div class="card"><h3 style="margin-bottom:14px">Project details</h3><div style="display:grid;grid-template-columns:150px 1fr;gap:18px;align-items:center">
   <div class="pic"><img src="assets/gate-${IMG[p.design.pattern]}.svg" alt="Gate in the current project"></div>
   <dl class="kv"><dt>Gate type</dt><dd>${p.design.type} gate</dd><dt>Size</dt><dd>${sizeTxt(p)}</dd><dt>Material</dt><dd>${p.design.material}</dd><dt>Color</dt><dd>${COLORS[p.design.color][0]}</dd><dt>Pattern</dt><dd>${p.design.pattern}</dd><dt>Quotation</dt><dd>${q[0]}</dd></dl></div></div>
  <div class="card"><h3 style="margin-bottom:12px">Payments</h3><table class="table"><tr><th>Payment</th><th>Status</th></tr><tr><td>Downpayment</td><td>${payTag(p.pay.down)}</td></tr><tr><td>Final balance</td><td>${payTag(p.pay.final)}</td></tr></table><p class="note" style="margin-top:10px">Payments are made offline and verified by staff.</p></div></div>
 <div class="card"><h3 style="margin-bottom:12px">Recent email notifications</h3>${notes.length?'<table class="table">'+notes.slice(0,3).map(n=>`<tr><td style="width:36px">✉</td><td><b>${esc(n.title)}</b><br><span class="muted">${esc(n.body)}</span></td><td class="r muted">${fmt(n.date)}</td></tr>`).join('')+'</table>':'<p class="muted">Nothing yet.</p>'}</div>
 <div class="card demo"><h3>Staff simulator <span class="tag tag-grey">Demo only</span></h3><p class="muted" style="font-size:13px;margin-top:4px">Stands in for the staff/owner back office so you can walk through the whole workflow.</p>
  <div class="row"><input id="sw" type="number" step=".01" min=".5" value="3.6" aria-label="Width m"><input id="sh" type="number" step=".01" min=".5" value="2.1" aria-label="Height m"><button class="btn btn-sm btn-outline" data-act="s-size">Encode size</button><button class="btn btn-sm btn-outline" data-act="s-approve">Owner approves quote</button></div>
  <div class="row"><button class="btn btn-sm btn-outline" data-act="s-down">Verify downpayment</button><button class="btn btn-sm btn-outline" data-act="s-final">Verify final payment</button><button class="btn btn-sm btn-primary" data-act="s-next">Advance stage →</button><button class="btn btn-sm btn-outline" data-act="s-reset">Reset demo data</button></div></div></div>`}

function inquiries(){const u=me(),l=load().inquiries.filter(i=>i.owner===u.email).reverse();
 return top('My Inquiries','Requests you have sent to the shop.')+`<div class="card">${l.length?'<table class="table"><tr><th>Date</th><th>Gate</th><th>Pattern</th><th>Message</th></tr>'+l.map(i=>`<tr><td>${fmt(i.date)}</td><td>${esc(i.type)}</td><td>${esc(i.pattern)}</td><td>${esc(i.message)||'—'}</td></tr>`).join('')+'</table>':'<p class="muted">No inquiries yet.</p>'}<a class="btn btn-sm btn-primary" style="margin-top:16px" href="contact.html">New inquiry</a></div>`}

function quoteCard(p){if(!p)return`<div class="card"><h3>Quotation summary</h3><p class="muted" style="margin-top:8px">Submit an inquiry to receive a quotation.</p></div>`;
 const q=QL[p.quote];
 if(!p.size)return`<div class="card"><div style="display:flex;justify-content:space-between"><h3>Quotation summary</h3><span class="tag ${q[1]}">${q[0]}</span></div><p class="muted" style="margin-top:8px">Your quotation is prepared after staff measure your site.</p></div>`;
 return`<div class="card"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><h3>Quotation summary</h3><span class="tag ${q[1]}">${q[0]}</span></div>${tableHTML(estimate(p.design,p.size))}${p.quote==='approved'?'<div class="quote-actions"><button class="btn btn-sm btn-outline" data-act="decline">Decline</button><button class="btn btn-sm btn-primary" data-act="accept">Accept quotation</button></div>':''}</div>`}

function designs(){const u=me(),p=active(u.email);
 if(draftId!==(p?p.id:0)){draft=p?{...p.design}:{type:'Swing',material:'Tubular steel',color:0,pattern:'Bars'};draftId=p?p.id:0}
 const locked=p&&(p.quote==='accepted'||p.stage>=2),ch=(k,v)=>`<span class="chip ${draft[k]===v?'on':''}" data-act="set" data-k="${k}" data-v="${v}">${v}</span>`;
 return top('My Gate Designs','Customize your gate and review the suggestions.')+`<div class="stack"><div class="designer">
 <div class="card" style="padding:14px"><div class="tool-bar"><span class="tag tag-blue">Interactive 3D preview</span><span class="chip">⟲ Drag &nbsp; ⊕ Scroll</span></div><div id="slot"></div></div>
 <div class="card"><h3 style="margin-bottom:14px">Customize</h3>
  <div class="field"><label>Gate type</label>${['Swing','Sliding','Folding'].map(v=>ch('type',v)).join('')}</div>
  <div class="field"><label>Material</label>${['Tubular steel','Steel with panels'].map(v=>ch('material',v)).join('')}</div>
  <div class="field"><label>Color</label>${COLORS.map((c,i)=>`<span class="swatch ${draft.color===i?'on':''}" title="${c[0]}" data-act="set" data-k="color" data-v="${i}" style="background:${c[1]}"></span>`).join('')}</div>
  <div class="field"><label>Pattern</label>${['Bars','Lattice','Slats','Scroll'].map(v=>ch('pattern',v)).join('')}</div>
  <div class="field"><label>Measured size (encoded by staff)</label><div class="readonly">${p?sizeTxt(p):'Awaiting site measurement'}</div></div>
  ${locked?'<p class="note" style="margin-bottom:10px">Design is locked: the quotation was accepted.</p>':''}
  <button class="btn btn-sm btn-primary btn-block" data-act="save">${p?'Save design':'Submit an inquiry to save'}</button></div></div>
 <div class="card"><div style="display:flex;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px"><h3>Design suggestions</h3><span class="muted">Rule-based picks for your gate</span></div><div class="grid g4">
 ${PRE.map((s,i)=>`<div class="card card-photo suggestion"><div class="pic"><img src="assets/gate-${s[2]}.svg" alt="${s[0]}"></div><p>${s[0]}</p><small>${s[1]}</small><a class="btn btn-sm btn-outline btn-block" href="#designs" data-act="use" data-i="${i}">Use this design</a></div>`).join('')}</div></div>
 ${quoteCard(p)}</div>`}

function quotes(){return top('Quotations','Review and respond to your quotation.')+quoteCard(active(me().email))}
function notes(){const l=load().notes.filter(n=>n.owner===me().email);
 return top('Notifications','Email updates sent to you.')+`<div class="card">${l.length?'<table class="table">'+l.map(n=>`<tr class="${n.read?'':'unread'}"><td style="width:36px">✉</td><td><b>${esc(n.title)}</b><br><span class="muted">${esc(n.body)}</span></td><td class="r muted">${fmt(n.date)}</td></tr>`).join('')+'</table>':'<p class="muted">No notifications.</p>'}</div>`}
function profile(){const u=me();return top('Profile','Your account details.')+`<div class="card form-card" style="max-width:480px"><div class="field"><label>Full name</label><input id="pn" value="${esc(u.name)}"></div><div class="field"><label>Contact number</label><input id="pp" value="${esc(u.phone)}" placeholder="09XX XXX XXXX"></div><div class="field"><label>Email</label><div class="readonly">${esc(u.email)}</div></div><button class="btn btn-sm btn-primary" data-act="profile">Save profile</button></div>`}

function route(){let h=location.hash.slice(1);if(h==='tracking')h='dashboard';return PANELS.includes(h)?h:'dashboard'}
function render(){const r=route(),loc=location.hash.slice(1);
 PANELS.forEach(id=>$('#'+id).style.display=id===r?'block':'none');
 document.querySelectorAll('.menu-item').forEach(a=>a.classList.toggle('act',a.getAttribute('href')==='#'+(loc==='tracking'?'tracking':r)));
 const F={dashboard:dash,inquiries,designs,quotes,notifications:notes,profile}[r];$('#'+r).innerHTML=F();
 if(r==='designs'){$('#slot').appendChild(gateEl);const p=active(me().email),cfg={type:draft.type,pattern:draft.pattern,color:COLORS[draft.color][1],w:p&&p.size?p.size.w:3.6,h:p&&p.size?p.size.h:2.1};
  if(!gate)gate=mountGate(gateEl,cfg);else gate.update(cfg);if(!gate)gateEl.innerHTML='<p class="muted" style="padding:20px">3D preview needs an internet connection to load three.js.</p>'}
 if(r==='notifications'){const d=load();d.notes.forEach(n=>{if(n.owner===me().email)n.read=true});save(d)}
 if(loc==='tracking')setTimeout(()=>$('#tracking')&&$('#tracking').scrollIntoView(),0)}

const A={
 logout(){AN.logout();location.href='index.html'},
 set(t){const p=active(me().email);if(p&&(p.quote==='accepted'||p.stage>=2))return toast('Design is locked after quotation acceptance.');draft[t.dataset.k]=t.dataset.k==='color'?+t.dataset.v:t.dataset.v;render()},
 use(t){const s=PRE[t.dataset.i],p=active(me().email);if(p&&(p.quote==='accepted'||p.stage>=2))return toast('Design is locked after quotation acceptance.');draft.pattern=s[3];draft.color=s[4];render();toast('Applied. Click "Save design" to keep it.')},
 save(){const p=active(me().email);if(!p)return location.href='contact.html';
  if(p.quote==='accepted'||p.stage>=2)return toast('Design is locked.');
  mut((d,p)=>{p.design={...draft};if(['approved','declined'].includes(p.quote)){p.quote='pending';notify(d,p.owner,'Quotation updated','Your design changed. The owner will re-approve the estimate.')}});toast('Design saved')},
 accept(){mut((d,p)=>{p.quote='accepted';notify(d,p.owner,'Quotation accepted','Fabrication starts once your downpayment is verified.')});toast('Quotation accepted')},
 decline(){mut((d,p)=>{p.quote='declined';notify(d,p.owner,'Quotation declined','You can adjust your design and request a new estimate.')})},
 profile(){const d=load(),u=d.users.find(x=>x.email===me().email);u.name=$('#pn').value.trim()||u.name;u.phone=$('#pp').value.trim();save(d);render();toast('Profile saved')},
 's-size'(){const w=parseFloat($('#sw').value),h=parseFloat($('#sh').value);if(!(w>0&&h>0))return toast('Enter a valid width and height.');
  mut((d,p)=>{p.size={w,h};if(p.quote==='none'||p.quote==='declined')p.quote='pending';notify(d,p.owner,'Measurements recorded','Site measurement: '+w.toFixed(2)+' m × '+h.toFixed(2)+' m.')})},
 's-approve'(){const p=active(me().email);if(!p||p.quote!=='pending')return toast('Needs a size and a quote awaiting approval.');
  mut((d,p)=>{p.quote='approved';notify(d,p.owner,'Quotation approved','Your quotation is ready to review.')})},
 's-down'(){const p=active(me().email);if(!p||p.quote!=='accepted')return toast('Customer must accept the quotation first.');
  mut((d,p)=>{p.pay.down='verified';notify(d,p.owner,'Downpayment verified','Your payment has been recorded.')})},
 's-final'(){const p=active(me().email);if(!p||p.stage<3||p.pay.down!=='verified')return toast('Available once the gate is Ready for Installation.');
  mut((d,p)=>{p.pay.final='verified';notify(d,p.owner,'Final payment verified','Thank you, your balance is settled.')})},
 's-next'(){const p=active(me().email);if(!p||p.stage>=4)return toast('Project already complete.');
  if(p.stage===1&&!(p.quote==='accepted'&&p.pay.down==='verified'))return toast('Needs an accepted quotation and verified downpayment.');
  if(p.stage===3&&p.pay.final!=='verified')return toast('Verify the final payment first.');
  mut((d,p)=>{p.stage++;notify(d,p.owner,'Stage updated to '+STAGES[p.stage][0],STAGES[p.stage][1]+'.')})},
 's-reset'(){if(confirm('Reset all demo data (including accounts you created)?')){AN.reset();location.hash='';location.reload()}}
};
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t||!A[t.dataset.act])return;if(t.tagName==='A'&&t.dataset.act!=='use')e.preventDefault();A[t.dataset.act](t)});

function authUI(reg){const a=$('#auth');
 a.innerHTML=`<div class="auth"><div class="card"><a class="brand" href="index.html"><span class="brand-mark">A&amp;N</span><span><b>A&amp;N Construction</b><small>Customer portal</small></span></a>
 <div class="tabs"><button class="btn btn-sm ${reg?'btn-outline':'btn-primary'}" id="tl">Log in</button><button class="btn btn-sm ${reg?'btn-primary':'btn-outline'}" id="tr">Register</button></div>
 <form id="af">${reg?'<div class="field"><label>Full name</label><input name="name" required></div>':''}<div class="field"><label>Email</label><input name="email" type="email" required></div><div class="field"><label>Password</label><input name="pass" type="password" required></div><div class="err" id="ae"></div><button class="btn btn-primary btn-block" type="submit">${reg?'Create account':'Log in'}</button></form>
 ${reg?'':'<p class="note" style="margin-top:12px">Demo account: juan@example.com / demo123</p>'}</div></div>`;
 $('#tl').onclick=()=>authUI(false);$('#tr').onclick=()=>authUI(true);
 $('#af').onsubmit=e=>{e.preventDefault();const f=e.target,r=reg?AN.register(f.name.value,f.email.value,f.pass.value):AN.login(f.email.value,f.pass.value);
  if(r.err)return $('#ae').textContent=r.err;a.innerHTML='';if(location.hash==='#register')location.hash='';init()}}

let wired=false;function init(){if(!wired){addEventListener('hashchange',()=>me()&&render());wired=true}render()}
if(me()){init()}else{PANELS.forEach(id=>$('#'+id).style.display='none');authUI(location.hash==='#register')}
})();
