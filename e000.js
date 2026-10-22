/* Coffeebreak WifiPhone: Emergency 000 button setting + accidental-tap guard */
(function(){
var S=document.currentScript,KEY=(S&&S.dataset.key)||'cb_e000',KIDS=!!(S&&S.dataset.kids),ANCHOR=(S&&S.dataset.anchor)||'';
function on(){try{return localStorage.getItem(KEY)==='on'}catch(e){return false}}
function set(v){try{localStorage.setItem(KEY,v?'on':'off')}catch(e){}apply()}
var st=document.createElement('style');
st.textContent='html.e000off a[href^="tel:000"],html.e000off .e000btn{display:none !important}'+
'#e000c{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;padding:16px}#e000c.show{display:flex}'+
'#e000c .p{background:#fff;color:#222;border-radius:18px;padding:22px;max-width:380px;width:100%;text-align:center;font-family:inherit}'+
'#e000c h2{font-size:32px;margin:6px 0 18px;color:#c62828}#e000c button{display:block;width:100%;border:0;border-radius:14px;font-size:24px;font-weight:700;padding:18px;margin:10px 0;cursor:pointer}'+
'#e000call{background:#c62828;color:#fff}#e000no{background:#4a2c1a;color:#fff}'+
'#e000c.kids #e000no{background:#2e7d32;font-size:30px;padding:30px}#e000c.kids #e000call{font-size:22px;padding:16px}'+
'.e000set{margin:10px 0;padding:10px;border:2px solid #c62828;border-radius:12px;background:#fff8f0;color:#4a2c1a;text-align:center}.e000set b{display:block;font-size:17px}.e000set small{display:block;font-size:13px;margin:4px 0 8px}'+
'.e000bt{display:flex;gap:10px}.e000set button{flex:1;font-size:22px;font-weight:700;padding:18px 8px;border-radius:14px;cursor:pointer;background:#fff;opacity:.55}.e000set [data-v=on]{color:#2e7d32;border:3px solid #2e7d32}.e000set [data-v=off]{color:#c62828;border:3px solid #c62828}.e000set [data-v=on].sel{background:#2e7d32;color:#fff;opacity:1;box-shadow:0 0 0 4px #a5d6a7}.e000set [data-v=off].sel{background:#c62828;color:#fff;opacity:1;box-shadow:0 0 0 4px #ef9a9a}';
document.head.appendChild(st);
function apply(){var o=on();document.documentElement.classList.toggle('e000off',!o);
 document.querySelectorAll('.e000set').forEach(function(w){w.querySelector('[data-v="on"]').classList.toggle('sel',o);w.querySelector('[data-v="off"]').classList.toggle('sel',!o);w.querySelector('.e000s').textContent=o?'The 000 button is on.':'The 000 button is hidden.'})}
function modal(){var m=document.getElementById('e000c');if(m)return m;m=document.createElement('div');m.id='e000c';if(KIDS)m.className='kids';m.setAttribute('role','dialog');m.setAttribute('aria-label','Call 000');
 m.innerHTML='<div class="p"><h2>Call 000 now?</h2>'+(KIDS?'<button id="e000no">✋ Cancel</button><button id="e000call">📞 Call 000</button>':'<button id="e000call">📞 Call</button><button id="e000no">Cancel</button>')+'</div>';
 document.body.appendChild(m);m.querySelector('#e000no').onclick=function(){m.classList.remove('show')};
 m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('show')});
 m.querySelector('#e000call').onclick=function(){m.classList.remove('show');window.__e000dialed=(window.__e000dialed||0)+1;location.href='tel:000'};return m}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="tel:000"],.e000btn');if(!a||a.closest('#e000c'))return;e.preventDefault();e.stopImmediatePropagation();if(!on())return;modal().classList.add('show')},true);
function addSetting(){if(!ANCHOR||document.querySelector('.e000set'))return;var t=document.querySelector(ANCHOR);if(!t)return;var w=document.createElement('div');w.className='e000set';
 w.innerHTML='<b>Emergency 000 button: On / Off</b><small>Turn off to stop accidental emergency calls.</small><div class="e000bt"><button type="button" data-v="on" aria-label="000 on">✓ 000 on</button><button type="button" data-v="off" aria-label="000 off">✗ 000 off</button></div><small class="e000s"></small>';
 w.addEventListener('click',function(e){var b=e.target.closest('[data-v]');if(b)set(b.dataset.v==='on')});t.parentNode.insertBefore(w,t)}
function init(){addSetting();apply()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.__e000={on:on,set:set};
})();
