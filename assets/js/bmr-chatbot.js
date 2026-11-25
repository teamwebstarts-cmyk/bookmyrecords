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
      <form class="bmr-chat-composer"><div class="bmr-chat-voice-live" hidden aria-live="polite">
        <div class="bmr-chat-voice-bars" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <span class="bmr-chat-voice-timer">0:00</span>
        <span class="bmr-chat-voice-caption">Recording — speak now</span>
      </div><div class="bmr-chat-suggest" role="group" aria-label="Suggested questions" hidden></div><div class="bmr-chat-input-wrap">
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
  const voiceLive=root.querySelector('.bmr-chat-voice-live'), voiceTimer=root.querySelector('.bmr-chat-voice-timer'), voiceCaption=root.querySelector('.bmr-chat-voice-caption'), voiceBars=root.querySelector('.bmr-chat-voice-bars'), inputWrap=root.querySelector('.bmr-chat-input-wrap');
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
  let sessionId='', busy=false, recognition=null, listening=false, transcribing=false, memoryConsent=false;
  let mediaStream=null, mediaRecorder=null, audioChunks=[], audioCtx=null, analyser=null, meterRaf=0, recordTimer=0, recordStartedAt=0;
  const MAX_RECORD_MS=90000;
  try{
    sessionId=sessionStorage.getItem(storageKey)||'';
    memoryConsent=sessionStorage.getItem(consentKey)==='true';
  }catch(_){}
  const hint=root.querySelector('.bmr-chat-hint');
  const defaultHint=hint.textContent;
  const quick=root.querySelector('.bmr-chat-quick');
  const suggest=root.querySelector('.bmr-chat-suggest');
  let activeSuggests=[];
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
    if(open){warmApi();scrollBottom();input.focus();refreshFollowUps(getLastAssistantText());}
    else{abortVoiceCapture(true);hideFollowUps();launcher.hidden=false;launcher.focus();}
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
  const FOLLOW_UP_RULES=[
    {re:/health|checkup|diagnostic|scorecard/i,items:[
      {label:'Start free checkup',prompt:'How do I start the free Business Health Checkup?'},
      {label:'What it includes',prompt:'What does the Business Health Checkup cover?'}
    ]},
    {re:/regist|incorporat|LLP|private limited|GST/i,items:[
      {label:'Registration options',prompt:'Which business registration structure should I choose?'},
      {label:'Timeline & documents',prompt:'What documents do I need for business registration?'}
    ]},
    {re:/CFO|fractional|advisor|consult/i,items:[
      {label:'CFO services',prompt:'What does fractional CFO support include?'},
      {label:'Book a call',prompt:'I want to book a consultation with your team.'}
    ]},
    {re:/tax|GST|compliance|filing/i,items:[
      {label:'Tax support',prompt:'What taxation and compliance services do you offer?'},
      {label:'Stay compliant',prompt:'How do you help businesses stay GST compliant?'}
    ]},
    {re:/account|bookkeep|payroll/i,items:[
      {label:'Accounting scope',prompt:'What is included in accounting outsourcing?'},
      {label:'Pricing approach',prompt:'How does pricing work for bookkeeping support?'}
    ]},
    {re:/loan|finance|working capital/i,items:[
      {label:'Loan assistance',prompt:'How do you help with business loans and financing?'},
      {label:'Eligibility',prompt:'What do lenders usually ask for during financing?'}
    ]},
    {re:/IPR|trademark|patent|copyright/i,items:[
      {label:'IPR registration',prompt:'What IPR registration services do you provide?'},
      {label:'Why register IP',prompt:'Why should a small business register its brand?'}
    ]}
  ];
  const DEFAULT_FOLLOW_UPS=[
    {label:'Explore services',prompt:'What services does Book My Records provide?'},
    {label:'Book consultation',prompt:'How can I book a consultation with your team?'}
  ];
  function getLastAssistantText(){
    const nodes=messages.querySelectorAll('.bmr-chat-message.assistant:not(.bmr-chat-message--typing)');
    if(!nodes.length)return '';
    return (nodes[nodes.length-1].textContent||'').trim();
  }
  function pickFollowUps(text){
    const body=String(text||'');
    for(let i=0;i<FOLLOW_UP_RULES.length;i++){
      if(FOLLOW_UP_RULES[i].re.test(body))return FOLLOW_UP_RULES[i].items.slice(0,2);
    }
    if(/\?/.test(body)){
      return [
        {label:'Yes — next step',prompt:'Yes, please guide me on the next step.'},
        {label:'Contact options',prompt:'What are your phone and email for support?'}
      ];
    }
    return DEFAULT_FOLLOW_UPS.slice(0,2);
  }
  function canShowFollowUps(){
    return !(busy||listening||transcribing||String(input.value||'').trim());
  }
  function hideFollowUps(){
    if(!suggest)return;
    suggest.hidden=true;
    suggest.replaceChildren();
  }
  function paintFollowUps(items){
    if(!suggest)return;
    suggest.replaceChildren();
    if(!items||!items.length||!canShowFollowUps()){
      suggest.hidden=true;
      return;
    }
    activeSuggests=items;
    const label=document.createElement('span');
    label.className='bmr-chat-suggest-label';
    label.textContent='Try asking:';
    suggest.appendChild(label);
    items.forEach(item=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='bmr-chat-suggest-btn';
      btn.textContent=item.label;
      btn.addEventListener('click',()=>sendMessage(item.prompt));
      suggest.appendChild(btn);
    });
    suggest.hidden=false;
  }
  function refreshFollowUps(text){
    paintFollowUps(pickFollowUps(text||getLastAssistantText()));
  }
  function syncFollowUpVisibility(){
    if(canShowFollowUps())paintFollowUps(activeSuggests.length?activeSuggests:pickFollowUps(getLastAssistantText()));
    else hideFollowUps();
  }
  function setBusy(value){busy=value;send.disabled=value;input.disabled=value||transcribing;mic.disabled=value||transcribing;root.setAttribute('aria-busy',String(value||transcribing));statusLine.innerHTML=value?'<i class="bmr-chat-status bmr-chat-status--live"></i>Typing…':transcribing?'<i class="bmr-chat-status bmr-chat-status--live"></i>Converting voice…':idleStatus;}
  async function sendMessage(text){
    const message=String(text||'').trim();if(!message||busy)return;
    if(quick) quick.hidden=true;
    hideFollowUps();
    addMessage('user',message);input.value='';input.style.height='auto';setBusy(true);
    const typing=document.createElement('div');typing.className='bmr-chat-message assistant bmr-chat-message--typing';typing.innerHTML='<div class="bmr-chat-typing" aria-label="Advisor is typing"><i></i><i></i><i></i><span>Typing</span></div>';messages.appendChild(typing);scrollBottom();
    try{
      const data=await postChatMessage({message,sessionId:memoryConsent?sessionId:'',pageContext:document.title.slice(0,160),mode:'website',memoryConsent},typing,0);
      sessionId=data.sessionId||sessionId;
      if(memoryConsent){try{if(sessionId)sessionStorage.setItem(storageKey,sessionId);}catch(_){}}
      else{try{sessionStorage.removeItem(storageKey);}catch(_){}}
      const reply=data.reply||'I could not prepare an answer. Please contact our team.';
      typing.remove();addMessage('assistant',reply,data.sources);
      refreshFollowUps(reply);
    }catch(error){typing.remove();const err=document.createElement('div');err.className='bmr-chat-error';err.textContent=error.message||'Connection problem. Please try again.';messages.appendChild(err);scrollBottom();refreshFollowUps('');}
    finally{setBusy(false);input.focus();syncFollowUpVisibility();}
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
  const micLog=[];
  function logMic(event, detail){
    const line=event+(detail?' · '+detail:'');
    micLog.push(new Date().toISOString().slice(11,19)+' '+line);
    if(micLog.length>20)micLog.shift();
    console.info('[bmr-mic]', line);
  }
  function formatRecordTime(ms){
    const total=Math.max(0,Math.floor(ms/1000));
    const m=Math.floor(total/60);
    const s=total%60;
    return m+':'+String(s).padStart(2,'0');
  }
  function pickRecorderMime(){
    if(!window.MediaRecorder)return '';
    const options=['audio/webm;codecs=opus','audio/webm','audio/mp4'];
    for(let i=0;i<options.length;i++){
      if(MediaRecorder.isTypeSupported(options[i]))return options[i];
    }
    return '';
  }
  function markListening(on){
    listening=on;
    mic.setAttribute('aria-pressed',on?'true':'false');
    mic.setAttribute('aria-label',on?'Stop recording and convert to text':'Record voice message');
    mic.classList.toggle('bmr-chat-mic--listening',on);
    mic.classList.toggle('bmr-chat-mic--transcribing',transcribing);
    mic.classList.remove('bmr-chat-mic--pending');
    inputWrap.classList.toggle('bmr-chat-input-wrap--recording',on);
    if(voiceLive)voiceLive.hidden=!on;
    if(on){
      if(voiceCaption)voiceCaption.textContent='Recording — your voice is being captured';
      statusLine.innerHTML='<i class="bmr-chat-status bmr-chat-status--live"></i>Recording voice…';
    }else if(!transcribing&&!busy){
      statusLine.innerHTML=idleStatus;
    }
  }
  function stopMeter(){
    if(meterRaf)cancelAnimationFrame(meterRaf);
    meterRaf=0;
    if(audioCtx){try{audioCtx.close();}catch(_){}}
    audioCtx=null;
    analyser=null;
    if(voiceBars)voiceBars.querySelectorAll('span').forEach(bar=>{bar.style.height='6px';});
  }
  function startMeter(stream){
    if(!voiceBars||!stream)return;
    const bars=Array.from(voiceBars.querySelectorAll('span'));
    try{
      audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      const source=audioCtx.createMediaStreamSource(stream);
      analyser=audioCtx.createAnalyser();
      analyser.fftSize=64;
      source.connect(analyser);
      const data=new Uint8Array(analyser.frequencyBinCount);
      const step=()=>{
        if(!analyser){return;}
        analyser.getByteFrequencyData(data);
        let sum=0;
        for(let i=0;i<data.length;i++)sum+=data[i];
        const level=sum/data.length;
        bars.forEach((bar,i)=>{
          const boost=Math.max(0,data[i%data.length]-60);
          const h=6+Math.min(16,Math.round(boost/8)+(level>8?4:0));
          bar.style.height=h+'px';
        });
        meterRaf=requestAnimationFrame(step);
      };
      step();
    }catch(err){logMic('meter-failed',err&&err.message);}
  }
  function cleanupStream(){
    stopMeter();
    if(recordTimer){clearInterval(recordTimer);recordTimer=0;}
    if(mediaStream){
      mediaStream.getTracks().forEach(track=>{try{track.stop();}catch(_){}});
    }
    mediaStream=null;
    mediaRecorder=null;
    audioChunks=[];
    recordStartedAt=0;
  }
  function flashHeardInput(){
    input.classList.add('bmr-chat-textarea--heard');
    window.setTimeout(()=>input.classList.remove('bmr-chat-textarea--heard'),900);
  }
  function blobToBase64(blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onloadend=()=>{
        const data=String(reader.result||'');
        resolve(data.includes(',')?data.split(',')[1]:'');
      };
      reader.onerror=reject;
      reader.readAsDataURL(blob);
    });
  }
  async function uploadTranscribe(blob,mime){
    const url=(apiBase||'')+'/api/chat/transcribe';
    if(!url)throw new Error('Voice needs the site server. Type your message instead.');
    const audioBase64=await blobToBase64(blob);
    const response=await fetch(url,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({audioBase64,mime:String(mime||'audio/webm').split(';')[0],lang:'en'})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Could not convert voice. Please type your message.');
    return String(data.text||'').trim();
  }
  function setTranscribing(on){
    transcribing=on;
    mic.classList.toggle('bmr-chat-mic--transcribing',on);
    mic.disabled=on||busy;
    if(on){
      if(voiceCaption)voiceCaption.textContent='Converting your voice to text…';
      if(voiceLive)voiceLive.hidden=false;
      statusLine.innerHTML='<i class="bmr-chat-status bmr-chat-status--live"></i>Converting voice…';
      setVoiceHint('Turning your recording into text…','voice');
    }
  }
  function applyTranscript(text){
    if(!text)return;
    const prior=String(input.value||'').trim();
    input.value=prior?(prior+' '+text):text;
    input.dispatchEvent(new Event('input'));
    flashHeardInput();
    setVoiceHint('Your message is ready. Edit if needed, then press send.','voice');
    hintResetTimer=setTimeout(()=>resetVoiceHint(),7000);
    input.focus();
  }
  async function finalizeRecording(){
    const chunks=audioChunks.slice();
    const mime=mediaRecorder&&mediaRecorder.mimeType?mediaRecorder.mimeType:'audio/webm';
    cleanupStream();
    markListening(false);
    if(!chunks.length){
      setVoiceHint('No audio captured. Tap the mic, speak, then tap again to stop.','warn');
      return;
    }
    const blob=new Blob(chunks,{type:mime});
    if(blob.size<800){
      setVoiceHint('Recording was too short. Hold the mic longer and speak clearly.','warn');
      return;
    }
    setTranscribing(true);
    try{
      logMic('transcribe',mime+' '+blob.size);
      const text=await uploadTranscribe(blob,mime);
      logMic('transcribed',text.slice(0,80));
      applyTranscript(text);
    }catch(err){
      logMic('transcribe-failed',err&&err.message);
      setVoiceHint(err.message||'Voice failed. Please type your message.','warn');
    }finally{
      setTranscribing(false);
      if(voiceLive)voiceLive.hidden=true;
      statusLine.innerHTML=idleStatus;
      setBusy(busy);
    }
  }
  function startRecording(){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      setVoiceHint('Microphone recording is not supported in this browser. Type your message instead.','warn');
      return;
    }
    mic.classList.add('bmr-chat-mic--pending');
    setVoiceHint('Allow microphone access, then speak…','voice');
    navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}).then(stream=>{
      mic.classList.remove('bmr-chat-mic--pending');
      const mime=pickRecorderMime();
      if(!mime||!window.MediaRecorder){
        stream.getTracks().forEach(t=>t.stop());
        setVoiceHint('Recording is not supported here. Type your message instead.','warn');
        return;
      }
      mediaStream=stream;
      audioChunks=[];
      mediaRecorder=new MediaRecorder(stream,{mimeType:mime});
      mediaRecorder.ondataavailable=ev=>{if(ev.data&&ev.data.size)audioChunks.push(ev.data);};
      mediaRecorder.onerror=()=>{
        logMic('recorder-error');
        abortVoiceCapture(false);
        setVoiceHint('Recording failed. Try again or type your message.','warn');
      };
      mediaRecorder.onstop=()=>{finalizeRecording();};
      mediaRecorder.start(200);
      recordStartedAt=Date.now();
      markListening(true);
      startMeter(stream);
      recordTimer=window.setInterval(()=>{
        if(voiceTimer&&recordStartedAt)voiceTimer.textContent=formatRecordTime(Date.now()-recordStartedAt);
        if(recordStartedAt&&Date.now()-recordStartedAt>MAX_RECORD_MS)stopRecording(false);
      },250);
      logMic('record-start',mime);
      setVoiceHint('Recording… tap the red mic when you finish speaking.','voice');
    }).catch(err=>{
      mic.classList.remove('bmr-chat-mic--pending');
      logMic('permission',err&&err.name);
      const denied=err&&(err.name==='NotAllowedError'||err.name==='PermissionDeniedError');
      setVoiceHint(denied?'Microphone is blocked. Allow the mic in browser settings (lock icon in the address bar).':'Could not open the microphone. Try again or type your message.','warn');
    });
  }
  function stopRecording(fromUser){
    logMic('record-stop',fromUser?'user':'auto');
    if(!mediaRecorder||mediaRecorder.state==='inactive'){
      abortVoiceCapture(fromUser);
      return;
    }
    if(voiceCaption)voiceCaption.textContent='Finishing capture…';
    setVoiceHint('Finishing recording…','voice');
    try{mediaRecorder.stop();}catch(_){abortVoiceCapture(fromUser);}
  }
  function abortVoiceCapture(fromUser){
    cleanupStream();
    markListening(false);
    setTranscribing(false);
    if(voiceLive)voiceLive.hidden=true;
    if(fromUser)resetVoiceHint();
  }
  function startListening(event){
    if(event){event.preventDefault();event.stopPropagation();}
    if(busy||transcribing)return;
    if(!window.isSecureContext){
      setVoiceHint('Voice needs HTTPS. Open the live site link in Chrome or Edge.','warn');
      return;
    }
    if(listening){stopRecording(true);return;}
    startRecording();
  }
  launcher.addEventListener('click',()=>setOpen(true));close.addEventListener('click',()=>setOpen(false));
  form.addEventListener('submit',e=>{e.preventDefault();sendMessage(input.value);});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit();}});
  input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,100)+'px';syncFollowUpVisibility();});
  mic.addEventListener('click',e=>{startListening(e);});
  root.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>sendMessage(button.dataset.prompt)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.dataset.open==='true')setOpen(false);});
  if(apiBase)warmApi();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();