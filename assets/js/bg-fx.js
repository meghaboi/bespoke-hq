/* ==========================================================================
   BeSpokeHQ — curtain preloader background (vanilla Canvas2D, no build step)
   Small node/line network, cheap enough to start drawing the instant the
   page boots. The home hero uses VANTA.TOPOLOGY (assets/js/vendor/) below.
   Every other hero/section background is React (AeroShards, Iridescence)
   — see widgets/ and assets/dist/bg-widgets.js.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function Sketch(canvas, draw, setup) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.draw = draw;
    this.setup = setup;
    this.raf = null;
    this.running = false;
    this.w = 0; this.h = 0;
    this.resize();
  }
  Sketch.prototype.resize = function () {
    var rect = this.canvas.parentNode.getBoundingClientRect();
    var d = dpr();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.w * d);
    this.canvas.height = Math.round(this.h * d);
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    if (this.setup) this.setup(this.w, this.h);
  };
  Sketch.prototype.loop = function (now) {
    if (!this.running) return;
    this.draw(this.ctx, this.w, this.h, now);
    this.raf = requestAnimationFrame(this.loop.bind(this));
  };
  Sketch.prototype.start = function () {
    if (this.running || reduce) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.loop.bind(this));
  };
  Sketch.prototype.stop = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  };

  function mount(host, draw, setup) {
    var canvas = doc.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    var sk = new Sketch(canvas, draw, setup);
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { sk.resize(); }).observe(host);
    } else {
      window.addEventListener('resize', function () { sk.resize(); }, { passive: true });
    }
    return sk;
  }

  /* ======================================================================
     PreloaderNet — curtain only. Small node/line network.
     ====================================================================== */
  function preloaderNet(host) {
    var count = 22;
    var nodes = [];
    function seed(w, h) {
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: rand(0, w), y: rand(0, h),
          vx: rand(-14, 14), vy: rand(-14, 14)
        });
      }
    }
    return mount(host, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var dt = 1 / 60;
      nodes.forEach(function (n) {
        n.x += n.vx * dt; n.y += n.vy * dt;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          var max = Math.min(w, h) * 0.22;
          if (d < max) {
            ctx.strokeStyle = 'rgba(226,121,60,' + ((1 - d / max) * .5) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(function (n) {
        ctx.fillStyle = 'rgba(226,121,60,.85)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }, seed);
  }

  function initPreloader() {
    var host = doc.querySelector('[data-bg="preloader"]');
    if (!host || reduce) return;
    var sk = preloaderNet(host);
    host.classList.add('is-live');
    sk.start();
    var curtain = host.closest('.curtain');
    if (curtain) {
      var stop = function () { sk.stop(); };
      var mo = new MutationObserver(function () {
        if (curtain.classList.contains('is-done')) { stop(); mo.disconnect(); }
      });
      mo.observe(curtain, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ======================================================================
     HeroTopology — home hero only. VANTA.TOPOLOGY (p5.js-based), recolored
     to the site's amber palette instead of its default teal. Vanta owns
     its own render loop and resize handling, so there's nothing to wire
     up beyond construction; skipped entirely under reduced-motion since
     the effect has no static/paused mode, leaving the plain black
     .hero__bg visible instead.
     ====================================================================== */
  function initHeroTopology() {
    var host = doc.querySelector('[data-bg="warp"]');
    if (!host || reduce) return;
    if (typeof VANTA === 'undefined' || !VANTA.TOPOLOGY) return;

    VANTA.TOPOLOGY({
      el: host,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      scaleMobile: 1.00,
      color: 0xe2793c,
      backgroundColor: 0x0a0705,
      speed: 1
    });
    host.classList.add('is-live');
  }

  if (!reduce) initPreloader();
  initHeroTopology();
})();
