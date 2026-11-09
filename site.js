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
})();
