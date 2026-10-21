/* Ahmed Abolfadl, portfolio: page behaviour and the four app demos. No libraries. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function store(key, value) {
    try {
      if (value === undefined) return JSON.parse(localStorage.getItem(key));
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { return null; }
  }

  // Calls onIn / onOut as an element enters or leaves the screen.
  function watch(el, onIn, onOut, threshold) {
    if (!('IntersectionObserver' in window)) { onIn(); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) onIn(); else if (onOut) onOut(); });
    }, { threshold: threshold || 0 }).observe(el);
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------------- page ---------------- */

  // Reveal on scroll.
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        revealer.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal').forEach(function (el, i) {
      // A small stagger for siblings that reveal together.
      var sibs = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.transitionDelay = Math.min(sibs, 5) * 70 + 'ms';
      revealer.observe(el);
    });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // Nav background once the page scrolls.
  var nav = $('[data-nav]');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Count-up numbers.
  $$('[data-count]').forEach(function (el) {
    var target = +el.getAttribute('data-count');
    var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
    if (reduceMotion || target === 0) { el.textContent = fmt(target); return; }
    el.textContent = '0';
    var done = false;
    watch(el, function () {
      if (done) return; done = true;
      var start = performance.now(), dur = 1400 + Math.min(target, 3000) / 6;
      (function tick(now) {
        var p = Math.min(1, (now - start) / dur);
        el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }, null, 0.6);
  });

  // Hero phones lean towards the pointer.
  var stage = $('[data-stage]');
  if (stage && finePointer && !reduceMotion) {
    var inner = $('.stage-inner', stage), raf = 0;
    window.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
        inner.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
        inner.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
      });
    }, { passive: true });
  }

  // Spotlight that follows the cursor across cards.
  if (finePointer) {
    $$('.spot').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // App switcher: highlight the app currently on screen.
  var switchLinks = $$('[data-switcher] a');
  if ('IntersectionObserver' in window) {
    var appObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        switchLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-for') === e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.app').forEach(function (a) { appObs.observe(a); });
  }

  // App Store screenshots: the headline on each one doubles as its alt text.
  var SHOTS = {
    cents: ['Your money, finally clear.', 'Your bank texts. Cents logs it.', 'Log an expense in 3 taps.', 'Budgets that start on payday.', 'See where every pound went.', 'Watch your net worth grow.', 'Gam3eya and gold, tracked properly.', 'Pay off debt sooner.', 'Know when you’ll get there.', 'Free forever. Private always.'],
    lckdin: ['Track every set. Own every byte.', 'See what you’ve been skipping.', 'Every PR, found for you.', 'Six proven splits, ready to go.', 'Log it the way you really train.', 'Rest and intervals, built in.', 'Serious analytics. 72 of them free.', '283 exercises, with demo clips.', 'Track your body. Keep it private.', 'No account. No signal needed.'],
    pico: ['Three puzzles a day. Free forever.', 'Crosswords in five sizes.', 'Guess the word. 4 to 11 letters.', 'Sudoku from Easy to Evil.', '18 fresh puzzles. Every day.', 'Notes that clean themselves.', 'Stuck? Check your work.', 'One puzzle a day. Watch it add up.', 'Comfortable for every pair of eyes.', 'No account. No Wi-Fi needed.'],
    trivial: ['Trivia, four ways. Free, properly.', 'Beat the clock. Beat your best.', 'No clock. Three strikes.', 'Trivia night with one phone.', 'Host your own game show.', '53 topics. Play what you love.', 'Find the topic that trips you up.', 'Never see a topic you hate again.', 'No signal? Still playing.', 'No account. Nothing collected.']
  };
  function shotImg(app, i, lazy) {
    var img = document.createElement('img');
    var n = (i < 9 ? '0' : '') + (i + 1);
    img.src = 'assets/img/store/' + app + '/' + n + '.webp';
    img.width = 420; img.height = 913;
    img.alt = lazy === false ? '' : SHOTS[app][i];
    img.loading = 'lazy'; img.decoding = 'async';
    return img;
  }
  $$('[data-shots]').forEach(function (row) {
    var app = row.getAttribute('data-shots');
    SHOTS[app].forEach(function (_, i) { row.appendChild(shotImg(app, i)); });
    var wrap = row.closest('.shots-wrap');
    var step = function () { return row.clientWidth * 0.8; };
    $('[data-shots-prev]', wrap).addEventListener('click', function () { row.scrollBy({ left: -step(), behavior: 'smooth' }); });
    $('[data-shots-next]', wrap).addEventListener('click', function () { row.scrollBy({ left: step(), behavior: 'smooth' }); });
  });

  // Marquee: two rows mixing all four apps, each row written twice so the loop is seamless.
  var marquee = $('[data-marquee]');
  if (marquee) {
    var apps = ['cents', 'lckdin', 'pico', 'trivial'];
    var rows = [[], []];
    for (var i = 0; i < 10; i++) apps.forEach(function (app, k) { rows[(i + k) % 2].push([app, i]); });
    $$('.marquee-row', marquee).forEach(function (row, r) {
      var items = rows[r];
      for (var pass = 0; pass < 2; pass++) items.forEach(function (it) { row.appendChild(shotImg(it[0], it[1], false)); });
    });
  }

  // Feature filter.
  var capsFilter = $('[data-caps-filter]');
  if (capsFilter) {
    var capItems = $$('[data-caps] li');
    capsFilter.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var f = btn.getAttribute('data-f');
      $$('button', capsFilter).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      capItems.forEach(function (li) {
        var hit = f === 'all' || li.getAttribute('data-apps').split(' ').indexOf(f) !== -1;
        li.classList.toggle('dim', !hit);
        li.classList.toggle('hit', hit && f !== 'all');
      });
    });
  }

  // Copy email.
  $$('[data-copy]').forEach(function (btn) {
    var label = $('[data-copy-label]', btn);
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var ok = function () { label.textContent = 'Copied!'; setTimeout(function () { label.textContent = 'Copy email'; }, 1800); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, function () { window.location.href = 'mailto:' + text; });
      else window.location.href = 'mailto:' + text;
    });
  });

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------------- demo: Cents ---------------- */
  (function () {
    var root = $('[data-demo="cents"]');
    if (!root) return;
    var parts = $$('[data-at]', root);
    var timer = 0, step = 0, running = false;
    // How long each step stays on screen before the next one, in ms.
    var holds = [700, 1700, 1500, 1500, 4200];

    function show(n) {
      step = n;
      parts.forEach(function (el) { el.classList.toggle('on', n >= +el.getAttribute('data-at')); });
    }
    function next() {
      timer = setTimeout(function () {
        if (step >= 4) { show(0); next(); return; }
        show(step + 1); next();
      }, holds[step]);
    }
    function play() { clearTimeout(timer); show(0); running = true; next(); }
    function stop() { clearTimeout(timer); running = false; }

    if (reduceMotion) { show(4); }
    else watch(root, function () { if (!running) play(); }, stop, 0.35);
    $('[data-replay]', root).addEventListener('click', function () { reduceMotion ? show(4) : play(); });
  })();

  /* ---------------- demo: Lckdin ---------------- */
  (function () {
    var root = $('[data-demo="lckdin"]');
    if (!root) return;
    var BEST = { kg: 75, reps: 8 };
    var REST = 90;
    var row = $('[data-row]', root), tick = $('[data-tick]', root);
    var kgEl = $('[data-kg-val]', root), repsEl = $('[data-reps-val]', root);
    var toast = $('[data-toast]', root), toastTitle = $('[data-toast-title]', root), toastText = $('[data-toast-text]', root);
    var timerEl = $('[data-timer]', root), timeEl = $('[data-time]', root), ring = $('[data-ring]', root);
    var muscles = $$('[data-m]', root);
    var kg = 80, reps = 8, logged = false, left = 0, interval = 0, toastTimer = 0;
    var e1rm = function (w, r) { return w * (1 + r / 30); };   // Epley estimate

    function render() { kgEl.textContent = kg % 1 ? kg.toFixed(1) : kg; repsEl.textContent = reps; }
    function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    function drawTimer() {
      timeEl.textContent = fmt(Math.max(0, left));
      ring.style.strokeDashoffset = (97.4 * (1 - Math.max(0, left) / REST)).toFixed(1);
    }
    function stopTimer() { clearInterval(interval); interval = 0; timerEl.classList.remove('on'); }
    function startTimer() {
      left = REST; drawTimer(); timerEl.classList.add('on');
      clearInterval(interval);
      interval = setInterval(function () { left--; drawTimer(); if (left <= 0) stopTimer(); }, 1000);
    }
    function say(title, text, record) {
      toastTitle.textContent = title; toastText.textContent = text;
      $('.lk-trophy', toast).textContent = record ? '🏆' : '✓';
      toast.classList.toggle('plain', !record);
      toast.classList.add('on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('on'); }, record ? 4200 : 2600);
    }
    function setLogged(on) {
      logged = on;
      tick.classList.toggle('on', on);
      row.classList.toggle('done', on);
      tick.setAttribute('aria-pressed', String(on));
      muscles.forEach(function (m, i) { setTimeout(function () { m.classList.toggle('on', on); }, on ? 120 * i : 0); });
      if (!on) { toast.classList.remove('on'); stopTimer(); return; }
      if (kg > BEST.kg) say('New personal record', 'Heaviest weight: ' + kg + ' kg (was ' + BEST.kg + ' kg)', true);
      else if (e1rm(kg, reps) > e1rm(BEST.kg, BEST.reps)) say('New personal record', 'Best estimated max: ' + Math.round(e1rm(kg, reps)) + ' kg (was ' + Math.round(e1rm(BEST.kg, BEST.reps)) + ' kg)', true);
      else say('Set logged', kg + ' kg × ' + reps + '. No record this time.', false);
      startTimer();
    }

    root.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-kg') && !logged) { kg = Math.min(300, Math.max(20, kg + 2.5 * +b.getAttribute('data-kg'))); render(); }
      else if (b.hasAttribute('data-reps') && !logged) { reps = Math.min(30, Math.max(1, reps + +b.getAttribute('data-reps'))); render(); }
      else if (b === tick) setLogged(!logged);
      else if (b.hasAttribute('data-rest')) { left = Math.max(1, Math.min(REST, left + +b.getAttribute('data-rest'))); drawTimer(); }
      else if (b.hasAttribute('data-skip')) stopTimer();
      else if (b.hasAttribute('data-reset')) { setLogged(false); kg = 80; reps = 8; render(); }
    });
    render();
  })();

  /* ---------------- demo: Pico (Wordform) ---------------- */
  (function () {
    var root = $('[data-demo="pico"]');
    if (!root || !window.WORDS) return;
    var WORDS = window.WORDS, LEN = 5, TRIES = 6;
    var board = $('[data-board]', root), keysEl = $('[data-keys]', root), msg = $('[data-msg]', root);
    var after = $('[data-after]', root), title = $('[data-wf-title]', root);

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    var now = new Date();
    var dayKey = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    $('[data-wf-date]', root).textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

    // FNV-1a: the same date always gives the same word, on every device.
    function hash(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }
    var daily = WORDS[hash('pico-portfolio:' + dayKey) % WORDS.length];

    var answer, guesses, current, over, isDaily;
    var tiles = [], rowsEl = [], keyEls = {};

    // Board.
    for (var r = 0; r < TRIES; r++) {
      var rowEl = document.createElement('div');
      rowEl.className = 'wf-row'; tiles.push([]);
      for (var c = 0; c < LEN; c++) {
        var t = document.createElement('div');
        t.className = 'wf-tile'; rowEl.appendChild(t); tiles[r].push(t);
      }
      board.appendChild(rowEl); rowsEl.push(rowEl);
    }
    // Keyboard.
    ['QWERTYUIOP', 'ASDFGHJKL', '+ZXCVBNM-'].forEach(function (line) {
      var kr = document.createElement('div');
      kr.className = 'wf-krow';
      line.split('').forEach(function (ch) {
        var k = document.createElement('button');
        k.type = 'button'; k.className = 'wf-key';
        if (ch === '+') { k.textContent = 'Enter'; k.classList.add('wide'); k.setAttribute('data-k', 'ENTER'); }
        else if (ch === '-') { k.textContent = '⌫'; k.classList.add('wide'); k.setAttribute('data-k', 'BACK'); k.setAttribute('aria-label', 'Delete'); }
        else { k.textContent = ch; k.setAttribute('data-k', ch); keyEls[ch] = k; }
        kr.appendChild(k);
      });
      keysEl.appendChild(kr);
    });

    function score(guess) {
      var res = [], counts = {}, i;
      for (i = 0; i < LEN; i++) {
        if (guess[i] === answer[i]) res[i] = 'correct';
        else { res[i] = 'absent'; counts[answer[i]] = (counts[answer[i]] || 0) + 1; }
      }
      for (i = 0; i < LEN; i++) if (res[i] !== 'correct' && counts[guess[i]]) { res[i] = 'present'; counts[guess[i]]--; }
      return res;
    }
    var rank = { absent: 1, present: 2, correct: 3 };
    function paintRow(r, word, animate) {
      var res = score(word);
      res.forEach(function (cls, i) {
        var tile = tiles[r][i];
        tile.textContent = word[i];
        var apply = function () {
          tile.className = 'wf-tile ' + cls;
          var key = keyEls[word[i]];
          var prev = key.getAttribute('data-state');
          if (!prev || rank[cls] > rank[prev]) { key.setAttribute('data-state', cls); key.className = 'wf-key ' + cls; }
        };
        if (animate && !reduceMotion) { tile.style.animationDelay = (i * 120) + 'ms'; setTimeout(apply, i * 120); }
        else { tile.style.animationDelay = '0ms'; apply(); }
      });
      return res.every(function (x) { return x === 'correct'; });
    }
    function drawCurrent() {
      var r = guesses.length;
      for (var i = 0; i < LEN; i++) {
        tiles[r][i].textContent = current[i] || '';
        tiles[r][i].className = 'wf-tile' + (current[i] ? ' filled' : '');
      }
    }
    function finish(won, animate) {
      over = true; after.hidden = false;
      var tries = guesses.length;
      var text = won
        ? (tries === 1 ? 'First try! ' : 'Got it in ' + tries + '. ') + 'Pico has a word like this every day, from 4 to 11 letters.'
        : 'The word was ' + answer + '. Pico gives you a new one every morning.';
      setTimeout(function () { msg.textContent = text; }, animate && !reduceMotion ? 700 : 0);
    }
    function save() { if (isDaily) store('pico-wordform-' + dayKey, guesses); }
    function reset(word, daily) {
      answer = word; isDaily = daily; guesses = []; current = ''; over = false; after.hidden = true;
      title.textContent = daily ? 'Play today’s word' : 'Endless: a new word';
      tiles.forEach(function (row) { row.forEach(function (t) { t.textContent = ''; t.className = 'wf-tile'; t.style.animationDelay = ''; }); });
      Object.keys(keyEls).forEach(function (k) { keyEls[k].className = 'wf-key'; keyEls[k].removeAttribute('data-state'); });
      msg.textContent = 'Guess the 5-letter word in 6 tries.';
    }
    function submit() {
      if (current.length < LEN) {
        msg.textContent = 'Not enough letters';
        var rowEl = rowsEl[guesses.length];
        rowEl.classList.remove('shake'); void rowEl.offsetWidth; rowEl.classList.add('shake');
        return;
      }
      var r = guesses.length, word = current;
      guesses.push(word); current = ''; save();
      var won = paintRow(r, word, true);
      if (won || guesses.length === TRIES) finish(won, true);
      else msg.textContent = (TRIES - guesses.length) + (TRIES - guesses.length === 1 ? ' guess left' : ' guesses left');
    }
    function press(k) {
      if (over) return;
      if (k === 'ENTER') submit();
      else if (k === 'BACK') { current = current.slice(0, -1); drawCurrent(); }
      else if (/^[A-Z]$/.test(k) && current.length < LEN) { current += k; drawCurrent(); }
    }

    // Keep focus off the on-screen keys when they are clicked, so a physical Enter still submits.
    keysEl.addEventListener('mousedown', function (e) { if (e.target.closest('.wf-key')) e.preventDefault(); });
    keysEl.addEventListener('click', function (e) { var k = e.target.closest('[data-k]'); if (k) press(k.getAttribute('data-k')); });

    // Typing goes to the game while it is on screen, or once someone has tapped into it.
    var armed = false;
    watch(root, function () { armed = true; }, function () { armed = false; }, 0.3);
    root.addEventListener('pointerdown', function () { armed = true; });
    document.addEventListener('keydown', function (e) {
      if (!armed || e.ctrlKey || e.metaKey || e.altKey) return;
      var a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return;
      var onControl = a && /^(BUTTON|A|SUMMARY)$/.test(a.tagName);
      if (onControl && (e.key === 'Enter' || e.key === ' ')) return;  // a focused button or link acts as usual
      var k = e.key === 'Enter' ? 'ENTER' : e.key === 'Backspace' ? 'BACK' : e.key.length === 1 ? e.key.toUpperCase() : '';
      if (!k || (k !== 'ENTER' && k !== 'BACK' && !/^[A-Z]$/.test(k))) return;
      // Someone typing into the game: release focus left on a button by an earlier click, so their Enter submits.
      if (onControl) a.blur();
      e.preventDefault(); press(k);
    });

    $('[data-again]', root).addEventListener('click', function () {
      var w; do { w = WORDS[Math.floor(Math.random() * WORDS.length)]; } while (w === answer);
      reset(w, false);
    });

    // Start on today's word, restoring any guesses already made today.
    reset(daily, true);
    var saved = store('pico-wordform-' + dayKey);
    if (Array.isArray(saved)) {
      saved.slice(0, TRIES).forEach(function (w) {
        if (typeof w !== 'string' || w.length !== LEN) return;
        var r = guesses.length; guesses.push(w);
        if (paintRow(r, w, false)) finish(true, false);
      });
      if (!over && guesses.length === TRIES) finish(false, false);
      else if (!over && guesses.length) msg.textContent = (TRIES - guesses.length) + ' guesses left';
    }
  })();

  /* ---------------- demo: Trivial (Blitz) ---------------- */
  (function () {
    var root = $('[data-demo="trivial"]');
    if (!root || !window.TRIVIA) return;
    var ROUND = 30;
    var tv = $('.tv', root), bar = $('[data-bar]', root), clock = $('[data-clock]', root);
    var scoreEl = $('[data-score]', root), qEl = $('[data-q]', root), opts = $('[data-opts]', root);
    var dots = $$('[data-streak] i', root), gain = $('[data-gain]', root);
    var finalEl = $('[data-final]', root), summary = $('[data-summary]', root), newBest = $('[data-new]', root);
    var bestEl = $('[data-best]', root), note = $('[data-tv-note]', root);
    var deck = [], score = 0, streak = 0, right = 0, answered = 0, endsAt = 0, raf = 0, locked = false, gainTimer = 0;

    function showBest() { var b = store('trivial-blitz-best'); bestEl.textContent = b ? 'Best ' + b.toLocaleString('en-US') : ''; }
    function setStreak() { dots.forEach(function (d, i) { d.classList.toggle('on', i < Math.min(streak, 3)); }); }

    function nextQuestion() {
      if (!deck.length) deck = shuffle(window.TRIVIA);
      var q = deck.pop();
      locked = false;
      qEl.textContent = q.q;
      opts.textContent = '';
      shuffle([q.a].concat(q.w)).forEach(function (text) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'tv-opt'; b.textContent = text;
        b.addEventListener('click', function () { answer(b, text === q.a, q); });
        opts.appendChild(b);
      });
    }
    function answer(btn, ok, q) {
      if (locked) return;
      locked = true; answered++;
      $$('.tv-opt', opts).forEach(function (b) { b.disabled = true; if (b.textContent === q.a) b.classList.add('right'); });
      if (ok) {
        right++; streak++;
        var pts = 100 * (q.d + 1) * (streak >= 3 ? 2 : 1);
        score += pts; scoreEl.textContent = score.toLocaleString('en-US');
        gain.textContent = '+' + pts + (streak >= 3 ? ' ×2' : '');
        gain.classList.add('on'); clearTimeout(gainTimer);
        gainTimer = setTimeout(function () { gain.classList.remove('on'); }, 700);
      } else { btn.classList.add('wrong'); streak = 0; }
      setStreak();
      setTimeout(function () { if (tv.getAttribute('data-state') === 'play') nextQuestion(); }, ok ? 550 : 1100);
    }
    function frame() {
      var left = Math.max(0, endsAt - performance.now());
      bar.style.transform = 'scaleX(' + (left / (ROUND * 1000)).toFixed(4) + ')';
      clock.textContent = Math.ceil(left / 1000);
      if (left <= 0) { end(); return; }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      score = 0; streak = 0; right = 0; answered = 0;
      scoreEl.textContent = '0'; setStreak(); gain.classList.remove('on');
      tv.setAttribute('data-state', 'play');
      note.textContent = 'These questions come from Trivial’s own bank of 5,141.';
      nextQuestion();
      endsAt = performance.now() + ROUND * 1000;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      var first = $('.tv-opt', opts); if (first) first.focus({ preventScroll: true });
    }
    function end() {
      cancelAnimationFrame(raf);
      tv.setAttribute('data-state', 'end');
      var best = store('trivial-blitz-best') || 0;
      newBest.hidden = !(score > best && score > 0);
      if (score > best) store('trivial-blitz-best', score);
      finalEl.textContent = score.toLocaleString('en-US');
      summary.textContent = right + ' of ' + answered + ' correct' + (answered ? ' · ' + Math.round(100 * right / answered) + '%' : '');
      note.textContent = 'Round over: ' + score + ' points. The full game has 5,141 questions in 53 topics.';
      showBest();
    }
    $$('[data-start]', root).forEach(function (b) { b.addEventListener('click', start); });
    showBest();
  })();
})();
