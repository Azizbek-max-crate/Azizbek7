/**
 * JARVIS AI — Universal Voice Assistant & Knowledge Engine
 * Powered by Pollinations.ai (Free Universal AI — All Languages, Sports, Football, Boxing, Translation, Math, World Knowledge)
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('JARVIS AI initializing...');

  const micToggleBtn = document.getElementById('micToggleBtn');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const chatContainer = document.getElementById('chatContainer');
  const aiStatusBadge = document.getElementById('aiStatusBadge');
  const aiStatusText = document.getElementById('aiStatusText');
  const micStatusLabel = document.getElementById('micStatusLabel');
  const voiceActivityBar = document.getElementById('voiceActivityBar');
  const btnCancelVoice = document.getElementById('btnCancelVoice');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const langUzBtn = document.getElementById('langUzBtn');
  const langEnBtn = document.getElementById('langEnBtn');
  const langRuBtn = document.getElementById('langRuBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const historyList = document.getElementById('historyList');

  let currentLanguage = 'uz-UZ';
  let isListening = false;
  let ttsEnabled = true;
  let recognition = null;
  let activeState = 'idle';
  let currentChatId = null;
  let currentChatMessages = [];

  const canvas = document.getElementById('orbCanvas');
  let ctx = null;
  if (canvas) ctx = canvas.getContext('2d');

  class OrbParticle {
    constructor(cx, cy) { this.cx = cx; this.cy = cy; this.reset(); }
    reset() { this.angle = Math.random() * Math.PI * 2; this.radius = 35 + Math.random() * 55; this.speed = 0.01 + Math.random() * 0.02; this.size = 1.5 + Math.random() * 2.5; this.alpha = 0.2 + Math.random() * 0.7; }
    update(state) { const speedMult = state === 'listening' ? 2.5 : state === 'speaking' ? 2.0 : 1.0; this.angle += this.speed * speedMult; }
    draw(ctx, state) {
      if (!ctx) return;
      const x = this.cx + Math.cos(this.angle) * this.radius;
      const y = this.cy + Math.sin(this.angle) * this.radius;
      ctx.beginPath(); ctx.arc(x, y, this.size, 0, Math.PI * 2);
      let pColor = `rgba(0, 242, 254, ${this.alpha})`;
      if (state === 'listening') pColor = `rgba(225, 0, 255, ${this.alpha})`;
      else if (state === 'speaking') pColor = `rgba(79, 172, 254, ${this.alpha})`;
      ctx.fillStyle = pColor; ctx.shadowBlur = 8; ctx.shadowColor = pColor; ctx.fill();
    }
  }

  const particles = [];
  if (ctx) { for (let i = 0; i < 45; i++) particles.push(new OrbParticle(140, 140)); }

  let orbPulse = 0;
  function renderOrb() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    orbPulse += activeState === 'listening' ? 0.08 : activeState === 'speaking' ? 0.06 : 0.02;
    const baseRadius = 65 + Math.sin(orbPulse) * (activeState === 'listening' ? 12 : activeState === 'speaking' ? 8 : 4);
    ctx.beginPath(); ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    let glowGradient = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, baseRadius * 1.3);
    if (activeState === 'listening') { glowGradient.addColorStop(0, 'rgba(225, 0, 255, 0.4)'); glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); }
    else if (activeState === 'speaking') { glowGradient.addColorStop(0, 'rgba(0, 242, 254, 0.4)'); glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); }
    else { glowGradient.addColorStop(0, 'rgba(0, 242, 254, 0.2)'); glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); }
    ctx.fillStyle = glowGradient; ctx.fill();
    particles.forEach(p => { p.update(activeState); p.draw(ctx, activeState); });
    requestAnimationFrame(renderOrb);
  }
  if (ctx) renderOrb();

  // Speech Recognition (STT)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  function initSpeechRecognition() {
    if (!SpeechRecognition) return;
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = false; recognition.interimResults = true; recognition.lang = currentLanguage;
      recognition.onstart = () => { isListening = true; setAIState('listening'); if (micToggleBtn) micToggleBtn.classList.add('listening'); if (voiceActivityBar) voiceActivityBar.classList.remove('hidden'); if (micStatusLabel) micStatusLabel.textContent = "Sizni eshitayapman... Gapiring"; };
      recognition.onresult = (event) => { let transcript = ''; for (let i = event.resultIndex; i < event.results.length; i++) { transcript += event.results[i][0].transcript; } if (userInput) userInput.value = transcript; };
      recognition.onerror = (err) => { console.warn('Speech recognition error:', err); stopListening(); };
      recognition.onend = () => { const text = userInput ? userInput.value.trim() : ''; stopListening(); if (text) handleUserPrompt(text); };
    } catch (err) { console.error('Speech recognition init error:', err); }
  }
  initSpeechRecognition();

  function startListening() {
    if (!recognition) { alert("Brauzeringizda ovoz kiritish qo'llab-quvvatlanmaydi."); return; }
    try { recognition.lang = currentLanguage; if (userInput) userInput.value = ''; recognition.start(); } catch (e) { stopListening(); }
  }

  function stopListening() {
    isListening = false;
    if (recognition) { try { recognition.stop(); } catch (e) {} }
    if (micToggleBtn) micToggleBtn.classList.remove('listening');
    if (voiceActivityBar) voiceActivityBar.classList.add('hidden');
    setAIState('idle');
    if (micStatusLabel) micStatusLabel.textContent = "Mikrofonni bosing yoki yozing";
  }

  // Text-to-Speech (TTS)
  let cachedVoices = [];
  function populateVoices() { if (window.speechSynthesis) cachedVoices = window.speechSynthesis.getVoices(); }
  populateVoices();
  if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = populateVoices;

  function speakResponse(text) {
    if (!ttsEnabled || !window.speechSynthesis) return;
    if (currentLanguage === 'uz-UZ') { setAIState('idle'); return; }
    try {
      window.speechSynthesis.cancel();
      let cleanText = text.replace(/```[\s\S]*?```/g, '').replace(/<[^>]*>/g, '').replace(/[*_#`~]/g, '').replace(/&#\d+;/g, '').replace(/&\w+;/g, '').trim();
      if (!cleanText) return;
      if (cleanText.length > 300) cleanText = cleanText.substring(0, 300) + '...';
      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (!cachedVoices.length) cachedVoices = window.speechSynthesis.getVoices();
      if (currentLanguage === 'ru-RU') {
        utterance.lang = 'ru-RU';
        const ruVoice = cachedVoices.find(v => v.lang.startsWith('ru')) || cachedVoices.find(v => v.lang.toLowerCase().includes('ru'));
        if (ruVoice) utterance.voice = ruVoice;
      } else {
        utterance.lang = 'en-US';
        const enVoice = cachedVoices.find(v => v.lang.startsWith('en-US')) || cachedVoices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }
      utterance.rate = 0.95; utterance.pitch = 1.0;
      utterance.onstart = () => setAIState('speaking');
      utterance.onend = () => setAIState('idle');
      utterance.onerror = () => setAIState('idle');
      if (!cachedVoices.length) { window.speechSynthesis.onvoiceschanged = () => { cachedVoices = window.speechSynthesis.getVoices(); window.speechSynthesis.speak(utterance); }; }
      else { window.speechSynthesis.speak(utterance); }
    } catch (e) { setAIState('idle'); }
  }

  function setAIState(state) {
    activeState = state;
    const centerIcon = document.getElementById('orbCenterIcon');
    if (!aiStatusBadge || !aiStatusText) return;
    if (state === 'listening') { aiStatusBadge.className = 'status-badge listening'; aiStatusText.textContent = 'Eshitilmoqda...'; if (centerIcon) { centerIcon.innerHTML = '<i class="fa-solid fa-waveform fa-bounce"></i>'; centerIcon.style.borderColor = 'var(--accent-magenta)'; } }
    else if (state === 'speaking') { aiStatusBadge.className = 'status-badge speaking'; aiStatusText.textContent = 'Gapirilmoqda...'; if (centerIcon) { centerIcon.innerHTML = '<i class="fa-solid fa-volume-high fa-beat"></i>'; centerIcon.style.borderColor = 'var(--accent-blue)'; } }
    else if (state === 'processing') { aiStatusBadge.className = 'status-badge'; aiStatusText.textContent = 'Hisoblanmoqda...'; if (centerIcon) { centerIcon.innerHTML = '<i class="fa-solid fa-brain fa-spin"></i>'; centerIcon.style.borderColor = 'var(--accent-cyan)'; } }
    else { aiStatusBadge.className = 'status-badge idle'; aiStatusText.textContent = 'AI Tayyor'; if (centerIcon) { centerIcon.innerHTML = '<i class="fa-solid fa-microphone"></i>'; centerIcon.style.borderColor = 'rgba(0, 242, 254, 0.4)'; } }
  }

  // Math Solver
  function trySolveMath(promptText) {
    try {
      let cleanExpr = promptText.toLowerCase()
        .replace(/(qancha|necha|hisobla|javobi|yechib|ber|nimaga|teng|hisoblab|\?|!|=)/g, '')
        .replace(/\bx\b/g, '*').replace(/bo'luv|boluv/g, '/').replace(/ko'paytir\w*/g, '*')
        .replace(/plus|qo'shil\w*/g, '+').replace(/minus|ayril\w*/g, '-').replace(/\^/g, '**').trim();
      if (/^[0-9.\s+\-*/()** ]+$/.test(cleanExpr) && /[0-9]/.test(cleanExpr)) {
        const result = Function('"use strict"; return (' + cleanExpr + ')')();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return `**🧮 Matematik Yechim:**\n\n\`\`\`math\nIfoda: ${cleanExpr}\nNatija: ${result}\n\`\`\`\n\n**Javob:** **${result}**`;
        }
      }
    } catch (e) {}
    return null;
  }

  function checkIdentityOrGreeting(promptText) {
    const p = promptText.toLowerCase().trim();
    if (/sen kim|kim san|kim siz|o'zing|ozing|jarvis|qalaysiz|qalaysan|salom|assalom|kim bu/i.test(p) || /o'zing haqida|ozing haqida|sen kimsan|kim kimsan|sen kimsiz/i.test(p)) {
      return `🤖 **Men JARVIS AI — Sizning Intellektual Ovozli Yordamchingizman!**\n\nMen dunyodagi barcha bilimlarga ega AI yordamchisiman:\n- ⚽ **Sport va Klublar:** Arsenal, Real Madrid, Barcelona, Man City va barcha jamoalar\n- 🥊 **Boks va UFC:** Bakhodir Jalolov, Mike Tyson, Khabib va barcha sportchilar\n- 🐾 **Hayvonlar:** Qo'y, fil, sher, ot va barcha hayvonlarning yashash yillari va xususiyatlari\n- 🔤 **Tarjima:** Inglizcha, o'zbekcha, ruscha va barcha tillardan UZUN GAPLARNI tarjima qilish\n- 🧮 **Matematika:** Har qanday misollar va masalalar\n\nIstalgan savolingizni bering!`;
    }
    return null;
  }

  function _transDirection(p) {
    if (/inglizchaga|ingliz\s*tiliga|ingilizchaga|inglizcha\s*tarjima/.test(p)) return { from: "O'zbekcha", to: "Inglizcha", flag: "🇬🇧", ai: "You are a professional translator. Translate ONLY the following Uzbek text to English — output the translation only, nothing else:\n\n" };
    if (/o'zbekchaga|o'zbek\s*tiliga|ozbekchaga|o'zbekcha\s*tarjima/.test(p)) return { from: "Inglizcha/Ruscha", to: "O'zbekcha", flag: "🇺🇿", ai: "You are a professional translator. Translate ONLY the following text to Uzbek — output the translation only, nothing else:\n\n" };
    if (/ruschaga|rus\s*tiliga|ruscha\s*tarjima/.test(p)) return { from: "O'zbekcha", to: "Ruscha", flag: "🇷🇺", ai: "Ты профессиональный переводчик. Переведи ТОЛЬКО следующий текст на русский язык — выведи только перевод, ничего лишнего:\n\n" };
    if (/ruschadan/.test(p)) return { from: "Ruscha", to: "O'zbekcha", flag: "🇺🇿", ai: "Ты профессиональный переводчик. Переведи ТОЛЬКО следующий русский текст на узбекский — выведи только перевод, ничего лишнего:\n\n" };
    if (/ruschada|nima\s*degani|nima\s*bo'ladi|nima\s*boladi/.test(p)) return { from: "Ruscha", to: "O'zbekcha", flag: "🇺🇿", ai: "Ты профессиональный переводчик. Переведи ТОЛЬКО следующий русский текст на узбекский — выведи только перевод, ничего лишнего:\n\n" };
    return null;
  }

  function _transExtract(raw) {
    return raw
      .replace(/inglizchaga\s+tarjima(\s+qil)?/gi, '').replace(/ingliz\s+tiliga\s+tarjima(\s+qil)?/gi, '')
      .replace(/inglizcha\s+tarjima(\s+qil)?/gi, '').replace(/ingilizchaga\s+tarjima(\s+qil)?/gi, '')
      .replace(/o'zbekchaga\s+tarjima(\s+qil)?/gi, '').replace(/o'zbek\s+tiliga\s+tarjima(\s+qil)?/gi, '')
      .replace(/o'zbekcha\s+tarjima(\s+qil)?/gi, '').replace(/ozbekchaga\s+tarjima(\s+qil)?/gi, '')
      .replace(/ruschaga\s+tarjima(\s+qil)?/gi, '').replace(/rus\s+tiliga\s+tarjima(\s+qil)?/gi, '')
      .replace(/ruscha\s+tarjima(\s+qil)?/gi, '').replace(/ruschadan\s+o'zbekchaga/gi, '')
      .replace(/ruschadan\s+tarjima(\s+qil)?/gi, '').replace(/ruschadan/gi, '').replace(/ruschada/gi, '')
      .replace(/nima\s+degani/gi, '').replace(/nima\s+bo'ladi/gi, '').replace(/nima\s+boladi/gi, '')
      .replace(/^[\s:;\-—]+/, '').replace(/[\s:;\-—]+$/, '').trim();
  }

  const _offDict = {
    uz_en: {'salom':'Hello','rahmat':'Thank you','xayr':'Goodbye','uy':'House','kitob':'Book','suv':'Water','non':'Bread','maktab':'School',"do'st":'Friend','pul':'Money','vaqt':'Time','ota':'Father','ona':'Mother','bola':'Child','olma':'Apple','mashina':'Car','shahar':'City','dunyo':'World','sevgi':'Love','hayot':'Life','odam':'Person','ish':'Work','kun':'Day','kecha':'Night','yaxshi':'Good','yomon':'Bad','katta':'Big','kichik':'Small','chiroyli':'Beautiful'},
    en_uz: {'hello':'Salom','hi':'Salom','thanks':'Rahmat','thank you':'Rahmat','goodbye':'Xayr','house':'Uy','book':'Kitob','water':'Suv','bread':'Non','school':'Maktab','friend':"Do'st",'money':'Pul','time':'Vaqt','father':'Ota','mother':'Ona','child':'Bola','apple':'Olma','car':'Mashina','city':'Shahar','world':'Dunyo','love':'Sevgi','life':'Hayot','person':'Odam','work':'Ish','day':'Kun','night':'Kecha','good':'Yaxshi','bad':'Yomon','big':'Katta','small':'Kichik','beautiful':'Chiroyli'},
    uz_ru: {'salom':'Привет','rahmat':'Спасибо','xayr':'Пока','uy':'Дом','kitob':'Книга','suv':'Вода','non':'Хлеб','maktab':'Школа',"do'st":'Друг','pul':'Деньги','vaqt':'Время','ota':'Отец','ona':'Мать','bola':'Ребёнок','olma':'Яблоко','mashina':'Машина','shahar':'Город','dunyo':'Мир','sevgi':'Любовь','hayot':'Жизнь','yer':'Земля','quyosh':'Солнце','oy':'Луна','osmon':'Небо','odam':'Человек','ish':'Работа','kun':'День','kecha':'Ночь','yaxshi':'Хорошо','yomon':'Плохо'},
    ru_uz: {'привет':'Salom','спасибо':'Rahmat','пока':'Xayr','дом':'Uy','книга':'Kitob','вода':'Suv','хлеб':'Non','школа':'Maktab','друг':"Do'st",'деньги':'Pul','время':'Vaqt','отец':'Ota','мать':'Ona','ребёнок':'Bola','яблоко':'Olma','машина':'Mashina','город':'Shahar','мир':'Dunyo','любовь':'Sevgi','жизнь':'Hayot','земля':'Yer','солнце':'Quyosh','луна':'Oy','небо':'Osmon','человек':'Odam','работа':'Ish','день':'Kun','ночь':'Kecha','хорошо':'Yaxshi','плохо':'Yomon'}
  };

  async function checkTranslationQuery(promptText) {
    const p = promptText.toLowerCase().trim();
    if (!/tarjima|inglizchaga|inglizcha|o'zbekchaga|ozbekchaga|ruschaga|ruschadan|ruschada|rus\s*tiliga|ingliz\s*tiliga|nima\s*degani|nima\s*bo'ladi|nima\s*boladi/.test(p)) return null;
    if (/^tarjima\s*[?!.]?$/.test(p)) return `🔤 **Universal Tarjima Xizmati**\n\n**So'z ham, uzun gap ham — 4 yo'nalishda tarjima!**\n\n🇺🇿➡️🇬🇧 *inglizchaga tarjima: Men bugun maktabga bordim*\n🇬🇧➡️🇺🇿 *o'zbekchaga tarjima: I went to school today*\n🇺🇿➡️🇷🇺 *ruschaga tarjima: Bugun ob-havo juda yaxshi*\n🇷🇺➡️🇺🇿 *ruschadan o'zbekchaga: Сегодня очень хорошая погода*\n\n💡 Internet bo'lmasa — zaxira lug'at ishlaydi!`;
    const dir = _transDirection(p);
    if (!dir) return null;
    const txt = _transExtract(promptText);
    if (!txt || txt.length < 1) {
      const ex = dir.to === 'Inglizcha' ? 'inglizchaga tarjima: Men bugun maktabga bordim' : dir.to === 'Ruscha' ? 'ruschaga tarjima: Bugun ob-havo yaxshi' : "o'zbekchaga tarjima: I went to school today";
      return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\nTarjima qilmoqchi bo'lgan matnni yozing!\n\n📌 *Misol: "${ex}"*`;
    }
    const langMap = {'Inglizcha':'en',"O'zbekcha":'uz',"Inglizcha/Ruscha":'en','Ruscha':'ru'};
    const fromLang = langMap[dir.from] || 'uz', toLang = langMap[dir.to] || 'en';
    try {
      const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(txt)}&langpair=${fromLang}|${toLang}`, { signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok) { const data = await res.json(); if (data && data.responseStatus === 200 && data.responseData && data.responseData.translatedText) { const out = data.responseData.translatedText.trim(); if (out && out.length > 0 && out.toLowerCase() !== txt.toLowerCase()) return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${out}`; } }
    } catch (e) {}
    try {
      const ctrl2 = new AbortController(); const tid2 = setTimeout(() => ctrl2.abort(), 12000);
      const res2 = await fetch(`https://text.pollinations.ai/${encodeURIComponent(dir.ai + txt)}`, { signal: ctrl2.signal });
      clearTimeout(tid2);
      if (res2.ok) { const out2 = (await res2.text()).trim(); if (out2 && out2.length > 0 && !out2.includes('402') && !/^error/i.test(out2) && out2.length < 2000) return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${out2}`; }
    } catch (e) {}
    const dk = dir.to === 'Inglizcha' ? 'uz_en' : dir.from === 'Ruscha' ? 'ru_uz' : dir.to === 'Ruscha' ? 'uz_ru' : 'en_uz';
    const dict = _offDict[dk]; const lower = txt.toLowerCase().trim();
    if (dict[lower]) return `🔤 **${dir.from} → ${dir.to} Tarjima** *(oflayn lug'at)*:\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${dict[lower]}\n\n⚠️ *Internet bo'lsa uzun gaplar ham tarjima qilinadi.*`;
    const words = lower.split(/\s+/);
    if (words.length <= 6) { const translated = words.map(w => dict[w] || w).join(' '); if (translated !== lower) return `🔤 **${dir.from} → ${dir.to} Tarjima** *(oflayn lug'at)*:\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${translated}\n\n⚠️ *Internet bo'lsa to'liq va aniq tarjima bo'ladi.*`; }
    return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\n📝 **Asl matn:** "${txt}"\n\n⚠️ **Internet aloqasi yo'q.** Ulanishni tekshiring va qayta urinib ko'ring!`;
  }

  function checkBuiltInSportsAndEntities(promptText) {
    const p = promptText.toLowerCase().trim();
    if (/tenis|tennis/.test(p)) return `🎾 **Tennis Sport Turi**\n\n🏆 **Grand Slam Turnirlari:**\n- 🇦🇺 Australian Open\n- 🇫🇷 Roland Garros\n- 🇬🇧 Wimbledon\n- 🇺🇸 US Open\n\n🌟 **Buyuk Afsonalar:**\n- 🇷🇸 Novak Djokovic: 24 GS (rekord!)\n- 🇪🇸 Rafael Nadal: 22 GS\n- 🇨🇭 Roger Federer: 20 GS`;
    if (/futbol|football|soccer/.test(p) && !/david raya|raya|mbappe|messi|ronaldo|arsenal|real madrid|barcelona/.test(p)) return `⚽ **Futbol Sport Turi**\n\n🏆 **Top 5 Chempionatlar:**\n- 🇪🇸 La Liga: Real Madrid, Barcelona\n- 🇬🇧 Premier League: Arsenal, Man City, Liverpool\n- 🇩🇪 Bundesliga: Bayern Munich\n- 🇮🇹 Serie A: Juventus, Inter\n- 🇫🇷 Ligue 1: PSG\n\n🌟 Messi, Ronaldo, Mbappé, Haaland, Bellingham`;
    if (/boks|boxing/.test(p) && !/jalolov|hasanboy|tyson|ali|fury|usyk|canelo/.test(p)) return `🥊 **Boks Sport Turi**\n\n🇺🇿 **O'zbekiston (Dunyoda №1!):**\n- 🥇 Bakhodir Jalolov: Tokyo 2020 Olimpiya Chempioni\n- 🥇 Hasanboy Do'smatov: Rio 2016 va Tokyo 2020\n\n🌟 Muhammad Ali, Mike Tyson, Tyson Fury, Oleksandr Usyk`;
    if (/david raya|raya/.test(p)) return `⚽ **David Raya (Arsenal & Ispaniya)**\n\n- 🥅 Asosiy Darvozabon\n- ⚽ Joriy Klub: **Arsenal F.C.** (2023-yildan)\n- 🏆 Premier League "Oltin Qo'lqop" sohibi\n- 🇪🇸 Euro 2024 Chempioni!`;
    if (/arsenal/.test(p)) return `⚽ **Arsenal F.C.**\n\n- 🏆 Premier League: 13 marta\n- 🏆 FA Cup: 14 marta (rekord!)\n- 🏟️ Emirates Stadium, London\n- 👤 Mikel Arteta\n- 🥅 David Raya`;
    if (/real madrid/.test(p)) return `⚽ **Real Madrid C.F.**\n\n- 🏆 UCL: 15 marta (rekord!)\n- 🏆 La Liga: 36 marta\n- 🏟️ Santiago Bernabéu\n- 🌟 Mbappé, Bellingham, Vinicius Jr`;
    if (/barcelona|barca/.test(p)) return `⚽ **FC Barcelona**\n\n- 🏆 La Liga: 27 marta | UCL: 5 marta\n- 🌟 Messi, Xavi, Iniesta (afsonalar)\n- 🏟️ Camp Nou`;
    if (/qo'y|qoy/.test(p)) return `🐑 **Qo'y**\n\n- ⏳ Umri: 10-15 yil\n- 🌍 Butun dunyo (xonakilashtirilgan)\n- ⚖️ 45-100 kg\n- 💡 8000 yil oldin xonakilashtirilgan`;
    if (/fil/.test(p)) return `🐘 **Fil**\n\n- ⏳ Umri: 60-70 yil\n- 🌍 Afrika va Osiyo\n- ⚖️ 4,000-7,000 kg (eng og'ir quruqlik hayvoni)\n- 🧠 Bir necha o'n yil eslab qoladi`;
    if (/sher|aslon/.test(p)) return `🦁 **Sher**\n\n- ⏳ Umri: 10-15 yil\n- ⚖️ 150-250 kg\n- 🏃 80 km/soat\n- 💡 Erkak sher 12 soat uxlaydi`;
    if (/\bit\b|kuchuk/.test(p)) return `🐶 **It**\n\n- ⏳ Umri: 10-15 yil\n- 🧠 2 yoshli bolaga teng aqli\n- 👃 Hidi insondan 100,000 marta kuchli`;
    if (/mushuk/.test(p)) return `🐱 **Mushuk**\n\n- ⏳ Umri: 12-18 yil\n- 👁️ Qorong'ida 6 marta yaxshi ko'radi\n- 😴 Kuniga 12-16 soat uxlaydi`;
    if (/ayiq/.test(p)) return `🐻 **Ayiq**\n\n- ⏳ Umri: 20-30 yil\n- ⚖️ 100-700 kg\n- 😴 Qishki uyqu: 4-6 oy`;
    if (/bo'ri|bori|qashqir/.test(p)) return `🐺 **Bo'ri**\n\n- ⏳ Umri: 6-8 yil\n- ⚖️ 25-50 kg\n- 🏃 60 km/soat`;
    if (/kenguru/.test(p)) return `🦘 **Kenguru**\n\n- ⏳ Umri: 6-8 yil\n- 🌍 Avstraliya\n- 🏃 70 km/soat, 9 m sakraydi`;
    if (/akula/.test(p)) return `🦈 **Akula**\n\n- ⏳ Umri: 20-70 yil\n- 🏊 70 km/soat\n- 💡 400 million yildan beri yashaydi`;
    if (/kit/.test(p)) return `🐋 **Kit**\n\n- ⏳ Umri: 80-200 yil\n- 📏 30 metr, 150 tonna\n- 💡 Eng katta hayvon`;
    if (/delfin/.test(p)) return `🐬 **Delfin**\n\n- ⏳ Umri: 20-30 yil\n- 🧠 Insondan keyin eng aqlli hayvon\n- 💡 Har bir delfin o'z nomiga ega`;
    if (/jiraff|jiraffa/.test(p)) return `🦒 **Jiraffa**\n\n- ⏳ Umri: 20-25 yil\n- 📏 5-6 metr (eng baland hayvon)\n- ⚖️ 800-1200 kg`;
    if (/timsoh|krokodil/.test(p)) return `🐊 **Timsoh**\n\n- ⏳ Umri: 70-100 yil\n- 💡 200 million yildan beri o'zgarmagan`;
    if (/zebra/.test(p)) return `🦓 **Zebra**\n\n- ⏳ Umri: 20-25 yil\n- 🏃 65 km/soat\n- 💡 Har bir zebraning yo'llari noyob`;
    if (/panda/.test(p)) return `🐼 **Panda**\n\n- ⏳ Umri: 15-20 yil\n- 🌍 Xitoy\n- 🎋 Kuniga 12-38 kg bambuk yeydi`;
    if (/burgut|lochin/.test(p)) return `🦅 **Burgut**\n\n- ⏳ Umri: 20-30 yil\n- 👁️ 3-4 km dan o'ljani ko'radi\n- 🏃 240 km/soat (sho'ng'iganda)`;
    if (/pingvin/.test(p)) return `🐧 **Pingvin**\n\n- ⏳ Umri: 15-20 yil\n- 🌍 Antarktida\n- 🏊 36 km/soat suzadi`;
    if (/hayvon|hayvonlar/.test(p)) return `🌍 **Hayvonlar Olami**\n\n🦁 Yirtqichlar: Sher, Bo'ri, Tulki, Ayiq\n🐘 Kattalar: Fil, Jiraffa, Zebra, Kenguru\n🐟 Dengiz: Kit, Delfin, Akula\n🐦 Qushlar: Burgut, Pingvin, To'ti\n🐍 Sudraluvchilar: Timsoh, Ilon, Toshbaqa\n\n💬 *Istalgan hayvon nomini yozing!*`;
    return null;
  }

  function checkCodingHelp(promptText) {
    const p = promptText.toLowerCase().trim();
    if (!/kod|code|python|java|javascript|html|css|intellij|idea|dastur|funksiya|loop|for|while|class|function|variable|array|list|print|console|error|debug/.test(p)) return null;
    if (/python/.test(p)) {
      if (/print/.test(p)) return `🐍 **Python — print():**\n\n\`\`\`python\nprint("Salom Dunyo!")\nism = "Jarvis"\nprint(f"Salom, {ism}!")\n\`\`\``;
      if (/loop|for|while/.test(p)) return `🐍 **Python — Loop:**\n\n\`\`\`python\nfor i in range(5):\n    print(f"Raqam: {i}")\n\nmevallar = ["olma", "nok", "banan"]\nfor meva in mevallar:\n    print(meva)\n\`\`\``;
      if (/class/.test(p)) return `🐍 **Python — Class:**\n\n\`\`\`python\nclass Mashina:\n    def __init__(self, nomi, yili):\n        self.nomi = nomi\n        self.yili = yili\n    def info(self):\n        print(f"{self.nomi} - {self.yili}")\n\nm = Mashina("Toyota", 2023)\nm.info()\n\`\`\``;
      if (/funksiya|function|def/.test(p)) return `🐍 **Python — Funksiya:**\n\n\`\`\`python\ndef salomlash(ism):\n    return f"Salom, {ism}!"\n\nprint(salomlash("Ali"))  # Salom, Ali!\n\`\`\``;
      return `🐍 **Python — Asosiy:**\n\n\`\`\`python\nism = "JARVIS"\nyosh = 25\nif yosh >= 18:\n    print("Voyaga yetgan")\ndef salom(name):\n    print(f"Salom, {name}!")\nsalom("Ali")\n\`\`\``;
    }
    if (/java/.test(p) && !/javascript/.test(p)) {
      if (/print/.test(p)) return `☕ **Java — println:**\n\n\`\`\`java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Salom Dunyo!");\n    }\n}\n\`\`\``;
      if (/loop|for|while/.test(p)) return `☕ **Java — Loop:**\n\n\`\`\`java\nfor (int i = 0; i < 5; i++) {\n    System.out.println("i = " + i);\n}\n\`\`\``;
      if (/class/.test(p)) return `☕ **Java — Class:**\n\n\`\`\`java\npublic class Mashina {\n    String nomi; int yili;\n    public Mashina(String nomi, int yili) { this.nomi=nomi; this.yili=yili; }\n    public void info() { System.out.println(nomi + " - " + yili); }\n    public static void main(String[] args) { new Mashina("Toyota",2023).info(); }\n}\n\`\`\``;
      return `☕ **Java — IntelliJ IDEA:**\n\n\`\`\`java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Salom Dunyo!");\n    }\n}\n\`\`\``;
    }
    if (/javascript|js/.test(p)) return `🌐 **JavaScript:**\n\n\`\`\`javascript\nlet ism = "JARVIS";\nfunction salom(name) { console.log(\`Salom, \${name}!\`); }\nconst arr = ["olma","nok","banan"];\narr.forEach(m => console.log(m));\n\`\`\``;
    if (/html/.test(p)) return `🌐 **HTML:**\n\n\`\`\`html\n<!DOCTYPE html>\n<html lang="uz">\n<head><meta charset="UTF-8"><title>Sahifa</title></head>\n<body>\n    <h1>Salom Dunyo!</h1>\n    <button onclick="alert('Salom!')">Bosing</button>\n</body>\n</html>\n\`\`\``;
    if (/css/.test(p)) return `🎨 **CSS:**\n\n\`\`\`css\nbody { font-family: Arial; background: #f0f0f0; }\nh1 { color: #333; text-align: center; }\n.btn { background: #007bff; color: white; padding: 10px 20px; border-radius: 5px; }\n\`\`\``;
    if (/intellij|idea/.test(p)) return `💡 **IntelliJ IDEA — Muhim tugmalar:**\n\n- \`Ctrl+Alt+L\` — Formatlash\n- \`Shift+F10\` — Ishga tushirish ▶️\n- \`Ctrl+/\` — Izoh\n- \`Alt+Enter\` — Xatoni tuzatish\n- \`Ctrl+Space\` — Avtoto'ldirish`;
    return null;
  }

  function checkConversation(promptText) {
    const p = promptText.toLowerCase().trim();
    if (/qalaysiz|qalaysan|qandaysiz/.test(p)) return `😊 **Men juda yaxshiman, rahmat!**\n\nHar doim siz bilan suhbatlashishdan xursandman! Sizchi?\n\n💬 Istalgan narsani so'rashingiz mumkin!`;
    if (/yomon|xafa|g'amgin|stress|charchad/.test(p)) return `🤗 **Tushunaman, har kimda bunday kunlar bo'ladi.**\n\nBu ham o'tib ketadi! Siz kuchli odamsiz. 💪`;
    if (/zerikdim|zerikarli|nima qilay/.test(p)) return `😄 **Zerikibsiz? Yordamlashaman!**\n\n- ⚽ *"Real Madrid haqida"*\n- 🏀 *"Basketbol haqida"*\n- 🧠 *"Mantiqiy masala ber"*\n- 💻 *"Python o'rgat"*`;
    if (/xayr|alvido|ko'rishguncha|sog' bo'ling/.test(p)) return `👋 **Xayr! Ko'rishguncha!**\n\nIstalgan vaqt qaytib keling! 😊 ☀️`;
    if (/rahmat|tashakkur/.test(p)) return `😊 **Iltimos, muammo emas!**\n\nYordam bera olganimdan xursandman! 🤝`;
    return null;
  }

  function checkLogicalPuzzle(promptText) {
    const p = promptText.toLowerCase().trim();
    if (!/mantiq|topishmoq|jumboq|puzzle|qiziq savol|qiyin savol/.test(p)) return null;
    const puzzles = [
      `🧠 **Mantiqiy Masala #1:**\n\n> Qancha ko'p olib chiqsang, u shuncha katta bo'ladi. Bu nima?\n\n💡 **Javob: Chuqurlik (Teshik)**`,
      `🧠 **Mantiqiy Masala #2:**\n\n> Men har doim oldingda boraman, lekin ko'ra olmaysan. Bu nima?\n\n💡 **Javob: Kelajak**`,
      `🧠 **Mantiqiy Masala #3:**\n\n> 2 ota va 2 o'g'il ovga ketishdi, har biri 1 quyon tutdi, uyga 3 ta keldi. Qanday?\n\n💡 **Javob:** Ular 3 kishi: Bobo, Ota va O'g'il`,
      `🧠 **Mantiqiy Masala #4:**\n\n> Qaysi so'zni noto'g'ri yozsang ham to'g'ri bo'ladi?\n\n💡 **Javob: "Noto'g'ri"** 😄`,
    ];
    return puzzles[Math.floor(Math.random() * puzzles.length)] + `\n\n🎯 *Yana mantiqiy masala uchun: "mantiqiy masala ber" deb yozing!*`;
  }

  async function fetchWikipediaSummary(promptText) {
    try {
      const p = promptText.toLowerCase().trim();
      if (/^(sen|siz|men|biz|u|o'zing|ozing|salom|hi|hello)$/.test(p)) return null;
      let cleanQuery = promptText.toLowerCase().replace(/(haqida|ma'lumot|malumat|ber|aytib|kim|qaysi|haqda|nima|qanday|qancha|yil|yashaydi)/gi,'').replace(/qulub/g,'klub').trim();
      if (!cleanQuery || cleanQuery.length < 2) cleanQuery = promptText.trim();
      if (cleanQuery === 'mbappe' || cleanQuery === 'mbappé') cleanQuery = 'Kylian Mbappé';

      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 10000);
      const searchRes = await fetch(`https://uz.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&origin=*`, {signal: ctrl.signal});
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData?.query?.search?.length > 0) {
          const topTitle = searchData.query.search[0].title;
          if (topTitle.toLowerCase().includes("o'zing") && /sen|o'zing|ozing/i.test(promptText)) return null;
          const ctrl2 = new AbortController(); setTimeout(() => ctrl2.abort(), 10000);
          const summaryRes = await fetch(`https://uz.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`, {signal: ctrl2.signal});
          if (summaryRes.ok) {
            const sumData = await summaryRes.json();
            if (sumData?.extract && sumData.extract.length > 20) {
              let icon = '🌐';
              if (/klub|futbol|sport|arsenal|real|barca/i.test(promptText)) icon = '⚽';
              else if (/hayvon|qo'y|fil|sher|mushuk|it/i.test(promptText)) icon = '🐾';
              else if (/boks|ufc|jalolov/i.test(promptText)) icon = '🥊';
              let resText = `**${icon} ${sumData.title}**\n\n`;
              if (sumData.description) resText += `*📌 ${sumData.description}*\n\n`;
              let extract = sumData.extract;
              if (/david raya|raya/i.test(promptText)) { extract = extract.replace(/Brentford/g, "Arsenal (2023-yildan)"); resText += `${extract}\n\n🏆 **Hozirgi Klub: Arsenal F.C.**`; return resText; }
              return resText + extract;
            }
          }
        }
      }

      const ctrl3 = new AbortController(); setTimeout(() => ctrl3.abort(), 10000);
      const enRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&origin=*`, {signal: ctrl3.signal});
      if (enRes.ok) {
        const enData = await enRes.json();
        if (enData?.query?.search?.length > 0) {
          const topTitle = enData.query.search[0].title;
          const ctrl4 = new AbortController(); setTimeout(() => ctrl4.abort(), 10000);
          const sumRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`, {signal: ctrl4.signal});
          if (sumRes.ok) {
            const sumData = await sumRes.json();
            if (sumData?.extract && sumData.extract.length > 20) {
              let resText = `**🌐 ${sumData.title}**\n\n`;
              if (sumData.description) resText += `*📌 ${sumData.description}*\n\n`;
              return resText + sumData.extract;
            }
          }
        }
      }
    } catch (e) { console.warn('Wikipedia error:', e); }
    return null;
  }

  async function fetchAIResponse(userPrompt) {
    const wikiResult = await fetchWikipediaSummary(userPrompt);
    if (wikiResult) return wikiResult;
    try {
      const systemPrompt = `Siz JARVIS AI — universal intellektual yordamchisiz. Barcha sport, klublar, sportchilar, hayvonlar va har qanday savolga o'zbek tilida aniq va chiroyli javob bering.`;
      const url = `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(systemPrompt)}&seed=42`;
      const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) { const text = await response.text(); if (text && text.trim().length > 5 && !text.includes('402')) return text.trim(); }
    } catch (e) {}
    return null;
  }

  function getSmartOfflineResponse(promptText) {
    const p = promptText.toLowerCase().trim();
    const nums = promptText.match(/\d+/g);
    if (nums && nums.length >= 2) {
      let itemMatch = promptText.match(/\b(olma|nok|behi|daftar|qalam|kitob|tuxum|mashina|bola|odam|pul|so'm)\b/i);
      let item = itemMatch ? itemMatch[0] : 'ta';
      let total = parseInt(nums[0], 10);
      if (nums.length === 2) {
        const n2 = parseInt(nums[1], 10);
        if (/yedi|yeb|ayir|sotdi|yo.qol|ketdi|qoldi/.test(p)) return `🧮 **Masala yechimi:**\n\n${total} - ${n2} = **${total - n2}**\n\nJavob: Sizda **${total - n2} ${item}** qoldi.`;
        if (/qo.sh|oldim|berdi|jami|bo.ldi/.test(p)) return `🧮 **Masala yechimi:**\n\n${total} + ${n2} = **${total + n2}**\n\nJavob: Jami **${total + n2} ${item}** bo'ldi.`;
      }
      if (nums.length === 3) { const n2 = parseInt(nums[1],10); const n3 = parseInt(nums[2],10); const res = total+n2-n3; return `🧮 **Masala yechimi:**\n\n${total} + ${n2} - ${n3} = **${res}**\n\nJavob: Sizda **${res} ${item}** qoldi.`; }
    }
    if (/salom|hello|hi |привет|qalaysiz|jarvis|kim/.test(p)) return `🤖 **Salom! Men JARVIS AI!**\n\n- ⚽ Sport & Klublar\n- 🐾 Hayvonlar\n- 🥊 Boks & UFC\n- 🔤 Tarjima\n- 🧮 Matematika`;
    return `🤖 **JARVIS AI:**\n\n"${promptText}" bo'yicha qidirildi.\n\n📌 Sinab ko'ring:\n- ⚽ *"Arsenal haqida"*\n- 🐾 *"Qo'y qancha yil yashaydi"*\n- 🧮 *"25 * 4 + 100"*`;
  }

  function getLangSystemPrompt() {
    if (currentLanguage === 'ru-RU') return 'Ты — умный голосовой помощник JARVIS AI. Отвечай ТОЛЬКО на русском языке. На любой вопрос давай подробный, полезный и дружелюбный ответ на русском. Никогда не отвечай на других языках.';
    if (currentLanguage === 'en-US') return 'You are JARVIS AI, a smart voice assistant. Answer ONLY in English. Give detailed, helpful and friendly answers in English to any question. Never answer in other languages.';
    return "Sen JARVIS AI — aqlli ovozli yordamchisan. Faqat O'ZBEK TILIDA javob ber.";
  }

  async function askPollinationsInLang(userPrompt) {
    const sysPrompt = getLangSystemPrompt();
    const endpoints = [
      `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(sysPrompt)}&seed=42&model=openai`,
      `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(sysPrompt)}&seed=42`
    ];
    for (const url of endpoints) {
      try {
        const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 15000);
        const res = await fetch(url, { signal: ctrl.signal }); clearTimeout(tid);
        if (res.ok) { const text = (await res.text()).trim(); if (text && text.length > 5 && !text.includes('402') && !/^error/i.test(text)) return text; }
      } catch (e) { continue; }
    }
    return null;
  }

  async function fetchAIResponseWithLang(userPrompt) {
    const wikiResult = await fetchWikipediaSummary(userPrompt);
    if (wikiResult) return wikiResult;
    try {
      const sysPrompt = getLangSystemPrompt();
      const url = `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(sysPrompt)}&seed=42`;
      const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 7000);
      const res = await fetch(url, { signal: ctrl.signal }); clearTimeout(tid);
      if (res.ok) { const text = await res.text(); if (text && text.trim().length > 5 && !text.includes('402')) return text.trim(); }
    } catch (e) {}
    return null;
  }

  function getOfflineLangResponse(prompt) {
    const p = prompt.toLowerCase().trim();
    const isRu = currentLanguage === 'ru-RU';
    if (isRu) {
      if (/привет|здравствуй|салам/.test(p)) return `👋 **Привет! Я JARVIS AI!**\n\nЗадайте любой вопрос — спорт, животные, математика, программирование!`;
      if (/кто ты|jarvis|джарвис/.test(p)) return `🤖 **Я JARVIS AI** — универсальный голосовой помощник!`;
      if (/спасибо|благодарю/.test(p)) return `😊 **Пожалуйста!** Рад помочь!`;
      if (/пока|до свидания/.test(p)) return `👋 **До свидания!** Возвращайтесь! ☀️`;
      return `🤖 **JARVIS AI:** Задайте любой вопрос — я отвечу на русском!`;
    }
    if (/hello|hi|hey/.test(p)) return `👋 **Hello! I'm JARVIS AI!**\n\nAsk me anything — sports, animals, math, coding!`;
    if (/who are you|jarvis/.test(p)) return `🤖 **I'm JARVIS AI** — your universal voice assistant!`;
    if (/thank|thanks/.test(p)) return `😊 **You're welcome!** Happy to help!`;
    if (/bye|goodbye/.test(p)) return `👋 **Goodbye!** Come back anytime! ☀️`;
    return `🤖 **JARVIS AI:** Ask me anything — I'll answer in English!`;
  }

  async function generateUniversalAIResponse(prompt) {
    const isUz = currentLanguage === 'uz-UZ';
    const isRu = currentLanguage === 'ru-RU';
    const isEn = currentLanguage === 'en-US';

    // EN yoki RU — to'g'ridan Pollinations AI ga
    if (isRu || isEn) {
      setAIState('processing');
      const answer = await askPollinationsInLang(prompt);
      if (answer && answer.length > 5) return answer;
      return getOfflineLangResponse(prompt);
    }

    // UZ — barcha built-in logikalar
    const mathR = trySolveMath(prompt); if (mathR) return mathR;
    const codeR = checkCodingHelp(prompt); if (codeR) return codeR;
    const transR = await checkTranslationQuery(prompt); if (transR) return transR;
    const logicR = checkLogicalPuzzle(prompt); if (logicR) return logicR;
    const convR = checkConversation(prompt); if (convR) return convR;
    const idR = checkIdentityOrGreeting(prompt); if (idR) return idR;
    const builtR = checkBuiltInSportsAndEntities(prompt); if (builtR) return builtR;
    setAIState('processing');
    const live = await fetchAIResponseWithLang(prompt);
    if (live && live.length > 5) return live;
    return getSmartOfflineResponse(prompt);
  }

  // Chat History
  function getChatHistory() { try { return JSON.parse(localStorage.getItem('jarvis_chats') || '[]'); } catch { return []; } }
  function saveChatHistory(chats) { try { localStorage.setItem('jarvis_chats', JSON.stringify(chats)); } catch {} }

  function saveCurrentChat() {
    if (!currentChatId) return;
    const chats = getChatHistory();
    const idx = chats.findIndex(c => c.id === currentChatId);
    const firstUserMsg = currentChatMessages.find(m => m.sender === 'user');
    const title = firstUserMsg ? firstUserMsg.text.substring(0, 40) + (firstUserMsg.text.length > 40 ? '...' : '') : 'Yangi chat';
    const chatObj = { id: currentChatId, title, date: new Date().toLocaleDateString('uz-UZ'), messages: currentChatMessages };
    if (idx >= 0) chats[idx] = chatObj; else chats.unshift(chatObj);
    saveChatHistory(chats); renderHistoryList();
  }

  function startNewChat() {
    if (currentChatMessages.length > 0) saveCurrentChat();
    currentChatId = 'chat_' + Date.now(); currentChatMessages = [];
    if (chatContainer) chatContainer.innerHTML = `<div class="chat-message assistant-message"><div class="avatar"><i class="fa-solid fa-robot"></i></div><div class="message-content"><div class="message-header"><span class="author-name">JARVIS AI</span><span class="time-stamp">Hozir</span></div><div class="message-text"><p>Yangi chat boshlandi! 🚀 Savolingizni yozing yoki mikrofonga gapiring.</p></div></div></div>`;
    renderHistoryList();
  }

  function loadChat(chatId) {
    saveCurrentChat();
    const chats = getChatHistory(); const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    currentChatId = chatId; currentChatMessages = chat.messages || [];
    if (!chatContainer) return;
    chatContainer.innerHTML = '';
    currentChatMessages.forEach(msg => appendChatMessageDOM(msg.sender, msg.text, msg.time));
    renderHistoryList();
  }

  function deleteChat(chatId, e) {
    e.stopPropagation();
    const chats = getChatHistory().filter(c => c.id !== chatId);
    saveChatHistory(chats);
    if (currentChatId === chatId) startNewChat(); else renderHistoryList();
  }

  function renderHistoryList() {
    if (!historyList) return;
    const chats = getChatHistory();
    if (chats.length === 0) { historyList.innerHTML = `<div class="history-empty"><i class="fa-solid fa-comment-slash"></i><span>Hali chat yo'q</span></div>`; return; }
    historyList.innerHTML = chats.map(chat => `
      <div class="history-item ${chat.id === currentChatId ? 'active' : ''}" data-id="${chat.id}">
        <div class="history-item-icon"><i class="fa-solid fa-message"></i></div>
        <div class="history-item-info">
          <div class="history-item-title">${escapeHTML(chat.title)}</div>
          <div class="history-item-date">${chat.date}</div>
        </div>
        <button class="history-delete-btn" data-id="${chat.id}" title="O'chirish"><i class="fa-solid fa-xmark"></i></button>
      </div>`).join('');
    historyList.querySelectorAll('.history-item').forEach(el => el.addEventListener('click', () => loadChat(el.dataset.id)));
    historyList.querySelectorAll('.history-delete-btn').forEach(btn => btn.addEventListener('click', (e) => deleteChat(btn.dataset.id, e)));
  }

  function initChat() {
    const chats = getChatHistory();
    if (chats.length > 0) {
      currentChatId = chats[0].id; currentChatMessages = chats[0].messages || [];
      if (chatContainer) { chatContainer.innerHTML = ''; currentChatMessages.forEach(msg => appendChatMessageDOM(msg.sender, msg.text, msg.time)); }
    } else { currentChatId = 'chat_' + Date.now(); currentChatMessages = []; }
    renderHistoryList();
    window.addEventListener('beforeunload', () => { if (currentChatMessages.length > 0) saveCurrentChat(); });
  }

  async function handleUserPrompt(promptText) {
    if (!promptText || !promptText.trim()) return;
    const text = promptText.trim();
    appendChatMessage('user', text);
    if (userInput) userInput.value = '';
    setAIState('processing');
    setTimeout(async () => {
      const response = await generateUniversalAIResponse(text);
      appendChatMessage('assistant', response);
      speakResponse(response);
    }, 150);
  }

  function appendChatMessage(sender, text) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentChatMessages.push({ sender, text, time: timeStr });
    saveCurrentChat();
    appendChatMessageDOM(sender, text, timeStr);
  }

  function appendChatMessageDOM(sender, text, timeStr) {
    if (!chatContainer) return;
    const div = document.createElement('div');
    div.className = `chat-message ${sender}-message`;
    if (!timeStr) { const now = new Date(); timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    const icon = sender === 'assistant' ? 'fa-robot' : 'fa-user';
    const name = sender === 'assistant' ? 'JARVIS AI' : 'Siz';
    div.innerHTML = `
      <div class="avatar"><i class="fa-solid ${icon}"></i></div>
      <div class="message-content">
        <div class="message-header"><span class="author-name">${name}</span><span class="time-stamp">${timeStr}</span></div>
        <div class="message-text">${formatMarkdown(text)}</div>
      </div>`;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    div.querySelectorAll('.copy-code-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.parentElement.nextElementSibling.textContent);
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Nusxalandi!';
        setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i> Nusxa olish'; }, 2000);
      });
    });
  }

  function formatMarkdown(text) {
    if (!text) return '';
    let html = escapeHTML(text);
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) =>
      `<div class="code-block-container"><div class="code-header"><span>${lang||'code'}</span><button class="copy-code-btn"><i class="fa-solid fa-copy"></i> Nusxa olish</button></div><pre><code>${code.trim()}</code></pre></div>`
    );
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    const lines = html.split('\n');
    let body = '', inList = false, listType = '';
    lines.forEach(line => {
      const t = line.trim();
      if (t.startsWith('- ') || t.startsWith('* ')) {
        if (!inList || listType !== 'ul') { if (inList) body += `</${listType}>`; body += '<ul>'; inList = true; listType = 'ul'; }
        body += `<li>${t.substring(2)}</li>`;
      } else if (/^\d+\.\s/.test(t)) {
        if (!inList || listType !== 'ol') { if (inList) body += `</${listType}>`; body += '<ol>'; inList = true; listType = 'ol'; }
        body += `<li>${t.replace(/^\d+\.\s/, '')}</li>`;
      } else {
        if (inList) { body += `</${listType}>`; inList = false; listType = ''; }
        if (t && !t.startsWith('<div') && !t.startsWith('</div') && !t.startsWith('<pre') && !t.startsWith('</pre')) body += `<p>${t}</p>`;
        else body += t;
      }
    });
    if (inList) body += `</${listType}>`;
    return body;
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t]||t));
  }

  // Event Listeners
  if (sendBtn) sendBtn.addEventListener('click', e => { e.preventDefault(); const t = userInput?.value.trim(); if (t) handleUserPrompt(t); });
  if (userInput) userInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const t = userInput.value.trim(); if (t) handleUserPrompt(t); } });
  if (micToggleBtn) micToggleBtn.addEventListener('click', () => { if (isListening) stopListening(); else startListening(); });
  if (btnCancelVoice) btnCancelVoice.addEventListener('click', stopListening);
  if (soundToggleBtn) soundToggleBtn.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    soundToggleBtn.innerHTML = ttsEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
  });
  if (clearChatBtn) clearChatBtn.addEventListener('click', () => {
    if (!confirm('Bu chatni tozalaysizmi?')) return;
    currentChatMessages = []; saveCurrentChat();
    if (chatContainer) chatContainer.innerHTML = `<div class="chat-message assistant-message"><div class="avatar"><i class="fa-solid fa-robot"></i></div><div class="message-content"><div class="message-header"><span class="author-name">JARVIS AI</span><span class="time-stamp">Hozir</span></div><div class="message-text"><p>Chat tozalandi! 🚀</p></div></div></div>`;
  });
  if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);
  if (langUzBtn) langUzBtn.addEventListener('click', () => { currentLanguage = 'uz-UZ'; langUzBtn.classList.add('active'); langEnBtn?.classList.remove('active'); langRuBtn?.classList.remove('active'); if (recognition) recognition.lang = 'uz-UZ'; });
  if (langEnBtn) langEnBtn.addEventListener('click', () => { currentLanguage = 'en-US'; langEnBtn.classList.add('active'); langUzBtn?.classList.remove('active'); langRuBtn?.classList.remove('active'); if (recognition) recognition.lang = 'en-US'; });
  if (langRuBtn) langRuBtn.addEventListener('click', () => { currentLanguage = 'ru-RU'; langRuBtn.classList.add('active'); langUzBtn?.classList.remove('active'); langEnBtn?.classList.remove('active'); if (recognition) recognition.lang = 'ru-RU'; });

  initChat();

});
