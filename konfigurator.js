/* Dialopt – Chatbot-Konfigurator ("So, wie Sie wollen.")
 * Die Szene (Hintergrund, Glühen, Panel) folgt Farbe und Hell/Dunkel.
 * Im Chat-Widget selbst nur, was wirklich umsetzbar ist:
 *  - Retell: data-color, data-bot-name, data-logo-url (Icon + Name), data-fab-icon-url,
 *    data-fab-text, data-popup-message, data-show-ai-popup-time, data-chat-font-size,
 *    Chat- und Sprach-Agent, Begrüßung des Agenten
 *  - unsere Farbschicht in embed/chat.js: Tönung und Dunkelmodus (data-design="dark")
 * Nicht dabei: Position links, Online-Status (kann Retell nicht).
 * Alles läuft lokal im Browser, es wird nichts übertragen.
 */
(function () {
  'use strict';
  var form = document.getElementById('cfg-form');
  if (!form) return;

  function $(id) { return document.getElementById(id); }
  var scene = $('konfigurator');
  var pv = $('pv');
  var DEF = { fab: 'Haben Sie Fragen?', greet: 'Hallo! Wie kann ich Ihnen helfen?', popup: 'Fragen? Ich helfe Ihnen gerne weiter.', delay: 3 };
  var SIZES = { 'default': '14px', 'large': '16px', 'extra-large': '18px' };
  var SIZE_LABEL = { 'default': 'Normal', 'large': 'Groß', 'extra-large': 'Sehr groß' };
  var ICON_LABEL = { home: 'Haus', scissors: 'Schere', food: 'Besteck', shop: 'Tasche' };
  var upload = null, lastLogo = 'home';
  var popTimer = null, popKey = '';

  function radio(name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function iconPath(key) { var svg = form.querySelector('.cfg-icons input[value="' + key + '"] + span svg'); return svg ? svg.innerHTML : ''; }
  function luminance(h) {
    var c = [1, 3, 5].map(function (i) {
      var x = parseInt(h.substr(i, 2), 16) / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  function state() {
    var c = radio('color');
    var n = $('cfg-bot').value.trim();
    return {
      color: (c === 'custom' ? $('cfg-custom').value : c).toUpperCase(),
      dark: radio('design') === 'dark',
      name: n,
      title: n ? n + ' Assistent' : 'Ihr Assistent',
      logo: radio('logo'),
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
    scene.style.setProperty('--c', s.color);
    scene.setAttribute('data-design', s.dark ? 'dark' : 'light');
    pv.style.setProperty('--fs', SIZES[s.size] || SIZES['default']);
    form.querySelector('.cfg-custom').style.setProperty('--c', $('cfg-custom').value);

    // Kopf: Icon im Farbkreis + Name, oder nur das eigene Logo (wie bei Retell)
    var custom = s.logo === 'upload' && upload;
    var icon = iconPath(s.logo === 'upload' ? lastLogo : s.logo);
    pv.querySelector('.pv-head').classList.toggle('custom', !!custom);
    $('pv-avatar-img').hidden = !custom;
    if (custom) $('pv-avatar-img').src = upload;
    $('pv-avatar-icon').innerHTML = icon;
    $('pv-title').textContent = s.title;

    var fabIc = $('pv-fab-ic');
    fabIc.textContent = '';
    if (custom) { var im = document.createElement('img'); im.alt = ''; im.src = upload; fabIc.appendChild(im); }
    else fabIc.innerHTML = '<svg viewBox="0 0 24 24">' + icon + '</svg>';
    $('pv-fab-text').textContent = s.fab || 'Need support?';
    $('pv-pop-name').textContent = s.title;
    $('pv-greet').textContent = s.greet;
    $('pv-tabs').hidden = s.mode !== 'both';

    $('cfg-logo-hint').hidden = s.logo !== 'upload';
    $('cfg-contrast').hidden = luminance(s.color) < 0.45;
    $('cfg-popup-fields').hidden = !s.popupOn;
    $('cfg-delay-out').textContent = s.delay;

    schedulePopup(s);
    if (!$('fconfig').disabled) attach();
  }

  function schedulePopup(s) {
    var pop = $('pv-pop');
    if (!s.popupOn || !s.popup) { clearTimeout(popTimer); pop.hidden = true; popKey = ''; return; }
    $('pv-pop-text').textContent = s.popup;
    var key = s.popup + '|' + s.delay;
    if (key === popKey) return;
    popKey = key;
    clearTimeout(popTimer);
    pop.hidden = true;
    popTimer = setTimeout(function () { pop.hidden = false; }, s.delay * 1000);
  }

  // Eigene Farbe
  var customRadio = form.querySelector('input[name="color"][value="custom"]');
  ['input', 'click'].forEach(function (ev) {
    $('cfg-custom').addEventListener(ev, function () { customRadio.checked = true; render(); });
  });

  // Eigenes Logo: nur lokal als Vorschau
  var uploadRadio = form.querySelector('input[name="logo"][value="upload"]');
  uploadRadio.addEventListener('click', function () { $('cfg-logo').click(); });
  form.querySelectorAll('input[name="logo"]').forEach(function (r) {
    r.addEventListener('change', function () { if (r.value !== 'upload') lastLogo = r.value; });
  });
  function backToLast() { form.querySelector('input[name="logo"][value="' + lastLogo + '"]').checked = true; render(); }
  $('cfg-logo').addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) { if (!upload) backToLast(); return; }
    if (f.size > 2 * 1024 * 1024) { alert('Bitte ein Logo unter 2 MB wählen.'); this.value = ''; if (!upload) backToLast(); return; }
    var rd = new FileReader();
    rd.onload = function () { upload = rd.result; uploadRadio.checked = true; render(); };
    rd.readAsDataURL(f);
  });
  // Dateidialog abgebrochen, ohne dass es schon ein Logo gibt: vorherige Auswahl zurück
  window.addEventListener('focus', function () {
    setTimeout(function () { if (uploadRadio.checked && !upload) backToLast(); }, 400);
  });

  form.addEventListener('input', render);
  form.addEventListener('change', render);

  $('cfg-reset').addEventListener('click', function () {
    form.querySelector('input[name="color"][value="#7C3AED"]').checked = true;
    form.querySelector('input[name="design"][value="light"]').checked = true;
    form.querySelector('input[name="logo"][value="home"]').checked = true;
    form.querySelector('input[name="size"][value="default"]').checked = true;
    form.querySelector('input[name="mode"][value="chat"]').checked = true;
    $('cfg-bot').value = '';
    $('cfg-fab').value = DEF.fab;
    $('cfg-greet').value = DEF.greet;
    $('cfg-popup-on').checked = false;
    $('cfg-popup').value = DEF.popup;
    $('cfg-delay').value = DEF.delay;
    upload = null; lastLogo = 'home'; $('cfg-logo').value = '';
    render();
  });

  // Konfiguration ans Kontaktformular hängen
  function summary() {
    var s = state();
    return [
      'Name: ' + s.title,
      'Farbe: ' + s.color,
      'Design: ' + (s.dark ? 'Dunkel' : 'Hell'),
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
    }, { threshold: 0 }).observe(scene);
  }

  render();
})();
