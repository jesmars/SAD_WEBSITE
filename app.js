/* A&N shared logic: data store (localStorage), auth, estimates, nav, and page behaviors */
window.AN=(function(){
const KEY='an_db',SES='an_session';
const STAGES=[['Inquiry','Request received'],['Measuring','Site visit'],['Fabrication','Gate is built'],['Ready for Installation','Gate is finished'],['Installed','Project complete']];
const COLORS=[['Black','#1f1f22'],['Brown','#3b2a1c'],['Blue-grey','#2c3a4a'],['White','#f2f2f0']];
const PAT={'Vertical bars':'Bars','Lattice':'Lattice','Horizontal slats':'Slats','Ornamental scroll':'Scroll'};
const now=()=>new Date().toISOString(),peso=n=>'₱'+Number(n).toLocaleString('en-US');
const fmt=d=>new Date(d).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let mem={};
const ss={get:k=>{try{return sessionStorage.getItem(k)}catch(e){return mem[k]||null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch(e){mem[k]=v}},del:k=>{try{sessionStorage.removeItem(k)}catch(e){delete mem[k]}}};
const ADM='an_admin',DEF={steel:480,panel:1.25,paint:350,weld:900,hw:{Swing:1200,Sliding:2400,Folding:1800}};
const st={get:k=>{try{return localStorage.getItem(k)}catch(e){return mem[k]||null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){mem[k]=v}},del:k=>{try{localStorage.removeItem(k)}catch(e){delete mem[k]}}};
function seed(){const e='juan@example.com',d={users:[{email:e,name:'Juan Dela Cruz',phone:'',pass:'demo123',role:'customer'}],
 projects:[{id:1,owner:e,stage:1,design:{type:'Swing',material:'Tubular steel',color:0,pattern:'Bars'},size:{w:3.6,h:2.1},quote:'approved',pay:{down:'unpaid',final:'unpaid'}}],
 inquiries:[{id:1,owner:e,email:e,name:'Juan Dela Cruz',phone:'',type:'Swing gate',pattern:'Vertical bars',message:'Swing gate for the front driveway.',date:now()}],
 notes:[{owner:e,title:'Quotation approved',body:'Your quotation is ready to review.',date:now(),read:false},{owner:e,title:'Stage updated to Measuring',body:'Our team will visit your site.',date:now(),read:false}]};migrate(d);save(d);return d}
/* keeps older saved data working: adds roles, the price list, the status log and the default admin account */
function migrate(d){d.prices=d.prices||JSON.parse(JSON.stringify(DEF));d.log=d.log||[];d.users.forEach(u=>{if(!u.role)u.role='customer'});
 if(!d.users.some(u=>u.role==='admin'))d.users.push({email:'admin',name:'Owner (Admin)',phone:'',pass:'admin123',role:'admin'});return d}
function load(){const s=st.get(KEY);if(s)try{return migrate(JSON.parse(s))}catch(e){}return seed()}
function save(d){st.set(KEY,JSON.stringify(d))}
const me=()=>{const e=st.get(SES);return load().users.find(u=>u.email===e&&u.role!=='admin')||null};
const active=(email,d)=>{const l=(d||load()).projects.filter(p=>p.owner===email);return l[l.length-1]||null};
const notify=(d,owner,title,body)=>{d.notes.unshift({owner,title,body,date:now(),read:false});if(/^Stage updated/.test(title))d.log.push({date:now(),owner,stage:title.replace('Stage updated to ','')})};
function newProject(d,owner,type,pattern){d.projects.push({id:Date.now(),owner,stage:0,design:{type,material:'Tubular steel',color:0,pattern},size:null,quote:'none',pay:{down:'unpaid',final:'unpaid'}})}
function adopt(d,email){const l=d.inquiries.filter(i=>i.email.toLowerCase()===email&&!i.owner);if(!l.length)return;
 l.forEach(i=>i.owner=email);const i=l[l.length-1],a=active(email,d);
 if(!a||a.stage===4)newProject(d,email,i.type.split(' ')[0],PAT[i.pattern]||'Bars');notify(d,email,'Inquiry received','We received your inquiry and will contact you by email.')}
function login(email,pass){email=email.trim().toLowerCase();const d=load(),u=d.users.find(u=>u.email===email&&u.pass===pass&&u.role!=='admin');
 if(!u)return{err:'Incorrect email or password.'};st.set(SES,email);adopt(d,email);save(d);return{ok:1}}
function register(name,email,pass){email=email.trim().toLowerCase();const d=load();
 if(!name.trim())return{err:'Please enter your name.'};if(pass.length<6)return{err:'Password must be at least 6 characters.'};
 if(d.users.some(u=>u.email===email))return{err:'That email is already registered. Try logging in.'};
 d.users.push({email,name:name.trim(),phone:'',pass,role:'customer'});st.set(SES,email);adopt(d,email);save(d);return{ok:1}}
function adminLogin(user,pass){const u=user.trim().toLowerCase(),a=load().users.find(x=>x.role==='admin'&&x.email===u&&x.pass===pass);
 if(!a)return{err:'Incorrect admin username or password.'};ss.set(ADM,a.email);return{ok:1}}
const adminMe=()=>{const e=ss.get(ADM);return e?load().users.find(u=>u.role==='admin'&&u.email===e)||null:null};
function addInquiry(f){const d=load(),u=me(),email=(u?u.email:f.email).trim().toLowerCase();
 d.inquiries.push({id:Date.now(),owner:u?u.email:'',email,name:f.name,phone:f.phone,type:f.type,pattern:f.pattern,message:f.message,date:now()});
 if(u){const a=active(u.email,d);if(!a||a.stage===4)newProject(d,u.email,f.type.split(' ')[0],PAT[f.pattern]||'Bars');notify(d,u.email,'Inquiry received','We received your inquiry and will contact you by email.')}
 save(d);return!!u}
function estimate(dz,s){const pr=load().prices,w=s.w,h=s.h,bars=Math.floor(w/.13)*h;
 const m={Bars:bars,Slats:Math.floor(h/.15)*w,Lattice:bars*1.3,Scroll:bars*.8+Math.floor(w/.35)*Math.floor(h/.35)*.75}[dz.pattern]||bars;
 const L=Math.ceil((2*(w+h)+m)/6),P=Math.ceil(w*h*.5),unit=Math.round(pr.steel*(dz.material==='Steel with panels'?pr.panel:1)),hw=pr.hw[dz.type]||pr.hw.Swing;
 const rows=[['Tubular steel (lengths)',L,unit,L*unit],['Paint (liters)',P,pr.paint,P*pr.paint],['Hardware &amp; fasteners','1 lot',hw,hw],['Welding consumables','1 lot',pr.weld,pr.weld]];
 return{rows,total:rows.reduce((a,r)=>a+r[3],0)}}
const tableHTML=e=>'<table class="table"><tr><th>Material</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Subtotal</th></tr>'+e.rows.map(r=>`<tr><td>${r[0]}</td><td class="r">${r[1]}</td><td class="r">${peso(r[2])}</td><td class="r">${peso(r[3])}</td></tr>`).join('')+`<tr class="total"><td colspan="3">Estimated material cost</td><td class="r">${peso(e.total)}</td></tr></table>`;
return{load,save,me,adminLogin,adminMe,adminLogout:()=>ss.del(ADM),active,notify,login,register,addInquiry,estimate,tableHTML,peso,fmt,esc,STAGES,COLORS,logout:()=>st.del(SES),reset:()=>{st.del(KEY);st.del(SES)}};
})();

/* ---------- page behaviors ---------- */
(function(){
const u=AN.me(),$=s=>document.querySelector(s),links=$('.nav-links');
if(links){const b=[...links.querySelectorAll('.btn')];
 if(u&&b.length>1){b[0].textContent='My Account';b[1].textContent='Log out';b[1].href='#';b[1].onclick=e=>{e.preventDefault();AN.logout();location.href='index.html'}}
 else document.querySelectorAll('a.btn').forEach(a=>{if(a.textContent.trim()==='Register')a.href='account.html#register'});
 /* phone menu: a toggle button is added to the navbar (styled in style.css) */
 const nb=links.closest('.navbar');if(nb){const t=document.createElement('button');t.type='button';t.className='nav-toggle';t.setAttribute('aria-label','Toggle menu');t.setAttribute('aria-expanded','false');t.innerHTML='<span></span><span></span><span></span>';t.onclick=()=>t.setAttribute('aria-expanded',nb.classList.toggle('open'));nb.classList.add('has-toggle');nb.insertBefore(t,links)}}

if(/^Home/.test(document.title)){const img=$('.preview-box img'),g=document.createElement('div');g.className='g3d';
 if(window.THREE&&img){img.replaceWith(g);mountGate(g,{type:'Swing',pattern:'Scroll',color:'#1f1f22'})}}

if(/^Contact/.test(document.title)){const f=$('form.form-card');
 if(u){f.name.value=u.name;f.email.value=u.email;f.phone.value=u.phone||'';$('.form-actions .note').textContent='Logged in as '+u.email}
 f.addEventListener('submit',e=>{e.preventDefault();const v=Object.fromEntries(new FormData(f));const own=AN.addInquiry(v);
  f.innerHTML=`<h2 style="font-size:24px;margin-bottom:8px">Thank you, ${AN.esc(v.name.split(' ')[0])}!</h2><p class="muted" style="margin-bottom:18px">Your inquiry was submitted at the <b>Inquiry</b> stage. ${own?'Track it in your account.':'Register with <b>'+AN.esc(v.email)+'</b> to track it online.'}</p><a class="btn btn-primary" href="${own?'account.html':'account.html#register'}">${own?'Go to My Account':'Register now'}</a>`})}

if(/^Services/.test(document.title)){
 const sel={type:'Swing',material:'Tubular steel',color:0,pattern:'Bars'},keys=['type','material','color','pattern'],sz={w:3.6,h:2.1};
 const cards=[...document.querySelectorAll('.section.alt .g4 .card')],tbl=$('.split .table');
 const prev=document.createElement('div');prev.className='card';prev.style.marginTop='20px';
 prev.innerHTML='<div class="tool-bar"><span class="tag tag-blue">Interactive 3D preview</span><span class="note">Drag to rotate · scroll to zoom</span></div><div class="g3d"></div>';
 cards[0].parentNode.after(prev);const gate=mountGate(prev.querySelector('.g3d'),{});
 const up2=()=>{gate&&gate.update({type:sel.type,pattern:sel.pattern,color:AN.COLORS[sel.color][1],w:sz.w,h:sz.h});const e=AN.estimate(sel,sz);document.querySelector('.split .table').innerHTML=AN.tableHTML(e).replace(/^<table[^>]*>|<\/table>$/g,'')};
 cards.forEach((c,i)=>{const els=[...c.querySelectorAll('.chip,.swatch')];els.forEach((el,j)=>el.onclick=()=>{els.forEach(x=>x.classList.remove('on'));el.classList.add('on');sel[keys[i]]=keys[i]==='color'?j:el.textContent.trim();up2()})});
 up2()}
/* portal: keep the active tab visible when the sidebar becomes a scrolling top bar on small screens */
if($('.sidebar nav'))addEventListener('hashchange',()=>setTimeout(()=>{const a=$('.menu-item.act');if(a&&a.scrollIntoView)a.scrollIntoView({block:'nearest',inline:'center'})},60));
})();