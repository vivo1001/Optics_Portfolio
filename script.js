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
