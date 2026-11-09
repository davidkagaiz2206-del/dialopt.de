/*!
 * Dialopt Chat – Einbau-Skript (v1)
 * Lädt den KI-Assistenten (Retell AI) erst nach ausdrücklichem Klick.
 * Vorher werden keine Daten an Retell AI oder Google übertragen,
 * es werden keine Cookies gesetzt und nichts im Browser gespeichert.
 *
 * Einbau (eine Zeile vor </body>):
 * <script src="https://dialopt.de/embed/chat.js" defer
 *   data-public-key="public_key_…" data-agent-id="agent_…"
 *   data-company="Muster GmbH" data-privacy-url="/datenschutz#ki-assistent"></script>
 */
(function () {
  'use strict';
  if (window.DialoptChat) return;

  var me = document.currentScript || document.querySelector('script[src*="/embed/chat.js"]');
  if (!me) return;
  function opt(name, fallback) { var v = me.getAttribute('data-' + name); return v === null || v === '' ? fallback : v; }

  var cfg = {
    publicKey: opt('public-key', ''),
    agentId: opt('agent-id', ''),
    company: opt('company', 'uns'),
    botName: opt('bot-name', 'KI-Assistent'),
    title: opt('title', null),
    color: opt('color', '#0057B8'),
    themeColor: opt('theme-color', '#0A1628'),
    buttonText: opt('button-text', 'Haben Sie Fragen?'),
    privacyUrl: opt('privacy-url', ''),
    position: opt('position', 'right') === 'left' ? 'left' : 'right',
    logoUrl: opt('logo-url', null),
    whiteLabel: opt('white-label', null)
  };
  cfg.title = cfg.title || cfg.botName;

  if (!cfg.publicKey || !cfg.agentId) {
    console.warn('Dialopt Chat: data-public-key und data-agent-id sind erforderlich.');
    return;
  }

  var KEY = 'dialopt_chat_ok:' + cfg.agentId;
  function allowed() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function remember() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }

  function loadRetell(open) {
    if (document.getElementById('retell-widget')) return;
    var s = document.createElement('script');
    s.id = 'retell-widget';
    s.type = 'module';
    s.src = 'https://dashboard.retellai.com/retell-widget-v2.js';
    var a = {
      'data-public-key': cfg.publicKey,
      'data-agent-id': cfg.agentId,
      'data-title': cfg.title,
      'data-bot-name': cfg.botName,
      'data-fab-text': cfg.buttonText,
      'data-theme-color': cfg.themeColor,
      'data-component-color': cfg.color,
      'data-show-ai-popup': 'false',
      'data-auto-open': open ? 'true' : 'false'
    };
    if (cfg.logoUrl) a['data-logo-url'] = cfg.logoUrl;
    if (cfg.whiteLabel) a['data-white-label'] = cfg.whiteLabel;
    Object.keys(a).forEach(function (k) { s.setAttribute(k, a[k]); });
    document.body.appendChild(s);
    fitRetell();
  }

  // Retell setzt das Chatfenster am PC auf feste 570px Höhe; bei niedrigen
  // Browserfenstern wird es oben abgeschnitten. Höhe an den sichtbaren Bereich anpassen.
  var FIT_CSS = '[class*="_windowChat_"],[class*="_windowVoice_"],[class*="_windowChooser_"]{' +
    'max-height:calc(100vh - 108px)!important;max-height:calc(100dvh - 108px)!important}' +
    'img[class*="_chatHeader_"]{height:25px!important;max-width:160px}';
  // Blauton aus der Kundenfarbe: Kopfbereich getönt, Nachrichten und Eingabe bleiben weiß
  function tintCss() {
    var c = cfg.color;
    return '[class*="_innerShell_"]{background:color-mix(in srgb,' + c + ' 10%,#fff)!important}' +
      '[class*="_header_"]{background:color-mix(in srgb,' + c + ' 10%,#fff);border-bottom:1px solid color-mix(in srgb,' + c + ' 20%,#fff);padding-bottom:6px!important}' +
      '[class*="_closeButton_"]{background:#fff!important;color:' + c + '!important}' +
      '[class*="_closeButton_"]:hover,[class*="_navButton_"]:hover{background:color-mix(in srgb,' + c + ' 20%,#fff)!important}' +
      '[class*="_messages_"],[class*="_inputRow_"]{background:#fff!important}' +
      '[class*="_inputShell_"]{border-color:color-mix(in srgb,' + c + ' 25%,#fff)!important}' +
      '[class*="_agent_"]{background:color-mix(in srgb,' + c + ' 10%,#fff)!important}' +
      '[class*="_user_"]{background:' + c + '!important;color:#fff!important}';
  }
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
          st.textContent = FIT_CSS + tintCss();
          h.shadowRoot.appendChild(st);
          clearInterval(t);
        }
      });
      if (tries > 60) clearInterval(t);
    }, 250);
  }

  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var host = null;

  function buildGate() {
    host = document.createElement('div');
    host.setAttribute('data-dialopt-chat', '');
    host.style.cssText = 'position:fixed;bottom:20px;' + cfg.position + ':20px;z-index:2147483000;';
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var side = cfg.position;
    root.innerHTML =
      '<style>' +
      ':host{all:initial}' +
      '*{box-sizing:border-box;margin:0;padding:0}' +
      '.wrap{display:flex;flex-direction:column;align-items:' + (side === 'left' ? 'flex-start' : 'flex-end') + ';gap:12px;font:400 15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#0A1628;-webkit-font-smoothing:antialiased}' +
      '.fab{display:inline-flex;align-items:center;gap:10px;height:52px;padding:0 20px 0 16px;border:0;border-radius:999px;background:' + esc(cfg.themeColor) + ';color:#fff;font-weight:600;font-size:15px;line-height:1;font-family:inherit;cursor:pointer;box-shadow:0 2px 4px rgba(6,14,26,.12),0 12px 28px -10px rgba(6,14,26,.45);transition:filter .2s,transform .2s}' +
      '.fab:hover{filter:brightness(1.25)}.fab:active{transform:translateY(1px)}' +
      '.fab svg{width:22px;height:22px;flex:none}' +
      '.card{position:relative;width:min(340px,calc(100vw - 40px));background:#fff;border:1px solid #d9e1ea;border-radius:12px;padding:22px 22px 18px;box-shadow:0 2px 4px rgba(6,14,26,.06),0 20px 44px -16px rgba(6,14,26,.35)}' +
      '.card[hidden]{display:none}' +
      '.t{font-weight:600;font-size:16px;margin:0 30px 8px 0}' +
      '.card p{color:#475569;font-size:14.5px}' +
      '.go{display:block;width:100%;min-height:46px;margin-top:16px;border:0;border-radius:6px;background:' + esc(cfg.color) + ';color:#fff;font-weight:600;font-size:15px;line-height:1;font-family:inherit;cursor:pointer;transition:filter .2s}' +
      '.go:hover{filter:brightness(1.12)}' +
      '.pl{display:inline-block;margin-top:12px;font-size:13px;color:#64748b;text-underline-offset:3px}.pl:hover{color:#0A1628}' +
      '.x{position:absolute;top:12px;right:12px;width:32px;height:32px;border:0;border-radius:6px;background:transparent;color:#64748b;cursor:pointer;display:grid;place-items:center}' +
      '.x:hover{background:#f1f5f9;color:#0A1628}.x svg{width:18px;height:18px}' +
      'button:focus-visible,a:focus-visible{outline:2px solid ' + esc(cfg.color) + ';outline-offset:3px}' +
      '@media (max-width:520px){.fab span{display:none}.fab{width:52px;padding:0;justify-content:center}}' +
      '</style>' +
      '<div class="wrap">' +
        '<div class="card" id="c" role="dialog" aria-labelledby="ct" hidden>' +
          '<button class="x" type="button" aria-label="Schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
          '<p class="t" id="ct">' + esc(cfg.botName) + '</p>' +
          '<p>Unser KI-Assistent beantwortet Ihre Fragen rund um die Uhr. Mit dem Start des Chats werden Daten an Retell AI (USA) übertragen und eine Schriftart von Google geladen.</p>' +
          '<button class="go" type="button">Chat starten</button>' +
          (cfg.privacyUrl ? '<a class="pl" href="' + esc(cfg.privacyUrl) + '">Mehr in der Datenschutzerklärung</a>' : '') +
        '</div>' +
        '<button class="fab" type="button" aria-expanded="false" aria-controls="c">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v10H10l-4.5 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>' +
          '<span>' + esc(cfg.buttonText) + '</span>' +
        '</button>' +
      '</div>';
    document.body.appendChild(host);

    var fab = root.querySelector('.fab');
    var card = root.querySelector('.card');
    function toggle(open) {
      card.hidden = !open;
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) root.querySelector('.go').focus();
    }
    fab.addEventListener('click', function () { toggle(card.hidden); });
    root.querySelector('.x').addEventListener('click', function () { toggle(false); fab.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !card.hidden) { toggle(false); fab.focus(); } });
    root.querySelector('.go').addEventListener('click', function () {
      remember();
      host.remove();
      loadRetell(true);
    });
  }

  function revoke() {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k === KEY || k.indexOf('LS_CHAT') === 0 || k.indexOf('retell') === 0) localStorage.removeItem(k);
      });
    } catch (e) {}
    location.reload();
  }

  window.DialoptChat = { revoke: revoke, open: function () { remember(); if (host) host.remove(); loadRetell(true); } };

  function init() {
    document.querySelectorAll('[data-dialopt-chat-revoke]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); revoke(); });
    });
    if (allowed()) loadRetell(false); else buildGate();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
