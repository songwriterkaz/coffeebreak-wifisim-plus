'use strict';
const $=s=>document.querySelector(s),PFX='coffeebreak-dsim-v1-';
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem('cb_'+k))??d}catch(e){return d}},set:(k,v)=>localStorage.setItem('cb_'+k,JSON.stringify(v))};
const norm=n=>{const d=String(n||'').replace(/\D/g,'');return d.length===8?`CB-${d.slice(0,4)}-${d.slice(4)}`:null};
let me=LS.get('num');if(!me){const a=new Uint32Array(2);crypto.getRandomValues(a);me=norm(String(1000+a[0]%9000)+String(a[1]%1e4).padStart(4,'0'));LS.set('num',me)}
let contacts=LS.get('contacts',[]),recents=LS.get('recents',[]),threads=LS.get('threads',{}),outbox=LS.get('outbox',[]);
const save=()=>{LS.set('contacts',contacts);LS.set('recents',recents);LS.set('threads',threads);LS.set('outbox',outbox)};
const nameOf=n=>String(n).startsWith('G:')?((window.cbGroupName&&window.cbGroupName(n))||'Group'):(contacts.find(c=>c.num===n)||{}).name||n;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tfmt=t=>{const d=new Date(t);return d.toDateString()===new Date().toDateString()?d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):d.toLocaleDateString([],{day:'numeric',month:'short'})+' '+d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})};
$('#myn').textContent=me;$('#myn2').textContent=me;
new QRCode($('#qr'),{text:((location.protocol.startsWith('http')&&!/itch\.zone|hwcdn|itch\.io|localhost/.test(location.host))?location.origin+location.pathname:'https://songwriterkaz.github.io/coffeebreak-wifisim-plus/')+'?add='+me,width:180,height:180,colorDark:'#3b2417'});
// tabs
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('act',x===b));document.querySelectorAll('section').forEach(s=>s.classList.toggle('act',s.id==='t-'+b.dataset.t));render()});
document.querySelectorAll('#t-phone .sub button[data-p]').forEach(b=>b.onclick=()=>{document.querySelectorAll('#t-phone .sub button[data-p]').forEach(x=>x.classList.toggle('act',x===b));document.querySelectorAll('.pp').forEach(p=>p.style.display=p.id==='p-'+b.dataset.p?'':'none');render()});
// keypad
let dial='';const pad=$('#pad');'123456789+0#'.split('').forEach(k=>{const b=document.createElement('button');b.textContent=k;b.onclick=()=>{if(dial.length<15&&/[\d+]/.test(k)&&(k!=='+'||!dial)){dial+=k;showDial()}};pad.appendChild(b)});
const isNormal=d=>/^[0+]/.test(d)||d.length>8;
function showDial(){const n=isNormal(dial);$('#dial').textContent=!dial?'':n?dial:('CB-'+dial.slice(0,4)+(dial.length>4?'-'+dial.slice(4):''));
 $('#normrow').style.display=n?'':'none';$('#ntel').href='tel:'+dial;$('#nsms').href='sms:'+dial}
$('#del').onclick=()=>{dial=dial.slice(0,-1);showDial()};
$('#dv').onclick=()=>isNormal(dial)?location.href='tel:'+dial:norm(dial)?startCall(norm(dial),false):alert('Enter 8 digits');
$('#dvid').onclick=()=>isNormal(dial)?alert('Video calls work with Coffeebreak numbers only'):norm(dial)?startCall(norm(dial),true):alert('Enter 8 digits');
$('#qmum').onclick=()=>{const m=contacts.find(c=>/^mum$/i.test(c.name));if(m)startCall(m.num,false);else{const n=norm(prompt('Mum\'s Coffeebreak number'));if(n){contacts.push({name:'Mum',num:n,fav:true});save();render();startCall(n,false)}}};
$('#cadd').onclick=()=>{const raw=$('#cnum').value.trim(),n=/^[0+]/.test(raw)||raw.replace(/\D/g,'').length>8?raw.replace(/[^\d+]/g,''):norm(raw),nm=$('#cname').value.trim();if(!n||!nm)return alert('Enter a name and a CB number');contacts=contacts.filter(c=>c.num!==n);contacts.push({name:nm,num:n,fav:$('#cfav').checked});save();$('#cname').value=$('#cnum').value='';render()};
const row=(c,extra='')=>!c.num.startsWith('CB-')&&!c.num.startsWith('Guest-')?`<div class="row"><div class="who"><b>${esc(c.name||c.num)}</b><span>${esc(extra||c.num)} · phone plan</span></div><a class="btn" style="padding:8px;text-decoration:none" title="Call" href="tel:${esc(c.num)}">📞</a> <a class="btn" style="padding:8px;text-decoration:none" title="Text" href="sms:${esc(c.num)}">💬</a> <a class="btn" style="padding:6px;font-size:11px;text-decoration:none" href="${inviteHref(c.num)}">Invite to WifiPhone</a></div>`:`<div class="row"><div class="who"><b>${esc(c.name||c.num)}</b><span>${esc(extra||c.num)}</span></div><button data-call="${c.num}">📞</button><button data-vid="${c.num}">🎥</button><button data-msg="${c.num}">💬</button></div>`;
function render(){
 $('#clist').innerHTML=contacts.length?contacts.map(c=>row(c,c.num+(c.fav?' ★':''))).join(''):'<p>No contacts yet</p>';
 $('#p-favs').innerHTML=contacts.filter(c=>c.fav).map(c=>row(c)).join('')||'<p>No favourites yet. Tick Favourite when saving a contact.</p>';
 $('#p-recents').innerHTML=recents.slice(0,50).map(r=>row({name:nameOf(r.num),num:r.num},`${r.dir==='in'?'↙':'↗'} ${r.video?'video':'voice'} ${r.missed?'missed ':''}· ${tfmt(r.t)}`)).join('')||'<p>No calls yet</p>';
 const ts=Object.entries(threads).sort((a,b)=>b[1].at(-1).t-a[1].at(-1).t);let un=0;
 $('#threads').innerHTML=ts.map(([n,ms])=>{const u=ms.filter(m=>!m.me&&!m.read).length;un+=u;const l=ms.at(-1);return `<div class="row" data-open="${n}"><div class="who"><b>${esc(nameOf(n))}${u?` <span class="badge">${u}</span>`:''}</b><span>${esc(l.text.slice(0,40))} · ${tfmt(l.t)}</span></div><button data-msg="${n}">›</button></div>`}).join('')||'<p>No messages yet</p>';
 $('#ub').hidden=!un;$('#ub').textContent=un;
 if(openChat)drawChat();
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-call],[data-vid],[data-msg],[data-open]');if(!t)return;if(t.dataset.call)startCall(t.dataset.call,false);else if(t.dataset.vid)startCall(t.dataset.vid,true);else showChat(t.dataset.msg||t.dataset.open)});
// chat
let openChat=null;
function showChat(n){openChat=n;$('#ctitle').textContent=nameOf(n);$('#chat').classList.add('show');drawChat()}
function drawChat(){const ms=threads[openChat]||[];ms.forEach(m=>{if(!m.me)m.read=true});save();
 $('#msgs').innerHTML=ms.map(m=>`<div class="m${m.me?' me':''}">${esc(m.text)}${m.media&&window.cbMedia?window.cbMedia(m.media):''}<i>${tfmt(m.t)}${m.me?(m.sent?' ✓':' ⏳ queued'):''}</i></div>`).join('');$('#msgs').scrollTop=1e9;
 const u=Object.values(threads).flat().filter(m=>!m.me&&!m.read).length;$('#ub').hidden=!u;$('#ub').textContent=u}
$('#cback').onclick=()=>{openChat=null;$('#chat').classList.remove('show');render()};
$('#ccall').onclick=()=>startCall(openChat,false);$('#cvid').onclick=()=>startCall(openChat,true);
$('#cform').onsubmit=e=>{e.preventDefault();const t=$('#ctext').value.trim();if(!t)return;$('#ctext').value='';sendMsg(openChat,t)};
$('#nmgo').onclick=()=>{const n=norm($('#nmnum').value);if(n){threads[n]=threads[n]||[];showChat(n)}else alert('Enter a CB number')};
function sendMsg(to,text){const m={id:crypto.randomUUID(),me:true,text,t:Date.now(),sent:false};(threads[to]=threads[to]||[]).push(m);outbox.push({to,id:m.id,text,t:m.t});save();render();flush(to)}
// peer
let peer,conns={},ready=false,backoff=1000,reT=null;
function setReady(){const r=$('#readybar');if(!r)return;if(ready){r.textContent='✓ Ready · '+me;r.style.background='#c8e6c9'}else{r.textContent=navigator.onLine?'Connecting... (retries automatically)':'Offline · your own wifi mode still works';r.style.background='#ffe0b2'}}
function scheduleRe(){if(reT)return;reT=setTimeout(()=>{reT=null;if(ready)return;try{if(!peer||peer.destroyed)startPeer();else if(peer.disconnected)peer.reconnect();else if(!peer.open){peer.destroy();startPeer()}}catch(e){}backoff=Math.min(backoff*2,60000);setTimeout(()=>{if(!ready)scheduleRe()},5000)},backoff)}
function wake(){if(!ready){backoff=1000;clearTimeout(reT);reT=null;scheduleRe()}else{flushAll()}}
addEventListener('online',wake);document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake()});
try{navigator.serviceWorker&&navigator.serviceWorker.addEventListener('message',e=>{if(e.data==='wake')wake()})}catch(e){}
function startPeer(){peer=new Peer(PFX+me.replace(/-/g,''),{config:window.__ICE||{iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'},{urls:'stun:global.stun.twilio.com:3478'},{urls:'stun:stun.nextcloud.com:443'}]}});
 peer.on('open',()=>{ready=true;backoff=1000;setReady();setTimeout(()=>{try{famSync();syncNow&&contacts.forEach(c=>profileTo(c.num))}catch(e){}},500);$('#st').textContent='Online';$('#st').className='on';$('#portal').classList.remove('show');flushAll()});
 peer.on('disconnected',()=>{ready=false;setReady();scheduleRe()});peer.on('close',()=>{ready=false;setReady();scheduleRe()});
 peer.on('error',e=>{if(['network','server-error','socket-error','socket-closed','disconnected'].includes(e.type)){ready=false;setReady();scheduleRe()}if(e.type==='unavailable-id'){$('#st').textContent='open in another tab'}else if(e.type==='peer-unavailable'){if(callTo&&e.message.includes(pid(callTo)))(showErr('They are not online right now'),endCall('They are not online right now'))}});
 peer.on('connection',c=>wire(c));peer.on('call',onIncoming)}
const pid=n=>n.startsWith('Guest-')?'cbguest-'+n.slice(6):PFX+n.replace(/-/g,'');
const fromPid=p=>p.startsWith('cbguest-')?'Guest-'+p.slice(8):norm(p.slice(PFX.length));
function wire(c){const n=fromPid(c.peer);c.on('open',()=>{conns[n]=c;flush(n);famSend(n);profileTo(n)});c.on('data',d=>{if(typeof d==='string')try{d=JSON.parse(d)}catch(e){return}
 if(d.type==='msg'){const th=threads[n]=threads[n]||[];if(!th.some(m=>m.id===d.id)){th.push({id:d.id,me:false,text:d.text,t:d.t,read:openChat===n});save();render();notify(nameOf(n),d.text)}c.send({type:'ack',id:d.id})}
 else if(d.type==='info'){const k=JSON.stringify(d);const c=contacts.find(x=>x.num===n);if(c&&c.lastInfo!==k){c.lastInfo=k;c.shared=d;const th=threads[n]=threads[n]||[];th.push({id:crypto.randomUUID(),me:false,text:`📌 Shared details: ${d.num} ${d.link}${d.hs?` · Hotspot: ${d.hs.n}${d.hs.p?' / password '+d.hs.p:''}`:''}`,t:Date.now(),read:false});save();render()}}
 else if(d.type==='hello'||d.type==='hello-ack'||d.type==='profile'){onHello(d,c)}
 else if(d.type==='lanans'){window.__lm&&window.__lm.handle(d.code)}
 else if(d.type==='media'||d.type==='gmsg'||d.type==='wkinv'){window.cbExt&&window.cbExt(d,n,c)}
 else if(d.type==='ack'){outbox=outbox.filter(o=>o.id!==d.id);(threads[n]||[]).forEach(m=>{if(m.id===d.id)m.sent=true});save();render()}});
 c.on('close',()=>{if(conns[n]===c)delete conns[n]});c.on('error',()=>{delete conns[n]})}
function flush(n){if(!ready)return;const q=outbox.filter(o=>o.to===n);if(!q.length)return;const c=conns[n];
 if(c&&c.open)q.forEach(o=>c.send({type:'msg',id:o.id,text:o.text,t:o.t}));else if(!c){const nc=peer.connect(pid(n),{reliable:true,serialization:'json'});conns[n]=nc;wire(nc);setTimeout(()=>{if(conns[n]===nc&&!nc.open)delete conns[n]},15000)}}
function flushAll(){[...new Set(outbox.map(o=>o.to))].forEach(flush)}
setInterval(flushAll,20000);
function notify(t,b){try{if(document.hidden&&Notification.permission==='granted')new Notification(t,{body:b,icon:'icon-192.png'})}catch(e){}}
// calls
let cur=null,stream=null,callTo=null,ringT=null,actx=null;
function ring(on){clearInterval(ringT);$('#call').classList.toggle('ring',on);if(!on)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const beep=()=>{[0,.4].forEach(d=>{const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=d?480:440;g.gain.value=.15;o.connect(g).connect(actx.destination);o.start(actx.currentTime+d);o.stop(actx.currentTime+d+.3)})};beep();ringT=setInterval(beep,2000)}catch(e){};navigator.vibrate&&navigator.vibrate([400,200,400])}
const IN_FRAME=(()=>{try{return window.self!==window.top}catch(e){return true}})();
function showErr(t){const b=$('#errbar');b.textContent=t;b.style.display=t?'block':'none';clearTimeout(b._t);if(t)b._t=setTimeout(()=>b.style.display='none',12000)}
function showFull(){$('#fullbar').style.display='block'}
async function getMedia(v){if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){if(IN_FRAME)showFull();throw new Error(IN_FRAME?'Calls need the full app. Tap Open full app for calls.':'This browser cannot make calls')}
 const tries=v?[{audio:true,video:{facingMode:'user'}},{audio:true,video:true},{audio:true},{video:true}]:[{audio:true}];
 for(const c of tries){try{return await navigator.mediaDevices.getUserMedia(c)}catch(e){}}
 if(IN_FRAME){showFull();throw new Error('Microphone blocked inside this page. Tap Open full app for calls.')}
 showErr('No microphone found or it is blocked. Joining to listen only.');
 // no mic or camera: join anyway, listen-only
 try{const ac=new (window.AudioContext||window.webkitAudioContext)();const d=ac.createMediaStreamDestination();return d.stream}catch(e){return new MediaStream()}}
// iOS: unlock audio on first tap
['pointerdown','touchstart','touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,function u(){window.__touched=true;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume();const b=actx.createBuffer(1,1,22050),s=actx.createBufferSource();s.buffer=b;s.connect(actx.destination);s.start(0)}catch(e){}document.querySelectorAll('video,audio').forEach(m=>{m.muted=m.id==='lv'})},{once:true,passive:true}));
function logCall(num,dir,video,missed){recents.unshift({num,dir,video,missed,t:Date.now()});recents=recents.slice(0,100);save();render()}
function showCall(n,state,inc,video){callTo=n;$('#cwho').textContent=nameOf(n);$('#cstate').textContent=state;$('#ans').style.display=inc?'':'none';$('#call').classList.add('show');$('#rv').style.display=$('#lv').style.display=video?'':'none'}
async function startCall(n,video){if(!ready){showErr('Not connected yet. Wait for Ready, then try again.');return}if(cur)return;showCall(n,'Calling...',false,video);logCall(n,'out',video,false);
 try{stream=await getMedia(video)}catch(e){showErr(e.message);return endCall(e.message)}
 $('#lv').srcObject=stream;cur=peer.call(pid(n),stream,{metadata:{video}});hook(cur,video);setTimeout(()=>{if(cur&&$('#cstate').textContent==='Calling...')endCall('No answer')},40000)}
function onIncoming(c){if(c.metadata&&c.metadata.walkie&&window.cbWalkieCall)return window.cbWalkieCall(c);const n=fromPid(c.peer),video=!!(c.metadata&&c.metadata.video);if(cur){c.close();logCall(n,'in',video,true);return}
 cur=c;showCall(n,`Incoming ${video?'video':'voice'} call`,true,video);ring(true);if(!window.__touched){$('#call').classList.add('flash');navigator.vibrate&&navigator.vibrate([600,300,600,300,600,300,600]);const tapAns=ev=>{if(ev.target.closest&&ev.target.closest('#hang,#ans'))return;document.removeEventListener('click',tapAns,true);$('#call').classList.remove('flash');try{actx&&actx.resume()}catch(e){}if(cur===c&&$('#ans').style.display!=='none')$('#ans').click()};document.addEventListener('click',tapAns,true);c.on('close',()=>document.removeEventListener('click',tapAns,true))}notify('Incoming call',nameOf(n));let ans=false;
 $('#ans').onclick=async()=>{ans=true;ring(false);$('#ans').style.display='none';try{stream=await getMedia(video)}catch(e){try{stream=await getMedia(false)}catch(e2){stream=new MediaStream()}}$('#lv').srcObject=stream;c.answer(stream);hook(c,video);logCall(n,'in',video,false)};
 c.on('close',()=>{if(!ans)logCall(n,'in',video,true);endCall('Call ended')})}
function hook(c,video){c.on('stream',r=>{$('#rv').srcObject=r;$('#rv').style.display=video?'':'none';$('#cstate').textContent='Connected';window.__cbCallConnected=true});c.on('close',()=>endCall('Call ended'));c.on('error',()=>(showErr('Could not connect the call'),endCall('Could not connect the call')))}
function endCall(msg){ring(false);$('#call').classList.remove('flash');$('#call').onclick=null;if(cur){const c=cur;cur=null;try{c.close()}catch(e){}}if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
 $('#cstate').textContent=msg||'Call ended';$('#ans').style.display='none';setTimeout(()=>{if(!cur){$('#call').classList.remove('show');$('#rv').srcObject=null;callTo=null}},1200)}
$('#hang').onclick=()=>endCall('Call ended');
$('#mute').onclick=()=>{if(!stream)return;const a=stream.getAudioTracks()[0];if(a){a.enabled=!a.enabled;$('#mute').textContent=a.enabled?'🎤':'🔇'}};
// reach anyone
const base=()=>location.origin+location.pathname;
function shareLink(text,url){if(navigator.share)return navigator.share({title:'Coffeebreak',text,url}).catch(()=>{});prompt('Copy this link and send it in any app',url)}
function linkCall(video){if(!ready)return alert('Not connected yet, try again in a moment');const url=`${base()}#call=${me.replace(/-/g,'')}&v=${video?1:0}`;window.__lastLink=url;
 showCall('Guest','Waiting for them to open the link',false,false);$('#cwho').textContent='Call link sent';shareLink(`Tap to join my Coffeebreak ${video?'video':'voice'} call:`,url)}
$('#rlv').onclick=()=>linkCall(false);$('#rlvid').onclick=()=>linkCall(true);
const b64u=t=>btoa(unescape(encodeURIComponent(t))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
$('#rlmsg').onclick=()=>{const t=prompt('Your message');if(!t)return;const url=`${base()}#msg=${me.replace(/-/g,'')}&t=${b64u(t)}`;window.__lastLink=url;shareLink('You have a Coffeebreak message:',url)};
$('#rlmail').onclick=()=>{const to=prompt('Their email address')||'';location.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent('Message from Coffeebreak')}&body=${encodeURIComponent('Reply or call me free here: '+base()+'#msg='+me.replace(/-/g,'')+'&t='+b64u('Hi from Coffeebreak'))}`};
// phone contacts import (stored on this phone only)
const APPURL='https://songwriterkaz.github.io/coffeebreak-wifisim-plus/';
function inviteHref(num){return 'sms:'+encodeURIComponent(num)+'?&body='+encodeURIComponent(`Call and text me free on Coffeebreak WifiPhone: ${APPURL} My number is ${me}`)}
function cleanTel(t){return String(t||'').replace(/[^\d+]/g,'')}
function addImported(list){let n=0;list.forEach(c=>{const name=(c.name||'').trim();(c.tels.length?c.tels:['']).forEach((t,i)=>{let num=cleanTel(t);const cb=c.cb&&norm(c.cb);if(!num&&!cb)return;
 if(cb)num=cb;if(!num)return;if(contacts.some(x=>x.num===num))return;contacts.push({name:(name||num)+(c.tels.length>1&&!cb?` (${i+1})`:''),num,email:c.email||'',fav:false});n++})});save();render();return n}
function parseVCF(text){const out=[];text=text.replace(/\r\n[ \t]/g,'').replace(/\n[ \t]/g,'');
 text.split(/BEGIN:VCARD/i).slice(1).forEach(card=>{const c={name:'',tels:[],email:'',cb:''};let n='';
  card.split(/\r?\n/).forEach(l=>{const i=l.indexOf(':');if(i<0)return;const k=l.slice(0,i).toUpperCase(),v=l.slice(i+1).trim();const key=k.split(';')[0].replace(/^ITEM\d+\./,'');
   let val=v;if(/ENCODING=QUOTED-PRINTABLE/.test(k)){try{val=decodeURIComponent(v.replace(/=\s*$/,'').replace(/=([0-9A-F]{2})/gi,'%$1'))}catch(e){}}
   val=val.replace(/\\,/g,',').replace(/\\;/g,';');
   if(key==='FN')c.name=val;else if(key==='N')n=val.split(';').slice(0,2).reverse().filter(Boolean).join(' ');else if(key==='TEL'){const t=val.replace(/^tel:/i,'');if(norm(t)&&/CB/i.test(t))c.cb=t;else c.tels.push(t)}else if(key==='EMAIL'&&!c.email)c.email=val;else if(key==='NOTE'&&/CB-\d{4}-\d{4}/.test(val))c.cb=val.match(/CB-\d{4}-\d{4}/)[0]});
  if(!c.name)c.name=n;if(c.name||c.tels.length)out.push(c)});return out}
const inFrame=window.self!==window.top;
function openFull(msg){$('#cimpst').innerHTML=esc(msg)+` <a href="${APPURL}" target="_blank" rel="noopener">Open full app</a>`}
$('#cimp').onclick=async()=>{if(!('contacts'in navigator&&'select'in navigator.contacts)){return inFrame?openFull('Contact picking is blocked inside this page.'):($('#cimpst').textContent='This phone does not offer contact picking here. Use Import contact card (.vcf) below.')}
 try{const r=await navigator.contacts.select(['name','tel','email'],{multiple:true});const n=addImported(r.map(x=>({name:(x.name||[])[0]||'',tels:x.tel||[],email:(x.email||[])[0]||''})));$('#cimpst').textContent=`Imported ${n} contacts`}
 catch(e){inFrame?openFull('Contact picking is blocked inside this page.'):($('#cimpst').textContent='Contacts were not imported.')}};
$('#cvcf').onchange=async e=>{let n=0;for(const f of e.target.files)n+=addImported(parseVCF(await f.text()));$('#cimpst').textContent=`Imported ${n} contacts`;e.target.value=''};
// network status + captive portal
const setSt=(t,c)=>{$('#st').textContent=t;$('#st').className=c||''};
async function reach(u,ms){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{await fetch(u,{mode:'no-cors',cache:'no-store',signal:c.signal});return true}catch(e){return false}finally{clearTimeout(t)}}
let portalShown=false;
async function netCheck(){if(!navigator.onLine){setSt('Offline (Your own wifi mode still works)');$('#portal').classList.remove('show');return}
 const ok=await reach('https://0.peerjs.com/peerjs/id?ts='+Date.now(),6000)||await reach('https://www.gstatic.com/generate_204',6000);
 if(!ok){setSt('Wifi login needed','portal');$('#portal').classList.add('show');return}
 $('#portal').classList.remove('show');if(peer&&(peer.disconnected||peer.destroyed)){try{peer.destroyed?startPeer():peer.reconnect()}catch(e){}}
 if(ready)setSt('Online','on')}
$('#portal').onclick=$('#portal').onkeydown=e=>{if(e.type==='keydown'&&e.key!=='Enter')return;window.open('http://neverssl.com','_blank','noopener');let n=0;const iv=setInterval(async()=>{await netCheck();if(++n>40||!$('#portal').classList.contains('show'))clearInterval(iv)},5000)};
addEventListener('online',()=>setTimeout(netCheck,1000));addEventListener('offline',netCheck);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)netCheck()});
try{navigator.connection&&navigator.connection.addEventListener('change',()=>setTimeout(netCheck,1500))}catch(e){}
setInterval(netCheck,60000);setTimeout(netCheck,3000);
$('#gownwifi').onclick=()=>{document.querySelector('nav button[data-t=me]').click();setTimeout(()=>$('#ownwifi').scrollIntoView({behavior:'smooth'}),50)};
// hotspot helper
(function(){const u=navigator.userAgent,ios=/iPhone|iPad|iPod/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),and=/Android/.test(u),mac=/Macintosh/.test(u)&&!ios,win=/Windows/.test(u);
 const steps=ios?'iPhone or iPad: open Settings, tap Personal Hotspot, then turn on Allow Others to Join.':and?'Android: open Settings, tap Connections or Network, then Mobile Hotspot and Tethering, then turn on Mobile Hotspot.':win?'Windows: open Settings, then Network and internet, then Mobile hotspot, and turn it on.':mac?'Mac: open System Settings, then General, then Sharing, and turn on Internet Sharing.':'Open your device settings and turn on its hotspot or internet sharing.';
 $('#hssteps').textContent=steps;const o=$('#hsopen');
 if(and)o.href='intent:#Intent;action=android.settings.TETHER_SETTINGS;S.browser_fallback_url='+encodeURIComponent('intent:#Intent;action=android.settings.WIRELESS_SETTINGS;end')+';end';
 else if(ios)o.href='App-Prefs:root=INTERNET_TETHERING';else if(win)o.href='ms-settings:network-mobilehotspot';else if(mac)o.href='x-apple.systempreferences:com.apple.preferences.sharing';else o.style.display='none';
 o.addEventListener('click',()=>setTimeout(()=>{$('#hssteps').textContent=steps+' If settings did not open, follow these steps.'},1500));
 const hs=LS.get('hotspot',{});$('#hsname').value=hs.n||'';$('#hspass').value=hs.p||'';
 const q=v=>String(v).replace(/([\\;,:"])/g,'\\$1');
 $('#hsqr').onclick=()=>{const n=$('#hsname').value.trim(),p=$('#hspass').value;if(!n)return alert('Type your hotspot name');LS.set('hotspot',{n,p});
  $('#hsqrbox').innerHTML='';window.__wifiQR=`WIFI:T:${p?'WPA':'nopass'};S:${q(n)};${p?'P:'+q(p)+';':''};`;new QRCode($('#hsqrbox'),{text:window.__wifiQR,width:220,height:220,colorDark:'#3b2417'});$('#hsnext').style.display=''};
 $('#hsgo').onclick=()=>{$('#ownwifi').scrollIntoView({behavior:'smooth'});$('#lmA').click()};
 $('#ghot').onclick=()=>{document.querySelector('nav button[data-t=me]').click();setTimeout(()=>$('#hotspot').scrollIntoView({behavior:'smooth'}),50)}})();
// family share list
const APPLINK='https://songwriterkaz.github.io/coffeebreak-wifisim-plus/';
const famInfo=()=>{const h=LS.get('hotspot',{});return {type:'info',num:me,link:APPLINK,hs:LS.get('famhs',false)&&h.n?{n:h.n,p:h.p||''}:null}};
function famSend(n){const c=contacts.find(x=>x.num===n&&x.fam);const cn=conns[n];if(!c||!cn||!cn.open)return;const i=famInfo(),k=JSON.stringify(i);const sent=LS.get('famsent',{});if(sent[n]===k)return;cn.send(i);sent[n]=k;LS.set('famsent',sent)}
function famSync(){if(!ready)return;contacts.filter(c=>c.fam&&c.num.startsWith('CB-')).forEach(c=>{const sent=LS.get('famsent',{});if(sent[c.num]===JSON.stringify(famInfo()))return;
 if(conns[c.num]&&conns[c.num].open)famSend(c.num);else if(!conns[c.num]){const nc=peer.connect(pid(c.num),{reliable:true,serialization:'json'});conns[c.num]=nc;wire(nc);setTimeout(()=>{if(conns[c.num]===nc&&!nc.open)delete conns[c.num]},15000)}})}
setInterval(famSync,30000);setTimeout(famSync,5000);
function drawFam(){$('#famlist').innerHTML=contacts.length?contacts.map((c,i)=>`<label class="row" style="margin-bottom:4px"><input type="checkbox" data-fam="${i}" ${c.fam?'checked':''} style="width:auto"> <span class="who"><b>${esc(c.name)}</b><span>${esc(c.num)}</span></span></label>`).join(''):'<p style="font-size:13px">Add contacts first.</p>'}
document.addEventListener('change',e=>{const i=e.target.dataset&&e.target.dataset.fam;if(i===undefined)return;contacts[+i].fam=e.target.checked;save();famSync()});
$('#famhs').checked=LS.get('famhs',false);$('#famhs').onchange=e=>{LS.set('famhs',e.target.checked);famSync()};
const famText=()=>`Call and text me free on Coffeebreak WifiPhone: ${APPLINK} My number is ${me}`;
$('#famsms').onclick=()=>{const nums=contacts.filter(c=>c.fam&&!c.num.startsWith('CB-')&&!c.num.startsWith('Guest-')).map(c=>c.num);if(!nums.length)return alert('Tick family with normal phone numbers first');
 const ios=/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);location.href=ios?`sms:/open?addresses=${nums.join(',')}&body=${encodeURIComponent(famText())}`:`sms:${nums.join(',')}?body=${encodeURIComponent(famText())}`};
$('#fammail').onclick=()=>{const em=contacts.filter(c=>c.fam&&c.email).map(c=>c.email);location.href=`mailto:?bcc=${encodeURIComponent(em.join(','))}&subject=${encodeURIComponent('Coffeebreak WifiPhone')}&body=${encodeURIComponent(famText())}`};
document.querySelector('nav button[data-t=me]').addEventListener('click',drawFam);
// AirDrop / Nearby share
async function qrFile(sel,name){const c=document.querySelector(sel+' canvas');if(!c)return null;const b=await new Promise(r=>c.toBlob(r,'image/png'));return b&&new File([b],name,{type:'image/png'})}
async function airShare(data,fallbackText,qrSel){try{if(navigator.share){if(data.files&&!(navigator.canShare&&navigator.canShare({files:data.files})))delete data.files;await navigator.share(data);$('#adst').textContent='';return}}catch(e){if(e.name==='AbortError')return}
 try{await navigator.clipboard.writeText(fallbackText);$('#adst').textContent='Copied. Paste it into any app.'}catch(e){$('#adst').textContent=fallbackText}
 if(qrSel){document.querySelector('nav button[data-t=me]').click();setTimeout(()=>$(qrSel).scrollIntoView({behavior:'smooth'}),50)}}
$('#adlink').onclick=async()=>{const f=await qrFile('#qr','coffeebreak-wifiphone-qr.png');airShare({title:'Coffeebreak WifiPhone',text:famText(),url:APPLINK,files:f?[f]:undefined},famText(),'#qr')};
$('#adcard').onclick=()=>{const v=`BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Coffeebreak WifiPhone ${me}\r\nTEL;TYPE=CB:${me}\r\nNOTE:WifiPhone ${me} ${APPLINK}\r\nURL:${APPLINK}\r\nEND:VCARD\r\n`;
 const f=new File([v],'coffeebreak-'+me+'.vcf',{type:'text/vcard'});airShare({title:'My Coffeebreak card',files:[f],text:famText()},famText(),null)};
$('#adhs').onclick=async()=>{if(!window.__wifiQR){$('#hsqr').click();if(!window.__wifiQR)return}const f=await qrFile('#hsqrbox','hotspot-join.png');airShare({title:'Join my hotspot',files:f?[f]:undefined,text:'Scan to join my hotspot'},window.__wifiQR,'#hsqrbox')};
// SIM card
const APP_URL=(location.protocol.startsWith('http')&&!/itch\.zone|hwcdn|itch\.io|localhost/.test(location.host))?location.origin+location.pathname:'https://songwriterkaz.github.io/coffeebreak-wifisim-plus/';
let simMode='app';const logoImg=new Image();logoImg.src='logo.png';
function simText(){return simMode==='hs'&&window.__wifiQR?window.__wifiQR:APP_URL+'?add='+me}
function qrCanvas(text,size){const t=document.createElement('div');new QRCode(t,{text,width:size,height:size,colorDark:'#3b2417',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});return t.querySelector('canvas')}
function drawSim(){const cv=$('#simcv'),x=cv.getContext('2d'),W=860,H=560,cut=110;x.clearRect(0,0,W,H);
 const path=()=>{x.beginPath();x.moveTo(30,0);x.lineTo(W-cut,0);x.lineTo(W,cut);x.lineTo(W,H-30);x.quadraticCurveTo(W,H,W-30,H);x.lineTo(30,H);x.quadraticCurveTo(0,H,0,H-30);x.lineTo(0,30);x.quadraticCurveTo(0,0,30,0);x.closePath()};
 path();const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#6b4226');g.addColorStop(1,'#3b2417');x.fillStyle=g;x.fill();
 x.save();path();x.clip();x.fillStyle='#f48fb1';x.fillRect(0,H-70,W,70);x.restore();
 const cg=x.createLinearGradient(40,150,200,290);cg.addColorStop(0,'#f6e27a');cg.addColorStop(.5,'#cfa83a');cg.addColorStop(1,'#f3d36b');x.fillStyle=cg;x.beginPath();x.roundRect?x.roundRect(40,170,170,130,18):x.rect(40,170,170,130);x.fill();
 x.strokeStyle='#8a6a1f';x.lineWidth=3;[[40,213,210,213],[40,257,210,257],[125,170,125,300],[90,213,90,257],[160,213,160,257]].forEach(l=>{x.beginPath();x.moveTo(l[0],l[1]);x.lineTo(l[2],l[3]);x.stroke()});
 if(logoImg.complete&&logoImg.naturalWidth){x.fillStyle='#fff';x.fillRect(38,28,112,112);x.drawImage(logoImg,42,32,104,104)}
 x.fillStyle='#fff';x.font='bold 34px system-ui,sans-serif';x.fillText('Coffeebreak WifiPhone',165,72);x.font='26px system-ui,sans-serif';x.fillStyle='#f48fb1';x.fillText('Digital SIM',165,110);
 x.fillStyle='#fff';x.font='bold 46px monospace';x.fillText(me,40,375);x.font='20px system-ui,sans-serif';x.fillText(simMode==='hs'?'Scan to join my hotspot':'Scan to get the app and add me',40,420);
 x.fillStyle='#3b2417';x.font='bold 22px system-ui,sans-serif';x.fillText('Calls and texts between WifiPhone users',40,H-28);
 const q=qrCanvas(simText(),300);x.fillStyle='#fff';x.fillRect(W-350,150,320,320);x.drawImage(q,W-340,160,300,300);
 const th=qrCanvas(APP_URL+'?add='+me,120);$('#simthumb').src=th.toDataURL()}
logoImg.onload=drawSim;
$('#simq1').onclick=()=>{simMode='app';$('#simq1').classList.add('act');$('#simq2').classList.remove('act');drawSim()};
$('#simq2').onclick=()=>{if(!window.__wifiQR){const h=LS.get('hotspot',{});if(h.n)window.__wifiQR=`WIFI:T:${h.p?'WPA':'nopass'};S:${h.n.replace(/([\\;,:"])/g,'\\$1')};${h.p?'P:'+h.p.replace(/([\\;,:"])/g,'\\$1')+';':''};`}
 if(!window.__wifiQR){alert('Save your hotspot name first, under Make a hotspot');$('#hotspot').scrollIntoView({behavior:'smooth'});return}simMode='hs';$('#simq2').classList.add('act');$('#simq1').classList.remove('act');drawSim()};
$('#simsave').onclick=()=>{const a=document.createElement('a');a.download='coffeebreak-sim-'+me+'.png';a.href=$('#simcv').toDataURL('image/png');document.body.appendChild(a);a.click();a.remove()};
$('#simshare').onclick=async()=>{const b=await new Promise(r=>$('#simcv').toBlob(r,'image/png'));const f=new File([b],'coffeebreak-sim.png',{type:'image/png'});airShare({title:'My Coffeebreak SIM',text:famText(),url:APP_URL,files:[f]},APP_URL+'?add='+me,'#simcard')};
function fullQR(){$('#qrfullbox').innerHTML='';const s=Math.min(innerWidth,innerHeight)-60;$('#qrfullbox').appendChild(qrCanvas(simText(),s));$('#qrfull').style.display='flex'}
$('#simfull').onclick=fullQR;$('#qrfull').onclick=()=>$('#qrfull').style.display='none';
$('#simthumb').onclick=fullQR;
$('#gsim').onclick=()=>{document.querySelector('nav button[data-t=me]').click();setTimeout(()=>$('#simcard').scrollIntoView({behavior:'smooth'}),50)};
drawSim();
// connect a phone
const myName=()=>LS.get('myname','')||'Coffeebreak friend';
function upsert(num,name){let c=contacts.find(x=>x.num===num);if(!c){c={name:name||num,num,fav:false,autoName:true};contacts.push(c)}else if(c.autoName&&name&&c.name!==name)c.name=name;save();render();return c}
function connStatus(t){$('#connst').textContent=t}
function onHello(d,c){const num=norm(d.num);if(!num||num===me)return;const ct=upsert(num,d.name);
 if(d.type==='hello'){c.send({type:'hello-ack',num:me,name:myName()});}
 if(d.type!=='profile'){connStatus('✓ Connected with '+ct.name);window.__connected=ct.name;flush(num)}}
function profileTo(n){const c=conns[n];if(!c||!c.open||!contacts.some(x=>x.num===n))return;const k=myName(),s=LS.get('profsent',{});if(s[n]===k)return;c.send({type:'profile',num:me,name:k});s[n]=k;LS.set('profsent',s)}
function helloTo(num){if(!num||num===me)return;upsert(num);connStatus('Connecting...');const go=c=>c.send({type:'hello',num:me,name:myName()});
 const ex=conns[num];if(ex&&ex.open)return go(ex);const nc=peer.connect(pid(num),{reliable:true,serialization:'json'});conns[num]=nc;wire(nc);nc.on('open',()=>go(nc));setTimeout(()=>{if(!nc.open){if(conns[num]===nc)delete conns[num];connStatus('They are not online. Saved them, and it will finish when they open the app.')}},15000)}
let codePeer=null,myCode='';
function openConnect(){$('#connect').style.display='block';$('#myname').value=LS.get('myname','');$('#connqr').innerHTML='';$('#connqr').appendChild(qrCanvas(APP_URL+'?add='+me,200));connStatus('');
 if(!codePeer||codePeer.destroyed){myCode=String(1000+Math.floor(Math.random()*9000));$('#conncode').textContent=myCode;
  codePeer=new Peer('cbcode-'+myCode,{config:peer&&peer.options.config});codePeer.on('error',e=>{if(e.type==='unavailable-id'){codePeer.destroy();codePeer=null;openConnect()}});
  codePeer.on('connection',c=>{c.on('data',d=>{if(d.type==='hello')onHello(d,c)})})}}
function closeConnect(){$('#connect').style.display='none';stopScan();if(codePeer){codePeer.destroy();codePeer=null}}
$('#gconn').onclick=openConnect;$('#connx').onclick=closeConnect;
$('#myname').onchange=()=>{LS.set('myname',$('#myname').value.trim());syncNow()};
function codeConnect(code){if(!/^\d{4}$/.test(code))return connStatus('Type the 4 numbers shown on their phone');connStatus('Connecting...');
 const c=peer.connect('cbcode-'+code,{reliable:true,serialization:'json'});c.on('open',()=>c.send({type:'hello',num:me,name:myName()}));c.on('data',d=>{if(d.type==='hello-ack'){onHello(d,c);setTimeout(()=>c.close(),1000);helloTo(norm(d.num))}});
 setTimeout(()=>{if(!c.open)connStatus('No phone found with that code. Check the code and that their Connect screen is open.')},12000)}
$('#conngo').onclick=()=>codeConnect($('#conntype').value.trim());
let scanStream=null;function stopScan(){if(scanStream){scanStream.getTracks().forEach(t=>t.stop());scanStream=null}$('#conncam').style.display='none'}
$('#connscan').onclick=async()=>{const v=$('#conncam');try{scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})}catch(e){return connStatus('Camera not available. Use the 4-digit code instead.')}
 v.srcObject=scanStream;v.style.display='';await v.play();const cv=document.createElement('canvas'),x=cv.getContext('2d',{willReadFrequently:true});
 (function tick(){if(!scanStream)return;if(v.videoWidth&&window.jsQR){cv.width=v.videoWidth;cv.height=v.videoHeight;x.drawImage(v,0,0);const r=jsQR(x.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height);
  if(r){const m=r.data.match(/CB-\d{4}-\d{4}/);if(m){stopScan();helloTo(m[0]);return}if(/^CB[OA]:/.test(r.data)){stopScan();closeConnect();window.__lm.handle(r.data);return}}}requestAnimationFrame(tick)})()};
function syncNow(){if(!ready){try{peer.reconnect()}catch(e){}}flushAll();famSync();contacts.filter(c=>c.num.startsWith('CB-')).forEach(c=>{if(conns[c.num]&&conns[c.num].open)profileTo(c.num);else if(!conns[c.num]&&(outbox.some(o=>o.to===c.num)||LS.get('profsent',{})[c.num]!==myName())){const nc=peer.connect(pid(c.num),{reliable:true,serialization:'json'});conns[c.num]=nc;wire(nc);setTimeout(()=>{if(conns[c.num]===nc&&!nc.open)delete conns[c.num]},15000)}});connStatus('Sync started');}
$('#syncnow').onclick=syncNow;setInterval(()=>contacts.forEach(c=>profileTo(c.num)),30000);
// download the app
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
if(standalone())$('#dlapp').style.display='none';
const FULL=APP_URL;
function guide(html){$('#instbody').innerHTML=html;$('#instguide').style.display='block'}
$('#instx').onclick=()=>$('#instguide').style.display='none';
$('#dlapp').onclick=async()=>{const u=navigator.userAgent,ios=/iPhone|iPad|iPod/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),inFr=window.self!==window.top;
 if(dp){dp.prompt();try{await dp.userChoice}catch(e){}dp=null;return}
 if(ios&&(inFr||/CriOS|FxiOS|EdgiOS|GSA|FBAN|Instagram/.test(u)))return guide(`<h2>Open in Safari first</h2><p>To add the app, open this link in Safari:</p><p style="word-break:break-all"><a href="${FULL}" target="_blank" rel="noopener">${FULL}</a></p><button class="btn" onclick="navigator.clipboard&&navigator.clipboard.writeText('${FULL}');this.textContent='Copied'">Copy link</button>`);
 if(ios)return guide(`<h2>Add WifiPhone to your Home Screen</h2><ol style="font-size:18px;line-height:1.8"><li>Tap the Share button <span style="font-size:26px">⬆️</span> at the bottom of Safari</li><li>Scroll and tap <b>Add to Home Screen</b> ➕</li><li>Tap <b>Add</b></li></ol><div style="position:fixed;bottom:12px;left:50%;transform:translateX(-50%);font-size:46px;animation:p 1s infinite">⬇️</div>`);
 if(inFr)return guide(`<h2>Open the full app</h2><p><a href="${FULL}" target="_blank" rel="noopener">${FULL}</a></p><p>Then tap Download the app again.</p>`);
 if(/Firefox/.test(u))return guide(`<h2>Install in Firefox</h2><ol style="font-size:17px;line-height:1.8"><li>Tap the menu ⋮ (Android) or ☰</li><li>Tap <b>Install</b> or <b>Add to Home screen</b></li></ol><p>On a laptop, Firefox cannot install apps. Use Chrome or Edge, or bookmark this page.</p>`);
 guide(`<h2>Install the app</h2><ol style="font-size:17px;line-height:1.8"><li>Open the browser menu ⋮</li><li>Tap <b>Install app</b> or <b>Add to Home screen</b></li></ol><p>On a laptop in Chrome or Edge, click the install icon at the right of the address bar.</p>`)};
addEventListener('appinstalled',()=>$('#dlapp').style.display='none');
// SIM settings
(function(){const u=navigator.userAgent,ios=/iPhone|iPad|iPod/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),and=/Android/.test(u),o=$('#simsetopen');
 const steps=ios?'iPhone or iPad: open Settings, tap Mobile (or Cellular), then SIMs or Add eSIM.':and?'Android: open Settings, then Connections or Network and internet, then SIM manager or Mobile network.':'SIM settings are on phones only. Open this app on your phone to use them.';
 $('#simsetsteps').textContent=steps;
 if(and){const enc=s=>encodeURIComponent(s);const w='intent:#Intent;action=android.settings.WIRELESS_SETTINGS;end',r='intent:#Intent;action=android.settings.DATA_ROAMING_SETTINGS;S.browser_fallback_url='+enc(w)+';end';o.href='intent:#Intent;action=android.settings.NETWORK_OPERATOR_SETTINGS;S.browser_fallback_url='+enc(r)+';end'}
 else if(ios)o.href='App-Prefs:MOBILE_DATA_SETTINGS_ID';else o.style.display='none';
 o.addEventListener('click',()=>setTimeout(()=>{$('#simsetsteps').textContent=steps+' If settings did not open, follow these steps.'},1500));
 function net(){const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;const rows=[['Internet',navigator.onLine?'Online':'Offline'],['WifiPhone',ready?'Ready':'Connecting']];
  if(c){if(c.type)rows.push(['Connection',c.type]);if(c.effectiveType)rows.push(['Speed class',c.effectiveType.toUpperCase()]);if(c.downlink)rows.push(['Download about',c.downlink+' Mbps']);if(c.rtt)rows.push(['Delay about',c.rtt+' ms']);if(c.saveData)rows.push(['Data saver','On'])}else rows.push(['Connection details','Not shared by this browser']);
  $('#netpanel').innerHTML=rows.map(r=>`<div><b>${r[0]}:</b> ${esc(r[1])}</div>`).join('')}
 net();setInterval(net,5000);addEventListener('online',net);addEventListener('offline',net);try{navigator.connection&&navigator.connection.addEventListener('change',net)}catch(e){}
 $('#gsimset').onclick=()=>{document.querySelector('nav button[data-t=me]').click();net();setTimeout(()=>$('#simset').scrollIntoView({behavior:'smooth'}),50)}})();
// SIM PIN (salted SHA-256 hash only)
async function hashPin(pin,salt){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+pin));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const pinRec=()=>LS.get('pin',null);
async function setPin(pin){const s=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join('');LS.set('pin',{s,h:await hashPin(pin,s)});LS.set('pinfail',{n:0,until:0})}
async function checkPin(pin){const r=pinRec();return !!r&&await hashPin(pin,r.s)===r.h}
let pentry='';function lockNow(){pentry='';$('#pinshow').textContent='';$('#lock').classList.add('show')}
'123456789C0✓'.split('').forEach(k=>{const b=document.createElement('button');b.textContent=k;b.onclick=()=>pinKey(k);$('#kp').appendChild(b)});
async function pinKey(k){const f=LS.get('pinfail',{n:0,until:0});if(Date.now()<f.until){$('#pinmsg').textContent=`Too many tries. Wait ${Math.ceil((f.until-Date.now())/1000)} seconds.`;return}
 if(k==='C')pentry='';else if(k==='✓'){if(await checkPin(pentry)){LS.set('pinfail',{n:0,until:0});$('#lock').classList.remove('show');$('#pinmsg').textContent=''}else{f.n++;if(f.n>=3){f.until=Date.now()+30000;f.n=0;$('#pinmsg').textContent='Too many tries. Wait 30 seconds.'}else $('#pinmsg').textContent='Wrong PIN';LS.set('pinfail',f)}pentry=''}
 else if(pentry.length<8)pentry+=k;$('#pinshow').textContent='•'.repeat(pentry.length)}
document.addEventListener('keydown',e=>{if(!$('#lock').classList.contains('show'))return;if(/^\d$/.test(e.key))pinKey(e.key);else if(e.key==='Enter')pinKey('✓');else if(e.key==='Backspace')pinKey('C')});
$('#lmum').onclick=()=>{const m=contacts.find(c=>/^mum$/i.test(c.name));if(!m){$('#pinmsg').textContent='Mum is not saved yet. Unlock to save her.';return}startCall(m.num,false)};
$('#lforgot').onclick=()=>{if(confirm('Forgot PIN: this removes the SIM PIN from this app. Your contacts and messages stay. Continue?')){localStorage.removeItem('cb_pin');localStorage.removeItem('cb_pinfail');$('#lock').classList.remove('show')}};
function pinUI(){const on=!!pinRec();$('#pinstate').textContent=on?'SIM PIN is ON':'SIM PIN is OFF';$('#pinon').style.display=on?'none':'';$('#pinchg').style.display=$('#pinoff').style.display=$('#pcur').style.display=on?'':'none';$('#p1').value=$('#p2').value=$('#pcur').value=''}
const pinValid=()=>{const x=$('#p1').value,y=$('#p2').value;if(!/^\d{4,8}$/.test(x)){$('#pinset').textContent='PIN must be 4 to 8 digits';return null}if(x!==y){$('#pinset').textContent='The two PINs do not match';return null}return x};
$('#pinon').onclick=async()=>{const p=pinValid();if(!p)return;await setPin(p);pinUI();$('#pinset').textContent='SIM PIN is on'};
$('#pinchg').onclick=async()=>{if(!await checkPin($('#pcur').value)){$('#pinset').textContent='Current PIN is wrong';return}const p=pinValid();if(!p)return;await setPin(p);pinUI();$('#pinset').textContent='PIN changed'};
$('#pinoff').onclick=async()=>{if(!await checkPin($('#pcur').value)){$('#pinset').textContent='Current PIN is wrong';return}localStorage.removeItem('cb_pin');pinUI();$('#pinset').textContent='SIM PIN is off'};
pinUI();if(pinRec())lockNow();
// share/install
$('#share').onclick=()=>{const t=`Add me on Coffeebreak WifiPhone: ${me} ${location.href.split('#')[0]}`;navigator.share?navigator.share({title:'Coffeebreak WifiPhone',text:t}).catch(()=>{}):navigator.clipboard.writeText(t).then(()=>alert('Copied'))};
let dp;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;$('#install').style.display='inline-block'});
$('#install').onclick=()=>{dp&&dp.prompt();dp=null;$('#install').style.display='none'};
if(/iphone|ipad/i.test(navigator.userAgent)&&!navigator.standalone)$('#ioshint').textContent='On iPhone: tap Share, then Add to Home Screen.';
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
document.addEventListener('click',()=>{try{Notification.permission==='default'&&Notification.requestPermission()}catch(e){}},{once:true});
// add contact from ?add= link (QR scanned by phone camera)
const qa=new URLSearchParams(location.search).get('add');if(qa&&norm(qa)&&norm(qa)!==me){const tq=setInterval(()=>{if(!ready)return;clearInterval(tq);openConnect();helloTo(norm(qa))},300)}
// keyboard: Escape goes back (Tab navigation is native)
addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('#call.show'))$('#hang').click();else if($('#chat.show'))$('#cback').click()});
render();setReady();startPeer();if(IN_FRAME){showFull()}$('#fulla').href=location.href.split('#')[0];
(function(){const t=LS.get('tab','phone');const b=document.querySelector(`nav button[data-t="${t}"]`);if(b&&t!=='phone'&&!/[?&]add=/.test(location.search))b.click();
 document.querySelectorAll('nav button').forEach(x=>x.addEventListener('click',()=>LS.set('tab',x.dataset.t)));
 if(!LS.get('tipdone',false))$('#tipbar').style.display='';$('#tipx').onclick=()=>{LS.set('tipdone',true);$('#tipbar').style.display='none'};})();
window.__cb={setPin,pinKey,sendRaw:(num,obj)=>{const n=norm(num.replace(/^CB-?/,''))||norm(num);if(!n)return false;const c=conns[n];if(c&&c.open){c.send(obj);return true}const nc=peer.connect(pid(n),{reliable:true,serialization:'json'});conns[n]=nc;wire(nc);nc.on('open',()=>nc.send(obj));return true},helloTo,codeConnect,openConnect,myCode:()=>myCode,syncNow,setName:n=>LS.set('myname',n),parseVCF,addImported,contacts:()=>contacts,linkCall,me,sendMsg,threads:()=>threads,startCall,state:()=>({ready,cur:!!cur}),};
