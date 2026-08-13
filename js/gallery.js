/* ---- hobbies band: photos drift past, the centred one lights up; click to enlarge ---- */
(function(){
  var band = document.querySelector('.band');
  if(!band) return;
  var shots = Array.prototype.slice.call(band.querySelectorAll('.shot'));
  if(!shots.length) return;

  var dlg = document.getElementById('lightbox');

  var tiles = Array.prototype.slice.call(band.children);   /* originals; clones added later */
  var speed = parseFloat(getComputedStyle(band).getPropertyValue('--band-speed')) || .4;
  var running = false, raf = 0, touchHold = 0, ready = false;
  var centers = [], period = 0, lit = null, pos = 0;

  /* One extra copy of the strip, so scrollLeft can wrap at the halfway mark onto
     identical content — the jump is invisible.

     Deferred until the section is nearly in view, and that timing is not cosmetic:
     inserting the clones makes the browser fetch every thumb at once, `loading="lazy"`
     notwithstanding. Cloning at load pulled all 27 (~730 KB) on first paint even with
     the band 5000px below the fold. Cloning here keeps that off the initial load. */
  function setup(){
    if(ready) return;
    ready = true;
    Array.prototype.slice.call(band.children).forEach(function(fig){
      var copy = fig.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');          /* AT reads each photo once */
      var btn = copy.querySelector('.shot');
      if(btn) btn.tabIndex = -1;                          /* and Tab visits it once */
      band.appendChild(copy);
    });
    tiles = Array.prototype.slice.call(band.children);
    measure();
  }

  /* Measured once, not per frame: reading offsetLeft inside the loop while also
     writing scrollLeft forces a synchronous layout every frame. Tile geometry only
     moves on resize — lazy-loaded images can't shift it, because aspect-ratio has
     already reserved each tile's box. */
  function measure(){
    centers = tiles.map(function(t){ return t.offsetLeft + t.offsetWidth / 2; });
    /* the wrap distance is one full period — first clone minus first original.
       NOT scrollWidth/2, which lands half a flex gap short and hitches on loop.
       Only meaningful once cloned; an odd tile count would index a half-tile. */
    period = ready ? tiles[tiles.length / 2].offsetLeft - tiles[0].offsetLeft : 0;
  }

  /* nearest tile to the band's centre. Exact, and always exactly one — an
     IntersectionObserver centre strip either misses in the gaps between tiles
     or lights two at once, depending how wide you make it. */
  function lightNearest(){
    var mid = band.scrollLeft + band.clientWidth / 2, best = null, bestD = Infinity;
    for(var i = 0; i < centers.length; i++){
      var d = Math.abs(centers[i] - mid);
      if(d < bestD){ bestD = d; best = tiles[i]; }
    }
    if(best === lit) return;
    /* not 'is-in' — that class belongs to the reveal system in js/reveal.js */
    if(lit) lit.classList.remove('is-lit');
    if(best) best.classList.add('is-lit');
    lit = best;
  }

  /* Recomputed every frame instead of kept in a `paused` flag. A flag only clears
     when some event fires to clear it, and the one that mattered never came:
     <dialog> returns focus to the tile that opened it, so the band read as focused
     and stayed stuck after the lightbox closed. Derived state cannot strand. */
  function held(){
    return band.matches(':hover')
        /* :focus-visible, not :focus — focus restored by <dialog> on close is not
           keyboard navigation and must not hold the band still */
        || band.matches(':focus-visible') || !!band.querySelector(':focus-visible')
        || (dlg && dlg.open)
        || performance.now() < touchHold;
  }

  function frame(){
    /* someone moved it by hand (wheel, touch, arrow keys) — adopt their position */
    if(Math.abs(band.scrollLeft - pos) > 2) pos = band.scrollLeft;
    if(!held()){
      /* accumulate in a float and assign. `scrollLeft += 0.4` reads back 0 every
         frame — the browser rounds the write away — and the band never moves. */
      pos += speed;
      if(pos >= period) pos -= period;
      band.scrollLeft = pos;
    }
    lightNearest();
    raf = requestAnimationFrame(frame);
  }

  addEventListener('resize', function(){ measure(); pos = band.scrollLeft; lightNearest(); });

  if(reduceMotion){
    /* no drift means no wrap, so the clones would be dead weight — skip them and
       leave a plain 27-photo strip the reader scrolls themselves */
    measure();
    band.addEventListener('scroll', lightNearest, {passive:true});
    lightNearest();
  } else if('IntersectionObserver' in window){
    /* burn no frames — and pull no photos — until the section is nearly reached */
    new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          setup();
          if(!running){ running = true; raf = requestAnimationFrame(frame); }
        } else { running = false; cancelAnimationFrame(raf); }
      });
    }, {rootMargin: '300px 0px'}).observe(band);   /* clone just before it shows */
  } else {
    setup(); running = true; raf = requestAnimationFrame(frame);
  }

  /* Hover and keyboard focus are read live in held(); no listeners needed for them.
     Touch never hovers, so a tap has to buy its own window of stillness. */
  band.addEventListener('pointerdown', function(e){
    if(e.pointerType !== 'mouse') touchHold = performance.now() + 2500;
  });

  /* ---- lightbox: the full-size file is fetched on click, never up front ---- */
  if(!dlg) return;
  var lbImg = dlg.querySelector('img');
  var idx = 0;

  function show(i){
    idx = (i + shots.length) % shots.length;        /* originals only — clones would repeat */
    var btn = shots[idx];
    lbImg.src = btn.getAttribute('data-full');
    lbImg.alt = btn.querySelector('img').alt;
  }

  var openedByKey = false;

  band.addEventListener('click', function(e){
    var btn = e.target.closest('.shot');
    if(!btn) return;
    openedByKey = e.detail === 0;   /* Enter/Space report no click count; a mouse reports >=1 */
    /* a clone maps back to its original by position */
    var all = Array.prototype.slice.call(band.querySelectorAll('.shot'));
    show(all.indexOf(btn) % shots.length);
    dlg.showModal();
  });

  dlg.addEventListener('close', function(){
    /* <dialog> hands focus back to the tile that opened it. After a pointer-driven
       open that is not the user navigating — and since closing with Esc counts as
       keyboard input, Chrome marks the restored focus :focus-visible, which held()
       would honour and freeze the band for good. Give focus back to the page.
       A keyboard-opened lightbox keeps its focus, so Tab order survives. */
    if(!openedByKey && document.activeElement && band.contains(document.activeElement)){
      document.activeElement.blur();
    }
  });

  dlg.querySelector('.lb-prev').addEventListener('click', function(){ show(idx - 1); });
  dlg.querySelector('.lb-next').addEventListener('click', function(){ show(idx + 1); });
  dlg.querySelector('.lb-close').addEventListener('click', function(){ dlg.close(); });
  dlg.addEventListener('keydown', function(e){
    if(e.key === 'ArrowLeft') show(idx - 1);
    if(e.key === 'ArrowRight') show(idx + 1);
  });
  /* backdrop click closes; Esc is free from <dialog> */
  dlg.addEventListener('click', function(e){ if(e.target === dlg) dlg.close(); });
})();
