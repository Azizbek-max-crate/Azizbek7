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
    particles.forEach(p => { p.update(activeState); p.draw(ctx, activeState); });
    requestAnimationFrame(renderOrb);
  }
  if (ctx) renderOrb();

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

  // ============================================================
  // TEXT-TO-SPEECH (TTS)
  // ============================================================
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

  // ============================================================
  // AI STATE MANAGER
  // ============================================================
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

  // ============================================================
  // MATH SOLVER
  // ============================================================
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

  // ============================================================
  // IDENTITY & GREETING
  // ============================================================
  function checkIdentityOrGreeting(promptText) {
    const p = promptText.toLowerCase().trim();
    if (/sen kim|kim san|kim siz|o'zing|ozing|jarvis|qalaysiz|qalaysan|salom|assalom|kim bu/i.test(p) ||
        /o'zing haqida|ozing haqida|sen kimsan|kim kimsan|sen kimsiz/i.test(p)) {
      return `🤖 **Men JARVIS AI — Sizning Intellektual Ovozli Yordamchingizman!**\n\nMen dunyodagi barcha bilimlarga ega AI yordamchisiman:\n- ⚽ **Sport va Klublar:** Arsenal, Real Madrid, Barcelona, Man City va barcha jamoalar\n- 🥊 **Boks va UFC:** Bakhodir Jalolov, Mike Tyson, Khabib va barcha sportchilar\n- 🐾 **Hayvonlar:** Qo'y, fil, sher, ot va barcha hayvonlarning yashash yillari va xususiyatlari\n- 🔤 **Tarjima:** Inglizcha, o'zbekcha, ruscha va barcha tillardan UZUN GAPLARNI tarjima qilish\n- 🧮 **Matematika:** Har qanday misollar va masalalar\n- 💻 **Java & IntelliJ IDEA:** OOP, to'plamlar, Stream API, Spring Boot va boshqa barcha mavzular\n\nIstalgan savolingizni bering!`;
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
      const ex = dir.to === 'Inglizcha' ? 'inglizchaga tarjima: Men bugun maktabga bordim'
               : dir.to === 'Ruscha'    ? 'ruschaga tarjima: Bugun ob-havo yaxshi'
               :                          "o'zbekchaga tarjima: I went to school today";
      return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\nTarjima qilmoqchi bo'lgan matnni yozing!\n\n📌 *Misol: "${ex}"*`;
    }

    const langMap = { 'Inglizcha': 'en', "O'zbekcha": 'uz', "Inglizcha/Ruscha": 'en', 'Ruscha': 'ru' };
    const fromLang = langMap[dir.from] || 'uz';
    const toLang   = langMap[dir.to]   || 'en';

    // 1. MyMemory API
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(txt)}&langpair=${fromLang}|${toLang}`, { signal: ctrl.signal });
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

    // 2. Pollinations zaxira
    try {
      const ctrl2 = new AbortController();
      const tid2 = setTimeout(() => ctrl2.abort(), 12000);
      const res2 = await fetch(`https://text.pollinations.ai/${encodeURIComponent(dir.ai + txt)}`, { signal: ctrl2.signal });
      clearTimeout(tid2);
      if (res2.ok) {
        const out2 = (await res2.text()).trim();
        if (out2 && out2.length > 0 && !out2.includes('402') && !/^error/i.test(out2) && out2.length < 2000) {
          return `🔤 **${dir.from} → ${dir.to} Tarjima:**\n\n📝 **Asl matn:** ${txt}\n\n${dir.flag} **Tarjima:** ${out2}`;
        }
      }
    } catch (e) {}

    // 3. Oflayn lug'at
    const dk = dir.to === 'Inglizcha' ? 'uz_en' : dir.from === 'Ruscha' ? 'ru_uz' : dir.to === 'Ruscha' ? 'uz_ru' : 'en_uz';
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
  // CODING HELP — Java, Python, JS, HTML, CSS, IntelliJ IDEA
  // ============================================================
  function checkCodingHelp(promptText) {
    const p = promptText.toLowerCase().trim();
    if (!/kod|code|python|java|javascript|html|css|intellij|idea|dastur|funksiya|loop|for|while|class|function|variable|o'zgaruvchi|array|list|print|console|error|bug|debug|syntax|oop|interface|abstract|extends|implements|override|constructor|inheritance|polymorphism|encapsulation|exception|try|catch|finally|throw|generics|collections|arraylist|hashmap|linkedlist|stream|lambda|thread|runnable|jdbc|maven|gradle|spring|hibernate|interface|enum|record|iterator|comparator|comparable|pattern|singleton|factory|observer|builder/.test(p)) return null;

    // JAVA — OOP asoslari
    if (/java/.test(p) && !/javascript/.test(p)) {
      if (/oop|obyekt|object|klass|class/.test(p) && !/abstract|interface|inherit/.test(p)) {
        return `☕ **Java — OOP (Object Oriented Programming):**\n\n\`\`\`java\n// Class va Object\npublic class Odam {\n    // Fields (maydonlar)\n    private String ism;\n    private int yosh;\n\n    // Constructor\n    public Odam(String ism, int yosh) {\n        this.ism = ism;\n        this.yosh = yosh;\n    }\n\n    // Getter/Setter\n    public String getIsm() { return ism; }\n    public void setIsm(String ism) { this.ism = ism; }\n\n    // Method\n    public void salomlash() {\n        System.out.println("Salom, men " + ism + ", " + yosh + " yoshdaman!");\n    }\n\n    public static void main(String[] args) {\n        Odam o = new Odam("Ali", 20);\n        o.salomlash(); // Salom, men Ali, 20 yoshdaman!\n    }\n}\n\`\`\`\n\n📌 **OOP 4 tamoyili:** Encapsulation, Inheritance, Polymorphism, Abstraction`;
      }

      if (/inherit|extends|nasl|meros/.test(p)) {
        return `☕ **Java — Inheritance (Meros olish):**\n\n\`\`\`java\n// Parent class\npublic class Hayvon {\n    String nomi;\n    public Hayvon(String nomi) { this.nomi = nomi; }\n    public void ovqatlan() {\n        System.out.println(nomi + " ovqatlanmoqda...");\n    }\n}\n\n// Child class\npublic class It extends Hayvon {\n    String zoti;\n    public It(String nomi, String zoti) {\n        super(nomi); // Parent constructorni chaqirish\n        this.zoti = zoti;\n    }\n    @Override\n    public void ovqatlan() {\n        System.out.println(nomi + " (" + zoti + ") suyak kemirmoqda!");\n    }\n    public void vov() { System.out.println("Vov-vov!"); }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        It it = new It("Rex", "Alabay");\n        it.ovqatlan(); // Rex (Alabay) suyak kemirmoqda!\n        it.vov();      // Vov-vov!\n    }\n}\n\`\`\``;
      }

      if (/interface/.test(p)) {
        return `☕ **Java — Interface:**\n\n\`\`\`java\n// Interface e'lon qilish\npublic interface Harakatlan {\n    void yur();   // Abstract method\n    void tur();\n    default void info() {\n        System.out.println("Bu harakatlanadigan obyekt");\n    }\n}\n\n// Interface ni implement qilish\npublic class Mashina implements Harakatlan {\n    @Override\n    public void yur() { System.out.println("Mashina yurmoqda..."); }\n    @Override\n    public void tur() { System.out.println("Mashina to'xtadi."); }\n}\n\n// Ko'p interface\npublic interface Uchuvchi {\n    void uch();\n}\npublic class Samolyot implements Harakatlan, Uchuvchi {\n    public void yur() { System.out.println("Samolyot yurmoqda"); }\n    public void tur() { System.out.println("Samolyot to'xtadi"); }\n    public void uch() { System.out.println("Samolyot uchmoqda!"); }\n}\n\`\`\``;
      }

      if (/abstract/.test(p)) {
        return `☕ **Java — Abstract Class:**\n\n\`\`\`java\npublic abstract class Shakl {\n    String rang;\n    public Shakl(String rang) { this.rang = rang; }\n\n    // Abstract method — har bir child o'zi implement qiladi\n    public abstract double yuza();\n\n    // Oddiy method\n    public void chiqar() {\n        System.out.println(rang + " shaklning yuzasi: " + yuza());\n    }\n}\n\npublic class Doira extends Shakl {\n    double radius;\n    public Doira(String rang, double radius) {\n        super(rang);\n        this.radius = radius;\n    }\n    @Override\n    public double yuza() { return Math.PI * radius * radius; }\n}\n\npublic class Kvadrat extends Shakl {\n    double tomon;\n    public Kvadrat(String rang, double tomon) {\n        super(rang);\n        this.tomon = tomon;\n    }\n    @Override\n    public double yuza() { return tomon * tomon; }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Shakl d = new Doira("Qizil", 5);\n        d.chiqar(); // Qizil shaklning yuzasi: 78.53...\n        Shakl k = new Kvadrat("Ko'k", 4);\n        k.chiqar(); // Ko'k shaklning yuzasi: 16.0\n    }\n}\n\`\`\``;
      }

      if (/exception|try|catch|finally|throw/.test(p)) {
        return `☕ **Java — Exception Handling:**\n\n\`\`\`java\npublic class Main {\n    // Custom exception\n    static class YoshXatoException extends Exception {\n        public YoshXatoException(String msg) { super(msg); }\n    }\n\n    static void yoshTekshir(int yosh) throws YoshXatoException {\n        if (yosh < 0 || yosh > 150)\n            throw new YoshXatoException("Yosh noto'g'ri: " + yosh);\n        System.out.println("Yosh to'g'ri: " + yosh);\n    }\n\n    public static void main(String[] args) {\n        try {\n            yoshTekshir(25);   // OK\n            yoshTekshir(-5);   // Exception!\n        } catch (YoshXatoException e) {\n            System.out.println("Xato: " + e.getMessage());\n        } catch (Exception e) {\n            System.out.println("Umumiy xato: " + e.getMessage());\n        } finally {\n            System.out.println("Bu har doim ishlaydi");\n        }\n    }\n}\n\`\`\``;
      }

      if (/collections|arraylist|linkedlist|hashmap|hashset/.test(p)) {
        return `☕ **Java — Collections Framework:**\n\n\`\`\`java\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // ArrayList\n        ArrayList<String> list = new ArrayList<>();\n        list.add("Ali"); list.add("Vali"); list.add("Soli");\n        list.remove("Vali");\n        System.out.println(list); // [Ali, Soli]\n\n        // LinkedList\n        LinkedList<Integer> ll = new LinkedList<>();\n        ll.addFirst(1); ll.addLast(2); ll.add(3);\n        System.out.println(ll.getFirst()); // 1\n\n        // HashMap\n        HashMap<String, Integer> map = new HashMap<>();\n        map.put("olma", 5); map.put("nok", 3);\n        System.out.println(map.get("olma")); // 5\n        map.forEach((k,v) -> System.out.println(k + ": " + v));\n\n        // HashSet — takrorlanmas\n        HashSet<String> set = new HashSet<>();\n        set.add("a"); set.add("b"); set.add("a"); // a bir marta\n        System.out.println(set.size()); // 2\n    }\n}\n\`\`\``;
      }

      if (/stream|lambda/.test(p)) {
        return `☕ **Java — Stream API & Lambda:**\n\n\`\`\`java\nimport java.util.*;\nimport java.util.stream.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<Integer> sonlar = Arrays.asList(1,2,3,4,5,6,7,8,9,10);\n\n        // filter + map + collect\n        List<Integer> juftlar = sonlar.stream()\n            .filter(n -> n % 2 == 0)   // juft sonlar\n            .map(n -> n * n)             // kvadrat\n            .collect(Collectors.toList());\n        System.out.println(juftlar); // [4, 16, 36, 64, 100]\n\n        // reduce — yig'indisi\n        int sum = sonlar.stream().reduce(0, Integer::sum);\n        System.out.println("Yig'indi: " + sum); // 55\n\n        // sorted + limit\n        List<String> ismlar = Arrays.asList("Zafar","Ali","Bobur","Kamol");\n        ismlar.stream()\n            .sorted()\n            .limit(3)\n            .forEach(System.out::println);\n    }\n}\n\`\`\``;
      }

      if (/generics/.test(p)) {
        return `☕ **Java — Generics:**\n\n\`\`\`java\n// Generic class\npublic class Quti<T> {\n    private T ichidagi;\n    public Quti(T ichidagi) { this.ichidagi = ichidagi; }\n    public T olish() { return ichidagi; }\n    public void qoyish(T ichidagi) { this.ichidagi = ichidagi; }\n}\n\n// Generic method\npublic class Utils {\n    public static <T extends Comparable<T>> T max(T a, T b) {\n        return a.compareTo(b) >= 0 ? a : b;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Quti<String> sQuti = new Quti<>("Salom");\n        System.out.println(sQuti.olish()); // Salom\n\n        Quti<Integer> iQuti = new Quti<>(42);\n        System.out.println(iQuti.olish()); // 42\n\n        System.out.println(Utils.max(10, 20)); // 20\n        System.out.println(Utils.max("Ali", "Vali")); // Vali\n    }\n}\n\`\`\``;
      }

      if (/thread|runnable|concurr|parallel/.test(p)) {
        return `☕ **Java — Thread & Runnable:**\n\n\`\`\`java\n// 1. Thread class ni extend qilish\nclass MenimThread extends Thread {\n    @Override\n    public void run() {\n        for (int i = 1; i <= 5; i++) {\n            System.out.println(getName() + ": " + i);\n            try { Thread.sleep(500); } catch (InterruptedException e) {}\n        }\n    }\n}\n\n// 2. Runnable interface\nclass VazifaRunnable implements Runnable {\n    @Override\n    public void run() {\n        System.out.println("Runnable ishlayapti: " + Thread.currentThread().getName());\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) throws InterruptedException {\n        MenimThread t1 = new MenimThread();\n        MenimThread t2 = new MenimThread();\n        t1.start(); t2.start();\n\n        Thread t3 = new Thread(new VazifaRunnable());\n        t3.start();\n\n        // Lambda bilan\n        Thread t4 = new Thread(() -> System.out.println("Lambda thread!"));\n        t4.start();\n\n        t1.join(); t2.join(); // Tugashini kutish\n    }\n}\n\`\`\``;
      }

      if (/enum/.test(p)) {
        return `☕ **Java — Enum:**\n\n\`\`\`java\npublic enum Kun {\n    DUSHANBA("Ish kuni"), SESHANBA("Ish kuni"),\n    CHORSHANBA("Ish kuni"), PAYSHANBA("Ish kuni"),\n    JUMA("Ish kuni"), SHANBA("Dam olish"), YAKSHANBA("Dam olish");\n\n    private final String turi;\n    Kun(String turi) { this.turi = turi; }\n    public String getTuri() { return turi; }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Kun bugun = Kun.JUMA;\n        System.out.println(bugun);           // JUMA\n        System.out.println(bugun.getTuri()); // Ish kuni\n\n        for (Kun k : Kun.values()) {\n            System.out.println(k + " - " + k.getTuri());\n        }\n    }\n}\n\`\`\``;
      }

      if (/pattern|singleton|factory|observer|builder|design/.test(p)) {
        return `☕ **Java — Design Patterns:**\n\n**1. Singleton Pattern:**\n\`\`\`java\npublic class Singleton {\n    private static Singleton instance;\n    private Singleton() {}\n    public static Singleton getInstance() {\n        if (instance == null) instance = new Singleton();\n        return instance;\n    }\n    public void chiqar() { System.out.println("Singleton ishlayapti!"); }\n}\n\`\`\`\n\n**2. Factory Pattern:**\n\`\`\`java\ninterface Shakllar { double yuza(); }\nclass Doira implements Shakllar {\n    double r;\n    Doira(double r) { this.r = r; }\n    public double yuza() { return Math.PI * r * r; }\n}\nclass ShakliFactory {\n    public static Shakllar yaratish(String tur, double o) {\n        if (tur.equals("doira")) return new Doira(o);\n        throw new IllegalArgumentException("Noma'lum shakl!");\n    }\n}\n\`\`\`\n\n**3. Builder Pattern:**\n\`\`\`java\npublic class Odam {\n    private String ism; private int yosh; private String shahar;\n    private Odam() {}\n    public static class Builder {\n        private Odam odam = new Odam();\n        public Builder ism(String i) { odam.ism = i; return this; }\n        public Builder yosh(int y) { odam.yosh = y; return this; }\n        public Builder shahar(String s) { odam.shahar = s; return this; }\n        public Odam build() { return odam; }\n    }\n}\n// Ishlatish:\nOdam o = new Odam.Builder().ism("Ali").yosh(25).shahar("Toshkent").build();\n\`\`\``;
      }

      if (/jdbc|database|sql|mysql|postgresql/.test(p)) {
        return `☕ **Java — JDBC (Database ulanish):**\n\n\`\`\`java\nimport java.sql.*;\n\npublic class JDBCMisol {\n    static final String URL = "jdbc:mysql://localhost:3306/mydb";\n    static final String USER = "root";\n    static final String PASS = "password";\n\n    public static void main(String[] args) {\n        try (Connection conn = DriverManager.getConnection(URL, USER, PASS)) {\n            System.out.println("Ulandi!");\n\n            // SELECT\n            String sql = "SELECT * FROM users WHERE yosh > ?";\n            PreparedStatement pst = conn.prepareStatement(sql);\n            pst.setInt(1, 18);\n            ResultSet rs = pst.executeQuery();\n            while (rs.next()) {\n                System.out.println(rs.getString("ism") + " - " + rs.getInt("yosh"));\n            }\n\n            // INSERT\n            String insert = "INSERT INTO users (ism, yosh) VALUES (?, ?)";\n            PreparedStatement ins = conn.prepareStatement(insert);\n            ins.setString(1, "Ali");\n            ins.setInt(2, 20);\n            ins.executeUpdate();\n\n        } catch (SQLException e) {\n            System.out.println("Xato: " + e.getMessage());\n        }\n    }\n}\n\`\`\`\n\n💡 **Maven dependency (pom.xml):**\n\`\`\`xml\n<dependency>\n    <groupId>mysql</groupId>\n    <artifactId>mysql-connector-java</artifactId>\n    <version>8.0.33</version>\n</dependency>\n\`\`\``;
      }

      if (/maven|gradle|build|pom/.test(p)) {
        return `☕ **Java — Maven & Gradle:**\n\n**Maven (pom.xml):**\n\`\`\`xml\n<project>\n    <groupId>uz.example</groupId>\n    <artifactId>menimapp</artifactId>\n    <version>1.0-SNAPSHOT</version>\n    <dependencies>\n        <!-- JUnit 5 test -->\n        <dependency>\n            <groupId>org.junit.jupiter</groupId>\n            <artifactId>junit-jupiter</artifactId>\n            <version>5.10.0</version>\n            <scope>test</scope>\n        </dependency>\n    </dependencies>\n    <build>\n        <plugins>\n            <plugin>\n                <groupId>org.apache.maven.plugins</groupId>\n                <artifactId>maven-compiler-plugin</artifactId>\n                <version>3.11.0</version>\n                <configuration><source>17</source><target>17</target></configuration>\n            </plugin>\n        </plugins>\n    </build>\n</project>\n\`\`\`\n\n**Gradle (build.gradle):**\n\`\`\`groovy\nplugins { id 'java' }\ngroup = 'uz.example'\nversion = '1.0'\ndependencies {\n    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'\n}\ntest { useJUnitPlatform() }\n\`\`\`\n\n**IntelliJ IDEA'da Maven:** File → New Project → Maven`;
      }

      if (/spring|springboot|spring boot/.test(p)) {
        return `☕ **Java — Spring Boot:**\n\n\`\`\`java\n// 1. pom.xml ga qo'shish\n// spring-boot-starter-web\n\n// 2. Main class\n@SpringBootApplication\npublic class MenimApp {\n    public static void main(String[] args) {\n        SpringApplication.run(MenimApp.class, args);\n    }\n}\n\n// 3. Controller\n@RestController\n@RequestMapping("/api")\npublic class OdamController {\n    @GetMapping("/salom")\n    public String salom() { return "Salom, Spring Boot!"; }\n\n    @GetMapping("/users/{id}")\n    public ResponseEntity<String> user(@PathVariable int id) {\n        return ResponseEntity.ok("User: " + id);\n    }\n\n    @PostMapping("/users")\n    public ResponseEntity<String> add(@RequestBody String user) {\n        return ResponseEntity.status(201).body("Yaratildi: " + user);\n    }\n}\n\n// 4. application.properties\n// server.port=8080\n// spring.datasource.url=jdbc:mysql://localhost/mydb\n\`\`\`\n\n💡 **IntelliJ IDEA'da:** File → New Project → Spring Initializr`;
      }

      if (/intellij|idea|shortcut|tugma/.test(p)) {
        return `💡 **IntelliJ IDEA — To'liq Qo'llanma:**\n\n**🚀 Yangi loyiha:**\n- File → New Project → Java/Maven/Spring\n- JDK tanlang (17 yoki 21 tavsiya)\n\n**⌨️ Eng muhim tugmalar:**\n- \`Shift+F10\` — Ishga tushirish ▶️\n- \`Shift+F9\` — Debug rejimi 🐞\n- \`Ctrl+Alt+L\` — Kodni formatlash\n- \`Ctrl+/\` — Izoh qo'shish/olib tashlash\n- \`Alt+Enter\` — Xatoni tuzatish taklifi 💡\n- \`Ctrl+Space\` — Avtoto'ldirish\n- \`Ctrl+B\` — Class/Method ga o'tish\n- \`Ctrl+Shift+F\` — Barcha fayllardan qidirish\n- \`Shift+Shift\` — Hamma narsadan qidirish\n- \`Ctrl+Z\` — Bekor qilish\n- \`Ctrl+Y\` — O'chirilganni qaytarish\n- \`Alt+Insert\` — Generate (getter/setter/constructor)\n- \`Ctrl+D\` — Qatorni nusxalash\n- \`Ctrl+X\` — Qatorni o'chirish\n- \`Ctrl+Shift+Up/Down\` — Qatorni yuqori/pastga ko'chirish\n\n**🐞 Debug:**\n- Qizil nuqta (breakpoint): satir raqamiga bosish\n- \`F8\` — Next line (keyingi qator)\n- \`F7\` — Step into (method ichiga kirish)\n- \`F9\` — Resume (davom ettirish)\n\n**🔧 Refactor:**\n- \`Shift+F6\` — Rename (nom o'zgartirish)\n- \`Ctrl+Alt+M\` — Extract method\n- \`Ctrl+Alt+V\` — Extract variable`;
      }

      if (/comparator|comparable|sort/.test(p)) {
        return `☕ **Java — Comparable & Comparator:**\n\n\`\`\`java\nimport java.util.*;\n\nclass Talaba implements Comparable<Talaba> {\n    String ism; int baho;\n    Talaba(String ism, int baho) { this.ism = ism; this.baho = baho; }\n    @Override\n    public int compareTo(Talaba b) { return this.baho - b.baho; }\n    public String toString() { return ism + "(" + baho + ")"; }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        List<Talaba> list = new ArrayList<>();\n        list.add(new Talaba("Ali", 85));\n        list.add(new Talaba("Vali", 92));\n        list.add(new Talaba("Soli", 78));\n\n        // Comparable (baho bo'yicha)\n        Collections.sort(list);\n        System.out.println(list); // [Soli(78), Ali(85), Vali(92)]\n\n        // Comparator (ism bo'yicha)\n        list.sort(Comparator.comparing(t -> t.ism));\n        System.out.println(list); // [Ali, Soli, Vali]\n\n        // Lambda comparator — kamayuvchi\n        list.sort((a, b) -> b.baho - a.baho);\n        System.out.println(list);\n    }\n}\n\`\`\``;
      }

      if (/record/.test(p)) {
        return `☕ **Java — Record (Java 16+):**\n\n\`\`\`java\n// Record — immutable data class (getter auto-generated)\npublic record Odam(String ism, int yosh, String shahar) {\n    // Custom method qo'shish mumkin\n    public boolean voyagaYetganmi() {\n        return yosh >= 18;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Odam o = new Odam("Ali", 20, "Toshkent");\n        System.out.println(o.ism());   // Ali\n        System.out.println(o.yosh());  // 20\n        System.out.println(o.voyagaYetganmi()); // true\n        System.out.println(o); // Odam[ism=Ali, yosh=20, shahar=Toshkent]\n    }\n}\n\`\`\``;
      }

      // Umumiy Java javobi
      return `☕ **Java Dasturlash Tili — IntelliJ IDEA To'liq Qo'llanma:**\n\n**📌 Java qo'llashi mumkin bo'lgan mavzular:**\n- *"Java OOP"* — class, object, constructor\n- *"Java interface"* — interface, implements\n- *"Java abstract"* — abstract class\n- *"Java inheritance"* — extends, meros\n- *"Java exception"* — try, catch, throw\n- *"Java collections"* — ArrayList, HashMap, HashSet\n- *"Java generics"* — generic class va method\n- *"Java stream"* — Stream API, lambda\n- *"Java thread"* — multithreading\n- *"Java enum"* — Enum\n- *"Java record"* — Record class\n- *"Java comparator"* — saralash\n- *"Java pattern"* — Singleton, Factory, Builder\n- *"Java JDBC"* — database ulanish\n- *"Java Maven"* — Maven, Gradle\n- *"Java Spring Boot"* — Spring Boot\n- *"IntelliJ IDEA shortcut"* — barcha tugmalar\n\n**🔥 Hello World:**\n\`\`\`java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Salom Dunyo!");\n    }\n}\n\`\`\``;
    }

    // Python
    if (/python/.test(p)) {
      if (/print/.test(p)) return `🐍 **Python — print():**\n\n\`\`\`python\nprint("Salom Dunyo!")\nism = "Jarvis"\nprint(f"Salom, {ism}!")\nprint("1 + 2 =", 1 + 2)\n\`\`\``;
      if (/loop|for|while/.test(p)) return `🐍 **Python — Loop:**\n\n\`\`\`python\nfor i in range(5):\n    print(f"Raqam: {i}")\n\nmevallar = ["olma", "nok", "banan"]\nfor meva in mevallar:\n    print(meva)\n\nn = 0\nwhile n < 5:\n    print(n); n += 1\n\`\`\``;
      if (/class/.test(p)) return `🐍 **Python — Class:**\n\n\`\`\`python\nclass Mashina:\n    def __init__(self, nomi, yili):\n        self.nomi = nomi\n        self.yili = yili\n    def info(self):\n        print(f"{self.nomi} - {self.yili}")\n\nm = Mashina("Toyota", 2023)\nm.info()\n\`\`\``;
      if (/list|array/.test(p)) return `🐍 **Python — List:**\n\n\`\`\`python\nnumbers = [1, 2, 3, 4, 5]\nnumbers.append(6)\nnumbers.remove(3)\nprint(len(numbers))\nnumbers.sort()\nprint(numbers)\n\`\`\``;
      if (/funksiya|function|def/.test(p)) return `🐍 **Python — Funksiya:**\n\n\`\`\`python\ndef salomlash(ism):\n    return f"Salom, {ism}!"\nprint(salomlash("Ali"))\n\ndef yig'indi(a, b): return a + b\nprint(yig'indi(5, 3))\n\`\`\``;
      return `🐍 **Python — Asosiy:**\n\n\`\`\`python\nism = "JARVIS"\nyosh = 25\nif yosh >= 18:\n    print("Voyaga yetgan")\ndef salom(name):\n    print(f"Salom, {name}!")\nsalom("Ali")\n\`\`\`\n\n💬 So'rash mumkin: *"Python loop"*, *"Python class"*, *"Python list"*, *"Python funksiya"*`;
    }

    if (/javascript|js/.test(p)) {
      if (/funksiya|function/.test(p)) return `🌐 **JavaScript — Funksiya:**\n\n\`\`\`javascript\nfunction salomlash(ism) { return "Salom, " + ism + "!"; }\nconsole.log(salomlash("Ali"));\n\nconst yig = (a, b) => a + b;\nconsole.log(yig(5, 3));\n\`\`\``;
      return `🌐 **JavaScript:**\n\n\`\`\`javascript\nlet ism = "JARVIS";\nfunction salom(name) { console.log(\`Salom, \${name}!\`); }\nconst arr = ["olma","nok","banan"];\narr.forEach(m => console.log(m));\n\`\`\``;
    }

    if (/html/.test(p)) return `🌐 **HTML:**\n\n\`\`\`html\n<!DOCTYPE html>\n<html lang="uz">\n<head><meta charset="UTF-8"><title>Sahifa</title></head>\n<body>\n    <h1>Salom Dunyo!</h1>\n    <button onclick="alert('Salom!')">Bosing</button>\n</body>\n</html>\n\`\`\``;

    if (/css/.test(p)) return `🎨 **CSS:**\n\n\`\`\`css\nbody { font-family: Arial; background: #f0f0f0; }\nh1 { color: #333; text-align: center; }\n.btn { background: #007bff; color: white; padding: 10px 20px; border-radius: 5px; }\n\`\`\``;

    return null;
  }

  // ============================================================
  // SPORT & HAYVONLAR
  // ============================================================
  function checkBuiltInSportsAndEntities(promptText) {
    const p = promptText.toLowerCase().trim();

    if (/tenis|tennis/.test(p)) return `🎾 **Tennis**\n\n🏆 Grand Slam: Australian Open, Roland Garros, Wimbledon, US Open\n🌟 Djokovic (24 GS rekord!), Nadal (22 GS), Federer (20 GS)\n👧 Ayollar: Serena Williams, Iga Swiatek, Aryna Sabalenka`;

    if (/futbol|football|soccer/.test(p) && !/david raya|mbappe|messi|ronaldo|arsenal|real madrid|barcelona/.test(p)) return `⚽ **Futbol**\n\n🏆 La Liga: Real Madrid, Barcelona\n🏆 Premier League: Arsenal, Man City, Liverpool\n🏆 Bundesliga: Bayern Munich\n🏆 Serie A: Juventus, Inter\n🏆 Ligue 1: PSG\n🌟 Messi, Ronaldo, Mbappé, Haaland, Bellingham`;

    if (/boks|boxing/.test(p) && !/jalolov|hasanboy|tyson|ali|fury|usyk|canelo/.test(p)) return `🥊 **Boks**\n\n🇺🇿 O'zbekiston Dunyoda №1!\n🥇 Bakhodir Jalolov: Tokyo 2020 Olimpiya Chempioni\n🥇 Hasanboy Do'smatov: Rio 2016 va Tokyo 2020\n🌟 Muhammad Ali, Mike Tyson, Tyson Fury, Oleksandr Usyk`;

    if (/basketbol|basketball|nba/.test(p)) return `🏀 **Basketbol & NBA**\n\n🏆 2024: Boston Celtics\n🌟 LeBron James (38,000+ ochko rekord!), Michael Jordan (6x chempion), Stephen Curry (3-ochko rekordi), Nikola Jokić (3x MVP)`;

    if (/arsenal/.test(p)) return `⚽ **Arsenal F.C.**\n\n🏆 Premier League: 13 marta | FA Cup: 14 marta (rekord!)\n🏟️ Emirates Stadium, London\n👤 Mikel Arteta | 🥅 David Raya`;

    if (/real madrid/.test(p)) return `⚽ **Real Madrid**\n\n🏆 UCL: 15 marta (rekord!) | La Liga: 36 marta\n🌟 Mbappé, Bellingham, Vinicius Jr\n🏟️ Santiago Bernabéu`;

    if (/barcelona|barca/.test(p)) return `⚽ **FC Barcelona**\n\n🏆 La Liga: 27 marta | UCL: 5 marta\n🌟 Messi, Xavi, Iniesta (afsonalar)`;

    if (/mbappe|mbappé/.test(p)) return `⚽ **Kylian Mbappé**\n\n🏆 Jahon Chempioni 2018\n⚽ PSG → Real Madrid (2024)\n⚡ Dunyoning eng tez futbolchilaridan biri!`;

    if (/messi/.test(p)) return `⚽ **Lionel Messi**\n\n🥇 Ballon d'Or: 8 marta (rekord!)\n🏆 Jahon Chempioni 2022 (Qatar)\n⚽ Barcelona → PSG → Inter Miami`;

    if (/ronaldo|cr7/.test(p)) return `⚽ **Cristiano Ronaldo**\n\n🥇 Ballon d'Or: 5 marta | UCL: 5 marta\n📊 900+ rasmiy gol\n⚽ Hozir: Al-Nassr (Saudiya Arabistoni)`;

    if (/david raya|raya/.test(p)) return `⚽ **David Raya (Arsenal & Ispaniya)**\n\n🥅 Arsenal F.C. asosiy darvozaboni (2023-yildan)\n🏆 Premier League "Oltin Qo'lqop"\n🇪🇸 Euro 2024 Chempioni!`;

    if (/jalolov/.test(p)) return `🥊 **Bakhodir Jalolov 🇺🇿**\n\n🥇 Tokyo 2020 Olimpiya Chempioni\n🏆 WBC, WBO, IBF, WBA kamarlari\n💪 Professional rekord: 15-0!`;

    if (/qo'y|qoy/.test(p)) return `🐑 **Qo'y**\n\n⏳ Umri: 10-15 yil | ⚖️ 45-100 kg\n💡 8000 yil oldin xonakilashtirilgan\n🎯 Go'sht, jun, sut`;
    if (/fil/.test(p)) return `🐘 **Fil**\n\n⏳ Umri: 60-70 yil | ⚖️ 4000-7000 kg\n🧠 Bir necha o'n yil eslab qoladi\n💡 Eng og'ir quruqlik hayvoni`;
    if (/sher|aslon/.test(p)) return `🦁 **Sher**\n\n⏳ Umri: 10-15 yil | ⚖️ 150-250 kg | 🏃 80 km/soat\n💡 Erkak sher 12 soat uxlaydi, dishi ov qiladi`;
    if (/\bit\b|kuchuk/.test(p)) return `🐶 **It**\n\n⏳ Umri: 10-15 yil\n👃 Hidi insondan 100,000 marta kuchli\n💡 15,000 yil oldin bo'ridan xonakilashtirilgan`;
    if (/mushuk/.test(p)) return `🐱 **Mushuk**\n\n⏳ Umri: 12-18 yil\n👁️ Qorong'ida 6 marta yaxshi ko'radi\n😴 Kuniga 12-16 soat uxlaydi`;
    if (/ayiq/.test(p)) return `🐻 **Ayiq**\n\n⏳ Umri: 20-30 yil | ⚖️ 100-700 kg\n😴 Qishki uyqu: 4-6 oy`;
    if (/bo'ri|bori|qashqir/.test(p)) return `🐺 **Bo'ri**\n\n⏳ Umri: 6-8 yil | ⚖️ 25-50 kg | 🏃 60 km/soat`;
    if (/tulki/.test(p)) return `🦊 **Tulki**\n\n⏳ Umri: 2-5 yil | ⚖️ 3-11 kg\n💡 40 xil tovush chiqara oladi`;
    if (/kenguru/.test(p)) return `🦘 **Kenguru**\n\n⏳ Umri: 6-8 yil | 🌍 Avstraliya\n🏃 70 km/soat, 9 m sakraydi | 💡 Orqaga yura olmaydi`;
    if (/zebra/.test(p)) return `🦓 **Zebra**\n\n⏳ Umri: 20-25 yil | 🏃 65 km/soat\n💡 Aslida qora teriga oq yo'llar`;
    if (/jiraff|jiraffa/.test(p)) return `🦒 **Jiraffa**\n\n⏳ Umri: 20-25 yil | 📏 5-6 metr\n⚖️ 800-1200 kg | 💡 Eng baland quruqlik hayvoni`;
    if (/timsoh|krokodil/.test(p)) return `🐊 **Timsoh**\n\n⏳ Umri: 70-100 yil | ⚖️ 400-1000 kg\n💡 200 million yildan beri o'zgarmagan`;
    if (/ilon/.test(p)) return `🐍 **Ilon**\n\n⏳ Umri: 10-30 yil\n💡 600+ tur zaharli, 2400+ tur zararsiz`;
    if (/toshbaqa/.test(p)) return `🐢 **Toshbaqa**\n\n⏳ Umri: 80-250 yil\n💡 Harriet 175 yil yashagan (1830-2006)`;
    if (/panda/.test(p)) return `🐼 **Panda**\n\n⏳ Umri: 15-20 yil | 🌍 Xitoy\n🎋 Kuniga 12-38 kg bambuk`;
    if (/akula/.test(p)) return `🦈 **Akula**\n\n⏳ Umri: 20-70 yil | 🏊 70 km/soat\n💡 400 million yildan beri yashaydi`;
    if (/kit/.test(p)) return `🐋 **Kit**\n\n⏳ Umri: 80-200 yil | 📏 30 metr | ⚖️ 150 tonna\n💡 Dunyodagi eng katta hayvon`;
    if (/delfin/.test(p)) return `🐬 **Delfin**\n\n⏳ Umri: 20-30 yil | 🧠 Insondan keyin eng aqlli hayvon\n💡 Har bir delfin o'z nomi bor`;
    if (/burgut|lochin/.test(p)) return `🦅 **Burgut**\n\n⏳ Umri: 20-30 yil | 👁️ 3-4 km dan ko'radi\n🏃 Sho'ng'iganda 240 km/soat`;
    if (/to'ti/.test(p)) return `🦜 **To'ti**\n\n⏳ Umri: 60-80 yil | 🗣️ 50-100 so'z eslab qoladi`;
    if (/pingvin/.test(p)) return `🐧 **Pingvin**\n\n⏳ Umri: 15-20 yil | 🌍 Antarktida | 🏊 36 km/soat`;
    if (/asalari/.test(p)) return `🐝 **Asalari**\n\n🍯 1 kg asal uchun 4 mln gul\n💡 Asalari yo'qolsa insoniyat 4 yilda yo'q bo'ladi`;
    if (/kapalak/.test(p)) return `🦋 **Kapalak**\n\n💡 Monarch kapalak 4,000 km migratsiya qiladi`;
    if (/quyon/.test(p)) return `🐇 **Quyon**\n\n⏳ Umri: 8-12 yil | 🏃 70 km/soat`;
    if (/maymun|gorilla|shimpanze/.test(p)) return `🦍 **Maymunlar**\n\n🦍 Gorilla: 200 kg, DNK 98.3% insonnikidek\n🐒 Shimpanze: DNK 98.7% insonnikidek`;
    if (/bars|leopard|gepard/.test(p)) return `🐆 **Bars/Gepard**\n\n🐈 Gepard: 112 km/soat — quruqlikdagi eng tez hayvon!\n❄️ Qor bari: O'zbekiston tog'larida yashovchi noyob hayvon`;
    if (/hayvon|hayvonlar/.test(p)) return `🌍 **Hayvonlar Olami**\n\n🦁 Yirtqichlar: Sher, Bo'ri, Tulki, Ayiq, Bars\n🐘 Kattalar: Fil, Jiraffa, Zebra, Kenguru\n🐟 Dengiz: Kit, Delfin, Akula\n🐦 Qushlar: Burgut, To'ti, Pingvin\n🐍 Sudraluvchilar: Timsoh, Ilon, Toshbaqa\n\n💬 *Istalgan hayvon nomini yozing!*`;

    return null;
  }

  // ============================================================
  // SUHBAT & MANTIQIY MASALALAR
  // ============================================================
  function checkConversation(promptText) {
    const p = promptText.toLowerCase().trim();
    if (/qalaysiz|qalaysan|qandaysiz/.test(p)) return `😊 **Men juda yaxshiman, rahmat!**\nHar doim siz bilan suhbatlashishdan xursandman! Sizchi?\n\n💬 Istalgan savol bering — sport, bilim, Java, tarjima va boshqalar!`;
    if (/yomon|xafa|g'amgin|stress|charchad/.test(p)) return `🤗 **Tushunaman, har kimda bunday kunlar bo'ladi.**\nBu ham o'tib ketadi! Siz kuchli odamsiz. 💪\nMen doim shu yerdaman — gaplashing!`;
    if (/zerikdim|zerikarli|nima qilay/.test(p)) return `😄 **Zerikibsiz? Mana tavsiyalar:**\n- ⚽ *"Arsenal haqida"*\n- 💻 *"Java Stream API"*\n- 🧠 *"Mantiqiy masala ber"*\n- 🐾 *"Hayvonlar haqida"*`;
    if (/xayr|alvido|ko'rishguncha|sog' bo'ling/.test(p)) return `👋 **Xayr! Ko'rishguncha!** Istalgan vaqt qaytib keling! 😊 ☀️`;
    if (/rahmat|tashakkur/.test(p)) return `😊 **Iltimos, muammo emas!** Yordam bera olganimdan xursandman! 🤝`;
    return null;
  }

  function checkLogicalPuzzle(promptText) {
    const p = promptText.toLowerCase().trim();
    if (!/mantiq|topishmoq|jumboq|puzzle|qiziq savol|qiyin savol/.test(p)) return null;
    const puzzles = [
      `🧠 **Mantiqiy Masala #1:**\n\n> Qancha ko'p olib chiqsang, u shuncha katta bo'ladi. Bu nima?\n\n💡 **Javob: Chuqurlik (Teshik)**`,
      `🧠 **Mantiqiy Masala #2:**\n\n> Men har doim oldingda boraman, lekin ko'ra olmaysan. Bu nima?\n\n💡 **Javob: Kelajak**`,
      `🧠 **Mantiqiy Masala #3:**\n\n> 2 ota va 2 o'g'il ovga ketdi, har biri 1 quyon tutdi, uyga 3 ta keldi. Qanday?\n\n💡 **Javob:** 3 kishi: Bobo, Ota va O'g'il`,
      `🧠 **Mantiqiy Masala #4:**\n\n> Qaysi so'zni noto'g'ri yozsang ham to'g'ri bo'ladi?\n\n💡 **Javob: "Noto'g'ri"** 😄`,
      `🧠 **Mantiqiy Masala #5:**\n\n> Stolda 3 ta olma bor, sen 2 tasini oldingiz. Stolda nechta qoldi?\n\n💡 **Javob: Senda 2 ta!** Stolda 1 ta qoldi.`,
    ];
    return puzzles[Math.floor(Math.random() * puzzles.length)] + `\n\n🎯 *Yana: "mantiqiy masala ber"*`;
  }

  // ============================================================
  // CHAT TARIXI
  // ============================================================
  function getChatHistory() { try { return JSON.parse(localStorage.getItem('jarvis_chats') || '[]'); } catch { return []; } }
  function saveChatHistory(chats) { try { localStorage.setItem('jarvis_chats', JSON.stringify(chats)); } catch {} }

  function saveCurrentChat() {
    if (!currentChatId) return;
    const chats = getChatHistory();
    const idx = chats.findIndex(c => c.id === currentChatId);
    const fu = currentChatMessages.find(m => m.sender === 'user');
    const title = fu ? fu.text.substring(0, 40) + (fu.text.length > 40 ? '...' : '') : 'Yangi chat';
    const obj = { id: currentChatId, title, date: new Date().toLocaleDateString('uz-UZ'), messages: currentChatMessages };
    if (idx >= 0) chats[idx] = obj; else chats.unshift(obj);
    saveChatHistory(chats);
    renderHistoryList();
  }

  function startNewChat() {
    if (currentChatMessages.length > 0) saveCurrentChat();
    currentChatId = 'chat_' + Date.now();
    currentChatMessages = [];
    if (chatContainer) chatContainer.innerHTML = `<div class="chat-message assistant-message"><div class="avatar"><i class="fa-solid fa-robot"></i></div><div class="message-content"><div class="message-header"><span class="author-name">JARVIS AI</span><span class="time-stamp">Hozir</span></div><div class="message-text"><p>Yangi chat boshlandi! 🚀</p></div></div></div>`;
    renderHistoryList();
  }

  function loadChat(chatId) {
    saveCurrentChat();
    const chat = getChatHistory().find(c => c.id === chatId);
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
    saveChatHistory(getChatHistory().filter(c => c.id !== chatId));
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
        <button class="history-delete-btn" data-id="${chat.id}"><i class="fa-solid fa-xmark"></i></button>
      </div>`).join('');
    historyList.querySelectorAll('.history-item').forEach(el => el.addEventListener('click', () => loadChat(el.dataset.id)));
    historyList.querySelectorAll('.history-delete-btn').forEach(btn => btn.addEventListener('click', e => deleteChat(btn.dataset.id, e)));
  }

  function initChat() {
    const chats = getChatHistory();
    if (chats.length > 0) {
      currentChatId = chats[0].id;
      currentChatMessages = chats[0].messages || [];
      if (chatContainer) { chatContainer.innerHTML = ''; currentChatMessages.forEach(msg => appendChatMessageDOM(msg.sender, msg.text, msg.time)); }
    } else { currentChatId = 'chat_' + Date.now(); currentChatMessages = []; }
    renderHistoryList();
    window.addEventListener('beforeunload', () => { if (currentChatMessages.length > 0) saveCurrentChat(); });
  }

  // ============================================================
  // CHAT UI
  // ============================================================
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
    const ts = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentChatMessages.push({ sender, text, time: ts });
    saveCurrentChat();
    appendChatMessageDOM(sender, text, ts);
  }

  function appendChatMessageDOM(sender, text, timeStr) {
    if (!chatContainer) return;
    const div = document.createElement('div');
    div.className = `chat-message ${sender}-message`;
    if (!timeStr) timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      `<div class="code-block-container"><div class="code-header"><span>${lang||'code'}</span><button class="copy-code-btn"><i class="fa-solid fa-copy"></i> Nusxa olish</button></div><pre><code>${code.trim()}</code></pre></div>`);
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

  // ============================================================
  // WIKIPEDIA API
  // ============================================================
  async function fetchWikipediaSummary(promptText) {
    try {
      const p = promptText.toLowerCase().trim();
      if (/^(sen|siz|men|biz|u|o'zing|ozing|salom|hi|hello)$/.test(p)) return null;
      let q = promptText.toLowerCase().replace(/(haqida|ma'lumot|malumat|ber|aytib|kim|qaysi|haqda|nima|qanday|qancha|yil|yashaydi)/gi,'').replace(/qulub/g,'klub').trim();
      if (!q || q.length < 2) q = promptText.trim();
      if (q === 'mbappe' || q === 'mbappé') q = 'Kylian Mbappé';

      const c1 = new AbortController(); setTimeout(() => c1.abort(), 10000);
      const r1 = await fetch(`https://uz.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`, {signal: c1.signal});
      if (r1.ok) {
        const d1 = await r1.json();
        if (d1?.query?.search?.length > 0) {
          const tt = d1.query.search[0].title;
          if (tt.toLowerCase().includes("o'zing") && /sen|o'zing|ozing/i.test(promptText)) return null;
          const c2 = new AbortController(); setTimeout(() => c2.abort(), 10000);
          const r2 = await fetch(`https://uz.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(tt)}`, {signal: c2.signal});
          if (r2.ok) {
            const sd = await r2.json();
            if (sd?.extract && sd.extract.length > 20) {
              let icon = '🌐';
              if (/klub|futbol|sport|arsenal|real|barca/i.test(promptText)) icon = '⚽';
              else if (/hayvon|qo'y|fil|sher|mushuk|it/i.test(promptText)) icon = '🐾';
              else if (/boks|ufc|jalolov/i.test(promptText)) icon = '🥊';
              let res = `**${icon} ${sd.title}**\n\n`;
              if (sd.description) res += `*📌 ${sd.description}*\n\n`;
              let ex = sd.extract;
              if (/david raya|raya/i.test(promptText)) {
                ex = ex.replace(/Brentford/g, "Arsenal (2023-yildan)");
                res += ex + `\n\n🏆 **Hozirgi Klub: Arsenal F.C.**`;
                return res;
              }
              return res + ex;
            }
          }
        }
      }

      const c3 = new AbortController(); setTimeout(() => c3.abort(), 10000);
      const r3 = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`, {signal: c3.signal});
      if (r3.ok) {
        const d3 = await r3.json();
        if (d3?.query?.search?.length > 0) {
          const tt = d3.query.search[0].title;
          const c4 = new AbortController(); setTimeout(() => c4.abort(), 10000);
          const r4 = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(tt)}`, {signal: c4.signal});
          if (r4.ok) {
            const sd = await r4.json();
            if (sd?.extract && sd.extract.length > 20) {
              let res = `**🌐 ${sd.title}**\n\n`;
              if (sd.description) res += `*📌 ${sd.description}*\n\n`;
              return res + sd.extract;
            }
          }
        }
      }
    } catch (e) { console.warn('Wikipedia error:', e); }
    return null;
  }

  // ============================================================
  // POLLINATIONS AI + OFFLINE FALLBACKS
  // ============================================================
  async function fetchAIResponse(userPrompt) {
    const wiki = await fetchWikipediaSummary(userPrompt);
    if (wiki) return wiki;
    try {
      const sys = `Siz JARVIS AI — universal intellektual yordamchisiz. Barcha sport, klublar, sportchilar, hayvonlar va har qanday savolga o'zbek tilida aniq va chiroyli javob bering.`;
      const c = new AbortController(); const ti = setTimeout(() => c.abort(), 5000);
      const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(sys)}&seed=42`, {signal: c.signal});
      clearTimeout(ti);
      if (r.ok) { const t = await r.text(); if (t && t.trim().length > 5 && !t.includes('402')) return t.trim(); }
    } catch (e) {}
    return null;
  }

  function getLangSystemPrompt() {
    if (currentLanguage === 'ru-RU') return 'Ты — умный голосовой помощник JARVIS AI. Отвечай ТОЛЬКО на русском языке. На любой вопрос давай подробный, полезный и дружелюбный ответ на русском. Никогда не отвечай на других языках.';
    if (currentLanguage === 'en-US') return 'You are JARVIS AI, a smart voice assistant. Answer ONLY in English. Give detailed, helpful and friendly answers in English to any question. Never answer in other languages.';
    return "Sen JARVIS AI — aqlli ovozli yordamchisan. Faqat O'ZBEK TILIDA javob ber. Har qanday savolga o'zbek tilida batafsil va do'stona javob ber.";
  }

  async function askPollinationsInLang(userPrompt) {
    const sys = getLangSystemPrompt();
    const endpoints = [
      `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(sys)}&seed=42&model=openai`,
      `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(sys)}&seed=42`
    ];
    for (const url of endpoints) {
      try {
        const c = new AbortController(); const ti = setTimeout(() => c.abort(), 15000);
        const r = await fetch(url, {signal: c.signal}); clearTimeout(ti);
        if (r.ok) { const t = (await r.text()).trim(); if (t && t.length > 5 && !t.includes('402') && !/^error/i.test(t)) return t; }
      } catch (e) { continue; }
    }
    return null;
  }

  async function fetchAIResponseWithLang(userPrompt) {
    const wiki = await fetchWikipediaSummary(userPrompt);
    if (wiki) return wiki;
    try {
      const sys = getLangSystemPrompt();
      const c = new AbortController(); const ti = setTimeout(() => c.abort(), 7000);
      const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(sys)}&seed=42`, {signal: c.signal});
      clearTimeout(ti);
      if (r.ok) { const t = await r.text(); if (t && t.trim().length > 5 && !t.includes('402')) return t.trim(); }
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
    if (/hello|hi|hey/.test(p)) return `👋 **Hello! I'm JARVIS AI!**\n\nAsk me anything — sports, animals, math, Java, coding!`;
    if (/who are you|jarvis/.test(p)) return `🤖 **I'm JARVIS AI** — your universal voice assistant!`;
    if (/thank|thanks/.test(p)) return `😊 **You're welcome!** Happy to help!`;
    if (/bye|goodbye/.test(p)) return `👋 **Goodbye!** Come back anytime! ☀️`;
    return `🤖 **JARVIS AI:** Ask me anything — I'll answer in English!`;
  }

  function getSmartOfflineResponse(promptText) {
    const p = promptText.toLowerCase().trim();
    const nums = promptText.match(/\d+/g);
    if (nums && nums.length >= 2) {
      let im = promptText.match(/\b(olma|nok|behi|daftar|qalam|kitob|tuxum|mashina|bola|odam|pul|so'm)\b/i);
      let item = im ? im[0] : 'ta'; let total = parseInt(nums[0], 10);
      if (nums.length === 2) {
        const n2 = parseInt(nums[1], 10);
        if (/yedi|yeb|ayir|sotdi|yo.qol|ketdi|qoldi/.test(p)) return `🧮 ${total} - ${n2} = **${total - n2}**\n\nJavob: Sizda **${total - n2} ${item}** qoldi.`;
        if (/qo.sh|oldim|berdi|jami|bo.ldi/.test(p)) return `🧮 ${total} + ${n2} = **${total + n2}**\n\nJavob: Jami **${total + n2} ${item}** bo'ldi.`;
      }
      if (nums.length === 3) { const n2 = parseInt(nums[1],10); const n3 = parseInt(nums[2],10); const res = total+n2-n3; return `🧮 ${total} + ${n2} - ${n3} = **${res}**\n\nJavob: Sizda **${res} ${item}** qoldi.`; }
    }
    if (/salom|hello|hi |привет|qalaysiz|jarvis|kim/.test(p)) return `🤖 **Salom! Men JARVIS AI!**\n\n- ⚽ Sport & Klublar\n- 🐾 Hayvonlar\n- 🥊 Boks & UFC\n- 🔤 Tarjima\n- 🧮 Matematika\n- 💻 Java & IntelliJ IDEA`;
    return `🤖 **JARVIS AI:** "${promptText}" bo'yicha qidirildi.\n\n📌 Sinab ko'ring:\n- ⚽ *"Arsenal haqida"*\n- 💻 *"Java OOP"* yoki *"Java Spring Boot"*\n- 🐾 *"Qo'y qancha yil yashaydi"*\n- 🧮 *"25 * 4 + 100"*`;
  }

  // ============================================================
  // MAIN AI CONTROLLER
  // ============================================================
  async function generateUniversalAIResponse(prompt) {
    const isRu = currentLanguage === 'ru-RU';
    const isEn = currentLanguage === 'en-US';
    if (isRu || isEn) {
      setAIState('processing');
      const answer = await askPollinationsInLang(prompt);
      if (answer && answer.length > 5) return answer;
      return getOfflineLangResponse(prompt);
    }
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
    currentChatMessages = []; saveCurrentChat();
    if (chatContainer) chatContainer.innerHTML = `<div class="chat-message assistant-message"><div class="avatar"><i class="fa-solid fa-robot"></i></div><div class="message-content"><div class="message-header"><span class="author-name">JARVIS AI</span><span class="time-stamp">Hozir</span></div><div class="message-text"><p>Chat tozalandi! 🚀</p></div></div></div>`;
  });
  if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);
  if (langUzBtn) langUzBtn.addEventListener('click', () => { currentLanguage = 'uz-UZ'; langUzBtn.classList.add('active'); langEnBtn?.classList.remove('active'); langRuBtn?.classList.remove('active'); if (recognition) recognition.lang = 'uz-UZ'; });
  if (langEnBtn) langEnBtn.addEventListener('click', () => { currentLanguage = 'en-US'; langEnBtn.classList.add('active'); langUzBtn?.classList.remove('active'); langRuBtn?.classList.remove('active'); if (recognition) recognition.lang = 'en-US'; });
  if (langRuBtn) langRuBtn.addEventListener('click', () => { currentLanguage = 'ru-RU'; langRuBtn.classList.add('active'); langUzBtn?.classList.remove('active'); langEnBtn?.classList.remove('active'); if (recognition) recognition.lang = 'ru-RU'; });

  initChat();

});
