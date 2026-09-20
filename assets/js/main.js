/* ==========================================================================
   BeSpokeHQ — interaction layer
   Progressive enhancement: every section is readable with JS disabled or
   failing. GSAP/Lenis/Vanta are all optional upgrades.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  root.classList.add('js');

  /* ---------- Safety net: never leave content hidden ---------- */
  function unhideAll() {
    root.classList.remove('js');
  }
  window.setTimeout(function () {
    if (!root.classList.contains('is-booted')) unhideAll();
  }, 4000);

  /* ======================================================================
     Curtain
     ====================================================================== */
  var curtain = doc.querySelector('.curtain');
  function lift() {
    if (!curtain) return;
    if (reduce || !window.gsap) { curtain.classList.add('is-done'); return; }
    window.gsap.to(curtain, {
      clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power3.inOut',
      onComplete: function () { curtain.classList.add('is-done'); }
    });
  }

  /* ======================================================================
     Header
     ====================================================================== */
  var hdr = doc.querySelector('.hdr');
  var lastY = window.scrollY;
  var darkZones = [].slice.call(doc.querySelectorAll('[data-dark-zone]'));

  function onScrollHeader() {
    var y = window.scrollY;
    if (!hdr) return;
    hdr.classList.toggle('is-stuck', y > 40);
    if (!doc.body.classList.contains('is-open')) {
      hdr.classList.toggle('is-hidden', y > 520 && y > lastY + 4);
    }
    // Dark-aware header tint
    var mid = hdr.offsetHeight / 2;
    var onDark = darkZones.some(function (z) {
      var r = z.getBoundingClientRect();
      return r.top <= mid && r.bottom >= mid;
    });
    hdr.classList.toggle('on-dark', onDark);
    lastY = y;
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Mobile drawer ---------- */
  var burger = doc.querySelector('.burger');
  var drawer = doc.querySelector('.drawer');
  function setDrawer(open) {
    doc.body.classList.toggle('is-open', open);
    if (drawer) drawer.classList.toggle('is-open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    doc.body.style.overflow = open ? 'hidden' : '';
    if (drawer && open) {
      [].slice.call(drawer.querySelectorAll('.drawer__nav a')).forEach(function (a, i) {
        a.style.transitionDelay = (0.12 + i * 0.055) + 's';
      });
    }
  }
  if (burger) burger.addEventListener('click', function () {
    setDrawer(!doc.body.classList.contains('is-open'));
  });
  if (drawer) drawer.addEventListener('click', function (e) {
    if (e.target.closest('a')) setDrawer(false);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setDrawer(false);
  });

  /* ======================================================================
     Cursor
     ====================================================================== */
  if (fine && !reduce) {
    var cur = doc.createElement('div');
    cur.className = 'cursor';
    doc.body.appendChild(cur);
    var cx = 0, cy = 0, tx = 0, ty = 0, raf;
    function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!cur.classList.contains('is-on')) cur.classList.add('is-on');
      if (!raf) loop();
    }, { passive: true });
    doc.addEventListener('mouseover', function (e) {
      var hit = e.target.closest('a, button, .hov, input, textarea, select');
      cur.classList.toggle('is-big', !!hit);
    });
  }

  /* ======================================================================
     Text splitting (words wrapped in line masks)
     ====================================================================== */
  function splitWords(el) {
    if (el.dataset.splitDone) return [];
    var words = [];
    var walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var parts = node.nodeValue.split(/(\s+)/);
      var frag = doc.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(' ')); return; }
        var outer = doc.createElement('span');
        outer.className = 'ln';
        var inner = doc.createElement('span');
        inner.className = 'wd';
        inner.textContent = p;
        outer.appendChild(inner);
        frag.appendChild(outer);
        words.push(inner);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.dataset.splitDone = '1';
    return words;
  }

  /* ======================================================================
     Reveals — IntersectionObserver only, so content can never stay hidden
     even if a CDN animation library fails to arrive.
     ====================================================================== */
  function revealAll() {
    [].slice.call(doc.querySelectorAll('[data-reveal], [data-split]')).forEach(function (el) {
      el.classList.add('is-in');
    });
  }

  function initReveals() {
    var items = [].slice.call(doc.querySelectorAll('[data-reveal], [data-split]'));
    if (!items.length) return;

    // Pre-split headlines and give each word its own delay.
    items.forEach(function (el) {
      if (!el.hasAttribute('data-split')) return;
      var words = splitWords(el);
      words.forEach(function (w, i) { w.style.transitionDelay = (i * 0.035) + 's'; });
    });

    if (reduce || !('IntersectionObserver' in window)) { revealAll(); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var group = el.parentNode ? [].slice.call(el.parentNode.children).filter(function (c) {
          return c.hasAttribute && c.hasAttribute('data-reveal');
        }) : [];
        var i = Math.max(0, group.indexOf(el));
        el.style.transitionDelay = (Math.min(i, 6) * 0.08) + 's';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    items.forEach(function (el) { io.observe(el); });

    // Anything already on screen at load goes in immediately.
    requestAnimationFrame(function () {
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    });
  }

  /* ======================================================================
     GSAP-powered scroll work
     ====================================================================== */
  function boot() {
    root.classList.add('is-booted');
    initReveals();

    var gsap = window.gsap;
    var ST = window.ScrollTrigger;
    if (!gsap || !ST) { lift(); return; }
    gsap.registerPlugin(ST);

    /* ---------- Lenis smooth scroll ---------- */
    if (window.Lenis && !reduce) {
      var lenis = new window.Lenis({
        duration: 1.05,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
        touchMultiplier: 1.6
      });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      doc.addEventListener('click', function (e) {
        var a = e.target.closest('a[href^="#"]');
        if (!a) return;
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = doc.querySelector(id);
        if (!t) return;
        e.preventDefault();
        setDrawer(false);
        lenis.scrollTo(t, { offset: -70, duration: 1.2 });
      });
    }

    /* ---------- Scrubbed manifesto type (word-by-word ignition) ---------- */
    if (!reduce) {
      gsap.utils.toArray('[data-scrub]').forEach(function (el) {
        var words = splitWords(el);
        if (!words.length) return;
        gsap.fromTo(words, { opacity: 0.16 }, {
          opacity: 1, ease: 'none', stagger: 1,
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 60%', scrub: 0.6 }
        });
      });
    }

    /* ---------- Parallax ---------- */
    gsap.utils.toArray('[data-parallax]').forEach(function (el) {
      var amt = parseFloat(el.dataset.parallax) || 12;
      gsap.fromTo(el, { yPercent: -amt / 2 }, {
        yPercent: amt / 2, ease: 'none',
        scrollTrigger: { trigger: el.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---------- Counters. The final value is already in the markup, so a
       stalled tween must never be able to leave a wrong number on screen. ---------- */
    if (!reduce) {
      gsap.utils.toArray('[data-count]').forEach(function (el) {
        var end = parseFloat(el.dataset.count);
        if (isNaN(end)) return;
        var obj = { v: 0 };
        var settle = function () { el.textContent = end; };
        gsap.to(obj, {
          v: end, duration: 1.6, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          onUpdate: function () { el.textContent = Math.round(obj.v); },
          onComplete: settle,
          onInterrupt: settle
        });
        setTimeout(settle, 6000);
      });
    }

    /* ---------- Stacking offer cards ---------- */
    var cards = gsap.utils.toArray('.stack .card');
    cards.forEach(function (card, i) {
      if (i === cards.length - 1) return;
      gsap.to(card, {
        scale: 0.94, opacity: 0.55, ease: 'none',
        scrollTrigger: {
          trigger: cards[i + 1], start: 'top bottom', end: 'top top', scrub: true
        }
      });
    });

    /* The industries section used to be a pinned, scroll-hijacked horizontal
       rail here. It's a plain CSS grid now (see sections.css), so there is
       nothing left for JS to drive — every card just sits fully in frame.

       The marquee used to retune its own animation-duration from scroll
       velocity on every scroll tick. Rewriting a running CSS animation's
       duration restarts it in some engines, which is exactly the visible
       "speed change" glitch that was reported, and it forced a style
       recalc on every single scroll frame. The marquee now just runs its
       one constant-speed CSS animation and nothing touches it from JS. */

    ST.refresh();
    lift();
  }

  /* ======================================================================
     Accordion (careers roles)
     ====================================================================== */
  [].slice.call(doc.querySelectorAll('.role__btn')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var role = btn.closest('.role');
      var panel = role.querySelector('.role__panel');
      var open = role.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (window.gsap && !reduce) {
        window.gsap.to(panel, {
          height: open ? 'auto' : 0, duration: 0.55, ease: 'power3.inOut',
          onComplete: function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }
        });
      } else {
        panel.style.height = open ? 'auto' : 0;
      }
    });
  });

  /* ---------- "Apply for this role" prefills the form select ---------- */
  [].slice.call(doc.querySelectorAll('[data-role]')).forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = doc.getElementById('f-role');
      if (!sel) return;
      var want = a.dataset.role.trim();
      [].slice.call(sel.options).forEach(function (o) {
        if (o.text.trim() === want) sel.value = o.value || o.text;
      });
    });
  });

  /* ---------- Placeholder links that still need a destination ---------- */
  var toast;
  [].slice.call(doc.querySelectorAll('[data-portal]')).forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (!toast) {
        toast = doc.createElement('div');
        toast.setAttribute('role', 'status');
        toast.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:130;' +
          'background:#17120F;color:#F8F2E9;padding:.85rem 1.2rem;border-radius:999px;font-size:.875rem;' +
          'box-shadow:0 18px 50px -20px rgba(0,0,0,.6);opacity:0;transition:opacity .35s,transform .35s;';
        doc.body.appendChild(toast);
      }
      toast.textContent = 'Portal link not connected in this build yet.';
      requestAnimationFrame(function () {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(-4px)';
      });
      clearTimeout(toast._t);
      toast._t = setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%)';
      }, 2600);
    });
  });

  /* ======================================================================
     Forms — front-end only. Wire the endpoint in the data-endpoint attribute.
     ====================================================================== */
  [].slice.call(doc.querySelectorAll('form[data-form]')).forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.querySelector('.form__msg');
      var endpoint = form.dataset.endpoint;
      if (!endpoint) {
        if (msg) msg.textContent = 'Demo build: no endpoint connected yet. Data captured locally in the console.';
        console.log('[' + form.dataset.form + ']', Object.fromEntries(new FormData(form).entries()));
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      fetch(endpoint, { method: 'POST', body: new FormData(form) })
        .then(function (r) {
          if (msg) msg.textContent = r.ok ? 'Thanks. We reply within 48 hours.' : 'Something went wrong. Email us instead.';
          if (r.ok) form.reset();
        })
        .catch(function () { if (msg) msg.textContent = 'Network error. Please try again.'; })
        .finally(function () { if (btn) btn.disabled = false; });
    });
  });

  /* ======================================================================
     Kick off
     ====================================================================== */
  function ready() {
    boot();
  }

  if (doc.readyState === 'complete') ready();
  else window.addEventListener('load', ready);

  // Year stamps
  [].slice.call(doc.querySelectorAll('[data-year]')).forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
