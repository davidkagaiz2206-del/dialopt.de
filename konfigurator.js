/* Dialopt – Chatbot-Konfigurator
 * Zeigt nur Optionen, die das Retell-Widget (retell-widget-v2.js) wirklich kennt:
 * data-color, data-bot-name, data-title, data-logo-url, data-fab-text,
 * data-popup-message, data-show-ai-popup, data-show-ai-popup-time,
 * data-chat-font-size sowie Chat- und Sprach-Agent.
 * Die erste Nachricht ist die Begrüßung des Retell-Agenten.
 * Nicht dabei, weil Retell es nicht kann: Hell/Dunkel, Position links.
 * Alles läuft lokal im Browser, es wird nichts an Retell übertragen.
 */
(function () {
  'use strict';
  var form = document.getElementById('cfg-form');
  if (!form) return;

  function $(id) { return document.getElementById(id); }
  var pv = $('pv');
  var DEF = { name: 'Ihr Assistent', fab: 'Haben Sie Fragen?', greet: 'Hallo! Wie kann ich Ihnen helfen?', popup: 'Fragen? Ich helfe Ihnen gerne weiter.', delay: 3 };
  var SIZES = { 'default': '14px', 'large': '16px', 'extra-large': '18px' };
  var SIZE_LABEL = { 'default': 'Normal', 'large': 'Groß', 'extra-large': 'Sehr groß' };
  var ICON_LABEL = { home: 'Haus', scissors: 'Schere', food: 'Besteck', shop: 'Tasche' };
  var upload = null;
  var popTimer = null, popKey = '';

  // Vorlagen-Icons als weißes SVG-Logo (so würden wir sie als data-logo-url hinterlegen)
  function iconLogo(key) {
    var svg = form.querySelector('.cfg-icons input[value="' + key + '"] + span svg');
    if (!svg) return null;
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + svg.innerHTML + '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(s);
  }
  function luminance(h) {
    var c = [1, 3, 5].map(function (i) {
      var x = parseInt(h.substr(i, 2), 16) / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function radio(name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }

  function state() {
    var c = radio('color');
    var logo = radio('logo');
    return {
      color: (c === 'custom' ? $('cfg-custom').value : c).toUpperCase(),
      logo: logo,
      logoSrc: logo === 'upload' ? upload : iconLogo(logo),
      name: $('cfg-bot').value.trim() || DEF.name,
      fab: $('cfg-fab').value.trim(),
      greet: $('cfg-greet').value.trim() || DEF.greet,
      popupOn: $('cfg-popup-on').checked,
      popup: $('cfg-popup').value.trim(),
      delay: +$('cfg-delay').value,
      size: radio('size'),
      mode: radio('mode')
    };
  }

  function render() {
    var s = state();
    // data-color setzt bei Retell Haupt- und Akzentfarbe zugleich
    pv.style.setProperty('--theme', s.color);
    pv.style.setProperty('--accent', s.color);
    pv.style.setProperty('--fs', SIZES[s.size] || SIZES['default']);
    form.style.setProperty('--pick', s.color);
    form.querySelector('.cfg-custom span').style.setProperty('--c', $('cfg-custom').value);

    $('pv-title').textContent = s.name;
    $('pv-fab-text').textContent = s.fab || 'Need support?';
    $('pv-pop-name').textContent = s.name;
    $('pv-greet').textContent = s.greet;
    $('pv-tabs').hidden = s.mode !== 'both';

    var logo = $('pv-logo'), fabLogo = $('pv-fab-logo');
    logo.hidden = fabLogo.hidden = !s.logoSrc;
    $('pv-fab-icon').style.display = s.logoSrc ? 'none' : '';
    if (s.logoSrc) { logo.src = s.logoSrc; fabLogo.src = s.logoSrc; }
    $('cfg-logo-hint').hidden = s.logo !== 'upload';

    $('cfg-contrast').hidden = luminance(s.color) < 0.45;
    $('cfg-popup-fields').hidden = !s.popupOn;
    $('cfg-delay-out').textContent = s.delay;

    schedulePopup(s);
    if (!$('fconfig').disabled) attach();
  }

  // Popup erscheint wie bei Retell nur bei geschlossenem Fenster, nach der eingestellten Zeit.
  function schedulePopup(s) {
    var pop = $('pv-pop');
    if (!s.popupOn || !s.popup || !$('pv-win').hidden) { clearTimeout(popTimer); pop.hidden = true; popKey = ''; return; }
    $('pv-pop-text').textContent = s.popup;
    var key = [s.popup, s.delay].join('|');
    if (key === popKey) return;
    popKey = key;
    clearTimeout(popTimer);
    pop.hidden = true;
    popTimer = setTimeout(function () { pop.hidden = false; }, s.delay * 1000);
  }

  function setOpen(open) {
    $('pv-win').hidden = !open;
    $('pv-fab').setAttribute('aria-expanded', open ? 'true' : 'false');
    popKey = '';
    if (open) { clearTimeout(popTimer); $('pv-pop').hidden = true; } else schedulePopup(state());
  }
  $('pv-fab').addEventListener('click', function () { setOpen($('pv-win').hidden); });
  $('pv-close').addEventListener('click', function () { setOpen(false); $('pv-fab').focus(); });
  $('pv-pop').addEventListener('click', function () { setOpen(true); });

  // Eigene Farbe: Klick auf den Farbkreis wählt ihn aus und öffnet den Farbwähler
  $('cfg-custom').addEventListener('input', function () { form.querySelector('input[name="color"][value="custom"]').checked = true; render(); });
  $('cfg-custom').addEventListener('click', function () { form.querySelector('input[name="color"][value="custom"]').checked = true; render(); });

  // Eigenes Logo: nur lokal als Vorschau
  var uploadRadio = form.querySelector('input[name="logo"][value="upload"]');
  var lastLogo = 'home';
  uploadRadio.addEventListener('click', function () { $('cfg-logo').click(); });
  form.querySelectorAll('input[name="logo"]').forEach(function (r) {
    r.addEventListener('change', function () { if (r.value !== 'upload') lastLogo = r.value; });
  });
  $('cfg-logo').addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) { if (!upload) backToLast(); return; }
    if (f.size > 2 * 1024 * 1024) { alert('Bitte ein Logo unter 2 MB wählen.'); this.value = ''; if (!upload) backToLast(); return; }
    var rd = new FileReader();
    rd.onload = function () { upload = rd.result; uploadRadio.checked = true; render(); };
    rd.readAsDataURL(f);
  });
  // Dialog abgebrochen, ohne dass es schon ein Logo gibt: vorherige Auswahl zurück
  window.addEventListener('focus', function () {
    setTimeout(function () { if (uploadRadio.checked && !upload) backToLast(); }, 400);
  });
  function backToLast() { form.querySelector('input[name="logo"][value="' + lastLogo + '"]').checked = true; render(); }

  form.addEventListener('input', render);
  form.addEventListener('change', render);

  $('cfg-reset').addEventListener('click', function () {
    form.querySelector('input[name="color"]').checked = true;
    form.querySelector('input[name="logo"][value="home"]').checked = true;
    form.querySelector('input[name="size"][value="default"]').checked = true;
    form.querySelector('input[name="mode"][value="chat"]').checked = true;
    $('cfg-bot').value = '';
    $('cfg-fab').value = DEF.fab;
    $('cfg-greet').value = DEF.greet;
    $('cfg-popup-on').checked = true;
    $('cfg-popup').value = DEF.popup;
    $('cfg-delay').value = DEF.delay;
    upload = null; lastLogo = 'home'; $('cfg-logo').value = '';
    render();
  });

  // Konfiguration ans Kontaktformular hängen
  function summary() {
    var s = state();
    return [
      'Name: ' + s.name,
      'Farbe: ' + s.color,
      'Logo: ' + (s.logo === 'upload' ? 'eigenes (wird per E-Mail nachgereicht)' : 'Icon ' + ICON_LABEL[s.logo]),
      'Button-Text: ' + (s.fab || '(Standard)'),
      'Erste Nachricht: ' + s.greet,
      'Popup: ' + (s.popupOn && s.popup ? '"' + s.popup + '" nach ' + s.delay + ' s' : 'aus'),
      'Schriftgröße: ' + SIZE_LABEL[s.size],
      'Funktionen: ' + (s.mode === 'both' ? 'Chat + Sprache' : 'Nur Chat')
    ].join('\n');
  }
  function attach() {
    var f = $('fconfig');
    f.disabled = false;
    f.value = summary();
    $('cfg-attached').hidden = false;
    $('cfg-attached-logo').hidden = radio('logo') !== 'upload';
  }
  $('cfg-send').addEventListener('click', attach);
  $('cfg-detach').addEventListener('click', function () {
    $('fconfig').disabled = true;
    $('cfg-attached').hidden = true;
  });

  // Der echte Chat-Button der Seite würde über der Vorschau liegen: solange
  // der Konfigurator sichtbar ist, ausblenden.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      document.body.classList.toggle('cfg-in-view', es[0].isIntersecting);
    }, { threshold: 0.15 }).observe(document.querySelector('.cfg-stage'));
  }

  render();
})();
