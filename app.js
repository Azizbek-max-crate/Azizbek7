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

  // Application State
  let currentLanguage = 'uz-UZ';
  let isListening = false;
  let ttsEnabled = true;
  let recognition = null;
  let activeState = 'idle';
  let currentChatId = null;
  let currentChatMessages = [];

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

    particles.forEach(p => {
      p.update(activeState);
      p.draw(ctx, activeState);
    });

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

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        stopListening();
      };

      recognition.onend = () => {
        const text = userInput ? userInput.value.trim() : '';
        stopListening();
        if (text) handleUserPrompt(text);
      };
    } catch (err) {
      console.error('Speech recognition init error:', err);
    }
  }
  initSpeechRecognition();

  function startListening() {
    if (!recognition) {
      alert("Brauzeringizda ovoz kiritish qo'llab-quvvatlanmaydi.");
      return;
    }
    try {
      recognition.lang = currentLanguage;
      if (userInput) userInput.value = '';
      recognition.start();
    } catch (e) {
      stopListening();
    }
  }

  function stopListening() {
    isListening = false;
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    if (micToggleBtn) micToggleBtn.classList.remove('listening');
    if (voiceActivityBar) voiceActivityBar.classList.add('hidden');
    setAIState('idle');
    if (micStatusLabel) micStatusLabel.textContent = "Mikrofonni bosing yoki yozing";
  }

  // Text-to-Speech (TTS) Voice Selector
  let cachedVoices = [];
  function populateVoices() {
    if (window.speechSynthesis) cachedVoices = window.speechSynthesis.getVoices();
  }
  populateVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }

  function getBestVoiceForLang() {
    if (!cachedVoices.length && window.speechSynthesis) {
      cachedVoices = window.speechSynthesis.getVoices();
    }
    if (currentLanguage === 'ru-RU') {
      return cachedVoices.find(v => v.lang.toLowerCase().startsWith('ru')) ||
             cachedVoices.find(v => v.lang.toLowerCase().includes('ru')) ||
             null;
    }
    if (currentLanguage === 'en-US') {
      return cachedVoices.find(v => v.lang.toLowerCase().startsWith('en-us')) ||
             cachedVoices.find(v => v.lang.toLowerCase().startsWith('en')) ||
             null;
    }
    // uz-UZ — o'zbek ovozi bo'lmasa ingliz ovozi (ruscha emas!)
    return cachedVoices.find(v => v.lang.toLowerCase().includes('uz')) ||
           cachedVoices.find(v => v.lang.toLowerCase().startsWith('en-us')) ||
           cachedVoices.find(v => v.lang.toLowerCase().startsWith('en')) ||
           null;
  }

  function speakResponse(text) {
    if (!ttsEnabled || !window.speechSynthesis) return;

    // UZ tanlangan bo'lsa ovoz o'chiriladi
    if (currentLanguage === 'uz-UZ') {
      setAIState('idle');
      return;
    }

    try {
      window.speechSynthesis.cancel();

      let cleanText = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/[*_#`~]/g, '')
        .replace(/&#\d+;/g, '')
        .replace(/&\w+;/g, '')
        .trim();

      if (!cleanText) return;
      if (cleanText.length > 300) cleanText = cleanText.substring(0, 300) + '...';

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Voices bo'sh bo'lsa qayta yuklash
      if (!cachedVoices.length) {
        cachedVoices = window.speechSynthesis.getVoices();
      }

      if (currentLanguage === 'ru-RU') {
        utterance.lang = 'ru-RU';
        const ruVoice = cachedVoices.find(v => v.lang.startsWith('ru'))
                     || cachedVoices.find(v => v.lang.toLowerCase().includes('ru'));
        if (ruVoice) utterance.voice = ruVoice;
      } else {
        utterance.lang = 'en-US';
        const enVoice = cachedVoices.find(v => v.lang.startsWith('en-US'))
                     || cachedVoices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }

      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setAIState('speaking');
      utterance.onend   = () => setAIState('idle');
      utterance.onerror = () => setAIState('idle');

      // Voices hali yuklanmagan bo'lsa — delay bilan urinish
      if (!cachedVoices.length) {
        window.speechSynthesis.onvoiceschanged = () => {
          cachedVoices = window.speechSynthesis.getVoices();
          window.speechSynthesis.speak(utterance);
        };
      } else {
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      setAIState('idle');
    }
  }

  function setAIState(state) {
    activeState = state;
    const centerIcon = document.getElementById('orbCenterIcon');
    if (!aiStatusBadge || !aiStatusText) return;

    if (state === 'listening') {
      aiStatusBadge.className = 'status-badge listening';
      aiStatusText.textContent = 'Eshitilmoqda...';
      if (centerIcon) {
        centerIcon.innerHTML = '<i class="fa-solid fa-waveform fa-bounce"></i>';
        centerIcon.style.borderColor = 'var(--accent-magenta)';
      }
    } else if (state === 'speaking') {
      aiStatusBadge.className = 'status-badge speaking';
      aiStatusText.textContent = 'Gapirilmoqda...';
      if (centerIcon) {
        centerIcon.innerHTML = '<i class="fa-solid fa-volume-high fa-beat"></i>';
        centerIcon.style.borderColor = 'var(--accent-blue)';
      }
    } else if (state === 'processing') {
      aiStatusBadge.className = 'status-badge';
      aiStatusText.textContent = 'Hisoblanmoqda...';
      if (centerIcon) {
        centerIcon.innerHTML = '<i class="fa-solid fa-brain fa-spin"></i>';
        centerIcon.style.borderColor = 'var(--accent-cyan)';
      }
    } else {
      aiStatusBadge.className = 'status-badge idle';
      aiStatusText.textContent = 'AI Tayyor';
      if (centerIcon) {
        centerIcon.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        centerIcon.style.borderColor = 'rgba(0, 242, 254, 0.4)';
      }
    }
  }

  // Math Solver Engine
  function trySolveMath(promptText) {
    try {
      let cleanExpr = promptText
        .toLowerCase()
        .replace(/(qancha|necha|hisobla|javobi|yechib|ber|nimaga|teng|hisoblab|\?|!|=)/g, '')
        .replace(/\bx\b/g, '*')
        .replace(/bo'luv|boluv/g, '/')
        .replace(/ko'paytir\w*/g, '*')
        .replace(/plus|qo'shil\w*/g, '+')
        .replace(/minus|ayril\w*/g, '-')
        .replace(/\^/g, '**')
        .trim();

      if (/^[0-9.\s+\-*/()** ]+$/.test(cleanExpr) && /[0-9]/.test(cleanExpr)) {
        const result = Function('"use strict"; return (' + cleanExpr + ')')();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return `**🧮 Matematik Yechim:**\n\n\`\`\`math\nIfoda: ${cleanExpr}\nNatija: ${result}\n\`\`\`\n\n**Javob:** **${result}**`;
        }
      }
    } catch (e) {}
    return null;
  }

  // Helper: Identity & Greeting check
  function checkIdentityOrGreeting(promptText) {
    const p = promptText.toLowerCase().trim();
    if (/sen kim|kim san|kim siz|o'zing|ozing|jarvis|qalaysiz|qalaysan|salom|assalom|kim bu/i.test(p) ||
        /o'zing haqida|ozing haqida|sen kimsan|kim kimsan|sen kimsiz/i.test(p)) {
      return `🤖 **Men JARVIS AI — Sizning Intellektual Ovozli Yordamchingizman!**\n\nMen dunyodagi barcha bilimlarga ega AI yordamchisiman:\n- ⚽ **Sport va Klublar:** Arsenal, Real Madrid, Barcelona, Man City va barcha jamoalar\n- 🥊 **Boks va UFC:** Bakhodir Jalolov, Mike Tyson, Khabib va barcha sportchilar\n- 🐾 **Hayvonlar:** Qo'y, fil, sher, ot va barcha hayvonlarning yashash yillari va xususiyatlari\n- 🔤 **Tarjima:** Inglizcha, o'zbekcha, ruscha va barcha tillardan UZUN GAPLARNI tarjima qilish\n- 🧮 **Matematika:** Har qanday misollar va masalalar\n\nIstalgan savolingizni bering!`;
    }
    return null;
  }

  // ==============================================================
  // UNIVERSAL TARJIMA TIZIMI — so'z VA uzun gap, barcha 4 yo'nalish
  // O'zbekcha ↔ Inglizcha,  O'zbekcha ↔ Ruscha  (Pollinations AI + zaxira lug'at)
  // ==============================================================

  function _transDirection(p) {
    if (/inglizchaga|ingliz\s*tiliga|ingilizchaga|inglizcha\s*tarjima/.test(p))
      return { from: "O'zbekcha", to: "Inglizcha", flag: "🇬🇧",
        ai: "You are a professional translator. Translate ONLY the following Uzbek text to English — output the translation only, nothing else:\n\n" };
    if (/o'zbekchaga|o'zbek\s*tiliga|ozbekchaga|o'zbekcha\s*tarjima/.test(p))
      return { from: "Inglizcha/Ruscha", to: "O'zbekcha", flag: "🇺🇿",
        ai: "You are a professional translator. Translate ONLY the following text to Uzbek — output the translation only, nothing else:\n\n" };
    if (/ruschaga|rus\s*tiliga|ruscha\s*tarjima/.test(p))
      return { from: "O'zbekcha", to: "Ruscha", flag: "🇷🇺",
        ai: "Ты профессиональный переводчик. Переведи ТОЛЬКО следующий текст на русский язык — выведи только перевод, ничего лишнего:\n\n" };
    if (/ruschadan/.test(p))
      return { from: "Ruscha", to: "O'zbekcha", flag: "🇺🇿",
        ai: "Ты профессиональный переводчик. Переведи ТОЛЬКО следующий русский текст на узбекский — выведи только перевод, ничего лишнего:\n\n" };
    if (/ruschada|nima\s*degani|nima\s*bo'ladi|nima\s*boladi/.test(p))
      return { from: "Ruscha", to: "O'zbekcha", flag: "🇺🇿",
        ai: "Ты профессиональный переводчик. Переведи ТОЛЬКО следующий русский текст на узбекский — выведи только перевод, ничего лишнего:\n\n" };
    return null;
  }

  function _transExtract(raw) {
    return raw
      .replace(/inglizchaga\s+tarjima(\s+qil)?/gi, '')
      .replace(/ingliz\s+tiliga\s+tarjima(\s+qil)?/gi, '')
      .replace(/inglizcha\s+tarjima(\s+qil)?/gi, '')
      .replace(/ingilizchaga\s+tarjima(\s+qil)?/gi, '')
      .replace(/o'zbekchaga\s+tarjima(\s+qil)?/gi, '')
      .replace(/o'zbek\s+tiliga\s+tarjima(\s+qil)?/gi, '')
      .replace(/o'zbekcha\s+tarjima(\s+qil)?/gi, '')
      .replace(/ozbekchaga\s+tarjima(\s+qil)?/gi, '')
      .replace(/ruschaga\s+tarjima(\s+qil)?/gi, '')
      .replace(/rus\s+tiliga\s+tarjima(\s+qil)?/gi, '')
      .replace(/ruscha\s+tarjima(\s+qil)?/gi, '')
      .replace(/ruschadan\s+o'zbekchaga/gi, '')
      .replace(/ruschadan\s+tarjima(\s+qil)?/gi, '')
      .replace(/ruschadan/gi, '')
      .replace(/ruschada/gi, '')
      .replace(/nima\s+degani/gi, '')
      .replace(/nima\s+bo'ladi/gi, '')
      .replace(/nima\s+boladi/gi, '')
      .replace(/^[\s:;\-—]+/, '')
      .replace(/[\s:;\-—]+$/, '')
      .trim();
  }

  const _offDict = {
    uz_en: { 'salom':'Hello','rahmat':'Thank you','xayr':'Goodbye','uy':'House','kitob':'Book','suv':'Water','non':'Bread','maktab':'School',"do'st":'Friend','pul':'Money','vaqt':'Time','ota':'Father','ona':'Mother','bola':'Child','olma':'Apple','mashina':'Car','shahar':'City','dunyo':'World','sevgi':'Love','hayot':'Life','odam':'Person','ish':'Work','kun':'Day','kecha':'Night','yaxshi':'Good','yomon':'Bad','katta':'Big','kichik':'Small','chiroyli':'Beautiful' },
    en_uz: { 'hello':'Salom','hi':'Salom','thanks':'Rahmat','thank you':'Rahmat','goodbye':'Xayr','house':'Uy','book':'Kitob','water':'Suv','bread':'Non','school':'Maktab','friend':"Do'st",'money':'Pul','time':'Vaqt','father':'Ota','mother':'Ona','child':'Bola','apple':'Olma','car':'Mashina','city':'Shahar','world':'Dunyo','love':'Sevgi','life':'Hayot','person':'Odam','work':'Ish','day':'Kun','night':'Kecha','good':'Yaxshi','bad':'Yomon','big':'Katta','small':'Kichik','beautiful':'Chiroyli' },
    uz_ru: { 'salom':'Привет','rahmat':'Спасибо','xayr':'Пока','uy':'Дом','kitob':'Книга','suv':'Вода','non':'Хлеб','maktab':'Школа',"do'st":'Друг','pul':'Деньги','vaqt':'Время','ota':'Отец','ona':'Мать','bola':'Ребёнок','olma':'Яблоко','mashina':'Машина','shahar':'Город','dunyo':'Мир','sevgi':'Любовь','hayot':'Жизнь','yer':'Земля','quyosh':'Солнце','oy':'Луна','osmon':'Небо','odam':'Человек','ish':'Работа','kun':'День','kecha':'Ночь','yaxshi':'Хорошо','yomon':'Плохо' },
    ru_uz: { 'привет':'Salom','спасибо':'Rahmat','пока':'Xayr','дом':'Uy','книга':'Kitob','вода':'Suv','хлеб':'Non','школа':'Maktab','друг':"Do'st",'деньги':'Pul','время':'Vaqt','отец':'Ota','мать':'Ona','ребёнок':'Bola','яблоко':'Olma','машина':'Mashina','город':'Shahar','мир':'Dunyo','любовь':'Sevgi','жизнь':'Hayot','земля':'Yer','солнце':'Quyosh','луна':'Oy','небо':'Osmon','человек':'Odam','работа':'Ish','день':'Kun','ночь':'Kecha','хорошо':'Yaxshi','плохо':'Yomon' }
  };

  async function checkTranslationQuery(promptText) {
    const p = promptText.toLowerCase().trim();

    // Tarjima kalit so'zi umuman yo'q — bu tarjima emas
    if (!/tarjima|inglizchaga|inglizcha|o'zbekchaga|ozbekchaga|ruschaga|ruschadan|ruschada|rus\s*tiliga|ingliz\s*tiliga|nima\s*degani|nima\s*bo'ladi|nima\s*boladi/.test(p)) {
      return null;
    }

    // Faqat "tarjima" yozilsa — qo'llanma ko'rsat
    if (/^tarjima\s*[?!.]?$/.test(p)) {
      return `🔤 **Universal Tarjima Xizmati**\n\n**So'z ham, uzun gap ham — 4 yo'nalishda tarjima!**\n\n🇺🇿➡️🇬🇧 *inglizchaga tarjima: Men bugun maktabga bordim*\n🇬🇧➡️🇺🇿 *o'zbekchaga tarjima: I went to school today*\n🇺🇿➡️🇷🇺 *ruschaga tarjima: Bugun ob-havo juda yaxshi*\n🇷🇺➡️🇺🇿 *ruschadan o'zbekchaga: Сегодня очень хорошая погода*\n\n💡 Internet bo'lmasa — zaxira lug'at ishlaydi!`;
    }

    const dir = _transDirection(p);
    if (!dir) return null;

    const txt = _transExtract(promptText);

    // Matn bo'sh bo'lsa — misol ko'rsat
    if (!txt || txt.length < 1) {
      const ex = dir.to === 'Inglizcha'   ? 'inglizchaga tarjima: Men bugun maktabga bordim'
               : dir.to === 'Ruscha'      ? 'ruschaga tarjima: Bugun ob-havo yaxshi'
               :                            "o'zbekchaga tarjima: I went to school today";
      return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\nTarjima qilmoqchi bo'lgan matnni yozing!\n\n📌 *Misol: "${ex}"*`;
    }

    // 1. MyMemory API — bepul, CORS yo'q, file:// dan ham ishlaydi
    const langMap = {
      'Inglizcha': 'en',
      "O'zbekcha": 'uz',
      "Inglizcha/Ruscha": 'en',
      'Ruscha': 'ru'
    };
    const fromLang = langMap[dir.from] || 'uz';
    const toLang   = langMap[dir.to]   || 'en';

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

    // 2. Pollinations AI — zaxira
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

    // 2. Internet yo'q — zaxira lug'at
    const dk = dir.to === 'Inglizcha'  ? 'uz_en'
             : dir.from === 'Ruscha'   ? 'ru_uz'
             : dir.to === 'Ruscha'     ? 'uz_ru'
             :                           'en_uz';
    const dict = _offDict[dk];
    const lower = txt.toLowerCase().trim();
    if (dict[lower]) {
      return `🔤 **${dir.from} → ${dir.to} Tarjima** *(oflayn lug'at)*:\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${dict[lower]}\n\n⚠️ *Internet bo'lsa uzun gaplar ham tarjima qilinadi.*`;
    }
    // Ko'p so'zli matn uchun so'zma-so'z urinib ko'rish
    const words = lower.split(/\s+/);
    if (words.length <= 6) {
      const translated = words.map(w => dict[w] || w).join(' ');
      if (translated !== lower) {
        return `🔤 **${dir.from} → ${dir.to} Tarjima** *(oflayn lug'at)*:\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${translated}\n\n⚠️ *Internet bo'lsa to'liq va aniq tarjima bo'ladi.*`;
      }
    }

    return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\n📝 **Asl matn:** "${txt}"\n\n⚠️ **Internet aloqasi yo'q.** Ulanishni tekshiring va qayta urinib ko'ring!\n\n💡 *Internetda so'z ham, uzun gap ham to'liq tarjima qilinadi.*`;
  }

  // Helper 3: Built-in Sports & Entities Engine
  function checkBuiltInSportsAndEntities(promptText) {
    const p = promptText.toLowerCase().trim();

    if (/tenis|tennis/.test(p)) {
      return `🎾 **Tennis (Katta Tennis) Sport Turi**\n\nTennis — kortda raketka va to'p bilan ikki o'yinchi (yoki juftlik) o'rtasida o'ynaladigan dunyoga mashhur Olimpiya sport turi.\n\n🏆 **Katta Dultug'a (Grand Slam) Turnirlari:**\n- 🇦🇺 **Australian Open** (Melburn)\n- 🇫🇷 **Roland Garros** (Parij — tuproq kort)\n- 🇬🇧 **Wimbledon** (London — maysa kort)\n- 🇺🇸 **US Open** (Nyu-York — qattiq kort)\n\n🌟 **Buyuk Afsonalar:**\n- 🇷🇸 **Novak Djokovic:** 24 marta Grand Slam g'olibi (tarixiy rekord!)\n- 🇪🇸 **Rafael Nadal:** 22 marta Grand Slam g'olibi ("Tuproq Qiroli")\n- 🇨🇭 **Roger Federer:** 20 marta Grand Slam g'olibi\n- 👧 **Ayollar:** Serena Williams, Iga Swiatek, Aryna Sabalenka`;
    }

    if (/futbol|football|soccer/.test(p) && !/david raya|raya|mbappe|messi|ronaldo|arsenal|real madrid|barcelona/.test(p)) {
      return `⚽ **Futbol Sport Turi va Chempionatlar**\n\nFutbol — dunyodagi №1 eng ommabop va sevimli jamoaviy sport turi!\n\n🏆 **Top 5 Chempionatlar va Klublar:**\n- 🇪🇸 **La Liga (Ispaniya):** Real Madrid, FC Barcelona, Atletico Madrid\n- 🇬🇧 **Premier League (Angliya):** Arsenal, Manchester City, Liverpool, Manchester United, Chelsea\n- 🇩🇪 **Bundesliga (Germaniya):** Bayern Munich, Borussia Dortmund\n- 🇮🇹 **Serie A (Italiya):** Juventus, Inter Milan, AC Milan\n- 🇫🇷 **Ligue 1 (Fransiya):** Paris Saint-Germain (PSG)\n\n🌟 **Top O'yinchilar:** Lionel Messi, Cristiano Ronaldo, Kylian Mbappé, Erling Haaland, Jude Bellingham, David Raya (Arsenal).`;
    }

    if (/boks|boxing/.test(p) && !/jalolov|hasanboy|tyson|ali|fury|usyk|canelo/.test(p)) {
      return `🥊 **Boks Sport Turi**\n\nBoks — ikki bokschi o me'da maxsus qo'lqoplarda o'tkaziladigan yakkakurash sport turi.\n\n🇺🇿 **O'zbekiston Boks Maktabi (Dunyoda №1!):**\n- 🥇 **Bakhodir Jalolov:** Tokyo 2020 Olimpiya Chempioni (Super og'ir vazn, 15-0 nokautlar)\n- 🥇 **Hasanboy Do'smatov:** Rio 2016 va Tokyo 2020 Olimpiya Chempioni (Val Barker kubogi)\n- 🥇 **Lazizbek Mullojonov, Abdumalik Khalokov, Asadkhuja Muydinkhujaev**\n\n🌟 **Jahon Afsonalari:** Muhammad Ali ("The Greatest"), Mike Tyson ("Iron Mike"), Tyson Fury, Oleksandr Usyk, Canelo Alvarez.`;
    }

    if (/hayvon|hayvonlar|qo'y|qoy|fil|sher|ot|mushuk|it|ayiq|bo'ri|bori|tulki|tovuq|qush|baliq|yashaydi|kenguru|zebra|jiraffa|gipopotam|krokodil|timsoh|ilon|kaltakesak|toshbaqa|qurbaqa|bo'g'ma|maymun|gorilla|shimpanze|panda|qo'ng'iz|kapalak|asalari|chumoli|o'rgimchak|chayon|burgut|burgut|lochin|qoqish|tustovuq|to'ti|pingvin|tuyaqush|oqqush|o'rdak|g'oz|sichqon|kalamush|quyon|tuyaqush|bug'u|jayron|teri|kiyik|yovvoyi cho'chqa|sher|bars|leopard|gepard|pitsa|kit|delfinlar|delfin|akula|ot baliq|medusa|laqqa/.test(p)) {
      if (/qo'y|qoy/.test(p)) {
        return `🐑 **Qo'y**\n\n- ⏳ **Umri:** 10-15 yil\n- 🌍 **Yashash joyi:** Butun dunyo (xonakilashtirilgan)\n- 🌿 **Oziqlanishi:** O't, don\n- ⚖️ **Vazni:** 45-100 kg\n- 💡 **Qiziqarli fakt:** 8000 yil oldin xonakilashtirilgan, inson bilan eng qadimiy hayvonlardan biri.\n- 🎯 **Foyda:** Go'sht, jun, sut`;
      }
      if (/fil/.test(p)) {
        return `🐘 **Fil**\n\n- ⏳ **Umri:** 60-70 yil\n- 🌍 **Yashash joyi:** Afrika va Osiyo\n- ⚖️ **Vazni:** 4,000-7,000 kg (eng og'ir quruqlik hayvoni)\n- 🧠 **Xotirasi:** Bir necha o'n yil eslab qoladi\n- 💡 **Qiziqarli fakt:** Burun bilan 8 litr suv shimib ichadi, issiqda o'zini sovutadi`;
      }
      if (/sher|aslon/.test(p)) {
        return `🦁 **Sher**\n\n- ⏳ **Umri:** 10-15 yil (tabiatda), 20-25 yil (hayvonot bog'ida)\n- 🌍 **Yashash joyi:** Afrika savannasi, Hindiston (Gir o'rmoni)\n- ⚖️ **Vazni:** 150-250 kg\n- 🏃 **Tezligi:** 80 km/soat\n- 💡 **Qiziqarli fakt:** Erkak sher 12 soat uxlaydi, dishi ov qiladi`;
      }
      if (/ot|otlar/.test(p)) {
        return `🐎 **Ot**\n\n- ⏳ **Umri:** 25-30 yil\n- 🌍 **Yashash joyi:** Butun dunyo\n- ⚖️ **Vazni:** 400-1000 kg\n- 🏃 **Tezligi:** 70 km/soat (tez yurganda)\n- 💡 **Qiziqarli fakt:** Tik turib uxlaydi, ko'zi 350 daraja ko'radi`;
      }
      if (/it|kuchuk/.test(p)) {
        return `🐶 **It**\n\n- ⏳ **Umri:** 10-15 yil\n- 🌍 **Yashash joyi:** Butun dunyo (xonakilashtirilgan)\n- 🧠 **Aqli:** 2 yoshli bolaga teng\n- 👃 **Hidi:** Insondan 100,000 marta kuchli\n- 💡 **Qiziqarli fakt:** 15,000 yil oldin bo'ri dan xonakilashtirilgan`;
      }
      if (/mushuk/.test(p)) {
        return `🐱 **Mushuk**\n\n- ⏳ **Umri:** 12-18 yil\n- 🌍 **Yashash joyi:** Butun dunyo\n- 👁️ **Ko'rishi:** Qorong'ida 6 marta yaxshi ko'radi\n- 😴 **Uyqusi:** Kuniga 12-16 soat uxlaydi\n- 💡 **Qiziqarli fakt:** Mushuk miyovlashi faqat insonlar bilan muloqot uchun`;
      }
      if (/ayiq/.test(p)) {
        return `🐻 **Ayiq**\n\n- ⏳ **Umri:** 20-30 yil\n- 🌍 **Yashash joyi:** Shimoliy Amerika, Yevropa, Osiyo\n- ⚖️ **Vazni:** 100-700 kg\n- 😴 **Qishki uyqu:** 4-6 oy uxlaydi\n- 💡 **Qiziqarli fakt:** Qutb ayig'i (oq ayiq) 40 km/soat suzadi`;
      }
      if (/bo'ri|bori|qashqir/.test(p)) {
        return `🐺 **Bo'ri (Qashqir)**\n\n- ⏳ **Umri:** 6-8 yil (tabiatda), 16 yil (asirlikda)\n- 🌍 **Yashash joyi:** Shimoliy Amerika, Yevropa, Osiyo\n- ⚖️ **Vazni:** 25-50 kg\n- 🏃 **Tezligi:** 60 km/soat\n- 💡 **Qiziqarli fakt:** To'da bo'lib ov qiladi, 1 marta 9 kg go'sht yeydi`;
      }
      if (/tulki/.test(p)) {
        return `🦊 **Tulki**\n\n- ⏳ **Umri:** 2-5 yil (tabiatda), 10-12 yil (asirlikda)\n- 🌍 **Yashash joyi:** Shimoliy yarimshar\n- ⚖️ **Vazni:** 3-11 kg\n- 🧠 **Aqli:** Juda ziyrak va ayyorlik bilan tanilgan\n- 💡 **Qiziqarli fakt:** 40 xil tovush chiqara oladi`;
      }
      if (/tovuq/.test(p)) {
        return `🐔 **Tovuq**\n\n- ⏳ **Umri:** 5-10 yil\n- 🌍 **Yashash joyi:** Butun dunyo (xonakilashtirilgan)\n- 🥚 **Tuxum:** Yiliga 250-300 ta tuxum qo'yadi\n- 💡 **Qiziqarli fakt:** Dunyoda 33 milliard tovuq bor — inson sonidan 4 marta ko'p`;
      }
      if (/qush|parrand/.test(p)) {
        return `🦅 **Qushlar Olami**\n\n**Eng mashhur qushlar:**\n- 🦅 **Burgut:** 3-4 km balanddan o'ljani ko'radi, 240 km/soat sho'ng'iydi\n- 🦜 **To'ti:** 50+ so'z gapira oladi, 60-80 yil yashaydi\n- 🐧 **Pingvin:** Uchmaydigan qush, 36 km/soat suzadi\n- 🦢 **Oqqush:** Umr bo'yi juft yashaydigan sodiq qush\n- 🦉 **Boyqush:** Boshini 270 daraja buradi\n- 🦚 **Tovus:** Dum patlari 1.5 m, dunyoning eng chiroyli qushi\n- 🐦 **Tustovuq:** O'zbekistonning milliy qushi`;
      }
      if (/burgut|lochin/.test(p)) {
        return `🦅 **Burgut**\n\n- ⏳ **Umri:** 20-30 yil\n- 🌍 **Yashash joyi:** Shimoliy Amerika, Yevropa, Osiyo\n- 👁️ **Ko'rishi:** 3-4 km uzoqlikdan o'ljani ko'radi\n- 🏃 **Tezligi:** Sho'ng'iganda 240 km/soat\n- ⚖️ **Vazni:** 3-7 kg\n- 💡 **Qiziqarli fakt:** Ko'zini yummay uxlaydi`;
      }
      if (/to'ti/.test(p)) {
        return `🦜 **To'ti**\n\n- ⏳ **Umri:** 60-80 yil (ba'zi turlari)\n- 🌍 **Yashash joyi:** Tropik o'rmonlar\n- 🗣️ **Gapirishsi:** 50-100 so'z eslab qoladi\n- 🧠 **Aqli:** 5 yoshli bolaga teng\n- 💡 **Qiziqarli fakt:** Kakapo to'tisi 9 kg — eng og'ir uchmaydigan qush`;
      }
      if (/pingvin/.test(p)) {
        return `🐧 **Pingvin**\n\n- ⏳ **Umri:** 15-20 yil\n- 🌍 **Yashash joyi:** Antarktida, Janubiy Amerika\n- 🏊 **Suzishi:** 36 km/soat\n- ❄️ **Sovuqga chidamliligi:** -50°C da yashaydi\n- 💡 **Qiziqarli fakt:** Tuxumni ota pingvin 65 kun oyoqlari ustida saqlaydi`;
      }
      if (/baliq/.test(p)) {
        return `🐟 **Baliqlar Olami**\n\n**Eng qiziqarli baliqlar:**\n- 🦈 **Akula:** 400 mln yildan beri yashayapti, 70 km/soat suzadi\n- 🐬 **Delfin:** Eng aqlli dengiz hayvoni, insonlar bilan muloqot qiladi\n- 🐋 **Kit:** Dunyodagi eng katta hayvon (30 m, 150 tonna)\n- 🐠 **Tropik baliqlar:** 3,500+ tur\n- 🦑 **Kalamar:** Ko'zi insonnikidan 3 marta katta\n- 🐡 **Fugu:** Eng zaharli baliq, Yaponiyada yeyiladi\n- 💡 Dunyoda 34,000+ tur baliq mavjud`;
      }
      if (/akula/.test(p)) {
        return `🦈 **Akula**\n\n- ⏳ **Umri:** 20-30 yil (ba'zilari 70 yil)\n- 🌍 **Yashash joyi:** Barcha okeanlar\n- 🏊 **Tezligi:** 70 km/soat\n- 🦷 **Tishlari:** Umr bo'yi almashib turadi (20,000+ tish)\n- 💡 **Qiziqarli fakt:** Akula 400 million yildan beri yashaydi — dinozavrlardan ham eski`;
      }
      if (/kit/.test(p)) {
        return `🐋 **Kit**\n\n- ⏳ **Umri:** 80-90 yil (ba'zilari 200 yil)\n- 🌍 **Yashash joyi:** Barcha okeanlar\n- ⚖️ **Vazni:** 150 tonna (Ko'k kit — eng og'ir hayvon)\n- 📏 **Uzunligi:** 30 metr\n- 💡 **Qiziqarli fakt:** Ko'k kitning yurak urishi minutiga 2 marta, ovozi 188 desibel`;
      }
      if (/delfin/.test(p)) {
        return `🐬 **Delfin**\n\n- ⏳ **Umri:** 20-30 yil\n- 🌍 **Yashash joyi:** Barcha okeanlar va ba'zi daryolar\n- 🧠 **Aqli:** Insondan keyin eng aqlli hayvon\n- 🏊 **Tezligi:** 60 km/soat\n- 💡 **Qiziqarli fakt:** Har bir delfin o'z nomi bor — boshqa delfinlar uni ism bilan chaqiradi`;
      }
      if (/kenguru/.test(p)) {
        return `🦘 **Kenguru**\n\n- ⏳ **Umri:** 6-8 yil\n- 🌍 **Yashash joyi:** Avstraliya\n- 🏃 **Tezligi:** 70 km/soat, 9 m uzunlikda sakraydi\n- 👶 **Bolasi:** Tug'ilganda 2 sm — ona cho'ntagida 8 oy o'sadi\n- 💡 **Qiziqarli fakt:** Orqaga yura olmaydi`;
      }
      if (/zebra/.test(p)) {
        return `🦓 **Zebra**\n\n- ⏳ **Umri:** 20-25 yil\n- 🌍 **Yashash joyi:** Afrika\n- 🏃 **Tezligi:** 65 km/soat\n- 🦓 **Yo'llari:** Har bir zebraning yo'llari noyob — barmoq iziga o'xshash\n- 💡 **Qiziqarli fakt:** Oq yoki qora? Aslida qora teriga oq yo'llar`;
      }
      if (/jiraff|jiraffa|zirafa/.test(p)) {
        return `🦒 **Jiraffa**\n\n- ⏳ **Umri:** 20-25 yil\n- 🌍 **Yashash joyi:** Afrika\n- 📏 **Bo'yi:** 5-6 metr (eng baland quruqlik hayvoni)\n- ⚖️ **Vazni:** 800-1200 kg\n- 💡 **Qiziqarli fakt:** Bo'yni 1.8 m bo'lsa ham, umurtqa soni insonnikidek — 7 ta`;
      }
      if (/timsoh|krokodil/.test(p)) {
        return `🐊 **Timsoh (Krokodil)**\n\n- ⏳ **Umri:** 70-100 yil\n- 🌍 **Yashash joyi:** Afrika, Osiyo, Amerika, Avstraliya\n- ⚖️ **Vazni:** 400-1000 kg\n- 💪 **Tishining kuchi:** 3,700 funt — eng kuchli tishlash kuchi\n- 💡 **Qiziqarli fakt:** 200 million yildan beri o'zgarmagan — dinozavrlar davridagi ko'rinishi`;
      }
      if (/ilon/.test(p)) {
        return `🐍 **Ilon**\n\n- ⏳ **Umri:** 10-30 yil\n- 🌍 **Yashash joyi:** Barcha qit'alar (Antarktidadan tashqari)\n- 📏 **Uzunligi:** 10 sm dan 7.5 metrgacha\n- 💡 **Qiziqarli fakt:** Qulog'i yo'q, titrashni sezadi. 600+ tur zaharli, 2400+ tur zararsiz\n- 🌿 **Foyda:** Kemiruvchilarni yo'q qiladi`;
      }
      if (/toshbaqa/.test(p)) {
        return `🐢 **Toshbaqa**\n\n- ⏳ **Umri:** 80-150 yil (ba'zilari 250 yil!)\n- 🌍 **Yashash joyi:** Butun dunyo\n- 🐢 **Chig'anog'i:** Umurtqa pog'onasining bir qismi — ko'chira olmaydi\n- 💡 **Qiziqarli fakt:** Harriet ismli toshbaqa 175 yil yashagan (1830-2006)`;
      }
      if (/maymun|gorilla|shimpanze/.test(p)) {
        return `🦍 **Maymunlar**\n\n- 🦍 **Gorilla:** Eng kuchli primat, 200 kg, DNK 98.3% insonnikidek\n- 🐒 **Shimpanze:** Eng aqlli, asbob ishlatadi, DNK 98.7% insonnikidek\n- 🦧 **Orangutan:** "O'rmon odami" — daraxtda yashaydi, 30 yil\n- 🐵 **Makak:** Sovuq suvda cho'miluvchi yagona maymun\n- 💡 Dunyoda 500+ tur maymun mavjud`;
      }
      if (/panda/.test(p)) {
        return `🐼 **Panda**\n\n- ⏳ **Umri:** 15-20 yil\n- 🌍 **Yashash joyi:** Xitoy (Sichuan tog'lari)\n- 🎋 **Ovqati:** Kuniga 12-38 kg bambuk yeydi\n- ⚖️ **Vazni:** 75-135 kg\n- 💡 **Qiziqarli fakt:** Dunyo bo'yicha faqat 1,800 ta qolgan — yo'qolib ketish xavfi bor`;
      }
      if (/quyon/.test(p)) {
        return `🐇 **Quyon**\n\n- ⏳ **Umri:** 8-12 yil\n- 🌍 **Yashash joyi:** Butun dunyo\n- 🏃 **Tezligi:** 70 km/soat\n- 👁️ **Ko'rishi:** 360 daraja ko'radi\n- 💡 **Qiziqarli fakt:** Tishlarini to'xtovsiz kemirishi kerak — tishlar o'sib boradi`;
      }
      if (/kalamush|sichqon/.test(p)) {
        return `🐀 **Kalamush / Sichqon**\n\n- ⏳ **Umri:** 2-3 yil\n- 🌍 **Yashash joyi:** Butun dunyo\n- 🧬 **DNK:** Insonnikiga 85% o'xshash — tibbiy tadqiqotlarda ishlatiladi\n- 💡 **Qiziqarli fakt:** Sichqon kulgisi bor — ultratovushda`;
      }
      if (/asalari/.test(p)) {
        return `🐝 **Asalari**\n\n- ⏳ **Umri:** Ishchi ari 6 hafta, malika 5 yil\n- 🌍 **Yashash joyi:** Butun dunyo (Antarktidadan tashqari)\n- 🍯 **Asal:** 1 kg asal uchun 4 mln gul tashrif\n- 💡 **Qiziqarli fakt:** Asalari yo'qolsa, insoniyat 4 yilda yo'q bo'ladi (Einstein)`;
      }
      if (/kapalak/.test(p)) {
        return `🦋 **Kapalak**\n\n- ⏳ **Umri:** 2 hafta - 1 yil\n- 🌍 **Yashash joyi:** Butun dunyo\n- 👁️ **Ko'rishi:** Ultrabinafsha nurni ko'radi\n- 💡 **Qiziqarli fakt:** Monarch kapalak 4,000 km migratsiya qiladi`;
      }
      if (/bars|leopard|gepard/.test(p)) {
        return `🐆 **Yo'lbars / Bars / Gepard**\n\n- 🐅 **Yo'lbars:** 100-300 kg, 60 km/soat, eng katta mushuksimon\n- 🐆 **Leopard:** 30-90 kg, daraxtga chiqadi, o'ljasini yuqoriga ko'taradi\n- 🐈 **Gepard:** 112 km/soat — quruqlikdagi eng tez hayvon!\n- ❄️ **Qor bari:** O'zbekiston tog'larida yashovchi noyob hayvon`;
      }
      if (/bug'u|kiyik|jayron/.test(p)) {
        return `🦌 **Bug'u / Kiyik / Jayron**\n\n- 🦌 **Bug'u:** 100-450 kg, shoxlari har yil yangilanadi\n- 🐃 **Jayron:** O'rta Osiyo cho'llarida yashovchi, 80 km/soat\n- 🦌 **Kiyik:** 30-300 kg, O'zbekiston tog'larida uchraydi\n- 💡 **Qiziqarli fakt:** Jayron O'zbekiston Qizil kitobida`;
      }
      return `🌍 **Dunyodagi Hayvonlar Olami**\n\n**🦁 Yirtqichlar:**\nSher, Yo'lbars, Gepard, Leopard, Bo'ri, Tulki, Ayiq\n\n**🐘 Katta sutemizuvchilar:**\nFil, Karkidon, Begemot, Jiraffa, Zebra, Kenguru\n\n**🐟 Dengiz hayvonlari:**\nKit, Delfin, Akula, Ahtapot, Kalamar\n\n**🐦 Qushlar:**\nBurgut, To'ti, Pingvin, Tovus, Boyqush, Oqqush\n\n**🐍 Sudralib yuruvchilar:**\nTimsoh, Ilon, Toshbaqa, Kaltakesak\n\n**🐝 Hasharotlar:**\nAsalari, Kapalak, Chumoli, Chivin\n\n**🐒 Primatlar:**\nGorilla, Shimpanze, Orangutan, Makak\n\n💬 **Istalgan hayvon nomini yozing — to'liq ma'lumot beraman!**\n*Masalan: "Jiraffa haqida", "Akula necha yil yashaydi", "Gepard tezligi"*`;
    }

    if (/david raya|raya/.test(p)) {
      return `⚽ **David Raya (Arsenal & Ispaniya)**\n\n- 🥅 **Pozitsiyasi:** Asosiy Darvozabon (Goalkeeper)\n- ⚽ **Joriy Klub:** **Arsenal F.C.** (2023-yildan buyon, Brentford'dan transfer bo'lgan)\n- 🏆 **Yutuqlari:** Angliya Premier Ligasida **"Oltin Qo'lqop" (Golden Glove)** sohibi (16 ta quruq o'yin!)\n- 🇪🇸 **Terma Jamoa:** Ispaniya terma jamoasi darvozaboni (Euro 2024 Chempioni!)\n- 📜 **Ilgari:** Blackburn Rovers, Brentford (2019-2023)`;
    }

    if (/arsenal/.test(p)) {
      return `⚽ **Arsenal F.C. (Angliya, London)**\n\n- 🏆 **Premier League:** 13 marta g'olib\n- 🏆 **FA Cup:** 14 marta g'olib (rekord!)\n- 🏟️ **Stadion:** Emirates Stadium (London)\n- 👤 **Bosh Murabbiy:** Mikel Arteta\n- 🥅 **Asosiy Darvozabon:** David Raya\n- 🔴 Laqabi: *"The Gunners"* ("To'pchilar")`;
    }

    return null;
  }

  // ==============================================================
  // WIKIPEDIA REAL KNOWLEDGE API
  // ==============================================================
  async function fetchWikipediaSummary(promptText) {
    try {
      const p = promptText.toLowerCase().trim();
      if (/^(sen|siz|men|biz|u|o'zing|ozing|salom|hi|hello)$/.test(p) || checkIdentityOrGreeting(p)) {
        return null;
      }

      let cleanQuery = promptText
        .toLowerCase()
        .replace(/(haqida|ma'lumot|malumat|ber|aytib|kim|qaysi|haqda|nima|qanday|qancha|yil|yashaydi|qulub)/gi, '')
        .replace(/qulub/g, 'klub')
        .trim();

      if (!cleanQuery || cleanQuery.length < 2 || /^(sen|siz|men|biz|u|o'zing|ozing)$/.test(cleanQuery)) {
        cleanQuery = promptText.trim();
      }

      if (/^(sen|siz|men|biz|u|o'zing|ozing)$/.test(cleanQuery)) {
        return null;
      }

      if (cleanQuery.includes('qulub')) cleanQuery = cleanQuery.replace('qulub', 'klub');
      if (cleanQuery === 'mbappe' || cleanQuery === 'mbappé') cleanQuery = 'Kylian Mbappé';

      // 1. Search Wikipedia (Uzbek)
      const searchUrl = `https://uz.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData && searchData.query && searchData.query.search && searchData.query.search.length > 0) {
          const topTitle = searchData.query.search[0].title;
          if (topTitle.toLowerCase().includes("o'zing") || topTitle.toLowerCase().includes("san marino")) {
            if (/sen|o'zing|ozing/i.test(promptText)) return null;
          }

          const summaryUrl = `https://uz.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
          const summaryRes = await fetch(summaryUrl);
          if (summaryRes.ok) {
            const sumData = await summaryRes.json();
            if (sumData && sumData.extract && sumData.extract.length > 20) {
              let icon = '🌐';
              if (/klub|futbol|sport|match|team|arsenal|real|barca/i.test(promptText)) icon = '⚽';
              else if (/hayvon|qo'y|fil|sher|ot|mushuk|it|qush/i.test(promptText)) icon = '🐾';
              else if (/boks|ufc|mma|jalolov/i.test(promptText)) icon = '🥊';

              let resText = `**${icon} ${sumData.title}**\n\n`;
              if (sumData.description) resText += `*📌 ${sumData.description}*\n\n`;
              let extract = sumData.extract;

              // Ensure David Raya is updated to Arsenal F.C.
              if (/david raya|raya/i.test(promptText) || /david raya/i.test(sumData.title)) {
                extract = extract.replace(/Brentford/g, "Arsenal (2023-yildan buyon, ijaradan so'ng to'liq transfer)");
                resText += `${extract}\n\n🏆 **Hozirgi Klub:** **Arsenal F.C.** (London)\n🥅 **Yutug'i:** Angliya Premier Ligasida "Oltin Qo'lqop" (Golden Glove) sohibi (2023/24) va Euro 2024 Chempioni!`;
                return resText;
              }

              resText += `${extract}`;
              return resText;
            }
          }
        }
      }

      // 2. Search Wikipedia (English fallback)
      const enSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&origin=*`;
      const enSearchRes = await fetch(enSearchUrl);
      if (enSearchRes.ok) {
        const enSearchData = await enSearchRes.json();
        if (enSearchData && enSearchData.query && enSearchData.query.search && enSearchData.query.search.length > 0) {
          const topTitle = enSearchData.query.search[0].title;
          const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
          const summaryRes = await fetch(summaryUrl);
          if (summaryRes.ok) {
            const sumData = await summaryRes.json();
            if (sumData && sumData.extract && sumData.extract.length > 20) {
              let resText = `**🌐 ${sumData.title}**\n\n`;
              if (sumData.description) resText += `*📌 ${sumData.description}*\n\n`;
              resText += `${sumData.extract}`;
              return resText;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Wikipedia API fetch error:', e);
    }
    return null;
  }

  // ==============================================================
  // UNIVERSAL AI ENGINE (Wikipedia + Pollinations AI)
  // ==============================================================
  async function fetchAIResponse(userPrompt) {
    // A. Wikipedia REST API first (Instant facts for any club, athlete, animal, person, topic)
    const wikiResult = await fetchWikipediaSummary(userPrompt);
    if (wikiResult) return wikiResult;

    // B. Pollinations FREE Real AI
    try {
      const systemPrompt = `Siz JARVIS AI — dunyodagi barcha bilimlarga ega bo'lgan universal intellektual yordamchisiz.
      Barcha sport turlari, barcha kulublar (Arsenal, Real Madrid, Barca va barcha jamoalar), barcha sportchilar (Mbappe, Messi, Ronaldo, Jalolov), barcha hayvonlar (qo'y, fil, sher va barcha turlar) hamda har qanday savolga o'zbek tilida aniq va chiroyli javob bering.`;

      const encodedPrompt = encodeURIComponent(userPrompt);
      const encodedSystem = encodeURIComponent(systemPrompt);
      const url = `https://text.pollinations.ai/${encodedPrompt}?system=${encodedSystem}&seed=42`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 5 && !text.includes('402')) {
          return text.trim();
        }
      }
    } catch (e) {}

    return null;
  }

  // ==============================================================
  // SMART OFFLINE KNOWLEDGE ENGINE (Fallback for all entities)
  // ==============================================================
  function getSmartOfflineResponse(promptText) {
    const p = promptText.toLowerCase().trim();

    // A. Multi-number Word Math Problems (Masalan: 1 bor edi 2 berdi 1 yedim -> 1 + 2 - 1 = 2)
    const nums = promptText.match(/\d+/g);
    if (nums && nums.length >= 2) {
      let itemMatch = promptText.match(/\b(olma|nok|behi|daftar|qalam|kitob|tuxum|mashina|bola|odam|qovoq|limon|uzum|pul|so'm)\b/i);
      let item = itemMatch ? itemMatch[0] : 'ta';

      let total = parseInt(nums[0], 10);

      if (nums.length === 2) {
        const n2 = parseInt(nums[1], 10);
        if (/yedi|yeb|ayir|sotdi|ishlat|yo.qol|ketdi|qoldi/.test(p)) {
          return `🧮 **Masala yechimi:**\n\n${total} - ${n2} = **${total - n2}**\n\nJavob: Sizda **${total - n2} ${item}** qoldi.`;
        }
        if (/qo.sh|qosh|oldim|berdi|jami|bo.ldi|boldi/.test(p)) {
          return `🧮 **Masala yechimi:**\n\n${total} + ${n2} = **${total + n2}**\n\nJavob: Jami **${total + n2} ${item}** bo'ldi.`;
        }
      }

      if (nums.length === 3) {
        const n2 = parseInt(nums[1], 10);
        const n3 = parseInt(nums[2], 10);
        total = total + n2 - n3;
        return `🧮 **Masala yechimi:**\n\n${nums[0]} + ${n2} - ${n3} = **${total}**\n\nJavob: Sizda **${total} ${item}** qoldi.`;
      }
    }

    // B. HAYVONLAR (Animals Knowledge Engine)
    if (/hayvon|qo'y|qoy|fil|sher|ot|mushuk|it|ayiq|bo'ri|bori|tulki|tovuq|qush|baliq|yashaydi|kenguru|zebra|jiraffa|timsoh|ilon|toshbaqa|maymun|panda|quyon|kalamush|sichqon|asalari|kapalak|bars|gepard|bug'u|kiyik|jayron|akula|kit|delfin|burgut|pingvin/.test(p)) {
      return `🌍 **Hayvonot Olami:**\n\n🦁 **Yirtqichlar:** Sher, Yo'lbars, Bo'ri, Tulki, Ayiq\n🐘 **Kattalar:** Fil, Jiraffa, Zebra, Kenguru\n🐟 **Dengiz:** Kit, Delfin, Akula\n🦅 **Qushlar:** Burgut, To'ti, Pingvin\n🐍 **Sudraluvchilar:** Timsoh, Ilon, Toshbaqa\n🐝 **Hasharotlar:** Asalari, Kapalak\n\n💬 *Istalgan hayvon nomini yozing!*`;
    }

    // C. KULUB va KLUB LARI (Arsenal, Real Madrid, Barca...)
    if (/arsenal|real madrid|barcelona|barca|man city|manchester|chelsea|liverpool|psg|bayern|juventus|inter|qulub|klub/.test(p)) {
      if (/arsenal/.test(p)) {
        return `⚽ **Arsenal F.C. (Angliya, London)**\n\n- 🏆 **Premier League:** 13 marta g'olib\n- 🏆 **FA Cup:** 14 marta g'olib (rekord!)\n- 🏟️ **Stadion:** Emirates Stadium (London)\n- 👤 **Bosh Murabbiy:** Mikel Arteta\n- 🔴 Laqabi: *"The Gunners"* ("To'pchilar")`;
      }
      if (/real madrid|real/.test(p) && !p.includes('real hayot')) {
        return `⚽ **Real Madrid C.F. (Ispaniya)**\n\n- 🏆 **Chempionlar Ligasi (UCL):** 15 marta (tarixiy rekord!)\n- 🏆 **La Liga:** 36 marta g'olib\n- 🏟️ **Stadion:** Santiago Bernabéu (Madrid)\n- 🌟 **Yulduzlar:** Kylian Mbappé, Jude Bellingham, Vinicius Jr`;
      }
      if (/barcelona|barca/.test(p)) {
        return `⚽ **FC Barcelona (Ispaniya)**\n\n- 🏆 **La Liga:** 27 marta | **UCL:** 5 marta\n- 🌟 **Afsonalar:** Lionel Messi, Xavi, Iniesta, Ronaldinho\n- 🏟️ **Stadion:** Camp Nou`;
      }
      if (/man city|manchester city/.test(p)) {
        return `⚽ **Manchester City (Angliya)**\n\n- 🏆 4 marta ketma-ket Premier Liga g'olibi\n- 🏆 2023 Treble g'olibi (Premier League + FA Cup + UCL)\n- 👤 Murabbiy: Pep Guardiola | Hujumchi: Erling Haaland`;
      }
      return `⚽ **Futbol Klublari Olami:**\n\n- 🇬🇧 **Arsenal:** London to'pchilari (Emirates Stadium)\n- 🇪🇸 **Real Madrid:** 15 marta UCL g'olibi\n- 🇪🇸 **Barcelona:** Camp Nou afsonasi\n- 🇬🇧 **Manchester City:** Pep Guardiola jamoasi`;
    }

    // D. SPORTCHILAR (David Raya, Mbappe, Messi, Ronaldo, Jalolov...)
    if (/david raya|raya|mbappe|mbappé|messi|ronaldo|jalolov|hasanboy|tyson|ali|fury|usyk|canelo|djokovic|federer|jordan|lebron/.test(p)) {
      if (/david raya|raya/.test(p)) {
        return `⚽ **David Raya (Arsenal & Ispaniya)**\n\n- 🥅 **Pozitsiyasi:** Asosiy Darvozabon (Goalkeeper)\n- ⚽ **Joriy Klub:** **Arsenal F.C.** (2023-yildan buyon, Brentford'dan transfer bo'lgan)\n- 🏆 **Yutuqlari:** Angliya Premier Ligasida **"Oltin Qo'lqop" (Golden Glove)** sohibi (16 ta quruq o'yin!)\n- 🇪🇸 **Terma Jamoa:** Ispaniya terma jamoasi darvozaboni (Euro 2024 Chempioni!)\n- 📜 **Ilgari:** Blackburn Rovers, Brentford (2019-2023)`;
      }
      if (/mbappe|mbappé/.test(p)) {
        return `⚽ **Kylian Mbappé (Fransiya)**\n\n- 🏆 **Jahon Chempioni:** 2018 (Fransiya)\n- ⚽ **Klublar:** Monaco, PSG, Real Madrid (2024 yildan)\n- ⚡ Dunyodagi eng tezkor va mahoratli futbolchi!`;
      }
      if (/messi/.test(p)) {
        return `⚽ **Lionel Messi (Argentina)**\n\n- 🥇 **Ballon d'Or:** 8 marta (rekord!)\n- 🏆 **Jahon Chempioni:** 2022 (Qatar)\n- ⚽ **Klublar:** Barcelona, PSG, Inter Miami`;
      }
      if (/ronaldo|cr7/.test(p)) {
        return `⚽ **Cristiano Ronaldo (Portugaliya)**\n\n- 🥇 **Ballon d'Or:** 5 marta\n- 🏆 **UCL:** 5 marta g'olib\n- 📊 **900+ rasmiy gol** (Al-Nassr)`;
      }
      if (/jalolov/.test(p)) {
        return `🥊 **Bakhodir Jalolov 🇺🇿**\n\n- 🥇 **Tokyo 2020 Olimpiya Chempioni** (Super og'ir vazn)\n- 🏆 **WBC, WBO, IBF, WBA** kamarlari sohibi\n- 💪 15-0 professional rekord!`;
      }
    }

    // E. SPORT TURLARI (Tenis, Boks, Futbol, UFC, Basketbol, Suzish, Shaxmat...)
    if (/tenis|tennis|boks|boxing|ufc|mma|basketbol|basketball|shaxmat|chess|suzish|swimming|futbol|football|sport/.test(p)) {
      if (/tenis|tennis/.test(p)) {
        return `🎾 **Tenis Sport Turi**\n\n- 🏆 **Katta Ddubulg'a (Grand Slam) turnirlari:** Wimbledon, US Open, Roland Garros, Australian Open\n- 🌟 **Buyuk Afsonalar:** Novak Djokovic (24 GS - rekord!), Rafael Nadal (22 GS), Roger Federer (20 GS)\n- 👧 **Ayollar:** Serena Williams, Iga Swiatek`;
      }
      if (/boks|boxing/.test(p)) {
        return `🥊 **Boks Sport Turi**\n\n- 🇺🇿 **O'zbekiston:** Dunyoda №1 boks mamlakati! (Bakhodir Jalolov, Hasanboy Do'smatov)\n- 🌟 **Jahon Afsonalari:** Muhammad Ali, Mike Tyson, Tyson Fury, Oleksandr Usyk`;
      }
      if (/basketbol|basketball|nba/.test(p)) {
        if (/jordan|michael jordan/.test(p)) {
          return `🏀 **Michael Jordan (Basketbol Afsonasi)**\n\n- 🐐 **Pozitsiya:** Shooting Guard\n- 🏆 **NBA Chempioni:** 6 marta (Chicago Bulls bilan)\n- 🥇 **MVP:** 5 marta\n- 🏅 **Olimpiya:** 2 marta oltin medal (1984, 1992)\n- 📊 O'rtacha 30.1 ochko — NBA tarixidagi rekord!\n- 👟 Nike "Air Jordan" brendining asoschiyi\n- 🎬 Film: "Space Jam" (1996)\n- 💬 Laqabi: **"His Airness"** / **"MJ"**`;
        }
        if (/lebron|james/.test(p)) {
          return `🏀 **LeBron James ("King James")**\n\n- 🏆 **NBA Chempioni:** 4 marta (Miami Heat, Cleveland, LA Lakers)\n- 📊 **NBA tarixidagi ENG KO'P OCHKO YIQQAN O'YINCHI!** (38,000+ ochko)\n- 🥇 **MVP:** 4 marta\n- 🏅 **Olimpiya:** 2 marta oltin medal\n- 💰 Dunyo sportchilarining №1 topadigan mashhuri\n- ⚽ Shuningdek futbol klubiga ham ega (Liverpool aksiyasi)`;
        }
        if (/curry|stephen curry/.test(p)) {
          return `🏀 **Stephen Curry ("Baby-Faced Assassin")**\n\n- 🏆 **NBA Chempioni:** 4 marta (Golden State Warriors)\n- 🎯 **3 ochkolik urishlar rekordi:** NBA tarixida eng ko'p!\n- 📊 **MVP:** 2 marta (2015, 2016 — 2016 yili ovozlar bilan 100% birlik)\n- ⚡ Dunyodagi eng tez va aniq nishonchi basketbolchi`;
        }
        if (/jokic|nikola/.test(p)) {
          return `🏀 **Nikola Jokić ("The Joker")**\n\n- 🏆 **NBA Chempioni:** 2023 (Denver Nuggets)\n- 🥇 **MVP:** 3 marta (2021, 2022, 2024) — Serbiyalik ilk MVP!\n- 📊 Tarix bo'yicha eng ko'p triple-double yig'uvchi center\n- 🇷🇸 Serbiyalik basketbolchi, Denver Nuggets superstar`;
        }
        if (/o'zbekiston|uzbekistan|uz basketbol/.test(p)) {
          return `🏀 **O'zbekiston Basketboli**\n\n- 🇺🇿 O'zbekiston milliy basketbol jamoasi Osiyo chempionatlarida qatnashadi\n- 🏟️ **Toshkent** — asosiy arena\n- 🌱 Yosh avlod basketbolchilari ko'paymoqda\n- 📺 NBA O'zbekistonda ham mashhur (LeBron, Curry, Jordan)`;
        }
        if (/golden state|warriors/.test(p)) {
          return `🏀 **Golden State Warriors (NBA)**\n\n- 🏆 **NBA Chempioni:** 7 marta (1947, 1956, 1975, 2015, 2017, 2018, 2022)\n- ⭐ **Yulduzlar:** Stephen Curry, Klay Thompson, Draymond Green\n- 👤 **Murabbiy:** Steve Kerr\n- 🏟️ **Arena:** Chase Center, San Francisco`;
        }
        if (/lakers|los angeles/.test(p)) {
          return `🏀 **Los Angeles Lakers (NBA)**\n\n- 🏆 **NBA Chempioni:** 17 marta (tarixda eng ko'p!)\n- ⭐ **Yulduz:** LeBron James, Anthony Davis\n- 🐐 **Afsonalar:** Kobe Bryant (5 chempionlik), Magic Johnson, Kareem Abdul-Jabbar\n- 🏟️ **Arena:** Crypto.com Arena, Los Angeles`;
        }
        if (/bulls|chicago/.test(p)) {
          return `🏀 **Chicago Bulls (NBA)**\n\n- 🏆 **NBA Chempioni:** 6 marta (1991, 1992, 1993, 1996, 1997, 1998)\n- 🐐 **Afsona:** Michael Jordan, Scottie Pippen, Dennis Rodman\n- 🔴⚫ Qizil-qora forma bilan tanilgan\n- 📺 "The Last Dance" — ular haqidagi mashhur Netflix seriali`;
        }
        return `🏀 **Basketbol va NBA To'liq Ma'lumot**\n\n**🏆 NBA Chempionlari (So'nggi yillar):**\n- 2024: Boston Celtics 🍀\n- 2023: Denver Nuggets 🏔️\n- 2022: Golden State Warriors 🌊\n- 2021: Milwaukee Bucks 🦌\n- 2020: Los Angeles Lakers 💜\n\n**🌟 NBA Eng Mashhur Jamoalar:**\n- 🟡 **LA Lakers** — LeBron James, 17 chempionlik\n- 🔴 **Chicago Bulls** — Michael Jordan'ning jamoasi\n- 🌊 **Golden State Warriors** — Stephen Curry jamoasi\n- 🟢 **Boston Celtics** — 18 chempionlik (rekord!)\n- ⚫ **San Antonio Spurs** — Tim Duncan, 5 chempionlik\n\n**🐐 Davr Afsonalari:**\n| Davr | O'yinchi | Yutug'i |\n|------|----------|----------|\n| 90s | Michael Jordan | 6x NBA chempioni |\n| 2000s | Kobe Bryant | 5x NBA chempioni |\n| 2010s | LeBron James | 4x NBA chempioni |\n| Hozir | Nikola Jokić | 3x MVP |\n\n**📏 Basketbol Qoidalari:**\n- 🕐 4 x 12 daqiqa (NBA)\n- 🏀 5 nafar o'yinchi maydon\n- 🎯 2 ochko (yaqin), 3 ochko (uzoq), 1 ochko (jarima)\n- ⏱️ Shot clock: 24 soniya\n\n**💬 Mashhur o'yinchilar haqida so'rashingiz mumkin:**\n*"Michael Jordan kim"*, *"LeBron James haqida"*, *"Stephen Curry"*, *"Nikola Jokic"*`;
      }
      if (/shaxmat/.test(p)) {
        return `♟️ **Shaxmat**\n\n- 🇺🇿 **O'zbekiston:** 2022 Butunjahon Shaxmat Olimpiadasi Chempioni! (Nodirbek Abdusattorov)\n- 🌟 Magnus Carlsen, Garry Kasparov`;
      }
      return `🏅 **Barcha Sport Turlari:**\n\n- ⚽ **Futbol:** Real Madrid, Arsenal, Messi, Mbappé\n- 🥊 **Boks:** Bakhodir Jalolov, Mike Tyson\n- 🎾 **Tenis:** Novak Djokovic, Nadal\n- ♟️ **Shaxmat:** Nodirbek Abdusattorov, Carlsen\n- 🥋 **UFC/MMA:** Khabib, McGregor, Muradov`;
    }

    // F. TARJIMA va LUG'AT
    if (/tarjima|translate|nima bo.ladi|nima degani|o.zbekcha|inglizcha|so.zi/.test(p)) {
      return `🔤 **Tarjima Xizmati:**\n\nIstalgan so'z yoki UZUN GAPLARNI yuboring, men inglizcha, o'zbekcha, ruscha va barcha tillarga tarjima qilaman!`;
    }

    // G. SALOMLASHISH va O'ZI HAQIDA
    if (/salom|hello|hi |привет|qalaysiz|jarvis|kim/.test(p)) {
      return `🤖 **Salom! Men JARVIS AI!**\n\nMen barcha narsalarni bilaman:\n- ⚽ **Sport & Klublar:** Arsenal, Real Madrid, Mbappé, Messi...\n- 🐾 **Hayvonlar:** Qo'y, fil, sher, ot, va barcha turlar...\n- 🥊 **Boks & UFC:** Bakhodir Jalolov, Tyson, Khabib...\n- 🔤 **Tarjima:** Hamma tillar va uzun gaplar...`;
    }

    // DEFAULT FALLBACK
    return `🤖 **JARVIS AI Javobi:**\n\nSiz kiritgan **"${promptText}"** bo'yicha ma'lumot tahlil qilindi.\n\n📌 **Sinab ko'ring:**\n- ⚽ *"Arsenal qaysi klub"* yoki *"Mbappe kim"*\n- 🎾 *"Tenis haqida ma'lumot ber"*\n- 🐾 *"Qo'y qancha yil yashaydi"* yoki *"Hayvonlar haqida ma'lumot ber"*`;
  }


  // ==============================================================
  // INTELLIJ IDEA va KOD YORDAMI (Python, Java, JS, HTML, CSS...)
  // ==============================================================
  function checkCodingHelp(promptText) {
    const p = promptText.toLowerCase().trim();
    if (!/kod|code|python|java|javascript|html|css|intellij|idea|dastur|funksiya|loop|for|while|class|function|variable|o'zgaruvchi|array|list|print|console|error|bug|debug|syntax/.test(p)) return null;

    // Python
    if (/python/.test(p)) {
      if (/print/.test(p)) {
        return `🐍 **Python — print() funksiyasi:**\n\n\`\`\`python\n# Oddiy chiqarish\nprint("Salom Dunyo!")\n\n# O'zgaruvchi chiqarish\nism = "Jarvis"\nprint(f"Salom, {ism}!")\n\n# Ko'p qiymat\nprint("1 + 2 =", 1 + 2)\n\`\`\`\n\n💡 **IntelliJ IDEA'da ishlatish:**\n1. File → New Project → Python\n2. Yangi fayl yarating: \`main.py\`\n3. Kodni yozing va ▶️ Run tugmasini bosing`;
      }
      if (/loop|for|while/.test(p)) {
        return `🐍 **Python — Loop (Tsikl):**\n\n\`\`\`python\n# For loop\nfor i in range(5):\n    print(f"Raqam: {i}")\n\n# While loop\nn = 0\nwhile n < 5:\n    print(f"n = {n}")\n    n += 1\n\n# Ro'yxat ustida\nmevallar = ["olma", "nok", "banan"]\nfor meva in mevallar:\n    print(meva)\n\`\`\``;
      }
      if (/class/.test(p)) {
        return `🐍 **Python — Class (Sinf):**\n\n\`\`\`python\nclass Mashina:\n    def __init__(self, nomi, yili):\n        self.nomi = nomi\n        self.yili = yili\n\n    def info(self):\n        print(f"{self.nomi} - {self.yili} yil")\n\n# Ishlatish\nm = Mashina("Toyota", 2023)\nm.info()  # Toyota - 2023 yil\n\`\`\``;
      }
      if (/list|array|ro'yxat/.test(p)) {
        return `🐍 **Python — List (Ro'yxat):**\n\n\`\`\`python\n# List yaratish\nnumbers = [1, 2, 3, 4, 5]\nnames = ["Ali", "Vali", "Soli"]\n\n# Qo'shish\nnumbers.append(6)\n\n# O'chirish\nnumbers.remove(3)\n\n# Uzunligi\nprint(len(numbers))  # 5\n\n# Saralash\nnumbers.sort()\nprint(numbers)  # [1, 2, 4, 5, 6]\n\`\`\``;
      }
      if (/funksiya|function|def/.test(p)) {
        return `🐍 **Python — Funksiya (def):**\n\n\`\`\`python\n# Oddiy funksiya\ndef salomlash(ism):\n    return f"Salom, {ism}!"\n\nprint(salomlash("Ali"))  # Salom, Ali!\n\n# Ko'p parametr\ndef yig'indi(a, b):\n    return a + b\n\nprint(yig'indi(5, 3))  # 8\n\n# Default qiymat\ndef greet(name, til="uz"):\n    if til == "uz":\n        return f"Salom {name}"\n    return f"Hello {name}"\n\`\`\``;
      }
      return `🐍 **Python Dasturlash Tili — IntelliJ IDEA:**\n\n**📦 IntelliJ IDEA'da Python sozlash:**\n1. File → New Project → Pure Python\n2. Python interpreter tanlang (yoki o'rnating)\n3. ▶️ tugmasi bilan ishga tushiring\n\n**🔥 Asosiy tushunchalar:**\n\`\`\`python\n# O'zgaruvchi\nism = "JARVIS"\nyosh = 25\n\n# Shartli ifoda\nif yosh >= 18:\n    print("Voyaga yetgan")\nelse:\n    print("Voyaga yetmagan")\n\n# Funksiya\ndef salom(name):\n    print(f"Salom, {name}!")\n\nsalom("Ali")\n\`\`\`\n\n💬 **So'rash mumkin:** *"Python for loop"*, *"Python class"*, *"Python list"*, *"Python funksiya"*`;
    }

    // Java
    if (/java/.test(p) && !/javascript/.test(p)) {
      if (/print/.test(p)) {
        return `☕ **Java — System.out.println():**\n\n\`\`\`java\npublic class Main {\n    public static void main(String[] args) {\n        // Oddiy chiqarish\n        System.out.println("Salom Dunyo!");\n\n        // O'zgaruvchi\n        String ism = "Jarvis";\n        System.out.println("Salom, " + ism + "!");\n\n        // Raqam\n        int son = 42;\n        System.out.println("Javob: " + son);\n    }\n}\n\`\`\`\n\n💡 **IntelliJ IDEA'da:** File → New Project → Java → main() metodini yozing`;
      }
      if (/loop|for|while/.test(p)) {
        return `☕ **Java — Loop (Tsikl):**\n\n\`\`\`java\n// For loop\nfor (int i = 0; i < 5; i++) {\n    System.out.println("i = " + i);\n}\n\n// While loop\nint n = 0;\nwhile (n < 5) {\n    System.out.println("n = " + n);\n    n++;\n}\n\n// For-each\nString[] fruits = {"olma", "nok", "banan"};\nfor (String fruit : fruits) {\n    System.out.println(fruit);\n}\n\`\`\``;
      }
      if (/class/.test(p)) {
        return `☕ **Java — Class:**\n\n\`\`\`java\npublic class Mashina {\n    String nomi;\n    int yili;\n\n    // Constructor\n    public Mashina(String nomi, int yili) {\n        this.nomi = nomi;\n        this.yili = yili;\n    }\n\n    // Metod\n    public void info() {\n        System.out.println(nomi + " - " + yili);\n    }\n\n    // Main\n    public static void main(String[] args) {\n        Mashina m = new Mashina("Toyota", 2023);\n        m.info();  // Toyota - 2023\n    }\n}\n\`\`\``;
      }
      return `☕ **Java Dasturlash Tili — IntelliJ IDEA:**\n\n**📦 IntelliJ IDEA'da Java ishga tushirish:**\n1. File → New Project → Java\n2. JDK tanlang (masalan JDK 17)\n3. \`src/Main.java\` faylini yarating\n4. ▶️ Run bilan ishga tushiring\n\n**🔥 Hello World:**\n\`\`\`java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Salom Dunyo!");\n    }\n}\n\`\`\`\n\n💬 **So'rash mumkin:** *"Java for loop"*, *"Java class"*, *"Java print"*`;
    }

    // JavaScript
    if (/javascript|js/.test(p)) {
      if (/funksiya|function/.test(p)) {
        return `🌐 **JavaScript — Funksiya:**\n\n\`\`\`javascript\n// Oddiy funksiya\nfunction salomlash(ism) {\n    return "Salom, " + ism + "!";\n}\nconsole.log(salomlash("Ali"));\n\n// Arrow funksiya\nconst yig'indi = (a, b) => a + b;\nconsole.log(yig'indi(5, 3));  // 8\n\n// Async funksiya\nasync function dataOlish(url) {\n    const res = await fetch(url);\n    return await res.json();\n}\n\`\`\``;
      }
      return `🌐 **JavaScript — IntelliJ IDEA / VS Code:**\n\n\`\`\`javascript\n// O'zgaruvchi\nlet ism = "JARVIS";\nconst yosh = 25;\n\n// Funksiya\nfunction salom(name) {\n    console.log(\`Salom, \${name}!\`);\n}\n\n// Array\nconst mevallar = ["olma", "nok", "banan"];\nmevallar.forEach(m => console.log(m));\n\n// Object\nconst odam = { ism: "Ali", yosh: 20 };\nconsole.log(odam.ism);\n\`\`\``;
    }

    // HTML
    if (/html/.test(p)) {
      return `🌐 **HTML — Asosiy Tuzilma:**\n\n\`\`\`html\n<!DOCTYPE html>\n<html lang="uz">\n<head>\n    <meta charset="UTF-8">\n    <title>Mening Sahifam</title>\n</head>\n<body>\n    <h1>Salom Dunyo!</h1>\n    <p>Bu mening birinchi HTML sahifam.</p>\n    <button onclick="salom()">Bosing</button>\n\n    <script>\n        function salom() {\n            alert("Salom!");\n        }\n    </script>\n</body>\n</html>\n\`\`\`\n\n💡 **IntelliJ IDEA'da:** File → New → HTML File`;
    }

    // CSS
    if (/css/.test(p)) {
      return `🎨 **CSS — Asosiy Stillar:**\n\n\`\`\`css\n/* Asosiy stil */\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    margin: 0;\n    padding: 20px;\n}\n\n/* Sarlavha */\nh1 {\n    color: #333;\n    text-align: center;\n}\n\n/* Tugma */\n.btn {\n    background: #007bff;\n    color: white;\n    padding: 10px 20px;\n    border: none;\n    border-radius: 5px;\n    cursor: pointer;\n}\n\n.btn:hover {\n    background: #0056b3;\n}\n\`\`\``;
    }

    // IntelliJ IDEA umumiy
    if (/intellij|idea/.test(p)) {
      return `💡 **IntelliJ IDEA — Asosiy Yo'riqnoma:**\n\n**🚀 Yangi loyiha yaratish:**\n1. File → New Project\n2. Til tanlang: Java, Python, Kotlin, JavaScript...\n3. Loyiha nomini kiriting → Create\n\n**⌨️ Eng muhim tugmalar (Shortcuts):**\n- \`Ctrl + Alt + L\` — Kodni formatlash\n- \`Ctrl + /\` — Izoh qo'shish\n- \`Shift + F10\` — Dasturni ishga tushirish ▶️\n- \`Ctrl + Z\` — Bekor qilish\n- \`Ctrl + Shift + F\` — Barcha fayllardan qidirish\n- \`Alt + Enter\` — Xatoni tuzatish taklifi\n- \`Ctrl + Space\` — Avtoto'ldirish\n\n**🐞 Debug (Xatolarni topish):**\n- \`F9\` — Debug rejimida ishga tushirish\n- \`F8\` — Keyingi qatorga o'tish\n- Chap tomonga qizil nuqta (breakpoint) qo'ying\n\n💬 Qaysi tilda kod yozmoqchisiz? *Python, Java, JavaScript, HTML, CSS* — so'rang!`;
    }

    return null;
  }

  // ==============================================================
  // ODAMLAR BILAN MULOQOT (Suhbat, His-tuyg'u, Kundalik hayot)
  // ==============================================================
  function checkConversation(promptText) {
    const p = promptText.toLowerCase().trim();

    // Kayfiyat va his-tuyg'u
    if (/yaxshi|zo'r|ajoyib|a'lo|hammasi yaxshi|kayfiyat|quvnoq|baxtli|xursand/.test(p) && !/futbol|sport|klub/.test(p)) {
      if (/qalaysiz|qalaysan|qandaysiz|yaxshimisiz/.test(p)) {
        return `😊 **Men juda yaxshiman, rahmat!**\n\nHar doim siz bilan suhbatlashishdan xursandman! Sizchi, qandaysiz? Bugun nima qilmoqchi edingiz?\n\n💬 Istalgan narsani so'rashingiz mumkin — sport, bilim, tarjima, kod va boshqalar!`;
      }
      if (/xursand|baxtli|quvnoq|yaxshi kayfiyat/.test(p)) {
        return `😄 **Juda yaxshi!** Siz xursand bo'lganingizdan men ham quvondim!\n\nBugun nima yaxshi voqea bo'ldi? Yoki birga suhbatlashamizmi? 🎉`;
      }
    }

    if (/yomon|xafa|g'amgin|qayg'u|stress|charchad|charchagan|tushkunlik/.test(p)) {
      return `🤗 **Tushunaman, har kimda bunday kunlar bo'ladi.**\n\nLekin unutmang — bu ham o'tib ketadi! Siz kuchli odamsiz.\n\n💪 Biroz dam oling, chuqur nafas oling. Men har doim shu yerdaman — gaplashmoqchi bo'lsangiz yoki chalg'itish kerak bo'lsa, so'rang! 😊`;
    }

    if (/zerikdim|zerikarli|boring|nima qilay|vaqt o'tkaz/.test(p)) {
      return `😄 **Zerikibsiz? Yordamlashaman!**\n\nQuyidagilardan birini sinab ko'ring:\n- 🏀 *"Basketbol haqida ma'lumot ber"* — qiziqarli faktlar\n- 🧠 *"Mantiqiy topshiriq ber"* — miyangizni ishga soling\n- 🌍 *"Qiziq faktlar"* — dunyoning sirli tomonlari\n- ⚽ *"Real Madrid haqida"* — futbol suhbati\n- 💻 *"Python kod yozishni o'rgat"* — yangi ko'nikma`;
    }

    if (/rahmat|tashakkur|sog' bo'ling|xayr|ko'rishguncha|alvido/.test(p)) {
      if (/xayr|alvido|ko'rishguncha|sog' bo'ling/.test(p)) {
        return `👋 **Xayr! Ko'rishguncha!**\n\nIstalgan vaqt qaytib keling — men doim shu yerdaman! 😊\nSizga omad va yaxshi kun tilayman! ☀️`;
      }
      return `😊 **Iltimos, muammo emas!**\n\nYordam bera olganimdan xursandman. Yana savollaringiz bo'lsa, bemalol so'rang! 🤝`;
    }

    if (/ism|o'zing haqida|o'zing kim|jarvis nima|sen nima/.test(p) && !/kim siz|kim san/.test(p)) {
      return `🤖 **Men haqimda:**\n\nMen **JARVIS AI** — sizning aqlli ovozli yordamchingizman! 🌟\n\n**Nima bilaman:**\n- 🏀 Sport (Futbol, Basketbol, Boks, Tennis)\n- 🌍 Jahon bilimlari (tarix, geografiya, fan)\n- 🔤 Tarjima (Ruscha, Inglizcha ↔ O'zbekcha)\n- 💻 Kod yozish (Python, Java, JavaScript, HTML)\n- 🧮 Matematik va mantiqiy masalalar\n- 💬 Suhbat va muloqot\n\n**Mening maqsadim** — sizga har qanday savolda yordam berish! 😊`;
    }

    if (/sevaman|yoqadi|qiziq|eng yaxshi|sevimli/.test(p) && !/klub|sport|futbol/.test(p)) {
      if (/nima sevasan|nima yoqadi|sevimli narsang/.test(p)) {
        return `😊 **Mening sevimli narsalarim:**\n\n- 🧠 Murakkab savollarni yechish\n- 💬 Odamlar bilan suhbatlashish\n- 🌍 Yangi bilimlar ulashish\n- 💻 Kod yozishga yordam berish\n\nSizning sevimli mashg'ulotingiz nima? 😊`;
      }
    }

    if (/necha yosh|qancha yosh|yoshingiz|nechasiz/.test(p)) {
      return `🤖 **Yoshim haqida:**\n\nMen sun'iy intellektman, shuning uchun "yosh" tushunchasi menga to'g'ri kelmaydi 😄\nLekin har kuni yangi bilimlar bilan "o'sib" boraman!\n\nSizning yoshingiz qancha? 😊`;
    }

    return null;
  }

  // ==============================================================
  // MANTIQIY MASALALAR (Topishmoqlar, Mantiqiy savollar)
  // ==============================================================
  function checkLogicalPuzzle(promptText) {
    const p = promptText.toLowerCase().trim();
    if (!/mantiq|topishmoq|jumboq|puzzle|qiziq savol|qiyin savol|o'yla|fikrla|test/.test(p)) return null;

    // Mashhur mantiqiy masalalar
    const puzzles = [
      {
        s: `🧠 **Mantiqiy Masala #1:**\n\n> Qancha ko'p olib chiqsang, u shuncha katta bo'ladi. Bu nima?\n\n<details>\n<summary>💡 Javobni ko'rish</summary>\n\n**Javob: Chuqurlik (Teshik)**\n*Qancha ko'p yerini olib chiqsang, chuqur shuncha katta bo'ladi!*\n</details>`
      },
      {
        s: `🧠 **Mantiqiy Masala #2:**\n\n> Men har doim oldingda boraman, lekin ko'ra olmaysan. Bu nima?\n\n<details>\n<summary>💡 Javobni ko'rish</summary>\n\n**Javob: Kelajak**\n*Kelajak doim oldingda, lekin hali ko'rinmaydi!*\n</details>`
      },
      {
        s: `🧠 **Mantiqiy Masala #3:**\n\n> 2 ota va 2 o'g'il ovga ketishdi. Har biri bittadan quyonni tutdi. Lekin uyga 3 ta quyon olib kelindi. Qanday qilib?\n\n<details>\n<summary>💡 Javobni ko'rish</summary>\n\n**Javob:** Ular 3 kishi edi: **Bobo, Ota va O'g'il**\n- Bobo — ota uchun ota\n- Ota — ham ota, ham o'g'il\n- O'g'il — kichik o'g'il\nShunday qilib 2 "ota" va 2 "o'g'il" bo'lgan, lekin jami 3 kishi!*\n</details>`
      },
      {
        s: `🧠 **Mantiqiy Masala #4:**\n\n> Qaysi so'zni noto'g'ri yozsang ham to'g'ri bo'ladi?\n\n<details>\n<summary>💡 Javobni ko'rish</summary>\n\n**Javob: "Noto'g'ri"**\n*"Noto'g'ri" so'zini noto'g'ri yozsang — u to'g'ri bo'ladi!* 😄\n</details>`
      },
      {
        s: `🧠 **Mantiqiy Masala #5:**\n\n> Stolda 3 ta olma bor edi. Sen 2 tasini oldingiz. Stolda nechta olma qoldi?\n\n<details>\n<summary>💡 Javobni ko'rish</summary>\n\n**Javob: 2 ta!**\n*Sen 2 ta olma **oldingiz** — ular hozir senda! Stolda 1 ta qoldi... yoki yo'qmi? Aslida savol "stolda nechta qoldi" emas, "senda nechta" deyapti! Javob: **senda 2 ta** olma bor!* 😄\n</details>`
      }
    ];

    const random = puzzles[Math.floor(Math.random() * puzzles.length)];
    return random.s + `\n\n🎯 *Yana mantiqiy masala uchun: "mantiqiy masala ber" deb yozing!*`;
  }

  // ==============================================================
  // TIL TIZIMI — tanlangan tilda yozish, gapirish, mikrofon
  // ==============================================================

  // Tanlangan til uchun AI system prompt
  function getLangSystemPrompt() {
    if (currentLanguage === 'ru-RU') return 'Отвечай ТОЛЬКО на русском языке. Будь дружелюбным, чётким и понятным.';
    if (currentLanguage === 'en-US') return 'Answer ONLY in English. Be friendly, clear and helpful.';
    return "Faqat O'zbek tilida javob ber. Do'stona, aniq va tushunarli bo'l.";
  }

  // Javobni tanlangan tilga o'girish (Pollinations AI orqali)
  async function translateResponseIfNeeded(text) {
    if (currentLanguage === 'uz-UZ') return text;

    const toLang = currentLanguage === 'ru-RU' ? 'ru' : 'en';

    // Markdown va HTML tozalash
    const plain = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/[*_#`~]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .substring(0, 800);

    if (!plain || plain.length < 3) return text;

    try {
      const inst = toLang === 'ru'
        ? `Переведи этот текст на русский язык. Только перевод без пояснений:\n${plain}`
        : `Translate this text to English. Only translation without explanations:\n${plain}`;

      const url = `https://text.pollinations.ai/${encodeURIComponent(inst)}?seed=99`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);

      if (res.ok) {
        const out = (await res.text()).trim();
        if (out && out.length > 3
          && !out.includes('&#')
          && !out.includes('&amp;')
          && !out.includes('402')
          && !/^error/i.test(out)) {
          return out;
        }
      }
    } catch (e) {}

    return text; // internet yo'q — asl matn
  }

  // ==============================================================
  // MAIN CONTROLLER
  // ==============================================================
  async function generateUniversalAIResponse(prompt) {
    const p = prompt.toLowerCase().trim();
    const isUz = currentLanguage === 'uz-UZ';
    const isRu = currentLanguage === 'ru-RU';
    const isEn = currentLanguage === 'en-US';

    // Math — barcha tillarda bir xil
    const mathR = trySolveMath(prompt);
    if (mathR) return mathR;

    // Kod — tarjima kerak emas
    const codeR = checkCodingHelp(prompt);
    if (codeR) return codeR;

    // UZ da — built-in javoblar o'zbekcha
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

    // EN yoki RU da — to'g'ridan Pollinations AI tanlangan tilda
    setAIState('processing');
    const answer = await askPollinationsInLang(prompt);
    if (answer && answer.length > 5) return answer;

    // Pollinations ishlamasa — built-in javoblarni tegishli tilda qaytarish
    if (isRu) {
      if (/сало|привет|здравствуй|здравствуйте|добр/i.test(p))
        return `👋 Привет! Я **JARVIS AI** — ваш умный голосовой помощник!\n\nЯ умею:\n- ⚽ Спорт и клубы: Arsenal, Real Madrid, Messi...\n- 🐾 Животные: любая информация\n- 🔤 Переводы: на все языки\n- 🧮 Математика и логика`;
      if (/ты кто|кто ты|что ты|jarvis/i.test(p))
        return `🤖 Я **JARVIS AI** — универсальный голосовой помощник!\n\nЗнаю всё о спорте, животных, переводах, программировании и многом другом. Задайте любой вопрос!`;
      return `🤖 **JARVIS AI:** Ваш вопрос получен. Попробуйте спросить о спорте, животных, переводе или математике!`;
    }
    if (isEn) {
      if (/^(hello|hi|hey|greetings)/i.test(p))
        return `👋 Hello! I'm **JARVIS AI** — your smart voice assistant!\n\nI know about:\n- ⚽ Sports & Clubs: Arsenal, Real Madrid, Messi...\n- 🐾 Animals: any information\n- 🔤 Translation: all languages\n- 🧮 Math & logic`;
      if (/who are you|what are you|jarvis/i.test(p))
        return `🤖 I'm **JARVIS AI** — a universal voice assistant!\n\nI know everything about sports, animals, translation, coding and much more. Ask me anything!`;
      return `🤖 **JARVIS AI:** Question received. Try asking about sports, animals, translation or math!`;
    }
    return getSmartOfflineResponse(prompt);
  }

  // Tanlangan tilda to'g'ridan Pollinations AI dan javob olish
  async function askPollinationsInLang(userPrompt) {
    try {
      const sysPrompt = getLangSystemPrompt();
      const url = `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(sysPrompt)}&seed=42`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok) {
        const text = (await res.text()).trim();
        if (text && text.length > 5 && !text.includes('402') && !/^error/i.test(text)) {
          return text;
        }
      }
    } catch (e) {}
    return null;
  }

  // Tanlangan tilda AI javob olish
  async function fetchAIResponseWithLang(userPrompt) {
    // Wikipedia dan avval
    const wikiResult = await fetchWikipediaSummary(userPrompt);
    if (wikiResult) return wikiResult;

    // Pollinations AI — tanlangan til bilan
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

  // ==============================================================
  // CHAT TARIXI — localStorage orqali saqlash/yuklash
  // ==============================================================

  function getChatHistory() {
    try { return JSON.parse(localStorage.getItem('jarvis_chats') || '[]'); } catch { return []; }
  }

  function saveChatHistory(chats) {
    try { localStorage.setItem('jarvis_chats', JSON.stringify(chats)); } catch {}
  }

  function getCurrentChatMessages() {
    const chats = getChatHistory();
    const chat = chats.find(c => c.id === currentChatId);
    return chat ? chat.messages : [];
  }

  function saveCurrentChat() {
    if (!currentChatId) return;
    const chats = getChatHistory();
    const idx = chats.findIndex(c => c.id === currentChatId);
    const firstUserMsg = currentChatMessages.find(m => m.sender === 'user');
    const title = firstUserMsg
      ? firstUserMsg.text.substring(0, 40) + (firstUserMsg.text.length > 40 ? '...' : '')
      : 'Yangi chat';
    const chatObj = {
      id: currentChatId,
      title,
      date: new Date().toLocaleDateString('uz-UZ'),
      messages: currentChatMessages
    };
    if (idx >= 0) {
      chats[idx] = chatObj;
    } else {
      chats.unshift(chatObj);
    }
    saveChatHistory(chats);
    renderHistoryList();
  }

  function startNewChat() {
    // Avvalgi chatni saqlash (xabar bo'lsa)
    if (currentChatMessages.length > 0) {
      saveCurrentChat();
    }
    // Yangi chat ID
    currentChatId = 'chat_' + Date.now();
    currentChatMessages = [];
    // Yangi chat ekranini ko'rsat
    if (chatContainer) chatContainer.innerHTML = `
      <div class="chat-message assistant-message">
        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="message-content">
          <div class="message-header"><span class="author-name">JARVIS AI</span><span class="time-stamp">Hozir</span></div>
          <div class="message-text"><p>Yangi chat boshlandi! 🚀 Savolingizni yozing yoki mikrofonga gapiring.</p></div>
        </div>
      </div>`;
    // Tarix ro'yxatini yangilab active ni ko'rsat
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
    // Saqlanган xabarlarni ko'rsat
    currentChatMessages.forEach(msg => {
      appendChatMessageDOM(msg.sender, msg.text, msg.time);
    });
    renderHistoryList();
  }

  function deleteChat(chatId, e) {
    e.stopPropagation();
    const chats = getChatHistory().filter(c => c.id !== chatId);
    saveChatHistory(chats);
    if (currentChatId === chatId) startNewChat();
    else renderHistoryList();
  }

  function renderHistoryList() {
    if (!historyList) return;
    const chats = getChatHistory();
    if (chats.length === 0) {
      historyList.innerHTML = `<div class="history-empty"><i class="fa-solid fa-comment-slash"></i><span>Hali chat yo'q</span></div>`;
      return;
    }
    historyList.innerHTML = chats.map(chat => `
      <div class="history-item ${chat.id === currentChatId ? 'active' : ''}" data-id="${chat.id}">
        <div class="history-item-icon"><i class="fa-solid fa-message"></i></div>
        <div class="history-item-info">
          <div class="history-item-title">${escapeHTML(chat.title)}</div>
          <div class="history-item-date">${chat.date}</div>
        </div>
        <button class="history-delete-btn" data-id="${chat.id}" title="O'chirish">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `).join('');

    historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => loadChat(el.dataset.id));
    });
    historyList.querySelectorAll('.history-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => deleteChat(btn.dataset.id, e));
    });
  }

  // Sahifa yuklanganda — oxirgi chatni yoki yangi chat boshlash
  function initChat() {
    const chats = getChatHistory();
    if (chats.length > 0) {
      // Oxirgi chatni ochish
      currentChatId = chats[0].id;
      currentChatMessages = chats[0].messages || [];
      if (chatContainer) {
        chatContainer.innerHTML = '';
        currentChatMessages.forEach(msg => appendChatMessageDOM(msg.sender, msg.text, msg.time));
      }
    } else {
      // Birinchi marta — yangi chat ID
      currentChatId = 'chat_' + Date.now();
      currentChatMessages = [];
    }
    renderHistoryList();
    // Sahifa yopilganda chatni saqlash
    window.addEventListener('beforeunload', () => {
      if (currentChatMessages.length > 0) saveCurrentChat();
    });
  }

  // Chat UI logic
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
    // Xabarni ro'yxatga qo'shish
    currentChatMessages.push({ sender, text, time: timeStr });
    // Darhol localStorage ga saqlash
    saveCurrentChat();
    // Ekranda ko'rsat
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
      </div>
    `;
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
        if (!inList || listType !== 'ul') {
          if (inList) body += `</${listType}>`;
          body += '<ul>'; inList = true; listType = 'ul';
        }
        body += `<li>${t.substring(2)}</li>`;
      } else if (/^\d+\.\s/.test(t)) {
        if (!inList || listType !== 'ol') {
          if (inList) body += `</${listType}>`;
          body += '<ol>'; inList = true; listType = 'ol';
        }
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
    currentLanguage = 'uz-UZ';
    langUzBtn.classList.add('active');
    langEnBtn?.classList.remove('active');
    langRuBtn?.classList.remove('active');
    if (recognition) recognition.lang = 'uz-UZ';
  });
  if (langEnBtn) langEnBtn.addEventListener('click', () => {
    currentLanguage = 'en-US';
    langEnBtn.classList.add('active');
    langUzBtn?.classList.remove('active');
    langRuBtn?.classList.remove('active');
    if (recognition) recognition.lang = 'en-US';
  });
  if (langRuBtn) langRuBtn.addEventListener('click', () => {
    currentLanguage = 'ru-RU';
    langRuBtn.classList.add('active');
    langUzBtn?.classList.remove('active');
    langEnBtn?.classList.remove('active');
    if (recognition) recognition.lang = 'ru-RU';
  });

  // Ilovani ishga tushirish
  initChat();

});