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
