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
  const defaultHint=hint.textContent;
  const quick=root.querySelector('.bmr-chat-quick');
  const statusLine=root.querySelector('.bmr-chat-heading span');
  const idleStatus=statusLine.innerHTML;
  let hintResetTimer=0;
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
    else{stopListening(true);launcher.hidden=false;launcher.focus();}
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
  function setVoiceHint(text,mode){
    clearTimeout(hintResetTimer);
    hint.textContent=text;
    hint.classList.toggle('bmr-chat-hint--voice',mode==='voice');
    hint.classList.toggle('bmr-chat-hint--warn',mode==='warn');
    if(mode==='warn'){
      hintResetTimer=setTimeout(()=>resetVoiceHint(),8000);
    }
  }
  function resetVoiceHint(){
    clearTimeout(hintResetTimer);
    hint.textContent=defaultHint;
    hint.classList.remove('bmr-chat-hint--voice','bmr-chat-hint--warn');
  }
  function voiceErrorMessage(code){
    switch(code){
      case 'not-allowed':return 'Microphone is blocked. Open site settings (lock icon in the address bar) and allow the microphone.';
      case 'service-not-allowed':return 'Voice input needs a secure page. Open https://bookmyrecords.vercel.app in Chrome or Edge.';
      case 'audio-capture':return 'No microphone was found. Check that a mic is connected and enabled.';
      case 'network':return 'Voice service could not connect. Check internet and try again, or type your message.';
      case 'no-speech':return 'Did not hear speech. Tap mic and try again.';
      default:return 'Voice input failed. Try again or type your message.';
    }
  }
  function getSpeechRecognition(){
    return window.SpeechRecognition||window.webkitSpeechRecognition||null;
  }
  async function ensureMicrophoneAccess(){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return true;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
      stream.getTracks().forEach(track=>track.stop());
      return true;
    }catch(error){
      const denied=error&& (error.name==='NotAllowedError'||error.name==='PermissionDeniedError');
      setVoiceHint(denied?voiceErrorMessage('not-allowed'):voiceErrorMessage('audio-capture'),'warn');
      return false;
    }
  }
  async function startListening(event){
    if(event){event.preventDefault();event.stopPropagation();}
    if(busy)return;
    const Speech=getSpeechRecognition();
    if(!window.isSecureContext){
      setVoiceHint(voiceErrorMessage('service-not-allowed'),'warn');
      return;
    }
    if(!Speech){
      setVoiceHint('Voice typing needs Chrome or Edge on desktop. You can still type here.','warn');
      return;
    }
    if(listening){stopListening(true);return;}
    setVoiceHint('Allow microphone if asked, then speak…','voice');
    mic.classList.add('bmr-chat-mic--pending');
    const allowed=await ensureMicrophoneAccess();
    mic.classList.remove('bmr-chat-mic--pending');
    if(!allowed)return;
    recognition=new Speech();
    recognition.lang=(document.documentElement.lang||'en').toLowerCase().startsWith('hi')?'hi-IN':'en-IN';
    recognition.interimResults=true;
    recognition.continuous=false;
    let finalText='';
    recognition.onstart=()=>{
      listening=true;
      mic.setAttribute('aria-pressed','true');
      mic.setAttribute('aria-label','Stop voice input');
      mic.classList.add('bmr-chat-mic--listening');
      setVoiceHint('Listening… speak now. Tap mic again to stop.','voice');
    };
    recognition.onresult=ev=>{
      let interim='';
      for(let i=ev.resultIndex;i<ev.results.length;i++){
        const t=ev.results[i][0].transcript;
        if(ev.results[i].isFinal)finalText+=t+' ';
        else interim+=t;
      }
      input.value=(finalText+interim).trim();
      input.dispatchEvent(new Event('input'));
    };
    recognition.onerror=ev=>{
      const code=ev&&ev.error?ev.error:'';
      if(code && code!=='aborted'){
        if(code==='no-speech')setVoiceHint(voiceErrorMessage('no-speech'),'warn');
        else setVoiceHint(voiceErrorMessage(code),'warn');
      }
      stopListening();
    };
    recognition.onend=()=>{
      stopListening();
      if(finalText.trim()){
        input.focus();
        input.setSelectionRange(input.value.length,input.value.length);
      }
      resetVoiceHint();
    };
    try{
      recognition.start();
    }catch(error){
      setVoiceHint('Could not start voice input. Tap mic again or type your message.','warn');
      stopListening();
    }
  }
  function stopListening(fromUser){
    if(recognition){
      try{recognition.stop();}catch(_){}
      try{recognition.abort();}catch(_){}
      recognition=null;
    }
    listening=false;
    mic.setAttribute('aria-pressed','false');
    mic.setAttribute('aria-label','Speak your message');
    mic.classList.remove('bmr-chat-mic--listening','bmr-chat-mic--pending');
    if(fromUser)resetVoiceHint();
  }
  launcher.addEventListener('click',()=>setOpen(true));close.addEventListener('click',()=>setOpen(false));
  form.addEventListener('submit',e=>{e.preventDefault();sendMessage(input.value);});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit();}});
  input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,100)+'px';});
  mic.addEventListener('click',e=>{startListening(e);});
  root.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>sendMessage(button.dataset.prompt)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.dataset.open==='true')setOpen(false);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();