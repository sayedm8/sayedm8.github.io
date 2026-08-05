(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* language toggle curtain — duration read from the CSS (--lt-dur), one source of truth */
  var PAGE_LABEL = 'English';
  var overlay = document.getElementById('lang-transition');
  var ltLabel = document.getElementById('lt-label');
  var ltDur = 520;
  if (overlay) {
    var d = parseFloat(getComputedStyle(overlay).getPropertyValue('--lt-dur'));
    if (d) ltDur = d * 1000;
  }
  if (sessionStorage.getItem('kira-transition') === '1') {
    try{ sessionStorage.removeItem('kira-transition'); }catch(e){}
    /* flag it for the load intro below, which skips so the two curtains don't stack */
    window.__kiraLangArrival = true;
    if (overlay && !reduce) {
      if (ltLabel) ltLabel.textContent = PAGE_LABEL;
      overlay.classList.add('cover');
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ overlay.classList.add('out'); }); });
      overlay.addEventListener('transitionend', function(){ overlay.className = ''; }, {once:true});
    }
  }
  document.querySelectorAll('a.lang-toggle').forEach(function(a){
    a.addEventListener('click', function(e){
      var href = a.getAttribute('href');
      if (reduce || !overlay) return;
      e.preventDefault();
      if (ltLabel) ltLabel.textContent = a.getAttribute('data-label') || '';
      try{ sessionStorage.setItem('kira-transition','1'); }catch(err){}
      overlay.classList.add('show');
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ overlay.classList.add('in'); }); });
      setTimeout(function(){ window.location.href = href; }, ltDur);
    });
  });

  /* scroll progress */
  var bar = document.getElementById('scrollProgress');
  function onScroll(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
    bar.style.width = (pct * 100).toFixed(2) + '%';
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* scroll reveal */
  document.body.classList.add('reveal-on');
  var targets = document.querySelectorAll(
    '.statement-inner, .mosaic .kicker, .mosaic .head, .mosaic-tile, .opportunity .kicker, .opportunity .head, .opp-copy, .shift-row, .big-panel-head, .trio-item, .split .kicker, .split .head, .split-panel, .services .kicker, .services .head, .pkg-card, .pkg-foot, .process .kicker, .process .head, .proc-media, .proc-step, .promise-title, .promise-item, .meet-copy, .partners .kicker, .partners .head, .partner-tile, .cases .kicker, .cases .head, .case-intro, .case-row, .next-slot, .film .kicker, .film .head, .film-lead, .film-credit, .film-tile, .film-foot, .work-preview .kicker, .work-preview .head, .wp-card, .foot-lockup, .about .kicker, .about .head, .about-portrait, .about-note, .faq .kicker, .faq .head, .faq-item, .cf-intro, .cf-direct, .cf-form, .closing-inner'
  );
  targets.forEach(function(el){ el.classList.add('reveal'); });
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function(el){ el.classList.add('in'); });
  } else {
    /* defer the decision: if GSAP loaded (deferred), it owns .reveal instead — see the Motion block */
    var startIO = function(){
      if (window.gsap) return;
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, {rootMargin:'0px 0px -8% 0px', threshold:0.12});
      targets.forEach(function(el){ io.observe(el); });
      /* self-healing: reveal anything in the viewport the observer missed.
         Runs on a short schedule and on scroll — content can never stay hidden. */
      var heal = function(){
        for (var i = 0; i < targets.length; i++) {
          var el = targets[i];
          if (el.classList.contains('in')) continue;
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight * 0.95 && r.bottom > 0) el.classList.add('in');
        }
      };
      [400, 1200, 2500, 5000].forEach(function(t){ window.setTimeout(heal, t); });
      var healPending = false;
      window.addEventListener('scroll', function(){
        if (healPending) return;
        healPending = true;
        window.setTimeout(function(){ healPending = false; heal(); }, 180);
      }, {passive:true});
    };
    if (document.readyState === 'loading') { window.addEventListener('DOMContentLoaded', startIO); }
    else { startIO(); }
  }

  /* film tiles — tap to play with sound, tap again to pause; one at a time */
  var filmVideos = Array.prototype.slice.call(document.querySelectorAll('.film-tile video'));
  filmVideos.forEach(function(v){
    var tile = v.closest('.film-tile');
    v.addEventListener('click', function(){
      if (v.paused) {
        filmVideos.forEach(function(o){ if (o !== v) o.pause(); });
        v.muted = false;
        v.play();
      } else {
        v.pause();
      }
    });
    v.addEventListener('play', function(){ tile.classList.add('playing'); });
    v.addEventListener('pause', function(){ tile.classList.remove('playing'); });
  });

  /* contact form → prefilled WhatsApp (primary) or email (secondary) */
  var cf = document.getElementById('cf-form');
  if (cf) {
    var cfLines = function(){
      var g = function(n){ var el = cf.querySelector('[name="'+n+'"]'); return el ? el.value.trim() : ''; };
      var lines = ["Hi Kira, I'd like to start a project.", ''];
      if (g('name')) lines.push('Name: ' + g('name'));
      if (g('business')) lines.push('Business: ' + g('business'));
      if (g('need')) lines.push('Interested in: ' + g('need'));
      if (g('message')) { lines.push(''); lines.push(g('message')); }
      return lines;
    };
    var cfValid = function(){
      var nameEl = cf.querySelector('#cf-name');
      if (nameEl && !nameEl.value.trim()) { nameEl.focus(); nameEl.style.borderBottomColor = 'var(--pop)'; return false; }
      return true;
    };
    cf.addEventListener('submit', function(e){
      e.preventDefault();
      if (!cfValid()) return;
      window.open('https://wa.me/97470196996?text=' + encodeURIComponent(cfLines().join('\n')), '_blank', 'noopener');
    });
    var cfEmail = document.getElementById('cf-email');
    if (cfEmail) {
      cfEmail.addEventListener('click', function(){
        if (!cfValid()) return;
        var nameEl = cf.querySelector('#cf-name');
        var subject = 'New project enquiry' + (nameEl && nameEl.value.trim() ? ' — ' + nameEl.value.trim() : '');
        window.location.href = 'mailto:marwanayman14@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(cfLines().join('\r\n'));
      });
    }
  }

  /* nav scrollspy */
  var navMap = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function(a){
    var id = a.getAttribute('href').slice(1);
    if (id) navMap[id] = a;
  });
  var sections = Object.keys(navMap)
    .map(function(id){ return document.getElementById(id); })
    .filter(Boolean);
  if (sections.length) {
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          Object.values(navMap).forEach(function(a){ a.classList.remove('active'); a.removeAttribute('aria-current'); });
          var a = navMap[e.target.id];
          if (a){ a.classList.add('active'); a.setAttribute('aria-current','true'); }
        }
      });
    }, {rootMargin:'-45% 0px -50% 0px', threshold:0});
    sections.forEach(function(s){ spy.observe(s); });
  }

  /* case-study lightboxes (native dialog) */
  document.querySelectorAll('.case-media[data-lightbox]').forEach(function(btn){
    var dlg = document.getElementById(btn.getAttribute('data-lightbox'));
    if (!dlg || typeof dlg.showModal !== 'function') return;
    btn.addEventListener('click', function(){ dlg.showModal(); });
    dlg.addEventListener('click', function(e){
      if (e.target === dlg || e.target.hasAttribute('data-close')) dlg.close();
    });
  });

  /* sticky mobile WhatsApp bar — shows once the hero scrolls out */
  var hero = document.querySelector('.hero');
  if (!hero) { document.body.classList.add('wa-visible'); }
  if (hero && 'IntersectionObserver' in window) {
    var waSpy = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        document.body.classList.toggle('wa-visible', !e.isIntersecting);
      });
    }, {threshold:0});
    waSpy.observe(hero);
  }
})();


/* load intro — the eye greets an arrival, and replays on an explicit refresh.
   It sits out internal link clicks: it introduces the brand once, and repeating it
   between pages is just a toll booth in front of whatever the visitor asked for. */
(function(){
  var intro = document.getElementById('page-intro');
  if (!intro) return;
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
  var reloaded = nav ? nav.type === 'reload'
                     : !!(performance.navigation && performance.navigation.type === 1);
  var internal = false;
  try {
    internal = !!document.referrer && new URL(document.referrer).origin === location.origin;
  } catch (e) {}

  /* the language toggle brings its own curtain — never stack two */
  if (reduce || window.__kiraLangArrival || (internal && !reloaded)) { intro.remove(); return; }

  /* hold long enough for the eye to finish opening; --intro-hold lives in the CSS
     beside the keyframes so the two can't drift out of sync */
  var hold = parseFloat(getComputedStyle(intro).getPropertyValue('--intro-hold')) || 1700;

  document.body.classList.add('intro-active');
  var dismiss = function(){
    intro.classList.add('done');
    document.body.classList.remove('intro-active');
    setTimeout(function(){ intro.remove(); }, 850);
  };
  var arm = function(){ setTimeout(dismiss, hold); };
  if (document.readyState === 'complete') { arm(); }
  else { window.addEventListener('load', arm); setTimeout(dismiss, hold + 1400); }
})();
