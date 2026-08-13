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
