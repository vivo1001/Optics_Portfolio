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
