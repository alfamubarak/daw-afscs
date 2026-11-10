/* AFCSC DAW — application: archive, detail, timeline, closing, keyboard, boot. */
(function(){
"use strict";
var D=window.DAW_DATA,ALL=D.instructors,BY={};ALL.forEach(function(d){BY[d.id]=d;
  d._h=[d.rank,d.name,d.surname,d.initials,d.specialty,d.specialtyGroup,d.period].join(" ").toLowerCase();d._dec=d.timelineYear?Math.floor(d.timelineYear/10)*10:0});
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var PERIOD_NA="Appointment period not recorded",SHORT={director:"Director",scci:"SC Chief Instructor",jcci:"JC Chief Instructor"};
var DECS=[1970,1980,1990,2000,2010,2020];
/* ---------- shared renderers ---------- */
function mono(d){return ((d.initials||"").charAt(0)+(d.surname||"?").charAt(0)).toUpperCase()}
function ph(d){return '<div class="ph"><svg class="pr" viewBox="0 0 200 200"><g fill="none" stroke="#A8D8F8"><circle cx="100" cy="100" r="30"/><circle cx="100" cy="100" r="55" stroke="#E41F28" stroke-dasharray="2 5"/><circle cx="100" cy="100" r="82"/><path d="M100 0V200M0 100H200" stroke-opacity=".35"/></g></svg><span class="mono">'+esc(mono(d))+'</span><em>Portrait awaiting supply</em></div>'}
function portrait(d){return '<div class="portrait">'+(d.photo?'<img loading="lazy" decoding="async" data-id="'+d.id+'" src="'+esc(d.photo)+'" alt="Portrait of '+esc(d.rank+" "+d.name)+'">':ph(d))+'</div>'}
document.addEventListener("error",function(e){var i=e.target;if(i&&i.tagName==="IMG"&&i.dataset.id){var d=BY[i.dataset.id];d.photo=null;i.parentNode.innerHTML=ph(d)}},true);
function tagOf(d){var ex=d.roles.filter(function(r){return r.confidence==="exact"});if(ex.length)return '<span class="tag">'+esc(SHORT[ex[0].role])+(ex.length>1?" +"+(ex.length-1):"")+'</span>';
  if(d.roles.length)return '<span class="tag">Chronicle match to verify</span>';return d.flags.length?'<span class="tag flag">Record note</span>':""}
function meta(d,fc){return '<div class="meta"><div class="rank">'+esc(d.rank)+'</div><div class="nm">'+esc(d.name)+'</div><div class="pd">'+esc(d.period||PERIOD_NA)+(d.specialty?" · "+esc(d.specialty):"")+'</div>'+tagOf(d)+'</div>'}
function card(d){return '<button type="button" class="card" data-open="'+d.id+'">'+portrait(d)+meta(d)+'</button>'}
/* ---------- ARCHIVE ---------- */
var F={q:"",dec:"all",rank:"all",spec:"all",rec:"all",page:0},res=ALL,fDrag=null,aEl=$("#archive"),aScroll=$("#aScroll"),grid=$("#grid"),savedScroll=0,fBuilt=false;
var RECS=[["all","All records"],["role","Has chronicle role"],["complete","Period recorded"],["open","No end date recorded"],["note","Has record note"]];
function chip(grp,v,label,on){return '<button type="button" class="chip" data-f="'+grp+'" data-v="'+esc(v)+'" aria-pressed="'+(on?"true":"false")+'">'+esc(label)+'</button>'}
function buildFilters(){
  var cnt={};ALL.forEach(function(d){if(d.specialtyGroup)cnt[d.specialtyGroup]=(cnt[d.specialtyGroup]||0)+1});
  $("#fDec").innerHTML=chip("dec","all","All",1)+DECS.map(function(x){return chip("dec",x,x+"s")}).join("")+chip("dec","0","Dates to verify");
  $("#fRank").innerHTML=chip("rank","all","All",1)+["Gp Capt","Wg Cdr","Sqn Ldr"].map(function(r){return chip("rank",r,r)}).join("");
  $("#fRec").innerHTML=RECS.map(function(r,i){return chip("rec",r[0],r[1],!i)}).join("");
  $("#fSpec").innerHTML=chip("spec","all","All specialties",1)+Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]||a<b?-1:1}).map(function(k){return chip("spec",k,k+" · "+cnt[k])}).join("")}
function match(d){
  if(F.dec!=="all"&&String(d._dec)!==String(F.dec))return false;if(F.rank!=="all"&&d.rank!==F.rank)return false;if(F.spec!=="all"&&d.specialtyGroup!==F.spec)return false;
  if(F.rec==="role"&&!d.roles.length)return false;if(F.rec==="complete"&&!(d.periodKind==="range"||d.periodKind==="years"))return false;if(F.rec==="open"&&d.periodKind!=="open")return false;if(F.rec==="note"&&!d.flags.length)return false;
  if(F.q){var t=F.q.toLowerCase().split(/\s+/);for(var i=0;i<t.length;i++)if(d._h.indexOf(t[i])<0)return false}return true}
function pageSize(){var c=getComputedStyle(grid).gridTemplateColumns.split(" ").length||5;return c*3}
function renderArchive(animate){
  res=ALL.filter(match);var ps=pageSize(),pages=Math.max(1,Math.ceil(res.length/ps));F.page=Math.min(F.page,pages-1);
  var slice=res.slice(F.page*ps,F.page*ps+ps);grid.innerHTML=slice.map(card).join("");
  $("#rCount").textContent=(res.length===ALL.length?ALL.length+" records":res.length+" of "+ALL.length+" records");
  var act=[];if(F.q)act.push(["q",'Search: “'+F.q+'”']);if(F.dec!=="all")act.push(["dec",F.dec==="0"?"Dates to verify":F.dec+"s"]);if(F.rank!=="all")act.push(["rank",F.rank]);if(F.spec!=="all")act.push(["spec",F.spec]);if(F.rec!=="all")act.push(["rec",RECS.filter(function(r){return r[0]===F.rec})[0][1]]);
  $("#rActive").innerHTML=act.map(function(a){return '<button type="button" class="chip" data-clear="'+a[0]+'" aria-label="Remove filter '+esc(a[1])+'">'+esc(a[1])+' ✕</button>'}).join("");
  $$(".chip[data-f]").forEach(function(c){c.setAttribute("aria-pressed",String(String(F[c.dataset.f])===c.dataset.v))});
  var em=$("#empty");em.hidden=!!res.length;grid.hidden=!res.length;
  if(!res.length)em.innerHTML='<h4>No instructors match these filters</h4><p>Try a shorter name, a different decade, or clear the filters below. Every record in the roll is still available.</p><div class="w-actions" style="justify-content:center">'+(F.q?'<button class="btn glassy" type="button" data-clear="q">Clear search</button>':"")+'<button class="btn primary" type="button" data-reset>Reset all filters</button></div>';
  var pg=$("#pager");pg.hidden=pages<2;
  pg.innerHTML='<button class="btn glassy sm" type="button" data-pg="first" '+(F.page?"":"disabled")+'>First</button><button class="btn glassy" type="button" data-pg="-1" '+(F.page?"":"disabled")+'><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>Previous</button><span class="lbl">Page '+(F.page+1)+' of '+pages+' · '+(F.page*ps+1)+'–'+Math.min(res.length,F.page*ps+ps)+'</span><button class="btn primary" type="button" data-pg="1" '+(F.page<pages-1?"":"disabled")+'>Next<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button><button class="btn glassy sm" type="button" data-pg="last" '+(F.page<pages-1?"":"disabled")+'>Last</button>';
  if(animate!==false){FX.stagger($$(".card",grid),{each:.03});$$(".card .portrait",grid).slice(0,6).forEach(FX.reveal)}}
function buildFeatured(){
  var tr=$("#fTrack");tr.innerHTML=D.featured.map(function(id){var d=BY[id];return '<button type="button" class="fcard" data-open="'+id+'" data-list="featured">'+portrait(d)+meta(d)+'</button>'}).join("");
  var wrap=$("#fWrap"),cards=$$(".fcard",tr),step=cards[0].offsetWidth+parseFloat(getComputedStyle(tr).columnGap||24);
  function upd(){var wb=wrap.getBoundingClientRect(),c=wb.left+wb.width/2;cards.forEach(function(el){var b=el.getBoundingClientRect(),dd=Math.abs(b.left+b.width/2-c)/wb.width,s=Math.max(.9,1-dd*.14);gsap.set(el,{scale:s,opacity:Math.max(.55,1-dd*.5)})})}
  fDrag=FX.track(wrap,tr,{step:step,onMove:upd});upd();fBuilt=true;
  $("#fPrev").onclick=function(){fDrag.nudge(1)};$("#fNext").onclick=function(){fDrag.nudge(-1)}}
function setF(k,v){F[k]=v;F.page=0;renderArchive();aScroll.scrollTo({top:$("#rollTop").offsetTop-10,behavior:FX.reduce?"auto":"smooth"})}
function resetAll(){F={q:"",dec:"all",rank:"all",spec:"all",rec:"all",page:0};$("#q").value="";renderArchive()}
aEl.addEventListener("click",function(e){
  var c=e.target.closest(".chip[data-f]");if(c){setF(c.dataset.f,c.dataset.v);return}
  var x=e.target.closest("[data-clear]");if(x){var k=x.dataset.clear;F[k]=k==="q"?"":"all";if(k==="q")$("#q").value="";F.page=0;renderArchive();return}
  if(e.target.closest("[data-reset]")||e.target.closest("#reset")){resetAll();return}
  var p=e.target.closest("[data-pg]");if(p){var v=p.dataset.pg,ps=pageSize(),pages=Math.ceil(res.length/ps);F.page=v==="first"?0:v==="last"?pages-1:F.page+ +v;renderArchive();aScroll.scrollTo({top:$("#rollTop").offsetTop-10,behavior:"auto"});return}
  var o=e.target.closest("[data-open]");if(o){if(o.classList.contains("fcard")&&fDrag&&fDrag.moved)return;openFrom(o)}});
var qIn=$("#q"),qT=0;qIn.addEventListener("input",function(){clearTimeout(qT);qT=setTimeout(function(){F.q=qIn.value.trim();F.page=0;renderArchive(true)},180)});
function openFrom(el){var id=el.dataset.open,list;
  if(NAV.cur==="timeline")list=T.list;else if(el.classList.contains("fcard"))list=D.featured.map(function(i){return BY[i]});else list=res;
  savedScroll=aScroll.scrollTop;var r=el.querySelector(".portrait").getBoundingClientRect();
  NAV.go("detail",{id:id,list:list,rect:r,from:NAV.cur})}
/* ---------- ON-SCREEN KEYBOARD ---------- */
var kbd=$("#kbd"),kbdOn=false,ROWS=["qwertyuiop","asdfghjkl","zxcvbnm"];
kbd.innerHTML=ROWS.map(function(r,i){return '<div class="krow">'+r.split("").map(function(c){return '<button type="button" class="key" data-k="'+c+'">'+c+'</button>'}).join("")+(i===2?'<button type="button" class="key w2" data-k="bs" aria-label="Backspace">⌫</button>':"")+'</div>'}).join("")+'<div class="krow"><button type="button" class="key" data-k="-">-</button><button type="button" class="key" data-k="\'">\'</button><button type="button" class="key sp" data-k=" ">space</button><button type="button" class="key w2" data-k="clear">Clear</button><button type="button" class="key go" data-k="done">Done</button></div>';
function kbdShow(on){if(on===kbdOn)return;kbdOn=on;document.body.classList.toggle("kbd-open",on);$("#kbdBtn").setAttribute("aria-label",on?"Hide on-screen keyboard":"Show on-screen keyboard");
  if(on){kbd.hidden=false;gsap.fromTo(kbd,{y:80,opacity:0},{y:0,opacity:1,duration:FX.d(.45),ease:"expo.out"})}else gsap.to(kbd,{y:80,opacity:0,duration:FX.d(.3),onComplete:function(){kbd.hidden=true;gsap.set(kbd,{clearProps:"transform,opacity"})}})}
kbd.addEventListener("pointerdown",function(e){e.preventDefault()});
kbd.addEventListener("click",function(e){var k=e.target.closest(".key");if(!k)return;var v=k.dataset.k;
  if(v==="bs")qIn.value=qIn.value.slice(0,-1);else if(v==="clear")qIn.value="";else if(v==="done"){kbdShow(false);return}else qIn.value+=v;
  qIn.dispatchEvent(new Event("input"))});
$("#kbdBtn").addEventListener("click",function(){kbdShow(!kbdOn);if(kbdOn)qIn.focus({preventScroll:true})});
qIn.setAttribute("inputmode","none");qIn.addEventListener("keydown",function(e){if(e.key==="Enter"){kbdShow(false);qIn.blur()}});
document.addEventListener("pointerdown",function(e){if(e.pointerType==="touch"&&e.target===qIn)setTimeout(function(){kbdShow(true)},0);else if(kbdOn&&!e.target.closest("#kbd,.search"))kbdShow(false)});
/* ---------- DETAIL (overlay) ---------- */
var dEl=$("#detail"),dFrame=$("#dFrame"),dPanel=$("#dPanel"),ctx={list:[],i:0,from:"archive"},dBusy=false;
function secRoles(d){if(!d.roles.length)return '<p class="pending">No matching Director or Chief Instructor entry has been identified in the supplied chronicles.</p>';
  return d.roles.map(function(r){var ex=r.confidence==="exact";return '<div class="role'+(ex?"":" poss")+'"><b>'+esc(r.label)+(ex?"":" — possible match")+'</b><span>Chronicle entry: '+esc((r.rank+" "+r.chronicleName).trim())+' · '+esc(r.period||"period not recorded")+'</span><span>'+esc(r.note)+' (Source: '+esc(r.source)+')</span></div>'}).join("")}
function detailHTML(d){
  var kind={range:"End date recorded",years:"Years recorded",open:"No end date recorded",single:"Single date recorded",unreadable:"Period needs verification",none:"Not recorded"}[d.periodKind];
  var feat=D.featured.indexOf(d.id)>=0?'<span class="tag" style="margin:0 0 1rem">Featured demonstration selection</span>':"";
  return feat+'<div class="rank">'+esc(d.rank)+' · Directing Staff</div><h2>'+esc(d.name)+'</h2>'+
  '<div class="facts"><div class="fact"><small>Recorded appointment</small><b>'+esc(d.period||PERIOD_NA)+'</b></div><div class="fact"><small>Specialty</small><b>'+esc(d.specialty||"Not recorded")+'</b></div><div class="fact"><small>Record status</small><b>'+kind+'</b></div></div>'+
  '<div class="sec"><h3>Profile</h3><p class="pending">'+(d.bio?esc(d.bio):"Profile details awaiting verification.")+'</p></div>'+
  '<div class="sec"><h3>Documented instructional contribution</h3><p class="pending">'+(d.contribution?esc(d.contribution):"No instructional contribution has yet been supplied for verification.")+'</p></div>'+
  (d.quote?'<div class="sec"><h3>Teaching philosophy</h3><p>“'+esc(d.quote)+'”</p></div>':"")+
  '<div class="sec"><h3>Appointments in the DAW chronicles</h3>'+secRoles(d)+'</div>'+
  (d.flags.length?'<div class="sec"><h3>Record notes for verification</h3><ul class="notes">'+d.flags.map(function(f){return "<li>"+esc(f)+"</li>"}).join("")+'</ul></div>':"")+
  '<div class="sec"><p style="color:var(--mute);font-size:1rem">Source: nominal roll of Directing Staff, serial '+d.serial+'. Details are shown as recorded and have not been corrected.</p></div>'}
function fillDetail(){var d=ctx.list[ctx.i];dFrame.innerHTML=portrait(d);dPanel.innerHTML=detailHTML(d);dPanel.scrollTop=0;
  $("#dCount").textContent="Record "+(ctx.i+1)+" of "+ctx.list.length;$("#dBackTo").textContent=ctx.from==="timeline"?"timeline":"archive";
  var multi=ctx.list.length>1;$("#dPrev").hidden=$("#dNext").hidden=!multi}
function sourceRect(){var el=document.querySelector('[data-open="'+ctx.list[ctx.i].id+'"] .portrait');if(!el||el.offsetParent===null)return null;var r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth?r:null}
var detail={el:dEl,overlay:true,
  enter:function(o){ctx.list=o.list;ctx.i=Math.max(0,ctx.list.findIndex(function(x){return x.id===o.id}));ctx.from=o.from;fillDetail();dEl.hidden=false;
    var tl=gsap.timeline({defaults:{ease:"expo.out"}});
    tl.fromTo(".d-back",{opacity:0},{opacity:1,duration:FX.d(.5),ease:"power2.out"},0);
    if(o.rect&&!FX.reduce)tl.add(FX.flipFrom(dFrame,o.rect),0);else tl.fromTo(dFrame,{opacity:0,scale:.92},{opacity:1,scale:1,duration:FX.d(.7)},0);
    tl.fromTo(dPanel,{opacity:0,x:80,rotateY:-8,transformPerspective:1400},{opacity:1,x:0,rotateY:0,duration:FX.d(.9),clearProps:"transform,opacity"},.25)
      .fromTo(dPanel.children,{opacity:0,y:26},{opacity:1,y:0,duration:FX.d(.6),stagger:.06,clearProps:"transform,opacity"},.45)
      .fromTo(".d-bar",{opacity:0,y:50},{opacity:1,y:0,duration:FX.d(.6),clearProps:"transform,opacity"},.5);return tl},
  leave:function(){var r=sourceRect(),tl=gsap.timeline({defaults:{ease:"power3.inOut"},onComplete:function(){dEl.hidden=true;gsap.set([dFrame,dPanel,".d-bar",".d-back"],{clearProps:"all"});if(NAV.cur==="archive")aScroll.scrollTop=savedScroll}});
    tl.to(dPanel,{opacity:0,x:60,duration:FX.d(.35)},0).to(".d-bar",{opacity:0,y:40,duration:FX.d(.3)},0);
    if(r&&!FX.reduce){var b=dFrame.getBoundingClientRect();tl.to(dFrame,{x:r.left-b.left,y:r.top-b.top,scaleX:r.width/b.width,scaleY:r.height/b.height,transformOrigin:"0 0",duration:FX.d(.6)},0)}else tl.to(dFrame,{opacity:0,scale:.92,duration:FX.d(.4)},0);
    tl.to(".d-back",{opacity:0,duration:FX.d(.4)},.2);return tl},
  step:function(dir){if(dBusy||ctx.list.length<2)return;dBusy=true;NAV.touch();
    gsap.timeline({onComplete:function(){dBusy=false}}).to([dPanel,dFrame],{opacity:0,x:-60*dir,duration:FX.d(.25),ease:"power2.in"})
      .add(function(){ctx.i=(ctx.i+dir+ctx.list.length)%ctx.list.length;fillDetail();FX.reveal(dFrame)})
      .fromTo([dPanel,dFrame],{opacity:0,x:60*dir},{opacity:1,x:0,duration:FX.d(.5),ease:"expo.out",clearProps:"transform,opacity"})}};
$("#dPrev").addEventListener("click",function(){detail.step(-1)});$("#dNext").addEventListener("click",function(){detail.step(1)});
/* ---------- TIMELINE ---------- */
var T={dec:1980,year:null,list:[],shown:0,drag:null,cur:1980},tEl=$("#timeline"),tTrack=$("#tTrack"),CHUNK=60;
/* Gentle archival auto-glide. A GSAP ticker keeps the manual Draggable, arrows,
   timeline progress, and automatic movement in one shared coordinate system.
   It does not affect any other kiosk view. */
var PAN={enabled:!FX.reduce,direction:-1,speed:24,until:0,holding:false,hovering:false,installed:false};
function panDefer(ms){PAN.until=Math.max(PAN.until,performance.now()+(ms||6000))}
function panLabel(){
  var b=$("#tAuto"),l=$("#tAutoLabel");if(!b||!l)return;
  b.setAttribute("aria-pressed",String(PAN.enabled));
  b.disabled=!!FX.reduce;
  b.setAttribute("aria-label",PAN.enabled?"Pause automatic timeline movement":"Resume automatic timeline movement");
  l.textContent=PAN.enabled?"AUTO-GLIDE ON":"AUTO-GLIDE OFF";
  b.classList.toggle("is-running",PAN.enabled&&!FX.reduce);
}
function panTick(time,deltaMs){
  if(!PAN.enabled||!FX.ambient||FX.reduce||PAN.holding||PAN.hovering||!T.drag||
     NAV.cur!=="timeline"||NAV.lock||document.hidden||tEl.hidden||
     !$("#modal").hidden||!$("#idlebar").hidden||performance.now()<PAN.until||
     T.drag.isPressed||T.drag.isDragging||T.drag.isThrowing||
     (T.drag.tween&&T.drag.tween.isActive&&T.drag.tween.isActive()))return;
  var wrap=$("#tWrap"),min=Math.min(0,T.drag.minX||0),max=Math.max(0,T.drag.maxX||0);
  if(max-min<5)return;
  var x=Number(gsap.getProperty(tTrack,"x"))||0;
  /* Gentle automatic continuation beyond the initial 60-record batch. */
  if(PAN.direction<0&&x<=min+2){
    if(T.shown<T.list.length){tMore();panDefer(900);return}
    PAN.direction=1;panDefer(1350);return;
  }
  if(PAN.direction>0&&x>=max-2){PAN.direction=-1;panDefer(1350);return}
  var dx=PAN.direction*PAN.speed*Math.min(Math.max(deltaMs||16,0),55)/1000;
  var next=Math.max(min,Math.min(max,x+dx));
  gsap.set(tTrack,{x:next});T.drag.update();tProgress();
}
function panInstall(){
  if(PAN.installed)return;PAN.installed=true;
  var auto=$("#tAuto"),wrap=$("#tWrap");
  auto.addEventListener("click",function(){PAN.enabled=!PAN.enabled;panDefer(900);panLabel()});
  tEl.addEventListener("pointerdown",function(){PAN.holding=true;panDefer(6500)},true);
  ["pointerup","pointercancel"].forEach(function(ev){window.addEventListener(ev,function(){
    if(PAN.holding){PAN.holding=false;panDefer(6500)}
  },{passive:true})});
  tEl.addEventListener("wheel",function(){panDefer(6500)},{passive:true});
  tEl.addEventListener("keydown",function(){panDefer(6500)});
  wrap.addEventListener("pointerenter",function(e){if(e.pointerType==="mouse")PAN.hovering=true});
  wrap.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse"){PAN.hovering=false;panDefer(1500)}});
  gsap.ticker.add(panTick);panLabel();
  window.DAW_TIMELINE_GLIDE={get enabled(){return PAN.enabled},get speed(){return PAN.speed},get direction(){return PAN.direction}};
}

function tCount(dec){return ALL.filter(function(d){return d._dec===dec}).length}
function tProgress(){
  var wrap=$("#tWrap"), track=tTrack, scrollable=Math.max(0,track.scrollWidth-wrap.clientWidth);
  var x=Math.max(0,Math.min(scrollable,-(Number(gsap.getProperty(track,"x"))||0)));
  var pct=scrollable?100*x/scrollable:100;
  $("#tJourneyProgress").style.width=pct.toFixed(2)+"%";
  $("#tL").disabled=x<2;
  $("#tR").disabled=scrollable-x<2;
}
function tBuild(){
  $("#tDecs").innerHTML=DECS.map(function(x){return '<button type="button" class="dec" data-dec="'+x+'" aria-pressed="false">'+x+'s<small>'+tCount(x)+' records</small></button>'}).join("")+'<button type="button" class="dec" data-dec="0" aria-pressed="false">Dates to verify<small>'+tCount(0)+' to verify</small></button>';
  T.drag=FX.track($("#tWrap"),tTrack,{onMove:tProgress});
  panInstall();
  $("#tWrap").addEventListener("pointerdown",function(){tEl.classList.add("is-dragging")});
  ["pointerup","pointercancel","pointerleave"].forEach(function(type){$("#tWrap").addEventListener(type,function(){tEl.classList.remove("is-dragging")})});
}
function tSet(dec,year,quick){
  panDefer(1700);PAN.direction=-1;
  T.dec=dec;T.year=year;var all=ALL.filter(function(d){return d._dec===dec});T.list=all.filter(function(d){return !year||d.timelineYear===year}).sort(function(a,b){return(a.timelineYear||0)-(b.timelineYear||0)||a.serial-b.serial});
  $$(".dec").forEach(function(b){b.setAttribute("aria-pressed",String(+b.dataset.dec===dec))});
  var Y=$("#tYears");Y.hidden=!dec;if(dec){var h=chipY("all","All of the "+dec+"s",!year);for(var i=0;i<10;i++){h+=chipY(dec+i,dec+i,year===dec+i)}Y.innerHTML=h}
  /* indicator */
  var big=$("#tBig"),unit=$("#tUnit"),target=dec?(year||dec):null;
  if(target){unit.textContent=year?"":"s";var o={v:T.cur};T.cur=target;if(T.tw)T.tw.kill();T.tw=gsap.to(o,{v:target,duration:FX.d(quick?.01:.9),ease:"power3.inOut",onUpdate:function(){big.textContent=Math.round(o.v)},onComplete:function(){big.textContent=target}})}else{big.textContent="—";unit.textContent=""}
  gsap.to("#tProg",{width:(dec?((year||dec)-1970+(year?0:0))/55*100:100)+"%",duration:FX.d(.8),ease:"power3.out"});
  var g={};T.list.forEach(function(d){if(d.specialtyGroup)g[d.specialtyGroup]=(g[d.specialtyGroup]||0)+1});var top=Object.keys(g).sort(function(a,b){return g[b]-g[a]}).slice(0,3).map(function(k){return k+" "+g[k]}).join(" · ");
  $("#tSub").textContent=dec?T.list.length+" Directing Staff record"+(T.list.length===1?"":"s")+" with appointments beginning "+(year?"in "+year:"in the "+dec+"s")+(top?" · Largest groups: "+top:""):"Records whose appointment dates need verification before they can be placed on the timeline.";
  T.shown=0;tTrack.innerHTML="";tMore();T.drag.reset();tProgress();
  $("#tGalleryCount").textContent=T.list.length+" RECORD"+(T.list.length===1?"":"S")+" IN VIEW · "+(T.year||(!T.dec?"DATES TO VERIFY":T.dec+"s"));
  if(!FX.reduce){
    gsap.fromTo($$(".t-event-card",tTrack).slice(0,9),{opacity:0,y:25,rotateX:7},{opacity:1,y:0,rotateX:0,duration:FX.d(.68),stagger:.055,ease:"power3.out",clearProps:"transform,opacity"});
    gsap.fromTo($$(".t-axis-year.major",tTrack).slice(0,10),{opacity:0,y:10},{opacity:1,y:0,duration:FX.d(.7),stagger:.065,clearProps:"transform,opacity"});
  }
}
function chipY(v,l,on){return '<button type="button" class="chip" data-year="'+v+'" aria-pressed="'+on+'">'+l+'</button>'}
function tEvent(d,i){
  var major=i===0 || T.list[i-1].timelineYear!==d.timelineYear;
  var label=d.timelineYear?String(d.timelineYear):"—";
  var period=d.period||PERIOD_NA;
  var tag=tagOf(d);
  return '<article class="t-event'+(major?" is-milestone":"")+'" data-t-year="'+esc(label)+'">'+
    '<button type="button" class="t-event-card tcard" data-open="'+esc(d.id)+'" aria-label="Open '+esc(d.rank+' '+d.name)+', '+esc(period)+'">'+
       '<span class="t-card-num">ARCHIVE / '+String(d.serial).padStart(3,"0")+'</span>'+
       '<div class="t-card-inner">'+portrait(d)+'<div class="t-card-copy"><span class="t-rank">'+esc(d.rank)+'</span><span class="t-name">'+esc(d.name)+'</span>'+
       '<span class="t-period">'+esc(period)+'</span>'+(d.specialty?'<span class="t-specialty">'+esc(d.specialty)+'</span>':"")+'</div></div>'+
       (tag?'<div class="t-card-tag">'+tag+'</div>':"")+
       '<span class="t-card-action" aria-hidden="true">VIEW RECORD <b>↗</b></span></button>'+
    '<div class="t-axis-pin" aria-hidden="true"><i></i></div>'+
    (major?'<span class="t-axis-year major" aria-hidden="true">'+esc(label)+'</span>':'<span class="t-axis-year minor" aria-hidden="true">'+String(i+1).padStart(2,"0")+'</span>')+
  '</article>';
}
function tMore(){var m=tTrack.querySelector(".t-more");if(m)m.remove();var next=T.list.slice(T.shown,T.shown+CHUNK),start=T.shown;T.shown+=next.length;
  tTrack.insertAdjacentHTML("beforeend",next.map(function(d,i){return tEvent(d,start+i)}).join(""));
  if(!T.list.length)tTrack.innerHTML='<div class="t-more t-empty"><span>ARCHIVE NOTE</span><strong>No records begin in this year.</strong><p>Select another year or decade to explore its recorded appointments.</p></div>';
  if(T.shown<T.list.length)tTrack.insertAdjacentHTML("beforeend",'<div class="t-more"><span>CONTINUE EXPLORING</span><button class="btn glassy" type="button" data-more>Load '+Math.min(CHUNK,T.list.length-T.shown)+' more records ↗</button></div>');
  if(T.drag){T.drag.applyBounds($("#tWrap"));T.drag.update();tProgress()}}
tEl.addEventListener("click",function(e){
  var d=e.target.closest("[data-dec]");if(d){tSet(+d.dataset.dec,null);return}
  var y=e.target.closest("[data-year]");if(y){tSet(T.dec,y.dataset.year==="all"?null:+y.dataset.year);return}
  if(e.target.closest("[data-more]")){tMore();return}
  var o=e.target.closest("[data-open]");if(o&&!(T.drag&&T.drag.moved)){openFrom(o)}});
function stepDec(n){var order=DECS.concat([0]),i=order.indexOf(T.dec);tSet(order[(i+n+order.length)%order.length],null)}
$("#tPrevDec").onclick=function(){stepDec(-1)};$("#tNextDec").onclick=function(){stepDec(1)};$("#tL").onclick=function(){T.drag.nudge(1)};$("#tR").onclick=function(){T.drag.nudge(-1)};
/* ---------- welcome background film: self-contained, touch-safe, silent ---------- */
(function(){
  var video=$("#welcomeVideo"),button=$("#welcomeMotion"),label=$("#welcomeMotionLabel"),progress=$("#filmProgress"),manuallyPaused=false;
  function updateButton(){var paused=video.paused;button.setAttribute("aria-pressed",String(paused));button.setAttribute("aria-label",paused?"Play background video":"Pause background video");label.textContent=paused?"Play film":"Pause film"}
  function play(){var promise=video.play();if(promise&&promise.catch)promise.catch(function(){updateButton()});updateButton()}
  function pause(){video.pause();updateButton()}
  button.addEventListener("click",function(e){e.stopPropagation();manuallyPaused=!video.paused;if(manuallyPaused)pause();else play()});
  /* Menu-like touchscreen selections: subtle active line, no accidental activation. */
  var menuOptions=$$(".welcome-buttons .welcome-option");
  function highlightMenu(b){menuOptions.forEach(function(x){x.classList.toggle("is-selected",x===b)})}
  menuOptions.forEach(function(b){
    b.addEventListener("pointerenter",function(e){if(e.pointerType==="mouse")highlightMenu(b)});
    b.addEventListener("focus",function(){highlightMenu(b)});
    b.addEventListener("pointerdown",function(){highlightMenu(b)});
  });
  $("#welcome").addEventListener("pointerleave",function(e){if(e.pointerType==="mouse"&&document.activeElement!==menuOptions[0]&&document.activeElement!==menuOptions[1])highlightMenu(null)});
  document.addEventListener("keydown",function(e){
    if(NAV.cur!=="welcome"||e.altKey||e.ctrlKey||e.metaKey||!(["ArrowDown","ArrowUp"].includes(e.key)))return;
    if(document.activeElement===$("#welcomeMotion"))return;
    e.preventDefault();var n=menuOptions.indexOf(document.activeElement);var next=(n+(e.key==="ArrowDown"?1:-1)+menuOptions.length)%menuOptions.length;
    if(n===-1)next=e.key==="ArrowDown"?0:menuOptions.length-1;
    menuOptions[next].focus();
  });
  /* Tactile press/release spring on the two primary museum routes. */
  $$(".welcome-buttons .btn").forEach(function(b){
    b.addEventListener("pointerdown",function(){gsap.to(b,{scale:.955,duration:FX.d(.13),ease:"power2.out",overwrite:"auto"})});
    ["pointerup","pointercancel","pointerleave"].forEach(function(type){
      b.addEventListener(type,function(){gsap.to(b,{scale:1,duration:FX.d(.45),ease:"back.out(2.2)",overwrite:"auto"})})
    });
  });
  video.addEventListener("timeupdate",function(){if(video.duration&&isFinite(video.duration))progress.style.width=Math.min(100,video.currentTime/video.duration*100).toFixed(2)+"%"},{passive:true});
  video.addEventListener("play",updateButton);video.addEventListener("pause",updateButton);
  document.addEventListener("visibilitychange",function(){if(document.hidden){video.pause()}else if(NAV.cur==="welcome"&&!manuallyPaused&&!FX.reduce){play()}});
  var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce){manuallyPaused=true;video.pause()}
  window.WELCOME_FILM={resume:function(){if(!manuallyPaused&&!document.hidden)play()},pauseForNavigation:function(){video.pause()},get state(){return video.paused?"paused":"playing"}};
  updateButton();
})();
/* ---------- view registration ---------- */
var closingNames=function(){var a=ALL.slice().sort(function(){return Math.random()-.5}).slice(0,26);return a.map(function(d){return d.rank+" "+d.surname})};
NAV.register("welcome",{el:$("#welcome"),enter:function(o,dir){
  gsap.set(".welcome-video",{scale:1.05});
  if(window.WELCOME_FILM)window.WELCOME_FILM.resume();
  var t=FX.in($("#welcome"),dir);
  gsap.fromTo(".welcome-story",{y:20,opacity:.78},{y:0,opacity:1,duration:FX.d(.75),ease:"power3.out",clearProps:"transform,opacity"});
  return t;
},leave:function(dir){
  var el=$("#welcome");
  return gsap.timeline({onComplete:function(){
    el.hidden=true;
    if(window.WELCOME_FILM)window.WELCOME_FILM.pauseForNavigation();
    gsap.set(el,{clearProps:"transform,opacity"});
    gsap.set(".welcome-story,.welcome-mast,.welcome-footer,.welcome-video",{clearProps:"transform,opacity"});
  }})
  .to(".welcome-story",{opacity:0,y:-18,duration:FX.d(.32),ease:"power2.in"},0)
  .to(".welcome-mast,.welcome-footer",{opacity:0,duration:FX.d(.3)},0)
  .to(".welcome-video",{scale:1.10,duration:FX.d(.62),ease:"power2.inOut"},0)
  .to(el,{opacity:0,duration:FX.d(.43)},.14);
}});
NAV.register("archive",{el:aEl,enter:function(o,dir){var t=FX.in(aEl,dir);aEl.style.display="";
  if(!fBuilt)buildFeatured();else{fDrag.update()}renderArchive(true);
  gsap.fromTo(".a-side",{x:-60,opacity:0},{x:0,opacity:1,duration:FX.d(.8),clearProps:"transform,opacity"});gsap.fromTo(".a-head > *",{y:30,opacity:0},{y:0,opacity:1,duration:FX.d(.7),stagger:.08,clearProps:"transform,opacity"});
  gsap.fromTo(".fcard",{x:120,opacity:0},{x:0,opacity:function(i,el){return 1},duration:FX.d(.9),stagger:.06,delay:.2,onComplete:function(){fDrag.update();fDrag.dispatchEvent&&0;}});
  return t},leave:function(dir){kbdShow(false);return FX.out(aEl,dir)}});
NAV.register("timeline",{el:tEl,enter:function(o,dir){var t=FX.in(tEl,dir);if(!T.drag)tBuild();tSet(T.dec,T.year);panDefer(2300);
  gsap.fromTo(".t-top,.t-rail,.t-utility",{y:-18,opacity:0},{y:0,opacity:1,duration:FX.d(.78),stagger:.09,ease:"expo.out",clearProps:"transform,opacity"});
  gsap.fromTo(".t-stage,.t-footer",{opacity:0,y:24},{opacity:1,y:0,duration:FX.d(.8),delay:FX.d(.17),stagger:.10,clearProps:"transform,opacity"});
  return t}});
NAV.register("closing",{el:$("#closing"),enter:function(o,dir){var t=FX.in($("#closing"),dir);FX.closing(closingNames());return t}});
NAV.register("detail",detail);
/* ---------- boot: preloader progress reflects real readiness ---------- */
function boot(){
  buildFilters();FX.pointerFX();FX.parallax();
  var img=$(".pl-logo img"),tasks=[
    ["typefaces",Promise.all(['500 1em "Cormorant Garamond"','italic 500 1em "Cormorant Garamond"','600 1em "Barlow Condensed"','400 1em Barlow','600 1em Barlow'].map(function(f){return document.fonts.load(f)}))],
    ["crest",img.decode?img.decode():new Promise(function(r){img.onload=r})],
    ["backdrop",new Promise(function(r){var i=new Image();i.onload=i.onerror=r;i.src="assets/images/backgrounds/flightpaths.svg"})],
    ["archive data",Promise.resolve(ALL.length?1:Promise.reject())],
    ["motion engine",Promise.resolve(window.gsap&&window.Draggable?1:Promise.reject())],
    ["interface",document.readyState==="complete"?Promise.resolve():new Promise(function(r){addEventListener("load",r)})]],n=0,pl=FX.preloader(function(){NAV.start()});
  pl.progress(0,tasks.length);
  tasks.forEach(function(t){var fin=function(){n++;pl.progress(n,tasks.length,t[0])};Promise.resolve(t[1]).then(fin,fin)});
  setTimeout(function(){if(n<tasks.length){n=tasks.length;pl.progress(n,n)}},8000);
  $("#welcome").addEventListener("click",function(e){if(!e.target.closest("button"))NAV.go("archive")})}
boot();
})();
