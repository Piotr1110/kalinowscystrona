/* Kalinowscy – skrypty strony (bez bibliotek). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var cfg = {}; try { cfg = JSON.parse($('#kal-config').textContent); } catch (e) {}
  var html = document.documentElement;

  /* --- menu mobilne --- */
  var burger = $('.burger'), nav = $('#nav');
  function setMenu(open) {
    html.classList.toggle('nav-open', open); document.body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width:901px)').addEventListener('change', function () { setMenu(false); });
  }
  var hd = $('.site-header');
  function onScroll() { hd.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* --- filtry (park maszynowy, realizacje) --- */
  $$('[data-filter-group]').forEach(function (g) {
    var items = $$('[data-filter-items] > [data-cat]', g), btns = $$('.chip', g), empty = $('[data-empty]', g);
    function apply(f, push) {
      var n = 0;
      items.forEach(function (it) { var ok = f === '*' || (' ' + it.getAttribute('data-cat') + ' ').indexOf(' ' + f + ' ') > -1; it.hidden = !ok; if (ok) n++; });
      btns.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-filter') === f); });
      if (empty) empty.hidden = n > 0;
      if (push && history.replaceState) history.replaceState(null, '', f === '*' ? location.pathname + location.search : '#' + f);
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-filter'), true); }); });
    var h = location.hash.replace('#', ''); if (h && btns.some(function (b) { return b.getAttribute('data-filter') === h; })) apply(h, false);
  });

  /* --- lightbox galerii --- */
  var links = $$('a[data-full]');
  if (links.length && window.HTMLDialogElement) {
    var dlg = document.createElement('dialog'); dlg.className = 'lb'; dlg.setAttribute('aria-label', 'Powiększone zdjęcie');
    dlg.innerHTML = '<div class="lb-in"><img alt=""></div><button class="x" type="button" aria-label="Zamknij">×</button><button class="pv" type="button" aria-label="Poprzednie">‹</button><button class="nx" type="button" aria-label="Następne">›</button>';
    document.body.appendChild(dlg); var big = $('img', dlg), cur = 0;
    function show(i) { cur = (i + links.length) % links.length; big.src = links[cur].getAttribute('data-full'); var im = $('img', links[cur]); big.alt = im ? im.alt : ''; }
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); show(i); dlg.showModal(); }); });
    $('.x', dlg).onclick = function () { dlg.close(); };
    $('.pv', dlg).onclick = function () { show(cur - 1); }; $('.nx', dlg).onclick = function () { show(cur + 1); };
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lb-in')) dlg.close(); });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  }

  /* --- formularz zapytania --- */
  var form = $('#formularz');
  if (form) {
    var q = new URLSearchParams(location.search), sel = $('#f-typ', form), msg = $('#f-msg', form);
    var usl = q.get('usluga'); if (usl && sel) { var op = $('option[data-id="' + usl.replace(/[^\w-]/g, '') + '"]', sel); if (op) sel.value = op.value; }
    if (q.get('temat') === 'przedmiar') { if (msg && !msg.value) msg.value = 'Przesyłam przedmiar / dokumentację do wyceny.\nZakres robót:\nTermin:'; var f1 = $('#f-file1', form); if (f1 && location.hash === '#formularz') setTimeout(function () { try { f1.focus({ preventScroll: true }); } catch (e) {} }, 400); }
    var files = $$('input[type=file]', form), addBtn = $('[data-add-file]', form), status = $('.form-status', form);
    var maxMB = parseFloat(form.getAttribute('data-max-mb')) || 8, okExt = /\.(pdf|xlsx|xls|docx|doc|jpe?g|png|webp|heic)$/i;
    addBtn.addEventListener('click', function () { var h = files.filter(function (f) { return f.hidden; }); if (h.length) { h[0].hidden = false; h[0].focus(); } if (h.length <= 1) addBtn.hidden = true; });

    function fieldOf(el) { return el.closest('.fld'); }
    function setErr(el, text) {
      var f = fieldOf(el); f.classList.add('err'); el.setAttribute('aria-invalid', 'true');
      var m = $('.err-msg', f); if (!m) { m = document.createElement('p'); m.className = 'err-msg'; m.setAttribute('role', 'alert'); f.appendChild(m); } m.textContent = text;
    }
    function clearErr(el) { var f = fieldOf(el); f.classList.remove('err'); el.removeAttribute('aria-invalid'); var m = $('.err-msg', f); if (m) m.remove(); }
    $$('input,select,textarea', form).forEach(function (el) { el.addEventListener('input', function () { clearErr(el); }); el.addEventListener('change', function () { clearErr(el); }); });

    function validate() {
      var bad = null; function fail(el, t) { setErr(el, t); if (!bad) bad = el; }
      var n = $('#f-name', form), m = $('#f-mail', form), t = $('#f-tel', form);
      $$('.err-msg', form).forEach(function (x) { x.remove(); }); $$('.err', form).forEach(function (x) { x.classList.remove('err'); });
      if (n.value.trim().length < 2) fail(n, 'Podaj imię i nazwisko lub nazwę firmy.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.value.trim())) fail(m, 'Podaj poprawny adres e-mail.');
      if (t.value.trim() && !/^[+()\d\s-]{7,20}$/.test(t.value.trim())) fail(t, 'Podaj poprawny numer telefonu.');
      var total = 0, any = false;
      files.forEach(function (f) { if (!f.files || !f.files.length) return; any = true; var fl = f.files[0]; total += fl.size; if (!okExt.test(fl.name)) fail(f, 'Dozwolone pliki: PDF, XLSX, DOCX oraz zdjęcia JPG/PNG.'); });
      if (total > maxMB * 1048576) fail(files[0], 'Załączniki są zbyt duże (maks. ' + maxMB + ' MB łącznie). Wyślij mniejsze pliki lub napisz e-mail.');
      if (msg.value.trim().length < 5 && !any) fail(msg, 'Napisz krótką wiadomość lub dołącz przedmiar albo dokumentację.');
      if (bad) bad.focus();
      return !bad;
    }
    function say(cls, html_) { status.className = 'form-status ' + cls; status.innerHTML = html_; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('[name=bot-field]').value) return; // pułapka na boty
      if (!validate()) return;
      if (form.getAttribute('data-preview') === '1' || location.protocol === 'file:') { say('ok', 'Podgląd lokalny: formularz zacznie wysyłać wiadomości po publikacji strony (Netlify Forms lub własna usługa).'); return; }
      var btn = $('button[type=submit]', form); btn.disabled = true; say('', 'Wysyłanie…');
      var fd = new FormData(form);
      fetch(form.getAttribute('action'), { method: 'POST', body: fd, headers: { Accept: 'application/json' } }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset(); files.slice(1).forEach(function (f) { f.hidden = true; }); addBtn.hidden = false;
        say('ok', '<strong>Dziękujemy!</strong> Twoja wiadomość została wysłana. Odpowiemy najszybciej, jak to możliwe.'); status.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }).catch(function () {
        say('fail', 'Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz bezpośrednio na nasz e-mail.');
      }).then(function () { btn.disabled = false; });
    });
  }

  /* --- zgoda na cookies + Google Analytics (tylko gdy ustawiono ga4_id) --- */
  if (cfg.ga) {
    var KEY = 'kal-cookie-consent';
    var get = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
    var set = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
    var loadGA = function () {
      if (window.__ga) return; window.__ga = 1; window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); }; window.gtag('js', new Date()); window.gtag('config', cfg.ga, { anonymize_ip: true });
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga); document.head.appendChild(s);
    };
    var banner = function () {
      if ($('.cookie')) return; var b = document.createElement('div'); b.className = 'cookie'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Zgoda na pliki cookies');
      b.innerHTML = '<p>Używamy plików cookies do statystyk odwiedzin (Google Analytics) – tylko za Twoją zgodą. <a href="' + (document.querySelector('a[href*="polityka-prywatnosci"]') || { getAttribute: function () { return '#'; } }).getAttribute('href') + '">Polityka prywatności</a></p><div class="btns"><button class="btn btn-a btn-s" data-y>Akceptuję</button><button class="btn btn-o btn-s" data-n>Odrzucam</button></div>';
      document.body.appendChild(b);
      b.querySelector('[data-y]').onclick = function () { set('yes'); loadGA(); b.remove(); };
      b.querySelector('[data-n]').onclick = function () { set('no'); b.remove(); };
    };
    if (get() === 'yes') loadGA(); else if (!get()) banner();
    $$('[data-cookie-settings]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); banner(); }); });
  }
})();
