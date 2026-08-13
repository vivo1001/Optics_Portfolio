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
