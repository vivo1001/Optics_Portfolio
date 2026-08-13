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
  var photon, keys = {}, touch = null, mirrors = [], orbs = [], trail = [];

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
    trail = []; keys = {}; touch = null;
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
      if(touch){ /* turn toward the finger, same max turn rate as the keys */
        var want = Math.atan2(touch.y + scrollY - photon.y, touch.x - photon.x);
        var diff = Math.atan2(Math.sin(want - photon.a), Math.cos(want - photon.a));
        var max = TURN * dt;
        photon.a += Math.max(-max, Math.min(max, diff));
      }
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

  /* touch steering: hold/drag anywhere and the photon turns toward the finger */
  function onTouch(e){
    if(!playing) return;
    /* leave the header and win-dialog tappable — preventDefault would swallow their clicks */
    if(e.target.closest && e.target.closest('#gameWin, header')) return;
    touch = {x: e.touches[0].clientX, y: e.touches[0].clientY};
    e.preventDefault(); /* the game drives the scroll, not the finger */
  }
  addEventListener('touchstart', onTouch, {passive:false});
  addEventListener('touchmove', onTouch, {passive:false});
  addEventListener('touchend', function(e){ if(!e.touches.length) touch = null; });
  addEventListener('touchcancel', function(){ touch = null; });

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
