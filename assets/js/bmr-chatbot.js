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
  const config=window.BMR_CHAT_CONFIG||{};
  const PRODUCTION_API='https://bookmyrecords-api.onrender.com';
  function resolveApiBase(cfg){
    const fromCfg=String(cfg.apiBase||'').replace(/\/$/,'');
    if(fromCfg)return fromCfg;
    const host=location.hostname;
    if(host==='localhost'||host==='127.0.0.1')return '';
    if(host.includes('bookmyrecords'))return PRODUCTION_API;
    return '';
  }
  const apiBase=resolveApiBase(config);
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
    document.documentElement.classList.toggle('bmr-chat-scroll-lock',open);
    if(open){warmApi();scrollBottom();input.focus();}
    else{stopListening(true);launcher.hidden=false;launcher.focus();}
  }
  function scrollBottom(){messages.scrollTop=messages.scrollHeight;}
  function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
  let warmInFlight=false;
  function warmApi(){
    const url=(apiBase||'')+'/api/checkup/health';
    if(!url||warmInFlight)return;
    warmInFlight=true;
    fetch(url,{cache:'no-store',credentials:'omit'}).catch(()=>{}).finally(()=>{warmInFlight=false;});
  }
  function friendlyChatError(status,data,offline){
    if(data&&data.error)return data.error;
    if(offline)return 'Connection problem. Check internet and try again.';
    if(status===429)return 'Too many messages. Please wait a minute.';
    if(status===502||status===503||status===504)return 'Server is waking up. Wait a few seconds and try again.';
    return 'Unable to send your message right now.';
  }
  async function postChatMessage(payload,typingNode,attempt){
    const maxAttempts=4;
    if(attempt>0){
      const note=typingNode&&typingNode.querySelector('.bmr-chat-typing span');
      if(note)note.textContent=attempt===1?'Connecting to server…':'Still trying ('+(attempt+1)+'/'+maxAttempts+')…';
    }
    let response;
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),90000);
      response=await fetch(apiBase+'/api/chat/message',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload),
        signal:controller.signal,
        credentials:'omit'
      });
      clearTimeout(timer);
    }catch(_){
      if(attempt+1<maxAttempts){
        await sleep(1500+attempt*2000);
        warmApi();
        return postChatMessage(payload,typingNode,attempt+1);
      }
      throw new Error(friendlyChatError(0,{},true));
    }
    const data=await response.json().catch(()=>({}));
    const retryable=response.status===502||response.status===503||response.status===504;
    if(!response.ok){
      if(retryable&&attempt+1<maxAttempts){
        await sleep(1500+attempt*2000);
        warmApi();
        return postChatMessage(payload,typingNode,attempt+1);
      }
      throw new Error(friendlyChatError(response.status,data,false));
    }
    return data;
  }
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
      const data=await postChatMessage({message,sessionId:memoryConsent?sessionId:'',pageContext:document.title.slice(0,160),mode:'website',memoryConsent},typing,0);
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
      case 'service-not-allowed':return 'Voice input needs a secure page. Open this site in Chrome or Edge (https).';
      case 'audio-capture':return 'No microphone was found. Check that a mic is connected and enabled.';
      case 'network':return 'Voice service could not connect. Check internet and try again, or type your message.';
      case 'no-speech':return 'Did not hear speech. Tap mic and try again.';
      default:return 'Voice input failed. Try again or type your message.';
    }
  }
  const micLog=[];
  let stopRequested=false;
  let lastMicError='';
  let langFallbackTried=false;
  let micCooldownUntil=0;
  function logMic(event, detail){
    const line=event+(detail?' · '+detail:'');
    micLog.push(new Date().toISOString().slice(11,19)+' '+line);
    if(micLog.length>20)micLog.shift();
    console.info('[bmr-mic]', line);
  }
  function getSpeechRecognition(){
    return window.SpeechRecognition||window.webkitSpeechRecognition||null;
  }
  function markListening(on){
    listening=on;
    mic.setAttribute('aria-pressed',on?'true':'false');
    mic.setAttribute('aria-label',on?'Stop voice input':'Speak your message');
    mic.classList.toggle('bmr-chat-mic--listening',on);
    mic.classList.remove('bmr-chat-mic--pending');
  }
  function finishVoice(reason){
    markListening(false);
    recognition=null;
    if(reason==='user'){resetVoiceHint();return;}
    if(lastMicError && lastMicError!=='aborted' && lastMicError!=='no-speech'){
      setVoiceHint(voiceErrorMessage(lastMicError)+' ('+lastMicError+')','warn');
      return;
    }
    if(String(input.value||'').trim()){
      setVoiceHint('Heard you. Press send when the text looks right.','voice');
      hintResetTimer=setTimeout(()=>resetVoiceHint(),5000);
      return;
    }
    if(reason==='ended')setVoiceHint('Mic closed before any words were captured. Tap it and speak right away.','warn');
  }
  function beginRecognition(lang){
    const Speech=getSpeechRecognition();
    if(!Speech)return;
    stopRequested=false;
  lastMicError='';
    let finalText='';
    let startedAt=0;
    const session=recognition=new Speech();
    session.lang=lang;
    session.interimResults=true;
    session.continuous=false;
    session.maxAlternatives=1;
    session.onstart=()=>{
      startedAt=Date.now();
      logMic('start',lang);
      markListening(true);
      setVoiceHint('Listening… speak now. Pause when you finish, or tap the mic to stop.','voice');
    };
    session.onresult=ev=>{
      let interim='';
      for(let i=ev.resultIndex;i<ev.results.length;i++){
        const t=ev.results[i][0].transcript;
        if(ev.results[i].isFinal)finalText+=t+' ';
        else interim+=t;
      }
      const heard=(finalText+interim).trim();
      if(heard){
        logMic('result',heard.slice(0,80));
        input.value=heard;
        input.dispatchEvent(new Event('input'));
      }
    };
    session.onerror=ev=>{
      lastMicError=ev&&ev.error?ev.error:'unknown';
      logMic('error',lastMicError);
      if(lastMicError==='aborted'||lastMicError==='no-speech')return;
      if(lastMicError==='network')micCooldownUntil=Date.now()+4000;
      setVoiceHint(voiceErrorMessage(lastMicError)+' ('+lastMicError+')','warn');
    };
    session.onend=()=>{
      const elapsed=startedAt?Date.now()-startedAt:0;
      logMic('end',(lastMicError||'clean')+' '+elapsed+'ms');
      if(recognition!==session)return;
      recognition=null;
      if(stopRequested){markListening(false);return;}
      if(lastMicError==='network'&&lang==='en-IN'&&!langFallbackTried){
        langFallbackTried=true;
        lastMicError='';
        logMic('lang-fallback','en-US');
        setVoiceHint('Retrying voice with English (US)…','voice');
        window.setTimeout(()=>{if(!stopRequested&&!listening)beginRecognition('en-US');},400);
        return;
      }
      const fatal=lastMicError==='not-allowed'||lastMicError==='network'||lastMicError==='audio-capture';
      if(fatal){finishVoice('ended');return;}
      const heard=String(input.value||'').trim();
      if(heard){finishVoice('ended');return;}
      if(elapsed>0&&elapsed<1200&&!fatal){
        setVoiceHint('Did not catch speech. Tap the mic and speak clearly, or type your message.','warn');
      }
      finishVoice('ended');
    };
    try{
      logMic('starting',lang);
      setVoiceHint('Starting microphone…','voice');
      session.start();
    }catch(error){
      logMic('start-failed',error&&error.message);
      recognition=null;
      setVoiceHint('Could not start voice input. Tap the mic again or type your message.','warn');
      finishVoice('ended');
    }
  }
  function startListening(event){
    if(event){event.preventDefault();event.stopPropagation();}
    if(busy)return;
    if(Date.now()<micCooldownUntil){
      setVoiceHint('Voice service is reconnecting. Wait a few seconds or type your message.','warn');
      return;
    }
    const Speech=getSpeechRecognition();
    if(!window.isSecureContext){
      logMic('blocked','insecure');
      setVoiceHint(voiceErrorMessage('service-not-allowed'),'warn');
      return;
    }
    if(!Speech){
      logMic('blocked','no-api');
      setVoiceHint('Voice typing needs Chrome or Edge on desktop. You can still type here.','warn');
      return;
    }
    if(listening){stopRequested=true;logMic('stop','user');stopListening(true);return;}
    langFallbackTried=false;
    beginRecognition('en-IN');
  }
  function stopListening(fromUser){
    stopRequested=true;
    const session=recognition;
    recognition=null;
    if(session){try{session.stop();}catch(_){}}
    finishVoice(fromUser?'user':'ended');
  }
  launcher.addEventListener('click',()=>setOpen(true));close.addEventListener('click',()=>setOpen(false));
  form.addEventListener('submit',e=>{e.preventDefault();sendMessage(input.value);});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit();}});
  input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,100)+'px';});
  mic.addEventListener('click',e=>{startListening(e);});
  root.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>sendMessage(button.dataset.prompt)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.dataset.open==='true')setOpen(false);});
  if(apiBase)warmApi();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();