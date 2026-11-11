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

  // Preise: monatlich / jährlich umschalten
  document.querySelectorAll('.billing').forEach(function (group) {
    var section = group.closest('section') || document.body;
    group.querySelectorAll('.billing-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        var yearly = b.getAttribute('data-billing') === 'year';
        section.classList.toggle('yearly', yearly);
        group.querySelectorAll('.billing-opt').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      });
    });
  });

  // Kontaktformular: Anliegen (Test oder Demo) je nach geklicktem Button vorwählen
  var intents = document.querySelectorAll('input[name="anliegen"]');
  if (intents.length) {
    var submitLabel = document.querySelector('#contact-form .submit-label');
    var syncLabel = function () {
      var on = document.querySelector('input[name="anliegen"]:checked');
      if (on && submitLabel) submitLabel.textContent = on.getAttribute('data-submit');
    };
    intents.forEach(function (r) { r.addEventListener('change', syncLabel); });
    document.querySelectorAll('[data-intent]').forEach(function (a) {
      a.addEventListener('click', function () {
        var r = document.querySelector('input[name="anliegen"][data-key="' + a.getAttribute('data-intent') + '"]');
        if (r) { r.checked = true; syncLabel(); }
      });
    });
    syncLabel();
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
      'data-title': 'Dialo',
      'data-bot-name': 'Dialo',
      'data-logo-url': 'https://dialopt.de/dialo-logo.svg',
      'data-fab-text': 'Haben Sie Fragen?',
      'data-theme-color': '#0A1628',
      'data-component-color': '#0057B8',
      'data-show-ai-popup': 'false',
      'data-auto-open': open ? 'true' : 'false'
    };
    Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.body.appendChild(s);
    fitRetell();
  }

  // Retell setzt das Chatfenster am PC auf feste 570px Höhe; bei niedrigen
  // Browserfenstern wird es oben abgeschnitten. Höhe an den sichtbaren Bereich anpassen.
  var FIT_CSS = '[class*="_windowChat_"],[class*="_windowVoice_"],[class*="_windowChooser_"]{' +
    'max-height:calc(100vh - 108px)!important;max-height:calc(100dvh - 108px)!important}' +
    'img[class*="_chatHeader_"]{height:25px!important;max-width:160px}' +
    // Blauton: Kopfbereich hellblau, Nachrichten und Eingabe bleiben weiß
    '[class*="_innerShell_"]{background:#e8f1fc!important}' +
    '[class*="_header_"]{background:#e8f1fc;border-bottom:1px solid #d3e3f7;padding-bottom:6px!important}' +
    '[class*="_closeButton_"]{background:#fff!important;color:#0057B8!important}' +
    '[class*="_closeButton_"]:hover,[class*="_navButton_"]:hover{background:#d3e3f7!important;color:#0A1628!important}' +
    '[class*="_messages_"],[class*="_inputRow_"]{background:#fff!important}' +
    '[class*="_inputShell_"]{border-color:#c5d8f0!important}' +
    '[class*="_agent_"]{background:#e8f1fc!important;color:#0A1628!important}' +
    '[class*="_user_"]{background:#0057B8!important;color:#fff!important}' +
    // Links in Bot-Antworten (siehe linkifyChat)
    '.dl-md{font-size:0!important}.dl-md>a,.dl-md>br{display:none!important}' +
    '.dl-msg a{color:#0057B8;font-weight:600;text-decoration:underline;text-underline-offset:3px;cursor:pointer}';
  function fitRetell() {
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      var root = document.getElementById('retell-widget-root');
      var hosts = root ? [root].concat([].slice.call(root.querySelectorAll('*'))) : [];
      hosts.forEach(function (h) {
        if (h.shadowRoot && !h.shadowRoot.querySelector('style[data-dialopt-fit]')) {
          var st = document.createElement('style');
          st.setAttribute('data-dialopt-fit', '');
          st.textContent = FIT_CSS;
          h.shadowRoot.appendChild(st);
          linkifyChat(h.shadowRoot);
          clearInterval(t);
        }
      });
      if (tries > 60) clearInterval(t);
    }, 250);
  }

  // Retell zeigt Markdown-Links als Rohtext ("[hier](https://…)") und öffnet
  // jede URL in einem neuen Tab. Hier werden Bot-Antworten neu dargestellt:
  // [Preise](https://dialopt.de/telefonassistent#pricing) wird zum Link "Preise".
  // Links auf dialopt.de öffnen im selben Tab und scrollen zur Stelle.
  // Retells eigene Knoten bleiben unangetastet (nur per CSS ausgeblendet).
  var MD_LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]*[^\s<.,;:!?)\]])/g;
  function cleanPath(p) { return p.replace(/\/index\.html$/, '/').replace(/\.html$/, ''); }
  function samePath(a, b) { return cleanPath(a) === cleanPath(b); }
  function ownSite(u) { var h = u.host.replace(/^www\./, ''); return h === 'dialopt.de' || u.host === location.host; }
  function chatLink(text, href, shadow) {
    var u;
    try { u = new URL(href); } catch (e) { return document.createTextNode(text); }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return document.createTextNode(text);
    var a = document.createElement('a');
    a.textContent = text;
    if (!ownSite(u)) {
      a.href = u.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      return a;
    }
    a.href = u.pathname + u.search + u.hash;
    a.addEventListener('click', function (e) {
      var target = u.hash && document.getElementById(decodeURIComponent(u.hash.slice(1)));
      if (!samePath(u.pathname, location.pathname) || !target) return; // normale Navigation im selben Tab
      e.preventDefault();
      if (window.innerWidth < 640) { // am Handy verdeckt das Chatfenster die Seite
        var close = shadow.querySelector('[class*="_closeButton_"]');
        if (close) close.click();
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', u.hash);
    });
    return a;
  }
  function rawText(msg) {
    var out = '';
    msg.childNodes.forEach(function (n) {
      if (n.nodeType === 1 && n.classList.contains('dl-msg')) return;
      out += n.nodeName === 'BR' ? '\n' : n.textContent;
    });
    return out;
  }
  function renderMsg(msg, shadow) {
    var raw = rawText(msg);
    if (msg._dlRaw === raw) return;
    msg._dlRaw = raw;
    var old = msg.querySelector(':scope > .dl-msg');
    MD_LINK.lastIndex = 0;
    if (!MD_LINK.test(raw)) {
      if (old) old.remove();
      msg.classList.remove('dl-md');
      return;
    }
    if (!old) {
      var cs = getComputedStyle(msg);
      old = document.createElement('span');
      old.className = 'dl-msg';
      old.style.fontSize = cs.fontSize;
      old.style.lineHeight = cs.lineHeight;
      old.style.whiteSpace = 'pre-wrap';
    }
    old.textContent = '';
    var last = 0, m;
    MD_LINK.lastIndex = 0;
    while ((m = MD_LINK.exec(raw))) {
      if (m.index > last) old.appendChild(document.createTextNode(raw.slice(last, m.index)));
      old.appendChild(m[1] ? chatLink(m[1], m[2], shadow) : chatLink(m[3], m[3], shadow));
      last = MD_LINK.lastIndex;
    }
    if (last < raw.length) old.appendChild(document.createTextNode(raw.slice(last)));
    msg.classList.add('dl-md');
    msg.appendChild(old);
  }
  function linkifyChat(shadow) {
    var queued = false;
    function run() {
      queued = false;
      shadow.querySelectorAll('[class*="_message_"][class*="_agent_"]').forEach(function (msg) { renderMsg(msg, shadow); });
    }
    new MutationObserver(function () {
      if (!queued) { queued = true; requestAnimationFrame(run); }
    }).observe(shadow, { childList: true, subtree: true, characterData: true });
    run();
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
        '<p class="chat-card-title" id="chat-card-title">Dialo – unser KI-Assistent</p>' +
        '<p>Stellen Sie Ihre Fragen rund um die Uhr. Mit dem Start des Chats werden Daten an Retell AI (USA) übertragen und eine Schriftart von Google geladen.</p>' +
        '<button class="btn btn-primary chat-start" type="button">Chat starten</button>' +
        '<a class="chat-privacy" href="/datenschutz#ki-assistent">Mehr in der Datenschutzerklärung</a>' +
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
