/* AFCSC DAW — navigation, idle return, exit handling. Views register themselves via NAV.register(). */
(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
/* EDIT HERE: kiosk behaviour */
var CONFIG=window.KIOSK_CONFIG={idleSeconds:120,warnSeconds:15};
var NAV=window.NAV={views:{},stack:["welcome"],cur:"welcome",lock:false};
NAV.register=function(n,v){NAV.views[n]=v};
function isOv(n){return NAV.views[n]&&NAV.views[n].overlay}
function wait(tw){return new Promise(function(res){if(tw&&tw.then){tw.then(function(){res()},res)}else res()})}
NAV.chrome=function(){
  var tb=$("#topbar"),show=NAV.cur!=="welcome";
  if(show&&tb.hidden){tb.hidden=false;gsap.fromTo(tb,{y:-60,opacity:0},{y:0,opacity:1,duration:FX.d(.6),clearProps:"transform"})}
  else if(!show&&!tb.hidden){gsap.to(tb,{y:-60,opacity:0,duration:FX.d(.3),onComplete:function(){tb.hidden=true;gsap.set(tb,{clearProps:"all"})}})}
  var under=isOv(NAV.cur)?NAV.stack[NAV.stack.length-2]:NAV.cur;
  $$(".tab").forEach(function(t){if(t.dataset.tab===under)t.setAttribute("aria-current","page");else t.removeAttribute("aria-current")});
  $("#tbBack").hidden=NAV.stack.length<=1;document.body.dataset.view=NAV.cur};
NAV.go=function(name,o){
  o=o||{};var V=NAV.views[name];if(!V||NAV.lock||(name===NAV.cur&&!o.force))return;NAV.lock=true;NAV.touch();
  var unlock=function(){NAV.lock=false};
  if(V.overlay){NAV.stack.push(name);NAV.cur=name;NAV.chrome();wait(V.enter(o,1)).then(unlock);return}
  var dir=o.dir||1,chain=Promise.resolve(),from;
  if(isOv(NAV.cur)){var ov=NAV.views[NAV.cur];chain=chain.then(function(){return wait(ov.leave(-1))});NAV.stack.pop();NAV.cur=NAV.stack[NAV.stack.length-1]}
  from=NAV.cur;
  if(from!==name){
    chain=chain.then(function(){var F=NAV.views[from];return wait(F.leave?F.leave(dir):FX.out(F.el,dir))}).then(function(){
      var i=NAV.stack.indexOf(name);if(name==="welcome")NAV.stack=["welcome"];else if(i>=0)NAV.stack.length=i+1;else if(o.replace&&NAV.stack.length>1)NAV.stack[NAV.stack.length-1]=name;else NAV.stack.push(name);
      NAV.cur=name;NAV.chrome();return wait(V.enter(o,dir))})}
  else{NAV.chrome()}
  chain.then(unlock,function(e){console.error(e);unlock()})};
NAV.back=function(){if(NAV.lock||NAV.stack.length<=1)return;
  if(isOv(NAV.cur)){NAV.lock=true;var ov=NAV.views[NAV.cur];NAV.stack.pop();NAV.cur=NAV.stack[NAV.stack.length-1];NAV.chrome();wait(ov.leave(-1)).then(function(){NAV.lock=false})}
  else NAV.go(NAV.stack[NAV.stack.length-2],{dir:-1})};
NAV.home=function(){if(NAV.cur==="welcome")return;NAV.go("welcome",{dir:-1})};
/* --- exit confirmation (a browser cannot close a kiosk window it did not open; we never pretend it did) --- */
var modal=$("#modal"),mT=$("#mTitle"),mP=$("#mText"),mOk=$("#mOk"),mC=$("#mCancel"),fallback=false,lastFocus=null;
NAV.exit=function(){fallback=false;mT.textContent="Exit the exhibition?";mP.textContent="The exhibition will close. Choose Cancel to keep exploring.";mOk.textContent="Confirm exit";mC.hidden=false;lastFocus=document.activeElement;
  modal.hidden=false;gsap.fromTo(".m-card",{scale:.9,y:30,opacity:0},{scale:1,y:0,opacity:1,duration:FX.d(.45),ease:"expo.out"});mC.focus()};
function closeModal(){modal.hidden=true;if(lastFocus&&lastFocus.focus)lastFocus.focus()}
mC.addEventListener("click",closeModal);
mOk.addEventListener("click",function(){
  if(fallback){closeModal();NAV.home();return}
  try{window.close()}catch(e){}
  setTimeout(function(){ /* still here => the browser refused */
    fallback=true;mT.textContent="Exit is controlled by the kiosk launcher";
    mP.textContent="This display is running in locked kiosk mode, and the browser does not allow a page to close itself. Staff can close it with Alt+F4. The exhibition will now return to the welcome screen.";mC.hidden=true;mOk.textContent="Return to welcome";mOk.focus()},350)});
/* --- idle: warn, then return to welcome; any input resets --- */
var last=Date.now(),idleBar=$("#idlebar"),idleN=$("#idleN"),warning=false;
NAV.touch=function(){last=Date.now();if(warning){warning=false;idleBar.hidden=true}};
["pointerdown","pointermove","keydown","wheel","touchstart"].forEach(function(e){document.addEventListener(e,function(){if(!warning)last=Date.now()},{passive:true})});
$("#idleStay").addEventListener("click",function(){NAV.touch()});
setInterval(function(){
  if(NAV.cur==="welcome"||document.hidden){return}
  var idle=(Date.now()-last)/1000;
  if(idle>=CONFIG.idleSeconds){
    var left=Math.ceil(CONFIG.idleSeconds+CONFIG.warnSeconds-idle);
    if(!warning){warning=true;modal.hidden=true;idleBar.hidden=false;gsap.fromTo(idleBar,{y:40,opacity:0},{y:0,opacity:1,duration:.4})}
    idleN.textContent=Math.max(left,0);
    if(left<=0){warning=false;idleBar.hidden=true;last=Date.now();NAV.home()}}},1000);
/* --- delegated controls --- */
document.addEventListener("click",function(e){
  var g=e.target.closest("[data-go]"),a=e.target.closest("[data-act]");
  if(g){NAV.go(g.dataset.go,{replace:g.classList.contains("tab")});return}
  if(a){var k=a.dataset.act;if(k==="home")NAV.home();else if(k==="back")NAV.back();else if(k==="exit")NAV.exit()}});
document.addEventListener("keydown",function(e){
  if(!modal.hidden){if(e.key==="Escape")closeModal();return}
  var t=e.target;if(t&&t.tagName==="INPUT")return;
  if(e.key==="Escape"&&NAV.stack.length>1)NAV.back();
  var D=NAV.views.detail;if(NAV.cur==="detail"&&D){if(e.key==="ArrowRight")D.step(1);if(e.key==="ArrowLeft")D.step(-1)}});
$("#motionBtn").addEventListener("click",function(){var on=!FX.ambient;if(FX.reduce&&on)return;FX.setAmbient(on);this.setAttribute("aria-pressed",String(FX.ambient))});
NAV.start=function(){NAV.chrome();FX.welcomeIn()};
})();
