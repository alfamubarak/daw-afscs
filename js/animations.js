/* AFCSC DAW — GSAP choreography. Every effect is built from timelines owned here so that it can be killed/cleaned. */
(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var FX=window.FX={reduce:matchMedia("(prefers-reduced-motion: reduce)").matches,ambient:true,fine:false,amb:[]};
FX.ambient=!FX.reduce;
gsap.registerPlugin(Draggable,InertiaPlugin);
gsap.defaults({ease:"power3.out"});
FX.d=function(x){return FX.reduce?0.01:x};
FX.split=function(el){
  if(el._chars)return el._chars;var t=el.textContent.trim(),out=[];el.setAttribute("aria-label",t);el.textContent="";
  t.split(" ").forEach(function(word,i,a){var w=document.createElement("span");w.className="w";w.setAttribute("aria-hidden","true");
    for(var k=0;k<word.length;k++){var c=document.createElement("span");c.className="ch";c.textContent=word[k];w.appendChild(c);out.push(c)}
    el.appendChild(w);if(i<a.length-1)el.appendChild(document.createTextNode(" "))});
  return (el._chars=out)};
FX.count=function(el,to,dur,from){var o={v:from||0};return gsap.to(o,{v:to,duration:FX.d(dur||1.2),ease:"power2.out",onUpdate:function(){el.textContent=Math.round(o.v).toLocaleString("en-GB")}})};
/* --- ambient --- */
FX.addAmbient=function(t){FX.amb.push(t);if(!FX.ambient)t.pause();return t};
FX.setAmbient=function(on){FX.ambient=on&&!FX.reduce;document.body.classList.toggle("no-ambient",!FX.ambient);FX.amb.forEach(function(t){FX.ambient&&!document.hidden?t.resume():t.pause()})};
document.addEventListener("visibilitychange",function(){FX.setAmbient(FX.ambient)});
FX.startAmbient=function(){
  if(FX.amb.length)return;
  FX.addAmbient(gsap.to(".bg-grid",{x:-40,y:-22,duration:26,ease:"sine.inOut",yoyo:true,repeat:-1}));
  FX.addAmbient(gsap.to(".g1",{scale:1.25,x:-60,duration:9,ease:"sine.inOut",yoyo:true,repeat:-1}));
  FX.addAmbient(gsap.to(".g2",{scale:1.2,y:-40,duration:12,ease:"sine.inOut",yoyo:true,repeat:-1}));
  $$(".w-float").forEach(function(f,i){FX.addAmbient(gsap.to(f,{y:(i%2?-1:1)*14,duration:4+i,ease:"sine.inOut",yoyo:true,repeat:-1}))});
  FX.setAmbient(FX.ambient)};
/* --- parallax: pointer (mouse) and touch-drag both feed the same depth layers --- */
FX.parallax=function(){
  var layers=$$("[data-depth]"),setters=layers.map(function(l){var d=+l.dataset.depth;return{d:d,x:gsap.quickTo(l,"x",{duration:1.1,ease:"power3.out"}),y:gsap.quickTo(l,"y",{duration:1.1,ease:"power3.out"})}}),
  W=innerWidth,H=innerHeight;
  addEventListener("resize",function(){W=innerWidth;H=innerHeight});
  document.addEventListener("pointermove",function(e){if(FX.reduce||!FX.ambient)return;var nx=e.clientX/W-.5,ny=e.clientY/H-.5;
    setters.forEach(function(s){s.x(nx*s.d*-1.6);s.y(ny*s.d*-1.6)})},{passive:true})};
/* --- tactile feedback --- */
FX.pointerFX=function(){
  var fx=$("#fx"),cur=$("#cursor");
  document.addEventListener("pointerdown",function(e){
    if(e.pointerType!=="mouse"){document.body.classList.remove("fine-pointer");FX.fine=false;cur.classList.remove("on")}
    if(FX.reduce)return;var r=document.createElement("i");r.className="ripple";r.style.left=e.clientX+"px";r.style.top=e.clientY+"px";fx.appendChild(r);
    gsap.fromTo(r,{scale:.3,opacity:1},{scale:2.4,opacity:0,duration:.7,onComplete:function(){r.remove()}})},{passive:true});
  /* glass highlight follows touch / pointer */
  var raf=0,last=null;document.addEventListener("pointermove",function(e){last=e;if(raf)return;raf=requestAnimationFrame(function(){raf=0;
    var g=last.target.closest&&last.target.closest(".glass,.card,.fcard,.tcard");$$(".glass.lit").forEach(function(n){if(n!==g)n.classList.remove("lit")});
    if(g&&g.classList.contains("glass")){var b=g.getBoundingClientRect();g.style.setProperty("--mx",(last.clientX-b.left)+"px");g.style.setProperty("--my",(last.clientY-b.top)+"px");g.classList.add("lit")}})},{passive:true});
  /* mouse-only: custom cursor + magnetic buttons */
  if(matchMedia("(pointer:fine)").matches){FX.fine=true;document.body.classList.add("fine-pointer");
    var qx=gsap.quickTo(cur,"x",{duration:.18}),qy=gsap.quickTo(cur,"y",{duration:.18}),mag=null;
    document.addEventListener("pointermove",function(e){if(e.pointerType!=="mouse")return;FX.fine=true;document.body.classList.add("fine-pointer");cur.classList.add("on");qx(e.clientX);qy(e.clientY);
      cur.classList.toggle("hot",!!e.target.closest("button,.card,.fcard,.tcard,input"));
      var m=e.target.closest(".mag");if(mag&&mag!==m){gsap.to(mag,{x:0,y:0,duration:.5,ease:"elastic.out(1,.5)"});mag=null}
      if(m&&!FX.reduce){mag=m;var b=m.getBoundingClientRect();gsap.to(m,{x:(e.clientX-b.left-b.width/2)*.22,y:(e.clientY-b.top-b.height/2)*.3,duration:.35})}},{passive:true});
    document.documentElement.addEventListener("pointerleave",function(){cur.classList.remove("on")})}};
/* --- 01 preloader (progress = real asset readiness) --- */
FX.preloader=function(onEnter){
  var pl=$("#preloader"),rings=$$(".pl-rings circle,.pl-rings path"),bar=$(".pl-meter b"),meter=$(".pl-meter"),cnt=$("#plCount"),skip=$("#plSkip"),
  chars=FX.split($(".pl-title")).concat(FX.split($(".pl-dept"))),done=false,ready=false,played=false;
  gsap.set(rings,{strokeDasharray:1,strokeDashoffset:1});gsap.set(".pl-logo img",{yPercent:100});gsap.set(chars,{yPercent:110});gsap.set(".pl-sub,.pl-meter,.pl-status",{opacity:0});
  var tl=gsap.timeline({defaults:{ease:"power3.out"},onComplete:function(){played=true;go()}});
  tl.to(rings,{strokeDashoffset:0,duration:FX.d(1.6),stagger:.15,ease:"power2.inOut"},0)
    .fromTo(".pl-sweep",{rotation:0,opacity:0},{rotation:720,opacity:1,duration:FX.d(3.2),ease:"power1.inOut"},0)
    .to(".pl-logo img",{yPercent:0,duration:FX.d(1.1),ease:"expo.out"},.5)
    .fromTo(".pl-logo",{scale:.9},{scale:1,duration:FX.d(1.4)},.5)
    .to(chars,{yPercent:0,duration:FX.d(.9),stagger:.012,ease:"expo.out"},1.0)
    .to(".pl-sub,.pl-meter,.pl-status",{opacity:1,duration:FX.d(.6),stagger:.12},1.7);
  var skipFn=function(){if(done)return;if(!ready)return;if(!played){tl.timeScale(5)}else go()};
  skip.addEventListener("click",skipFn);
  function go(){if(done||!ready||!played)return;done=true;
    var o=gsap.timeline({onComplete:function(){pl.hidden=true;onEnter()}});
    o.to(".pl-core",{scale:1.12,opacity:0,duration:FX.d(.7),ease:"power2.in"},0).to(".pl-radar",{scale:1.5,opacity:0,duration:FX.d(.9),ease:"power2.in"},0).to(pl,{opacity:0,duration:FX.d(.5)},.45)}
  return {progress:function(n,t,label){var p=Math.round(n/t*100);gsap.to(bar,{width:p+"%",duration:.3});meter.setAttribute("aria-valuenow",p);
      cnt.textContent=n<t?"Assets ready "+n+" / "+t+(label?" · "+label:""):"All assets ready";
      if(n>=t){ready=true;gsap.to(skip,{opacity:1,duration:.4});go()}}}};
/* --- 02 welcome: theatrical AFCSC footage and a Firewatch-inspired typographic selection menu --- */
FX.welcomeIn=function(){
  var v=$("#welcome");v.hidden=false;
  if(window.WELCOME_FILM)window.WELCOME_FILM.resume();
  var lines=$$(".welcome-title .headline-line",v);
  gsap.set(v,{opacity:1});
  gsap.set(lines,{yPercent:116,rotation:1.5});
  gsap.set(".welcome-mast,.welcome-accent,.welcome-eyebrow,.welcome-description,.welcome-menu-crest,.welcome-menu-rule,.welcome-menu-under,.welcome-footer",{opacity:0,y:18});
  gsap.set(".welcome-buttons .btn",{opacity:0,y:28});
  var tl=gsap.timeline({defaults:{ease:"power3.out"}});
  tl.fromTo(".welcome-video",{scale:1.12},{scale:1.05,duration:FX.d(3),ease:"power2.out"},0)
    .to(".welcome-mast",{opacity:1,y:0,duration:FX.d(.7)},.15)
    .to(".welcome-accent,.welcome-eyebrow",{opacity:1,y:0,duration:FX.d(.65),stagger:.07},.36)
    .to(lines,{yPercent:0,rotation:0,duration:FX.d(.95),stagger:.15,ease:"expo.out"},.52)
    .to(".welcome-description",{opacity:1,y:0,duration:FX.d(.7)},.96)
    .to(".welcome-menu-crest",{opacity:1,y:0,duration:FX.d(.8)},.48)
    .to(".welcome-menu-rule",{opacity:1,y:0,duration:FX.d(.6)},.88)
    .to(".welcome-buttons .btn",{opacity:1,y:0,duration:FX.d(.62),stagger:.12},1.04)
    .to(".welcome-menu-under,.welcome-footer",{opacity:1,y:0,duration:FX.d(.7),stagger:.07},1.24);
  FX.startAmbient();return tl;
};
/* --- depth transitions between top-level views --- */
FX.out=function(el,dir){return gsap.to(el,{opacity:0,scale:dir>0?1.06:.94,duration:FX.d(.45),ease:"power2.in",transformPerspective:1200,onComplete:function(){el.hidden=true;gsap.set(el,{clearProps:"transform,opacity"})}})};
FX.in=function(el,dir){el.hidden=false;return gsap.fromTo(el,{opacity:0,scale:dir>0?.94:1.06,transformPerspective:1200},{opacity:1,scale:1,duration:FX.d(.7),ease:"expo.out",clearProps:"transform"})};
FX.stagger=function(els,o){o=o||{};if(!els.length)return;gsap.fromTo(els,{opacity:0,y:o.y==null?34:o.y,scale:.96},{opacity:1,y:0,scale:1,duration:FX.d(.6),stagger:{each:FX.reduce?0:(o.each||.035),from:"start"},ease:"power3.out",overwrite:"auto",clearProps:"transform,opacity"})};
FX.reveal=function(portrait){/* masked portrait reveal */
  var i=$("img,.ph",portrait);if(!i)return;gsap.fromTo(portrait,{clipPath:"inset(0 0 100% 0)"},{clipPath:"inset(0 0 0% 0)",duration:FX.d(.8),ease:"power3.inOut",clearProps:"clipPath"});
  gsap.fromTo(i,{scale:1.25},{scale:1,duration:FX.d(1.2),ease:"power2.out"})};
/* FLIP-style continuity: element grows from a source rect into its own place */
FX.flipFrom=function(el,rect){var b=el.getBoundingClientRect();
  return gsap.fromTo(el,{x:rect.left-b.left,y:rect.top-b.top,scaleX:rect.width/b.width,scaleY:rect.height/b.height,transformOrigin:"0 0"},{x:0,y:0,scaleX:1,scaleY:1,duration:FX.d(.85),ease:"expo.inOut",clearProps:"transform"})};
/* --- draggable horizontal track with momentum and snapping --- */
FX.track=function(wrap,track,opts){
  opts=opts||{};var d=Draggable.create(track,{type:"x",bounds:wrap,inertia:true,edgeResistance:.85,minimumMovement:8,dragClickables:true,
    snap:opts.step?{x:function(v){return Math.round(v/opts.step)*opts.step}}:undefined,allowContextMenu:true,
    onPress:function(){d.moved=false;gsap.killTweensOf(track)},onDrag:function(){d.moved=true;opts.onMove&&opts.onMove()},onThrowUpdate:function(){opts.onMove&&opts.onMove()},onThrowComplete:function(){setTimeout(function(){d.moved=false},0)},onRelease:function(){setTimeout(function(){d.moved=false},60)}})[0];
  d.nudge=function(dir){var min=d.minX,max=d.maxX,x=gsap.getProperty(track,"x"),to=Math.max(min,Math.min(max,x+dir*(opts.step||wrap.clientWidth*.7)));
    gsap.to(track,{x:to,duration:FX.d(.7),ease:"power3.out",onUpdate:function(){d.update();opts.onMove&&opts.onMove()}})};
  d.reset=function(){gsap.set(track,{x:0});d.applyBounds(wrap);d.update()};return d};
/* --- 07 closing: archival tags resolve toward the crest --- */
FX.closing=function(names){
  var o=$("#cOrbit");o.innerHTML="";var ch=FX.split($("#cMsg")),W=innerWidth,H=innerHeight,tags=names.map(function(n){var s=document.createElement("span");s.textContent=n;o.appendChild(s);return s});
  gsap.set(".c-logo,.c-sub,.c-core .btn",{opacity:0,y:30});gsap.set(ch,{yPercent:110});
  var tl=gsap.timeline({defaults:{ease:"expo.out"}});
  tags.forEach(function(s,i){var a=Math.random()*Math.PI*2,r=Math.max(W,H)*(.45+Math.random()*.25),end=i/tags.length*Math.PI*2,rr=Math.min(W,H)*(.36+(i%3)*.06);
    gsap.set(s,{x:Math.cos(a)*r,y:Math.sin(a)*r,opacity:0,xPercent:-50,yPercent:-50});
    tl.to(s,{x:Math.cos(end)*rr*1.45,y:Math.sin(end)*rr*.9,opacity:.75,duration:FX.d(2),ease:"power3.out"},i*.03)
      .to(s,{opacity:.14,duration:FX.d(1.2)},1.8)});
  tl.to(".c-logo",{opacity:1,y:0,duration:FX.d(1.2)},.9).to(ch,{yPercent:0,duration:FX.d(1),stagger:.015},1.2).to(".c-sub,.c-core .btn",{opacity:1,y:0,duration:FX.d(.8),stagger:.1},1.9);
  return tl};
})();
