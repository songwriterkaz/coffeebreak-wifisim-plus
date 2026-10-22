'use strict';
(function(){const $=s=>document.querySelector(s);let map,layer;
const OV=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
function dist(a,b,c,d){const R=6371e3,r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
const fmt=m=>m<1000?Math.round(m)+' m':(m/1000).toFixed(1)+' km';
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function ensureMap(lat,lon){if(!window.L)return;if(!map){map=L.map('wmap').setView([lat,lon],15);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);layer=L.layerGroup().addTo(map)}else map.setView([lat,lon],15);setTimeout(()=>map.invalidateSize(),100)}
function show(d,cached){ensureMap(d.lat,d.lon);if(layer){layer.clearLayers();L.circleMarker([d.lat,d.lon],{radius:8,color:'#e91e63'}).addTo(layer).bindPopup('You')}
 $('#wlist').innerHTML=d.items.length?d.items.map(p=>{if(layer)L.marker([p.lat,p.lon]).addTo(layer).bindPopup(esc(p.name));
  const g=/android/i.test(navigator.userAgent)?`geo:${p.lat},${p.lon}?q=${p.lat},${p.lon}(${encodeURIComponent(p.name)})`:`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;
  return `<div class="row"><div class="who"><b>${esc(p.name)}</b><span>${fmt(p.d)} · ${esc(p.kind)}</span></div><a class="btn" style="padding:6px 10px;font-size:13px;text-decoration:none" href="${g}" target="_blank">Directions</a></div>`}).join(''):'<p>No free wifi spots found within 3 km in OpenStreetMap.</p>';
 $('#wstat').textContent=cached?`Saved results from ${new Date(d.t).toLocaleString()}`:`Updated ${new Date(d.t).toLocaleTimeString()}`}
async function overpass(lat,lon){const q=`[out:json][timeout:20];(nwr["internet_access"~"^(wlan|yes|wifi)$"]["internet_access:fee"!~"^(yes|customers)$"]["fee"!="yes"](around:3000,${lat},${lon});nwr["amenity"="library"](around:3000,${lat},${lon}););out center 80;`;
 for(const u of OV){try{const c=new AbortController(),t=setTimeout(()=>c.abort(),25000);const r=await fetch(u,{method:'POST',body:'data='+encodeURIComponent(q),signal:c.signal});clearTimeout(t);if(r.ok)return (await r.json()).elements}catch(e){}}throw new Error('busy')}
async function find(){const cached=JSON.parse(localStorage.getItem('cb_wifi')||'null');
 if(!navigator.geolocation){$('#wstat').textContent='Location is not available on this device.';return cached&&show(cached,true)}
 $('#wstat').textContent='Getting your location...';
 navigator.geolocation.getCurrentPosition(async pos=>{const lat=pos.coords.latitude,lon=pos.coords.longitude;ensureMap(lat,lon);$('#wstat').textContent='Searching OpenStreetMap...';
  try{const el=await overpass(lat,lon);const items=el.map(e=>{const la=e.lat??e.center?.lat,lo=e.lon??e.center?.lon,t=e.tags||{};return la&&{name:t.name||t.brand||(t.amenity==='library'?'Library':'Free wifi spot'),kind:t.amenity==='library'?'library'+(t.internet_access?' · wifi':''):(t.amenity||t.shop||t.tourism||'wifi').replace(/_/g,' '),lat:la,lon:lo,d:dist(lat,lon,la,lo)}}).filter(Boolean).sort((a,b)=>a.d-b.d).slice(0,60);
   const d={lat,lon,items,t:Date.now()};localStorage.setItem('cb_wifi',JSON.stringify(d));show(d,false)}
  catch(e){$('#wstat').textContent='The free map service is busy or you are offline. Try again soon.';if(cached)show(cached,true)}},
 ()=>{$('#wstat').textContent='Location permission was not given.';if(cached)show(cached,true)},{enableHighAccuracy:true,timeout:15000,maximumAge:60000})}
document.addEventListener('DOMContentLoaded',()=>{});
window.addEventListener('load',()=>{$('#wfind').onclick=find;const c=JSON.parse(localStorage.getItem('cb_wifi')||'null');document.querySelector('nav button[data-t="wifi"]').addEventListener('click',()=>{if(c&&!map)show(c,true);else map&&setTimeout(()=>map.invalidateSize(),100)})});
window.__wifiFind=find;})();
