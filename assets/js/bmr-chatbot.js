(function () {
'use strict';
function mount() {
  if (document.getElementById('bmr-chat-root')) return;
  const root=document.createElement('div'); root.id='bmr-chat-root';
  root.innerHTML=`
    <section class="bmr-chat-panel" data-open="false" role="dialog" aria-label="Book My Records service advisor" aria-modal="false" aria-hidden="true">
      <header class="bmr-chat-header"><div class="bmr-chat-avatar" aria-hidden="true"><img src="assets/img/favicon-128.png" alt=""></div>
        <div class="bmr-chat-heading"><strong>Book My Records Advisor</strong><span><i class="bmr-chat-status"></i>Here to help with your business</span></div>
        <button class="bmr-chat-close" type="button" aria-label="Close chat">×</button>
      </header>
      <div class="bmr-chat-messages" aria-live="polite" aria-relevant="additions text"><div class="bmr-chat-message assistant">Hello! I’m the Book My Records advisor. Tell me what you need help with, and I’ll guide you to the right service.</div></div>
      <div class="bmr-chat-quick">
        <button type="button" data-prompt="What services does Book My Records provide?">Explore services</button>
        <button type="button" data-prompt="I need help choosing a business registration structure.">Business registration</button>
        <button type="button" data-prompt="How does the Business Health Checkup work?">Health checkup</button>
      </div>
      <form class="bmr-chat-composer"><div class="bmr-chat-input-wrap">
        <button class="bmr-chat-icon-btn bmr-chat-mic" type="button" aria-label="Speak your message" title="Speak your message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8"/></svg>
        </button>
        <textarea class="bmr-chat-textarea" rows="1" maxlength="2000" placeholder="Type your message…" aria-label="Message"></textarea>
        <button class="bmr-chat-send" type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button>
      </div><div class="bmr-chat-hint">Enter to send · Shift+Enter for a new line</div></form>
    </section>
    <button class="bmr-chat-launcher" type="button" aria-label="Open Book My Records chat" aria-expanded="false"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M7.1 5.2h17.8A4.1 4.1 0 0 1 29 9.3v9.1a4.1 4.1 0 0 1-4.1 4.1h-7.4l-6.1 4.6a1.1 1.1 0 0 1-1.8-.9v-3.7H7.1A4.1 4.1 0 0 1 3 18.4V9.3a4.1 4.1 0 0 1 4.1-4.1Z"/><circle cx="11.1" cy="13.9" r="1.45" fill="#0B5ED7"/><circle cx="16" cy="13.9" r="1.45" fill="#0B5ED7"/><circle cx="20.9" cy="13.9" r="1.45" fill="#0B5ED7"/></svg></button>`;
  document.body.appendChild(root);
  const panel=root.querySelector('.bmr-chat-panel'), launcher=root.querySelector('.bmr-chat-launcher'), close=root.querySelector('.bmr-chat-close');
  const form=root.querySelector('.bmr-chat-composer'), input=root.querySelector('.bmr-chat-textarea'), messages=root.querySelector('.bmr-chat-messages'), send=root.querySelector('.bmr-chat-send'), mic=root.querySelector('.bmr-chat-mic');
  const config=window.BMR_CHAT_CONFIG||{}, apiBase=String(config.apiBase||'').replace(/\/$/,'');
  const storageKey='bmr-chat-session-v1', consentKey='bmr-chat-memory-consent-v1';
  let sessionId='', busy=false, recognition=null, listening=false, memoryConsent=false;
  try{
    sessionId=sessionStorage.getItem(storageKey)||'';
    memoryConsent=sessionStorage.getItem(consentKey)==='true';
  }catch(_){}
  const hint=root.querySelector('.bmr-chat-hint');
  const quick=root.querySelector('.bmr-chat-quick');
  const statusLine=root.querySelector('.bmr-chat-heading span');
  const idleStatus=statusLine.innerHTML;
  const consent=document.createElement('label');
  consent.className='bmr-chat-consent';
  consent.innerHTML='<input type="checkbox" aria-label="Remember this chat"><span><strong>Remember this chat</strong><em>This tab only, for up to 30 minutes</em></span>';
  form.insertBefore(consent,hint);
  const consentInput=consent.querySelector('input');
  consentInput.checked=memoryConsent;
  panel.inert=true;
  consentInput.addEventListener('change',async()=>{
    memoryConsent=consentInput.checked;
    try{
      if(memoryConsent) sessionStorage.setItem(consentKey,'true');
      else sessionStorage.removeItem(consentKey);
    }catch(_){}
    if(!memoryConsent && sessionId){
      try{
        await fetch(apiBase+'/api/chat/session/clear',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId})});
      }catch(_){}
      sessionId='';
      try{sessionStorage.removeItem(storageKey);}catch(_){}
    }
  });

  function setOpen(open){
    panel.dataset.open=String(open);
    panel.setAttribute('aria-hidden',String(!open));
    panel.inert=!open;
    launcher.setAttribute('aria-expanded',String(open));
    launcher.hidden=open;
    if(open) input.focus();
    else{stopListening();launcher.hidden=false;launcher.focus();}
  }
  function scrollBottom(){messages.scrollTop=messages.scrollHeight;}
  function safePath(path){return /^\/(?:[a-z0-9_-]+(?:\.html)?|#lead)(?:[?#].*)?$/i.test(path)?path:null;}
  function formatText(text, role){
    const cleaned=String(text).replace(/\r\n/g,'\n').replace(/\*\*|__|~~|`+/g,'').replace(/^\s{0,3}#{1,6}\s+/gm,'').replace(/\*/g,'');
    const escaped=cleaned.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const linked=escaped.replace(/\/(?:[a-z0-9_-]+\.html|#lead)/gi,m=>{const href=safePath(m);return href?'<a href="'+href+'">'+m+'</a>':m;});
    const blocks=linked.split(/\n{2,}/).map(block=>block.trim()).filter(Boolean);
    return blocks.map(block=>{
      const lines=block.split('\n').map(line=>line.trim()).filter(Boolean);
      if(role!=='assistant') return '<p>'+lines.join('<br>')+'</p>';
      let html='', paragraph=[], points=[];
      const flushParagraph=()=>{ if(paragraph.length){ html+='<p>'+paragraph.join(' ')+'</p>'; paragraph=[]; } };
      const flushPoints=()=>{ if(points.length){ html+='<ul>'+points.map(item=>'<li>'+item+'</li>').join('')+'</ul>'; points=[]; } };
      lines.forEach(line=>{
        const point=line.match(/^(?:[-•]|\d+[.)])\s+(.+)$/);
        if(point){ flushParagraph(); points.push(point[1]); }
        else { flushPoints(); paragraph.push(line); }
      });
      flushParagraph();
      flushPoints();
      return html;
    }).join('');
  }
  function addMessage(role,text,sources){
    const node=document.createElement('div');node.className='bmr-chat-message '+role;node.innerHTML=formatText(text, role);
    if(role==='assistant'&&Array.isArray(sources)&&sources.length){const box=document.createElement('div');box.className='bmr-chat-sources';box.textContent='Based on: ';const seen=new Set();sources.forEach(s=>{const label=String(s.service||s.title||'Book My Records').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());if(seen.has(label))return;seen.add(label);const tag=document.createElement('span');tag.textContent=label;box.appendChild(tag);});node.appendChild(box);}
    messages.appendChild(node);scrollBottom();return node;
  }
  function setBusy(value){busy=value;send.disabled=value;input.disabled=value;mic.disabled=value;root.setAttribute('aria-busy',String(value));statusLine.innerHTML=value?'<i class="bmr-chat-status bmr-chat-status--live"></i>Typing…':idleStatus;}
  async function sendMessage(text){
    const message=String(text||'').trim();if(!message||busy)return;
    if(quick) quick.hidden=true;
    addMessage('user',message);input.value='';input.style.height='auto';setBusy(true);
    const typing=document.createElement('div');typing.className='bmr-chat-message assistant bmr-chat-message--typing';typing.innerHTML='<div class="bmr-chat-typing" aria-label="Advisor is typing"><i></i><i></i><i></i><span>Typing</span></div>';messages.appendChild(typing);scrollBottom();
    try{
      const response=await fetch(apiBase+'/api/chat/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,sessionId:memoryConsent?sessionId:'',pageContext:document.title.slice(0,160),mode:'website',memoryConsent})});
      const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Unable to send your message right now.');
      sessionId=data.sessionId||sessionId;
      if(memoryConsent){try{if(sessionId)sessionStorage.setItem(storageKey,sessionId);}catch(_){}}
      else{try{sessionStorage.removeItem(storageKey);}catch(_){}}
      typing.remove();addMessage('assistant',data.reply||'I could not prepare an answer. Please contact our team.',data.sources);
    }catch(error){typing.remove();const err=document.createElement('div');err.className='bmr-chat-error';err.textContent=error.message||'Connection problem. Please try again.';messages.appendChild(err);scrollBottom();}
    finally{setBusy(false);input.focus();}
  }
  function startListening(){
    const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Speech){addMessage('assistant','Voice typing is not supported in this browser. Please use Chrome or Edge, or type your message.');return;}
    if(listening){stopListening();return;}
    recognition=new Speech();recognition.lang=(document.documentElement.lang||'en').toLowerCase().startsWith('hi')?'hi-IN':'en-IN';recognition.interimResults=true;recognition.continuous=false;
    let finalText='';
    recognition.onstart=()=>{listening=true;mic.setAttribute('aria-pressed','true');mic.setAttribute('aria-label','Stop voice input');};
    recognition.onresult=event=>{let interim='';for(let i=event.resultIndex;i<event.results.length;i++){const t=event.results[i][0].transcript;if(event.results[i].isFinal)finalText+=t+' ';else interim+=t;}input.value=(finalText+interim).trim();input.dispatchEvent(new Event('input'));};
    recognition.onerror=()=>stopListening();
    recognition.onend=()=>{listening=false;mic.setAttribute('aria-pressed','false');mic.setAttribute('aria-label','Speak your message');if(finalText.trim()){input.focus();input.setSelectionRange(input.value.length,input.value.length);}recognition=null;};
    try{recognition.start();}catch(_){stopListening();}
  }
  function stopListening(){if(recognition){try{recognition.stop();}catch(_){}recognition=null;}listening=false;mic.setAttribute('aria-pressed','false');mic.setAttribute('aria-label','Speak your message');}
  launcher.addEventListener('click',()=>setOpen(true));close.addEventListener('click',()=>setOpen(false));
  form.addEventListener('submit',e=>{e.preventDefault();sendMessage(input.value);});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit();}});
  input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,100)+'px';});
  mic.addEventListener('click',startListening);
  root.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>sendMessage(button.dataset.prompt)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.dataset.open==='true')setOpen(false);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();