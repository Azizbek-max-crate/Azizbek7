/**
 * JARVIS AI — Universal Voice Assistant & Knowledge Engine
 * Powered by Pollinations.ai (Free Universal AI — All Languages, Sports, Football, Boxing, Translation, Math, World Knowledge)
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('JARVIS AI initializing...');

  // DOM Elements
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
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  // Application State
  let currentLanguage = 'uz-UZ';
  let isListening = false;
  let ttsEnabled = true;
  let recognition = null;
  let activeState = 'idle';
  let currentChatId = null;
  let currentChatMessages = [];
  let currentTheme = 'dark';
  let typingIndicatorEl = null;

  // Canvas Neon Orb Setup
  const canvas = document.getElementById('orbCanvas');
  let ctx = null;
  if (canvas) ctx = canvas.getContext('2d');

  class OrbParticle {
    constructor(cx, cy) {
      this.cx = cx;
      this.cy = cy;
      this.reset();
    }
    reset() {
      this.angle = Math.random() * Math.PI * 2;
      this.radius = 35 + Math.random() * 55;
      this.speed = 0.01 + Math.random() * 0.02;
      this.size = 1.5 + Math.random() * 2.5;
      this.alpha = 0.2 + Math.random() * 0.7;
    }
    update(state) {
      const speedMult = state === 'listening' ? 2.5 : state === 'speaking' ? 2.0 : 1.0;
      this.angle += this.speed * speedMult;
    }
    draw(ctx, state) {
      if (!ctx) return;
      const x = this.cx + Math.cos(this.angle) * this.radius;
      const y = this.cy + Math.sin(this.angle) * this.radius;
      ctx.beginPath();
      ctx.arc(x, y, this.size, 0, Math.PI * 2);
      let pColor = `rgba(0, 242, 254, ${this.alpha})`;
      if (state === 'listening') pColor = `rgba(225, 0, 255, ${this.alpha})`;
      else if (state === 'speaking') pColor = `rgba(79, 172, 254, ${this.alpha})`;
      ctx.fillStyle = pColor;
      ctx.shadowBlur = 8;
      ctx.shadowColor = pColor;
      ctx.fill();
    }
  }

  const particles = [];
  if (ctx) {
    for (let i = 0; i < 45; i++) particles.push(new OrbParticle(140, 140));
  }

  let orbPulse = 0;
  function renderOrb() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    orbPulse += activeState === 'listening' ? 0.08 : activeState === 'speaking' ? 0.06 : 0.02;
    const baseRadius = 65 + Math.sin(orbPulse) * (activeState === 'listening' ? 12 : activeState === 'speaking' ? 8 : 4);
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    let glowGradient = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, baseRadius * 1.3);
    if (activeState === 'listening') {
      glowGradient.addColorStop(0, 'rgba(225, 0, 255, 0.4)');
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (activeState === 'speaking') {
      glowGradient.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      glowGradient.addColorStop(0, 'rgba(0, 242, 254, 0.2)');
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = glowGradient;
    ctx.fill();
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
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLanguage;
      recognition.onstart = () => {
        isListening = true;
        setAIState('listening');
        if (micToggleBtn) micToggleBtn.classList.add('listening');
        if (voiceActivityBar) voiceActivityBar.classList.remove('hidden');
        if (micStatusLabel) micStatusLabel.textContent = "Sizni eshitayapman... Gapiring";
      };
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (userInput) userInput.value = transcript;
      };
      recognition.onerror = (err) => { console.warn('Speech recognition error:', err); stopListening(); };
      recognition.onend = () => {
        const text = userInput ? userInput.value.trim() : '';
        stopListening();
        if (text) handleUserPrompt(text);
      };
    } catch (err) { console.error('Speech recognition init error:', err); }
  }
  initSpeechRecognition();

  function startListening() {
    if (!recognition) { alert("Brauzeringizda ovoz kiritish qo'llab-quvvatlanmaydi."); return; }
    try {
      recognition.lang = currentLanguage;
      if (userInput) userInput.value = '';
      recognition.start();
    } catch (e) { stopListening(); }
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
  function populateVoices() {
    if (window.speechSynthesis) cachedVoices = window.speechSynthesis.getVoices();
  }
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
      if (!cachedVoices.length) {
        window.speechSynthesis.onvoiceschanged = () => { cachedVoices = window.speechSynthesis.getVoices(); window.speechSynthesis.speak(utterance); };
      } else { window.speechSynthesis.speak(utterance); }
    } catch (e) { setAIState('idle'); }
  }

  function setAIState(state) {
    activeState = state;
    const centerIcon = document.getElementById('orbCenterIcon');
    if (!aiStatusBadge || !aiStatusText) return;
    if (state === 'listening') {
      aiStatusBadge.className = 'status-badge listening'; aiStatusText.textContent = 'Eshitilmoqda...';
      if (centerIcon) { centerIcon.innerHTML = '<i class="fa-solid fa-waveform fa-bounce"></i>'; centerIcon.style.borderColor = 'var(--accent-magenta)'; }
    } else if (state === 'speaking') {
      aiStatusBadge.className = 'status-badge speaking'; aiStatusText.textContent = 'Gapirilmoqda...';
      if (centerIcon) { centerIcon.innerHTML = '<i class="fa-solid fa-volume-high fa-beat"></i>'; centerIcon.style.borderColor = 'var(--accent-blue)'; }
    } else if (state === 'processing') {
      aiStatusBadge.className = 'status-badge'; aiStatusText.textContent = 'Hisoblanmoqda...';
      if (centerIcon) { centerIcon.innerHTML = '<i class="fa-solid fa-brain fa-spin"></i>'; centerIcon.style.borderColor = 'var(--accent-cyan)'; }
    } else {
      aiStatusBadge.className = 'status-badge idle'; aiStatusText.textContent = 'AI Tayyor';
      if (centerIcon) { centerIcon.innerHTML = '<i class="fa-solid fa-microphone"></i>'; centerIcon.style.borderColor = 'rgba(0, 242, 254, 0.4)'; }
    }
  }

  // Math Solver Engine
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

  // Identity & Greeting check
  function checkIdentityOrGreeting(promptText) {
    const p = promptText.toLowerCase().trim();
    if (/sen kim|kim san|kim siz|o'zing|ozing|jarvis|qalaysiz|qalaysan|salom|assalom|kim bu/i.test(p) ||
        /o'zing haqida|ozing haqida|sen kimsan|kim kimsan|sen kimsiz/i.test(p)) {
      return `🤖 **Men JARVIS AI — Sizning Intellektual Ovozli Yordamchingizman!**\n\nMen dunyodagi barcha bilimlarga ega AI yordamchisiman:\n- ⚽ **Sport va Klublar:** Arsenal, Real Madrid, Barcelona, Man City va barcha jamoalar\n- 🥊 **Boks va UFC:** Bakhodir Jalolov, Mike Tyson, Khabib va barcha sportchilar\n- 🐾 **Hayvonlar:** Qo'y, fil, sher, ot va barcha hayvonlarning yashash yillari va xususiyatlari\n- 🔤 **Tarjima:** Inglizcha, o'zbekcha, ruscha va barcha tillardan UZUN GAPLARNI tarjima qilish\n- 🧮 **Matematika:** Har qanday misollar va masalalar\n\nIstalgan savolingizni bering!`;
    }
    return null;
  }

  // Tarjima yo'nalishi
  function _transDirection(p) {
    if (/inglizchaga|ingliz\s*tiliga|ingilizchaga|inglizcha\s*tarjima/.test(p))
      return { from: "O'zbekcha", to: "Inglizcha", flag: "🇬🇧", ai: "You are a professional translator. Translate ONLY the following Uzbek text to English — output the translation only, nothing else:\n\n" };
    if (/o'zbekchaga|o'zbek\s*tiliga|ozbekchaga|o'zbekcha\s*tarjima/.test(p))
      return { from: "Inglizcha/Ruscha", to: "O'zbekcha", flag: "🇺🇿", ai: "You are a professional translator. Translate ONLY the following text to Uzbek — output the translation only, nothing else:\n\n" };
    if (/ruschaga|rus\s*tiliga|ruscha\s*tarjima/.test(p))
      return { from: "O'zbekcha", to: "Ruscha", flag: "🇷🇺", ai: "Ты профессиональный переводчик. Переведи ТОЛЬКО следующий текст на русский язык — выведи только перевод, ничего лишнего:\n\n" };
    if (/ruschadan/.test(p))
      return { from: "Ruscha", to: "O'zbekcha", flag: "🇺🇿", ai: "Ты профессиональный переводчик. Переведи ТОЛЬКО следующий русский текст на узбекский — выведи только перевод, ничего лишнего:\n\n" };
    if (/ruschada|nima\s*degani|nima\s*bo'ladi|nima\s*boladi/.test(p))
      return { from: "Ruscha", to: "O'zbekcha", flag: "🇺🇿", ai: "Ты профессиональный переводчик. Переведи ТОЛЬКО следующий русский текст на узбекский — выведи только перевод, ничего лишнего:\n\n" };
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
    uz_en: { 'salom':'Hello','rahmat':'Thank you','xayr':'Goodbye','uy':'House','kitob':'Book','suv':'Water','non':'Bread','maktab':'School',"do'st":'Friend','pul':'Money','vaqt':'Time','ota':'Father','ona':'Mother','bola':'Child','olma':'Apple','mashina':'Car','shahar':'City','dunyo':'World','sevgi':'Love','hayot':'Life','odam':'Person','ish':'Work','kun':'Day','kecha':'Night','yaxshi':'Good','yomon':'Bad','katta':'Big','kichik':'Small','chiroyli':'Beautiful' },
    en_uz: { 'hello':'Salom','hi':'Salom','thanks':'Rahmat','thank you':'Rahmat','goodbye':'Xayr','house':'Uy','book':'Kitob','water':'Suv','bread':'Non','school':'Maktab','friend':"Do'st",'money':'Pul','time':'Vaqt','father':'Ota','mother':'Ona','child':'Bola','apple':'Olma','car':'Mashina','city':'Shahar','world':'Dunyo','love':'Sevgi','life':'Hayot','person':'Odam','work':'Ish','day':'Kun','night':'Kecha','good':'Yaxshi','bad':'Yomon','big':'Katta','small':'Kichik','beautiful':'Chiroyli' },
    uz_ru: { 'salom':'Привет','rahmat':'Спасибо','xayr':'Пока','uy':'Дом','kitob':'Книга','suv':'Вода','non':'Хлеб','maktab':'Школа',"do'st":'Друг','pul':'Деньги','vaqt':'Время','ota':'Отец','ona':'Мать','bola':'Ребёнок','olma':'Яблоко','mashina':'Машина','shahar':'Город','dunyo':'Мир','sevgi':'Любовь','hayot':'Жизнь','yer':'Земля','quyosh':'Солнце','oy':'Луна','osmon':'Небо','odam':'Человек','ish':'Работа','kun':'День','kecha':'Ночь','yaxshi':'Хорошо','yomon':'Плохо' },
    ru_uz: { 'привет':'Salom','спасибо':'Rahmat','пока':'Xayr','дом':'Uy','книга':'Kitob','вода':'Suv','хлеб':'Non','школа':'Maktab','друг':"Do'st",'деньги':'Pul','время':'Vaqt','отец':'Ota','мать':'Ona','ребёнок':'Bola','яблоко':'Olma','машина':'Mashina','город':'Shahar','мир':'Dunyo','любовь':'Sevgi','жизнь':'Hayot','земля':'Yer','солнце':'Quyosh','луна':'Oy','небо':'Osmon','человек':'Odam','работа':'Ish','день':'Kun','ночь':'Kecha','хорошо':'Yaxshi','плохо':'Yomon' }
  };

  async function checkTranslationQuery(promptText) {
    const p = promptText.toLowerCase().trim();
    if (!/tarjima|inglizchaga|inglizcha|o'zbekchaga|ozbekchaga|ruschaga|ruschadan|ruschada|rus\s*tiliga|ingliz\s*tiliga|nima\s*degani|nima\s*bo'ladi|nima\s*boladi/.test(p)) return null;
    if (/^tarjima\s*[?!.]?$/.test(p)) {
      return `🔤 **Universal Tarjima Xizmati**\n\n**So'z ham, uzun gap ham — 4 yo'nalishda tarjima!**\n\n🇺🇿➡️🇬🇧 *inglizchaga tarjima: Men bugun maktabga bordim*\n🇬🇧➡️🇺🇿 *o'zbekchaga tarjima: I went to school today*\n🇺🇿➡️🇷🇺 *ruschaga tarjima: Bugun ob-havo juda yaxshi*\n🇷🇺➡️🇺🇿 *ruschadan o'zbekchaga: Сегодня очень хорошая погода*\n\n💡 Internet bo'lmasa — zaxira lug'at ishlaydi!`;
    }
    const dir = _transDirection(p);
    if (!dir) return null;
    const txt = _transExtract(promptText);
    if (!txt || txt.length < 1) {
      const ex = dir.to === 'Inglizcha' ? 'inglizchaga tarjima: Men bugun maktabga bordim' : dir.to === 'Ruscha' ? 'ruschaga tarjima: Bugun ob-havo yaxshi' : "o'zbekchaga tarjima: I went to school today";
      return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\nTarjima qilmoqchi bo'lgan matnni yozing!\n\n📌 *Misol: "${ex}"*`;
    }
    const langMap = { 'Inglizcha': 'en', "O'zbekcha": 'uz', "Inglizcha/Ruscha": 'en', 'Ruscha': 'ru' };
    const fromLang = langMap[dir.from] || 'uz';
    const toLang = langMap[dir.to] || 'en';
    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(txt)}&langpair=${fromLang}|${toLang}`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(myMemoryUrl, { signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok) {
        const data = await res.json();
        if (data && data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
          const out = data.responseData.translatedText.trim();
          if (out && out.length > 0 && out.toLowerCase() !== txt.toLowerCase()) {
            return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${out}`;
          }
        }
      }
    } catch (e) {}
    const encodedPrompt = encodeURIComponent(dir.ai + txt);
    try {
      const ctrl2 = new AbortController();
      const tid2 = setTimeout(() => ctrl2.abort(), 12000);
      const res2 = await fetch(`https://text.pollinations.ai/${encodedPrompt}`, { signal: ctrl2.signal });
      clearTimeout(tid2);
      if (res2.ok) {
        const out2 = (await res2.text()).trim();
        if (out2 && out2.length > 0 && !out2.includes('402') && !/^error/i.test(out2) && out2.length < 2000) {
          return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${out2}`;
        }
      }
    } catch (e) {}
    const dk = dir.to === 'Inglizcha' ? 'uz_en' : dir.from === 'Ruscha' ? 'ru_uz' : dir.to === 'Ruscha' ? 'uz_ru' : 'en_uz';
    const dict = _offDict[dk];
    const lower = txt.toLowerCase().trim();
    if (dict[lower]) return `🔤 **${dir.from} → ${dir.to} Tarjima** *(oflayn lug'at)*:\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${dict[lower]}\n\n⚠️ *Internet bo'lsa uzun gaplar ham tarjima qilinadi.*`;
    const words = lower.split(/\s+/);
    if (words.length <= 6) {
      const translated = words.map(w => dict[w] || w).join(' ');
      if (translated !== lower) return `🔤 **${dir.from} → ${dir.to} Tarjima** *(oflayn lug'at)*:\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${translated}\n\n⚠️ *Internet bo'lsa to'liq va aniq tarjima bo'ladi.*`;
    }
    return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\n📝 **Asl matn:** "${txt}"\n\n⚠️ **Internet aloqasi yo'q.** Ulanishni tekshiring va qayta urinib ko'ring!\n\n💡 *Internetda so'z ham, uzun gap ham to'liq tarjima qilinadi.*`;
  }

  // Built-in Sports & Entities Engine
  function checkBuiltInSportsAndEntities(promptText) {
    const p = promptText.toLowerCase().trim();

    if (/tenis|tennis/.test(p)) {
      return `🎾 **Tennis (Katta Tennis) Sport Turi**\n\nTennis — kortda raketka va to'p bilan ikki o'yinchi (yoki juftlik) o'rtasida o'ynaladigan dunyoga mashhur Olimpiya sport turi.\n\n🏆 **Katta Dultug'a (Grand Slam) Turnirlari:**\n- 🇦🇺 **Australian Open** (Melburn)\n- 🇫🇷 **Roland Garros** (Parij — tuproq kort)\n- 🇬🇧 **Wimbledon** (London — maysa kort)\n- 🇺🇸 **US Open** (Nyu-York — qattiq kort)\n\n🌟 **Buyuk Afsonalar:**\n- 🇷🇸 **Novak Djokovic:** 24 marta Grand Slam g'olibi (tarixiy rekord!)\n- 🇪🇸 **Rafael Nadal:** 22 marta Grand Slam g'olibi ("Tuproq Qiroli")\n- 🇨🇭 **Roger Federer:** 20 marta Grand Slam g'olibi\n- 👧 **Ayollar:** Serena Williams, Iga Swiatek, Aryna Sabalenka`;
    }
    if (/futbol|football|soccer/.test(p) && !/david raya|raya|mbappe|messi|ronaldo|arsenal|real madrid|barcelona/.test(p)) {
      return `⚽ **Futbol Sport Turi va Chempionatlar**\n\nFutbol — dunyodagi №1 eng ommabop va sevimli jamoaviy sport turi!\n\n🏆 **Top 5 Chempionatlar va Klublar:**\n- 🇪🇸 **La Liga (Ispaniya):** Real Madrid, FC Barcelona, Atletico Madrid\n- 🇬🇧 **Premier League (Angliya):** Arsenal, Manchester City, Liverpool, Manchester United, Chelsea\n- 🇩🇪 **Bundesliga (Germaniya):** Bayern Munich, Borussia Dortmund\n- 🇮🇹 **Serie A (Italiya):** Juventus, Inter Milan, AC Milan\n- 🇫🇷 **Ligue 1 (Fransiya):** Paris Saint-Germain (PSG)\n\n🌟 **Top O'yinchilar:** Lionel Messi, Cristiano Ronaldo, Kylian Mbappé, Erling Haaland, Jude Bellingham, David Raya (Arsenal).`;
    }
    if (/boks|boxing/.test(p) && !/jalolov|hasanboy|tyson|ali|fury|usyk|canelo/.test(p)) {
      return `🥊 **Boks Sport Turi**\n\nBoks — ikki bokschi o'rtasida maxsus qo'lqoplarda o'tkaziladigan yakkakurash sport turi.\n\n🇺🇿 **O'zbekiston Boks Maktabi (Dunyoda №1!):**\n- 🥇 **Bakhodir Jalolov:** Tokyo 2020 Olimpiya Chempioni (Super og'ir vazn, 15-0 nokautlar)\n- 🥇 **Hasanboy Do'smatov:** Rio 2016 va Tokyo 2020 Olimpiya Chempioni (Val Barker kubogi)\n- 🥇 **Lazizbek Mullojonov, Abdumalik Khalokov, Asadkhuja Muydinkhujaev**\n\n🌟 **Jahon Afsonalari:** Muhammad Ali ("The Greatest"), Mike Tyson ("Iron Mike"), Tyson Fury, Oleksandr Usyk, Canelo Alvarez.`;
    }
    if (/david raya|raya/.test(p)) {
      return `⚽ **David Raya (Arsenal & Ispaniya)**\n\n- 🥅 **Pozitsiyasi:** Asosiy Darvozabon (Goalkeeper)\n- ⚽ **Joriy Klub:** **Arsenal F.C.** (2023-yildan buyon, Brentford'dan transfer bo'lgan)\n- 🏆 **Yutuqlari:** Angliya Premier Ligasida **"Oltin Qo'lqop" (Golden Glove)** sohibi (16 ta quruq o'yin!)\n- 🇪🇸 **Terma Jamoa:** Ispaniya terma jamoasi darvozaboni (Euro 2024 Chempioni!)\n- 📜 **Ilgari:** Blackburn Rovers, Brentford (2019-2023)`;
    }
    if (/arsenal/.test(p)) {
      return `⚽ **Arsenal F.C. (Angliya, London)**\n\n- 🏆 **Premier League:** 13 marta g'olib\n- 🏆 **FA Cup:** 14 marta g'olib (rekord!)\n- 🏟️ **Stadion:** Emirates Stadium (London)\n- 👤 **Bosh Murabbiy:** Mikel Arteta\n- 🥅 **Asosiy Darvozabon:** David Raya\n- 🔴 Laqabi: *"The Gunners"* ("To'pchilar")`;
    }

    // Hayvonlar
    if (/hayvon|hayvonlar|qo'y|qoy|fil|sher|ot|mushuk|it|ayiq|bo'ri|bori|tulki|tovuq|qush|baliq|yashaydi|kenguru|zebra|jiraffa|gipopotam|krokodil|timsoh|ilon|kaltakesak|toshbaqa|qurbaqa|maymun|gorilla|shimpanze|panda|qo'ng'iz|kapalak|asalari|chumoli|o'rgimchak|chayon|burgut|lochin|qoqish|tustovuq|to'ti|pingvin|tuyaqush|oqqush|o'rdak|g'oz|sichqon|kalamush|quyon|bug'u|jayron|kiyik|sher|bars|leopard|gepard|kit|delfin|akula|ot baliq|medusa|laqqa/.test(p)) {
      if (/qo'y|qoy/.test(p)) return `🐑 **Qo'y**\n\n- ⏳ **Umri:** 10-15 yil\n- 🌍 **Yashash joyi:** Butun dunyo (xonakilashtirilgan)\n- 🌿 **Oziqlanishi:** O't, don\n- ⚖️ **Vazni:** 45-100 kg\n- 💡 **Qiziqarli fakt:** 8000 yil oldin xonakilashtirilgan, inson bilan eng qadimiy hayvonlardan biri.\n- 🎯 **Foyda:** Go'sht, jun, sut`;
      if (/fil/.test(p)) return `🐘 **Fil**\n\n- ⏳ **Umri:** 60-70 yil\n- 🌍 **Yashash joyi:** Afrika va Osiyo\n- ⚖️ **Vazni:** 4,000-7,000 kg (eng og'ir quruqlik hayvoni)\n- 🧠 **Xotirasi:** Bir necha o'n yil eslab qoladi\n- 💡 **Qiziqarli fakt:** Burun bilan 8 litr suv shimib ichadi, issiqda o'zini sovutadi`;
      if (/sher|aslon/.test(p)) return `🦁 **Sher**\n\n- ⏳ **Umri:** 10-15 yil (tabiatda), 20-25 yil (hayvonot bog'ida)\n- 🌍 **Yashash joyi:** Afrika savannasi, Hindiston (Gir o'rmoni)\n- ⚖️ **Vazni:** 150-250 kg\n- 🏃 **Tezligi:** 80 km/soat\n- 💡 **Qiziqarli fakt:** Erkak sher 12 soat uxlaydi, dishi ov qiladi`;
      if (/^ot|otlar/.test(p)) return `🐎 **Ot**\n\n- ⏳ **Umri:** 25-30 yil\n- 🌍 **Yashash joyi:** Butun dunyo\n- ⚖️ **Vazni:** 400-1000 kg\n- 🏃 **Tezligi:** 70 km/soat (tez yurganda)\n- 💡 **Qiziqarli fakt:** Tik turib uxlaydi, ko'zi 350 daraja ko'radi`;
      if (/it|kuchuk/.test(p)) return `🐶 **It**\n\n- ⏳ **Umri:** 10-15 yil\n- 🌍 **Yashash joyi:** Butun dunyo (xonakilashtirilgan)\n- 🧠 **Aqli:** 2 yoshli bolaga teng\n- 👃 **Hidi:** Insondan 100,000 marta kuchli\n- 💡 **Qiziqarli fakt:** 15,000 yil oldin bo'ridan xonakilashtirilgan`;
      if (/mushuk/.test(p)) return `🐱 **Mushuk**\n\n- ⏳ **Umri:** 12-18 yil\n- 🌍 **Yashash joyi:** Butun dunyo\n- 👁️ **Ko'rishi:** Qorong'ida 6 marta yaxshi ko'radi\n- 😴 **Uyqusi:** Kuniga 12-16 soat uxlaydi\n- 💡 **Qiziqarli fakt:** Mushuk miyovlashi faqat insonlar bilan muloqot uchun`;
      if (/ayiq/.test(p)) return `🐻 **Ayiq**\n\n- ⏳ **Umri:** 20-30 yil\n- 🌍 **Yashash joyi:** Shimoliy Amerika, Yevropa, Osiyo\n- ⚖️ **Vazni:** 100-700 kg\n- 😴 **Qishki uyqu:** 4-6 oy uxlaydi\n- 💡 **Qiziqarli fakt:** Qutb ayig'i (oq ayiq) 40 km/soat suzadi`;
      if (/bo'ri|bori|qashqir/.test(p)) return `🐺 **Bo'ri (Qashqir)**\n\n- ⏳ **Umri:** 6-8 yil (tabiatda), 16 yil (asirlikda)\n- 🌍 **Yashash joyi:** Shimoliy Amerika, Yevropa, Osiyo\n- ⚖️ **Vazni:** 25-50 kg\n- 🏃 **Tezligi:** 60 km/soat\n- 💡 **Qiziqarli fakt:** To'da bo'lib ov qiladi, 1 marta 9 kg go'sht yeydi`;
      if (/kenguru/.test(p)) return `🦘 **Kenguru**\n\n- ⏳ **Umri:** 6-8 yil\n- 🌍 **Yashash joyi:** Avstraliya\n- 🏃 **Tezligi:** 70 km/soat, 9 m uzunlikda sakraydi\n- 👶 **Bolasi:** Tug'ilganda 2 sm — ona cho'ntagida 8 oy o'sadi\n- 💡 **Qiziqarli fakt:** Orqaga yura olmaydi`;
      if (/zebra/.test(p)) return `🦓 **Zebra**\n\n- ⏳ **Umri:** 20-25 yil\n- 🌍 **Yashash joyi:** Afrika\n- 🏃 **Tezligi:** 65 km/soat\n- 💡 **Qiziqarli fakt:** Oq yoki qora? Aslida qora teriga oq yo'llar`;
      if (/jiraff|jiraffa|zirafa/.test(p)) return `🦒 **Jiraffa**\n\n- ⏳ **Umri:** 20-25 yil\n- 🌍 **Yashash joyi:** Afrika\n- 📏 **Bo'yi:** 5-6 metr (eng baland quruqlik hayvoni)\n- ⚖️ **Vazni:** 800-1200 kg\n- 💡 **Qiziqarli fakt:** Bo'yni 1.8 m bo'lsa ham, umurtqa soni insonnikidek — 7 ta`;
      if (/timsoh|krokodil/.test(p)) return `🐊 **Timsoh (Krokodil)**\n\n- ⏳ **Umri:** 70-100 yil\n- 🌍 **Yashash joyi:** Afrika, Osiyo, Amerika, Avstraliya\n- ⚖️ **Vazni:** 400-1000 kg\n- 💡 **Qiziqarli fakt:** 200 million yildan beri o'zgarmagan — dinozavrlar davridagi ko'rinishi`;
      if (/ilon/.test(p)) return `🐍 **Ilon**\n\n- ⏳ **Umri:** 10-30 yil\n- 🌍 **Yashash joyi:** Barcha qit'alar (Antarktidadan tashqari)\n- 💡 **Qiziqarli fakt:** Qulog'i yo'q, titrashni sezadi. 600+ tur zaharli, 2400+ tur zararsiz`;
      if (/toshbaqa/.test(p)) return `🐢 **Toshbaqa**\n\n- ⏳ **Umri:** 80-150 yil (ba'zilari 250 yil!)\n- 🌍 **Yashash joyi:** Butun dunyo\n- 💡 **Qiziqarli fakt:** Harriet ismli toshbaqa 175 yil yashagan (1830-2006)`;
      if (/panda/.test(p)) return `🐼 **Panda**\n\n- ⏳ **Umri:** 15-20 yil\n- 🌍 **Yashash joyi:** Xitoy (Sichuan tog'lari)\n- 🎋 **Ovqati:** Kuniga 12-38 kg bambuk yeydi\n- 💡 **Qiziqarli fakt:** Dunyo bo'yicha faqat 1,800 ta qolgan — yo'qolib ketish xavfi bor`;
      if (/akula/.test(p)) return `🦈 **Akula**\n\n- ⏳ **Umri:** 20-30 yil (ba'zilari 70 yil)\n- 🌍 **Yashash joyi:** Barcha okeanlar\n- 🏊 **Tezligi:** 70 km/soat\n- 💡 **Qiziqarli fakt:** Akula 400 million yildan beri yashaydi — dinozavrlardan ham eski`;
      if (/kit/.test(p)) return `🐋 **Kit**\n\n- ⏳ **Umri:** 80-90 yil (ba'zilari 200 yil)\n- 📏 **Uzunligi:** 30 metr\n- ⚖️ **Vazni:** 150 tonna (Ko'k kit — eng og'ir hayvon)\n- 💡 **Qiziqarli fakt:** Ko'k kitning yurak urishi minutiga 2 marta, ovozi 188 desibel`;
      if (/delfin/.test(p)) return `🐬 **Delfin**\n\n- ⏳ **Umri:** 20-30 yil\n- 🌍 **Yashash joyi:** Barcha okeanlar va ba'zi daryolar\n- 🧠 **Aqli:** Insondan keyin eng aqlli hayvon\n- 🏊 **Tezligi:** 60 km/soat\n- 💡 **Qiziqarli fakt:** Har bir delfin o'z nomi bor — boshqa delfinlar uni ism bilan chaqiradi`;
      if (/burgut|lochin/.test(p)) return `🦅 **Burgut**\n\n- ⏳ **Umri:** 20-30 yil\n- 👁️ **Ko'rishi:** 3-4 km uzoqlikdan o'ljani ko'radi\n- 🏃 **Tezligi:** Sho'ng'iganda 240 km/soat\n- 💡 **Qiziqarli fakt:** Ko'zini yummay uxlaydi`;
      if (/to'ti/.test(p)) return `🦜 **To'ti**\n\n- ⏳ **Umri:** 60-80 yil (ba'zi turlari)\n- 🗣️ **Gapirishsi:** 50-100 so'z eslab qoladi\n- 🧠 **Aqli:** 5 yoshli bolaga teng`;
      if (/pingvin/.test(p)) return `🐧 **Pingvin**\n\n- ⏳ **Umri:** 15-20 yil\n- 🌍 **Yashash joyi:** Antarktida, Janubiy Amerika\n- 🏊 **Suzishi:** 36 km/soat\n- 💡 **Qiziqarli fakt:** Tuxumni ota pingvin 65 kun oyoqlari ustida saqlaydi`;
      if (/asalari/.test(p)) return `🐝 **Asalari**\n\n- ⏳ **Umri:** Ishchi ari 6 hafta, malika 5 yil\n- 🍯 **Asal:** 1 kg asal uchun 4 mln gul tashrif\n- 💡 **Qiziqarli fakt:** Asalari yo'qolsa, insoniyat 4 yilda yo'q bo'ladi (Einstein)`;
      if (/kapalak/.test(p)) return `🦋 **Kapalak**\n\n- ⏳ **Umri:** 2 hafta - 1 yil\n- 💡 **Qiziqarli fakt:** Monarch kapalak 4,000 km migratsiya qiladi`;
      if (/quyon/.test(p)) return `🐇 **Quyon**\n\n- ⏳ **Umri:** 8-12 yil\n- 🏃 **Tezligi:** 70 km/soat\n- 💡 **Qiziqarli fakt:** Tishlarini to'xtovsiz kemirishi kerak — tishlar o'sib boradi`;
      if (/maymun|gorilla|shimpanze/.test(p)) return `🦍 **Maymunlar**\n\n- 🦍 **Gorilla:** Eng kuchli primat, 200 kg, DNK 98.3% insonnikidek\n- 🐒 **Shimpanze:** Eng aqlli, asbob ishlatadi, DNK 98.7% insonnikidek\n- 🦧 **Orangutan:** "O'rmon odami" — daraxtda yashaydi, 30 yil`;
      if (/bars|leopard|gepard/.test(p)) return `🐆 **Yo'lbars / Bars / Gepard**\n\n- 🐅 **Yo'lbars:** 100-300 kg, 60 km/soat, eng katta mushuksimon\n- 🐆 **Leopard:** 30-90 kg, daraxtga chiqadi\n- 🐈 **Gepard:** 112 km/soat — quruqlikdagi eng tez hayvon!\n- ❄️ **Qor bari:** O'zbekiston tog'larida yashovchi noyob hayvon`;
      return `🌍 **Dunyodagi Hayvonlar Olami**\n\n**🦁 Yirtqichlar:** Sher, Yo'lbars, Gepard, Leopard, Bo'ri, Tulki, Ayiq\n**🐘 Katta sutemizuvchilar:** Fil, Karkidon, Begemot, Jiraffa, Zebra, Kenguru\n**🐟 Dengiz hayvonlari:** Kit, Delfin, Akula, Ahtapot\n**🐦 Qushlar:** Burgut, To'ti, Pingvin, Tovus, Boyqush\n**🐍 Sudralib yuruvchilar:** Timsoh, Ilon, Toshbaqa\n**🐝 Hasharotlar:** Asalari, Kapalak\n\n💬 *Istalgan hayvon nomini yozing — to'liq ma'lumot beraman!*`;
    }
    return null;
  }

  // Coding Help
  function checkCodingHelp(promptText) {
    const p = promptText.toLowerCase().trim();
    if (!/kod|code|python|java|javascript|html|css|intellij|idea|dastur|funksiya|loop|for|while|class|function|variable|o'zgaruvchi|array|list|print|console|error|bug|debug|syntax/.test(p)) return null;
    if (/python/.test(p)) {
      if (/print/.test(p)) return `🐍 **Python — print() funksiyasi:**\n\n\`\`\`python\n# Oddiy chiqarish\nprint("Salom Dunyo!")\n\n# O'zgaruvchi chiqarish\nism = "Jarvis"\nprint(f"Salom, {ism}!")\n\n# Ko'p qiymat\nprint("1 + 2 =", 1 + 2)\n\`\`\`\n\n💡 **IntelliJ IDEA'da:** File → New Project → Python → main.py yarating`;
      if (/loop|for|while/.test(p)) return `🐍 **Python — Loop (Tsikl):**\n\n\`\`\`python\n# For loop\nfor i in range(5):\n    print(f"Raqam: {i}")\n\n# While loop\nn = 0\nwhile n < 5:\n    print(f"n = {n}")\n    n += 1\n\n# Ro'yxat ustida\nmevallar = ["olma", "nok", "banan"]\nfor meva in mevallar:\n    print(meva)\n\`\`\``;
      if (/class/.test(p)) return `🐍 **Python — Class (Sinf):**\n\n\`\`\`python\nclass Mashina:\n    def __init__(self, nomi, yili):\n        self.nomi = nomi\n        self.yili = yili\n\n    def info(self):\n        print(f"{self.nomi} - {self.yili} yil")\n\nm = Mashina("Toyota", 2023)\nm.info()  # Toyota - 2023 yil\n\`\`\``;
      if (/list|array|ro'yxat/.test(p)) return `🐍 **Python — List (Ro'yxat):**\n\n\`\`\`python\nnumbers = [1, 2, 3, 4, 5]\nnumbers.append(6)\nnumbers.remove(3)\nprint(len(numbers))  # 5\nnumbers.sort()\nprint(numbers)  # [1, 2, 4, 5, 6]\n\`\`\``;
      if (/funksiya|function|def/.test(p)) return `🐍 **Python — Funksiya (def):**\n\n\`\`\`python\ndef salomlash(ism):\n    return f"Salom, {ism}!"\n\nprint(salomlash("Ali"))  # Salom, Ali!\n\ndef yig'indi(a, b):\n    return a + b\n\nprint(yig'indi(5, 3))  # 8\n\`\`\``;
      return `🐍 **Python — IntelliJ IDEA:**\n\n\`\`\`python\nism = "JARVIS"\nyosh = 25\n\nif yosh >= 18:\n    print("Voyaga yetgan")\nelse:\n    print("Voyaga yetmagan")\n\ndef salom(name):\n    print(f"Salom, {name}!")\n\nsalom("Ali")\n\`\`\`\n\n💬 So'rash mumkin: *"Python for loop"*, *"Python class"*, *"Python list"*`;
    }
    if (/java/.test(p) && !/javascript/.test(p)) {
      if (/print/.test(p)) return `☕ **Java — System.out.println():**\n\n\`\`\`java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Salom Dunyo!");\n        String ism = "Jarvis";\n        System.out.println("Salom, " + ism + "!");\n    }\n}\n\`\`\``;
      if (/loop|for|while/.test(p)) return `☕ **Java — Loop (Tsikl):**\n\n\`\`\`java\nfor (int i = 0; i < 5; i++) {\n    System.out.println("i = " + i);\n}\n\nint n = 0;\nwhile (n < 5) {\n    System.out.println("n = " + n);\n    n++;\n}\n\`\`\``;
      if (/class/.test(p)) return `☕ **Java — Class:**\n\n\`\`\`java\npublic class Mashina {\n    String nomi;\n    int yili;\n    public Mashina(String nomi, int yili) {\n        this.nomi = nomi;\n        this.yili = yili;\n    }\n    public void info() {\n        System.out.println(nomi + " - " + yili);\n    }\n    public static void main(String[] args) {\n        Mashina m = new Mashina("Toyota", 2023);\n        m.info();\n    }\n}\n\`\`\``;
      return `☕ **Java — IntelliJ IDEA:**\n\n\`\`\`java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Salom Dunyo!");\n    }\n}\n\`\`\`\n\n💬 So'rash mumkin: *"Java for loop"*, *"Java class"*, *"Java print"*`;
    }
    if (/javascript|js/.test(p)) {
      if (/funksiya|function/.test(p)) return `🌐 **JavaScript — Funksiya:**\n\n\`\`\`javascript\nfunction salomlash(ism) {\n    return "Salom, " + ism + "!";\n}\nconsole.log(salomlash("Ali"));\n\nconst yig'indi = (a, b) => a + b;\nconsole.log(yig'indi(5, 3));  // 8\n\`\`\``;
      return `🌐 **JavaScript:**\n\n\`\`\`javascript\nlet ism = "JARVIS";\nconst yosh = 25;\n\nfunction salom(name) {\n    console.log(\`Salom, \${name}!\`);\n}\n\nconst mevallar = ["olma", "nok", "banan"];\nmevallar.forEach(m => console.log(m));\n\`\`\``;
    }
    if (/html/.test(p)) return `🌐 **HTML — Asosiy Tuzilma:**\n\n\`\`\`html\n<!DOCTYPE html>\n<html lang="uz">\n<head>\n    <meta charset="UTF-8">\n    <title>Mening Sahifam</title>\n</head>\n<body>\n    <h1>Salom Dunyo!</h1>\n    <p>Bu mening birinchi HTML sahifam.</p>\n    <button onclick="salom()">Bosing</button>\n    <script>\n        function salom() { alert("Salom!"); }\n    </script>\n</body>\n</html>\n\`\`\``;
    if (/css/.test(p)) return `🎨 **CSS — Asosiy Stillar:**\n\n\`\`\`css\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    margin: 0; padding: 20px;\n}\nh1 { color: #333; text-align: center; }\n.btn {\n    background: #007bff;\n    color: white;\n    padding: 10px 20px;\n    border: none; border-radius: 5px; cursor: pointer;\n}\n.btn:hover { background: #0056b3; }\n\`\`\``;
    if (/intellij|idea/.test(p)) return `💡 **IntelliJ IDEA — Asosiy Yo'riqnoma:**\n\n**🚀 Yangi loyiha:** File → New Project → Til tanlang\n\n**⌨️ Muhim tugmalar:**\n- \`Ctrl + Alt + L\` — Kodni formatlash\n- \`Ctrl + /\` — Izoh qo'shish\n- \`Shift + F10\` — Dasturni ishga tushirish ▶️\n- \`Ctrl + Z\` — Bekor qilish\n- \`Alt + Enter\` — Xatoni tuzatish\n- \`Ctrl + Space\` — Avtoto'ldirish\n\n💬 Qaysi tilda kod yozmoqchisiz? *Python, Java, JavaScript, HTML, CSS*`;
    return null;
  }

  // Conversation check
  function checkConversation(promptText) {
    const p = promptText.toLowerCase().trim();
    if (/yaxshi|zo'r|ajoyib|a'lo|hammasi yaxshi|kayfiyat|quvnoq|baxtli|xursand/.test(p) && !/futbol|sport|klub/.test(p)) {
      if (/qalaysiz|qalaysan|qandaysiz|yaxshimisiz/.test(p)) return `😊 **Men juda yaxshiman, rahmat!**\n\nHar doim siz bilan suhbatlashishdan xursandman! Sizchi, qandaysiz? Bugun nima qilmoqchi edingiz?\n\n💬 Istalgan narsani so'rashingiz mumkin — sport, bilim, tarjima, kod va boshqalar!`;
      if (/xursand|baxtli|quvnoq/.test(p)) return `😄 **Juda yaxshi!** Siz xursand bo'lganingizdan men ham quvondim!\n\nBugun nima yaxshi voqea bo'ldi? 🎉`;
    }
    if (/yomon|xafa|g'amgin|qayg'u|stress|charchad|charchagan|tushkunlik/.test(p)) return `🤗 **Tushunaman, har kimda bunday kunlar bo'ladi.**\n\nLekin unutmang — bu ham o'tib ketadi! Siz kuchli odamsiz.\n\n💪 Biroz dam oling, chuqur nafas oling. Men har doim shu yerdaman! 😊`;
    if (/zerikdim|zerikarli|boring|nima qilay|vaqt o'tkaz/.test(p)) return `😄 **Zerikibsiz? Yordamlashaman!**\n\n- 🏀 *"Basketbol haqida ma'lumot ber"*\n- 🧠 *"Mantiqiy topshiriq ber"*\n- 🌍 *"Qiziq faktlar"*\n- ⚽ *"Real Madrid haqida"*\n- 💻 *"Python kod yozishni o'rgat"*`;
    if (/rahmat|tashakkur|sog' bo'ling|xayr|ko'rishguncha|alvido/.test(p)) {
      if (/xayr|alvido|ko'rishguncha|sog' bo'ling/.test(p)) return `👋 **Xayr! Ko'rishguncha!**\n\nIstalgan vaqt qaytib keling — men doim shu yerdaman! 😊\nSizga omad va yaxshi kun tilayman! ☀️`;
      return `😊 **Iltimos, muammo emas!**\n\nYordam bera olganimdan xursandman. Yana savollaringiz bo'lsa, bemalol so'rang! 🤝`;
    }
    return null;
  }

  // Logical Puzzles
  function checkLogicalPuzzle(promptText) {
    const p = promptText.toLowerCase().trim();
    if (!/mantiq|topishmoq|jumboq|puzzle|qiziq savol|qiyin savol|o'yla|fikrla|test/.test(p)) return null;
    const puzzles = [
      `🧠 **Mantiqiy Masala #1:**\n\n> Qancha ko'p olib chiqsang, u shuncha katta bo'ladi. Bu nima?\n\n💡 **Javob: Chuqurlik (Teshik)** — Qancha ko'p yerini olib chiqsang, chuqur shuncha katta bo'ladi!`,
      `🧠 **Mantiqiy Masala #2:**\n\n> Men har doim oldingda boraman, lekin ko'ra olmaysan. Bu nima?\n\n💡 **Javob: Kelajak** — Kelajak doim oldingda, lekin hali ko'rinmaydi!`,
      `🧠 **Mantiqiy Masala #3:**\n\n> 2 ota va 2 o'g'il ovga ketishdi. Har biri bittadan quyonni tutdi. Lekin uyga 3 ta quyon olib kelindi. Qanday qilib?\n\n💡 **Javob:** Ular 3 kishi edi: **Bobo, Ota va O'g'il** — Bobo ham ota, ota ham o'g'il!`,
      `🧠 **Mantiqiy Masala #4:**\n\n> Qaysi so'zni noto'g'ri yozsang ham to'g'ri bo'ladi?\n\n💡 **Javob: "Noto'g'ri"** 😄`,
    ];
    const random = puzzles[Math.floor(Math.random() * puzzles.length)];
    return random + `\n\n🎯 *Yana mantiqiy masala uchun: "mantiqiy masala ber" deb yozing!*`;
  }

  // Wikipedia API
  async function fetchWikipediaSummary(promptText) {
    try {
      const p = promptText.toLowerCase().trim();
      if (/^(sen|siz|men|biz|u|o'zing|ozing|salom|hi|hello)$/.test(p)) return null;
      let cleanQuery = promptText.toLowerCase()
        .replace(/(haqida|ma'lumot|malumat|ber|aytib|kim|qaysi|haqda|nima|qanday|qancha|yil|yashaydi|qulub)/gi, '')
        .replace(/qulub/g, 'klub').trim();
      if (!cleanQuery || cleanQuery.length < 2) cleanQuery = promptText.trim();
      if (cleanQuery === 'mbappe' || cleanQuery === 'mbappé') cleanQuery = 'Kylian Mbappé';

      const searchUrl = `https://uz.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&origin=*`;
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 10000);
      const searchRes = await fetch(searchUrl, { signal: ctrl.signal });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData?.query?.search?.length > 0) {
          const topTitle = searchData.query.search[0].title;
          if (topTitle.toLowerCase().includes("o'zing") && /sen|o'zing|ozing/i.test(promptText)) return null;
          const summaryUrl = `https://uz.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
          const ctrl2 = new AbortController();
          setTimeout(() => ctrl2.abort(), 10000);
          const summaryRes = await fetch(summaryUrl, { signal: ctrl2.signal });
          if (summaryRes.ok) {
            const sumData = await summaryRes.json();
            if (sumData?.extract && sumData.extract.length > 20) {
              let icon = '🌐';
              if (/klub|futbol|sport|arsenal|real|barca/i.test(promptText)) icon = '⚽';
              else if (/hayvon|qo'y|fil|sher|ot|mushuk|it|qush/i.test(promptText)) icon = '🐾';
              else if (/boks|ufc|mma|jalolov/i.test(promptText)) icon = '🥊';
              let resText = `**${icon} ${sumData.title}**\n\n`;
              if (sumData.description) resText += `*📌 ${sumData.description}*\n\n`;
              let extract = sumData.extract;
              if (/david raya|raya/i.test(promptText)) {
                extract = extract.replace(/Brentford/g, "Arsenal (2023-yildan buyon, ijaradan so'ng to'liq transfer)");
                resText += `${extract}\n\n🏆 **Hozirgi Klub:** **Arsenal F.C.** (London)\n🥅 **Yutug'i:** Angliya Premier Ligasida "Oltin Qo'lqop" (Golden Glove) sohibi (2023/24) va Euro 2024 Chempioni!`;
                return resText;
              }
              return resText + extract;
            }
          }
        }
      }

      const enSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&origin=*`;
      const ctrl3 = new AbortController();
      setTimeout(() => ctrl3.abort(), 10000);
      const enRes = await fetch(enSearchUrl, { signal: ctrl3.signal });
      if (enRes.ok) {
        const enData = await enRes.json();
        if (enData?.query?.search?.length > 0) {
          const topTitle = enData.query.search[0].title;
          const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
          const ctrl4 = new AbortController();
          setTimeout(() => ctrl4.abort(), 10000);
          const sumRes = await fetch(summaryUrl, { signal: ctrl4.signal });
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
    } catch (e) { console.warn('Wikipedia API error:', e); }
    return null;
  }

  // Pollinations AI
  async function fetchAIResponse(userPrompt) {
    const wikiResult = await fetchWikipediaSummary(userPrompt);
    if (wikiResult) return wikiResult;
    try {
      const systemPrompt = `Siz JARVIS AI — dunyodagi barcha bilimlarga ega bo'lgan universal intellektual yordamchisiz. Barcha sport turlari, barcha kulublar (Arsenal, Real Madrid, Barca va barcha jamoalar), barcha sportchilar (Mbappe, Messi, Ronaldo, Jalolov), barcha hayvonlar (qo'y, fil, sher va barcha turlar) hamda har qanday savolga o'zbek tilida aniq va chiroyli javob bering.`;
      const url = `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(systemPrompt)}&seed=42`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 5 && !text.includes('402')) return text.trim();
      }
    } catch (e) {}
    return null;
  }

  // Smart Offline fallback
  function getSmartOfflineResponse(promptText) {
    const p = promptText.toLowerCase().trim();
    const nums = promptText.match(/\d+/g);
    if (nums && nums.length >= 2) {
      let itemMatch = promptText.match(/\b(olma|nok|behi|daftar|qalam|kitob|tuxum|mashina|bola|odam|qovoq|limon|uzum|pul|so'm)\b/i);
      let item = itemMatch ? itemMatch[0] : 'ta';
      let total = parseInt(nums[0], 10);
      if (nums.length === 2) {
        const n2 = parseInt(nums[1], 10);
        if (/yedi|yeb|ayir|sotdi|ishlat|yo.qol|ketdi|qoldi/.test(p)) return `🧮 **Masala yechimi:**\n\n${total} - ${n2} = **${total - n2}**\n\nJavob: Sizda **${total - n2} ${item}** qoldi.`;
        if (/qo.sh|qosh|oldim|berdi|jami|bo.ldi|boldi/.test(p)) return `🧮 **Masala yechimi:**\n\n${total} + ${n2} = **${total + n2}**\n\nJavob: Jami **${total + n2} ${item}** bo'ldi.`;
      }
      if (nums.length === 3) {
        const n2 = parseInt(nums[1], 10); const n3 = parseInt(nums[2], 10);
        const res = total + n2 - n3;
        return `🧮 **Masala yechimi:**\n\n${nums[0]} + ${n2} - ${n3} = **${res}**\n\nJavob: Sizda **${res} ${item}** qoldi.`;
      }
    }
    if (/salom|hello|hi |привет|qalaysiz|jarvis|kim/.test(p)) return `🤖 **Salom! Men JARVIS AI!**\n\nMen barcha narsalarni bilaman:\n- ⚽ **Sport & Klublar:** Arsenal, Real Madrid, Mbappé, Messi...\n- 🐾 **Hayvonlar:** Qo'y, fil, sher, ot va barcha turlar...\n- 🥊 **Boks & UFC:** Bakhodir Jalolov, Tyson, Khabib...\n- 🔤 **Tarjima:** Hamma tillar va uzun gaplar...`;
    return `🤖 **JARVIS AI Javobi:**\n\nSiz kiritgan **"${promptText}"** bo'yicha ma'lumot tahlil qilindi.\n\n📌 **Sinab ko'ring:**\n- ⚽ *"Arsenal qaysi klub"* yoki *"Mbappe kim"*\n- 🎾 *"Tenis haqida ma'lumot ber"*\n- 🐾 *"Qo'y qancha yil yashaydi"*`;
  }

  // Lang system prompts
  function getLangSystemPrompt() {
    if (currentLanguage === 'ru-RU') return 'Ты — умный голосовой помощник JARVIS AI. Отвечай ТОЛЬКО на русском языке. На любой вопрос давай подробный, полезный и дружелюбный ответ на русском. Никогда не отвечай на других языках.';
    if (currentLanguage === 'en-US') return 'You are JARVIS AI, a smart voice assistant. Answer ONLY in English. Give detailed, helpful and friendly answers in English to any question. Never answer in other languages.';
    return "Sen JARVIS AI — aqlli ovozli yordamchisan. Faqat O'ZBEK TILIDA javob ber. Har qanday savolga o'zbek tilida batafsil va do'stona javob ber.";
  }

  async function askPollinationsInLang(userPrompt) {
    const sysPrompt = getLangSystemPrompt();
    const endpoints = [
      `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(sysPrompt)}&seed=42&model=openai`,
      `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(sysPrompt)}&seed=42`
    ];
    for (const url of endpoints) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 15000);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);
        if (res.ok) {
          const text = (await res.text()).trim();
          if (text && text.length > 5 && !text.includes('402') && !/^error/i.test(text)) return text;
        }
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
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 7000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 5 && !text.includes('402')) return text.trim();
      }
    } catch (e) {}
    return null;
  }

  function getOfflineLangResponse(prompt) {
    const p = prompt.toLowerCase().trim();
    const isRu = currentLanguage === 'ru-RU';
    if (isRu) {
      if (/привет|здравствуй|салам/.test(p)) return `👋 **Привет! Я JARVIS AI!**\n\nЯ умею:\n- ⚽ Спорт и клубы\n- 🐾 Животные\n- 🔤 Переводы\n- 🧮 Математика\n- 💻 Программирование`;
      if (/кто ты|jarvis|джарвис/.test(p)) return `🤖 **Я JARVIS AI** — универсальный голосовой помощник!`;
      if (/спасибо|благодарю/.test(p)) return `😊 **Пожалуйста!** Рад помочь!`;
      if (/пока|до свидания/.test(p)) return `👋 **До свидания!** Возвращайтесь! ☀️`;
      return `🤖 **JARVIS AI:** Задайте любой вопрос — о спорте, животных, переводе или математике!`;
    }
    if (/hello|hi|hey/.test(p)) return `👋 **Hello! I'm JARVIS AI!**\n\nAsk me anything about sports, animals, translation, math, or coding!`;
    if (/who are you|jarvis/.test(p)) return `🤖 **I'm JARVIS AI** — your universal voice assistant!`;
    if (/thank|thanks/.test(p)) return `😊 **You're welcome!** Happy to help!`;
    if (/bye|goodbye/.test(p)) return `👋 **Goodbye!** Come back anytime! ☀️`;
    return `🤖 **JARVIS AI:** Ask me anything — sports, animals, translation or math!`;
  }

  // Main AI Controller
  async function generateUniversalAIResponse(prompt) {
    const isUz = currentLanguage === 'uz-UZ';

    const mathR = trySolveMath(prompt);
    if (mathR) return mathR;

    const codeR = checkCodingHelp(prompt);
    if (codeR) return codeR;

    if (isUz) {
      const transR = await checkTranslationQuery(prompt); if (transR) return transR;
      const logicR = checkLogicalPuzzle(prompt); if (logicR) return logicR;
      const convR  = checkConversation(prompt);  if (convR)  return convR;
      const idR    = checkIdentityOrGreeting(prompt); if (idR) return idR;
      const builtR = checkBuiltInSportsAndEntities(prompt); if (builtR) return builtR;
      setAIState('processing');
      const live = await fetchAIResponseWithLang(prompt);
      if (live && live.length > 5) return live;
      return getSmartOfflineResponse(prompt);
    }

    setAIState('processing');
    const answer = await askPollinationsInLang(prompt);
    if (answer && answer.length > 5) return answer;
    return getOfflineLangResponse(prompt);
  }

  // Chat History
  function getChatHistory() {
    try { return JSON.parse(localStorage.getItem('jarvis_chats') || '[]'); } catch { return []; }
  }
  function saveChatHistory(chats) {
    try { localStorage.setItem('jarvis_chats', JSON.stringify(chats)); } catch {}
  }
  function saveCurrentChat() {
    if (!currentChatId) return;
    const chats = getChatHistory();
    const idx = chats.findIndex(c => c.id === currentChatId);
    const firstUserMsg = currentChatMessages.find(m => m.sender === 'user');
    const title = firstUserMsg ? firstUserMsg.text.substring(0, 40) + (firstUserMsg.text.length > 40 ? '...' : '') : 'Yangi chat';
    const chatObj = { id: currentChatId, title, date: new Date().toLocaleDateString('uz-UZ'), messages: currentChatMessages };
    if (idx >= 0) chats[idx] = chatObj; else chats.unshift(chatObj);
    saveChatHistory(chats);
    renderHistoryList();
  }
  function startNewChat() {
    if (currentChatMessages.length > 0) saveCurrentChat();
    currentChatId = 'chat_' + Date.now();
    currentChatMessages = [];
    if (chatContainer) chatContainer.innerHTML = `
      <div class="chat-message assistant-message">
        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="message-content">
          <div class="message-header"><span class="author-name">JARVIS AI</span><span class="time-stamp">Hozir</span></div>
          <div class="message-text"><p>Yangi chat boshlandi! 🚀 Savolingizni yozing yoki mikrofonga gapiring.</p></div>
        </div>
      </div>`;
    renderHistoryList();
  }
  function loadChat(chatId) {
    saveCurrentChat();
    const chats = getChatHistory();
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    currentChatId = chatId;
    currentChatMessages = chat.messages || [];
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
      currentChatId = chats[0].id;
      currentChatMessages = chats[0].messages || [];
      if (chatContainer) { chatContainer.innerHTML = ''; currentChatMessages.forEach(msg => appendChatMessageDOM(msg.sender, msg.text, msg.time)); }
    } else {
      currentChatId = 'chat_' + Date.now();
      currentChatMessages = [];
    }
    renderHistoryList();
    window.addEventListener('beforeunload', () => { if (currentChatMessages.length > 0) saveCurrentChat(); });
  }

  // Chat UI
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
    if (!timeStr) {
      const now = new Date();
      timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
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
        if (t && !t.startsWith('<div') && !t.startsWith('</div') && !t.startsWith('<pre') && !t.startsWith('</pre'))
          body += `<p>${t}</p>`;
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
    currentChatMessages = [];
    saveCurrentChat();
    if (chatContainer) chatContainer.innerHTML = `
      <div class="chat-message assistant-message">
        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="message-content">
          <div class="message-header"><span class="author-name">JARVIS AI</span><span class="time-stamp">Hozir</span></div>
          <div class="message-text"><p>Chat tozalandi! Istalgan savolingizni yuboring. 🚀</p></div>
        </div>
      </div>`;
  });
  if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);
  if (langUzBtn) langUzBtn.addEventListener('click', () => {
    currentLanguage = 'uz-UZ'; langUzBtn.classList.add('active');
    langEnBtn?.classList.remove('active'); langRuBtn?.classList.remove('active');
    if (recognition) recognition.lang = 'uz-UZ';
  });
  if (langEnBtn) langEnBtn.addEventListener('click', () => {
    currentLanguage = 'en-US'; langEnBtn.classList.add('active');
    langUzBtn?.classList.remove('active'); langRuBtn?.classList.remove('active');
    if (recognition) recognition.lang = 'en-US';
  });
  if (langRuBtn) langRuBtn.addEventListener('click', () => {
    currentLanguage = 'ru-RU'; langRuBtn.classList.add('active');
    langUzBtn?.classList.remove('active'); langEnBtn?.classList.remove('active');
    if (recognition) recognition.lang = 'ru-RU';
  });

  // Initialize
  initChat();

  // ============================================================
  // TAVSIYALAR QO'SHIMCHASI
  // ============================================================

  // 1. DARK/LIGHT TEMA TOGGLE
  function loadTheme() {
    const saved = localStorage.getItem('jarvis_theme') || 'dark';
    currentTheme = saved;
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon();
  }
  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('jarvis_theme', currentTheme);
    updateThemeIcon();
  }
  function updateThemeIcon() {
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = currentTheme === 'dark'
        ? '<i class="fa-solid fa-moon"></i>'
        : '<i class="fa-solid fa-sun"></i>';
    }
  }
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
  loadTheme();

  // 2. TYPING INDICATOR
  function showTypingIndicator() {
    removeTypingIndicator();
    const div = document.createElement('div');
    div.className = 'chat-message assistant-message';
    div.id = 'typingIndicatorMsg';
    div.innerHTML = `
      <div class="avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="message-content">
        <div class="message-header"><span class="author-name">JARVIS AI</span></div>
        <div class="typing-indicator">
          <div class="typing-dots"><span></span><span></span><span></span></div>
          <span class="typing-label">yozmoqda...</span>
        </div>
      </div>`;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    typingIndicatorEl = div;
  }
  function removeTypingIndicator() {
    const existing = document.getElementById('typingIndicatorMsg');
    if (existing) existing.remove();
    typingIndicatorEl = null;
  }

  // 3. CHAT TARIXI 50 GA LIMIT
  const _origSaveChatHistory = saveChatHistory;
  function saveChatHistory(chats) {
    try {
      if (chats.length > 50) chats.splice(50);
      localStorage.setItem('jarvis_chats', JSON.stringify(chats));
    } catch {}
  }

  // 4. TYPING INDICATOR + REGENERATE ni handleUserPrompt ga ulash
  // Mavjud handleUserPrompt ni kengaytirish
  const _origHandleUserPrompt = handleUserPrompt;
  async function handleUserPrompt(promptText, isRegenerate) {
    if (!promptText || !promptText.trim()) return;
    const text = promptText.trim();
    if (!isRegenerate) {
      appendChatMessage('user', text);
      if (userInput) userInput.value = '';
    }
    setAIState('processing');
    showTypingIndicator();
    setTimeout(async () => {
      const response = await generateUniversalAIResponse(text);
      removeTypingIndicator();
      appendChatMessageWithRegenerate('assistant', response, text);
      speakResponse(response);
    }, 150);
  }

  // 5. REGENERATE tugmali xabar qo'shish
  function appendChatMessageWithRegenerate(sender, text, originalPrompt) {
    if (!chatContainer) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentChatMessages.push({ sender, text, time: timeStr });
    saveCurrentChat();

    const div = document.createElement('div');
    div.className = `chat-message ${sender}-message`;
    const icon = sender === 'assistant' ? 'fa-robot' : 'fa-user';
    const name = sender === 'assistant' ? 'JARVIS AI' : 'Siz';

    div.innerHTML = `
      <div class="avatar"><i class="fa-solid ${icon}"></i></div>
      <div class="message-content">
        <div class="message-header"><span class="author-name">${name}</span><span class="time-stamp">${timeStr}</span></div>
        <div class="message-text">${formatMarkdown(text)}</div>
        ${sender === 'assistant' && originalPrompt ? `<button class="regenerate-btn" data-prompt="${escapeHTML(originalPrompt)}"><i class="fa-solid fa-rotate-right"></i> Qayta javob</button>` : ''}
      </div>`;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Copy code
    div.querySelectorAll('.copy-code-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const codeEl = btn.closest('.code-block-container')?.querySelector('code');
        if (codeEl) {
          navigator.clipboard.writeText(codeEl.textContent);
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Nusxalandi!';
          setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i> Nusxa olish'; }, 2000);
        }
      });
    });

    // Regenerate
    div.querySelectorAll('.regenerate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        if (prompt) {
          const lastIdx = currentChatMessages.length - 1;
          if (currentChatMessages[lastIdx]?.sender === 'assistant') {
            currentChatMessages.splice(lastIdx, 1);
            saveCurrentChat();
            div.remove();
          }
          handleUserPrompt(prompt, true);
        }
      });
    });
  }

  // 6. marked.js ishlatish (mavjud formatMarkdown o'rniga)
  const _origFormatMarkdown = formatMarkdown;
  function formatMarkdown(text) {
    if (!text) return '';
    if (typeof marked !== 'undefined') {
      try {
        marked.setOptions({ breaks: true, gfm: true });
        return marked.parse(text);
      } catch (e) {}
    }
    return _origFormatMarkdown(text);
  }

  // 7. math.js bilan xavfsiz hisoblash (mavjud trySolveMath ni override)
  const _origTrySolveMath = trySolveMath;
  function trySolveMath(promptText) {
    if (typeof math !== 'undefined') {
      try {
        let cleanExpr = promptText.toLowerCase()
          .replace(/(qancha|necha|hisobla|javobi|yechib|ber|nimaga|teng|hisoblab|\?|!|=)/g, '')
          .replace(/\bx\b/g, '*').replace(/bo'luv|boluv/g, '/')
          .replace(/ko'paytir\w*/g, '*').replace(/plus|qo'shil\w*/g, '+')
          .replace(/minus|ayril\w*/g, '-').replace(/\^/g, '**').trim();
        if (/[0-9]/.test(cleanExpr) && /[+\-*/^().]/.test(cleanExpr)) {
          const result = math.evaluate(cleanExpr);
          if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            return `**🧮 Matematik Yechim:**\n\n\`\`\`\nIfoda: ${cleanExpr}\nNatija: ${result}\n\`\`\`\n\n**Javob: ${result}**`;
          }
        }
      } catch (e) {}
    }
    return _origTrySolveMath(promptText);
  }

});
