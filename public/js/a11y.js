(function () {
  'use strict';
  var KEY = 'fyp_a11y', ZOOM = [1, 1.1, 1.25, 1.5], LAB = ['100%', '110%', '125%', '150%'];
  var DEF = { size: 0, contrast: 0, gray: 0, links: 0, font: 0, spacing: 0, motion: 0, cursor: 0 };
  var CLS = { contrast: 'a11y-contrast', gray: 'a11y-gray', links: 'a11y-links', font: 'a11y-font', spacing: 'a11y-spacing', motion: 'a11y-motion', cursor: 'a11y-cursor' };
  var OPTS = [['contrast', 'High contrast'], ['gray', 'Grayscale'], ['links', 'Highlight links'], ['font', 'Readable font'], ['spacing', 'Text spacing'], ['motion', 'Stop animations'], ['cursor', 'Large cursor']];
  var root = document.documentElement, S = load(), reading = false, open = false, bar, lastTrigger;
  function load() { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return Object.assign({}, DEF); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function apply() {
    root.style.setProperty('--z', ZOOM[S.size] || 1);
    Object.keys(CLS).forEach(function (k) { root.classList.toggle(CLS[k], !!S[k]); });
    if (!bar) return;
    [].forEach.call(bar.querySelectorAll('[data-k]'), function (b) { b.setAttribute('aria-pressed', S[b.getAttribute('data-k')] ? 'true' : 'false'); });
    bar.querySelector('#a11y-lv').textContent = LAB[S.size];
  }
  apply();
  function triggers() { return document.querySelectorAll('[data-a11y-open]'); }
  function setOpen(v, focusBack) {
    open = v; bar.classList.toggle('open', v);
    [].forEach.call(triggers(), function (t) { t.setAttribute('aria-expanded', v ? 'true' : 'false'); });
    if (v) { var f = bar.querySelector('[data-size="1"]'); setTimeout(function () { f && f.focus(); }, 60); }
    else if (focusBack && lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  }
  function build() {
    if (document.getElementById('a11y-bar')) return;
    var skip = document.createElement('a'); skip.className = 'skip'; skip.href = '#'; skip.textContent = 'Skip to main content';
    skip.addEventListener('click', function (e) { e.preventDefault(); var m = document.querySelector('#view,main') || document.querySelector('.hero,.right,.center .mid'); if (m) { m.setAttribute('tabindex', '-1'); m.focus(); m.scrollIntoView(); } });
    document.body.insertBefore(skip, document.body.firstChild);
    bar = document.createElement('div'); bar.id = 'a11y-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Accessibility tools');
    bar.innerHTML = '<div class="a11y-in"><b class="t"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="4.5" r="2.3"/><path d="M4 8.5l1-1.8 7 1.6 7-1.6 1 1.8-5.5 1.5v3.2l2.3 6.8-1.9.8L12 14.5l-3.9 6.3-1.9-.8L8.5 13.2V10z"/></svg>Accessibility tools</b>'
      + '<div class="a11y-g"><span class="lab">Text size</span><button type="button" class="sq" data-size="-1" aria-label="Decrease text size">A-</button><span id="a11y-lv" aria-live="polite">100%</span><button type="button" class="sq" data-size="1" aria-label="Increase text size">A+</button></div>'
      + '<div class="a11y-g">' + OPTS.map(function (o) { return '<button type="button" data-k="' + o[0] + '" aria-pressed="false">' + o[1] + '</button>'; }).join('') + '<button type="button" data-read aria-pressed="false">Read page aloud</button></div>'
      + '<div class="a11y-g" style="margin-left:auto"><button type="button" class="rs" data-reset>Reset all</button><button type="button" class="cl" data-x>Close</button></div></div>';
    document.documentElement.appendChild(bar); apply();
    bar.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-x')) return setOpen(false, true);
      if (t.hasAttribute('data-size')) S.size = Math.max(0, Math.min(ZOOM.length - 1, S.size + Number(t.getAttribute('data-size'))));
      else if (t.hasAttribute('data-k')) { var k = t.getAttribute('data-k'); S[k] = S[k] ? 0 : 1; }
      else if (t.hasAttribute('data-reset')) { S = Object.assign({}, DEF); stop(); }
      else if (t.hasAttribute('data-read')) return read(t);
      save(); apply();
    });
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-a11y-open]');
      if (t) { lastTrigger = t; return setOpen(!open, true); }
      if (open && !bar.contains(e.target)) setOpen(false, false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false, true); });
    window.addEventListener('hashchange', stop);
  }
  function text() {
    var el = document.querySelector('#view,main'); if (el) return el.innerText;
    return [].filter.call(document.body.children, function (n) { return !n.classList.contains('skip') && n.tagName !== 'SCRIPT'; }).map(function (n) { return n.innerText; }).join(' ');
  }
  function stop() { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { } reading = false; var b = bar && bar.querySelector('[data-read]'); if (b) { b.setAttribute('aria-pressed', 'false'); b.textContent = 'Read page aloud'; } }
  function read(b) {
    if (!('speechSynthesis' in window)) { b.textContent = 'Reading aloud is not supported'; return; }
    if (reading) return stop();
    var parts = (text().replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*/g) || []); if (!parts.length) return;
    reading = true; b.setAttribute('aria-pressed', 'true'); b.textContent = 'Stop reading';
    parts.forEach(function (c, i) { var u = new SpeechSynthesisUtterance(c.trim()); u.lang = root.lang || 'en'; if (i === parts.length - 1) u.onend = stop; speechSynthesis.speak(u); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
