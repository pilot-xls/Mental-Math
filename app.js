'use strict';

/* =========================================================
   Contas do Mocho — treino de cálculo mental
   ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const ROUND = 10;

const store = {
  get(k, d) { try { const v = localStorage.getItem('mocho:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mocho:' + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }
};

const OPS = {
  add: { sym: '+', name: 'Somar', color: 'var(--add)' },
  sub: { sym: '−', name: 'Subtrair', color: 'var(--sub)' },
  mul: { sym: '×', name: 'Multiplicar', color: 'var(--mul)' },
  div: { sym: '÷', name: 'Dividir', color: 'var(--div)' },
  mix: { sym: '🎲', name: 'Tudo misturado', color: 'var(--mix)' }
};
const LEVELS = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };

/* ---------------- Mocho (SVG) ---------------- */
function owlSVG() {
  return `<svg class="owl" viewBox="0 0 200 200" aria-hidden="true">
    <path d="M48 62 L36 18 L80 46 Z" fill="#5A3FD6"/>
    <path d="M152 62 L164 18 L120 46 Z" fill="#5A3FD6"/>
    <ellipse class="wing wl" cx="38" cy="125" rx="20" ry="40" fill="#5A3FD6"/>
    <ellipse class="wing wr" cx="162" cy="125" rx="20" ry="40" fill="#5A3FD6"/>
    <ellipse cx="100" cy="115" rx="66" ry="72" fill="#7B5CFF"/>
    <ellipse cx="100" cy="142" rx="40" ry="38" fill="#FFD56B"/>
    <path d="M84 132 q6 6 12 0 M104 132 q6 6 12 0 M94 146 q6 6 12 0 M84 160 q6 6 12 0 M104 160 q6 6 12 0" stroke="#E8A93B" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="72" cy="88" r="31" fill="#9C84FF"/>
    <circle cx="128" cy="88" r="31" fill="#9C84FF"/>
    <circle cx="72" cy="88" r="24" fill="#fff"/>
    <circle cx="128" cy="88" r="24" fill="#fff"/>
    <g class="pupils">
      <circle cx="75" cy="91" r="11" fill="#1E1B4B"/><circle cx="125" cy="91" r="11" fill="#1E1B4B"/>
      <circle cx="79" cy="86" r="4" fill="#fff"/><circle cx="129" cy="86" r="4" fill="#fff"/>
    </g>
    <path class="happy-eyes" d="M58 94 q14 -18 28 0 M114 94 q14 -18 28 0" stroke="#1E1B4B" stroke-width="7" fill="none" stroke-linecap="round"/>
    <ellipse class="lid" cx="72" cy="88" rx="25" ry="25" fill="#9C84FF"/>
    <ellipse class="lid" cx="128" cy="88" rx="25" ry="25" fill="#9C84FF"/>
    <ellipse cx="52" cy="118" rx="9" ry="6" fill="#FF8FD8" opacity=".7"/>
    <ellipse cx="148" cy="118" rx="9" ry="6" fill="#FF8FD8" opacity=".7"/>
    <path d="M90 104 L110 104 L100 123 Z" fill="#FF9F1C" stroke="#FF9F1C" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="80" cy="186" rx="14" ry="7" fill="#FF9F1C"/>
    <ellipse cx="120" cy="186" rx="14" ry="7" fill="#FF9F1C"/>
  </svg>`;
}

function owlMood(wrap, mood, ms = 900) {
  const svg = $('svg', wrap);
  if (!svg) return;
  svg.classList.remove('happy', 'sad', 'think', 'talk');
  void svg.offsetWidth; // reinicia a animação
  if (mood) svg.classList.add(mood);
  clearTimeout(svg._t);
  if (mood && mood !== 'think') svg._t = setTimeout(() => svg.classList.remove(mood), ms);
}

function say(el, html) {
  el.innerHTML = html;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

/* ---------------- Áudio (sintetizado, sem ficheiros) ---------------- */
const audio = {
  ctx: null, master: null, sfx: null, music: null, noise: null,
  soundOn: store.get('sound', true),
  musicOn: store.get('music', true),
  timer: null, step: 0, nextTime: 0,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.5; this.sfx.connect(this.master);
    this.music = this.ctx.createGain(); this.music.gain.value = 0.11; this.music.connect(this.master);
    const len = this.ctx.sampleRate * 0.1;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.musicOn) this.startMusic();
  },

  tone(freq, when, dur, type = 'square', vol = 0.3, dest, slideTo) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(dest || this.sfx);
    o.start(when); o.stop(when + dur + 0.05);
  },

  play(name) {
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    const T = (f, d, s = 0, type, v, slide) => this.tone(f, t + s, d, type, v, null, slide);
    switch (name) {
      case 'tap': T(740, 0.05, 0, 'triangle', 0.25); break;
      case 'del': T(420, 0.07, 0, 'triangle', 0.22, 300); break;
      case 'select': T(523, 0.07, 0, 'square', 0.12); T(784, 0.09, 0.06, 'square', 0.12); break;
      case 'right': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.14, i * 0.07, 'square', 0.14)); break;
      case 'streak': [784, 988, 1175, 1568, 1976].forEach((f, i) => T(f, 0.1, i * 0.05, 'triangle', 0.18)); break;
      case 'wrong': T(220, 0.18, 0, 'sawtooth', 0.12, 160); T(196, 0.25, 0.16, 'sawtooth', 0.12, 130); break;
      case 'hint': T(1047, 0.25, 0, 'sine', 0.25); T(1568, 0.35, 0.08, 'sine', 0.18); break;
      case 'hoot': T(392, 0.22, 0, 'sine', 0.35, 349); T(392, 0.34, 0.3, 'sine', 0.35, 330); break;
      case 'win': [523, 659, 784, 659, 784, 1047].forEach((f, i) => T(f, i === 5 ? 0.5 : 0.14, i * 0.13, 'square', 0.14)); break;
      case 'star': T(1319, 0.2, 0, 'triangle', 0.2); T(1760, 0.3, 0.06, 'triangle', 0.15); break;
    }
  },

  /* Música original em pentatónica: dó – lá menor – fá – sol */
  mel: [72, 0, 76, 79, 81, 0, 79, 76, 74, 0, 76, 72, 69, 0, 72, 0,
        72, 0, 76, 79, 81, 0, 84, 81, 79, 0, 76, 74, 72, 0, 0, 0],
  bass: [48, 48, 45, 45, 41, 41, 43, 43],

  startMusic() {
    if (!this.ctx || this.timer) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    const spb = 60 / 112 / 2; // colcheias a 112 bpm
    const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
    this.timer = setInterval(() => {
      while (this.nextTime < this.ctx.currentTime + 0.15) {
        const s = this.step % 32;
        const m = this.mel[s];
        if (m) this.tone(midi(m), this.nextTime, spb * 0.9, 'square', 0.22, this.music);
        if (s % 4 === 0) this.tone(midi(this.bass[s / 4]), this.nextTime, spb * 3.6, 'triangle', 0.5, this.music);
        if (s % 2 === 1) this.hat(this.nextTime);
        this.nextTime += spb;
        this.step++;
      }
    }, 30);
  },
  hat(when) {
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    src.buffer = this.noise; f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(0.12, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    src.connect(f).connect(g).connect(this.music); src.start(when); src.stop(when + 0.06);
  },
  stopMusic() { clearInterval(this.timer); this.timer = null; }
};

/* ---------------- Perguntas ---------------- */
function makeQuestion(op, lvl) {
  if (op === 'mix') op = pick(['add', 'sub', 'mul', 'div']);
  let a, b, ans;
  if (op === 'add') {
    if (lvl === 'easy') { a = rnd(3, 19); b = rnd(2, 9); }
    else if (lvl === 'medium') { a = rnd(12, 89); b = rnd(11, 59); }
    else { a = rnd(120, 899); b = rnd(45, 499); }
    ans = a + b;
  } else if (op === 'sub') {
    if (lvl === 'easy') { a = rnd(11, 20); b = rnd(2, 9); }
    else if (lvl === 'medium') { a = rnd(40, 99); b = rnd(11, a - 6); }
    else { a = rnd(300, 999); b = rnd(45, a - 50); }
    ans = a - b;
  } else if (op === 'mul') {
    if (lvl === 'easy') { a = rnd(2, 10); b = rnd(2, 10); }
    else if (lvl === 'medium') { a = rnd(12, 39); b = rnd(3, 9); }
    else { a = rnd(13, 39); b = rnd(11, 19); }
    if (Math.random() < 0.5) [a, b] = [b, a];
    ans = a * b;
  } else {
    if (lvl === 'easy') { b = rnd(2, 9); ans = rnd(2, 10); }
    else if (lvl === 'medium') { b = rnd(3, 9); ans = rnd(11, 49); }
    else { b = rnd(6, 13); ans = rnd(25, 140); }
    a = b * ans;
  }
  return { op, a, b, ans, lvl };
}

const qText = (q) => `${q.a} ${OPS[q.op].sym} ${q.b}`;

/* ---------------- Dicas passo a passo ---------------- */
const parts = (n) => { const s = String(n); return [...s].map((d, i) => +d * 10 ** (s.length - 1 - i)).filter((x) => x > 0); };
const near = (n) => { const st = n >= 100 ? 100 : 10; return Math.round(n / st) * st; };

function mulLine(o, p) {
  if (p % 10 === 0 && p >= 10) {
    const k = p / 10;
    return k === 1 ? `${o} × 10 = <b>${o * 10}</b> (é só juntar um 0)` : `${o} × ${p} = ${o} × ${k} × 10 = <b>${o * p}</b>`;
  }
  if (o >= 10 && o % 10 !== 0) {
    const t = o - (o % 10), u = o % 10;
    return `${o} × ${p} = ${t}×${p} + ${u}×${p} = ${t * p} + ${u * p} = <b>${o * p}</b>`;
  }
  return `${o} × ${p} = <b>${o * p}</b>`;
}

function hintsFor(q) {
  const { a, b } = q;
  const s = [];
  if (q.op === 'add') {
    if (b < 10) {
      const need = 10 - (a % 10);
      if (a % 10 !== 0 && b > need) {
        s.push(`Completa a dezena primeiro: ${a} + ${need} = <b>${a + need}</b>.`);
        s.push(`Já usaste ${need} do ${b}. Falta juntar <b>${b - need}</b>.`);
      } else {
        s.push(`Conta ${b} para a frente a partir do ${a}.`);
        s.push(`Pensa em ${a % 10} + ${b} = ${(a % 10) + b} e junta as dezenas do ${a}.`);
      }
    } else {
      s.push(`Estima primeiro: ${near(a)} + ${near(b)} ≈ <b>${near(a) + near(b)}</b>. A resposta anda por aí.`);
      const p = parts(b);
      s.push(`Parte o ${b} em ${p.join(' + ')}.`);
      let c = a;
      for (let i = 0; i < p.length - 1; i++) { s.push(`${c} + ${p[i]} = <b>${c + p[i]}</b>`); c += p[i]; }
      s.push(`Agora só falta ${c} + ${p[p.length - 1]}.`);
    }
  } else if (q.op === 'sub') {
    if (b < 10) {
      const u = a % 10;
      if (u > 0 && b > u) {
        s.push(`Desce até à dezena: ${a} − ${u} = <b>${a - u}</b>.`);
        s.push(`Já tiraste ${u} do ${b}. Falta tirar <b>${b - u}</b>.`);
      } else if (u === 0) {
        s.push(`Tira primeiro uma dezena: ${a} − 10 = <b>${a - 10}</b>.`);
        s.push(`Tiraste 10 em vez de ${b}, tiraste ${10 - b} a mais. Devolve <b>${10 - b}</b>.`);
      } else {
        s.push(`Conta para cima: do ${b} até ao ${a}, quanto falta?`);
        s.push(`Pensa em ${u} − ${b} nas unidades e mantém as dezenas.`);
      }
    } else {
      s.push(`Estima primeiro: ${near(a)} − ${near(b)} ≈ <b>${near(a) - near(b)}</b>.`);
      const p = parts(b);
      s.push(`Tira o ${b} aos bocados: ${p.join(' + ')}.`);
      let c = a;
      for (let i = 0; i < p.length - 1; i++) { s.push(`${c} − ${p[i]} = <b>${c - p[i]}</b>`); c -= p[i]; }
      s.push(`Agora só falta ${c} − ${p[p.length - 1]}.`);
      const up = Math.ceil(b / 10) * 10;
      if (b % 10 >= 7) s.push(`Outra forma: ${a} − ${up} = ${a - up}, e depois devolve ${up - b}.`);
    }
  } else if (q.op === 'mul') {
    const big = Math.max(a, b), small = Math.min(a, b);
    if (big <= 10) {
      const m = big, n = small;
      if (n === 2) s.push(`×2 é o dobro: ${m} + ${m}.`);
      else if (n === 10 || m === 10) s.push(`×10 é fácil: junta um 0 ao ${n === 10 ? m : n}.`);
      else if (n === 5 || m === 5) { const o = n === 5 ? m : n; s.push(`×5 = ×10 e depois metade.`); s.push(`${o} × 10 = <b>${o * 10}</b>. Agora a metade.`); }
      else if (n === 9 || m === 9) { const o = n === 9 ? m : n; s.push(`×9 = ×10 menos uma vez.`); s.push(`${o} × 10 = <b>${o * 10}</b>. Agora tira ${o}.`); }
      else if (n === 4) { s.push(`×4 é o dobro do dobro.`); s.push(`Dobro de ${m} = <b>${m * 2}</b>. Agora o dobro disso.`); }
      else if (n === 3) { s.push(`×3 é o dobro mais uma vez.`); s.push(`${m} + ${m} = <b>${m * 2}</b>. Junta mais ${m}.`); }
      else {
        s.push(`Parte o ${m} em 5 + ${m - 5}.`);
        s.push(`${n} × 5 = <b>${n * 5}</b>`);
        s.push(`${n} × ${m - 5} = <b>${n * (m - 5)}</b>. Agora soma os dois.`);
      }
    } else {
      const split = small <= 9 ? big : small;
      const other = split === a ? b : a;
      const p = parts(split);
      if (other <= 9) s.push(`Estima: ${other} × ${near(split)} ≈ <b>${other * near(split)}</b>.`);
      s.push(`Parte o ${split} em ${p.join(' + ')} e multiplica cada bocado por ${other}.`);
      p.forEach((x) => s.push(mulLine(other, x)));
      s.push(`Agora soma: ${p.map((x) => other * x).join(' + ')}.`);
    }
  } else {
    const qq = q.ans;
    s.push(`Pensa ao contrário: ${b} × ? = ${a}`);
    if (qq <= 10) {
      const half = b * 5;
      s.push(`Usa a tabuada do ${b}: ${b} × 5 = <b>${half}</b>. O ${a} está ${a > half ? 'acima' : a < half ? 'abaixo' : 'mesmo aí'}.`);
      s.push(qq > 5 ? `Conta de ${b} em ${b} a partir do ${half}: ${half}, ${half + b}...` : `Conta de ${b} em ${b}: ${b}, ${b * 2}, ${b * 3}...`);
    } else {
      s.push(qq >= 100
        ? `Ordem de grandeza: ${b} × 100 = ${b * 100}. A resposta é maior que 100.`
        : `Ordem de grandeza: ${b} × 10 = ${b * 10} e ${b} × 100 = ${b * 100}. A resposta está entre 10 e 100.`);
      let rem = a; const blocks = [];
      for (const place of [100, 10]) {
        const k = Math.floor(rem / (b * place)) * place;
        if (k > 0) { s.push(`Bloco: ${b} × ${k} = ${b * k} ➜ sobram <b>${rem - b * k}</b>`); rem -= b * k; blocks.push(k); }
      }
      s.push(rem === 0
        ? `Já não sobra nada! Soma os blocos: ${blocks.join(' + ')}.`
        : `Quantas vezes o ${b} cabe em ${rem}? Junta isso a ${blocks.join(' + ')}.`);
    }
  }
  return s;
}

/* ---------------- Truques gerais (toca no mocho) ---------------- */
const TRICKS = {
  add: ['Arredonda e compensa: 48 + 27 = 50 + 27 − 2.', 'Soma primeiro as dezenas, depois as unidades.', 'Completa a dezena: 8 + 5 = 8 + 2 + 3.'],
  sub: ['Conta para cima: 83 − 47 é quanto falta do 47 até ao 83.', 'Arredonda: 62 − 29 = 62 − 30 + 1.', 'Tira aos bocados: primeiro as dezenas, depois as unidades.'],
  mul: ['×5 = ×10 e depois metade.', '×9 = ×10 menos uma vez.', '×4 é o dobro do dobro.', 'Parte em dezenas: 7 × 23 = 7×20 + 7×3.'],
  div: ['Pergunta "quantas vezes cabe?": 7 × ? = 300.', '÷5 = ×2 e depois ÷10.', '÷4 é a metade da metade.', 'Tira blocos redondos: 7 × 40 = 280, sobram 20.']
};
const randomTrick = (op) => `<span class="tag">Truque</span><br>${pick(TRICKS[op === 'mix' || !TRICKS[op] ? pick(Object.keys(TRICKS)) : op])}`;

const MSG = {
  right: ['Boa!', 'Isso mesmo!', 'Muito bem!', 'Certíssimo!', 'Que cérebro!', 'Na mouche!', 'Uau, és bom nisto!'],
  fast: ['Rapidíssimo! ⚡', 'Nem pestanejei! ⚡', 'Isso foi um relâmpago! ⚡'],
  wrong: ['Quase! Tenta outra vez.', 'Hmm, não é bem isso. Pede uma 💡 se quiseres.', 'Respira fundo e tenta de novo.'],
  start: ['Vamos a isto! Toca em 💡 sempre que precisares.', 'Pronto? Eu estou aqui para ajudar.', 'Começa com calma. A velocidade vem depois.'],
  next: ['E esta?', 'Próxima!', 'Mais uma!', 'Bora!']
};

/* ---------------- Estado e ecrãs ---------------- */
const state = { op: store.get('op', 'add'), lvl: store.get('lvl', 'easy') };
let g = null; // jogo em curso

function show(id) {
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

function bestKey() { return `best:${state.op}:${state.lvl}`; }

function refreshHome() {
  $$('.op-tile').forEach((t) => t.setAttribute('aria-checked', String(t.dataset.op === state.op)));
  $$('.level').forEach((l) => l.setAttribute('aria-checked', String(l.dataset.lvl === state.lvl)));
  const best = store.get(bestKey(), 0);
  $('#bestHome').textContent = best ? `Recorde em ${OPS[state.op].name} (${LEVELS[state.lvl]}): ${best} pontos` : '';
}

function startGame() {
  g = { i: 0, score: 0, streak: 0, bestStreak: 0, firstTry: 0, q: null, input: '', tries: 0, hint: 0, hintsUsed: 0, waiting: false, t0: 0 };
  document.documentElement.style.setProperty('--op', OPS[state.op].color);
  show('game');
  $('#score').textContent = '0';
  say($('#bubble'), pick(MSG.start));
  nextQuestion(true);
}

function nextQuestion(first) {
  if (g.i >= ROUND) return endGame();
  g.q = makeQuestion(state.op, state.lvl);
  g.input = ''; g.tries = 0; g.hint = 0; g.hintsSeen = 0; g.waiting = false; g.t0 = performance.now();
  g.qid = (g.qid || 0) + 1;
  const q = g.q;
  if (state.op === 'mix') document.documentElement.style.setProperty('--op', OPS[q.op].color);
  $('#question').innerHTML = `${q.a}<span class="sym">${OPS[q.op].sym}</span>${q.b}`;
  $('#count').textContent = `${g.i + 1} / ${ROUND}`;
  $('#bar').style.width = `${(g.i / ROUND) * 100}%`;
  const okKey = $('#okKey');
  okKey.textContent = '✓'; okKey.classList.remove('next'); okKey.setAttribute('aria-label', 'Confirmar');
  renderAnswer();
  owlMood($('#owlGame'), null);
  if (!first) say($('#bubble'), pick(MSG.next));
}

function renderAnswer(cls) {
  const el = $('#answer');
  el.className = 'answer' + (g.input ? '' : ' empty') + (cls ? ' ' + cls : '');
  el.textContent = g.input || '?';
}

function press(k) {
  if (!g) return;
  if (g.waiting) { if (k === 'ok') { audio.play('tap'); nextQuestion(); } return; }
  if (k === 'del') { g.input = g.input.slice(0, -1); audio.play('del'); renderAnswer(); return; }
  if (k === 'ok') return submit();
  if (g.input.length >= 5) return;
  g.input = (g.input === '0' ? '' : g.input) + k;
  audio.play('tap');
  renderAnswer('typed');
}

function submit() {
  const card = $('#card');
  if (!g.input) { card.classList.remove('wrong'); void card.offsetWidth; card.classList.add('wrong'); say($('#bubble'), 'Escreve a tua resposta no teclado 👇'); return; }
  const q = g.q;
  card.classList.remove('right', 'wrong'); void card.offsetWidth;

  if (Number(g.input) === q.ans) {
    const secs = (performance.now() - g.t0) / 1000;
    const fastLimit = { easy: 5, medium: 9, hard: 15 }[state.lvl];
    const fast = secs < fastLimit && g.tries === 0;
    if (g.tries === 0) { g.streak++; g.firstTry++; } else g.streak = 0;
    g.bestStreak = Math.max(g.bestStreak, g.streak);
    let pts = (g.tries === 0 ? 10 : 5) + Math.min(g.streak, 5) * 2 + (fast ? 5 : 0) - g.hintsSeen * 2;
    pts = Math.max(pts, 1);
    g.score += pts;
    $('#score').textContent = g.score;
    const pill = $('.score-pill'); pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');

    card.classList.add('right');
    renderAnswer('correct');
    owlMood($('#owlGame'), 'happy');
    let msg = fast ? pick(MSG.fast) : pick(MSG.right);
    if (g.streak >= 3) { msg += ` ${g.streak} seguidas! 🔥`; audio.play('streak'); } else audio.play('right');
    say($('#bubble'), `${msg} <b>+${pts}</b>`);
    updateStreak();
    confetti(g.streak >= 3 ? 70 : 35);
    g.i++;
    g.waiting = true;
    const qid = g.qid;
    setTimeout(() => { if (g && g.waiting && g.qid === qid) nextQuestion(); }, 1100);
  } else {
    g.tries++;
    g.streak = 0;
    updateStreak();
    card.classList.add('wrong');
    audio.play('wrong');
    owlMood($('#owlGame'), 'sad');
    if (g.tries < 2) {
      say($('#bubble'), pick(MSG.wrong));
      g.input = '';
      const qid = g.qid;
      setTimeout(() => { if (g && g.qid === qid && !g.waiting) renderAnswer(); }, 400);
    } else {
      g.input = String(q.ans);
      renderAnswer('solution');
      const steps = hintsFor(q);
      const key = steps.find((x) => x.startsWith('Bloco')) || steps[Math.min(1, steps.length - 1)];
      say($('#bubble'), `A resposta é <b>${q.ans}</b>. Lembra-te: ${key}<br>Toca em ➜ para continuar.`);
      g.i++;
      g.waiting = true;
      const okKey = $('#okKey');
      okKey.textContent = '➜'; okKey.classList.add('next'); okKey.setAttribute('aria-label', 'Continuar');
    }
  }
}

function updateStreak() {
  const el = $('#streak');
  el.textContent = g.streak >= 2 ? `🔥 ${g.streak}` : '';
  el.classList.remove('hot'); void el.offsetWidth; if (g.streak >= 2) el.classList.add('hot');
}

function showHint() {
  if (!g || !g.q) return;
  if (g.waiting && g.tries < 2) return;
  const steps = hintsFor(g.q);
  const idx = g.hint % steps.length;
  if (idx + 1 > g.hintsSeen && !g.waiting) g.hintsSeen = idx + 1;
  say($('#bubble'), `<span class="tag">Dica ${idx + 1} de ${steps.length}</span><br>${steps[idx]}`);
  g.hint++;
  audio.play('hint');
  owlMood($('#owlGame'), 'think');
}

function askClaude() {
  if (!g || !g.q) return;
  const text = `Estou a treinar cálculo mental. Explica-me passo a passo, de forma simples, como fazer ${qText(g.q)} de cabeça.`;
  const url = 'https://claude.ai/new?q=' + encodeURIComponent(text);
  const done = () => toast('Pergunta copiada. A abrir o Claude…');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done); else done();
  audio.play('select');
  window.open(url, '_blank', 'noopener');
}

function endGame() {
  $('#bar').style.width = '100%';
  const acc = g.firstTry / ROUND;
  const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
  const titles = ['Continua a treinar!', 'Bom começo!', 'Muito bem!', 'És um mestre!'];
  const key = bestKey();
  const prev = store.get(key, 0);
  const isRecord = g.score > prev;
  if (isRecord) store.set(key, g.score);

  show('end');
  $('#endTitle').textContent = titles[stars];
  $('#endScore').textContent = g.score;
  $('#endStats').textContent = `${g.firstTry} de ${ROUND} à primeira · melhor sequência: ${g.bestStreak}`;
  $('#record').textContent = isRecord && g.score > 0 ? '🏆 Novo recorde!' : prev ? `Recorde: ${prev} pontos` : '';
  $$('#stars span').forEach((s, i) => s.classList.toggle('on', i < stars));
  owlMood($('#owlEnd'), stars >= 2 ? 'happy' : 'sad', 3000);
  audio.play('win');
  for (let i = 0; i < stars; i++) setTimeout(() => audio.play('star'), 400 + i * 250);
  if (stars >= 2) confetti(120);
  g = null;
}

/* ---------------- Confetes ---------------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function confetti(n) {
  if (reduceMotion) return;
  const cv = $('#confetti'), ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const colors = ['#3DDC84', '#FF6B6B', '#FFC93C', '#4CC9F0', '#FF8FD8', '#FFF8E7'];
  const card = $('#card').getBoundingClientRect();
  const ox = card.width ? card.left + card.width / 2 : innerWidth / 2, oy = card.width ? card.top + card.height / 2 : innerHeight / 3;
  const ps = Array.from({ length: n }, () => ({
    x: ox, y: oy, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 12 - 4,
    r: Math.random() * 6 + 4, c: pick(colors), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 1
  }));
  let frame = 0;
  (function loop() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach((p) => {
      p.vy += 0.4; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.012;
      ctx.save(); ctx.globalAlpha = Math.max(p.life, 0); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
    });
    if (++frame < 90) requestAnimationFrame(loop); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })();
}

/* ---------------- Toast ---------------- */
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------- Ligações ---------------- */
function init() {
  ['#owlHome', '#owlGame', '#owlEnd'].forEach((s) => { $(s).innerHTML = owlSVG(); });

  const sky = $('#sky');
  for (let i = 0; i < 40; i++) {
    const st = document.createElement('div');
    st.className = 'star';
    st.style.left = Math.random() * 100 + '%';
    st.style.top = Math.random() * 100 + '%';
    st.style.animationDelay = (Math.random() * 3).toFixed(2) + 's';
    const sz = Math.random() < 0.2 ? 4 : 2;
    st.style.width = st.style.height = sz + 'px';
    sky.appendChild(st);
  }

  say($('#bubbleHome'), 'Olá! Sou o Mocho. Escolhe a conta e o nível. Toca em mim para aprenderes um truque!');
  refreshHome();
  updateToggles();

  // O áudio no iPhone só arranca depois de um toque
  const unlock = () => audio.init();
  document.addEventListener('pointerdown', unlock, { passive: true });

  $$('.op-tile').forEach((t) => t.addEventListener('click', () => {
    state.op = t.dataset.op; store.set('op', state.op); audio.play('select'); refreshHome();
    say($('#bubbleHome'), randomTrick(state.op));
  }));
  $$('.level').forEach((l) => l.addEventListener('click', () => {
    state.lvl = l.dataset.lvl; store.set('lvl', state.lvl); audio.play('select'); refreshHome();
  }));

  $('#playBtn').addEventListener('click', () => { audio.play('select'); startGame(); });
  $('#againBtn').addEventListener('click', () => { audio.play('select'); startGame(); });
  $('#menuBtn').addEventListener('click', () => { audio.play('tap'); refreshHome(); show('home'); });
  $('#quitBtn').addEventListener('click', () => { audio.play('tap'); g = null; refreshHome(); show('home'); });

  $('#owlHome').addEventListener('click', () => { audio.play('hoot'); owlMood($('#owlHome'), 'talk'); say($('#bubbleHome'), randomTrick(state.op)); });
  $('#owlGame').addEventListener('click', () => { audio.play('hoot'); owlMood($('#owlGame'), 'talk'); say($('#bubble'), randomTrick(g && g.q ? g.q.op : state.op)); });

  $('#hintBtn').addEventListener('click', showHint);
  $('#askBtn').addEventListener('click', askClaude);

  // pointerdown em vez de click: o iOS ignora toques rápidos seguidos (trata-os como duplo toque)
  $('#pad').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    e.preventDefault();
    press(b.dataset.k);
    b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 100);
  });
  // click só para teclado/leitor de ecrã (detail === 0); toques já foram tratados acima
  $('#pad').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && e.detail === 0) press(b.dataset.k); });

  document.addEventListener('keydown', (e) => {
    if (!$('#game').classList.contains('active')) return;
    let k = null;
    if (/^[0-9]$/.test(e.key)) k = e.key;
    else if (e.key === 'Backspace') k = 'del';
    else if (e.key === 'Enter') k = 'ok';
    else if (e.key === 'h' || e.key === 'H') return showHint();
    if (!k) return;
    e.preventDefault();
    audio.init();
    press(k);
    const btn = $(`#pad [data-k="${k}"]`);
    if (btn) { btn.classList.add('pressed'); setTimeout(() => btn.classList.remove('pressed'), 100); }
  });

  $('#soundBtn').addEventListener('click', () => { audio.init(); audio.soundOn = !audio.soundOn; store.set('sound', audio.soundOn); updateToggles(); audio.play('select'); });
  $('#musicBtn').addEventListener('click', () => {
    audio.init(); audio.musicOn = !audio.musicOn; store.set('music', audio.musicOn);
    audio.musicOn ? audio.startMusic() : audio.stopMusic(); updateToggles();
  });

  document.addEventListener('visibilitychange', () => {
    if (!audio.ctx) return;
    if (document.hidden) audio.ctx.suspend(); else audio.ctx.resume();
  });

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
}

function updateToggles() {
  const s = $('#soundBtn'), m = $('#musicBtn');
  s.textContent = audio.soundOn ? '🔊' : '🔇';
  s.classList.toggle('off', !audio.soundOn);
  m.classList.toggle('off', !audio.musicOn);
  s.setAttribute('aria-pressed', String(audio.soundOn));
  m.setAttribute('aria-pressed', String(audio.musicOn));
}

init();
