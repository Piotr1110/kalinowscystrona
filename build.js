'use strict';
/* Generator strony Kalinowscy – bez zależności (Node 18+).
 *   node build.js            -> katalog dist/    (wersja produkcyjna, linki od korzenia /)
 *   node build.js --preview  -> katalog podglad/ (linki względne – otwierasz podglad/index.html dwuklikiem)
 * Treści pochodzą z plików content/*.json (edytowanych w panelu /admin/). */
const fs = require('fs'), path = require('path');
const GFX = require('./graphics.js'); // grafiki wektorowe inline (hero, „25 lat”)
const ROOT = __dirname;
const PREVIEW = process.argv.includes('--preview');
const OUT = path.join(ROOT, PREVIEW ? 'podglad' : 'dist');
const BUILD = Date.now().toString(36);

/* ---------- narzędzia ---------- */
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rd = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f), 'utf8'));
const list = d => { const p = path.join(ROOT, 'content', d); return fs.existsSync(p) ? fs.readdirSync(p).filter(f => f.endsWith('.json')).map(f => ({ slug: f.slice(0, -5), ...rd(d + '/' + f) })) : []; };
const slugify = s => String(s).toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const S = rd('ustawienia.json');
const siteUrl = (S.adres_strony || process.env.URL || 'https://twoja-domena.pl').replace(/\/$/, '');
const YEAR = new Date().getFullYear();
let CUR = '/';

function u(url) { // adres wewnętrzny -> produkcyjny lub względny (podgląd)
  if (!url) return '#';
  if (!PREVIEW || /^(https?:|mailto:|tel:|#|data:)/.test(url)) return url;
  const m = url.match(/^([^?#]*)([?#].*)?$/); const p = m[1] || '/', rest = m[2] || '';
  const from = path.posix.dirname(CUR.endsWith('/') ? CUR + 'index.html' : CUR);
  const target = p.endsWith('/') ? p + 'index.html' : p;
  return (path.posix.relative(from, target) || 'index.html') + rest;
}
const media = s => /^(https?:|data:)/.test(s) ? s : u(s.startsWith('/') ? s : '/' + s);

/* ---------- mini-markdown (nagłówki, listy, pogrubienia, linki) ---------- */
function inl(s) {
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, a, h) => `<img src="${media(h)}" alt="${a}" loading="lazy">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, h) => `<a href="${/^(https?:|mailto:|tel:)/.test(h) ? h : u(h)}">${t}</a>`);
  return s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])_([^_]+)_(?=[\s).,]|$)/g, '$1<em>$2</em>');
}
function md(src) {
  if (!src) return '';
  return String(src).replace(/\r/g, '').split(/\n{2,}/).map(b => {
    b = b.trim(); if (!b) return '';
    let m;
    if ((m = b.match(/^(#{1,4})\s+(.+)$/))) return `<h${m[1].length <= 2 ? 2 : 3}>${inl(m[2])}</h${m[1].length <= 2 ? 2 : 3}>`;
    if (/^([-*])\s+/.test(b)) return '<ul>' + b.split('\n').map(l => `<li>${inl(l.replace(/^[-*]\s+/, ''))}</li>`).join('') + '</ul>';
    if (/^\d+\.\s+/.test(b)) return '<ol>' + b.split('\n').map(l => `<li>${inl(l.replace(/^\d+\.\s+/, ''))}</li>`).join('') + '</ol>';
    const h = b.match(/^(#{1,4})\s+(.+)\n([\s\S]+)$/); if (h) return md(h[1] + ' ' + h[2]) + md(h[3]);
    return `<p>${inl(b).replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}

const paras = (t, cls = '') => String(t || '').replace(/\r/g, '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean).map(x => `<p${cls ? ` class="${cls}"` : ''}>${esc(x)}</p>`).join('');
const todayPl = () => new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' });

/* ---------- dane słownikowe ---------- */
const CATS_M = { koparki: 'Koparki', spycharki: 'Spycharki', ladowarki: 'Ładowarki', 'maszyny-drogowe': 'Maszyny drogowe', 'sprzet-brukarski': 'Sprzęt brukarski', walce: 'Walce' };
const CATS_R = { 'roboty-drogowe': 'Roboty drogowe', 'roboty-ziemne': 'Roboty ziemne', podbudowy: 'Podbudowy', brukarstwo: 'Brukarstwo', 'zagospodarowanie-terenu': 'Zagospodarowanie terenu' };
const PH_SERVICE = { 'roboty-ziemne': 'teren', 'drogi-i-podbudowy': 'droga', 'nawierzchnie-z-kostki': 'kostka', 'zagospodarowanie-terenu': 'plan' };
const PH_MACHINE = { 'sprzet-brukarski': 'kostka', walce: 'warstwy' };
const PH_PROJECT = { 'roboty-drogowe': 'droga', 'roboty-ziemne': 'teren', podbudowy: 'warstwy', brukarstwo: 'kostka', 'zagospodarowanie-terenu': 'plan' };
const NAV = [['/o-firmie/', 'O firmie'], ['/oferta/', 'Oferta'], ['/park-maszynowy/', 'Park maszynowy'], ['/realizacje/', 'Realizacje'], ['/dla-generalnych-wykonawcow/', 'Dla wykonawców']];

let OPT = {}; // zoptymalizowane obrazy (jeśli dostępne sharp)

const ILLU = { kostka: 'il-kostka.svg', plan: 'il-plan.svg' }; // ilustracje wektorowe (tools/make_illustrations.py) – pokazują się, gdy brak zdjęcia
function pic(src, alt, o = {}) {
  const { kind = 'maszyna', cls = '', sizes = '(min-width:1000px) 33vw, 100vw', eager = false } = o;
  if (!src && ILLU[kind]) return `<img class="${cls} illu" src="${u('/assets/img/' + ILLU[kind])}" alt="" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
  if (!src) return `<div class="ph ${cls}" style="background-image:url('${u('/assets/img/ph-' + kind + '.svg')}')" role="img" aria-label="${esc(alt)}"><span class="ph-label">Miejsce na zdjęcie</span></div>`;
  const v = OPT[src];
  const srcset = v ? ` srcset="${v.map(x => `${media(x.url)} ${x.w}w`).join(', ')}" sizes="${sizes}"` : '';
  const s = v ? v[Math.min(1, v.length - 1)].url : src;
  return `<img class="${cls}" src="${media(s)}"${srcset} alt="${esc(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
}
const GEO = { 'Hajnówka': [52.743, 23.585], 'Bielsk Podlaski': [52.768, 23.190], 'Białystok': [53.132, 23.168] };
function mapSvg(active) { // schemat poglądowy: położenie miejscowości względem siebie (bez granic)
  const W = 500, H = 400, k = 571, kx = k * 0.6, lon0 = 22.64, lat0 = 53.285;
  const pt = n => [(GEO[n][1] - lon0) * kx, (lat0 - GEO[n][0]) * k];
  const names = Object.keys(GEO), P = Object.fromEntries(names.map(n => [n, pt(n)]));
  const lab = { 'Białystok': [16, 5, 'start'], 'Bielsk Podlaski': [-16, 5, 'end'], 'Hajnówka': [16, 5, 'start'] };
  const contours = Array.from({ length: 10 }, (_, i) => `<path d="M-10 ${20 + i * 44} C 120 ${i * 44 - 14}, 230 ${58 + i * 44}, 340 ${22 + i * 44} S 470 ${6 + i * 44}, 520 ${34 + i * 44}"/>`).join('');
  const links = [['Białystok', 'Bielsk Podlaski'], ['Bielsk Podlaski', 'Hajnówka']].map(([a, b]) => `<line x1="${P[a][0].toFixed(0)}" y1="${P[a][1].toFixed(0)}" x2="${P[b][0].toFixed(0)}" y2="${P[b][1].toFixed(0)}"/>`).join('');
  const dots = names.map(n => { const [x, y] = P[n], on = n === active, l = lab[n];
    return `<g><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${on ? 62 : 40}" fill="${on ? 'rgba(255,180,0,.10)' : 'none'}" stroke="${on ? '#ffb400' : '#4a525a'}" stroke-width="2" stroke-dasharray="6 7"/>
      <circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${on ? 11 : 7}" fill="${on ? '#ffb400' : '#14171a'}" stroke="${on ? '#14171a' : '#cdd2d6'}" stroke-width="${on ? 3 : 2.5}"/>
      <text x="${(x + l[0]).toFixed(0)}" y="${(y + l[1]).toFixed(0)}" text-anchor="${l[2]}" font-size="${on ? 19 : 17}" font-weight="${on ? 800 : 700}" fill="${on ? '#ffb400' : '#fff'}">${esc(n)}</text></g>`; }).join('');
  return `<svg class="map" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schemat poglądowy: ${names.map(esc).join(', ')}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="#1b1f23"/>
  <g fill="none" stroke="#2a3036" stroke-width="2">${contours}</g><g stroke="#4a525a" stroke-width="1.5" stroke-dasharray="3 6">${links}</g>${dots}
  <text x="${W - 14}" y="${H - 14}" text-anchor="end" font-size="11" fill="#6c747b">Schemat poglądowy</text></svg>`;
}
const logoDark = () => media(S.logo_na_ciemnym || '/assets/logo/logo-poziome-na-ciemnym.svg');
const logoLight = () => media(S.logo_na_jasnym || '/assets/logo/logo-poziome-na-jasnym.svg');
const icon = () => media(S.ikona || '/assets/logo/favicon.svg');

const mailto = (subj, body) => S.email ? `mailto:${S.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}` : u('/kontakt/?temat=wycena#formularz');
const mailQuote = () => mailto('Zapytanie o wycenę – roboty drogowe / ziemne', 'Dzień dobry,\n\nproszę o wycenę robót.\n\nRodzaj robót:\nLokalizacja inwestycji:\nPlanowany termin:\nTelefon kontaktowy:\n\nPozdrawiam');
const QUOTE = () => u('/kontakt/?temat=wycena#formularz');
const arrow = '<svg class="ar" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
const head = (eyebrow, h, lead, tag = 'h2') => `<header class="sec-h reveal">${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}<${tag}>${esc(h)}</${tag}>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</header>`;

/* ---------- układ ---------- */
function orgLd() {
  const o = { '@context': 'https://schema.org', '@type': 'GeneralContractor', name: S.nazwa, url: siteUrl + '/', logo: siteUrl + '/assets/logo/icon-512.png', image: siteUrl + '/assets/logo/og-image.png', description: S.opis_domyslny,
    areaServed: [{ '@type': 'AdministrativeArea', name: 'Województwo podlaskie' }, { '@type': 'City', name: 'Hajnówka' }, { '@type': 'City', name: 'Bielsk Podlaski' }, { '@type': 'City', name: 'Białystok' }],
    knowsAbout: ['Roboty ziemne', 'Roboty drogowe', 'Podbudowy drogowe', 'Nawierzchnie z kostki brukowej', 'Zagospodarowanie terenu', 'Sterowanie maszyn 3D'],
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Zakres usług', itemListElement: (OFFER ? OFFER.uslugi : []).map(x => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: x.nazwa, description: x.krotki, areaServed: 'Województwo podlaskie' } })) } };
  if (S.telefon) o.telephone = S.telefon; if (S.email) o.email = S.email;
  if (S.ulica || S.miasto) o.address = { '@type': 'PostalAddress', streetAddress: S.ulica, postalCode: S.kod, addressLocality: S.miasto, addressCountry: 'PL' };
  const same = [S.facebook, S.google_profil].filter(Boolean); if (same.length) o.sameAs = same;
  return o;
}
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const origin = x => { try { return new URL(x).origin; } catch (e) { return ''; } };
function csp() {
  const ep = S.formularz_endpoint ? origin(S.formularz_endpoint) : '', ga = !!S.ga4_id;
  return [`default-src 'self'`, `img-src 'self' data: https:`, `style-src 'self' 'unsafe-inline'`, `font-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
    `script-src 'self'${ga ? ' https://www.googletagmanager.com' : ''}`,
    `connect-src 'self'${ep ? ' ' + ep : ''}${ga ? ' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com' : ''}`,
    `form-action 'self'${ep ? ' ' + ep : ''}`].join('; ');
}

function contactRows(cls = '') {
  const r = [];
  if (S.telefon) r.push(['Telefon', `<a href="tel:${esc(S.telefon.replace(/[^+\d]/g, ''))}">${esc(S.telefon)}</a>`]);
  if (S.email) r.push(['E-mail', `<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>`]);
  if (S.ulica || S.miasto) r.push(['Adres', `${esc(S.ulica)}${S.ulica && (S.kod || S.miasto) ? '<br>' : ''}${esc([S.kod, S.miasto].filter(Boolean).join(' '))}`]);
  if (S.godziny) r.push(['Godziny', esc(S.godziny)]);
  if (S.nip) r.push(['NIP', esc(S.nip)]);
  if (S.regon) r.push(['REGON', esc(S.regon)]);
  if (S.facebook) r.push(['Facebook', `<a href="${esc(S.facebook)}" rel="noopener" target="_blank">Odwiedź nasz profil</a>`]);
  if (S.google_profil) r.push(['Google', `<a href="${esc(S.google_profil)}" rel="noopener" target="_blank">Profil firmy w Google</a>`]);
  return r.length ? `<dl class="contact-list ${cls}">${r.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>` : '';
}

const PAGES = []; // do sitemap
function layout({ url, title, desc, body, noindex = false, schema = [], og }) {
  CUR = url;
  const canon = siteUrl + (url === '/404.html' ? '/' : url);
  const customNav = CUSTOM.filter(p => p.w_menu).map(p => [`/${p.slug}/`, p.tytul]);
  const nav = NAV.concat(customNav).concat([['/kontakt/', 'Kontakt']]);
  const navHtml = nav.map(([h, t]) => `<a href="${u(h)}"${url === h || (h !== '/' && url.startsWith(h) && h.length > 1) ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const full = body(); // body() może używać u() z CUR
  const cfg = JSON.stringify({ ga: S.ga4_id || '', preview: PREVIEW }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc || S.opis_domyslny)}">
${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
<link rel="canonical" href="${esc(canon)}">
<meta name="theme-color" content="#1b1f23">
<meta property="og:type" content="website"><meta property="og:locale" content="pl_PL"><meta property="og:site_name" content="${esc(S.nazwa)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc || S.opis_domyslny)}">
<meta property="og:url" content="${esc(canon)}"><meta property="og:image" content="${esc(og || siteUrl + '/assets/logo/og-image.png')}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${icon()}" type="image/svg+xml"><link rel="icon" href="${u('/assets/logo/favicon-32.png')}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${u('/assets/logo/apple-touch-icon.png')}">
${PREVIEW ? '' : `<meta http-equiv="Content-Security-Policy" content="${esc(csp())}">`}
${PREVIEW ? '' : `<link rel="preload" href="${u('/assets/fonts/inter-400.woff')}" as="font" type="font/woff" crossorigin>
<link rel="preload" href="${u('/assets/fonts/inter-800.woff')}" as="font" type="font/woff" crossorigin>`}
<link rel="stylesheet" href="${u('/assets/css/main.css')}?v=${BUILD}">
${schema.map(ld).join('\n')}
</head>
<body>
<a class="skip" href="#main">Przejdź do treści</a>
<header class="site-header" id="top">
  <div class="container hd">
    <a class="brand" href="${u('/')}" aria-label="${esc(S.nazwa)} – strona główna"><img src="${logoDark()}" alt="${esc(S.nazwa)}" width="240" height="50"></a>
    <nav class="nav" id="nav" aria-label="Menu główne">${navHtml}<a class="btn btn-a btn-s nav-cta" href="${QUOTE()}">Zapytaj o wycenę</a></nav>
    <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Otwórz menu"><span></span><span></span><span></span></button>
  </div>
</header>
<main id="main">
${full}
</main>
<footer class="site-footer">
  <div class="container ft">
    <div class="ft-brand"><img src="${logoDark()}" alt="${esc(S.nazwa)}" width="240" height="50" loading="lazy"><p>${esc(S.stopka_opis)}</p></div>
    <div><h2 class="ft-h">Strona</h2><ul>${nav.map(([h, t]) => `<li><a href="${u(h)}">${esc(t)}</a></li>`).join('')}</ul></div>
    <div><h2 class="ft-h">Oferta</h2><ul>${OFFER.uslugi.map(s => `<li><a href="${u('/oferta/#' + s.id)}">${esc(s.nazwa)}</a></li>`).join('')}</ul>${LOCAL.length ? `<h2 class="ft-h ft-h2">Obszar działania</h2><ul>${LOCAL.map(l => `<li><a href="${u('/' + l.slug + '/')}">${esc(l.naglowek)}</a></li>`).join('')}</ul>` : ''}</div>
    <div><h2 class="ft-h">Kontakt</h2>${contactRows('on-dark') || `<p class="ft-note">Napisz do nas przez <a href="${QUOTE()}">formularz zapytania</a>.</p>`}<p><a class="btn btn-a btn-s" href="${QUOTE()}">Zapytaj o wycenę</a></p></div>
  </div>
  <div class="container ft-bot"><span>© ${YEAR} ${esc(S.nazwa)}</span><span><a href="${u('/polityka-prywatnosci/')}">Polityka prywatności</a>${S.ga4_id ? ' · <a href="#cookies" data-cookie-settings>Ustawienia cookies</a>' : ''}</span></div>
</footer>
<div class="mbar" role="navigation" aria-label="Szybki kontakt"><a class="mbar-a" href="${mailQuote()}">Napisz e-mail</a><a class="mbar-b" href="${QUOTE()}">Zapytaj o wycenę</a></div>
<script type="application/json" id="kal-config">${cfg}</script>
<script src="${u('/assets/js/main.js')}?v=${BUILD}" defer></script>
</body>
</html>`;
}

function formHtml() {
  const ep = S.formularz_endpoint;
  const opts = OFFER.uslugi.filter(s => s.w_formularzu !== false).map(s => `<option value="${esc(s.nazwa)}" data-id="${esc(s.id)}">${esc(s.nazwa)}</option>`).join('');
  const action = ep || u('/dziekujemy/');
  return `<form class="form" id="formularz" name="zapytanie-ofertowe" method="POST" action="${esc(action)}" enctype="multipart/form-data" ${ep ? '' : 'data-netlify="true" netlify-honeypot="bot-field"'} data-max-mb="8" ${PREVIEW ? 'data-preview="1"' : ''} novalidate>
  <input type="hidden" name="form-name" value="zapytanie-ofertowe">
  <p class="hp" aria-hidden="true"><label>Nie wypełniaj tego pola <input type="text" name="bot-field" tabindex="-1" autocomplete="off"></label></p>
  <div class="grid2">
    <div class="fld"><label for="f-name">Imię i nazwisko lub firma *</label><input id="f-name" name="nazwa" type="text" autocomplete="name" required maxlength="120"></div>
    <div class="fld"><label for="f-tel">Telefon</label><input id="f-tel" name="telefon" type="tel" autocomplete="tel" inputmode="tel" maxlength="30"></div>
    <div class="fld"><label for="f-mail">E-mail *</label><input id="f-mail" name="email" type="email" autocomplete="email" required maxlength="120"></div>
    <div class="fld"><label for="f-loc">Lokalizacja inwestycji</label><input id="f-loc" name="lokalizacja" type="text" maxlength="120" placeholder="np. Hajnówka"></div>
  </div>
  <div class="fld"><label for="f-typ">Rodzaj robót</label><select id="f-typ" name="rodzaj_robot"><option value="">Wybierz…</option>${opts}<option value="Inne / nie wiem" data-id="inne">Inne / nie wiem</option></select></div>
  <div class="fld"><label for="f-msg">Wiadomość</label><textarea id="f-msg" name="wiadomosc" rows="5" maxlength="4000" placeholder="Opisz zakres robót, termin, powierzchnię…"></textarea></div>
  <div class="fld files" data-files>
    <label for="f-file1">Załącznik – przedmiar lub dokumentacja</label>
    <input id="f-file1" name="zalacznik1" type="file" accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png,.webp,.heic">
    <input id="f-file2" name="zalacznik2" type="file" accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png,.webp,.heic" hidden aria-label="Załącznik 2">
    <input id="f-file3" name="zalacznik3" type="file" accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png,.webp,.heic" hidden aria-label="Załącznik 3">
    <button class="link-btn" type="button" data-add-file>+ Dodaj kolejny plik</button>
    <p class="hint">Pliki PDF, XLSX, DOCX oraz zdjęcia (JPG, PNG). Łącznie do 8 MB. Nie wysyłaj danych osobowych niepotrzebnych do wyceny.</p>
  </div>
  <p class="legal">Administratorem danych jest ${esc(S.nazwa)}. Dane z formularza przetwarzamy, aby odpowiedzieć na zapytanie i przygotować ofertę (art. 6 ust. 1 lit. b i f RODO). Podanie danych jest dobrowolne, ale potrzebne do odpowiedzi. Szczegóły i Twoje prawa: <a href="${u('/polityka-prywatnosci/')}">polityka prywatności</a>.</p>
  <button class="btn btn-a btn-l" type="submit">Wyślij zapytanie ${arrow}</button>
  <div class="form-status" role="status" aria-live="polite"></div>
  <p class="hint">Pola oznaczone * są wymagane.</p>
</form>`;
}

/* ---------- strony ---------- */
let HOME, OFFER, MACH, PROJ, CUSTOM = [], MACHINES = [], PROJECTS = [], LOCAL = [];

function machineCard(m) {
  const cat = CATS_M[m.kategoria] || m.kategoria;
  return `<article class="mcard" data-cat="${esc(m.kategoria)}"><div class="media r43">${pic(m.zdjecie, m.nazwa, { kind: PH_MACHINE[m.kategoria] || 'maszyna', sizes: '(min-width:1000px) 25vw, (min-width:600px) 50vw, 100vw' })}${m.system3d ? '<span class="badge3d">3D</span>' : ''}</div>
  <div class="mc-b"><p class="tag">${esc(cat)}</p><h3>${esc(m.nazwa)}</h3>${m.model ? `<p class="model">Model: ${esc(m.model)}</p>` : ''}<p>${esc(m.opis)}</p>${m.system3d ? `<p class="sys3d">${esc(m.system3d_opis || 'Wyposażona w system 3D')}</p>` : ''}</div></article>`;
}
function projectCard(r) {
  const cats = (r.kategorie || []).map(c => CATS_R[c] || c);
  const meta = [r.lokalizacja, r.rok].filter(Boolean).join(' · ');
  return `<a class="pcard" href="${u('/realizacje/' + r.slug + '/')}" data-cat="${esc((r.kategorie || []).join(' '))}"><div class="media r43">${pic(r.zdjecie, r.nazwa, { kind: PH_PROJECT[(r.kategorie || [])[0]] || 'teren', sizes: '(min-width:1000px) 33vw, 100vw' })}${r.przyklad ? '<span class="ribbon">Przykład</span>' : ''}</div>
  <div class="pc-b"><p class="meta">${esc(meta) || '&nbsp;'}</p><h3>${esc(r.nazwa)}</h3>${cats.length ? `<p class="tags">${cats.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</p>` : ''}</div></a>`;
}
const chips = (items, label = 'Wszystkie') => `<div class="chips" role="group" aria-label="Filtr"><button type="button" class="chip is-on" data-filter="*">${label}</button>${items.map(([k, t]) => `<button type="button" class="chip" data-filter="${esc(k)}">${esc(t)}</button>`).join('')}</div>`;

function pageHome() {
  const H = HOME, hr = H.hero;
  const bg = hr.zdjecie ? pic(hr.zdjecie, hr.zdjecie_alt || 'Maszyna pracująca na budowie', { cls: 'cover', eager: true, sizes: '(min-width:1000px) 50vw, 100vw' }) : GFX.heroSvg(); // brak zdjęcia = grafika wektorowa
  const withPhoto = MACHINES.filter(m => m.zdjecie), featured = withPhoto.slice(0, 3), restM = MACHINES.filter(m => !featured.includes(m));
  const projs = PROJECTS.slice(0, 3);
  const f3 = H.technologie3d;
  return `
<section class="hero hero-split">
  <div class="container hero-grid">
    <div class="hero-in">
    <p class="eyebrow on-dark">${esc(hr.nadtytul)}</p>
    <h1>${esc(hr.naglowek)}</h1>
    <p class="hero-sub">${esc(hr.podtytul)}</p>
    <p class="hero-lead">${esc(hr.opis)}</p>
    <div class="btns"><a class="btn btn-a btn-l" href="${QUOTE()}">${esc(hr.przycisk1)}</a><a class="btn btn-o btn-l" href="${u('/realizacje/')}">${esc(hr.przycisk2)}</a></div>
    </div>
    <div class="hero-ph${hr.zdjecie ? '' : ' is-gfx'}">${bg}</div>
  </div>
  <div class="pillars"><div class="container"><ul>${H.filary.map((f, i) => `<li><span class="num">0${i + 1}</span><strong>${esc(f.tytul)}</strong><span>${esc(f.opis)}</span></li>`).join('')}</ul></div></div>
</section>

<section class="sec" id="o-firmie"><div class="container split">
  <div class="split-t reveal"><p class="eyebrow">${esc(H.firma.nadtytul)}</p><h2>${esc(H.firma.naglowek)}</h2>${paras(H.firma.tekst, 'lead')}
    <ul class="ticks">${H.firma.punkty.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
    <p><a class="btn btn-d" href="${u('/o-firmie/')}">${esc(H.firma.link)} ${arrow}</a></p></div>
  <div class="split-m reveal"><div class="media r45">${H.firma.zdjecie ? pic(H.firma.zdjecie, H.firma.zdjecie_alt || 'Sprzęt firmy na budowie', { kind: 'teren', sizes: '(min-width:1000px) 50vw, 100vw' }) : GFX.yearsSvg()}</div></div>
</div></section>

<section class="sec sec-g" id="uslugi"><div class="container">
  ${head(H.uslugi.nadtytul, H.uslugi.naglowek, H.uslugi.wstep)}
  <div class="grid4 svc">${OFFER.uslugi.map(s => `<article class="card reveal"><a class="media r43" href="${u('/oferta/#' + s.id)}" tabindex="-1" aria-hidden="true">${pic(s.zdjecie, s.nazwa, { kind: PH_SERVICE[s.id] || 'teren' })}</a>
    <div class="card-b"><h3><a href="${u('/oferta/#' + s.id)}">${esc(s.nazwa)}</a></h3><p>${esc(s.krotki)}</p><a class="link" href="${u('/kontakt/?usluga=' + s.id + '#formularz')}">Zapytaj o wycenę ${arrow}</a></div></article>`).join('')}</div>
</div></section>

<section class="sec" id="roboty"><div class="container">
  ${head(H.proces.nadtytul, H.proces.naglowek)}
  <ol class="steps">${H.proces.kroki.map((k, i) => `<li class="reveal"><span class="step-n">0${i + 1}</span><h3>${esc(k.tytul)}</h3><p>${esc(k.opis)}</p></li>`).join('')}</ol>
</div></section>

<section class="sec sec-g" id="park-maszynowy"><div class="container">
  ${head(H.maszyny.nadtytul, H.maszyny.naglowek, H.maszyny.wstep)}
  ${featured.length ? `<div class="grid3">${featured.map(machineCard).join('')}</div>` : ''}
  ${restM.length ? `<div class="eq-strip reveal"><p class="eq-h">${esc(H.maszyny.reszta || 'Pozostały sprzęt')}</p><ul class="eq-chips">${restM.map(m => `<li>${esc(m.nazwa)}</li>`).join('')}</ul></div>` : ''}
  <p class="more"><a class="btn btn-d" href="${u('/park-maszynowy/')}">${esc(H.maszyny.link)} ${arrow}</a></p>
</div></section>

<section class="sec sec-3d" id="technologie-3d"><div class="container">
  <div class="d3-top${(f3.zdjecia || []).length ? '' : ' solo'}">
    <div class="d3-t reveal"><p class="eyebrow on-dark">${esc(f3.nadtytul)}</p><h2>${esc(f3.naglowek)}</h2><p class="lead">${esc(f3.tekst)}</p>
      <div class="brands">${f3.marki.map(b => `<span>${esc(b)}</span>`).join('')}</div>
      <p><a class="btn btn-a" href="${u('/park-maszynowy/#3d')}">${esc(f3.link)} ${arrow}</a></p></div>
    ${(f3.zdjecia || []).length ? `<div class="duo reveal">${f3.zdjecia.map(z => `<figure><div class="media r34">${pic(z.zdjecie, z.podpis || 'Technologia 3D na budowie', { kind: '3d', sizes: '(min-width:1000px) 22vw, 50vw' })}</div>${z.podpis ? `<figcaption>${esc(z.podpis)}</figcaption>` : ''}</figure>`).join('')}</div>` : ''}
  </div>
  <ul class="benefits row reveal">${f3.korzysci.map((k, i) => `<li><span class="num">0${i + 1}</span><div><h3>${esc(k.tytul)}</h3><p>${esc(k.opis)}</p></div></li>`).join('')}</ul>
</div></section>

<section class="sec" id="realizacje"><div class="container">
  ${head(H.realizacje.nadtytul, H.realizacje.naglowek, H.realizacje.wstep)}
  ${projs.length ? `<div class="grid3">${projs.map(projectCard).join('')}</div>` : `<p class="empty">${esc(PROJ.pusty)}</p>`}
  <p class="more"><a class="btn btn-d" href="${u('/realizacje/')}">${esc(H.realizacje.link)} ${arrow}</a></p>
</div></section>

<section class="sec sec-g" id="dla-wykonawcow"><div class="container split">
  <div class="split-m reveal"><div class="media r45">${pic(H.wykonawcy.zdjecie, H.wykonawcy.zdjecie_alt || 'Współpraca z generalnymi wykonawcami', { kind: 'plan', sizes: '(min-width:1000px) 50vw, 100vw' })}</div></div>
  <div class="split-t reveal"><p class="eyebrow">${esc(H.wykonawcy.nadtytul)}</p><h2>${esc(H.wykonawcy.naglowek)}</h2><p class="lead">${esc(H.wykonawcy.tekst)}</p>
    <ul class="ticks">${H.wykonawcy.punkty.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
    <p class="btns"><a class="btn btn-a" href="${u('/kontakt/?temat=przedmiar#formularz')}">${esc(H.wykonawcy.przycisk)}</a><a class="btn btn-d" href="${u('/dla-generalnych-wykonawcow/')}">${esc(H.wykonawcy.link)}</a></p></div>
</div></section>

<section class="sec" id="dlaczego"><div class="container">
  ${head(H.dlaczego.nadtytul, H.dlaczego.naglowek)}
  <div class="why">${H.dlaczego.pozycje.map((p, i) => `<div class="why-i reveal"><span class="num">0${i + 1}</span><h3>${esc(p.tytul)}</h3><p>${esc(p.opis)}</p></div>`).join('')}</div>
</div></section>

<section class="sec sec-g" id="obszar"><div class="container">
  ${head(H.obszar.nadtytul, H.obszar.naglowek, H.obszar.wstep)}
  <div class="why">${H.obszar.miejsca.map((p, i) => { const L = LOCAL.find(x => x.slug === p.strona); const inner = `<span class="num">0${i + 1}</span><h3>${esc(p.nazwa)}</h3><p>${esc(p.opis)}</p>${L ? `<span class="link">Zobacz szczegóły ${arrow}</span>` : ''}`; return L ? `<a class="why-i why-link reveal" href="${u('/' + L.slug + '/')}">${inner}</a>` : `<div class="why-i reveal">${inner}</div>`; }).join('')}</div>
  <p class="area-foot">${esc(H.obszar.stopka)}</p>
</div></section>

${contactSection(H.kontakt.nadtytul, H.kontakt.naglowek, H.kontakt.tekst, true)}`;
}

function contactSection(eyebrow, h, text, isHome) {
  return `<section class="sec sec-d" id="kontakt"><div class="container contact">
  <div class="contact-t reveal"><p class="eyebrow on-dark">${esc(eyebrow)}</p><${isHome ? 'h2' : 'h2'}>${esc(h)}</${isHome ? 'h2' : 'h2'}><p class="lead">${esc(text)}</p>
    ${contactRows('on-dark')}
    <p class="area"><strong>Obszar działania:</strong> województwo podlaskie – ${LOCAL.length ? LOCAL.map(l => `<a href="${u('/' + l.slug + '/')}">${esc(l.miejscowosc)}</a>`).join(', ') : 'Hajnówka, Bielsk Podlaski, Białystok'} i okolice; inne lokalizacje po uzgodnieniu.</p>
    <p><a class="btn btn-o" href="${mailQuote()}">Napisz e-mail</a></p></div>
  <div class="contact-f reveal" id="formularz-wrap"><h3 class="form-h">Zapytanie ofertowe</h3>${formHtml()}</div>
</div></section>`;
}

const GFX_ABOUT = { plan: GFX.siteSvg, przekroj: GFX.modelSvg }; // grafika wybierana w panelu, gdy sekcja nie ma zdjęcia
function pageAbout() {
  const A = rd('o-firmie.json');
  return `
<section class="page-hero"><div class="container"><p class="crumbs"><a href="${u('/')}">Strona główna</a> / O firmie</p><h1>${esc(A.naglowek)}</h1><p class="lead">${esc(A.lead)}</p></div></section>
${A.sekcje.map((s, i) => `<section class="sec${i % 2 ? ' sec-g' : ''}"><div class="container split${i % 2 ? ' rev' : ''}"><div class="split-t reveal"><h2>${esc(s.tytul)}</h2>${md(s.tekst)}</div><div class="split-m reveal">${s.mapa ? `<div class="map-box">${mapSvg()}</div>` : `<div class="media r45">${!s.zdjecie && GFX_ABOUT[s.grafika] ? GFX_ABOUT[s.grafika]() : pic(s.zdjecie, s.zdjecie_alt || s.tytul, { kind: ['teren', '3d', 'droga'][i % 3], sizes: '(min-width:1000px) 50vw, 100vw' })}</div>`}</div></div></section>`).join('')}
<section class="sec sec-d"><div class="container">${head('Dlaczego my', 'Na czym opieramy współpracę').replace('sec-h', 'sec-h on-dark')}<div class="why on-dark">${A.atuty.map((p, i) => `<div class="why-i reveal"><span class="num">0${i + 1}</span><h3>${esc(p.tytul)}</h3><p>${esc(p.opis)}</p></div>`).join('')}</div>
<p class="more"><a class="btn btn-a" href="${QUOTE()}">Zapytaj o wycenę</a></p></div></section>`;
}

function pageOffer() {
  return `
<section class="page-hero"><div class="container"><p class="crumbs"><a href="${u('/')}">Strona główna</a> / Oferta</p><h1>${esc(OFFER.naglowek)}</h1><p class="lead">${esc(OFFER.lead)}</p></div></section>
${OFFER.uslugi.map((s, i) => `<section class="sec${i % 2 ? ' sec-g' : ''}" id="${esc(s.id)}"><div class="container split${i % 2 ? ' rev' : ''}">
  <div class="split-t reveal"><p class="eyebrow">0${i + 1}</p><h2>${esc(s.nazwa)}</h2>${md(s.opis)}<ul class="ticks">${(s.punkty || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul>
  <p><a class="btn btn-a" href="${u('/kontakt/?usluga=' + s.id + '#formularz')}">Zapytaj o tę usługę</a></p></div>
  <div class="split-m reveal"><div class="media r45">${pic(s.zdjecie, s.nazwa, { kind: PH_SERVICE[s.id] || 'teren', sizes: '(min-width:1000px) 50vw, 100vw' })}</div></div></div></section>`).join('')}`;
}

function pageMachines() {
  const key = MACHINES.filter(m => m.zdjecie), rest = MACHINES.filter(m => !m.zdjecie);
  const hd = (e, h, l) => head(e, h, l);
  return `
<section class="page-hero"><div class="container"><p class="crumbs"><a href="${u('/')}">Strona główna</a> / Park maszynowy</p><h1>${esc(MACH.naglowek)}</h1><p class="lead">${esc(MACH.lead)}</p></div></section>
${key.length ? `<section class="sec" id="3d"><div class="container">
  ${hd(MACH.klucz_nadtytul || 'Maszyny w pracy', MACH.klucz_naglowek || 'Sprzęt do najbardziej wymagających prac', MACH.klucz_lead)}
  ${key.map((m, i) => `<article class="mfeat split${i % 2 ? ' rev' : ''}">
    <div class="split-t reveal"><p class="tag">${esc(CATS_M[m.kategoria] || m.kategoria)}</p><h3 class="mf-h">${esc(m.nazwa)}</h3>${m.model ? `<p class="model">Model: ${esc(m.model)}</p>` : ''}<p>${esc(m.opis)}</p>${m.system3d ? `<p class="sys3d">${esc(m.system3d_opis || 'Wyposażona w system 3D')}</p>` : ''}</div>
    <div class="split-m reveal"><div class="media r43">${pic(m.zdjecie, m.nazwa, { kind: PH_MACHINE[m.kategoria] || 'maszyna', sizes: '(min-width:1000px) 50vw, 100vw' })}${m.system3d ? '<span class="badge3d">3D</span>' : ''}</div></div>
  </article>`).join('')}
</div></section>` : ''}
${rest.length ? `<section class="sec sec-g" id="sprzet"><div class="container">
  ${hd('Park maszynowy', MACH.reszta_naglowek || 'Pozostały sprzęt', MACH.reszta_lead)}
  <div class="eq">${rest.map(m => `<div class="eq-i reveal"><p class="tag">${esc(CATS_M[m.kategoria] || m.kategoria)}</p><h3>${esc(m.nazwa)}</h3>${m.model ? `<p class="model">Model: ${esc(m.model)}</p>` : ''}<p>${esc(m.opis)}</p>${m.system3d ? `<p class="sys3d">${esc(m.system3d_opis || 'Wyposażona w system 3D')}</p>` : ''}</div>`).join('')}</div>
</div></section>` : ''}
<section class="sec sec-d"><div class="container btns-c"><h2>Potrzebujesz sprzętu do swojej inwestycji?</h2><p class="lead">Opisz zakres robót – dobierzemy maszyny i przygotujemy wycenę.</p><p><a class="btn btn-a btn-l" href="${QUOTE()}">Zapytaj o wycenę</a></p></div></section>`;
}

function pageLocal(p) {
  const others = LOCAL.filter(x => x.slug !== p.slug), secs = p.sekcje || [], first = secs[0];
  return `
<section class="page-hero"><div class="container"><p class="crumbs"><a href="${u('/')}">Strona główna</a> / <a href="${u('/#obszar')}">Obszar działania</a> / ${esc(p.miejscowosc)}</p><h1>${esc(p.naglowek)}</h1><p class="lead">${esc(p.lead)}</p>
  <p class="btns"><a class="btn btn-a btn-l" href="${QUOTE()}">Zapytaj o wycenę</a><a class="btn btn-o btn-l" href="${mailQuote()}">Napisz e-mail</a></p></div></section>
${first ? `<section class="sec"><div class="container split"><div class="split-t reveal"><h2>${esc(first.tytul)}</h2>${md(first.tekst)}</div><div class="split-m reveal"><div class="media r45">${pic(p.zdjecie, p.zdjecie_alt || p.naglowek, { kind: 'teren', eager: false, sizes: '(min-width:1000px) 50vw, 100vw' })}</div></div></div></section>` : ''}
${secs.length > 1 ? `<section class="sec sec-g"><div class="container cols2">${secs.slice(1).map(x => `<div class="reveal"><h2 class="h-m">${esc(x.tytul)}</h2>${md(x.tekst)}</div>`).join('')}</div></section>` : ''}
<section class="sec"><div class="container">
  ${head('Zakres usług', 'Co wykonujemy – ' + p.miejscowosc + ' i okolice')}
  <div class="grid4">${OFFER.uslugi.map(x => `<a class="tile reveal" href="${u('/oferta/#' + x.id)}"><h3>${esc(x.nazwa)}</h3><p>${esc(x.krotki)}</p><span class="link">Szczegóły ${arrow}</span></a>`).join('')}</div>
  <p class="more"><a class="btn btn-d" href="${u('/park-maszynowy/')}">Zobacz park maszynowy ${arrow}</a></p>
</div></section>
${(p.okolice || []).length ? `<section class="sec sec-g"><div class="container split"><div class="split-t reveal">${head('Okolice', p.okolice_naglowek || 'Obsługujemy także okolice')}<ul class="places">${p.okolice.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="area-foot">Inne miejscowości w województwie podlaskim – po uzgodnieniu zakresu i terminu.</p></div><div class="split-m reveal"><div class="map-box">${mapSvg(p.miejscowosc)}</div></div></div></section>` : ''}
${(p.faq || []).length ? `<section class="sec"><div class="container faq-wrap">${head('Pytania i odpowiedzi', 'Najczęstsze pytania – ' + p.miejscowosc)}<div class="faq">${p.faq.map(f => `<details><summary>${esc(f.pytanie)}</summary><div class="faq-a"><p>${esc(f.odpowiedz)}</p></div></details>`).join('')}</div>
  ${others.length ? `<p class="area-foot">Pracujemy także w rejonach: ${others.map(x => `<a href="${u('/' + x.slug + '/')}">${esc(x.miejscowosc)}</a>`).join(', ')}.</p>` : ''}</div></section>` : ''}
${contactSection('Kontakt', 'Zapytaj o wycenę – ' + p.miejscowosc, 'Opisz inwestycję lub załącz przedmiar albo dokumentację. Odpowiemy najszybciej, jak to możliwe.', false)}`;
}

function pageProjects() {
  const cats = Object.keys(CATS_R).filter(c => PROJECTS.some(p => (p.kategorie || []).includes(c))).map(c => [c, CATS_R[c]]);
  return `
<section class="page-hero"><div class="container"><p class="crumbs"><a href="${u('/')}">Strona główna</a> / Realizacje</p><h1>${esc(PROJ.naglowek)}</h1><p class="lead">${esc(PROJ.lead)}</p></div></section>
<section class="sec"><div class="container" data-filter-group>
  ${PROJECTS.length ? `<div class="filter-bar">${chips(cats)}</div><div class="grid3" data-filter-items>${PROJECTS.map(projectCard).join('')}</div><p class="empty" hidden data-empty>Brak realizacji w tej kategorii.</p>` : `<p class="empty">${esc(PROJ.pusty)}</p>`}
</div></section>
<section class="sec sec-d"><div class="container btns-c"><h2>Masz podobną inwestycję?</h2><p class="lead">Wyślij zapytanie – chętnie przygotujemy wycenę.</p><p><a class="btn btn-a btn-l" href="${QUOTE()}">Zapytaj o wycenę</a></p></div></section>`;
}

function pageProject(r) {
  const imgs = [r.zdjecie].concat(r.galeria || []).filter(Boolean);
  const cats = (r.kategorie || []).map(c => CATS_R[c] || c);
  const rows = [['Lokalizacja', r.lokalizacja], ['Rok', r.rok], ['Rodzaj robót', cats.join(', ')], ['Wykorzystany sprzęt', (r.sprzet || []).join(', ')]].filter(x => x[1]);
  return `
<section class="page-hero"><div class="container"><p class="crumbs"><a href="${u('/')}">Strona główna</a> / <a href="${u('/realizacje/')}">Realizacje</a> / ${esc(r.nazwa)}</p><h1>${esc(r.nazwa)}</h1>${r.przyklad ? '<p class="ribbon-inline">Wpis przykładowy – zastąp prawdziwą realizacją w panelu</p>' : ''}</div></section>
<section class="sec"><div class="container proj">
  <div class="proj-info reveal"><dl class="spec">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${r.zakres ? `<h2>Zakres prac</h2>${md(r.zakres)}` : ''}
  <p class="btns"><a class="btn btn-a" href="${u('/kontakt/?temat=wycena#formularz')}">Zapytaj o podobną realizację</a><a class="btn btn-d" href="${u('/realizacje/')}">← Wszystkie realizacje</a></p></div>
  <div class="gallery reveal">${imgs.length ? imgs.map((g, i) => `<a class="gal-i${i === 0 ? ' gal-main' : ''}" href="${media(g)}" data-full="${media(g)}" aria-label="Powiększ zdjęcie ${i + 1}">${pic(g, `${r.nazwa} – zdjęcie ${i + 1}`, { sizes: i === 0 ? '(min-width:1000px) 60vw, 100vw' : '(min-width:1000px) 30vw, 50vw' })}</a>`).join('') : `<div class="gal-i gal-main"><div class="media r32">${pic('', r.nazwa, { kind: PH_PROJECT[(r.kategorie || [])[0]] || 'teren' })}</div></div>`}</div>
</div></section>`;
}

function pageB2B() {
  const B = rd('dla-wykonawcow.json');
  return `
<section class="page-hero b2b"><div class="container split"><div class="split-t"><p class="crumbs"><a href="${u('/')}">Strona główna</a> / Dla generalnych wykonawców</p><p class="eyebrow on-dark">Współpraca B2B</p><h1>${esc(B.naglowek)}</h1><p class="lead">${esc(B.lead)}</p>
  <p class="btns"><a class="btn btn-a btn-l" href="${u('/kontakt/?temat=przedmiar#formularz')}">${esc(B.przycisk)}</a></p></div>
  <div class="split-m"><div class="media r45">${pic(B.zdjecie, B.zdjecie_alt || 'Roboty ziemne i drogowe', { kind: 'plan', eager: true, sizes: '(min-width:1000px) 50vw, 100vw' })}</div></div></div></section>
<section class="sec"><div class="container"><div class="why four">${B.korzysci.map((p, i) => `<div class="why-i reveal"><span class="num">0${i + 1}</span><h3>${esc(p.tytul)}</h3><p>${esc(p.opis)}</p></div>`).join('')}</div></div></section>
<section class="sec sec-g"><div class="container split"><div class="split-t reveal"><h2>${esc(B.zakresy_tytul)}</h2><ul class="ticks">${B.zakresy.map(z => `<li>${esc(z)}</li>`).join('')}</ul></div>
  <div class="split-t reveal"><h2>${esc(B.kroki_tytul)}</h2><ol class="steps vert">${B.kroki.map((k, i) => `<li><span class="step-n">0${i + 1}</span><h3>${esc(k.tytul)}</h3><p>${esc(k.opis)}</p></li>`).join('')}</ol></div></div></section>
<section class="sec sec-d"><div class="container btns-c"><h2>${esc(B.cta_naglowek)}</h2><p class="lead">${esc(B.cta_tekst)}</p><p class="btns c"><a class="btn btn-a btn-l" href="${u('/kontakt/?temat=przedmiar#formularz')}">${esc(B.przycisk)}</a><a class="btn btn-o btn-l" href="${mailQuote()}">Napisz e-mail</a></p></div></section>`;
}

function pageContact() {
  const K = rd('kontakt.json');
  return `
<section class="page-hero"><div class="container"><p class="crumbs"><a href="${u('/')}">Strona główna</a> / Kontakt</p><h1>${esc(K.naglowek)}</h1><p class="lead">${esc(K.lead)}</p></div></section>
${contactSection('Dane kontaktowe', K.formularz_tytul, K.obszar, false)}`;
}

function pageText(t, html) { return `<section class="page-hero"><div class="container"><p class="crumbs"><a href="${u('/')}">Strona główna</a> / ${esc(t)}</p><h1>${esc(t)}</h1></div></section><section class="sec"><div class="container prose">${html}</div></section>`; }

/* ---------- budowanie ---------- */
function out(url, html) { const f = url.endsWith('/') ? path.join(OUT, url, 'index.html') : path.join(OUT, url); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); }
function add(page, inSitemap = true) { out(page.url, layout(page)); if (inSitemap && !page.noindex) PAGES.push(page.url); }

async function optimize() {
  let sharp; try { sharp = require('sharp'); } catch (e) { return console.log('  (brak modułu sharp – obrazy kopiowane bez zmian; na Netlify zostaną zoptymalizowane automatycznie)'); }
  const dir = path.join(ROOT, 'assets', 'uploads'); if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
    try {
      const base = f.replace(/\.[^.]+$/, ''); const meta = await sharp(path.join(dir, f)).metadata(); const vs = [];
      for (const w of [640, 1280, 1920]) {
        if (meta.width && w > meta.width && vs.length) break;
        const name = `${base}-${w}.webp`; await sharp(path.join(dir, f)).rotate().resize({ width: Math.min(w, meta.width || w), withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(OUT, 'assets', 'uploads', name));
        vs.push({ w: Math.min(w, meta.width || w), url: '/assets/uploads/' + name });
      }
      OPT['/assets/uploads/' + f] = vs;
    } catch (e) { console.log('  pominięto optymalizację', f, e.message); }
  }
}

(async function main() {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
  if (!PREVIEW) fs.cpSync(path.join(ROOT, 'admin'), path.join(OUT, 'admin'), { recursive: true });
  await optimize();

  HOME = rd('strona-glowna.json'); OFFER = rd('oferta.json'); MACH = rd('park-maszynowy.json'); PROJ = rd('realizacje.json');
  MACHINES = list('maszyny').sort((a, b) => (a.kolejnosc || 50) - (b.kolejnosc || 50) || a.nazwa.localeCompare(b.nazwa, 'pl'));
  PROJECTS = list('realizacje').sort((a, b) => (a.przyklad ? 1 : 0) - (b.przyklad ? 1 : 0) || (parseInt(b.rok) || 0) - (parseInt(a.rok) || 0) || a.nazwa.localeCompare(b.nazwa, 'pl'));
  CUSTOM = list('podstrony').map(p => ({ ...p, slug: slugify(p.slug || p.tytul) }));
  LOCAL = list('lokalne').sort((a, b) => (a.kolejnosc || 50) - (b.kolejnosc || 50));

  const crumb = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, h], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: siteUrl + h })) });
  add({ url: '/', title: HOME.meta_tytul, desc: HOME.meta_opis, body: pageHome, schema: [orgLd()] });
  const A = rd('o-firmie.json'); add({ url: '/o-firmie/', title: A.meta_tytul, desc: A.meta_opis, body: pageAbout, schema: [crumb([['Strona główna', '/'], ['O firmie', '/o-firmie/']])] });
  add({ url: '/oferta/', title: OFFER.meta_tytul, desc: OFFER.meta_opis, body: pageOffer, schema: [crumb([['Strona główna', '/'], ['Oferta', '/oferta/']])] });
  add({ url: '/park-maszynowy/', title: MACH.meta_tytul, desc: MACH.meta_opis, body: pageMachines, schema: [crumb([['Strona główna', '/'], ['Park maszynowy', '/park-maszynowy/']])] });
  add({ url: '/realizacje/', title: PROJ.meta_tytul, desc: PROJ.meta_opis, body: pageProjects, schema: [crumb([['Strona główna', '/'], ['Realizacje', '/realizacje/']])] });
  PROJECTS.forEach(r => add({ url: `/realizacje/${r.slug}/`, title: `${r.nazwa} | Realizacje – ${S.nazwa_skrot}`, desc: (r.zakres || `${r.nazwa} – realizacja ${S.nazwa}.`).replace(/\s+/g, ' ').slice(0, 155), body: () => pageProject(r), og: r.zdjecie ? media(r.zdjecie).replace(/^\//, siteUrl + '/') : undefined, noindex: !!r.przyklad }));
  const B = rd('dla-wykonawcow.json'); add({ url: '/dla-generalnych-wykonawcow/', title: B.meta_tytul, desc: B.meta_opis, body: pageB2B, schema: [crumb([['Strona główna', '/'], ['Dla generalnych wykonawców', '/dla-generalnych-wykonawcow/']])] });
  const K = rd('kontakt.json'); add({ url: '/kontakt/', title: K.meta_tytul, desc: K.meta_opis, body: pageContact, schema: [crumb([['Strona główna', '/'], ['Kontakt', '/kontakt/']])] });
  const faqLd = f => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: f.map(x => ({ '@type': 'Question', name: x.pytanie, acceptedAnswer: { '@type': 'Answer', text: x.odpowiedz } })) });
  LOCAL.forEach(p => { const o = orgLd(); o.areaServed = [{ '@type': 'City', name: p.miejscowosc }].concat((p.okolice || []).map(n => ({ '@type': 'City', name: n })), [{ '@type': 'AdministrativeArea', name: 'Województwo podlaskie' }]); o.url = siteUrl + '/' + p.slug + '/';
    add({ url: `/${p.slug}/`, title: p.meta_tytul, desc: p.meta_opis, body: () => pageLocal(p), og: p.zdjecie ? media(p.zdjecie).replace(/^\//, siteUrl + '/') : undefined, schema: [o, crumb([['Strona główna', '/'], [p.miejscowosc, `/${p.slug}/`]])].concat((p.faq || []).length ? [faqLd(p.faq)] : []) }); });
  CUSTOM.forEach(p => add({ url: `/${p.slug}/`, title: p.meta_tytul || `${p.tytul} | ${S.nazwa_skrot}`, desc: p.meta_opis, body: () => pageText(p.tytul, md(p.tresc)) }));

  const P = rd('polityka-prywatnosci.json');
  const adres = [S.ulica, [S.kod, S.miasto].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const kont = [S.email, S.telefon].filter(Boolean).join(', ') || 'formularz kontaktowy w zakładce „Kontakt”';
  const cookies = S.ga4_id ? 'Za Twoją zgodą korzystamy z Google Analytics 4 (Google Ireland Limited), które zapisuje pliki cookies i zbiera statystyki odwiedzin; dane mogą być przekazywane do Google LLC w USA. Zgodę możesz w każdej chwili zmienić w „Ustawieniach cookies” w stopce strony lub wycofać, usuwając cookies w przeglądarce. Poza tym strona korzysta wyłącznie z mechanizmów niezbędnych do jej działania.' : 'Strona nie używa plików cookies analitycznych ani marketingowych i nie wymaga Twojej zgody na cookies. Jeśli w przyszłości uruchomimy takie narzędzia, poprosimy Cię o zgodę i zaktualizujemy tę politykę.';
  const ptxt = P.tresc.split('{{nazwa}}').join(S.nazwa).split('{{adres}}').join(adres ? ', ' + adres : '').split('{{nip}}').join(S.nip ? ', NIP: ' + S.nip : '').split('{{kontakt}}').join(kont).split('{{cookies}}').join(cookies).split('{{data}}').join(todayPl());
  add({ url: '/polityka-prywatnosci/', title: P.meta_tytul, desc: 'Polityka prywatności serwisu ' + S.nazwa, body: () => pageText(P.naglowek, md(ptxt)) });
  add({ url: '/dziekujemy/', title: 'Dziękujemy za wiadomość | ' + S.nazwa_skrot, noindex: true, body: () => `<section class="page-hero"><div class="container"><h1>Dziękujemy!</h1><p class="lead">Twoja wiadomość została wysłana. Odpowiemy najszybciej, jak to możliwe.</p><p><a class="btn btn-a" href="${u('/')}">Wróć na stronę główną</a></p></div></section>` }, false);
  add({ url: '/404.html', title: 'Nie znaleziono strony | ' + S.nazwa_skrot, noindex: true, body: () => `<section class="page-hero"><div class="container"><h1>Nie znaleziono strony</h1><p class="lead">Strona, której szukasz, nie istnieje lub została przeniesiona.</p><p class="btns"><a class="btn btn-a" href="${u('/')}">Strona główna</a><a class="btn btn-o" href="${QUOTE()}">Zapytaj o wycenę</a></p></div></section>` }, false);

  // sitemap / robots / nagłówki
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.map(p => `  <url><loc>${siteUrl}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  if (!PREVIEW) fs.writeFileSync(path.join(OUT, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: SAMEORIGIN\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Strict-Transport-Security: max-age=31536000; includeSubDomains\n/assets/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/css/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/js/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/uploads/*\n  Cache-Control: public, max-age=604800\n`);
  const miss = [['e-mail', S.email], ['telefon', S.telefon], ['adres (ulica, kod, miejscowość)', S.ulica && S.miasto], ['NIP', S.nip], ['adres strony (domena)', S.adres_strony]].filter(x => !x[1]).map(x => x[0]);
  if (miss.length) console.log('  UZUPEŁNIJ w panelu (Dane firmy i ustawienia): ' + miss.join(', '));
  console.log(`OK: ${PAGES.length} stron → ${path.relative(ROOT, OUT)}/ (${PREVIEW ? 'podgląd – linki względne' : 'produkcja'})`);
})().catch(e => { console.error(e); process.exit(1); });
