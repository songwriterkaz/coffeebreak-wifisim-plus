'use strict';
/* Coffeebreak WifiPhone extras: walkie talkie, voice notes, photos and files, group chat, easy mode. All peer to peer over the app's PeerJS link. */
(function(){if(typeof startPeer!=='function')return;
const X=s=>document.querySelector(s),XL={g:(k,d)=>{try{const v=JSON.parse(localStorage.getItem('cbx_'+k));return v==null?d:v}catch(e){return d}},s:(k,v)=>{try{localStorage.setItem('cbx_'+k,JSON.stringify(v))}catch(e){}}};
const myN=()=>{try{return myName()}catch(e){return me}};
let tt;function toast(t){let b=X('#cbtoast');if(!b){b=document.createElement('div');b.id='cbtoast';b.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#3b2417;color:#fff;padding:10px 16px;border-radius:14px;z-index:60;font-size:15px;max-width:90%;text-align:center';document.body.appendChild(b)}b.textContent=t;b.style.display='block';clearTimeout(tt);tt=setTimeout(()=>b.style.display='none',5000)}
let actx;function beep(f){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=f;g.gain.value=.12;o.connect(g).connect(actx.destination);o.start();o.stop(actx.currentTime+.12)}catch(e){}}
/* connections */
function dc(n){const ex=conns[n];if(ex&&ex.open)return Promise.resolve(ex);return new Promise((res,rej)=>{let c=ex;if(!c){c=peer.connect(pid(n),{reliable:true,serialization:'json'});conns[n]=c;wire(c)}c.on('open',()=>res(c));setTimeout(()=>{if(!c.open){if(conns[n]===c)delete conns[n];rej()}},15000)})}
const sendTo=(n,o)=>dc(n).then(c=>{c.send(o);return true}).catch(()=>false);
/* media in chats */
const MAX=180000,okMime=m=>/^[\w.+-]+\/[\w.+-]+$/.test(m||'')?m:'application/octet-stream',okB64=s=>typeof s==='string'&&/^[A-Za-z0-9+/=]*$/.test(s);
function prune(){Object.values(threads).flat().filter(m=>m.media&&m.media.data).slice(0,-12).forEach(m=>m.media.data='')}
function addMsg(n,m){(threads[n]=threads[n]||[]).push(m);try{save()}catch(e){prune();try{save()}catch(e2){}}render()}
window.cbMedia=md=>{if(!md||!md.data||!okB64(md.data))return '<br><small>(media removed to save space)</small>';const src='data:'+okMime(md.mime)+';base64,'+md.data;
 if(md.k==='voice')return '<br><audio controls src="'+src+'"></audio>';if(md.k==='img'&&/^image\/(jpeg|png|webp|gif)$/.test(md.mime))return '<br><img src="'+src+'" alt="Photo" style="max-width:100%;border-radius:10px">';
 return '<br><a download="'+esc(md.name||'file')+'" href="'+src+'" style="color:inherit;font-weight:700">⬇️ '+esc(md.name||'file')+'</a>'};
const b64=buf=>{let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)};
async function sendMedia(n,media,label){const id=crypto.randomUUID(),t=Date.now();addMsg(n,{id,me:true,text:label,t,sent:false,media});
 if(n.startsWith('G:'))return groupSend(n,{text:label,media,id,t});
 if(!(await sendTo(n,{type:'media',id,t,text:label,media})))toast('They are not online right now. Photos, files and voice notes only send while both apps are open.')}
window.cbExt=(d,n,c)=>{
 if(d.type==='media'){if(!d.media||!okB64(d.media.data))return;d.media.mime=okMime(d.media.mime);const th=threads[n]||[];if(!th.some(m=>m.id===d.id)){addMsg(n,{id:d.id,me:false,text:String(d.text||'Attachment').slice(0,60),t:d.t,read:openChat===n,media:d.media});notify(nameOf(n),String(d.text||''))}c.send({type:'ack',id:d.id})}
 else if(d.type==='gmsg'){if(!/^[\w-]{6,40}$/.test(d.gid||''))return;const gid='G:'+d.gid,g=groups();g[gid]={name:String(d.name||'Group').slice(0,40),members:(d.members||[]).filter(x=>/^CB-\d{4}-\d{4}$/.test(x))};XL.s('groups',g);
  if(d.media&&!okB64(d.media.data))d.media=null;if(d.media)d.media.mime=okMime(d.media.mime);
  const th=threads[gid]||[];if(!th.some(m=>m.id===d.id)){addMsg(gid,{id:d.id,me:false,text:nameOf(n)+': '+String(d.text||''),t:d.t,read:openChat===gid,media:d.media||undefined});notify(g[gid].name,nameOf(n)+': '+String(d.text||''))}c.send({type:'ack',id:d.id})}
 else if(d.type==='wkinv'){if(typeof d.ch!=='string')return;if(XL.g('wkon',true)){wkJoin(d.ch);toast(nameOf(n)+' opened a walkie channel with you. Walkie is on.')}else toast(nameOf(n)+' wants to walkie. Turn walkie on to hear them.')}};
/* chat composer: voice note + attach */
const form=X('#cform'),vb=document.createElement('button'),fl=document.createElement('label');vb.type='button';vb.className='btn';vb.textContent='🎤';vb.title='Record a voice note (tap to start, tap to send)';vb.style.cssText='padding:8px 12px';
fl.className='btn';fl.textContent='📎';fl.title='Send a photo or file';fl.style.cssText='padding:8px 12px;cursor:pointer';const fi=document.createElement('input');fi.type='file';fi.style.display='none';fl.appendChild(fi);form.insertBefore(fl,form.firstChild);form.insertBefore(vb,form.firstChild);
let rec=null,recT;vb.onclick=async()=>{if(rec){rec.stop();return}if(!window.MediaRecorder)return toast('Voice notes are not supported in this browser');let s;try{s=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){return toast('Microphone not allowed')}
 const to=openChat,ch=[];const mt=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(m=>MediaRecorder.isTypeSupported(m))||'';rec=new MediaRecorder(s,mt?{mimeType:mt,audioBitsPerSecond:16000}:{});rec.ondataavailable=e=>ch.push(e.data);
 rec.onstop=async()=>{clearTimeout(recT);s.getTracks().forEach(t=>t.stop());rec=null;vb.textContent='🎤';const bl=new Blob(ch,{type:(mt||'audio/webm').split(';')[0]});if(bl.size>MAX)return toast('Voice note too long');sendMedia(to,{k:'voice',mime:bl.type,data:b64(await bl.arrayBuffer())},'🎤 Voice note')};
 rec.start();vb.textContent='⏹ Send';recT=setTimeout(()=>rec&&rec.stop(),60000);toast('Recording. Tap ⏹ to send (up to 60 seconds).')};
async function shrink(f){const img=await createImageBitmap(f);let w=img.width,h=img.height,s=Math.min(1,1024/Math.max(w,h)),q=.75,out;const cv=document.createElement('canvas');
 for(let i=0;i<6;i++){cv.width=Math.round(w*s);cv.height=Math.round(h*s);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);out=await new Promise(r=>cv.toBlob(r,'image/jpeg',q));if(out.size<=MAX)break;s*=.75;q=Math.max(.5,q-.1)}return out}
fi.onchange=async()=>{const f=fi.files[0];fi.value='';if(!f||!openChat)return;const to=openChat;
 if(/^image\//.test(f.type)&&!/gif/.test(f.type)){let bl;try{bl=await shrink(f)}catch(e){bl=f}if(bl.size>MAX)return toast('Photo is too big to send');return sendMedia(to,{k:'img',mime:'image/jpeg',data:b64(await bl.arrayBuffer()),name:f.name},'📷 Photo')}
 if(f.size>MAX)return toast('Files up to 175 KB can be sent. Share bigger files by email or a link.');sendMedia(to,{k:'file',mime:okMime(f.type),name:f.name.slice(0,80),data:b64(await f.arrayBuffer())},'📎 '+f.name.slice(0,40))};
/* group chat */
const groups=()=>XL.g('groups',{});window.cbGroupName=gid=>(groups()[gid]||{}).name?'👥 '+groups()[gid].name:'👥 Group';
async function groupSend(gid,{text,media,id,t}){const g=groups()[gid];if(!g)return;const others=g.members.filter(m=>m!==me);const r=await Promise.all(others.map(m=>sendTo(m,{type:'gmsg',gid:gid.slice(2),name:g.name,members:g.members,id,t,text,media})));const ok=r.filter(Boolean).length;
 const m=(threads[gid]||[]).find(x=>x.id===id);if(m){m.sent=ok>0;try{save()}catch(e){}render()}if(ok<others.length)toast((others.length-ok)+' of '+others.length+' not online. Group messages only reach people with the app open.')}
const of=form.onsubmit;form.onsubmit=e=>{if(openChat&&openChat.startsWith('G:')){e.preventDefault();const t=X('#ctext').value.trim();if(!t)return;X('#ctext').value='';const id=crypto.randomUUID(),tm=Date.now();addMsg(openChat,{id,me:true,text:t,t:tm,sent:false});groupSend(openChat,{text:t,id,t:tm});return}return of(e)};
const occ=X('#ccall').onclick,ocv=X('#cvid').onclick;X('#ccall').onclick=()=>{if(openChat&&openChat.startsWith('G:')){const g=groups()[openChat];X('#cback').click();openWalkie();wkJoin('grp'+openChat.slice(2,14));g.members.filter(m=>m!==me).forEach(m=>sendTo(m,{type:'wkinv',ch:'grp'+openChat.slice(2,14)}));return}occ()};
X('#cvid').onclick=()=>{if(openChat&&openChat.startsWith('G:'))return toast('Video calls are one to one. Tap 📞 for a group walkie.');ocv()};
const gbox=document.createElement('div');gbox.innerHTML='<h4>New group chat</h4><input id="gname" placeholder="Group name"><div id="gpick" style="max-height:180px;overflow:auto"></div><button class="btn" id="gmake">Create group</button>';X('#t-msgs').appendChild(gbox);
function gpick(){const cs=contacts.filter(c=>/^CB-/.test(c.num));X('#gpick').innerHTML=cs.length?cs.map(c=>'<label class="row" style="margin-bottom:4px"><input type="checkbox" value="'+esc(c.num)+'" style="width:auto"> <b>'+esc(c.name)+'</b></label>').join(''):'<p style="font-size:13px">Add Coffeebreak contacts first.</p>'}
X('nav').addEventListener('click',gpick);gpick();
X('#gmake').onclick=()=>{const ms=[...X('#gpick').querySelectorAll('input:checked')].map(i=>i.value);if(!ms.length)return toast('Tick at least one person');const gid='G:'+crypto.randomUUID().replace(/-/g,'').slice(0,16),g=groups();g[gid]={name:X('#gname').value.trim()||'Coffeebreak group',members:[me,...ms]};XL.s('groups',g);X('#gname').value='';addMsg(gid,{id:crypto.randomUUID(),me:true,text:'Group created with '+ms.map(nameOf).join(', '),t:Date.now(),sent:true});showChat(gid)};
/* walkie talkie */
const wk={ch:null,hub:null,hc:null,cl:{},mem:{},out:[],inc:[],st:null,talking:false,who:{}};
const HUB=ch=>PFX+'wk-'+ch.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,40);
const wkOn=()=>XL.g('wkon',true);
function wkStatus(t){const s=X('#wkst');if(s)s.textContent=t}
function wkRoster(){const m=X('#wkmem');if(m)m.textContent=Object.entries(wk.mem).map(([n,nm])=>n===me?'You':(contacts.find(c=>c.num===n)||{}).name||nm||n).join(', ')||'Nobody yet';const c=X('#wkcur');if(c)c.textContent=wk.ch||'none'}
function drawWho(){const w=X('#wkwho');if(!w)return;const t=Object.entries(wk.who).filter(x=>x[1]).map(([n,nm])=>n===me?'You':nameOf(n)!==n?nameOf(n):nm||n);w.textContent=t.length?'🔊 '+t.join(', ')+' talking':'Quiet';w.style.background=t.length?'#ffcdd2':'#eee'}
function setWho(n,on,nm){wk.who[n]=on?(nm||n):null;drawWho()}
function wkLeave(){talkStop();if(wk.hub){try{wk.hub.destroy()}catch(e){}}if(wk.hc){try{wk.hc.close()}catch(e){}}wk.inc.forEach(c=>{try{c.close()}catch(e){}});Object.assign(wk,{ch:null,hub:null,hc:null,cl:{},mem:{},inc:[],who:{}});wkRoster();drawWho()}
function wkJoin(ch){ch=String(ch||'').trim().slice(0,40);if(!ch||!HUB(ch).endsWith(ch.toLowerCase().replace(/[^a-z0-9]/g,'')))return;if(wk.ch===ch)return;wkLeave();wk.ch=ch;XL.s('wkch',ch);wkStatus('Joining channel '+ch);wkRoster();tryHub()}
function bc(d,ex){Object.values(wk.cl).forEach(c=>{if(c!==ex&&c.open)c.send(d)})}
function tryHub(){const ch=wk.ch;if(!ready){wkStatus('Waiting for connection');return setTimeout(()=>wk.ch===ch&&!wk.hub&&!wk.hc&&tryHub(),3000)}const h=new Peer(HUB(ch),{config:peer.options.config});
 h.on('open',()=>{if(wk.ch!==ch)return h.destroy();wk.hub=h;wk.mem={[me]:myN()};wkStatus('On channel '+ch);wkRoster();
  h.on('connection',c=>{c.on('data',d=>{if(d.type==='join'&&/^CB-\d{4}-\d{4}$/.test(d.num)){wk.cl[d.num]=c;wk.mem[d.num]=String(d.name||'').slice(0,40);bc({type:'roster',m:wk.mem});wkRoster()}else if(d.type==='talk'){bc(d,c);onTalk(d)}});
   c.on('close',()=>{for(const k in wk.cl)if(wk.cl[k]===c){delete wk.cl[k];delete wk.mem[k];setWho(k,false)}bc({type:'roster',m:wk.mem});wkRoster()})})});
 h.on('error',e=>{try{h.destroy()}catch(x){}if(wk.ch!==ch||wk.hub)return;if(e.type==='unavailable-id')joinHub();else{wkStatus('Could not reach the channel, retrying');setTimeout(()=>wk.ch===ch&&!wk.hub&&!wk.hc&&tryHub(),4000)}})}
function joinHub(){const ch=wk.ch,c=peer.connect(HUB(ch),{reliable:true,serialization:'json'});wk.hc=c;
 c.on('open',()=>{c.send({type:'join',num:me,name:myN()});wkStatus('On channel '+ch)});
 c.on('data',d=>{if(d.type==='roster'&&d.m&&typeof d.m==='object'){wk.mem=d.m;wkRoster()}else if(d.type==='talk')onTalk(d)});
 c.on('close',()=>{if(wk.hc===c&&wk.ch===ch){wk.hc=null;wkStatus('Reconnecting channel');setTimeout(()=>{if(wk.ch===ch&&!wk.hub&&!wk.hc)tryHub()},500+Math.random()*2500)}});
 setTimeout(()=>{if(!c.open&&wk.hc===c){try{c.close()}catch(e){}wk.hc=null;tryHub()}},10000)}
function sendTalk(d){if(wk.hub)bc(d);else if(wk.hc&&wk.hc.open)wk.hc.send(d)}
function onTalk(d){if(!d||typeof d.num!=='string'||d.num===me)return;setWho(d.num,!!d.on,String(d.name||'').slice(0,40));if(!d.on)wk.inc.filter(c=>fromPid(c.peer)===d.num).forEach(c=>{try{c.close()}catch(e){}})}
async function mic(){if(wk.st&&wk.st.active)return wk.st;wk.st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});return wk.st}
function btn(){const b=X('#wktalk');if(!b)return;b.style.background=wk.talking?'#c62828':'#2e7d32';b.textContent=wk.talking?'TALKING':(XL.g('wktap',false)?'TAP TO TALK':'HOLD TO TALK')}
async function talkStart(){if(wk.talking)return;if(!wk.ch)return toast('Join a channel first');wk.talking=true;btn();let s;try{s=await mic()}catch(e){wk.talking=false;btn();return toast('Microphone not allowed')}if(!wk.talking)return;
 beep(880);s.getTracks().forEach(t=>t.enabled=true);Object.keys(wk.mem).filter(m=>m!==me).forEach(m=>wk.out.push(peer.call(pid(m),s,{metadata:{walkie:wk.ch,name:myN()}})));sendTalk({type:'talk',num:me,name:myN(),on:true});setWho(me,true)}
function talkStop(){if(!wk.talking)return;wk.talking=false;btn();wk.out.forEach(c=>{try{c.close()}catch(e){}});wk.out=[];if(wk.st)wk.st.getTracks().forEach(t=>t.enabled=false);beep(440);sendTalk({type:'talk',num:me,name:myN(),on:false});setWho(me,false)}
window.cbWalkieCall=c=>{if(!wkOn()||c.metadata.walkie!==wk.ch){try{c.close()}catch(e){}return}c.answer();const n=fromPid(c.peer);wk.inc.push(c);
 c.on('stream',r=>{const a=X('#wkaudio');a.srcObject=r;a.play().catch(()=>toast('Tap the screen once so walkie sound can play'));beep(660);setWho(n,true,c.metadata.name);window.__wkHeard=(window.__wkHeard||0)+1});
 c.on('close',()=>{wk.inc=wk.inc.filter(x=>x!==c);if(!wk.inc.length){X('#wkaudio').srcObject=null}beep(330);setWho(n,false)})};
window.__wk=wk;
const sec=document.createElement('section');sec.id='t-walkie';sec.innerHTML='<h3><img src="logo.png" alt="Coffeebreak" style="height:28px;vertical-align:middle"> Coffeebreak Walkie Talkie</h3>'+
 '<div class="row" style="font-size:20px"><b style="flex:1">Walkie <span id="wkonl"></span></b><button class="tog" id="wkon" aria-label="Walkie on or off" style="transform:scale(1.4)"></button></div><p style="font-size:13px;margin-top:0">On: voices play straight away. Off: silent, nobody can talk to you.</p>'+
 '<div class="sub"><input id="wkch" placeholder="Channel name, e.g. family" style="flex:2"><button class="btn" id="wkjoin" style="flex:1">Join</button><button class="btn" id="wkleave" style="flex:1;background:#6b4226">Leave</button></div>'+
 '<p>Channel: <b id="wkcur">none</b> · <span id="wkst"></span><br>On the channel: <span id="wkmem">Nobody yet</span></p>'+
 '<div id="wkwho" style="text-align:center;font-weight:700;font-size:20px;padding:10px;border-radius:12px;background:#eee">Quiet</div>'+
 '<div style="text-align:center;margin:18px 0"><button id="wktalk" style="width:220px;height:220px;border-radius:50%;border:8px solid #fff;box-shadow:0 4px 18px #0005;color:#fff;font-size:26px;font-weight:800;background:#2e7d32;touch-action:none;user-select:none;-webkit-user-select:none">HOLD TO TALK</button></div>'+
 '<label style="font-size:16px"><input type="checkbox" id="wktap" style="width:auto"> Tap to talk, tap again to stop</label><audio id="wkaudio" autoplay></audio>'+
 '<div class="note">Works between people using the Coffeebreak WifiPhone app on the same channel, over WiFi or mobile data, while the app is open. It is not a radio and does not work without internet. Anyone who knows the channel name can join, so pick an unusual name for private chats.</div>';
X('main').appendChild(sec);
function openWalkie(){document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('act',x.dataset.t==='walkie'));document.querySelectorAll('section').forEach(s=>s.classList.toggle('act',s.id==='t-walkie'))}
const nb=document.createElement('button');nb.dataset.t='walkie';nb.textContent='📻 Walkie';nb.onclick=()=>{openWalkie();render()};X('nav').appendChild(nb);
function onDraw(){const o=wkOn();X('#wkon').classList.toggle('on',o);X('#wkonl').textContent=o?'On':'Off';X('#wktap').checked=XL.g('wktap',false);btn()}
X('#wkon').onclick=()=>{XL.s('wkon',!wkOn());if(!wkOn()){wk.inc.forEach(c=>{try{c.close()}catch(e){}});X('#wkaudio').srcObject=null}onDraw()};
X('#wktap').onchange=()=>{XL.s('wktap',X('#wktap').checked);onDraw()};
X('#wkjoin').onclick=()=>wkJoin(X('#wkch').value);X('#wkleave').onclick=()=>{wkLeave();XL.s('wkch','');wkStatus('Left the channel')};
const T=X('#wktalk');T.onpointerdown=e=>{e.preventDefault();if(XL.g('wktap',false))return wk.talking?talkStop():talkStart();try{T.setPointerCapture(e.pointerId)}catch(x){}talkStart()};
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>T.addEventListener(ev,()=>{if(!XL.g('wktap',false))talkStop()}));T.oncontextmenu=e=>e.preventDefault();
onDraw();X('#wkch').value=XL.g('wkch','');if(XL.g('wkch',''))setTimeout(()=>wkJoin(XL.g('wkch','')),2500);
window.__wkApi={join:wkJoin,start:talkStart,stop:talkStop};
/* quick and easy mode */
const st=document.createElement('style');st.textContent='.cb-easy{font-size:18px}.ez{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.ez button{min-height:84px;border:0;border-radius:18px;font-size:20px;font-weight:700;color:#fff;background:var(--hot)}.ezp button{background:#fff;color:var(--brown);border:3px solid var(--pink)}#ezsheet{position:fixed;inset:0;background:#0008;z-index:55;display:none;align-items:flex-end}#ezsheet .in{background:var(--cream);width:100%;max-width:480px;margin:auto;border-radius:20px 20px 0 0;padding:16px}#ezsheet .in button{display:block;width:100%;min-height:70px;margin:8px 0;font-size:24px;font-weight:700;border:0;border-radius:16px;color:#fff}';document.head.appendChild(st);
const ez=document.createElement('div');ez.id='ezbox';X('#p-keypad').insertBefore(ez,X('#p-keypad').firstChild);
const sh=document.createElement('div');sh.id='ezsheet';sh.innerHTML='<div class="in"><h2 id="ezname" style="text-align:center;margin:4px"></h2><button id="ezcall" style="background:#2e7d32">📞 Call</button><button id="ezmsg" style="background:var(--hot)">💬 Message</button><button id="ezwk" style="background:#6b4226">📻 Walkie</button><button id="ezx" style="background:#888">Close</button></div>';document.body.appendChild(sh);
let ezn=null;const hideSh=()=>sh.style.display='none';
X('#ezcall').onclick=()=>{hideSh();startCall(ezn,false)};X('#ezmsg').onclick=()=>{hideSh();showChat(ezn)};X('#ezx').onclick=hideSh;
X('#ezwk').onclick=()=>{hideSh();const ch='p'+[me,ezn].sort().join('').replace(/\D/g,'');openWalkie();wkJoin(ch);sendTo(ezn,{type:'wkinv',ch}).then(ok=>toast(ok?'Walkie channel open with '+nameOf(ezn)+'. Hold the button to talk.':nameOf(ezn)+' is not online. Ask them to open the app.'))};
function share(){const t='Call, text and walkie me free on Coffeebreak WifiPhone. My number is '+me;const u=(typeof APPLINK==='string'?APPLINK:location.href);if(navigator.share)navigator.share({title:'My Coffeebreak number',text:t,url:u}).catch(()=>{});else{try{navigator.clipboard.writeText(t+' '+u);toast('Copied. Paste it in a text or email.')}catch(e){prompt('Copy this and send it',t+' '+u)}}}
async function setup(){try{const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop())}catch(e){}try{if(window.Notification&&Notification.permission==='default')await Notification.requestPermission()}catch(e){}localStorage.setItem('cbp_simin','true');XL.s('setup',true);drawEz();toast('All set. Your number is '+me+'. Share it so people can add you.')}
function drawEz(){const on=XL.g('easy',true);document.body.classList.toggle('cb-easy',on);const ppl=contacts.filter(c=>/^CB-/.test(c.num)).sort((a,b)=>(b.fav?1:0)-(a.fav?1:0)).slice(0,8);
 ez.innerHTML='<div class="row" style="margin-bottom:8px"><b style="flex:1">Easy mode</b><button class="tog '+(on?'on':'')+'" id="eztog" aria-label="Easy mode"></button></div>'+(on?((XL.g('setup',false)?'':'<div class="ez"><button id="ezset" style="grid-column:1/3;background:#2e7d32">✅ One-tap setup</button></div>')+
 '<div class="ez"><button id="ezshare">📤 Share my number</button><button id="ezadd" style="background:#6b4226">➕ Add a person</button></div><div class="ez ezp">'+(ppl.map(c=>'<button data-ez="'+esc(c.num)+'">'+esc(c.name)+'</button>').join('')||'<p style="grid-column:1/3;font-size:15px">People you add show here. Tap a person, then Call, Message or Walkie.</p>')+'</div>'):'');
 X('#eztog').onclick=()=>{XL.s('easy',!on);drawEz()};if(!on)return;const s=X('#ezset');if(s)s.onclick=setup;X('#ezshare').onclick=share;X('#ezadd').onclick=()=>X('#gconn').click();
 ez.querySelectorAll('[data-ez]').forEach(b=>b.onclick=()=>{ezn=b.dataset.ez;X('#ezname').textContent=nameOf(ezn);sh.style.display='flex'})}
drawEz();const or=render;window.addEventListener('storage',drawEz);X('nav').addEventListener('click',()=>setTimeout(drawEz,0));setInterval(()=>{const k=JSON.stringify(contacts.map(c=>c.num+c.name+c.fav));if(k!==drawEz.k){drawEz.k=k;drawEz()}},2000);
})();
