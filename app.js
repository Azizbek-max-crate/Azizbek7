/**
 * ============================================================
 * JARVIS AI — app.js (YANGILANGAN VERSIYA)
 * ============================================================
 * Yangiliklar:
 * ✅ math.js — xavfsiz matematik hisoblash
 * ✅ marked.js — to'liq markdown render
 * ✅ Chat tarixi 50 ga limitlangan
 * ✅ TTS UZ uchun ogohlantirish xabari
 * ✅ Typing indicator (AI yozmoqda...)
 * ✅ Regenerate button (har bir AI javob ostida)
 * ✅ Dark/Light tema toggle
 * ✅ API timeout 12 sekund (5 dan ko'tarildi)
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('JARVIS AI initializing... (Enhanced Version)');

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

  // ============================================================
  // TEMA TOGGLE (Dark ↔ Light)
  // ============================================================
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

  // ============================================================
  // SPEECH RECOGNITION (STT)
  // ============================================================
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

  // ============================================================
  // TEXT-TO-SPEECH (TTS) + UZ OGOHLANTIRISH
  // ============================================================
  let cachedVoices = [];
  function populateVoices() {
    if (window.speechSynthesis) cachedVoices = window.speechSynthesis.getVoices();
  }
  populateVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }

  function speakResponse(text) {
    if (!ttsEnabled || !window.speechSynthesis) return;

    // UZ tanlangan bo'lsa — ovoz mavjud emas, xabar ko'rsat
    if (currentLanguage === 'uz-UZ') {
      console.info('TTS: O\'zbek ovozi mavjud emas. Ingliz ovozi ishlatiladi.');
      // Foydalanuvchiga xabar ko'rsatish (birinchi marta)
      if (!localStorage.getItem('jarvis_tts_uz_notice')) {
        showTTSNotice();
        localStorage.setItem('jarvis_tts_uz_notice', '1');
      }
      // Ingliz ovozida o'qish
      currentLanguage = 'en-US';
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

  function showTTSNotice() {
    const notice = document.createElement('div');
    notice.className = 'tts-notice';
    notice.innerHTML = '💡 O\'zbek tilida ovoz mavjud emas. Ingliz ovozi ishlatiladi.';
    notice.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(0,242,254,0.15);border:1px solid rgba(0,242,254,0.3);padding:8px 16px;border-radius:999px;font-size:12px;z-index:9999;animation:fadeIn 0.3s ease;';
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 5000);
  }

  // ============================================================
  // AI STATE MANAGER
  // ============================================================
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

  // ============================================================
  // TYPING INDICATOR
  // ============================================================
  let typingIndicatorEl = null;

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

  // ============================================================
  // MATH.JS — Xavfsiz matematik hisoblash (eval o'rniga)
  // ============================================================
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

      // math.js mavjud bo'lsa — xavfsiz hisoblash
      if (typeof math !== 'undefined') {
        // Faqat raqam va operatorlar borligini tekshirish
        if (/[0-9]/.test(cleanExpr) && /[+\-*/^().]/.test(cleanExpr)) {
          const result = math.evaluate(cleanExpr);
          if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            return `**🧮 Matematik Yechim:**\n\n\`\`\`\nIfoda: ${cleanExpr}\nNatija: ${result}\n\`\`\`\n\n**Javob: ${result}**`;
          }
        }
      } else {
        // math.js yuklanmagan — oddiy regex test bilan
        if (/^[0-9.\s+\-*/()^** ]+$/.test(cleanExpr) && /[0-9]/.test(cleanExpr)) {
          // Xavfsiz: faqat raqamlar va arifmetik operatorlar
          const result = Function('"use strict"; return (' + cleanExpr + ')')();
          if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            return `**🧮 Matematik Yechim:**\n\n\`\`\`\nIfoda: ${cleanExpr}\nNatija: ${result}\n\`\`\`\n\n**Javob: ${result}**`;
          }
        }
      }
    } catch (e) {}
    return null;
  }

  // Multi-number word math
  function tryWordMath(promptText) {
    const p = promptText.toLowerCase();
    const nums = promptText.match(/\d+/g);
    if (!nums || nums.length < 2) return null;

    let itemMatch = promptText.match(/\b(olma|nok|behi|daftar|qalam|kitob|tuxum|mashina|bola|odam|qovoq|limon|uzum|pul|so'm)\b/i);
    let item = itemMatch ? itemMatch[0] : 'ta';
    let total = parseInt(nums[0], 10);

    if (nums.length === 2) {
      const n2 = parseInt(nums[1], 10);
      if (/yedi|yeb|ayir|sotdi|ishlat|yo.qol|ketdi|qoldi/.test(p))
        return `🧮 **Masala yechimi:**\n\n${total} - ${n2} = **${total - n2}**\n\nJavob: Sizda **${total - n2} ${item}** qoldi.`;
      if (/qo.sh|qosh|oldim|berdi|jami|bo.ldi|boldi/.test(p))
        return `🧮 **Masala yechimi:**\n\n${total} + ${n2} = **${total + n2}**\n\nJavob: Jami **${total + n2} ${item}** bo'ldi.`;
    }
    if (nums.length === 3) {
      const n2 = parseInt(nums[1], 10);
      const n3 = parseInt(nums[2], 10);
      const res = total + n2 - n3;
      return `🧮 **Masala yechimi:**\n\n${nums[0]} + ${n2} - ${n3} = **${res}**\n\nJavob: Sizda **${res} ${item}** qoldi.`;
    }
    return null;
  }

  // ============================================================
  // IDENTITY / GREETING CHECK
  // ============================================================
  function checkIdentityOrGreeting(promptText) {
    const p = promptText.toLowerCase().trim();
    if (/sen kim|kim san|kim siz|o'zing|ozing|jarvis|qalaysiz|qalaysan|salom|assalom|kim bu/i.test(p) ||
        /o'zing haqida|ozing haqida|sen kimsan|kim kimsan|sen kimsiz/i.test(p)) {
      return `🤖 **Men JARVIS AI — Sizning Intellektual Ovozli Yordamchingizman!**\n\nMen dunyodagi barcha bilimlarga ega AI yordamchisiman:\n- ⚽ **Sport va Klublar:** Arsenal, Real Madrid, Barcelona, Man City va barcha jamoalar\n- 🥊 **Boks va UFC:** Bakhodir Jalolov, Mike Tyson, Khabib va barcha sportchilar\n- 🐾 **Hayvonlar:** Qo'y, fil, sher, ot va barcha hayvonlarning yashash yillari va xususiyatlari\n- 🔤 **Tarjima:** Inglizcha, o'zbekcha, ruscha va barcha tillardan UZUN GAPLARNI tarjima qilish\n- 🧮 **Matematika:** Har qanday misollar va masalalar\n\nIstalgan savolingizni bering!`;
    }
    return null;
  }

  // ============================================================
  // UNIVERSAL TARJIMA TIZIMI
  // ============================================================
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
    if (!/tarjima|inglizchaga|inglizcha|o'zbekchaga|ozbekchaga|ruschaga|ruschadan|ruschada|rus\s*tiliga|ingliz\s*tiliga|nima\s*degani|nima\s*bo'ladi|nima\s*boladi/.test(p)) return null;
    if (/^tarjima\s*[?!.]?$/.test(p)) {
      return `🔤 **Universal Tarjima Xizmati**\n\n**So'z ham, uzun gap ham — 4 yo'nalishda tarjima!**\n\n🇺🇿➡️🇬🇧 *inglizchaga tarjima: Men bugun maktabga bordim*\n🇬🇧➡️🇺🇿 *o'zbekchaga tarjima: I went to school today*\n🇺🇿➡️🇷🇺 *ruschaga tarjima: Bugun ob-havo juda yaxshi*\n🇷🇺➡️🇺🇿 *ruschadan o'zbekchaga: Сегодня очень хорошая погода*\n\n💡 Internet bo'lmasa — zaxira lug'at ishlaydi!`;
    }

    const dir = _transDirection(p);
    if (!dir) return null;
    const txt = _transExtract(promptText);

    if (!txt || txt.length < 1) {
      const ex = dir.to === 'Inglizcha'   ? 'inglizchaga tarjima: Men bugun maktabga bordim'
               : dir.to === 'Ruscha'      ? 'ruschaga tarjima: Bugun ob-havo yaxshi'
               :                            "o'zbekchaga tarjima: I went to school today";
      return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\nTarjima qilmoqchi bo'lgan matnni yozing!\n\n📌 *Misol: "${ex}"*`;
    }

    // 1. MyMemory API
    const langMap = { 'Inglizcha': 'en', "O'zbekcha": 'uz', "Inglizcha/Ruscha": 'en', 'Ruscha': 'ru' };
    const fromLang = langMap[dir.from] || 'uz';
    const toLang   = langMap[dir.to]   || 'en';
    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(txt)}&langpair=${fromLang}|${toLang}`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 12000);
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

    // 2. Pollinations AI (12 sec timeout)
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

    // 3. Zaxira lug'at
    const dk = dir.to === 'Inglizcha'  ? 'uz_en'
             : dir.from === 'Ruscha'   ? 'ru_uz'
             : dir.to === 'Ruscha'     ? 'uz_ru'
             :                           'en_uz';
    const dict = _offDict[dk];
    const lower = txt.toLowerCase().trim();
    if (dict[lower]) {
      return `🔤 **${dir.from} → ${dir.to} Tarjima** *(oflayn lug'at)*:\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${dict[lower]}\n\n⚠️ *Internet bo'lsa uzun gaplar ham tarjima qilinadi.*`;
    }
    const words = lower.split(/\s+/);
    if (words.length <= 6) {
      const translated = words.map(w => dict[w] || w).join(' ');
      if (translated !== lower) {
        return `🔤 **${dir.from} → ${dir.to} Tarjima** *(oflayn lug'at)*:\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${translated}\n\n⚠️ *Internet bo'lsa to'liq va aniq tarjima bo'ladi.*`;
      }
    }

    return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\n📝 **Asl matn:** "${txt}"\n\n⚠️ **Internet aloqasi yo'q.** Ulanishni tekshiring va qayta urinib ko'ring!\n\n💡 *Internetda so'z ham, uzun gap ham to'liq tarjima qilinadi.*`;
  }

  // ============================================================
  // WIKIPEDIA REAL KNOWLEDGE API (12 sec timeout)
  // ============================================================
  async function fetchWikipediaSummary(promptText) {
    try {
      const p = promptText.toLowerCase().trim();
      if (/^(sen|siz|men|biz|u|o'zing|ozing|salom|hi|hello)$/.test(p) || checkIdentityOrGreeting(p)) return null;

      let cleanQuery = promptText.toLowerCase()
        .replace(/(haqida|ma'lumot|malumat|ber|aytib|kim|qaysi|haqda|nima|qanday|qancha|yil|yashaydi|qulub)/gi, '')
        .replace(/qulub/g, 'klub').trim();

      if (!cleanQuery || cleanQuery.length < 2 || /^(sen|siz|men|biz|u|o'zing|ozing)$/.test(cleanQuery)) cleanQuery = promptText.trim();
      if (/^(sen|siz|men|biz|u|o'zing|ozing)$/.test(cleanQuery)) return null;
      if (cleanQuery.includes('qulub')) cleanQuery = cleanQuery.replace('qulub', 'klub');
      if (cleanQuery === 'mbappe' || cleanQuery === 'mbappé') cleanQuery = 'Kylian Mbappé';

      // 1. UZ Wikipedia (12 sec)
      const searchUrl = `https://uz.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&origin=*`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 12000);
      const searchRes = await fetch(searchUrl, { signal: ctrl.signal });
      clearTimeout(tid);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData?.query?.search?.length > 0) {
          const topTitle = searchData.query.search[0].title;
          if (topTitle.toLowerCase().includes("o'zing") || topTitle.toLowerCase().includes("san marino")) {
            if (/sen|o'zing|ozing/i.test(promptText)) return null;
          }
          const summaryUrl = `https://uz.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
          const ctrl2 = new AbortController();
          const tid2 = setTimeout(() => ctrl2.abort(), 12000);
          const summaryRes = await fetch(summaryUrl, { signal: ctrl2.signal });
          clearTimeout(tid2);
          if (summaryRes.ok) {
            const sumData = await summaryRes.json();
            if (sumData?.extract && sumData.extract.length > 20) {
              let icon = '🌐';
              if (/klub|futbol|sport|match|team|arsenal|real|barca/i.test(promptText)) icon = '⚽';
              else if (/hayvon|qo'y|fil|sher|ot|mushuk|it|qush/i.test(promptText)) icon = '🐾';
              else if (/boks|ufc|mma|jalolov/i.test(promptText)) icon = '🥊';
              let resText = `**${icon} ${sumData.title}**\n\n`;
              if (sumData.description) resText += `*📌 ${sumData.description}*\n\n`;
              let extract = sumData.extract;
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

      // 2. EN Wikipedia (12 sec)
      const enSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&origin=*`;
      const ctrl3 = new AbortController();
      const tid3 = setTimeout(() => ctrl3.abort(), 12000);
      const enSearchRes = await fetch(enSearchUrl, { signal: ctrl3.signal });
      clearTimeout(tid3);
      if (enSearchRes.ok) {
        const enSearchData = await enSearchRes.json();
        if (enSearchData?.query?.search?.length > 0) {
          const topTitle = enSearchData.query.search[0].title;
          const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
          const ctrl4 = new AbortController();
          const tid4 = setTimeout(() => ctrl4.abort(), 12000);
          const summaryRes = await fetch(summaryUrl, { signal: ctrl4.signal });
          clearTimeout(tid4);
          if (summaryRes.ok) {
            const sumData = await summaryRes.json();
            if (sumData?.extract && sumData.extract.length > 20) {
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

  // ============================================================
  // POLLINATIONS AI (12 sec timeout)
  // ============================================================
  async function fetchAIResponse(userPrompt) {
    const wikiResult = await fetchWikipediaSummary(userPrompt);
    if (wikiResult) return wikiResult;

    try {
      const systemPrompt = `Siz JARVIS AI — dunyodagi barcha bilimlarga ega bo'lgan universal intellektual yordamchisiz. Barcha sport turlari, barcha kulublar (Arsenal, Real Madrid, Barca va barcha jamoalar), barcha sportchilar (Mbappe, Messi, Ronaldo, Jalolov), barcha hayvonlar (qo'y, fil, sher va barcha turlar) hamda har qanday savolga o'zbek tilida aniq va chiroyli javob bering.`;
      const encodedPrompt = encodeURIComponent(userPrompt);
      const encodedSystem = encodeURIComponent(systemPrompt);
      const url = `https://text.pollinations.ai/${encodedPrompt}?system=${encodedSystem}&seed=42`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

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

  // ============================================================
  // MAIN AI ENGINE
  // ============================================================
  async function generateUniversalAIResponse(prompt) {
    // 1. Math first
    const mathR = trySolveMath(prompt);
    if (mathR) return mathR;

    const wordMathR = tryWordMath(prompt);
    if (wordMathR) return wordMathR;

    // 2. Translation
    const transR = await checkTranslationQuery(prompt);
    if (transR) return transR;

    // 3. Identity
    const idR = checkIdentityOrGreeting(prompt);
    if (idR) return idR;

    // 4. Live AI
    setAIState('processing');
    const live = await fetchAIResponse(prompt);
    if (live && live.length > 5) return live;

    // 5. Fallback
    return `🤖 **JARVIS AI:**\n\nSiz kiritgan **"${prompt}"** bo'yicha javob topilmadi. Internet ulanishini tekshiring yoki boshqa savol bering.\n\n📌 **Sinab ko'ring:**\n- ⚽ *"Arsenal qaysi klub"*\n- 🎾 *"Tenis haqida"*\n- 🐾 *"Qo'y qancha yil yashaydi"*\n- 🧮 *"25 * 4 + 100 necha bo'ladi"*`;
  }

  // ============================================================
  // CHAT HISTORY (localStorage, 50 chat limit)
  // ============================================================
  function getChatHistory() {
    try { return JSON.parse(localStorage.getItem('jarvis_chats') || '[]'); } catch { return []; }
  }

  function saveChatHistory(chats) {
    try {
      // 50 chatdan ko'p bo'lsa — eski chatlarni o'chirish
      if (chats.length > 50) {
        chats.splice(50);
      }
      localStorage.setItem('jarvis_chats', JSON.stringify(chats));
    } catch {}
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

  function initChat() {
    const chats = getChatHistory();
    if (chats.length > 0) {
      currentChatId = chats[0].id;
      currentChatMessages = chats[0].messages || [];
      if (chatContainer) {
        chatContainer.innerHTML = '';
        currentChatMessages.forEach(msg => appendChatMessageDOM(msg.sender, msg.text, msg.time));
      }
    } else {
      currentChatId = 'chat_' + Date.now();
      currentChatMessages = [];
    }
    renderHistoryList();
    window.addEventListener('beforeunload', () => {
      if (currentChatMessages.length > 0) saveCurrentChat();
    });
  }

  // ============================================================
  // CHAT UI LOGIC + REGENERATE
  // ============================================================
  async function handleUserPrompt(promptText, isRegenerate = false) {
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
      appendChatMessage('assistant', response, text);
      speakResponse(response);
    }, 150);
  }

  function appendChatMessage(sender, text, originalPrompt = '') {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentChatMessages.push({ sender, text, time: timeStr, originalPrompt });
    saveCurrentChat();
    appendChatMessageDOM(sender, text, timeStr, originalPrompt);
  }

  function appendChatMessageDOM(sender, text, timeStr, originalPrompt = '') {
    if (!chatContainer) return;
    const div = document.createElement('div');
    div.className = `chat-message ${sender}-message`;
    if (!timeStr) {
      const now = new Date();
      timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const icon = sender === 'assistant' ? 'fa-robot' : 'fa-user';
    const name = sender === 'assistant' ? 'JARVIS AI' : 'Siz';

    // marked.js bilan markdown render
    const formattedText = (typeof marked !== 'undefined')
      ? marked.parse(text)
      : formatMarkdown(text);

    div.innerHTML = `
      <div class="avatar"><i class="fa-solid ${icon}"></i></div>
      <div class="message-content">
        <div class="message-header"><span class="author-name">${name}</span><span class="time-stamp">${timeStr}</span></div>
        <div class="message-text">${formattedText}</div>
        ${sender === 'assistant' && originalPrompt ? `<button class="regenerate-btn" data-prompt="${escapeHTML(originalPrompt)}"><i class="fa-solid fa-rotate-right"></i> Qayta javob</button>` : ''}
      </div>
    `;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Copy code button
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

    // Regenerate button
    div.querySelectorAll('.regenerate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        if (prompt) {
          // Oxirgi AI javobni o'chirish
          const lastAssistantIndex = currentChatMessages.length - 1;
          if (currentChatMessages[lastAssistantIndex]?.sender === 'assistant') {
            currentChatMessages.splice(lastAssistantIndex, 1);
            saveCurrentChat();
            div.remove();
          }
          handleUserPrompt(prompt, true);
        }
      });
    });
  }

  // Fallback markdown formatter (agar marked.js yuklanmasa)
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

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
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

  // Initialize App
  initChat();

});
