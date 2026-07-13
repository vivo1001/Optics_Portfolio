var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
var REVEAL_SEL = '.sec-head, .about-grid > *, .timeline .job, .grid > .card, .skills > .skill-cat, .ach > .item, .contact > .wrap > *';

/* ---- loader: charge -> fire -> flash -> clear, with % counter ---- */
(function(){
  var loader = document.getElementById('loader');
  var pct = document.getElementById('plPct');
  if(!loader) return;
  function clear(){
    loader.classList.add('done');
    document.body.classList.add('loaded');
  }
  if (reduceMotion){ clear(); return; }
  var p = 0;
  var tick = setInterval(function(){
    p = Math.min(100, p + Math.ceil(Math.random()*14));
    if(pct) pct.textContent = p + '%';
    if(p >= 100) clearInterval(tick);
  }, 90);
  window.addEventListener('load', function(){ setTimeout(clear, 2300); });
  setTimeout(clear, 5000);
})();

/* ---- nav hairline + top intensity bar ---- */
(function(){
  var header = document.querySelector('header');
  var bar = document.getElementById('progress');
  function onScroll(){
    var y = window.scrollY || 0;
    if(header) header.classList.toggle('scrolled', y > 8);
    if(bar){
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

/* ---- laser-pointer cursor glow ---- */
(function(){
  var photon = document.getElementById('photon');
  if(!photon) return;
  var fine = matchMedia('(pointer:fine)').matches;
  if(!fine || reduceMotion){ photon.style.display='none'; return; }
  var h1 = document.querySelector('.hero h1');
  addEventListener('mousemove', function(e){
    photon.style.left = e.clientX + 'px';
    photon.style.top  = e.clientY + 'px';
    photon.classList.add('live');
    if(h1){
      var r = h1.getBoundingClientRect();
      h1.style.setProperty('--lx', (e.clientX - r.left) + 'px');
      h1.style.setProperty('--ly', (e.clientY - r.top) + 'px');
    }
  });
  document.addEventListener('mouseleave', function(){ photon.classList.remove('live'); });
})();

/* ---- scroll reveal ---- */
(function(){
  var els = document.querySelectorAll(REVEAL_SEL);
  if(!els.length) return;
  if(reduceMotion || !('IntersectionObserver' in window)){
    els.forEach(function(el){ el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, {threshold:.14, rootMargin:'0px 0px -8% 0px'});
  els.forEach(function(el){ io.observe(el); });
})();

/* ---- scrollspy: active nav link ---- */
(function(){
  if(!('IntersectionObserver' in window)) return;
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var map = {};
  links.forEach(function(a){
    var id = a.getAttribute('href');
    if(id && id.charAt(0) === '#'){ var s = document.querySelector(id); if(s) map[s.id] = a; }
  });
  var sections = Object.keys(map).map(function(id){ return document.getElementById(id); });
  if(!sections.length) return;
  var spy = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        links.forEach(function(l){ l.classList.remove('active'); });
        if(map[en.target.id]) map[en.target.id].classList.add('active');
      }
    });
  }, {rootMargin:'-45% 0px -50% 0px'});
  sections.forEach(function(s){ spy.observe(s); });
})();

/* ---- achievement counters: count up 0 -> target when scrolled into view ---- */
(function(){
  var nums = document.querySelectorAll('.ach .num[data-count-to]');
  if(!nums.length) return;

  function formatNum(val, decimals, locale){
    return val.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function runCount(el){
    var target = parseFloat(el.getAttribute('data-count-to'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 900; /* ms — fast */

    if (reduceMotion){
      var locale = document.body.classList.contains('lang-de') ? 'de' : 'en';
      el.textContent = formatNum(target, decimals, locale) + suffix;
      return;
    }

    var start = null;
    function step(ts){
      if(start === null) start = ts;
      var elapsed = ts - start;
      var t = Math.min(1, elapsed / duration);
      var eased = 1 - Math.pow(1 - t, 3); /* ease-out cubic: fast start, smooth settle */
      var current = target * eased;
      var locale = document.body.classList.contains('lang-de') ? 'de' : 'en';
      el.textContent = formatNum(current, decimals, locale) + suffix;
      if(t < 1){
        requestAnimationFrame(step);
      } else {
        el.textContent = formatNum(target, decimals, locale) + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  if(!('IntersectionObserver' in window)){
    nums.forEach(runCount);
    return;
  }
  var counted = new WeakSet();
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting && !counted.has(en.target)){
        counted.add(en.target);
        runCount(en.target);
        io.unobserve(en.target);
      }
    });
  }, {threshold:.4});
  nums.forEach(function(el){ io.observe(el); });
})();

/* ---- language toggle (DE default, EN on click) ---- */
(function(){
  var enBtn = document.getElementById('langEn');
  var deBtn = document.getElementById('langDe');
  function setLang(lang){
    document.body.classList.toggle('lang-en', lang === 'en');
    document.body.classList.toggle('lang-de', lang === 'de');
    document.documentElement.lang = lang;
    if(enBtn) enBtn.classList.toggle('active', lang === 'en');
    if(deBtn) deBtn.classList.toggle('active', lang === 'de');
    // reveal any content that was hidden in the other language
    document.querySelectorAll(REVEAL_SEL).forEach(function(el){ el.classList.add('is-in'); });
  }
  if(enBtn) enBtn.addEventListener('click', function(){ setLang('en'); });
  if(deBtn) deBtn.addEventListener('click', function(){ setLang('de'); });
})();

/* ---- game mode: pilot a photon down the page; cards are mirrors ---- */
(function(){
  var btn = document.getElementById('gameBtn');
  var root = document.getElementById('game');
  if(!btn || !root) return;
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var winBox = document.getElementById('gameWin');
  var timeEl = document.getElementById('gameTime');

  var SPEED = 430;  /* px/s — constant: light doesn't brake */
  var TURN = 3.4;   /* rad/s while a steering key is held */
  var R = 7;        /* photon radius */

  var playing = false, done = false, raf = 0, last = 0, t0 = 0;
  var photon, keys = {}, mirrors = [], orbs = [], trail = [];

  /* layout position via the offset chain: unlike getBoundingClientRect it ignores
     the reveal animation's translateY, which otherwise caches rects 26px too low */
  function docRect(el){
    var x = 0, y = 0, n = el;
    while(n){ x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return {x: x, y: y, w: el.offsetWidth, h: el.offsetHeight};
  }

  /* sample the real page: visible bordered boxes become mirrors,
     one wavelength orb lands in each of four sections */
  function build(){
    canvas.width = innerWidth; canvas.height = innerHeight;
    mirrors = [];
    /* fixed-header buttons excluded: they scroll with the viewport, not the document */
    document.querySelectorAll('.card, .skill-cat, .ach .item, .specs, .hero-actions a, .contact-links a').forEach(function(el){
      var r = docRect(el);
      if(r.w > 0 && r.h > 0) mirrors.push(r); /* display:none twins of the other language drop out here */
    });
    var got = {};
    orbs.forEach(function(o){ got[o.nm] = o.got; });
    /* an orb inside a mirror box would be uncollectable — push it up until it sits clear */
    function clearY(x, y){
      var pad = 40;
      for(var i = 0; i < mirrors.length; i++){
        var m = mirrors[i];
        if(x > m.x - pad && x < m.x + m.w + pad && y > m.y - pad && y < m.y + m.h + pad){
          y = m.y - pad;
          i = -1; /* moved: recheck every mirror */
        }
      }
      return y;
    }
    var colors = {'405':'#6C2BD9','488':'#18C7E6','532':'#1FE08C','633':'#FF435E'};
    orbs = [['about','405'],['experience','488'],['projects','532'],['achievements','633']].map(function(s, i){
      var r = docRect(document.getElementById(s[0]));
      var x = r.x + r.w * (i % 2 ? .78 : .22);
      return {x: x, y: clearY(x, r.y + r.h * .45), nm: s[1], c: colors[s[1]], got: got[s[1]] || false};
    });
  }

  function fmt(secs, de){
    return secs.toLocaleString(de ? 'de-DE' : 'en-US', {minimumFractionDigits:1, maximumFractionDigits:1}) + ' s';
  }

  function start(){
    playing = true; done = false;
    document.body.classList.add('gaming');
    btn.setAttribute('aria-pressed','true');
    root.hidden = false; winBox.hidden = true;
    document.documentElement.style.scrollBehavior = 'auto'; /* beat html{scroll-behavior:smooth} for per-frame scrolls */
    /* reveal everything up front so cards sit at their final position while playing */
    document.querySelectorAll(REVEAL_SEL).forEach(function(el){ el.classList.add('is-in'); });
    orbs = []; build();
    root.querySelectorAll('.game-chips i').forEach(function(c){ c.classList.remove('got'); });
    var hero = docRect(document.getElementById('hero'));
    photon = {x: hero.x + hero.w * .5, y: hero.y + hero.h * .55, a: Math.PI * .35};
    trail = []; keys = {};
    t0 = last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function stop(){
    playing = false;
    cancelAnimationFrame(raf);
    document.body.classList.remove('gaming');
    btn.setAttribute('aria-pressed','false');
    root.hidden = true;
    document.documentElement.style.scrollBehavior = '';
  }

  function winGame(now){
    done = true;
    var secs = (now - t0) / 1000;
    winBox.querySelectorAll('.game-final').forEach(function(b){
      b.textContent = fmt(secs, !!b.closest('.l-de'));
    });
    winBox.hidden = false;
  }

  function frame(now){
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var docH = document.documentElement.scrollHeight;

    if(!done){
      if(keys.ArrowLeft || keys.KeyA) photon.a -= TURN * dt;
      if(keys.ArrowRight || keys.KeyD) photon.a += TURN * dt;
      photon.x += Math.cos(photon.a) * SPEED * dt;
      photon.y += Math.sin(photon.a) * SPEED * dt;

      /* viewport side walls + document top/bottom */
      if(photon.x < R){ photon.x = R; photon.a = Math.PI - photon.a; }
      if(photon.x > innerWidth - R){ photon.x = innerWidth - R; photon.a = Math.PI - photon.a; }
      if(photon.y < R){ photon.y = R; photon.a = -photon.a; }
      if(photon.y > docH - R){ photon.y = docH - R; photon.a = -photon.a; }

      /* mirror bounce: reflect along the axis of least penetration */
      for(var i = 0; i < mirrors.length; i++){
        var m = mirrors[i];
        if(photon.x > m.x - R && photon.x < m.x + m.w + R && photon.y > m.y - R && photon.y < m.y + m.h + R){
          var dl = photon.x - (m.x - R), dr = (m.x + m.w + R) - photon.x;
          var du = photon.y - (m.y - R), dd = (m.y + m.h + R) - photon.y;
          var min = Math.min(dl, dr, du, dd);
          if(min === dl){ photon.x = m.x - R; photon.a = Math.PI - photon.a; }
          else if(min === dr){ photon.x = m.x + m.w + R; photon.a = Math.PI - photon.a; }
          else if(min === du){ photon.y = m.y - R; photon.a = -photon.a; }
          else { photon.y = m.y + m.h + R; photon.a = -photon.a; }
          m.hit = now;
        }
      }

      orbs.forEach(function(o){
        if(!o.got && Math.hypot(photon.x - o.x, photon.y - o.y) < 28){
          o.got = true;
          var chip = root.querySelector('.game-chips i[data-orb="' + o.nm + '"]');
          if(chip) chip.classList.add('got');
          if(orbs.every(function(g){ return g.got; })) winGame(now);
        }
      });

      scrollTo(0, Math.max(0, Math.min(photon.y - innerHeight * .5, docH - innerHeight)));
      timeEl.textContent = fmt((now - t0) / 1000, document.body.classList.contains('lang-de'));

      trail.push({x: photon.x, y: photon.y});
      if(trail.length > 50) trail.shift();
    }

    /* draw (canvas is viewport-sized; doc y minus scroll) */
    var sy = scrollY;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1;
    mirrors.forEach(function(m){
      var y = m.y - sy;
      if(y > innerHeight || y + m.h < 0) return;
      var hot = m.hit && now - m.hit < 350;
      ctx.strokeStyle = hot ? 'rgba(31,224,140,.9)' : 'rgba(31,224,140,.25)';
      ctx.strokeRect(m.x + .5, y + .5, m.w, m.h);
    });

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    orbs.forEach(function(o){
      if(o.got) return;
      var y = o.y - sy;
      if(y < -40 || y > innerHeight + 40) return;
      var pulse = 1 + Math.sin(now / 300 + o.x) * .15;
      ctx.save();
      ctx.shadowColor = o.c; ctx.shadowBlur = 20;
      ctx.fillStyle = o.c;
      ctx.beginPath(); ctx.arc(o.x, y, 11 * pulse, 0, 7); ctx.fill();
      ctx.restore();
      ctx.fillStyle = o.c;
      ctx.fillText(o.nm + ' nm', o.x, y + 30);
    });

    ctx.lineWidth = 2;
    for(var t = 1; t < trail.length; t++){
      ctx.strokeStyle = 'rgba(31,224,140,' + (t / trail.length * .5).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(trail[t-1].x, trail[t-1].y - sy);
      ctx.lineTo(trail[t].x, trail[t].y - sy);
      ctx.stroke();
    }

    ctx.save();
    ctx.shadowColor = '#1FE08C'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(photon.x, photon.y - sy, R - 2, 0, 7); ctx.fill();
    ctx.restore();

    /* compass arrow toward the nearest missing wavelength */
    if(!done){
      var next = null, best = Infinity;
      orbs.forEach(function(o){
        if(o.got) return;
        var d = Math.hypot(photon.x - o.x, photon.y - o.y);
        if(d < best){ best = d; next = o; }
      });
      if(next){
        var ang = Math.atan2(next.y - photon.y, next.x - photon.x);
        ctx.save();
        ctx.translate(photon.x + Math.cos(ang) * 34, photon.y - sy + Math.sin(ang) * 34);
        ctx.rotate(ang);
        ctx.fillStyle = next.c;
        ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }

    if(playing) raf = requestAnimationFrame(frame);
  }

  addEventListener('keydown', function(e){
    if(!playing) return;
    if(e.code === 'Escape'){ stop(); return; }
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','Space'].indexOf(e.code) > -1){
      keys[e.code] = true;
      e.preventDefault(); /* keep arrows/space from scrolling the page under the game */
    }
  });
  addEventListener('keyup', function(e){ keys[e.code] = false; });

  btn.addEventListener('click', function(){ playing ? stop() : start(); });
  document.getElementById('gameAgain').addEventListener('click', start);
  document.getElementById('gameExit').addEventListener('click', stop);
  addEventListener('resize', function(){ if(playing) build(); });
  /* language switch swaps which twins are visible → mirror rects move */
  ['langEn','langDe'].forEach(function(id){
    var b = document.getElementById(id);
    if(b) b.addEventListener('click', function(){ if(playing) build(); });
  });
})();

/* ---- hero portrait: the photo rebuilt from photon dots, scanned in
   left-to-right; dots scatter away from the cursor like light off a fingertip ---- */
(function(){
  var canvas = document.getElementById('portrait');
  if(!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var GAP = 6;      /* css px between sampled dots */
  var REPEL = 64;   /* cursor influence radius */
  var SCAN = 1400;  /* ms for the scan beam to cross the frame */

  var img = new Image();
  img.onload = setup;
  img.src = 'portrait.jpg';

  var dots = [], w = 0, h = 0, t0 = 0, raf = 0, animating = false;
  var bound = false, scanned = false;
  var mx = -1e4, my = -1e4;

  function setup(){
    var dpr = Math.min(2, devicePixelRatio || 1);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* cover-crop the photo into an offscreen canvas and sample it */
    var off = document.createElement('canvas');
    off.width = w; off.height = h;
    var octx = off.getContext('2d');
    var s = Math.max(w / img.width, h / img.height);
    /* bias the square crop upward so the face sits well in the circle */
    octx.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) * .35, img.width * s, img.height * s);
    var data;
    try{
      data = octx.getImageData(0, 0, w, h).data;
    }catch(e){
      /* file:// preview taints the canvas — show the plain photo, dimmed into the bench */
      ctx.save();
      ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, 7); ctx.clip();
      ctx.drawImage(off, 0, 0);
      ctx.fillStyle = 'rgba(7,9,15,.35)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      return;
    }

    dots = [];
    var cx = w / 2, cy = h / 2, rad = Math.min(w, h) / 2;
    for(var y = GAP / 2; y < h; y += GAP){
      for(var x = GAP / 2; x < w; x += GAP){
        /* circular vignette: fade dots out toward the rim, none beyond it */
        var edge = Math.min(1, (rad - Math.hypot(x - cx, y - cy)) / 30);
        if(edge <= 0) continue;
        var p = (Math.round(y) * w + Math.round(x)) * 4;
        var b = (data[p] * .299 + data[p+1] * .587 + data[p+2] * .114) / 255 * edge;
        if(b < .12) continue;
        var t = b * b; /* dim background pixels shrink to faint specks */
        dots.push({
          x: x, y: y,
          sx: Math.random() * w, sy: Math.random() * h, /* fly-in start, Gazi-style */
          r: GAP * .5 * (0.35 + t), a: .2 + .8 * t, bright: b > .78
        });
      }
    }

    if(reduceMotion){ draw(1e9); return; }
    if(!bound){
      bound = true;
      canvas.addEventListener('mousemove', function(e){
        var r = canvas.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
        wake();
      });
      canvas.addEventListener('mouseleave', function(){ mx = my = -1e4; wake(); });
      var rto;
      addEventListener('resize', function(){
        clearTimeout(rto);
        rto = setTimeout(setup, 150); /* re-sample at the new size */
      });
    }
    if(scanned){ t0 = -1e9; wake(); return; } /* resize: settle instantly, no re-scan */
    scanned = true;
    /* hold the scan until the loading screen clears, or it plays unseen behind it */
    (function begin(){
      if(document.body.classList.contains('loaded')){ t0 = performance.now(); wake(); }
      else setTimeout(begin, 120);
    })();
  }

  function wake(){
    if(animating) return;
    animating = true;
    raf = requestAnimationFrame(tick);
  }

  function tick(now){
    var settled = draw(now - t0);
    if(settled && mx < -1e3){ animating = false; return; } /* idle: stop burning frames */
    raf = requestAnimationFrame(tick);
  }

  function draw(elapsed){
    ctx.clearRect(0, 0, w, h);
    var beamX = elapsed / SCAN * (w + 120) - 60; /* scan front sweeping the frame */
    var settled = elapsed > SCAN + 700;          /* the last dots need 700ms to converge */

    for(var i = 0; i < dots.length; i++){
      var d = dots[i];
      /* once the beam passes a dot it flies in from its scatter position (Gazi-style loader) */
      var prog = 1;
      if(!settled){
        prog = (elapsed - (d.x + 60) / (w + 120) * SCAN) / 700;
        if(prog <= 0) continue;
        if(prog > 1) prog = 1;
        prog = 1 - Math.pow(1 - prog, 3); /* ease-out */
      }
      var x = d.sx + (d.x - d.sx) * prog, y = d.sy + (d.y - d.sy) * prog;
      var dx = x - mx, dy = y - my;
      var dist2 = dx * dx + dy * dy;
      if(dist2 < REPEL * REPEL){
        var dist = Math.sqrt(dist2) || 1;
        var f = (REPEL - dist) / REPEL;
        x += dx / dist * f * 22;
        y += dy / dist * f * 22;
      }
      var a = (d.a * prog).toFixed(2);
      ctx.fillStyle = d.bright
        ? 'rgba(220,255,240,' + a + ')'
        : 'rgba(31,224,140,' + a + ')';
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, 7);
      ctx.fill();
    }

    if(beamX < w + 60){ /* the moving scan line itself */
      var g = ctx.createLinearGradient(beamX - 40, 0, beamX + 2, 0);
      g.addColorStop(0, 'rgba(31,224,140,0)');
      g.addColorStop(1, 'rgba(31,224,140,.5)');
      ctx.fillStyle = g;
      ctx.fillRect(beamX - 40, 0, 42, h);
    }
    return settled;
  }
})();
