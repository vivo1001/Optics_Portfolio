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
