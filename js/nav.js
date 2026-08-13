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
