/* Dialopt – Chatbot-Konfigurator
 * Zeigt nur Optionen, die das Retell-Widget (retell-widget-v2.js) wirklich kennt:
 * data-bot-name, data-title, data-logo-url, data-fab-text, data-theme-color,
 * data-component-color, data-popup-message, data-show-ai-popup,
 * data-show-ai-popup-time, data-chat-font-size sowie Chat- und Sprach-Agent.
 * Die erste Nachricht ist die Begrüßung des Retell-Agenten.
 * Alles läuft lokal im Browser, es wird nichts an Retell übertragen.
 */
(function () {
  'use strict';
  var form = document.getElementById('cfg-form');
  if (!form) return;

  function $(id) { return document.getElementById(id); }
  var pv = $('pv');
  var DEFAULTS = {
    botName: 'Dialo', title: 'Dialo', fabText: 'Haben Sie Fragen?',
    theme: '#0A1628', accent: '#0057B8',
    greet: 'Hallo! Wie kann ich Ihnen weiterhelfen?',
    popupOn: true, popup: 'Fragen? Ich helfe Ihnen gerne weiter.', delay: 3,
    size: 'default', mode: 'chat'
  };
  var SIZES = { 'default': '14px', 'large': '16px', 'extra-large': '18px' };
  var SIZE_LABEL = { 'default': 'Normal', 'large': 'Groß', 'extra-large': 'Sehr groß' };
  var logoData = null;
  var popTimer = null;
  var popKey = '';

  function hex(v) {
    v = String(v || '').trim();
    if (v[0] !== '#') v = '#' + v;
    if (/^#[0-9a-f]{3}$/i.test(v)) v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    return /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : null;
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
    return {
      botName: $('cfg-bot').value.trim() || DEFAULTS.botName,
      title: $('cfg-title').value.trim(),
      fabText: $('cfg-fab').value.trim(),
      theme: hex($('cfg-theme-hex').value) || hex($('cfg-theme').value),
      accent: hex($('cfg-accent-hex').value) || hex($('cfg-accent').value),
      greet: $('cfg-greet').value.trim(),
      popupOn: $('cfg-popup-on').checked,
      popup: $('cfg-popup').value.trim(),
      delay: +$('cfg-delay').value,
      size: radio('size'),
      mode: radio('mode')
    };
  }

  function render() {
    var s = state();
    pv.style.setProperty('--theme', s.theme);
    pv.style.setProperty('--accent', s.accent);
    pv.style.setProperty('--fs', SIZES[s.size] || SIZES['default']);

    $('pv-title').textContent = s.title || s.botName;
    $('pv-fab-text').textContent = s.fabText || 'Need support?';
    $('pv-pop-name').textContent = s.botName;
    $('pv-greet').textContent = s.greet || DEFAULTS.greet;
    $('pv-greet').hidden = false;
    $('pv-tabs').hidden = s.mode !== 'both';

    var logo = $('pv-logo'), fabLogo = $('pv-fab-logo');
    logo.hidden = fabLogo.hidden = !logoData;
    $('pv-fab-icon').style.display = logoData ? 'none' : '';
    if (logoData) { logo.src = logoData; fabLogo.src = logoData; }
    $('cfg-logo-reset').hidden = !logoData;

    $('cfg-contrast').hidden = luminance(s.theme) < 0.45;
    $('cfg-popup-fields').hidden = !s.popupOn;
    $('cfg-delay-out').textContent = s.delay;

    form.querySelectorAll('.cfg-presets button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-theme') === s.theme && b.getAttribute('data-accent') === s.accent ? 'true' : 'false');
    });

    schedulePopup(s);
    if (!$('fconfig').disabled) attach();
  }

  // Popup erscheint wie bei Retell nur, wenn das Fenster zu ist, nach der eingestellten Zeit.
  function schedulePopup(s) {
    var key = [s.popupOn, s.popup, s.delay, s.botName].join('|');
    var pop = $('pv-pop');
    if (!s.popupOn || !s.popup || !$('pv-win').hidden) { clearTimeout(popTimer); pop.hidden = true; popKey = ''; return; }
    $('pv-pop-text').textContent = s.popup;
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

  // Farbfelder und Hex-Eingabe synchron halten
  [['cfg-theme', 'cfg-theme-hex'], ['cfg-accent', 'cfg-accent-hex']].forEach(function (p) {
    var picker = $(p[0]), text = $(p[1]);
    picker.addEventListener('input', function () { text.value = picker.value.toUpperCase(); text.removeAttribute('aria-invalid'); render(); });
    text.addEventListener('input', function () {
      var v = hex(text.value);
      text.setAttribute('aria-invalid', v ? 'false' : 'true');
      if (v) { picker.value = v.toLowerCase(); render(); }
    });
    text.addEventListener('blur', function () { text.value = picker.value.toUpperCase(); text.removeAttribute('aria-invalid'); });
  });
  form.querySelectorAll('.cfg-presets button').forEach(function (b) {
    b.addEventListener('click', function () {
      setColor('theme', b.getAttribute('data-theme'));
      setColor('accent', b.getAttribute('data-accent'));
      render();
    });
  });
  function setColor(which, v) { $('cfg-' + which).value = v.toLowerCase(); $('cfg-' + which + '-hex').value = v.toUpperCase(); }

  form.addEventListener('input', function (e) { if (!/^cfg-(theme|accent)/.test(e.target.id || '')) render(); });
  form.addEventListener('change', function (e) { if (e.target.type === 'radio' || e.target.type === 'checkbox') render(); });

  // Logo nur lokal als Vorschau
  $('cfg-logo').addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { alert('Bitte ein Logo unter 2 MB wählen.'); this.value = ''; return; }
    var r = new FileReader();
    r.onload = function () { logoData = r.result; render(); };
    r.readAsDataURL(f);
  });
  $('cfg-logo-reset').addEventListener('click', function () { logoData = null; $('cfg-logo').value = ''; render(); });

  $('cfg-reset').addEventListener('click', function () {
    $('cfg-bot').value = DEFAULTS.botName;
    $('cfg-title').value = DEFAULTS.title;
    $('cfg-fab').value = DEFAULTS.fabText;
    setColor('theme', DEFAULTS.theme);
    setColor('accent', DEFAULTS.accent);
    $('cfg-greet').value = DEFAULTS.greet;
    $('cfg-popup-on').checked = DEFAULTS.popupOn;
    $('cfg-popup').value = DEFAULTS.popup;
    $('cfg-delay').value = DEFAULTS.delay;
    form.querySelector('input[name="size"][value="default"]').checked = true;
    form.querySelector('input[name="mode"][value="chat"]').checked = true;
    logoData = null; $('cfg-logo').value = '';
    render();
  });

  // Konfiguration ans Kontaktformular hängen
  function summary() {
    var s = state();
    return [
      'Bot-Name: ' + s.botName,
      'Titel: ' + (s.title || s.botName),
      'Logo: ' + (logoData ? 'ja (wird per E-Mail nachgereicht)' : 'nein'),
      'Button-Text: ' + (s.fabText || '(Standard)'),
      'Hauptfarbe: ' + s.theme,
      'Akzentfarbe: ' + s.accent,
      'Erste Nachricht: ' + (s.greet || DEFAULTS.greet),
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
    $('cfg-attached-logo').hidden = !logoData;
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
