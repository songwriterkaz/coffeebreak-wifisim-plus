'use strict';
(function(){const $=s=>document.querySelector(s);let pc,dc,micStream,scanning=false;
const b64=u=>btoa(String.fromCharCode(...u)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function z(str){if(!window.CompressionStream)return 'P'+b64(new TextEncoder().encode(str));const cs=new Blob([str]).stream().pipeThrough(new CompressionStream('deflate-raw'));return 'Z'+b64(new Uint8Array(await new Response(cs).arrayBuffer()))}
async function unz(s){if(s[0]==='P')return new TextDecoder().decode(unb64(s.slice(1)));const ds=new Blob([unb64(s.slice(1))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return await new Response(ds).text()}
// keep only lines needed to connect
const slim=sdp=>sdp.split('\r\n').filter(l=>!/^a=(extmap|rtcp-fb|fmtp:(?!111)|rtpmap:(?!111))/.test(l)&&!/^a=ssrc/.test(l)).join('\r\n');
const st=t=>{$('#lmst').textContent=t};
function addMsg(t,me){const d=document.createElement('div');d.className='m'+(me?' me':'');d.textContent=t;$('#lmmsgs').appendChild(d);$('#lmmsgs').scrollTop=1e9}
function wireDC(c){dc=c;dc.onopen=()=>{st('Connected on home wifi');$('#lmchat').style.display='';$('#lmqr').innerHTML='';window.__lmOpen=true};
 dc.onmessage=e=>{const d=JSON.parse(e.data);if(d.t==='msg')addMsg(d.text,false);else if(d.t==='sig')onSig(d)};dc.onclose=()=>st('Home wifi link closed')}
function newPC(){pc=new RTCPeerConnection({iceServers:[]});pc.ontrack=e=>{$('#lmaudio').srcObject=e.streams[0];st('Voice call connected on home wifi');window.__lmCall=true};pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed')st('Could not connect. The router or browser may block local connections.')};return pc}
const gathered=p=>new Promise(r=>{if(p.iceGatheringState==='complete')return r();p.addEventListener('icegatheringstatechange',()=>p.iceGatheringState==='complete'&&r());setTimeout(r,3000)});
function showQR(code){$('#lmqr').innerHTML='';new QRCode($('#lmqr'),{text:code,width:240,height:240,correctLevel:QRCode.CorrectLevel.L});window.__lmCode=code}
let role=null;
async function startA(){role='A';newPC();wireDC(pc.createDataChannel('cb',{ordered:true}));await pc.setLocalDescription(await pc.createOffer());await gathered(pc);
 const code='CBO:'+((window.__cb&&window.__cb.me)||'')+'|'+await z(slim(pc.localDescription.sdp));showQR(code);st('Step 1 of 2: on the other phone tap Scan a pairing code and scan this. If there is no internet, then scan their reply code here.')}
async function handle(code){code=code.trim();
 if(code.startsWith('CBO:')){role='B';let body=code.slice(4),from='';if(body.includes('|')){[from,body]=body.split('|')}newPC();pc.ondatachannel=e=>wireDC(e.channel);await pc.setRemoteDescription({type:'offer',sdp:await unz(body)});await pc.setLocalDescription(await pc.createAnswer());await gathered(pc);
  const a='CBA:'+await z(slim(pc.localDescription.sdp));
  if(from&&window.__cb&&window.__cb.state().ready&&window.__cb.sendRaw(from,{type:'lanans',code:a})){st('Connecting over the internet signal, no second scan needed...');setTimeout(()=>{if(!window.__lmOpen){showQR(a);st('Step 2 of 2: scan this reply code with the first phone.')}},8000)}
  else{showQR(a);st('Step 2 of 2: scan this reply code with the first phone.')}}
 else if(code.startsWith('CBA:')&&pc){await pc.setRemoteDescription({type:'answer',sdp:await unz(code.slice(4))});st('Connecting...')}
 else st('That is not a Coffeebreak pairing code.')}
// in-band renegotiation for voice
async function onSig(d){if(d.sdp.type==='offer'){await pc.setRemoteDescription(d.sdp);if(!micStream){try{micStream=await navigator.mediaDevices.getUserMedia({audio:true});micStream.getTracks().forEach(t=>pc.addTrack(t,micStream))}catch(e){}}
 await pc.setLocalDescription(await pc.createAnswer());await gathered(pc);dc.send(JSON.stringify({t:'sig',sdp:pc.localDescription}))}else await pc.setRemoteDescription(d.sdp)}
async function call(){try{micStream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){return st('Microphone blocked')}micStream.getTracks().forEach(t=>pc.addTrack(t,micStream));
 await pc.setLocalDescription(await pc.createOffer());await gathered(pc);dc.send(JSON.stringify({t:'sig',sdp:pc.localDescription}));st('Calling on home wifi...')}
async function scan(){if(scanning)return;const v=$('#lmcam');try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});v.srcObject=s;v.style.display='';await v.play();scanning=true;st('Point the camera at the pairing code')
 const c=document.createElement('canvas'),x=c.getContext('2d',{willReadFrequently:true});const stop=()=>{scanning=false;s.getTracks().forEach(t=>t.stop());v.style.display='none'};
 (function tick(){if(!scanning)return;if(v.videoWidth){c.width=v.videoWidth;c.height=v.videoHeight;x.drawImage(v,0,0);const r=jsQR(x.getImageData(0,0,c.width,c.height).data,c.width,c.height);if(r&&/^CB[OA]:/.test(r.data)){stop();handle(r.data);return}}requestAnimationFrame(tick)})()}
 catch(e){const p=prompt('Camera not available. Paste the pairing code instead:');if(p)handle(p)}}
window.addEventListener('load',()=>{$('#lmA').onclick=startA;$('#lmB').onclick=scan;$('#lmcall').onclick=call;
 $('#lmhang').onclick=()=>{micStream&&micStream.getTracks().forEach(t=>t.stop());micStream=null;$('#lmaudio').srcObject=null;st('Call ended')};
 $('#lmform').onsubmit=e=>{e.preventDefault();const t=$('#lmtext').value.trim();if(!t||!dc||dc.readyState!=='open')return;dc.send(JSON.stringify({t:'msg',text:t}));addMsg(t,true);$('#lmtext').value=''}});
window.__lm={startA,handle,call,send:t=>{dc.send(JSON.stringify({t:'msg',text:t}));addMsg(t,true)}};})();
