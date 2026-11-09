/* Dialopt – gemeinsames Skript */
(function () {
  // Mobile Navigation
  var bar = document.querySelector('.topbar');
  var btn = document.querySelector('.menu-btn');
  if (bar && btn) {
    btn.addEventListener('click', function () {
      var open = bar.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    bar.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        bar.classList.remove('menu-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Kontaktformular (Formspree)
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var err = document.getElementById('form-error');
      var submit = form.querySelector('button[type="submit"]');
      var label = submit.innerHTML;
      err.classList.remove('visible');

      var name = form.querySelector('#fname').value.trim();
      var email = form.querySelector('#femail').value.trim();
      if (!name || !email) {
        err.textContent = 'Bitte geben Sie Ihren Namen und Ihre E-Mail-Adresse an.';
        err.classList.add('visible');
        return;
      }

      submit.disabled = true;
      submit.innerHTML = '<span class="spin" aria-hidden="true"></span> Wird gesendet …';
      var data = new FormData(form);
      data.set('_replyto', email);

      try {
        var res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error();
        form.hidden = true;
        var ok = document.getElementById('form-success');
        ok.classList.add('visible');
        ok.focus();
      } catch (x) {
        err.textContent = 'Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt per E-Mail.';
        err.classList.add('visible');
        submit.disabled = false;
        submit.innerHTML = label;
      }
    });
  }

  // KI-Assistent (Retell): wird erst nach ausdrücklichem Klick geladen.
  // Vorher gehen keine Daten an Retell AI oder Google.
  var CHAT_KEY = 'dialopt_chat_ok';
  function chatAllowed() { try { return localStorage.getItem(CHAT_KEY) === '1'; } catch (e) { return false; } }

  function loadRetell(open) {
    if (document.getElementById('retell-widget')) return;
    var s = document.createElement('script');
    s.id = 'retell-widget';
    s.type = 'module';
    s.src = 'https://dashboard.retellai.com/retell-widget-v2.js';
    var attrs = {
      'data-public-key': 'public_key_691222a80b49380157843',
      'data-agent-id': 'agent_f86b295db73d6d6cc8081d907c',
      'data-title': 'Dialopt AI',
      'data-bot-name': 'Dialopt AI',
      'data-fab-text': 'Haben Sie Fragen?',
      'data-theme-color': '#0A1628',
      'data-component-color': '#0057B8',
      'data-show-ai-popup': 'false',
      'data-auto-open': open ? 'true' : 'false'
    };
    Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.body.appendChild(s);
  }

  var revoke = document.querySelector('[data-chat-revoke]');
  if (revoke) {
    revoke.addEventListener('click', function () {
      try {
        Object.keys(localStorage).forEach(function (k) {
          if (k === CHAT_KEY || k.indexOf('LS_CHAT') === 0 || k.indexOf('retell') === 0) localStorage.removeItem(k);
        });
      } catch (e) {}
      revoke.textContent = 'Einwilligung widerrufen – Seite wird neu geladen …';
      setTimeout(function () { location.reload(); }, 800);
    });
  }

  if (chatAllowed()) {
    loadRetell(false);
  } else {
    var wrap = document.createElement('div');
    wrap.className = 'chat-gate';
    wrap.innerHTML =
      '<div class="chat-card" id="chat-card" role="dialog" aria-labelledby="chat-card-title" hidden>' +
        '<button class="chat-x" type="button" aria-label="Schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<p class="chat-card-title" id="chat-card-title">Dialopt AI – unser KI-Assistent</p>' +
        '<p>Stellen Sie Ihre Fragen rund um die Uhr. Mit dem Start des Chats werden Daten an Retell AI (USA) übertragen und eine Schriftart von Google geladen.</p>' +
        '<button class="btn btn-primary chat-start" type="button">Chat starten</button>' +
        '<a class="chat-privacy" href="/datenschutz.html#ki-assistent">Mehr in der Datenschutzerklärung</a>' +
      '</div>' +
      '<button class="chat-fab" type="button" aria-expanded="false" aria-controls="chat-card">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v10H10l-4.5 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>' +
        '<span>Haben Sie Fragen?</span>' +
      '</button>';
    document.body.appendChild(wrap);

    var fab = wrap.querySelector('.chat-fab');
    var card = wrap.querySelector('.chat-card');
    function toggle(open) {
      card.hidden = !open;
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) wrap.querySelector('.chat-start').focus();
    }
    fab.addEventListener('click', function () { toggle(card.hidden); });
    wrap.querySelector('.chat-x').addEventListener('click', function () { toggle(false); fab.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !card.hidden) { toggle(false); fab.focus(); } });
    wrap.querySelector('.chat-start').addEventListener('click', function () {
      try { localStorage.setItem(CHAT_KEY, '1'); } catch (e) {}
      wrap.remove();
      loadRetell(true);
    });
  }
})();
