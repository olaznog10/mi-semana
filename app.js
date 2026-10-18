/*
 * Mi semana — calendario, rutinas y juegos para peques.
 * Sin dependencias ni compilación. Tiene que funcionar en el Safari de iOS 12:
 * nada de ?. ni ??, ni Pointer Events, ni módulos, ni APIs posteriores a 2018.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Datos fijos

  const STORAGE_KEY = 'mi-semana.v1';
  const STATE_VERSION = 2;

  const SLOTS = [
    { id: 'manana', name: 'Mañana', say: 'Por la mañana', icon: '☀️' },
    { id: 'tarde', name: 'Tarde', say: 'Por la tarde', icon: '🌤️' },
    { id: 'noche', name: 'Noche', say: 'Por la noche', icon: '🌙' }
  ];
  const SLOT_BY_ID = { manana: SLOTS[0], tarde: SLOTS[1], noche: SLOTS[2] };

  const DAY_NAMES = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const DAY_SHORT = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const DAY_LETTER = ['', 'L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const DAY_TYPES = {
    cole: { icon: '🏫', label: 'Día de cole' },
    casa: { icon: '🏡', label: 'Día en casa' }
  };

  const EVENT_WHEN = [
    { id: 'dia', label: 'Todo el día' },
    { id: 'manana', label: 'Por la mañana' },
    { id: 'tarde', label: 'Por la tarde' },
    { id: 'noche', label: 'Por la noche' }
  ];

  // Solo emojis que existen en iOS 12 (Emoji 11). Uno más nuevo saldría como un cuadrado.
  const EMOJI_CHOICES = [
    '🥣', '🍎', '🍌', '🍓', '🥕', '🥛', '🍝', '🥪', '🍕', '🧁', '🍪', '🍽️',
    '🦷', '🛁', '🚿', '🧼', '🚽', '👕', '🧦', '👟', '🧥', '🎒', '🌜', '😴',
    '🧸', '🧩', '🖍️', '🎨', '📖', '📺', '🎵', '🎹', '🥁', '⚽', '🚲', '🛴',
    '🏊', '🤸', '🧱', '🚂', '🦖', '🎈', '🌳', '🏞️', '🏖️', '🛒', '🏫', '🏡',
    '👵', '👴', '🎂', '🎁', '🎉', '🐶', '🐱', '🐟', '🦁', '🚗', '🚌', '✈️',
    '🏥', '💇', '🧺', '🌈', '⭐', '❤️', '🤗', '🎭', '🎲'
  ];
  const EVENT_EMOJIS = ['🎉', '🎁', '🎈', '👵', '👴', '🏖️', '✈️', '🚗', '🏥', '🎪', '🦁',
    '🏊', '⚽', '🎭', '🎄', '🎃', '⭐'];

  const DEFAULT_LIBRARY = {
    desayunar: { emoji: '🥣', label: 'Desayunar' },
    vestirse: { emoji: '👕', label: 'Vestirse' },
    dientes: { emoji: '🦷', label: 'Lavarse los dientes' },
    cole: { emoji: '🏫', label: 'Ir al cole' },
    comer: { emoji: '🍝', label: 'Comer' },
    merendar: { emoji: '🍎', label: 'Merendar' },
    parque: { emoji: '🌳', label: 'Ir al parque' },
    jugar: { emoji: '🧸', label: 'Jugar con juguetes' },
    juego: { emoji: '🎲', label: 'Juego del día', game: true },
    puzle: { emoji: '🧩', label: 'Puzles' },
    pintar: { emoji: '🖍️', label: 'Pintar' },
    recoger: { emoji: '🧺', label: 'Recoger los juguetes' },
    mochila: { emoji: '🎒', label: 'Preparar la mochila' },
    manos: { emoji: '🧼', label: 'Lavarse las manos' },
    banio: { emoji: '🛁', label: 'Bañarse' },
    cenar: { emoji: '🍽️', label: 'Cenar' },
    dibujos: { emoji: '📺', label: 'Ver dibujos' },
    pijama: { emoji: '🌜', label: 'Ponerse el pijama' },
    pis: { emoji: '🚽', label: 'Hacer pis' },
    cuento: { emoji: '📖', label: 'Leer un cuento' },
    dormir: { emoji: '😴', label: 'A dormir' }
  };

  // Propuesta inicial: cole de lunes a viernes, un juego cada tarde, baño en
  // días alternos y la misma rutina de antes de dormir todos los días.
  function defaultWeek() {
    const morning = ['desayunar', 'vestirse', 'dientes', 'cole'];
    const night = ['cenar', 'dibujos', 'pijama', 'dientes', 'pis', 'cuento', 'dormir'];
    const bathNight = ['banio'].concat(night);
    const day = (type, manana, tarde, noche) => ({
      type: type,
      items: { manana: manana.slice(), tarde: tarde.slice(), noche: noche.slice() }
    });
    return {
      1: day('cole', morning, ['merendar', 'parque', 'juego', 'recoger'], bathNight),
      2: day('cole', morning, ['merendar', 'jugar', 'juego', 'recoger'], night),
      3: day('cole', morning, ['merendar', 'parque', 'juego', 'recoger'], bathNight),
      4: day('cole', morning, ['merendar', 'pintar', 'juego', 'recoger'], night),
      5: day('cole', morning, ['merendar', 'parque', 'juego', 'recoger'], bathNight),
      6: day('casa', ['desayunar', 'dientes', 'vestirse', 'puzle'], ['comer', 'parque', 'juego', 'merendar'], night),
      7: day('casa', ['desayunar', 'dientes', 'vestirse', 'jugar'], ['comer', 'merendar', 'juego', 'mochila'], bathNight)
    };
  }

  // Juegos
  const GAMES = [
    { id: 'contar', icon: '🔢', name: 'Contar' },
    { id: 'escribir', icon: '✍️', name: 'Escribir' },
    { id: 'parejas', icon: '🐶', name: 'Parejas' }
  ];
  const COUNT_ROUNDS = 5;
  const COUNT_THINGS = [
    { e: '🍎', q: '¿Cuántas manzanas hay?', a: 'manzanas' },
    { e: '🐟', q: '¿Cuántos peces hay?', a: 'peces' },
    { e: '⭐', q: '¿Cuántas estrellas hay?', a: 'estrellas' },
    { e: '🚗', q: '¿Cuántos coches hay?', a: 'coches' },
    { e: '🎈', q: '¿Cuántos globos hay?', a: 'globos' },
    { e: '🐶', q: '¿Cuántos perritos hay?', a: 'perritos' },
    { e: '🌸', q: '¿Cuántas flores hay?', a: 'flores' },
    { e: '🦆', q: '¿Cuántos patitos hay?', a: 'patitos' },
    { e: '🍓', q: '¿Cuántas fresas hay?', a: 'fresas' },
    { e: '⚽', q: '¿Cuántas pelotas hay?', a: 'pelotas' }
  ];
  const PAIR_ANIMALS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🦁', '🐮', '🐷', '🐯'];

  const GEAR_SVG = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/>' +
    '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 ' +
    '1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 ' +
    '1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 ' +
    '4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 ' +
    '1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06' +
    'A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

  // ---------------------------------------------------------------------------
  // Utilidades

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseKey(key) {
    const p = key.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function weekday(d) { return d.getDay() === 0 ? 7 : d.getDay(); } // 1 = lunes … 7 = domingo
  function today() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function todayKey() { return dateKey(today()); }
  function toMinutes(hhmm) {
    const p = String(hhmm || '0:0').split(':');
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }
  function longDate(d) { return d.getDate() + ' de ' + MONTHS[d.getMonth()]; }
  function shortDate(d) { return DAY_SHORT[weekday(d)].toLowerCase() + ' ' + d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()]; }
  function isLeap(y) { return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function newId(prefix) { return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36); }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  // ---------------------------------------------------------------------------
  // Estado (se guarda en el propio iPad)

  function defaultState() {
    return {
      version: STATE_VERSION,
      name: '',
      sound: true,
      tardeFrom: '13:30',
      nocheFrom: '19:30',
      library: clone(DEFAULT_LIBRARY),
      week: defaultWeek(),
      events: [],
      done: {}
    };
  }

  // Lleva un estado guardado por una versión anterior a la actual.
  function migrate(s) {
    if ((s.version || 1) < 2) {
      // v2: un juego cada tarde.
      if (!s.library.juego) s.library.juego = clone(DEFAULT_LIBRARY.juego);
      for (let d = 1; d <= 7; d++) {
        const tarde = s.week[d].items.tarde;
        if (tarde.indexOf('juego') >= 0) continue;
        const r = tarde.indexOf('recoger');
        if (r >= 0) tarde.splice(r, 0, 'juego');
        else tarde.push('juego');
      }
    }
    s.version = STATE_VERSION;
    return s;
  }

  function loadState() {
    const base = defaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return migrate(Object.assign(base, JSON.parse(raw)));
    } catch (e) {
      // Sin almacenamiento disponible: arrancamos con la propuesta.
    }
    return base;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Nada que hacer: la app sigue funcionando, solo que no recordará los cambios.
    }
  }

  // Borra estrellas antiguas y fechas especiales que ya pasaron hace tiempo.
  // Los cumpleaños se quedan: se repiten cada año.
  function prune() {
    const doneLimit = dateKey(addDays(today(), -14));
    Object.keys(state.done).forEach(k => { if (k < doneLimit) delete state.done[k]; });
    const eventLimit = dateKey(addDays(today(), -30));
    state.events = state.events.filter(e => e.kind === 'cumple' || e.date >= eventLimit);
    save();
  }

  function currentSlot() {
    const n = new Date();
    const m = n.getHours() * 60 + n.getMinutes();
    if (m >= toMinutes(state.nocheFrom)) return 'noche';
    if (m >= toMinutes(state.tardeFrom)) return 'tarde';
    return 'manana';
  }

  // ---------------------------------------------------------------------------
  // Fechas especiales y cumpleaños

  function eventOn(e, key) {
    if (e.kind !== 'cumple') return e.date === key;
    const md = e.date.slice(5);
    const kmd = key.slice(5);
    if (md === kmd) return true;
    // Los del 29 de febrero se celebran el 28 los años que no son bisiestos.
    return md === '02-29' && kmd === '02-28' && !isLeap(+key.slice(0, 4));
  }

  // Próximo día (desde `fromKey`) en que toca la fecha.
  function nextDate(e, fromKey) {
    if (e.kind !== 'cumple') return e.date;
    const y = +fromKey.slice(0, 4);
    const md = e.date.slice(5);
    return y + '-' + md >= fromKey ? y + '-' + md : (y + 1) + '-' + md;
  }

  function isChild(who) {
    return !!state.name && String(who).trim().toLowerCase() === state.name.trim().toLowerCase();
  }

  // Texto para ver y para decir en voz alta.
  function eventText(e, key) {
    if (e.kind !== 'cumple') return { label: e.label, say: e.label };
    const age = +key.slice(0, 4) - e.birthYear;
    if (isChild(e.who)) {
      return age > 0
        ? { label: '¡Tu cumple! ' + age + ' años', say: '¡Es tu cumple! ¡Cumples ' + age + ' años!' }
        : { label: '¡Tu cumple!', say: '¡Es tu cumple!' };
    }
    return age > 0
      ? { label: 'Cumple de ' + e.who + ' · ' + age + ' años', say: 'Es el cumple de ' + e.who + '. ¡Cumple ' + age + ' años!' }
      : { label: 'Cumple de ' + e.who, say: 'Es el cumple de ' + e.who + '.' };
  }

  // Lo que toca un día concreto: la rutina de su día de la semana, salvo que
  // una fecha especial diga que no hay cole y pida usar otra rutina.
  function planFor(d) {
    const key = dateKey(d);
    const events = state.events.filter(e => eventOn(e, key));
    const holiday = events.filter(e => e.noCole)[0];
    const wd = weekday(d);
    const tpl = state.week[holiday ? holiday.useDay : wd] || state.week[wd];
    return {
      key: key,
      wd: wd,
      type: holiday ? 'casa' : tpl.type,
      items: tpl.items,
      events: events,
      holiday: !!holiday
    };
  }

  function cardsFor(plan, slot) {
    const cards = [];
    plan.events.forEach(e => {
      if (e.slot !== slot) return;
      const t = eventText(e, plan.key);
      cards.push({ key: 'ev:' + e.id, emoji: e.emoji, label: t.label, say: t.say, special: true });
    });
    (plan.items[slot] || []).forEach(id => {
      const a = state.library[id];
      if (a) cards.push({ key: slot + ':' + id, emoji: a.emoji, label: a.label, say: a.label, game: !!a.game });
    });
    return cards;
  }

  function typeInfo(plan) {
    if (plan.type === 'cole') return { cls: 'cole', icon: '🏫', label: 'Día de cole' };
    if (plan.wd >= 6 && !plan.holiday) return { cls: 'casa', icon: '🏡', label: 'Fin de semana' };
    return { cls: 'casa', icon: '🏡', label: 'No hay cole' };
  }

  function daySentence(plan, isToday) {
    const name = DAY_NAMES[plan.wd];
    const hay = plan.type === 'cole' ? 'hay cole' : 'no hay cole';
    let s = isToday ? 'Hoy es ' + name + '. Hoy ' + hay + '.' : 'El ' + name + ' ' + hay + '.';
    if (plan.type !== 'cole' && plan.wd >= 6 && !plan.holiday) s += ' ¡Es fin de semana!';
    plan.events.forEach(e => { s += ' ' + eventText(e, plan.key).say; });
    return s;
  }

  // "Faltan 3 noches para el fin de semana": a esta edad se cuentan noches.
  function countdown(t) {
    if (planFor(t).type === 'cole') {
      for (let i = 1; i <= 14; i++) {
        const p = planFor(addDays(t, i));
        if (p.type === 'cole') continue;
        const weekend = p.wd >= 6;
        const text = i === 1
          ? (weekend ? '¡Mañana es fin de semana!' : 'Mañana no hay cole')
          : 'Faltan ' + i + ' noches para ' + (weekend ? 'el fin de semana' : 'quedarte en casa');
        return { text: text, icons: '🌙'.repeat(Math.min(i, 7)) };
      }
      return null;
    }
    return planFor(addDays(t, 1)).type === 'cole'
      ? { text: 'Mañana hay cole', icons: '🏫' }
      : { text: 'Mañana tampoco hay cole', icons: '🏡' };
  }

  // ---------------------------------------------------------------------------
  // Voz y sonido

  let voice = null;
  function pickVoice() {
    if (voice || !window.speechSynthesis) return voice;
    const voices = window.speechSynthesis.getVoices();
    voice = voices.filter(v => /^es[-_]ES/i.test(v.lang))[0] ||
      voices.filter(v => /^es/i.test(v.lang))[0] || null;
    return voice;
  }

  function speak(text, queue) {
    if (!state.sound || !text || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      if (!queue) window.speechSynthesis.cancel();
      const u = new window.SpeechSynthesisUtterance(text);
      u.lang = 'es-ES';
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = 0.9;
      u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    } catch (e) {
      // Sin voz no pasa nada.
    }
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audio = null;
  function chime(notes) {
    if (!state.sound || !AudioCtx) return;
    try {
      if (!audio) audio = new AudioCtx();
      if (audio.state === 'suspended') audio.resume();
      const t = audio.currentTime;
      (notes || [659.25, 783.99, 1046.5]).forEach((f, i) => {
        const start = t + i * 0.09;
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
        o.connect(g);
        g.connect(audio.destination);
        o.start(start);
        o.stop(start + 0.55);
      });
    } catch (e) {
      // Sin sonido no pasa nada.
    }
  }

  // ---------------------------------------------------------------------------
  // Estado de la interfaz

  const state = loadState();
  const appEl = document.getElementById('app');
  const parentEl = document.getElementById('parent');
  const modalEl = document.getElementById('modal');
  const gameEl = document.getElementById('game');
  const celebrateEl = document.getElementById('celebrate');

  const ui = {
    todayKey: todayKey(),
    nowSlot: currentSlot(),
    date: todayKey(),
    slot: currentSlot(),
    weekOffset: 0,
    parent: false,
    ptab: 'semana',
    pday: 1,
    modal: null,
    game: null,
    evDraft: null
  };
  let lastTouch = Date.now();
  let celebrateTimer = null;
  let gameTimer = null;

  function newEventDraft(kind) {
    return {
      kind: kind || 'cumple',
      date: dateKey(addDays(today(), 1)),
      emoji: '🎉',
      label: '',
      who: '',
      birthYear: '',
      slot: 'dia',
      noCole: false,
      useDay: 6
    };
  }
  ui.evDraft = newEventDraft();

  function goToday() {
    ui.date = todayKey();
    ui.weekOffset = 0;
    ui.slot = currentSlot();
  }

  // ---------------------------------------------------------------------------
  // Vista del peque

  function renderKid() {
    const t = today();
    const tKey = dateKey(t);
    const isToday = ui.date === tKey;
    const plan = planFor(parseKey(ui.date));
    const info = typeInfo(plan);
    const done = state.done[plan.key] || {};
    const board = document.getElementById('board');
    const keepScroll = board && board.getAttribute('data-view') === ui.date + ui.slot ? board.scrollTop : 0;

    let html = '<header class="top">';
    html += '<button class="title" data-act="say-day">';
    if (isToday && state.name) html += '<span class="hello">¡Hola, ' + esc(state.name) + '!</span>';
    html += '<span class="dayname">' + (isToday ? 'Hoy es ' : 'El ') + '<b>' + DAY_NAMES[plan.wd] + '</b></span>';
    html += '<span class="date">' + longDate(parseKey(ui.date)) + '</span>';
    html += '</button>';

    html += '<div class="status">';
    html += '<button class="pill ' + info.cls + '" data-act="say-day">' + info.icon + ' ' + info.label + '</button>';
    if (isToday) {
      const c = countdown(t);
      if (c) {
        html += '<button class="countdown" data-act="say" data-text="' + esc(c.text) + '">' +
          '<span class="cd-icons">' + c.icons + '</span>' + esc(c.text) + '</button>';
      }
    } else {
      html += '<button class="back-today" data-act="go-today">↩ Volver a hoy</button>';
    }
    html += '</div>';
    html += '<button class="gear" data-act="gate" aria-label="Zona de mayores">' + GEAR_SVG + '</button>';
    html += '</header>';

    html += renderWeek(t, tKey);

    const dayEvents = plan.events.filter(e => e.slot === 'dia');
    if (dayEvents.length) {
      html += '<div class="banners">';
      dayEvents.forEach(e => {
        const text = eventText(e, plan.key);
        html += '<button class="banner" data-act="say" data-text="' + esc(text.say) + '">' +
          '<span class="banner-emoji">' + esc(e.emoji) + '</span><span class="banner-text">' + esc(text.label) + '</span></button>';
      });
      html += '</div>';
    }

    html += '<nav class="slots">';
    SLOTS.forEach(s => {
      const cards = cardsFor(plan, s.id);
      const n = cards.filter(c => done[c.key]).length;
      let dots = '';
      for (let i = 0; i < cards.length; i++) dots += '<i class="dot' + (i < n ? ' on' : '') + '"></i>';
      html += '<button class="slot-tab slot-' + s.id + (ui.slot === s.id ? ' is-active' : '') + '" data-act="slot" data-slot="' + s.id + '">';
      html += '<span class="slot-icon">' + s.icon + '</span>';
      html += '<span class="slot-text"><span class="slot-name">' + s.name + '</span><span class="dots">' + dots + '</span></span>';
      if (isToday && ui.nowSlot === s.id) html += '<span class="now">Ahora</span>';
      html += '</button>';
    });
    html += '</nav>';

    const cards = cardsFor(plan, ui.slot);
    html += '<main class="board" id="board" data-view="' + ui.date + ui.slot + '">';
    if (!cards.length) {
      html += '<div class="empty"><span class="empty-emoji">🍃</span>Nada por aquí</div>';
    } else {
      html += '<div class="cards">';
      cards.forEach((c, i) => {
        html += '<button class="card' + (done[c.key] ? ' is-done' : '') + (c.special ? ' is-special' : '') +
          (c.game ? ' is-game' : '') + '" data-act="card" data-key="' + esc(c.key) + '">';
        html += '<span class="card-step">' + (c.special ? '★' : i + 1) + '</span>';
        html += '<span class="card-emoji">' + esc(c.emoji) + '</span>';
        html += '<span class="card-label">' + esc(c.label) + '</span>';
        html += '<span class="card-check" aria-hidden="true">✓</span>';
        html += '</button>';
      });
      html += '</div>';
    }
    html += '</main>';

    appEl.innerHTML = html;
    if (keepScroll) document.getElementById('board').scrollTop = keepScroll;
  }

  function renderWeek(t, tKey) {
    const start = addDays(t, 1 - weekday(t) + ui.weekOffset * 7);
    let html = '<nav class="week">';
    html += '<button class="wk-arrow" data-act="week" data-dir="-1"' + (ui.weekOffset <= -1 ? ' disabled' : '') +
      ' aria-label="Semana anterior">‹</button>';
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      const p = planFor(d);
      const cls = ['wday', 'type-' + p.type];
      if (p.key < tKey) cls.push('is-past');
      if (p.key === ui.date) cls.push('is-selected');
      if (p.key === tKey) cls.push('is-today');
      html += '<button class="' + cls.join(' ') + '" data-act="day" data-date="' + p.key + '">';
      html += '<span class="wday-name">' + DAY_SHORT[p.wd] + '</span>';
      html += '<span class="wday-num">' + d.getDate() + '</span>';
      html += '<span class="wday-icon">' + DAY_TYPES[p.type].icon + '</span>';
      if (p.events.length) html += '<span class="wday-ev">' + esc(p.events[0].emoji) + '</span>';
      if (p.key === tKey) html += '<span class="wday-today">Hoy</span>';
      html += '</button>';
    }
    html += '<button class="wk-arrow" data-act="week" data-dir="1"' + (ui.weekOffset >= 3 ? ' disabled' : '') +
      ' aria-label="Semana siguiente">›</button>';
    html += '</nav>';
    return html;
  }

  function toggleCard(key) {
    const isToday = ui.date === todayKey();
    const plan = planFor(parseKey(ui.date));
    const card = cardsFor(plan, ui.slot).filter(c => c.key === key)[0];
    if (!card) return;
    // Los otros días solo se miran (y se escuchan), no se marcan.
    if (!isToday) {
      speak(card.say);
      return;
    }
    if (card.game) {
      openGame(key, ui.slot);
      return;
    }
    const done = state.done[plan.key] || {};
    if (done[key]) {
      delete done[key];
      save();
      renderKid();
      speak(card.say);
      return;
    }
    markDone(key, ui.slot, card.say + '. ¡Muy bien!');
  }

  // Marca una tarjeta de hoy como hecha; si era la última de esa parte del día, lo celebra.
  function markDone(key, slot, sayText) {
    const plan = planFor(today());
    const done = state.done[plan.key] || (state.done[plan.key] = {});
    done[key] = true;
    save();
    renderKid();
    const fresh = Array.prototype.filter.call(appEl.querySelectorAll('.card'), n => n.getAttribute('data-key') === key)[0];
    if (fresh) fresh.className += ' pop';
    chime();
    speak(sayText);
    if (cardsFor(plan, slot).every(c => done[c.key])) setTimeout(() => celebrate(slot, plan), 700);
  }

  function celebrate(slot, plan) {
    const sub = {
      manana: plan.type === 'cole' ? '¡A por el cole!' : '¡A por el día!',
      tarde: '¡Qué buena tarde!',
      noche: '¡Buenas noches!'
    }[slot];
    celebrateEl.innerHTML = '<div class="cheer"><span class="cheer-mark">✓</span><h2>¡Muy bien!</h2><p>' + sub + '</p></div>';
    celebrateEl.className = 'celebrate show';
    chime([523.25, 659.25, 783.99, 1046.5]);
    speak('¡Muy bien! ' + sub, true);
    clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(hideCelebrate, 3000);
  }

  function hideCelebrate() {
    clearTimeout(celebrateTimer);
    celebrateEl.className = 'celebrate';
  }

  // ---------------------------------------------------------------------------
  // Juegos

  function openGame(key, slot) {
    ui.game = { key: key, slot: slot, view: 'menu' };
    renderGame();
    speak('¿A qué jugamos?');
  }

  function closeGame() {
    clearTimeout(gameTimer);
    ui.game = null;
    renderGame();
  }

  // Al terminar un juego se marca la tarjeta que lo abrió.
  function finishGame(sayText) {
    const g = ui.game;
    closeGame();
    if (ui.date !== todayKey()) {
      speak(sayText);
      return;
    }
    ui.slot = g.slot;
    markDone(g.key, g.slot, sayText);
  }

  function startGame(id) {
    const g = ui.game;
    clearTimeout(gameTimer);
    g.view = id;
    g.round = 0;
    if (id === 'contar') {
      g.thing = null;
      newCountRound(g);
      renderGame();
      speak(g.thing.q);
    } else if (id === 'escribir') {
      g.letters = nameLetters();
      g.idx = 0;
      g.solved = false;
      renderGame();
      speak(state.name
        ? 'Vamos a escribir ' + state.name + '. Empieza por la ' + g.letters[0]
        : 'Vamos a escribir las vocales. Empieza por la A');
    } else if (id === 'parejas') {
      newPairs(g);
      renderGame();
      speak('Busca las parejas');
    }
  }

  function newCountRound(g) {
    let thing;
    do {
      thing = COUNT_THINGS[Math.floor(Math.random() * COUNT_THINGS.length)];
    } while (thing === g.thing);
    // Empieza con pocos y va subiendo: 2–4 en la primera ronda, hasta 2–8 en la última.
    const max = Math.min(9, 4 + g.round);
    const n = 2 + Math.floor(Math.random() * (max - 1));
    const options = [n];
    while (options.length < 3) {
      const x = Math.max(1, n - 3) + Math.floor(Math.random() * 7);
      if (x <= 10 && options.indexOf(x) < 0) options.push(x);
    }
    g.thing = thing;
    g.n = n;
    g.options = options.sort((a, b) => a - b);
    g.counted = [];
    g.wrong = [];
    g.solved = false;
  }

  function nameLetters() {
    const clean = String(state.name || '').toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑÇ]/g, '');
    return (clean || 'AEIOU').split('').slice(0, 8);
  }

  function newPairs(g) {
    const animals = shuffle(PAIR_ANIMALS.slice()).slice(0, 4);
    g.cards = shuffle(animals.concat(animals)).map(e => ({ e: e, open: false, matched: false }));
    g.first = -1;
    g.lock = false;
  }

  const GAME_VIEWS = {
    menu: () => {
      let html = '<button class="g-ask" data-act="say" data-text="¿A qué jugamos?">¿A qué jugamos?</button><div class="g-menu">';
      GAMES.forEach(x => {
        html += '<button class="g-pick" data-act="game-open" data-game="' + x.id + '"><span class="g-pick-icon">' + x.icon +
          '</span><span class="g-pick-name">' + x.name + '</span></button>';
      });
      return html + '</div>';
    },

    contar: g => {
      let html = '<button class="g-ask" data-act="say" data-text="' + esc(g.thing.q) + '">' + esc(g.thing.q) + '</button>';
      html += '<div class="count-field">';
      for (let i = 0; i < g.n; i++) {
        const order = g.counted.indexOf(i);
        html += '<button class="count-item' + (order >= 0 ? ' is-counted' : '') + '" data-act="count-tap" data-i="' + i + '">' +
          g.thing.e + (order >= 0 ? '<span class="count-num">' + (order + 1) + '</span>' : '') + '</button>';
      }
      html += '</div><div class="count-answers">';
      g.options.forEach(o => {
        const wrong = g.wrong.indexOf(o) >= 0;
        const right = g.solved && o === g.n;
        html += '<button class="count-ans' + (wrong ? ' is-wrong' : '') + (right ? ' is-right' : '') + '" data-act="count-answer" data-n="' +
          o + '"' + (wrong || g.solved ? ' disabled' : '') + '>' + o + '</button>';
      });
      return html + '</div>';
    },

    escribir: g => {
      let html = '<div class="trace-word">';
      g.letters.forEach((l, i) => {
        html += '<button class="trace-letter' + (i < g.idx ? ' is-done' : i === g.idx ? ' is-current' : '') +
          '" data-act="say" data-text="La ' + esc(l) + '">' + esc(l) + '</button>';
      });
      html += '</div><p class="g-hint">Repasa la letra con el dedo</p>';
      html += '<div class="trace-box" id="trace-box"><canvas id="trace-canvas"></canvas></div>';
      html += '<div class="trace-actions"><button class="btn" data-act="trace-clear">Borrar</button></div>';
      return html;
    },

    parejas: g => {
      let html = '<button class="g-ask" data-act="say" data-text="Busca las parejas">Busca las parejas</button><div class="pairs">';
      g.cards.forEach((c, i) => {
        const shown = c.open || c.matched;
        html += '<button class="pair' + (shown ? ' is-open' : '') + (c.matched ? ' is-matched' : '') + '" data-act="pair-flip" data-i="' + i + '">' +
          (shown ? c.e : '') + '</button>';
      });
      return html + '</div>';
    }
  };

  function renderGame() {
    const g = ui.game;
    if (!g) {
      gameEl.className = '';
      gameEl.innerHTML = '';
      return;
    }
    const meta = GAMES.filter(x => x.id === g.view)[0];
    let html = '<div class="g-head"><button class="btn g-back" data-act="game-back">' + (g.view === 'menu' ? '✕ Salir' : '‹ Juegos') + '</button>';
    html += '<span class="g-title">' + (meta ? meta.icon + ' ' + meta.name : 'Juegos') + '</span><span class="g-progress">';
    if (g.view === 'contar') {
      for (let i = 0; i < COUNT_ROUNDS; i++) html += '<i class="dot' + (i < g.round ? ' on' : '') + '"></i>';
    }
    html += '</span></div>';
    html += '<div class="g-body g-' + g.view + '">' + GAME_VIEWS[g.view](g) + '</div>';
    gameEl.className = 'is-open';
    gameEl.innerHTML = html;
    if (g.view === 'escribir') setupTracing(g);
  }

  function segmentDistance(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = dx * dx + dy * dy;
    const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
    const ex = a.x + t * dx - p.x;
    const ey = a.y + t * dy - p.y;
    return Math.sqrt(ex * ex + ey * ey);
  }

  // Dibuja la letra en gris y deja repasarla con el dedo. Se da por buena
  // cuando el trazo ha pasado por tres cuartas partes de la letra sin salirse
  // demasiado (para que no valga garabatear toda la pizarra).
  function setupTracing(g) {
    const box = document.getElementById('trace-box');
    const canvas = document.getElementById('trace-canvas');
    const w = box.clientWidth;
    const h = box.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const letter = g.letters[g.idx];
    // Las letras con tilde (como la Í) se dibujan algo más pequeñas y bajas para que quepa la tilde.
    const accented = /[ÁÉÍÓÚÜ]/.test(letter);
    const size = Math.round(Math.min(h * (accented ? 0.68 : 0.8), w * 0.75));
    const baseline = h / 2 + size * (accented ? 0.47 : 0.35);
    const font = '800 ' + size + 'px Nunito, sans-serif';
    function paintLetter(c, color) {
      c.font = font;
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillStyle = color;
      c.fillText(letter, w / 2, baseline);
    }
    paintLetter(ctx, '#E9E4DA');

    // Puntos de la letra para saber cuánto ha repasado.
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    paintLetter(octx, '#000');
    const data = octx.getImageData(0, 0, w, h).data;
    const pts = [];
    for (let y = 5; y < h; y += 10) {
      for (let x = 5; x < w; x += 10) {
        if (data[(y * w + x) * 4 + 3] > 128) pts.push({ x: x, y: y, hit: false });
      }
    }

    const brush = size * 0.12;
    const reach = brush / 2 + 8;

    // Zona "cerca de la letra": la letra ensanchada un trazo por cada lado.
    const cell = 10;
    const cols = Math.ceil(w / cell);
    const near = [];
    const r = Math.ceil(brush / cell);
    pts.forEach(p => {
      const cx = Math.floor(p.x / cell);
      const cy = Math.floor(p.y / cell);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) near[(cy + dy) * cols + cx + dx] = true;
        }
      }
    });
    let inked = 0;
    let outside = 0;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brush;
    ctx.strokeStyle = '#B9714B';

    let last = null;
    function point(ev) {
      const r = canvas.getBoundingClientRect();
      const t = ev.changedTouches ? ev.changedTouches[0] : ev;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }
    function draw(a, b) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      pts.forEach(p => { if (!p.hit && segmentDistance(p, a, b) <= reach) p.hit = true; });
      const steps = Math.max(1, Math.round(Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y)) / 4));
      for (let i = 0; i < steps; i++) {
        const x = a.x + (b.x - a.x) * i / steps;
        const y = a.y + (b.y - a.y) * i / steps;
        inked++;
        if (!near[Math.floor(y / cell) * cols + Math.floor(x / cell)]) outside++;
      }
    }
    function start(ev) {
      if (g.solved) return;
      ev.preventDefault();
      lastTouch = Date.now();
      last = point(ev);
      draw(last, last);
    }
    function move(ev) {
      if (!last) return;
      ev.preventDefault();
      const p = point(ev);
      draw(last, p);
      last = p;
    }
    function end() {
      if (!last) return;
      last = null;
      if (g.solved) return;
      if (inked > 60 && outside / inked > 0.4) {
        g.solved = true;
        speak('¡Uy! Repasa solo la letra.');
        gameTimer = setTimeout(() => {
          if (ui.game !== g) return;
          g.solved = false;
          renderGame();
        }, 1200);
        return;
      }
      const hits = pts.filter(p => p.hit).length;
      if (pts.length && hits / pts.length >= 0.75) {
        paintLetter(ctx, 'rgba(110, 154, 94, 0.55)');
        letterTraced(g);
      }
    }
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
    canvas.addEventListener('touchcancel', end);
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
  }

  function letterTraced(g) {
    g.solved = true;
    const box = document.getElementById('trace-box');
    if (box) box.className += ' is-done';
    chime();
    speak('¡La ' + g.letters[g.idx] + '! ¡Muy bien!');
    gameTimer = setTimeout(() => {
      if (ui.game !== g) return;
      g.idx++;
      g.solved = false;
      if (g.idx >= g.letters.length) {
        finishGame(state.name ? '¡Has escrito ' + state.name + '!' : '¡Has escrito las vocales!');
        return;
      }
      renderGame();
      speak('Ahora, la ' + g.letters[g.idx]);
    }, 1600);
  }

  // ---------------------------------------------------------------------------
  // Ventanas (puerta de mayores, añadir, editar, copiar)

  const MODALS = {
    gate: m => {
      let keys = '';
      ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(k => {
        keys += '<button class="key" data-act="key" data-k="' + k + '">' + k + '</button>';
      });
      keys += '<button class="key" data-act="key" data-k="del" aria-label="Borrar">⌫</button>';
      keys += '<button class="key" data-act="key" data-k="0">0</button>';
      keys += '<button class="key key-ok" data-act="key" data-k="ok">OK</button>';
      return '<h2>Zona de mayores</h2><p class="muted">Para entrar, resuelve:</p>' +
        '<p class="gate-q">' + m.a + ' × ' + m.b + ' = <span class="gate-in">' + (m.input || '?') + '</span></p>' +
        '<div class="keypad">' + keys + '</div>' +
        '<button class="btn ghost wide" data-act="close-modal">Cancelar</button>';
    },

    add: m => {
      const used = state.week[ui.pday].items[m.slot];
      let html = '<h2>Añadir a la ' + SLOT_BY_ID[m.slot].name.toLowerCase() + ' del ' + DAY_NAMES[ui.pday] + '</h2>';
      html += '<div class="pick-grid">';
      Object.keys(state.library).forEach(id => {
        if (used.indexOf(id) >= 0) return;
        const a = state.library[id];
        html += '<button class="pick" data-act="add-pick" data-id="' + esc(id) + '"><span class="pick-emoji">' +
          esc(a.emoji) + '</span><span class="pick-label">' + esc(a.label) + '</span></button>';
      });
      html += '<button class="pick pick-new" data-act="new-activity"><span class="pick-emoji">＋</span>' +
        '<span class="pick-label">Crear una nueva</span></button>';
      html += '</div><div class="modal-actions"><span class="spacer"></span>' +
        '<button class="btn ghost" data-act="close-modal">Cerrar</button></div>';
      return html;
    },

    edit: m => {
      let html = '<h2>' + (m.id ? 'Editar actividad' : 'Nueva actividad') + '</h2>';
      html += '<div class="edit-top"><span class="edit-preview" id="edit-preview">' + esc(m.draft.emoji) + '</span>';
      html += '<label class="field grow"><span>Nombre</span><input type="text" id="edit-label" data-model="draft:label" value="' +
        esc(m.draft.label) + '" placeholder="Ej.: Ir a natación" maxlength="40" autocomplete="off"></label></div>';
      html += '<div class="emoji-grid">';
      EMOJI_CHOICES.forEach(e => {
        html += '<button class="emo' + (e === m.draft.emoji ? ' is-on' : '') + '" data-act="pick-emoji" data-e="' + e + '">' + e + '</button>';
      });
      html += '</div>';
      html += '<label class="field"><span>…o escribe otro emoji con el teclado</span>' +
        '<input type="text" data-model="draft:emoji" maxlength="8" placeholder="🙂" autocomplete="off"></label>';
      html += '<div class="modal-actions">';
      if (m.id) html += '<button class="btn danger" data-act="delete-activity">Borrar</button>';
      html += '<span class="spacer"></span><button class="btn ghost" data-act="close-modal">Cancelar</button>' +
        '<button class="btn primary" data-act="save-activity">Guardar</button></div>';
      return html;
    },

    copy: m => {
      let html = '<h2>Copiar las actividades del ' + DAY_NAMES[ui.pday] + '</h2>';
      html += '<p class="muted">Sustituyen a las actividades de los días que marques. El tipo de día (cole o casa) no cambia.</p>';
      html += '<div class="p-days">';
      let any = false;
      for (let d = 1; d <= 7; d++) {
        if (d === ui.pday) continue;
        if (m.targets[d]) any = true;
        html += '<button class="chip' + (m.targets[d] ? ' is-on' : '') + '" data-act="copy-toggle" data-day="' + d + '">' +
          DAY_SHORT[d] + '</button>';
      }
      html += '</div><div class="modal-actions"><span class="spacer"></span>' +
        '<button class="btn ghost" data-act="close-modal">Cancelar</button>' +
        '<button class="btn primary" data-act="copy-do"' + (any ? '' : ' disabled') + '>Copiar</button></div>';
      return html;
    }
  };

  function renderModal() {
    const m = ui.modal;
    if (!m) {
      modalEl.innerHTML = '';
      return;
    }
    modalEl.innerHTML = '<div class="backdrop" data-act="close-modal"><div class="modal modal-' + m.type +
      (m.wrong ? ' shake' : '') + '" data-act="noop">' + MODALS[m.type](m) + '</div></div>';
    m.wrong = false;
  }

  function closeModal() {
    ui.modal = null;
    renderModal();
  }

  function openGate() {
    ui.modal = { type: 'gate', input: '' };
    newGateQuestion(ui.modal);
    renderModal();
  }

  function newGateQuestion(m) {
    m.a = 3 + Math.floor(Math.random() * 7);
    m.b = 3 + Math.floor(Math.random() * 7);
    m.input = '';
  }

  function gateKey(k) {
    const m = ui.modal;
    if (k === 'del') {
      m.input = m.input.slice(0, -1);
    } else if (k === 'ok') {
      if (parseInt(m.input, 10) === m.a * m.b) {
        ui.modal = null;
        renderModal();
        openParent();
        return;
      }
      newGateQuestion(m);
      m.wrong = true;
    } else if (m.input.length < 3) {
      m.input += k;
    }
    renderModal();
  }

  // ---------------------------------------------------------------------------
  // Zona de mayores

  const PTABS = [
    { id: 'semana', label: '📅 Semana' },
    { id: 'actividades', label: '🧸 Actividades' },
    { id: 'fechas', label: '🎂 Fechas especiales' },
    { id: 'ajustes', label: '⚙️ Ajustes' }
  ];

  function openParent() {
    ui.parent = true;
    ui.ptab = 'semana';
    ui.pday = weekday(parseKey(ui.date));
    renderParent();
  }

  function closeParent() {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    ui.parent = false;
    parentEl.className = '';
    parentEl.innerHTML = '';
    goToday();
    renderKid();
  }

  function renderParent() {
    const body = parentEl.querySelector('.p-body');
    const keepScroll = body && body.getAttribute('data-tab') === ui.ptab ? body.scrollTop : 0;
    let html = '<div class="p-head"><h1>Zona de mayores</h1>' +
      '<button class="btn primary" data-act="parent-close">Listo</button></div>';
    html += '<nav class="p-tabs">';
    PTABS.forEach(t => {
      html += '<button class="p-tab' + (ui.ptab === t.id ? ' is-on' : '') + '" data-act="ptab" data-tab="' + t.id + '">' + t.label + '</button>';
    });
    html += '</nav>';
    html += '<div class="p-body" data-tab="' + ui.ptab + '">' + PANELS[ui.ptab]() + '</div>';
    parentEl.className = 'is-open';
    parentEl.innerHTML = html;
    if (keepScroll) parentEl.querySelector('.p-body').scrollTop = keepScroll;
  }

  function iconBtn(act, label, slot, i, dir, disabled) {
    return '<button class="ib' + (act === 'rm' ? ' danger' : '') + '" data-act="' + act + '" data-slot="' + slot +
      '" data-i="' + i + '"' + (dir ? ' data-dir="' + dir + '"' : '') + (disabled ? ' disabled' : '') + '>' + label + '</button>';
  }

  function field(label, input) {
    return '<label class="field"><span>' + label + '</span>' + input + '</label>';
  }

  function usedOn(id) {
    const days = [];
    for (let d = 1; d <= 7; d++) {
      const items = state.week[d].items;
      if (SLOTS.some(s => items[s.id].indexOf(id) >= 0)) days.push(DAY_LETTER[d]);
    }
    return days.length ? days.join(' ') : 'Sin usar';
  }

  const PANELS = {
    semana: () => {
      const day = state.week[ui.pday];
      let html = '<div class="p-days">';
      for (let d = 1; d <= 7; d++) {
        html += '<button class="chip' + (d === ui.pday ? ' is-on' : '') + '" data-act="pday" data-day="' + d + '">' +
          DAY_SHORT[d] + ' ' + DAY_TYPES[state.week[d].type].icon + '</button>';
      }
      html += '</div>';

      html += '<div class="p-row"><span class="p-label">El ' + DAY_NAMES[ui.pday] + ' es…</span><div class="seg">';
      ['cole', 'casa'].forEach(t => {
        html += '<button class="seg-btn' + (day.type === t ? ' is-on' : '') + '" data-act="ptype" data-type="' + t + '">' +
          DAY_TYPES[t].icon + ' ' + DAY_TYPES[t].label + '</button>';
      });
      html += '</div><span class="spacer"></span><button class="btn ghost" data-act="copy-open">Copiar a otros días…</button></div>';

      html += '<div class="p-slots">';
      SLOTS.forEach(s => {
        const ids = day.items[s.id];
        html += '<section class="p-slot p-slot-' + s.id + '"><h3>' + s.icon + ' ' + s.name + '</h3>';
        if (!ids.length) html += '<p class="muted small">Sin actividades</p>';
        html += '<ol class="p-list">';
        ids.forEach((id, i) => {
          const a = state.library[id];
          if (!a) return;
          html += '<li class="p-item"><span class="p-emoji">' + esc(a.emoji) + '</span><span class="p-text">' + esc(a.label) + '</span>' +
            iconBtn('mv', '↑', s.id, i, -1, i === 0) +
            iconBtn('mv', '↓', s.id, i, 1, i === ids.length - 1) +
            iconBtn('rm', '✕', s.id, i) + '</li>';
        });
        html += '</ol><button class="btn add" data-act="add-open" data-slot="' + s.id + '">＋ Añadir</button></section>';
      });
      html += '</div>';
      html += '<p class="muted small">Los cambios se guardan solos en este iPad.</p>';
      return html;
    },

    actividades: () => {
      let html = '<p class="muted">Toca una actividad para cambiar su dibujo o su nombre. El cambio se aplica a todos los días. ' +
        'El «Juego del día» abre los juegos (contar, escribir su nombre y parejas).</p>';
      html += '<div class="pick-grid">';
      Object.keys(state.library).forEach(id => {
        const a = state.library[id];
        html += '<button class="pick" data-act="edit-activity" data-id="' + esc(id) + '"><span class="pick-emoji">' + esc(a.emoji) +
          '</span><span class="pick-label">' + esc(a.label) + '</span><span class="pick-uses">' + usedOn(id) + '</span></button>';
      });
      html += '<button class="pick pick-new" data-act="new-activity"><span class="pick-emoji">＋</span>' +
        '<span class="pick-label">Nueva actividad</span></button>';
      html += '</div>';
      return html;
    },

    fechas: () => {
      const d = ui.evDraft;
      const cumple = d.kind === 'cumple';
      let html = '<section class="p-card"><h3>Añadir una fecha especial</h3>';
      html += '<div class="p-row"><div class="seg">' +
        '<button class="seg-btn' + (cumple ? ' is-on' : '') + '" data-act="ev-kind" data-kind="cumple">🎂 Cumpleaños</button>' +
        '<button class="seg-btn' + (cumple ? '' : ' is-on') + '" data-act="ev-kind" data-kind="otro">📅 Otra fecha</button>' +
        '</div></div>';
      html += '<p class="muted small">' + (cumple
        ? 'Se repite cada año y la app dice cuántos años cumple.'
        : 'Excursiones, visitas, días sin cole…') + '</p>';
      html += '<div class="form-grid">';
      if (cumple) {
        html += field('Día del cumple', '<input type="date" data-model="ev:date" value="' + esc(d.date) + '">');
        html += field('¿De quién es?', '<input type="text" data-model="ev:who" value="' + esc(d.who) +
          '" placeholder="Ej.: la abuela" maxlength="30" autocomplete="off">');
        html += field('Año de nacimiento', '<input type="number" inputmode="numeric" pattern="[0-9]*" min="1900" max="' +
          today().getFullYear() + '" data-model="ev:birthYear" value="' + esc(d.birthYear) + '" placeholder="Ej.: 1956">');
        html += '</div>';
      } else {
        html += field('Día', '<input type="date" data-model="ev:date" value="' + esc(d.date) + '">');
        html += field('Qué es', '<input type="text" data-model="ev:label" value="' + esc(d.label) +
          '" placeholder="Ej.: Excursión a la granja" maxlength="40" autocomplete="off">');
        let when = '<select data-model="ev:slot">';
        EVENT_WHEN.forEach(w => {
          when += '<option value="' + w.id + '"' + (d.slot === w.id ? ' selected' : '') + '>' + w.label + '</option>';
        });
        html += field('Cuándo', when + '</select>');
        html += '</div><div class="emoji-row">';
        EVENT_EMOJIS.forEach(e => {
          html += '<button class="emo' + (e === d.emoji ? ' is-on' : '') + '" data-act="ev-emoji" data-e="' + e + '">' + e + '</button>';
        });
        html += '</div>';
        html += '<div class="p-row"><label class="check"><input type="checkbox" data-model="ev:noCole"' + (d.noCole ? ' checked' : '') +
          '> Ese día no hay cole</label>';
        if (d.noCole) {
          html += '<span class="muted">y se usa la rutina del&nbsp;</span><select class="inline" data-model="ev:useDay">';
          for (let i = 1; i <= 7; i++) {
            html += '<option value="' + i + '"' + (+d.useDay === i ? ' selected' : '') + '>' + DAY_NAMES[i] + '</option>';
          }
          html += '</select>';
        }
        html += '</div>';
      }
      html += '<div class="modal-actions"><span class="spacer"></span><button class="btn primary" data-act="ev-add">Añadir fecha</button></div>';
      html += '</section>';

      const tKey = todayKey();
      const upcoming = state.events
        .map(e => ({ e: e, next: nextDate(e, tKey) }))
        .filter(x => x.next >= tKey)
        .sort((a, b) => (a.next < b.next ? -1 : a.next > b.next ? 1 : 0));
      html += '<section class="p-card"><h3>Próximas fechas</h3>';
      if (!upcoming.length) html += '<p class="muted">Todavía no hay ninguna.</p>';
      upcoming.forEach(x => {
        const e = x.e;
        let text;
        let tags;
        if (e.kind === 'cumple') {
          const age = +x.next.slice(0, 4) - e.birthYear;
          text = 'Cumple de ' + e.who;
          tags = '<span class="tag">Cada año</span>' + (age > 0 ? '<span class="tag">Cumple ' + age + '</span>' : '');
        } else {
          const when = EVENT_WHEN.filter(w => w.id === e.slot)[0];
          text = e.label;
          tags = '<span class="tag">' + esc(when ? when.label : '') + '</span>' + (e.noCole ? '<span class="tag">Sin cole</span>' : '');
        }
        html += '<div class="ev-row"><span class="ev-date">' + shortDate(parseKey(x.next)) + '</span>' +
          '<span class="p-emoji">' + esc(e.emoji) + '</span><span class="p-text">' + esc(text) + '</span>' + tags +
          '<button class="ib danger" data-act="ev-rm" data-id="' + esc(e.id) + '" aria-label="Quitar">✕</button></div>';
      });
      html += '</section>';
      return html;
    },

    ajustes: () => {
      let html = '<section class="p-card">';
      html += field('Nombre del peque (para el saludo y el juego de escribir)', '<input type="text" data-model="set:name" value="' +
        esc(state.name) + '" maxlength="20" autocomplete="off">');
      html += '<div class="p-row"><span class="p-label">Voz y sonidos</span>' +
        '<button class="switch' + (state.sound ? ' is-on' : '') + '" data-act="toggle-sound" aria-label="Voz y sonidos"><span></span></button>' +
        '<span class="spacer"></span><button class="btn ghost" data-act="say" data-text="¡Hola! Así suena mi voz.">Probar la voz</button></div>';
      html += '</section>';

      html += '<section class="p-card"><h3>Partes del día</h3>';
      html += '<p class="muted small">La app abre sola la parte del día que toca.</p>';
      html += '<div class="form-grid">';
      html += field('La tarde empieza a las', '<input type="time" data-model="set:tardeFrom" value="' + esc(state.tardeFrom) + '">');
      html += field('La noche empieza a las', '<input type="time" data-model="set:nocheFrom" value="' + esc(state.nocheFrom) + '">');
      html += '</div></section>';

      html += '<section class="p-card"><h3>Para que no salga de la app</h3>';
      html += '<p class="muted">Activa el Acceso guiado en Ajustes › General › Accesibilidad › Acceso guiado. ' +
        'Luego, con la app abierta, pulsa tres veces el botón de inicio.</p></section>';

      html += '<section class="p-card"><h3>Empezar de nuevo</h3>';
      html += '<p class="muted">Vuelve a la semana y las actividades propuestas. Las fechas especiales se mantienen.</p>';
      html += '<button class="btn danger" data-act="reset">Restaurar la semana propuesta</button></section>';
      return html;
    }
  };

  function setModel(path, value) {
    const p = path.split(':');
    const scope = p[0];
    const key = p[1];
    if (scope === 'draft' && ui.modal && ui.modal.draft) {
      ui.modal.draft[key] = value;
      if (key === 'emoji') {
        const preview = document.getElementById('edit-preview');
        if (preview) preview.textContent = value.trim() || '⭐';
      }
    } else if (scope === 'ev') {
      ui.evDraft[key] = value;
    } else if (scope === 'set') {
      state[key] = value;
      save();
      if (key === 'tardeFrom' || key === 'nocheFrom') ui.nowSlot = currentSlot();
    }
  }

  function saveActivity() {
    const m = ui.modal;
    const label = String(m.draft.label || '').trim();
    const emoji = String(m.draft.emoji || '').trim() || '⭐';
    if (!label) {
      m.wrong = true;
      renderModal();
      return;
    }
    const id = m.id || newId('a');
    // Object.assign conserva marcas como `game` al editar.
    state.library[id] = Object.assign({}, state.library[id], { emoji: emoji, label: label });
    if (m.addTo) state.week[m.addTo.day].items[m.addTo.slot].push(id);
    save();
    closeModal();
    renderParent();
  }

  function deleteActivity() {
    const id = ui.modal.id;
    const a = state.library[id];
    if (!window.confirm('¿Borrar «' + a.label + '»? Se quitará de todos los días.')) return;
    delete state.library[id];
    for (let d = 1; d <= 7; d++) {
      SLOTS.forEach(s => {
        state.week[d].items[s.id] = state.week[d].items[s.id].filter(x => x !== id);
      });
    }
    save();
    closeModal();
    renderParent();
  }

  function addEvent() {
    const d = ui.evDraft;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
      window.alert('Elige el día.');
      return;
    }
    if (d.kind === 'cumple') {
      const who = String(d.who || '').trim();
      const thisYear = today().getFullYear();
      let year = parseInt(d.birthYear, 10);
      // Si en el calendario se eligió la fecha de nacimiento completa, el año sale de ahí.
      if (!year && +d.date.slice(0, 4) < thisYear) year = +d.date.slice(0, 4);
      if (!who) {
        window.alert('Escribe de quién es el cumple.');
        return;
      }
      if (!(year >= 1900 && year <= thisYear)) {
        window.alert('Escribe el año de nacimiento (por ejemplo, 1956).');
        return;
      }
      state.events.push({ id: newId('e'), kind: 'cumple', date: d.date, who: who, birthYear: year, emoji: '🎂', slot: 'dia' });
    } else {
      const label = String(d.label || '').trim();
      if (!label && !d.noCole) {
        window.alert('Escribe qué es.');
        return;
      }
      state.events.push({
        id: newId('e'),
        kind: 'otro',
        date: d.date,
        emoji: d.emoji,
        label: label || 'No hay cole',
        slot: d.slot,
        noCole: !!d.noCole,
        useDay: +d.useDay || 6
      });
    }
    save();
    ui.evDraft = newEventDraft(d.kind);
    renderParent();
  }

  // ---------------------------------------------------------------------------
  // Acciones

  function listFor(el) { return state.week[ui.pday].items[el.getAttribute('data-slot')]; }

  const actions = {
    'noop': () => {},
    'say': el => speak(el.getAttribute('data-text')),
    'say-day': () => speak(daySentence(planFor(parseKey(ui.date)), ui.date === todayKey())),
    'day': el => {
      ui.date = el.getAttribute('data-date');
      if (ui.date === todayKey()) ui.slot = currentSlot();
      renderKid();
      actions['say-day']();
    },
    'go-today': () => {
      goToday();
      renderKid();
      actions['say-day']();
    },
    'week': el => {
      ui.weekOffset += +el.getAttribute('data-dir');
      renderKid();
    },
    'slot': el => {
      ui.slot = el.getAttribute('data-slot');
      renderKid();
      speak(SLOT_BY_ID[ui.slot].say);
    },
    'card': el => toggleCard(el.getAttribute('data-key')),
    'hide-celebrate': hideCelebrate,

    'game-back': () => {
      if (ui.game.view === 'menu') {
        closeGame();
        return;
      }
      clearTimeout(gameTimer);
      ui.game.view = 'menu';
      renderGame();
    },
    'game-open': el => startGame(el.getAttribute('data-game')),
    'count-tap': el => {
      const g = ui.game;
      const i = +el.getAttribute('data-i');
      if (g.counted.indexOf(i) < 0) g.counted.push(i);
      renderGame();
      speak(String(g.counted.indexOf(i) + 1));
    },
    'count-answer': el => {
      const g = ui.game;
      const n = +el.getAttribute('data-n');
      if (g.solved) return;
      if (n !== g.n) {
        g.wrong.push(n);
        renderGame();
        speak('Casi. ¡Vuelve a contar!');
        return;
      }
      g.solved = true;
      g.round++;
      renderGame();
      chime();
      speak('¡Sí! Hay ' + n + ' ' + g.thing.a + '.');
      gameTimer = setTimeout(() => {
        if (ui.game !== g) return;
        if (g.round >= COUNT_ROUNDS) {
          finishGame('¡Muy bien! ¡Has contado todo!');
          return;
        }
        newCountRound(g);
        renderGame();
        speak(g.thing.q);
      }, 2200);
    },
    'trace-clear': () => {
      if (ui.game.solved) return;
      renderGame();
    },
    'pair-flip': el => {
      const g = ui.game;
      const c = g.cards[+el.getAttribute('data-i')];
      if (g.lock || c.open || c.matched) return;
      c.open = true;
      if (g.first < 0) {
        g.first = +el.getAttribute('data-i');
        renderGame();
        return;
      }
      const a = g.cards[g.first];
      g.first = -1;
      if (a.e === c.e) {
        a.matched = true;
        c.matched = true;
        renderGame();
        chime();
        speak('¡Pareja!');
        if (g.cards.every(x => x.matched)) {
          gameTimer = setTimeout(() => {
            if (ui.game === g) finishGame('¡Muy bien! ¡Has encontrado todas las parejas!');
          }, 1200);
        }
        return;
      }
      g.lock = true;
      renderGame();
      gameTimer = setTimeout(() => {
        if (ui.game !== g) return;
        a.open = false;
        c.open = false;
        g.lock = false;
        renderGame();
      }, 1100);
    },

    'gate': openGate,
    'key': el => gateKey(el.getAttribute('data-k')),
    'close-modal': closeModal,

    'parent-close': closeParent,
    'ptab': el => {
      ui.ptab = el.getAttribute('data-tab');
      renderParent();
    },
    'pday': el => {
      ui.pday = +el.getAttribute('data-day');
      renderParent();
    },
    'ptype': el => {
      state.week[ui.pday].type = el.getAttribute('data-type');
      save();
      renderParent();
    },
    'mv': el => {
      const list = listFor(el);
      const i = +el.getAttribute('data-i');
      const j = i + (+el.getAttribute('data-dir'));
      if (j < 0 || j >= list.length) return;
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
      save();
      renderParent();
    },
    'rm': el => {
      listFor(el).splice(+el.getAttribute('data-i'), 1);
      save();
      renderParent();
    },
    'add-open': el => {
      ui.modal = { type: 'add', slot: el.getAttribute('data-slot') };
      renderModal();
    },
    'add-pick': el => {
      state.week[ui.pday].items[ui.modal.slot].push(el.getAttribute('data-id'));
      save();
      closeModal();
      renderParent();
    },
    'new-activity': () => {
      const addTo = ui.modal && ui.modal.type === 'add' ? { day: ui.pday, slot: ui.modal.slot } : null;
      ui.modal = { type: 'edit', id: null, draft: { emoji: '⭐', label: '' }, addTo: addTo };
      renderModal();
    },
    'edit-activity': el => {
      const id = el.getAttribute('data-id');
      const a = state.library[id];
      ui.modal = { type: 'edit', id: id, draft: { emoji: a.emoji, label: a.label }, addTo: null };
      renderModal();
    },
    'pick-emoji': el => {
      ui.modal.draft.emoji = el.getAttribute('data-e');
      renderModal();
    },
    'save-activity': saveActivity,
    'delete-activity': deleteActivity,
    'copy-open': () => {
      ui.modal = { type: 'copy', targets: {} };
      renderModal();
    },
    'copy-toggle': el => {
      const d = el.getAttribute('data-day');
      ui.modal.targets[d] = !ui.modal.targets[d];
      renderModal();
    },
    'copy-do': () => {
      const from = state.week[ui.pday].items;
      Object.keys(ui.modal.targets).forEach(d => {
        if (ui.modal.targets[d]) state.week[d].items = clone(from);
      });
      save();
      closeModal();
      renderParent();
    },
    'ev-kind': el => {
      ui.evDraft.kind = el.getAttribute('data-kind');
      renderParent();
    },
    'ev-emoji': el => {
      ui.evDraft.emoji = el.getAttribute('data-e');
      renderParent();
    },
    'ev-add': addEvent,
    'ev-rm': el => {
      const id = el.getAttribute('data-id');
      state.events = state.events.filter(e => e.id !== id);
      save();
      renderParent();
    },
    'toggle-sound': () => {
      state.sound = !state.sound;
      save();
      renderParent();
    },
    'reset': () => {
      if (!window.confirm('¿Volver a la semana y las actividades propuestas? Se perderán tus cambios en la semana.')) return;
      const fresh = defaultState();
      state.library = fresh.library;
      state.week = fresh.week;
      save();
      renderParent();
    }
  };

  document.addEventListener('click', ev => {
    const el = ev.target.closest ? ev.target.closest('[data-act]') : null;
    if (!el || el.disabled) return;
    lastTouch = Date.now();
    const fn = actions[el.getAttribute('data-act')];
    if (fn) fn(el);
  });

  function onField(ev) {
    const el = ev.target;
    const model = el.getAttribute && el.getAttribute('data-model');
    if (!model) return;
    lastTouch = Date.now();
    if (el.type === 'checkbox') {
      setModel(model, el.checked);
      // Solo se repinta con casillas: repintar al salir de un campo de texto
      // se comería el toque en el botón que el usuario acaba de pulsar.
      if (ev.type === 'change') renderParent();
    } else {
      setModel(model, el.value);
    }
  }
  document.addEventListener('input', onField);
  document.addEventListener('change', onField);

  // Que no se pueda hacer zoom con los dedos.
  document.addEventListener('gesturestart', ev => ev.preventDefault());

  // ---------------------------------------------------------------------------
  // Reloj: cambio de día, de parte del día y vuelta a "hoy" tras un rato

  function tick() {
    const tKey = todayKey();
    const slot = currentSlot();
    let changed = false;
    if (tKey !== ui.todayKey) {
      if (ui.date === ui.todayKey) ui.date = tKey;
      ui.todayKey = tKey;
      ui.weekOffset = 0;
      prune();
      changed = true;
    }
    if (slot !== ui.nowSlot) {
      ui.nowSlot = slot;
      if (ui.date === tKey && !ui.game) ui.slot = slot;
      changed = true;
    }
    if (!ui.parent && !ui.game && (ui.date !== tKey || ui.weekOffset !== 0) && Date.now() - lastTouch > 3 * 60 * 1000) {
      goToday();
      changed = true;
    }
    if (changed && !ui.parent) renderKid();
  }

  setInterval(tick, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  window.addEventListener('pageshow', tick);
  if (window.speechSynthesis && 'onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => { voice = null; };
  }

  prune();
  renderKid();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
