'use strict';
(function(){const $=s=>document.querySelector(s),PFX='coffeebreak-dsim-v1-';
document.querySelector('nav').style.display='none';$('#guest').style.display='block';
const h=new URLSearchParams(location.hash.slice(1)),host=(h.get('call')||h.get('msg')||'').replace(/\D/g,''),hostNum=`CB-${host.slice(0,4)}-${host.slice(4)}`;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const id='cbguest-'+Math.random().toString(36).slice(2,10);
const peer=new Peer(id,{config:{iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'},{urls:'stun:global.stun.twilio.com:3478'},{urls:'stun:stun.nextcloud.com:443'}]}});
let ready=new Promise(r=>peer.on('open',r));window.__g={state:{}};
peer.on('error',e=>{if(e.type==='peer-unavailable')$('#gst').textContent='They are not online right now. Try again later.'});
const note='<p class="note">Free browser call or chat from Coffeebreak WifiPhone. Nothing to install.</p>';
if(h.get('call')){const video=h.get('v')==='1';$('#gtitle').textContent=`${hostNum} is calling you`;
 $('#gbody').innerHTML=`<p>${video?'Video':'Voice'} call</p><button class="round" id="gans" style="width:110px;height:110px;font-size:40px">📞</button><p><b>Answer</b></p><p id="gst"></p><button class="btn" id="ghang" style="background:#c62828;display:none">End call</button><video id="grv" autoplay playsinline style="width:100%;margin-top:10px;display:none"></video><audio id="gra" autoplay></audio>`+note;
 let call,stream;$('#gans').onclick=async()=>{$('#gst').textContent='Connecting...';try{stream=await navigator.mediaDevices.getUserMedia({audio:true,video:video})}catch(e){try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e2){stream=new MediaStream()}}
  await ready;call=peer.call(PFX+'CB'+host,stream,{metadata:{video,guest:true}});$('#gst').textContent='Ringing...';$('#gans').style.display='none';$('#ghang').style.display='';
  call.on('stream',r=>{(video?$('#grv'):$('#gra')).srcObject=r;if(video)$('#grv').style.display='';$('#gst').textContent='Connected';window.__g.state.connected=true});
  call.on('close',()=>{$('#gst').textContent='Call ended';stream.getTracks().forEach(t=>t.stop())})};
 $('#ghang').onclick=()=>{call&&call.close();$('#gst').textContent='Call ended'};}
else{let txt='';try{txt=decodeURIComponent(escape(atob((h.get('t')||'').replace(/-/g,'+').replace(/_/g,'/'))))}catch(e){}
 $('#gtitle').textContent=`Message from ${hostNum}`;
 $('#gbody').innerHTML=`<div class="m" style="margin:auto;max-width:90%">${esc(txt)}</div><div id="greps" style="display:flex;flex-direction:column;gap:6px;margin:10px 0"></div><input id="gtext" placeholder="Write a reply"><button class="btn" id="gsend">Send reply</button><p id="gst"></p>`+note;
 let conn;const send=async()=>{const t=$('#gtext').value.trim();if(!t)return;await ready;$('#gst').textContent='Sending...';
  const go=()=>{conn.send({type:'msg',id:crypto.randomUUID(),text:t,t:Date.now()})};
  if(conn&&conn.open)go();else{conn=peer.connect(PFX+'CB'+host,{reliable:true,serialization:'json'});conn.on('open',go);conn.on('data',d=>{if(d.type==='ack'){$('#gst').textContent='Delivered';window.__g.state.delivered=true}else if(d.type==='msg'){const m=document.createElement('div');m.className='m';m.textContent=d.text;$('#greps').appendChild(m);conn.send({type:'ack',id:d.id})}})}
  const m=document.createElement('div');m.className='m me';m.textContent=t;$('#greps').appendChild(m);$('#gtext').value=''};
 $('#gsend').onclick=send;}
})();
