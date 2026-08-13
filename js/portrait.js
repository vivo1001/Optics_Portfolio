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
