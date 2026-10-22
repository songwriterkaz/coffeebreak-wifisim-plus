// Coffeebreak WifiSIM extras. Adds SIM features on top of the original working phone. Calling code is untouched.
(function(){'use strict';
var KIND=window.CBSIM_KIND,PRE=KIND==='lite'?'cbl_':'cb_',$=function(s){return document.querySelector(s)};
var g=function(k,d){try{var v=localStorage.getItem('cbsim_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},p=function(k,v){try{localStorage.setItem('cbsim_'+k,JSON.stringify(v))}catch(e){}};
function me(){try{return JSON.parse(localStorage.getItem(PRE+'num'))}catch(e){return null}}
function base(){var h=location.host;return /^http/.test(location.protocol)&&!/itch\.zone|hwcdn|itch\.io|localhost/.test(h)?location.origin+location.pathname:(KIND==='lite'?'https://songwriterkaz.github.io/coffeebreak-wifisim-lite-plus/':'https://songwriterkaz.github.io/coffeebreak-wifisim-plus/')}
function link(){return base()+'?add='+me()}
var esc=function(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var css=document.createElement('style');css.textContent=
'#simbar{position:sticky;top:0;z-index:5;background:linear-gradient(135deg,#f8bbd0,#e91e63);color:#fff;margin:0 -14px 10px;padding:10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 6px #0003}'+
'#simbar .chip{width:46px;height:34px;border-radius:7px;background:linear-gradient(135deg,#ffe082,#c8a24a);position:relative;flex:none;box-shadow:inset 0 0 0 2px #8d6e2a}#simbar .chip:before{content:"";position:absolute;inset:8px 4px;border-top:2px solid #8d6e2a;border-bottom:2px solid #8d6e2a}'+
'#simbar img{width:40px;height:40px;border-radius:8px;background:#fff}#simword{font-size:20px;font-weight:800}#simword.off{color:#3b2417}'+
'.sbtn{border:0;border-radius:18px;font-size:22px;font-weight:800;color:#fff;padding:18px 8px;cursor:pointer;width:100%}'+
'#simrow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0}#simconn{background:#2e7d32;font-size:26px;padding:22px;margin:4px 0}'+
'#simmute{background:#6b4226}#simmute.on{background:#c62828}#simpause{background:#6b4226}#simpause.on{background:#ef6c00}'+
'#simbook{background:#fff;border:3px solid #f48fb1;border-radius:16px;padding:8px 10px;margin:8px 0;color:#3b2417}#simbook h3{margin:4px 0 6px;font-size:18px}'+
'#simbook button{display:flex;justify-content:space-between;width:100%;border:0;background:#fff4ec;border-radius:12px;padding:14px;font-size:19px;margin:4px 0;cursor:pointer;color:#3b2417}'+
'#simov,#simname{position:fixed;inset:0;z-index:40;background:#fff4ec;color:#3b2417;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:16px;overflow:auto}#simov.show,#simname.show{display:flex}'+
'#simqr{background:#fff;padding:14px;border-radius:16px;margin:10px auto;display:flex;justify-content:center;align-items:center}#simqr img,#simqr canvas{width:min(78vw,60vh,420px)!important;height:auto!important;display:block}'+
'#simcode{font-size:44px;font-weight:900;letter-spacing:8px;color:#e91e63}#simin,#simnm{font-size:26px;padding:14px;border:3px solid #f48fb1;border-radius:14px;width:min(90vw,380px);text-align:center;margin:8px 0}'+
'#simov .sbtn,#simname .sbtn{max-width:400px;margin:6px 0}#simfoot{font-size:12px;opacity:.8;text-align:center;margin:18px 0 6px}'+
'#simsink{font-size:17px;padding:10px;border-radius:12px;border:2px solid #f48fb1;width:100%;margin:6px 0}'+
'@media (min-width:700px){body{max-width:760px!important;font-size:20px}#simrow{grid-template-columns:1fr 1fr 1fr 1fr}#simrow #simconn{grid-column:span 2}}'+
'@media (min-width:1000px) and (orientation:landscape){body{max-width:980px!important}}';
document.head.appendChild(css);
// header bar
var bar=document.createElement('div');bar.id='simbar';bar.innerHTML='<div class="chip" aria-hidden="true"></div><img src="logo.png" alt="Coffeebreak"><div><div style="font-size:13px">Coffeebreak WifiSIM'+(KIND==='lite'?' Lite':'')+'</div><div id="simword" class="off">Turning on your WifiSIM</div><div id="simwho" style="font-size:14px"></div></div>';
document.body.insertBefore(bar,document.body.firstChild);
// controls
var box=document.createElement('div');box.innerHTML='<button class="sbtn" id="simconn">📱 Connect a phone</button><div id="simrow"><button class="sbtn" id="simmute">🎤 Mute</button><button class="sbtn" id="simpause">⏸ Pause calls</button></div>'+
'<select id="simsink" aria-label="Sound output" style="display:none"></select><button class="sbtn" id="simhome" style="background:#ad1457;font-size:18px;padding:12px;display:none">➕ Add to Home Screen</button><div id="simhint" style="display:none;font-size:15px;margin:6px 0"></div>'+
'<div id="simbook"><h3>📒 Phone book</h3><div id="simlist"></div></div>';
bar.after(box);
var foot=document.createElement('p');foot.id='simfoot';foot.textContent='© Karen O\u2019Brien (Coffeebreak). All designs, music, art and content remain the property of Karen O\u2019Brien. Your purchase gives you a personal-use licence only. It doesn\u2019t transfer ownership or allow resale, copying or redistribution.';document.body.appendChild(foot);
var ov=document.createElement('div');ov.id='simov';ov.setAttribute('role','dialog');ov.innerHTML='<img src="logo.png" alt="" style="width:60px;border-radius:10px;background:#fff"><h2 style="margin:6px">Scan to connect</h2><div id="simqr"></div><div>Or type this code on the other phone</div><div id="simcode">......</div>'+
'<input id="simin" inputmode="numeric" maxlength="6" placeholder="Their 6-digit code"><button class="sbtn" id="simgo" style="background:#e91e63">Connect</button><div id="simst" style="font-weight:800;min-height:28px;font-size:20px"></div><button class="sbtn" id="simx" style="background:#6b4226">Close</button>';document.body.appendChild(ov);
var nm=document.createElement('div');nm.id='simname';nm.innerHTML='<div class="chip" style="width:90px;height:66px;border-radius:12px;background:linear-gradient(135deg,#ffe082,#c8a24a)"></div><img src="logo.png" alt="Coffeebreak" style="width:90px;border-radius:14px;background:#fff;margin:10px"><h1 style="margin:4px">Coffeebreak WifiSIM</h1><p style="font-size:20px">Type your name. That is all.</p><input id="simnm" autocomplete="name" placeholder="Your name"><button class="sbtn" id="simnmgo" style="background:#e91e63">Turn on my WifiSIM</button>';document.body.appendChild(nm);
// name only
function setName(n){p('name',n);try{if(KIND==='full'){localStorage.setItem('cb_myname',JSON.stringify(n));window.__cb&&window.__cb.setName(n)}}catch(e){}}
if(!g('name','')){nm.classList.add('show');setTimeout(function(){$('#simnm').focus()},300)}
$('#simnmgo').onclick=function(){var v=$('#simnm').value.trim();if(!v)return $('#simnm').focus();setName(v);nm.classList.remove('show');word()};
$('#simnm').addEventListener('keydown',function(e){if(e.key==='Enter')$('#simnmgo').click()});
// status words
function online(){if(KIND==='lite')return !!(window.__lite&&window.__lite.ready());return !!(window.__cb&&window.__cb.state().ready)}
var lastOn=0;function word(){var now=Date.now(),real=online();if(real)lastOn=now;var on=real||(lastOn&&now-lastOn<4000&&navigator.onLine!==false),w=$('#simword');w.textContent=on?'Your WifiSIM is on':(navigator.onLine===false?'No internet. Waiting for wifi or data':'Turning on your WifiSIM');w.className=on?'':'off';
 $('#simwho').textContent=(g('name','')?g('name','')+'  ·  ':'')+(me()||'')}
setInterval(word,100);(function(){var e=document.getElementById('st');if(e)new MutationObserver(word).observe(e,{childList:true,characterData:true,subtree:true})})();
// phone book
function book(){return g('book',[])}
function add(num,name){if(!num||num===me()||!/^CB-\d{4}-\d{4}$/.test(num))return;var b=book(),c=b.find(function(x){return x.num===num});if(!c){b.unshift({num:num,name:name||num,t:Date.now()})}else if(name&&c.name===c.num){c.name=name}else return;p('book',b);draw()}
function draw(){var b=book();if(KIND==='full'&&window.__cb){try{window.__cb.contacts().forEach(function(c){if(/^CB-/.test(c.num)&&!b.some(function(x){return x.num===c.num}))b.push({num:c.num,name:c.name})})}catch(e){}}
 $('#simlist').innerHTML=b.length?b.slice(0,40).map(function(c){return '<button data-n="'+esc(c.num)+'"><b>'+esc(c.name)+'</b><span>📞</span></button>'}).join(''):'<div style="font-size:15px;opacity:.8">People you call, or who connect with you, save here by themselves.</div>'}
$('#simlist').addEventListener('click',function(e){var b=e.target.closest('[data-n]');if(b)callNum(b.dataset.n)});
var callNumLast='';function callNum(n){callNumLast=n;if(KIND==='lite'){var t=$('#to');t.value=n;t.dispatchEvent(new Event('input'));$('#bcall').click()}else if(window.__cb){window.__cb.startCall(n,false)}}
// learn people from the original app
setInterval(function(){try{if(KIND==='lite'){var m=window.__lite.msgs();Object.keys(m).forEach(function(n){add(n)});var t=$('#to')&&$('#to').value;if(/^CB-\d{4}-\d{4}$/.test(t||''))add(t)}else draw()}catch(e){}},2000);
(function(){var w=$('#cwho');if(w)new MutationObserver(function(){if(/^CB-\d{4}-\d{4}$/.test(w.textContent))add(w.textContent)}).observe(w,{subtree:true,childList:true,characterData:true})})();
var q=new URLSearchParams(location.search).get('add');if(q)add(q.toUpperCase());
// mute: capture the call microphone stream without changing call code
var streams=[],muted=false;if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){var gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=function(c){return gum(c).then(function(s){streams.push(s);if(muted)s.getAudioTracks().forEach(function(t){t.enabled=false});return s})}}
$('#simmute').onclick=function(){muted=!muted;streams.forEach(function(s){s.getAudioTracks().forEach(function(t){t.enabled=!muted})});this.classList.toggle('on',muted);this.textContent=muted?'🔇 Muted':'🎤 Mute'};
// pause: decline incoming calls while paused
var paused=g('paused',false);function pz(){var b=$('#simpause');b.classList.toggle('on',paused);b.textContent=paused?'▶ Calls paused':'⏸ Pause calls'}pz();
$('#simpause').onclick=function(){paused=!paused;p('paused',paused);pz()};
function decline(){if(!paused)return;var st=$('#cstate'),a=$('#ans');if(st&&a&&a.style.display!=='none'&&/Incoming/.test(st.textContent||'')){var d=$('#dec')||$('#hang');if(d&&d.onclick)d.onclick()}}
(function(){var st=$('#cstate');if(st)new MutationObserver(decline).observe(st,{childList:true,characterData:true,subtree:true})})();setInterval(decline,250);
// status line so a caller can learn this phone has paused calls
var sp=null;function statusPeer(){var n=me();if(!n||!window.Peer||(sp&&!sp.destroyed&&!sp.disconnected))return;try{if(sp)sp.destroy()}catch(e){}
 try{sp=new Peer('cbsimst-'+n.replace(/-/g,''),{config:window.__ICE||{iceServers:[{urls:'stun:stun.l.google.com:19302'}]}});sp.on('connection',function(c){c.on('open',function(){c.send({paused:paused})})});sp.on('error',function(){})}catch(e){}}
setInterval(statusPeer,5000);setTimeout(statusPeer,800);
var asked='';function tell(){var t='They have paused calls, try later';var end=Date.now()+4000;(function f(){var st=$('#cstate');if(st&&st.textContent!==t)st.textContent=t;['#err','#errbar'].forEach(function(s){var e=$(s);if(e&&e.offsetParent!==null&&/not online|declined|Declined|hung up/i.test(e.textContent))e.textContent=t});if(Date.now()<end)setTimeout(f,100)})()}
var pcache={},quiet=false;function poll(){book().slice(0,10).forEach(function(c){quiet=true;askQ(c.num)})}
function askQ(n){if(!window.Peer)return;try{var tp=new Peer({config:window.__ICE||{iceServers:[{urls:'stun:stun.l.google.com:19302'}]}});tp.on('open',function(){var c=tp.connect('cbsimst-'+n.replace(/-/g,''),{serialization:'json'});c.on('data',function(d){pcache[n]={p:!!(d&&d.paused),t:Date.now()};setTimeout(function(){tp.destroy()},300)})});tp.on('error',function(){});setTimeout(function(){try{tp.destroy()}catch(e){}},8000)}catch(e){}}
setInterval(poll,8000);setTimeout(poll,2000);
var pcache={};function askQ(n){if(!window.Peer)return;try{var tp=new Peer({config:window.__ICE||{iceServers:[{urls:'stun:stun.l.google.com:19302'}]}});tp.on('open',function(){var c=tp.connect('cbsimst-'+n.replace(/-/g,''),{serialization:'json'});c.on('data',function(d){pcache[n]={p:!!(d&&d.paused),t:Date.now()};setTimeout(function(){tp.destroy()},300)})});tp.on('error',function(){});setTimeout(function(){try{tp.destroy()}catch(e){}},8000)}catch(e){}}
setInterval(function(){book().slice(0,10).forEach(function(c){askQ(c.num)})},8000);
function ask(n){quiet=false;if(pcache[n]&&Date.now()-pcache[n].t<15000&&pcache[n].p)tell();if(!window.Peer)return;try{var tp=new Peer({config:window.__ICE||{iceServers:[{urls:'stun:stun.l.google.com:19302'}]}});tp.on('open',function(){var c=tp.connect('cbsimst-'+n.replace(/-/g,''),{serialization:'json'});c.on('data',function(d){pcache[n]={p:!!(d&&d.paused),t:Date.now()};if(d&&d.paused)tell();setTimeout(function(){tp.destroy()},300)})});tp.on('error',function(){});setTimeout(function(){try{tp.destroy()}catch(e){}},10000)}catch(e){}}
(function(){var st=$('#cstate');if(!st)return;new MutationObserver(function(){var tx=st.textContent||'',w0=$('#cwho'),n0=(w0&&w0.textContent.match(/CB-\d{4}-\d{4}/)||[])[0]||callNumLast;if(n0&&pcache[n0]&&pcache[n0].p&&/not online|declined|hung up/i.test(tx)){tell();return}if(/^(Calling|Getting microphone)/.test(tx)){var w=$('#cwho'),n=(w&&w.textContent.match(/CB-\d{4}-\d{4}/)||[])[0]||(callNumLast||'');if(n&&asked!==n+Math.floor(Date.now()/5000)){asked=n+Math.floor(Date.now()/5000);ask(n)}}}).observe(st,{childList:true,characterData:true,subtree:true})})();
// sound output picker (Bluetooth headsets)
var sinkOk='setSinkId' in HTMLMediaElement.prototype;
function sinks(){if(!sinkOk||!navigator.mediaDevices||!navigator.mediaDevices.enumerateDevices)return;navigator.mediaDevices.enumerateDevices().then(function(d){var o=d.filter(function(x){return x.kind==='audiooutput'});var s=$('#simsink');if(o.length<2){s.style.display='none';return}s.style.display='';var v=g('sink','');s.innerHTML=o.map(function(x,i){return '<option value="'+esc(x.deviceId)+'"'+(x.deviceId===v?' selected':'')+'>🔊 '+esc(x.label||('Speaker '+(i+1)))+'</option>'}).join('');apply()}).catch(function(){})}
function apply(){var v=g('sink','');if(!sinkOk||!v)return;document.querySelectorAll('audio,video').forEach(function(m){try{m.setSinkId(v).catch(function(){})}catch(e){}})}
$('#simsink').onchange=function(){p('sink',this.value);apply()};if(navigator.mediaDevices&&navigator.mediaDevices.addEventListener)navigator.mediaDevices.addEventListener('devicechange',sinks);sinks();setInterval(apply,3000);
// wake lock
var wl=null;function wake(){try{if('wakeLock' in navigator&&!document.hidden&&!wl)navigator.wakeLock.request('screen').then(function(l){wl=l;l.addEventListener('release',function(){wl=null})}).catch(function(){})}catch(e){}}
document.addEventListener('visibilitychange',wake);['click','touchstart'].forEach(function(e){document.addEventListener(e,wake,{passive:true})});wake();
// add to home screen
var ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone,dp=null;
addEventListener('beforeinstallprompt',function(e){e.preventDefault();dp=e;if(!standalone)$('#simhome').style.display=''});
if(ios&&!standalone)$('#simhome').style.display='';
$('#simhome').onclick=function(){if(dp){dp.prompt();dp=null}else{var h=$('#simhint');h.style.display='block';h.textContent='In Safari, tap the Share button, then Add to Home Screen, then Add.'}};
// reconnect when the network returns: nudge the original app
addEventListener('online',function(){try{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'))}catch(e){}});
// connect a phone: big QR and a 6-digit code
var cp=null,code='';
function codePeer(){if(cp&&!cp.destroyed)return;code=String(100000+Math.floor(Math.random()*900000));$('#simcode').textContent=code;
 try{cp=new Peer('cbsim6-'+code,{config:window.__ICE||{iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'}]}});
 cp.on('error',function(e){if(e.type==='unavailable-id'){cp.destroy();cp=null;codePeer()}});
 cp.on('connection',function(c){c.on('data',function(d){if(d&&d.num){add(d.num,d.name);hello(d.num);$('#simst').textContent='✓ Connected with '+(d.name||d.num)}});c.on('open',function(){c.send({num:me(),name:g('name','')})})})}catch(e){}}
function hello(n){if(KIND==='full'&&window.__cb){window.__cb.helloTo(n)}else{var t=$('#to');if(t){t.value=n;t.dispatchEvent(new Event('input'))}try{window.__lite.sendTo(n,'Hi, it is '+(g('name','')||'me')+'. We are connected.')}catch(e){}}}
function showQR(){var el=$('#simqr');el.innerHTML='';try{new QRCode(el,{text:link(),width:420,height:420,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M})}catch(e){el.textContent=link()}}
function loadQR(){return window.QRCode?Promise.resolve():new Promise(function(r,j){var s=document.createElement('script');s.src='qrcode.min.js';s.onload=r;s.onerror=j;document.head.appendChild(s)})}
$('#simconn').onclick=function(){ov.classList.add('show');$('#simst').textContent='';loadQR().then(showQR).catch(function(){$('#simqr').textContent=link()});codePeer()};
$('#simx').onclick=function(){ov.classList.remove('show')};
$('#simgo').onclick=function(){var v=$('#simin').value.replace(/\D/g,'');if(v.length!==6){$('#simst').textContent='Type the 6 numbers from the other phone';return}$('#simst').textContent='Connecting';
 var tmp=new Peer({config:window.__ICE||{iceServers:[{urls:'stun:stun.l.google.com:19302'}]}});var done=false;
 tmp.on('open',function(){var c=tmp.connect('cbsim6-'+v,{serialization:'json'});c.on('open',function(){c.send({num:me(),name:g('name','')})});c.on('data',function(d){if(d&&d.num){done=true;add(d.num,d.name);hello(d.num);$('#simst').textContent='✓ Connected with '+(d.name||d.num);setTimeout(function(){tmp.destroy()},1500)}})});
 tmp.on('error',function(){if(!done)$('#simst').textContent='Code not found. Check the 6 numbers.'});setTimeout(function(){if(!done)$('#simst').textContent='Code not found. Check the 6 numbers.'},12000)};
window.__sim={add:add,book:book,code:function(){return code},link:link,online:online};
draw();word();
})();
