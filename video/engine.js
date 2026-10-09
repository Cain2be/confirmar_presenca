// Base compartilhada dos vídeos tutoriais (1920x1080, 30s).
// A página define: T (tempos), SUCCESS_T, TAPS, START_URL, END_TAG, SCREENS() (HTML das telas do celular),
// FAN_LABELS, fanState(i, q) (estado estático de cada celular do leque) e build() (as cenas), e chama start().
// Toda animação fica na timeline pausada `tl`: com ?render a página expõe window.seekTo(t) e window.renderAudio().

// Imagens usadas nos vídeos. Para trocar a foto ou a logo, substitua os arquivos em img/ e grave de novo.
const PHOTO_SRC = '../img/casal.jpg';
const LOGO_SRC  = '../img/logo-cl.png';

const RENDER = new URLSearchParams(location.search).has('render');
const BAR = 2.7, BEAT = BAR / 4;   // ~89 BPM

// gerador pseudoaleatório com semente: o vídeo sai igual em toda gravação
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ═══════════════ ícones e ilustrações ═══════════════
const IC = {
    lock: '<svg viewBox="0 0 24 24" fill="#666"><path d="M6 10V8a6 6 0 1 1 12 0v2h1v12H5V10h1zm2 0h8V8a4 4 0 1 0-8 0v2z"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8V21"/><path d="M3 12h18"/><path d="M12 8c-1.5-2-4-3.5-4-5a2 2 0 1 1 4 2"/><path d="M12 8c1.5-2 4-3.5 4-5a2 2 0 1 0-4 2"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    enter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 17l5-5-5-5v3H2v4h8v3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>',
    hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V5a2 2 0 1 1 4 0v5"/><path d="M13 10V9a2 2 0 1 1 4 0v3"/><path d="M17 11a2 2 0 1 1 4 0v3a7 7 0 0 1-7 7h-2c-2.5 0-4-1-5.5-2.5L3 15a2 2 0 0 1 3-2.6L9 15"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5.2 4H2V2h4.6l.9 2H22l-3.6 8.5a2 2 0 0 1-1.8 1.2H8.1l-.9 1.6V16H19v2H7a2 2 0 0 1-1.7-3l1.4-2.4L5.2 4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 7h12l-1 14H7L6 7zm3-4h6l1 2h4v2H4V5h4l1-2z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    tab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="11" x2="12" y2="17"/><circle cx="12" cy="7.5" r=".6" fill="currentColor"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>',
};

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const stage = document.getElementById('stage');
const phone = document.getElementById('phone');
const P = s => $(s, phone);                       // só dentro do celular principal
const topIn = (el, root) => { let y = 0; while (el && el !== root) { y += el.offsetTop; el = el.offsetParent; } return y; };

// ═══════════════ nosso site (topo comum aos dois vídeos) ═══════════════
function screenSite(extra = '') {
    return `<div class="scr s-site"><div class="pg">
        <section class="o-hero"><img src="${PHOTO_SRC}" alt=""><div class="o-ov"></div>
            <div class="o-hc"><img class="o-logo" src="${LOGO_SRC}" alt=""><div class="o-names">Caio e Looh</div><div class="o-type">Chá de Casa</div>
            <div class="o-date">Domingo, 15 de Novembro · 15h</div><div class="o-addr">Rua Benedito Marques da Silva, 280</div></div></section>
        <section class="o-cd"><div><b>36</b><span>DIAS</span></div><div><b>19</b><span>HORAS</span></div><div><b>34</b><span>MIN</span></div><div><b>08</b><span>SEG</span></div></section>
        <div class="o-orn">${IC.star}</div>
        <div class="o-cards">
            <div class="o-card o-gift tgt"><div class="o-hl"></div><div class="o-ic">${IC.gift}</div><b>Lista de Presentes</b><span>Selecione seu presente no nosso site</span><div class="tap"></div></div>
            <div class="o-card o-rsvp tgt"><div class="o-hl"></div><div class="o-ic">${IC.users}</div><b>Confirmar Presença</b><span>Confirme você e sua família</span><div class="tap"></div></div>
        </div>
        ${extra}
    </div></div>`;
}

function phoneHTML() {
    return `<div class="ph-screen">
        <div class="ph-status"><span>9:41</span><span><svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 16 12"><path d="M8 3a9 9 0 0 1 6.4 2.6l1.2-1.2A10.7 10.7 0 0 0 8 1.3 10.7 10.7 0 0 0 .4 4.4l1.2 1.2A9 9 0 0 1 8 3zm0 3.4a5.6 5.6 0 0 1 4 1.6l1.2-1.2A7.3 7.3 0 0 0 8 4.7a7.3 7.3 0 0 0-5.2 2.1L4 8a5.6 5.6 0 0 1 4-1.6zM8 9.6l2-2a2.8 2.8 0 0 0-4 0z"/></svg><svg viewBox="0 0 27 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="#111" opacity=".4"/><rect x="2" y="2" width="19" height="8" rx="2"/><rect x="24" y="4" width="2" height="4" rx="1" opacity=".4"/></svg></span></div>
        <div class="ph-url"><div class="url-pill"><span class="url-lock">${IC.lock}</span><span class="url-t">${START_URL}</span></div><div class="url-prog"></div></div>
        <div class="ph-vp"><div class="vp">${SCREENS()}</div></div>
        <div class="ph-island"></div><div class="ph-home"></div>
    </div>`;
}
phone.innerHTML = phoneHTML();

function fitStage() {
    if (RENDER) return;
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(${(innerWidth - 1920 * k) / 2}px, ${(innerHeight - 1080 * k) / 2}px) scale(${k})`;
}
fitStage(); addEventListener('resize', fitStage);

// partículas
const R = rng(7);
const DOTS = [];
for (let i = 0; i < 46; i++) {
    const d = document.createElement('div'); d.className = 'dot';
    const s = 2 + R() * 4; const gold = R() < .45;
    Object.assign(d.style, { width: s + 'px', height: s + 'px', left: R() * 1920 + 'px', top: R() * 1080 + 'px',
        background: gold ? 'rgba(212,169,79,.75)' : 'rgba(255,255,255,.6)', opacity: (.25 + R() * .55).toFixed(2), filter: s > 4.5 ? 'blur(1px)' : '' });
    $('#dots').appendChild(d); DOTS.push({ d, dx: (R() - .5) * 120, dy: -60 - R() * 160 });
}

// cartões flutuantes
function fcard({ x, y, label, text, sub, icon, gold, shop }) {
    const el = document.createElement('div'); el.className = 'fc';
    el.style.left = x + 'px'; el.style.top = y + 'px';
    const ic = shop ? `<div class="shop" style="background:${shop.bg};color:${shop.fg}">${shop.t}</div>` : `<div class="ci${gold ? ' g' : ''}">${IC[icon]}</div>`;
    el.innerHTML = `${ic}<div>${label ? `<small>${label}</small>` : ''}<b>${text}</b>${sub ? `<em>${sub}</em>` : ''}</div>`;
    stage.appendChild(el); return el;
}

// ═══════════════ timeline ═══════════════
const tl = gsap.timeline({ paused: true });

function stepIn(sel, t) {
    tl.fromTo($$(sel + ' .anim'), { autoAlpha: 0, y: 46, filter: 'blur(14px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .8, stagger: .09, ease: 'power3.out', immediateRender: false }, t);
}
function stepOut(sel, t) {
    tl.to($$(sel + ' .anim'), { autoAlpha: 0, y: -26, filter: 'blur(12px)', duration: .45, stagger: .04, ease: 'power2.in' }, t);
}
function cardIn(el, t, from = { x: 0, y: 24 }) {
    tl.fromTo(el, { autoAlpha: 0, scale: .82, x: from.x, y: from.y }, { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: .6, ease: 'back.out(1.7)', immediateRender: false }, t);
}
function cardOut(el, t) { tl.to(el, { autoAlpha: 0, scale: .9, y: -14, filter: 'blur(8px)', duration: .35, ease: 'power2.in' }, t); }
function tap(el, t) {
    tl.fromTo($('.tap', el), { autoAlpha: .95, scale: .35 }, { autoAlpha: 0, scale: 1.7, duration: .6, ease: 'power2.out', immediateRender: false }, t);
    tl.to(el, { scale: .95, duration: .09, yoyo: true, repeat: 1, ease: 'power1.inOut' }, t);
}
function urlTo(text, t) {
    tl.set(P('.url-prog'), { autoAlpha: 1, scaleX: 0 }, t);
    tl.to(P('.url-prog'), { scaleX: 1, duration: .55, ease: 'power2.inOut' }, t);
    tl.to(P('.url-prog'), { autoAlpha: 0, duration: .2 }, t + .55);
    tl.to(P('.url-t'), { text: { value: text }, duration: .01 }, t + .05);
}
function confetti(t, ox, oy) {
    const r = rng(42), cols = ['#D4A94F', '#F0D58F', '#B8922E', '#ffffff', '#6B8DB5', '#9fb6d3'];
    for (let i = 0; i < 90; i++) {
        const c = document.createElement('div'); c.className = 'conf';
        c.style.left = ox + 'px'; c.style.top = oy + 'px'; c.style.background = cols[i % cols.length];
        stage.appendChild(c);
        const ang = -Math.PI / 2 + (r() - .5) * 2.6, v = 260 + r() * 420, d = 1.3 + r() * .9;
        const dx = Math.cos(ang) * v, dy = Math.sin(ang) * v;
        tl.set(c, { autoAlpha: 1, x: 0, y: 0, rotation: r() * 360, scale: .6 + r() * .8 }, t);
        tl.to(c, { x: dx * 1.25, duration: d, ease: 'power2.out' }, t);
        tl.to(c, { y: dy, duration: d * .42, ease: 'power2.out' }, t);
        tl.to(c, { y: dy + 420 + r() * 260, duration: d * .58, ease: 'power1.in' }, t + d * .42);
        tl.to(c, { rotation: '+=' + (r() > .5 ? 540 : -540), rotationX: 360 * (1 + r()), duration: d, ease: 'none' }, t);
        tl.to(c, { autoAlpha: 0, duration: .35 }, t + d - .3);
    }
}

// ═══════════════ leque final ═══════════════
// Cópias estáticas do celular, uma por passo, com as legendas centralizadas embaixo de cada uma.
function mountFan() {
    const fan = $('#fan'), slots = [];
    const rots = [-11, -5.5, 0, 5.5, 11], ys = [58, 16, 0, 16, 58];
    FAN_LABELS.forEach((label, i) => {
        const cx = 960 + (i - 2) * 340;
        const slot = document.createElement('div'); slot.className = 'slot'; slot.style.left = cx + 'px';
        const ph = document.createElement('div'); ph.className = 'phone'; ph.innerHTML = phoneHTML();
        slot.appendChild(ph); fan.appendChild(slot);
        fanState(i, s => $(s, ph));
        const lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.style.left = cx + 'px';
        lbl.innerHTML = `<i>${i + 1}</i>${label}`; fan.appendChild(lbl);
        slots.push({ slot, lbl, rot: rots[i], y: ys[i] });
    });
    return slots;
}
function fanScene(slots) {
    stepIn('#h6wrap', T.fan + .1);
    slots.forEach(({ slot, rot, y }, i) => {
        tl.fromTo(slot, { autoAlpha: 0, y: 380, rotation: 0, scale: .5 }, { autoAlpha: 1, y, rotation: rot, scale: .6, duration: .8, ease: 'back.out(1.3)', immediateRender: false }, T.fan + .3 + i * .1);
    });
    slots.forEach(({ lbl }, i) => {
        tl.fromTo(lbl, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out', immediateRender: false }, T.fan + 1.1 + i * .17);
    });
    const out = T.end - .45;
    tl.to(slots.map(s => s.slot), { autoAlpha: 0, y: '+=60', filter: 'blur(10px)', duration: .45, stagger: .03, ease: 'power2.in' }, out);
    tl.to(slots.map(s => s.lbl), { autoAlpha: 0, duration: .3 }, out);
    stepOut('#h6wrap', out);
}

// ═══════════════ encerramento: logo, nomes e tagline ═══════════════
function mountEnd() {
    $('#end').innerHTML = `
        <div id="end-logo" class="anim"><img src="${LOGO_SRC}" alt="Caio e Looh"><div id="end-glint"></div></div>
        <div id="end-names" class="anim">Caio e Looh</div>
        <div id="end-div" class="anim"><span></span>${IC.star}<span></span></div>
        <div id="end-tag" class="anim"><span class="kw">${END_TAG}</span></div>`;
}
function endScene() {
    const t = T.end;
    tl.fromTo('#end-logo', { autoAlpha: 0, scale: .86, filter: 'blur(16px)', clipPath: 'inset(0% 0% 100% 0%)' },
        { autoAlpha: 1, scale: 1, filter: 'blur(0px)', clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.out', immediateRender: false }, t);
    // brilho na estrela da logo (a estrela fica a ~48% da largura e ~18% da altura)
    tl.set('#end-glint', { left: '48%', top: '18%' }, t);
    tl.fromTo('#end-glint', { autoAlpha: 0, scale: .2, rotation: 0 }, { autoAlpha: 1, scale: 1.4, rotation: 45, duration: .45, ease: 'power2.out', immediateRender: false }, t + 1.0);
    tl.to('#end-glint', { autoAlpha: 0, scale: .4, duration: .6, ease: 'power2.in' }, t + 1.45);
    tl.fromTo(['#end-names', '#end-div', '#end-tag'], { autoAlpha: 0, y: 36, filter: 'blur(12px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .8, stagger: .14, ease: 'power3.out', immediateRender: false }, t + .45);
    tl.fromTo('#end-div span', { scaleX: 0 }, { scaleX: 1, duration: .8, ease: 'power3.out', immediateRender: false }, t + .8);
    tl.to('#end', { scale: 1.04, duration: T.total - t, ease: 'none' }, t);
    tl.set({}, {}, T.total);
}

// ═══════════════ fundo ═══════════════
function backgroundScene() {
    DOTS.forEach(({ d, dx, dy }) => tl.to(d, { x: dx, y: dy, duration: T.total, ease: 'none' }, 0));
    tl.fromTo('#glow', { x: 0, y: 0 }, { x: 420, y: 160, duration: T.total, ease: 'sine.inOut' }, 0);
}

// ═══════════════ música (Web Audio, sem arquivo) ═══════════════
// Acordes D–A–Bm–G, 1 compasso = 2,7s. Também toca um clique em cada toque (TAPS) e um brilho no sucesso.
function buildMusic(ctx, t0) {
    const rnd = rng(99);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .2;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, t0); master.gain.linearRampToValueAtTime(.85, t0 + .9);
    master.gain.setValueAtTime(.85, t0 + 27.8); master.gain.linearRampToValueAtTime(0, t0 + 30);
    master.connect(comp); comp.connect(ctx.destination);
    const dly = ctx.createDelay(1); dly.delayTime.value = BEAT * .75;
    const fb = ctx.createGain(); fb.gain.value = .3; const wet = ctx.createGain(); wet.gain.value = .25;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 3500;
    dly.connect(dlp); dlp.connect(fb); fb.connect(dly); dlp.connect(wet); wet.connect(master);
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    const mf = m => 440 * Math.pow(2, (m - 69) / 12);

    function tone(type, freq, t, dur, g, { att = .005, send = 0, cutoff = 0, detune = 0, glideTo = 0 } = {}) {
        const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t0 + t); o.detune.value = detune;
        if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + t + dur * .6);
        const e = ctx.createGain(); e.gain.setValueAtTime(0, t0 + t);
        e.gain.linearRampToValueAtTime(g, t0 + t + att); e.gain.exponentialRampToValueAtTime(.0001, t0 + t + dur);
        let n = o;
        if (cutoff) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; o.connect(f); n = f; }
        n.connect(e); e.connect(master);
        if (send) { const s = ctx.createGain(); s.gain.value = send; e.connect(s); s.connect(dly); }
        o.start(t0 + t); o.stop(t0 + t + dur + .05);
    }
    function hit(t, dur, g, type, freq, q = 1) {
        const s = ctx.createBufferSource(); s.buffer = noise;
        const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
        const e = ctx.createGain(); e.gain.setValueAtTime(g, t0 + t); e.gain.exponentialRampToValueAtTime(.0001, t0 + t + dur);
        s.connect(f); f.connect(e); e.connect(master); s.start(t0 + t, rnd() * .5); s.stop(t0 + t + dur + .02);
    }
    function pad(notes, t, dur, g) {
        notes.forEach(m => [-7, 7].forEach(dt => {
            const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mf(m); o.detune.value = dt;
            const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100;
            const e = ctx.createGain(); e.gain.setValueAtTime(0, t0 + t); e.gain.linearRampToValueAtTime(g, t0 + t + .5);
            e.gain.setValueAtTime(g, t0 + t + dur - .2); e.gain.linearRampToValueAtTime(0, t0 + t + dur + .5);
            o.connect(f); f.connect(e); e.connect(master); o.start(t0 + t); o.stop(t0 + t + dur + .6);
        }));
    }
    const CH = [   // pad, baixo
        { pad: [62, 66, 69], bass: 38, arp: [74, 78, 81, 86] },   // D
        { pad: [61, 64, 69], bass: 33, arp: [73, 76, 81, 85] },   // A
        { pad: [62, 66, 71], bass: 35, arp: [74, 78, 83, 86] },   // Bm
        { pad: [62, 67, 71], bass: 31, arp: [74, 79, 83, 86] },   // G
    ];
    const ARP = [0, 1, 2, 1, 3, 2, 1, 2];
    for (let k = 0; k < 10; k++) {
        const t = k * BAR, c = CH[k % 4];
        pad(c.pad, t, BAR, .03);
        for (let i = 0; i < 8; i++) tone('triangle', mf(c.arp[ARP[i]]), t + i * BEAT / 2, .34, .085, { send: .5 });
        [0, 2, 3.5].forEach(b => tone('sine', mf(c.bass), t + b * BEAT, .55, .2, { att: .01 }));
        [0, 2, 3.5].forEach(b => tone('triangle', mf(c.bass + 12), t + b * BEAT, .35, .045, { att: .01, cutoff: 900 }));
        if (k >= 1) [0, 2].forEach(b => tone('sine', 130, t + b * BEAT, .3, .3, { glideTo: 42 }));
        if (k >= 2) [1, 3].forEach(b => hit(t + b * BEAT, .16, .09, 'bandpass', 1900, .8));
        if (k >= 2) for (let i = 0; i < 4; i++) hit(t + (i + .5) * BEAT, .05, .045, 'highpass', 8000);
    }
    // fim: acorde de D sustentado
    pad([62, 66, 69, 74], 27, 2.6, .034);
    tone('sine', mf(38), 27, 3, .22, { att: .02 });
    [74, 78, 81, 86, 90].forEach((m, i) => tone('triangle', mf(m), 27 + i * .12, 1.6, .045, { send: .6 }));
    // transições
    Object.entries(T).filter(([k, v]) => v > 0 && k !== 'total').map(([, v]) => v).forEach(t => {
        const s = ctx.createBufferSource(); s.buffer = noise;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
        f.frequency.setValueAtTime(500, t0 + t - .35); f.frequency.exponentialRampToValueAtTime(4000, t0 + t + .05);
        const e = ctx.createGain(); e.gain.setValueAtTime(0, t0 + t - .35); e.gain.linearRampToValueAtTime(.05, t0 + t - .05); e.gain.exponentialRampToValueAtTime(.0001, t0 + t + .3);
        s.connect(f); f.connect(e); e.connect(master); s.start(t0 + t - .35); s.stop(t0 + t + .35);
    });
    // toques
    TAPS.forEach(t => { tone('sine', 1750, t, .07, .13); tone('triangle', 880, t, .05, .05); });
    // brilho do sucesso
    [86, 90, 93, 98, 102].forEach((m, i) => tone('sine', mf(m), SUCCESS_T + i * .065, 1.4, .07, { send: .7 }));
    hit(SUCCESS_T, .5, .05, 'highpass', 6000);
}

function wavBase64(buf) {
    const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
    const data = new DataView(new ArrayBuffer(44 + len * ch * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); data.setUint32(4, 36 + len * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true); data.setUint32(24, sr, true);
    data.setUint32(28, sr * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true); w(36, 'data'); data.setUint32(40, len * ch * 2, true);
    const chans = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, chans[c][i])); data.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7FFF, true); o += 2; }
    const bytes = new Uint8Array(data.buffer); let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
}

// ═══════════════ início ═══════════════
async function start(fonts = []) {
    gsap.registerPlugin(TextPlugin);
    window.tl_duration = T.total;
    mountEnd();
    await document.fonts.ready;
    await Promise.all(['700 96px Poppins', '300 32px Poppins', '64px "Great Vibes"', 'italic 500 64px "Cormorant Garamond"', '600 20px "Cormorant Garamond"', ...fonts].map(f => document.fonts.load(f)));
    await Promise.all($$('img').map(i => i.decode().catch(() => {})));
    gsap.set('.anim', { autoAlpha: 0 });
    backgroundScene();
    build();
    endScene();
    tl.seek(0);
    if (RENDER) {
        document.getElementById('play').remove();
        window.seekTo = t => { tl.seek(t, false); };           // não devolve a timeline (o Playwright travaria serializando)
        window.renderAudio = async () => {
            const ctx = new OfflineAudioContext(2, Math.round(44100 * T.total), 44100);
            buildMusic(ctx, 0);
            return wavBase64(await ctx.startRendering());
        };
        window.READY = true;
    } else {
        $('#play button').addEventListener('click', () => {
            $('#play').style.display = 'none';
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            buildMusic(ctx, ctx.currentTime + .05);
            tl.play(0);
            tl.eventCallback('onComplete', () => { $('#play').style.display = 'flex'; $('#play button').textContent = '↺ Assistir de novo'; });
        });
    }
}
