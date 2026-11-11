'use strict';
// Grafiki wektorowe wstawiane inline (używają fontu strony). Używane przez build.js.
// Bez zewnętrznych zasobów – nie ma tu żadnych zdjęć ani wymyślonych danych.

const A = '#ffb400', INK = '#1b1f23';

// ---------- 1) HERO: izometryczny przekrój konstrukcji drogi + pinezka „Twoja inwestycja” ----------
function heroSvg() {
  const L = 520, W = 230, S = 26, ox = 266, oy = 215;
  const iso = (x, y, z) => [ox + (x - y) * 0.866, oy + (x + y) * 0.5 - z];
  const P = (pts) => pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  // jedna „kostka” warstwy: ściana lewa (y = w), prawa (x = l), góra (z = z1)
  const box = (l, w, z0, z1, cL, cR, cT, extra = '') => {
    const left = P([iso(0, w, z0), iso(l, w, z0), iso(l, w, z1), iso(0, w, z1)]);
    const right = P([iso(l, 0, z0), iso(l, w, z0), iso(l, w, z1), iso(l, 0, z1)]);
    const top = P([iso(0, 0, z1), iso(l, 0, z1), iso(l, w, z1), iso(0, w, z1)]);
    return `<polygon points="${left}" fill="${cL}"/><polygon points="${right}" fill="${cR}"/><polygon points="${top}" fill="${cT}"/>${extra}`;
  };
  const Z0 = 80, Z1 = 135, Z2 = 165;
  const l1 = L - S, w1 = W - S, l2 = L - 2 * S, w2 = W - 2 * S;

  // kostka brukowa na górnej powierzchni (siatka)
  let grid = '';
  const step = 26;
  for (let x = step; x < l2; x += step) grid += `M${iso(x, 0, Z2).join(' ')}L${iso(x, w2, Z2).join(' ')}`;
  for (let y = step; y < w2; y += step) grid += `M${iso(0, y, Z2).join(' ')}L${iso(l2, y, Z2).join(' ')}`;
  // linie na górnej krawędzi (krawężnik)
  const kerb = `<polyline points="${P([iso(0, w2, Z2), iso(l2, w2, Z2), iso(l2, 0, Z2)])}" fill="none" stroke="#8a929a" stroke-width="2.5" stroke-linejoin="round"/>`;

  // oś drogi + słupki (punkty wytyczenia)
  const a = iso(34, w2 / 2, Z2), b = iso(l2 - 76, w2 / 2, Z2);
  let stakes = '';
  for (let i = 0; i <= 6; i++) {
    const x = 34 + (l2 - 76 - 34) * i / 6, p = iso(x, w2 / 2, Z2);
    stakes += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === 0 || i === 6 ? 6 : 3.6}" fill="${A}"/>`;
  }
  const pin = b; // koniec osi = miejsce inwestycji
  const px = pin[0], py = pin[1];

  // podpisy warstw na ścianach lewych (skos izometryczny)
  const lab = (x, y, z, txt, fill, size) => {
    const p = iso(x, y, z);
    return `<text transform="matrix(0.866 0.5 0 1 ${p[0].toFixed(1)} ${p[1].toFixed(1)})" font-size="${size}" font-weight="800" letter-spacing="1.6" fill="${fill}">${txt}</text>`;
  };

  // cień pod bryłą
  const shadow = P([iso(0, 0, 0), iso(L, 0, 0), iso(L, W, 0), iso(0, W, 0)].map(p => [p[0] + 6, p[1] + 20]));

  // kropkowana siatka tła
  const dots = [];
  for (let y = 40; y < 640; y += 40) for (let x = 40; x < 800; x += 40) dots.push(`<circle cx="${x}" cy="${y}" r="1.6"/>`);

  return `<svg class="gfx gfx-hero" viewBox="0 0 800 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Schemat konstrukcji drogi: roboty ziemne, podbudowa i nawierzchnia, a na końcu inwestycja klienta" xmlns="http://www.w3.org/2000/svg">
<rect width="800" height="640" fill="#20262c"/>
<g fill="#323a42" aria-hidden="true">${dots.join('')}</g>
<g aria-hidden="true">
<polygon points="${shadow}" fill="#0d0f11" opacity=".45"/>
${box(L, W, 0, Z0, '#5f6770', '#4a5159', '#6b737b')}
${box(l1, w1, Z0, Z1, A, '#d99700', '#ffc533')}
${box(l2, w2, Z1, Z2, '#30363c', '#262b30', '#3a4148')}
<path d="${grid}" stroke="#4d565e" stroke-width="1.4" fill="none"/>
${kerb}
${lab(34, W, 34, 'ROBOTY ZIEMNE', '#eceef0', 17)}
${lab(34, W - S, Z0 + 17, 'PODBUDOWA', INK, 17)}
${lab(34, W - 2 * S, Z1 + 8.5, 'NAWIERZCHNIA', '#d9dde0', 13)}
<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${A}" stroke-width="3" stroke-dasharray="10 9"/>
${stakes}
<ellipse class="pin-ring" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="44" ry="22" fill="none" stroke="${A}" stroke-width="2.5" opacity=".75"/>
<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="22" ry="11" fill="${A}" opacity=".35"/>
<path d="M${px.toFixed(1)} ${py.toFixed(1)}C${(px - 6).toFixed(1)} ${(py - 18).toFixed(1)} ${(px - 27).toFixed(1)} ${(py - 36).toFixed(1)} ${(px - 27).toFixed(1)} ${(py - 64).toFixed(1)}A27 27 0 1 1 ${(px + 27).toFixed(1)} ${(py - 64).toFixed(1)}C${(px + 27).toFixed(1)} ${(py - 36).toFixed(1)} ${(px + 6).toFixed(1)} ${(py - 18).toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)}Z" fill="${A}" stroke="#14171a" stroke-width="3"/>
<circle cx="${px.toFixed(1)}" cy="${(py - 64).toFixed(1)}" r="10" fill="#14171a"/>
<g transform="translate(${(px - 130).toFixed(1)} ${(py - 154).toFixed(1)})"><rect width="260" height="46" rx="3" fill="#14171a" stroke="${A}" stroke-width="2.5"/><text x="130" y="31" text-anchor="middle" font-size="20" font-weight="800" letter-spacing="1.6" fill="#fff">TWOJA INWESTYCJA</text></g>
</g>
</svg>`;
}

// ---------- 2) „Ponad 25 lat”: duże 25+ i droga z osią lat ----------
function yearsSvg() {
  const W = 1000, H = 800;
  const road = (x) => 640 - 0.18 * x + 50 * Math.sin(x / 140);
  const pts = [];
  for (let x = -20; x <= W + 20; x += 8) pts.push(`${x},${road(x).toFixed(1)}`);
  const d = 'M' + pts.join('L');

  // 25 znaczników – po jednym na rok; co piąty wyróżniony
  let ticks = '';
  for (let i = 1; i <= 25; i++) {
    const x = 50 + 35 * i, y = road(x), five = i % 5 === 0;
    ticks += `<line x1="${x}" y1="${(y + 50).toFixed(1)}" x2="${x}" y2="${(y + (five ? 80 : 64)).toFixed(1)}" stroke="${five ? A : '#8a929a'}" stroke-width="${five ? 4 : 2}"/>`;
    if (five) ticks += `<text x="${x}" y="${(y + 118).toFixed(1)}" text-anchor="middle" font-size="36" font-weight="800" fill="#fff">${i}${i === 25 ? '+' : ''}</text>`;
  }
  // znacznik końcowy (25+) – pinezka na drodze
  const ex = 50 + 35 * 25, ey = road(ex);
  const pin = `<path d="M${ex} ${(ey).toFixed(1)}C${ex - 5} ${(ey - 16).toFixed(1)} ${ex - 24} ${(ey - 32).toFixed(1)} ${ex - 24} ${(ey - 58).toFixed(1)}A24 24 0 1 1 ${ex + 24} ${(ey - 58).toFixed(1)}C${ex + 24} ${(ey - 32).toFixed(1)} ${ex + 5} ${(ey - 16).toFixed(1)} ${ex} ${(ey).toFixed(1)}Z" fill="${A}" stroke="#14171a" stroke-width="3"/><circle cx="${ex}" cy="${(ey - 58).toFixed(1)}" r="9" fill="#14171a"/>`;

  // warstwice (dekoracja)
  let contour = '';
  for (let i = 0; i < 7; i++) contour += `<ellipse cx="790" cy="210" rx="${70 + i * 46}" ry="${34 + i * 24}" transform="rotate(-18 790 210)" fill="none" stroke="${i % 3 === 0 ? '#343b43' : '#2b3138'}" stroke-width="${i % 3 === 0 ? 2 : 1.4}"/>`;
  const dots = [];
  for (let y = 40; y < H; y += 40) for (let x = 40; x < W; x += 40) dots.push(`<circle cx="${x}" cy="${y}" r="1.5"/>`);

  return `<svg class="gfx gfx-years" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Ponad 25 lat doświadczenia na drogach i budowach Podlasia" xmlns="http://www.w3.org/2000/svg">
<rect width="${W}" height="${H}" fill="#1b1f23"/>
<g fill="#2c3238" aria-hidden="true">${dots.join('')}</g>
<g aria-hidden="true">
${contour}
<text x="56" y="322" font-size="268" font-weight="800" letter-spacing="-10" fill="${A}">25+</text>
<text x="66" y="392" font-size="34" font-weight="800" letter-spacing="5" fill="#fff">LAT DOŚWIADCZENIA</text>
<text x="66" y="440" font-size="28" font-weight="500" letter-spacing="1" fill="#a2a9b0">Roboty drogowe · ziemne · brukarskie</text>
<path d="${d}" fill="none" stroke="#6a727a" stroke-width="74" stroke-linecap="butt"/>
<path d="${d}" fill="none" stroke="#2b3036" stroke-width="64" stroke-linecap="butt"/>
<path d="${d}" fill="none" stroke="${A}" stroke-width="4" stroke-dasharray="26 20"/>
${ticks}
${pin}
</g>
</svg>`;
}


// ---------- wspólne drobiazgi ----------
const dotGrid = (W, H, fill) => {
  const d = [];
  for (let y = 40; y < H; y += 40) for (let x = 40; x < W; x += 40) d.push(`<circle cx="${x}" cy="${y}" r="1.5"/>`);
  return `<g fill="${fill}" aria-hidden="true">${d.join('')}</g>`;
};
// etykieta z numerem: ciemna pigułka z żółtym obrysem
const pill = (x, y, n, text, size = 24) => {
  const w = Math.round((n ? 74 : 34) + text.length * size * 0.7), h = Math.round(size * 2);
  return `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="4" fill="#14171a" stroke="${A}" stroke-width="2.5"/>` +
    (n ? `<circle cx="${h / 2}" cy="${h / 2}" r="${size * 0.62}" fill="${A}"/><text x="${h / 2}" y="${h / 2 + size * 0.34}" text-anchor="middle" font-size="${size * 0.8}" font-weight="800" fill="${INK}">${n}</text>` : '') +
    `<text x="${n ? h + 2 : 14}" y="${h / 2 + size * 0.34}" font-size="${size}" font-weight="800" letter-spacing="1.2" fill="#fff">${text}</text></g>`;
};

// ---------- 3) „Kim jesteśmy”: plan inwestycji z trzema zakresami (ziemne, drogi, kostka) ----------
function siteSvg() {
  const W = 1000, H = 800;
  // warstwice w strefie robót ziemnych
  let contour = '';
  for (let i = 0; i < 9; i++) {
    const r = 34 + i * 34, pts = [];
    for (let a = 0; a <= 360; a += 6) {
      const t = a * Math.PI / 180, k = 1 + 0.16 * Math.sin(3 * t + 1 + i * 0.25) + 0.09 * Math.sin(5 * t + i * 0.4);
      pts.push(`${(285 + r * 1.22 * k * Math.cos(t)).toFixed(1)},${(262 + r * 0.92 * k * Math.sin(t)).toFixed(1)}`);
    }
    contour += `<polygon points="${pts.join(' ')}" fill="none" stroke="${i % 4 === 0 ? '#6a727a' : '#3d454c'}" stroke-width="${i % 4 === 0 ? 3 : 2}"/>`;
  }
  // kostka: układ cegiełkowy
  const shades = ['#353b41', '#3b4248', '#30363b', '#41484f', '#2d3338'];
  let brick = '', n = 0;
  for (let y = 100, row = 0; y < 410; y += 22, row++) for (let x = 540 - (row % 2 ? 22 : 0); x < 920; x += 44, n++)
    brick += `<rect x="${x}" y="${y}" width="41" height="19" rx="1.5" fill="${shades[(n * 7 + row * 3) % 5]}"/>`;
  // miejsca postojowe
  let bays = '';
  for (let x = 560; x <= 900; x += 48) bays += `<line x1="${x}" y1="318" x2="${x}" y2="400" stroke="#d9dde0" stroke-width="2.5"/>`;
  // znaczniki wytyczenia w narożnikach stref
  const cross = (x, y) => `<path d="M${x - 9} ${y}H${x + 9}M${x} ${y - 9}V${y + 9}" stroke="${A}" stroke-width="3"/>`;
  const crosses = [[90, 100], [470, 100], [90, 400], [470, 400], [540, 100], [910, 100], [540, 400], [910, 400]].map(c => cross(c[0], c[1])).join('');
  const road = `M-20 585H1020`;

  return `<svg class="gfx gfx-site" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Schemat inwestycji: roboty ziemne, drogi i podbudowy oraz kostka brukowa" xmlns="http://www.w3.org/2000/svg">
<defs><clipPath id="siteA"><rect x="90" y="100" width="380" height="300"/></clipPath><clipPath id="siteB"><rect x="540" y="100" width="370" height="300"/></clipPath></defs>
<rect width="${W}" height="${H}" fill="#1b1f23"/>
${dotGrid(W, H, '#2c3238')}
<g aria-hidden="true">
<rect x="60" y="70" width="880" height="470" fill="none" stroke="#575f67" stroke-width="2.5" stroke-dasharray="14 10"/>
<rect x="90" y="100" width="380" height="300" fill="#20262c"/>
<g clip-path="url(#siteA)">${contour}</g>
<g clip-path="url(#siteB)">${brick}</g>
<rect x="540" y="318" width="370" height="82" fill="#14171a" opacity=".35"/>
${bays}
<rect x="280" y="400" width="52" height="190" fill="#2b3036"/>
<rect x="715" y="400" width="52" height="190" fill="#2b3036"/>
<path d="${road}" stroke="#6a727a" stroke-width="104" fill="none"/>
<path d="${road}" stroke="#2b3036" stroke-width="94" fill="none"/>
<path d="${road}" stroke="${A}" stroke-width="4" stroke-dasharray="26 20" fill="none"/>
<rect x="282" y="400" width="48" height="62" fill="#2b3036"/><rect x="717" y="400" width="48" height="62" fill="#2b3036"/>
${crosses}
${pill(106, 120, 1, 'ROBOTY ZIEMNE', 28)}
${pill(552, 120, 3, 'KOSTKA BRUKOWA', 28)}
${pill(60, 668, 2, 'DROGI I PODBUDOWY', 28)}
</g>
</svg>`;
}

// ---------- 4) „Sprzęt i technologia”: przekrój terenu, model projektu i pozycjonowanie maszyny ----------
function modelSvg() {
  const W = 1000, H = 800;
  const ground = (x) => 470 + 55 * Math.sin(x / 120 + 0.5) + 22 * Math.sin(x / 37 + 1);
  const design = (x) => x < 380 ? 500 : x > 620 ? 430 : 500 - 70 * (x - 380) / 240;
  // teren (wypełnienie) + podział na „do zdjęcia” i „do nasypania”
  let g = `M0 ${H}L0 ${ground(0).toFixed(1)}`, top = `M0 ${ground(0).toFixed(1)}`;
  for (let x = 4; x <= W; x += 4) { g += `L${x} ${ground(x).toFixed(1)}`; top += `L${x} ${ground(x).toFixed(1)}`; }
  g += `L${W} ${H}Z`;
  let cut = '', fill = '', run = null;
  const flush = (end) => { if (!run) return; const seg = run; run = null; const xs = []; for (let x = seg.a; x <= end; x += 4) xs.push(x);
    const up = xs.map(x => `${x},${ground(x).toFixed(1)}`), dn = xs.slice().reverse().map(x => `${x},${design(x).toFixed(1)}`);
    const poly = `<polygon points="${up.concat(dn).join(' ')}" fill="${seg.cut ? A : '#d9dde0'}" opacity="${seg.cut ? 0.32 : 0.16}"/>`;
    if (seg.cut) cut += poly; else fill += poly; };
  for (let x = 0; x <= W; x += 4) { const isCut = ground(x) < design(x); if (!run || run.cut !== isCut) { flush(x); run = { a: x, cut: isCut }; } }
  flush(W);
  const dl = [[0, 500], [380, 500], [620, 430], [1000, 430]].map(p => p.join(',')).join(' ');

  // maszyna (stylizowana, bez marki) stoi na terenie
  const mx = 612, my = ground(mx);
  const machine = `<g transform="translate(${mx} ${my.toFixed(1)})">
<rect x="-70" y="-30" width="140" height="30" rx="15" fill="#14171a"/><circle cx="-46" cy="-15" r="9" fill="#353b41"/><circle cx="0" cy="-15" r="9" fill="#353b41"/><circle cx="46" cy="-15" r="9" fill="#353b41"/>
<rect x="-52" y="-78" width="104" height="48" rx="4" fill="${A}"/>
<rect x="-6" y="-120" width="50" height="46" rx="4" fill="#ffc533"/><rect x="2" y="-112" width="34" height="26" rx="2" fill="#2b3036"/>
<path d="M-94 -64L-62 -64L-62 -6L-94 -6Z" fill="#d99700"/>
<line x1="-30" y1="-78" x2="-30" y2="-150" stroke="#d9dde0" stroke-width="4"/><path d="M-44 -150a14 14 0 0 1 28 0Z" fill="#fff"/>
</g>`;
  const ax = mx - 30, ay = my - 164;
  const sats = [[210, 150], [640, 70], [880, 150]];
  const sat = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-34" y="-7" width="22" height="14" fill="#575f67"/><rect x="12" y="-7" width="22" height="14" fill="#575f67"/><rect x="-11" y="-11" width="22" height="22" rx="3" fill="#d9dde0"/><circle cx="0" cy="0" r="5" fill="${A}"/></g>`;
  const links = sats.map(p => `<line x1="${p[0]}" y1="${p[1] + 16}" x2="${ax.toFixed(1)}" y2="${(ay - 4).toFixed(1)}" stroke="${A}" stroke-width="2" stroke-dasharray="6 9" opacity=".7"/>`).join('');

  return `<svg class="gfx gfx-model" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Schemat sterowania maszyn 3D: pozycja maszyny porównywana z modelem projektu" xmlns="http://www.w3.org/2000/svg">
<rect width="${W}" height="${H}" fill="#1b1f23"/>
${dotGrid(W, H, '#2c3238')}
<g aria-hidden="true">
${links}
${sats.map(p => sat(p[0], p[1])).join('')}
<path d="${g}" fill="#3a4148"/>
<path d="M0 ${(ground(0) + 55).toFixed(1)}${Array.from({ length: 251 }, (_, i) => `L${i * 4} ${(ground(i * 4) + 55).toFixed(1)}`).join('')}" fill="none" stroke="#30363c" stroke-width="3"/>
<path d="M0 ${(ground(0) + 110).toFixed(1)}${Array.from({ length: 251 }, (_, i) => `L${i * 4} ${(ground(i * 4) + 110).toFixed(1)}`).join('')}" fill="none" stroke="#30363c" stroke-width="3"/>
${cut}${fill}
<path d="${top}" fill="none" stroke="#9aa2aa" stroke-width="4"/>
<polyline points="${dl}" fill="none" stroke="${A}" stroke-width="5" stroke-dasharray="16 11"/>
${machine}
${pill(50, 40, 0, 'STEROWANIE MASZYN 3D', 28)}
<g transform="translate(60 632)" font-size="28" font-weight="700" fill="#fff">
<line x1="0" y1="-8" x2="56" y2="-8" stroke="${A}" stroke-width="5" stroke-dasharray="14 9"/><text x="76" y="0">Model projektu</text>
<rect y="38" width="56" height="20" fill="${A}" opacity=".5"/><text x="76" y="56">Do zdjęcia</text>
<line x1="0" y1="96" x2="56" y2="96" stroke="#9aa2aa" stroke-width="5"/><text x="76" y="106">Teren przed robotami</text>
</g>
</g>
</svg>`;
}

module.exports = { heroSvg, yearsSvg, siteSvg, modelSvg };
