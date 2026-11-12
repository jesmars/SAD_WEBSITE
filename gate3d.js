/* Interactive 3D gate (three.js). mountGate(el,cfg) -> {update(cfg)} or null if three.js is unavailable */
function mountGate(el,cfg){
if(!window.THREE)return null;
const T=THREE,r=new T.WebGLRenderer({antialias:true,alpha:true});
r.setPixelRatio(Math.min(devicePixelRatio,2));el.appendChild(r.domElement);
const sc=new T.Scene(),cam=new T.PerspectiveCamera(40,1,.1,100);
cam.position.set(0,1.5,9);cam.lookAt(0,1,0);
sc.add(new T.AmbientLight(0xffffff,.75));
const dl=new T.DirectionalLight(0xffffff,.9);dl.position.set(4,6,6);sc.add(dl);
const fl=new T.Mesh(new T.CircleGeometry(7,48),new T.MeshLambertMaterial({color:0xdcd6ca}));fl.rotation.x=-Math.PI/2;sc.add(fl);
const piv=new T.Group(),g=new T.Group();piv.add(g);sc.add(piv);
function size(){const w=el.clientWidth||480,h=el.clientHeight||340;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
size();addEventListener('resize',size);
function build(c){
  while(g.children.length)g.remove(g.children[0]);
  const w=c.w||3.6,h=c.h||2.1;
  const mat=new T.MeshStandardMaterial({color:new T.Color(c.color||'#1f1f22'),metalness:.5,roughness:.45});
  const post=new T.MeshStandardMaterial({color:0x9a958a,roughness:.9}),dark=new T.MeshStandardMaterial({color:0x444444});
  const add=(geo,x,y,m)=>{const o=new T.Mesh(geo,m||mat);o.position.set(x,y,0);g.add(o);return o};
  const seg=(x1,y1,x2,y2)=>{const o=add(new T.BoxGeometry(Math.hypot(x2-x1,y2-y1),.03,.03),(x1+x2)/2,(y1+y2)/2);o.rotation.z=Math.atan2(y2-y1,x2-x1)};
  [-1,1].forEach(s=>add(new T.BoxGeometry(.22,h+.25,.22),s*(w/2+.12),(h+.25)/2,post));
  const n={Swing:2,Sliding:1,Folding:4}[c.type]||2,gap=.04,lw=(w-gap*(n-1))/n,y0=.1,hh=h-y0;
  if(c.type==='Sliding')add(new T.BoxGeometry(w*2,.05,.08),w/2,.03,dark);
  for(let i=0;i<n;i++){
    const x0=-w/2+i*(lw+gap),cx=x0+lw/2;
    add(new T.BoxGeometry(lw,.06,.06),cx,y0);add(new T.BoxGeometry(lw,.06,.06),cx,y0+hh);
    add(new T.BoxGeometry(.06,hh,.06),x0+.03,y0+hh/2);add(new T.BoxGeometry(.06,hh,.06),x0+lw-.03,y0+hh/2);
    const p=c.pattern;
    if(p==='Slats'){const m=Math.floor(hh/.15);for(let j=0;j<m;j++)add(new T.BoxGeometry(lw,.07,.03),cx,y0+(j+.5)*hh/m)}
    else if(p==='Lattice'){for(const s of[1,-1])for(let ym=(s>0?y0-lw:y0);ym<=y0+hh+(s>0?0:lw);ym+=.3){
      const u1=(y0-ym)/s,u2=(y0+hh-ym)/s,lo=Math.max(0,Math.min(u1,u2)),hi=Math.min(lw,Math.max(u1,u2));
      if(hi-lo>.02)seg(x0+lo,ym+s*lo,x0+hi,ym+s*hi)}}
    else if(p==='Scroll'){add(new T.BoxGeometry(lw,.04,.04),cx,y0+hh/2);const cs=.34,cols=Math.floor(lw/cs),rows=Math.floor(hh/cs);
      for(let a=0;a<cols;a++)for(let b=0;b<rows;b++){const o=add(new T.TorusGeometry(.13,.012,6,24,Math.PI*1.5),x0+(lw-cols*cs)/2+(a+.5)*cs,y0+(hh-rows*cs)/2+(b+.5)*cs);o.rotation.z=((a+b)%2)*Math.PI/2}}
    else{const k=Math.max(2,Math.floor(lw/.13));add(new T.BoxGeometry(lw,.04,.04),cx,y0+hh/2);for(let j=1;j<k;j++)add(new T.CylinderGeometry(.013,.013,hh),x0+j*lw/k,y0+hh/2)}
  }
}
build(cfg||{});
let dr=false,touched=false,px=0,py=0;const cv=r.domElement;
cv.addEventListener('pointerdown',e=>{dr=touched=true;px=e.clientX;py=e.clientY;cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',e=>{if(!dr)return;piv.rotation.y+=(e.clientX-px)*.01;piv.rotation.x=Math.max(-.5,Math.min(.5,piv.rotation.x+(e.clientY-py)*.005));px=e.clientX;py=e.clientY});
['pointerup','pointercancel'].forEach(t=>cv.addEventListener(t,()=>dr=false));
cv.addEventListener('wheel',e=>{e.preventDefault();cam.position.z=Math.max(5,Math.min(14,cam.position.z+e.deltaY*.01))},{passive:false});
(function loop(){requestAnimationFrame(loop);if(!el.isConnected||!el.clientWidth)return;if(!touched)piv.rotation.y=.6*Math.sin(Date.now()/1800);r.render(sc,cam)})();
return{update:c=>build(c)};
}
