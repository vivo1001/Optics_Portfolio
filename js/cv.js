/* ---- CV: blue and red dots orbit while the CV loads, merge into purple, and splash it in (after jackwei.dev, minus video and sound) ---- */
(function(){
  var btn = document.querySelector('.cv-btn');
  var dlg = document.getElementById('cvReel');
  if(!btn || !dlg || !dlg.showModal) return;   // no <dialog>: the button stays a plain link
  var frame = dlg.querySelector('iframe');
  var id = btn.href.match(/\/d\/([^/]+)/);
  var src = id ? 'https://drive.google.com/file/d/' + id[1] + '/preview' : btn.href;
  dlg.querySelector('.cv-open').href = btn.href;
  var timers = [];
  function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
  function phase(p){ dlg.className = 'cv-reel ' + p; }

  btn.addEventListener('click', function(e){
    if(e.ctrlKey || e.metaKey || e.shiftKey) return;   // new-tab clicks behave like a link
    e.preventDefault();
    phase(reduceMotion ? 'done' : 'loading');
    dlg.showModal();
    var t0 = Date.now(), went = false;
    // dots for at least 1 s and until the CV has loaded; 6 s cap so a slow Drive never traps anyone
    function go(){
      if(went) return; went = true;
      later(function(){
        phase('merge');
        later(function(){
          phase('drop');
          later(function(){ phase('done'); }, 2050);   // last ripple's delay + duration in cv.css
        }, 900);                                       // dots spiral in, purple orb pops
      }, Math.max(0, 1000 - (Date.now() - t0)));
    }
    if(!reduceMotion){ frame.onload = go; later(go, 6000); }
    frame.src = src;
  });

  dlg.querySelector('.cv-close').addEventListener('click', function(){ dlg.close(); });
  dlg.addEventListener('close', function(){
    timers.forEach(clearTimeout); timers = [];
    frame.onload = null;
    frame.src = 'about:blank';   // unload it, so the next open replays the whole sequence
    phase('');
  });
})();
