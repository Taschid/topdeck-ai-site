/* ==========================================================================
   template.js - dependency-free behaviours for the template
   - mobile nav toggle
   - FAQ accordion
   - testimonial slider (scroll-snap based)
   - contact form validation + local demo submit
   - sample-call audio player (AI Receptionist illustration)
   - footer year
   ========================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    /* ---------------------------------------------- mobile nav (off-canvas drawer) */
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (toggle && nav) {
      var backdrop = document.querySelector('.nav-backdrop');
      var closeBtn = nav.querySelector('.nav__close');
      var desktopNav = window.matchMedia('(min-width: 992px)');

      function navIsOpen() { return nav.classList.contains('is-open'); }

      function setNav(open) {
        nav.classList.toggle('is-open', open);
        if (backdrop) backdrop.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          /* move focus into the drawer */
          if (closeBtn) closeBtn.focus();
        } else {
          /* return focus to the control that opened it */
          toggle.focus();
        }
      }

      toggle.addEventListener('click', function () { setNav(!navIsOpen()); });
      if (closeBtn) closeBtn.addEventListener('click', function () { setNav(false); });
      if (backdrop) backdrop.addEventListener('click', function () { setNav(false); });
      document.addEventListener('keydown', function (e) {
        if ((e.key === 'Escape' || e.key === 'Esc') && navIsOpen()) setNav(false);
      });
      /* if the viewport grows past the breakpoint while open, drop the drawer state */
      function onBreakpoint(e) { if (e.matches && navIsOpen()) setNav(false); }
      if (desktopNav.addEventListener) desktopNav.addEventListener('change', onBreakpoint);
      else if (desktopNav.addListener) desktopNav.addListener(onBreakpoint);

      /* Services accordion: collapsed in the drawer, a hover dropdown on desktop */
      nav.querySelectorAll('.nav__sub-toggle').forEach(function (btn) {
        var sub = document.getElementById(btn.getAttribute('aria-controls'));
        btn.addEventListener('click', function () {
          var open = btn.getAttribute('aria-expanded') !== 'true';
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          var item = btn.closest('.nav__item--has-children');
          if (item) item.classList.toggle('is-open', open);
          if (sub) sub.classList.toggle('is-open', open);
        });
      });
    }

    /* ------------------------------- sticky header: hide on scroll down, show on scroll up
       Mirrors the live reference, where the header (topbar + nav, one sticky block) slides up
       once you scroll down past 300px and returns as soon as you scroll up. Measured on the
       oracle at 1280x900: visible at scrollY 299, hidden at 301, revealed on scroll-up. It
       also never moves while the off-canvas drawer is open (measured on the oracle).
       The movement is the sticky `top` (see .site-header.is-hidden), not a transform, so it
       cannot become the containing block of the fixed drawer. */
    var header = document.querySelector('.site-header');
    if (header) {
      var HIDE_AFTER = 300;
      var lastY = window.pageYOffset || 0;
      var ticking = false;

      function setShift() {
        /* the shift is the header's own height (topbar + nav), which changes with the
           viewport because the topbar is hidden on the narrowest phones */
        header.style.setProperty('--hdr-shift', header.offsetHeight + 'px');
      }

      function applyHeader() {
        ticking = false;
        var y = window.pageYOffset || 0;
        var drawerOpen = nav && nav.classList.contains('is-open');
        if (drawerOpen) {
          header.classList.remove('is-hidden');
        } else if (y > HIDE_AFTER && y > lastY) {
          header.classList.add('is-hidden');
        } else if (y < lastY || y <= HIDE_AFTER) {
          header.classList.remove('is-hidden');
        }
        lastY = y;
      }

      function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(applyHeader);
      }

      setShift();
      applyHeader();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () { setShift(); applyHeader(); });
    }

    /* ------------------------------------------------------------- accordion */
    document.querySelectorAll('.faq-item').forEach(function (item) {
      var btn = item.querySelector('.faq-item__q');
      var panel = item.querySelector('.faq-item__a');
      if (!btn || !panel) return;
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var open = item.classList.toggle('is-open');
        panel.hidden = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });

    /* ---------------------------------------------------------------- slider */
    document.querySelectorAll('[data-slider]').forEach(function (root) {
      var track = root.querySelector('.slider__track');
      var prev = root.querySelector('[data-slider-prev]');
      var next = root.querySelector('[data-slider-next]');
      if (!track) return;
      function step() {
        var slide = track.querySelector('.slider__slide');
        return slide ? slide.getBoundingClientRect().width + 24 : 320;
      }
      if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
      if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    });

    /* ------------------------------------------------------------------ year */
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());

    /* ------------------------------------------------ scroll entrance animations
       Parity with the reference's enterView data-interactions, which apply
       .brx-animate-fadeInUp / .brx-animate-zoomIn to elements as they scroll in.

       Two safety properties:
         - the `js` class is set from JS, and the CSS only hides `[data-reveal]`
           under `.js`, so a no-JS visitor always sees all content;
         - anything already on screen is revealed immediately rather than animated,
           so there is no flash of hidden content on load. */
    document.documentElement.classList.add('js');

    var REVEAL_TARGETS = [
      ['.service-card', 'up'],
      ['.stat', 'up'],
      ['.section-intro', 'up'],
      ['.testimonial', 'up'],
      ['.faq-item', 'up'],
      ['.feature', 'up'],
      ['.quote-card', 'up'],
      ['.prose', 'up'],
      ['.cta-band__inner', 'up'],
      ['.brand-card', 'zoom']
    ];
    /* A page can opt back in with <html data-motion="on"> - the dark fork does,
       so the entrance animations still run on machines where Windows animation
       effects (and therefore prefers-reduced-motion) are switched off. */
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && document.documentElement.getAttribute('data-motion') !== 'on';
    var observer = null;
    if (!reduce && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    }
    REVEAL_TARGETS.forEach(function (pair) {
      document.querySelectorAll(pair[0]).forEach(function (el) {
        el.setAttribute('data-reveal', pair[1]);
        if (!observer || el.getBoundingClientRect().top < window.innerHeight * 0.9) {
          el.classList.add('is-revealed');
        } else {
          observer.observe(el);
        }
      });
    });

    /* ----------------------------------------------------------- image fade-in
       Parity with .perfmatters-lazy.pmloaded { animation: pmFadeIn .5s } */
    document.querySelectorAll('main img').forEach(function (img) {
      if (img.complete) {
        img.classList.add('is-loaded');
        return;
      }
      img.addEventListener('load', function () { img.classList.add('is-loaded'); });
    });

    /* ---------------------------------------------------------- demo form */
    document.querySelectorAll('form[data-demo-form]').forEach(function (form) {
      var status = form.querySelector('.form-status');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        if (status) {
          status.className = 'form-status is-success';
          status.textContent =
            'Demo only: this template form is not connected to a backend. ' +
            'Submitted values were not sent anywhere.';
          status.hidden = false;
        }
        form.reset();
      });
    });

    /* ------------------------------------------------------- sample call player
       The illustration is the only control and animates from page load. The
       `is-playing` class switches its accents to live green while the sample
       audio runs; pausing or finishing returns them to orange. */
    var call = document.querySelector('[data-sample-call]');
    if (call) {
      var callAudio = call.querySelector('.sample-call__audio');
      var callSurface = call.querySelector('.sample-call__surface');

      function setPressed(playing) {
        if (callSurface) callSurface.setAttribute('aria-pressed', playing ? 'true' : 'false');
      }

      function toggleCall() {
        if (callAudio.paused) {
          var attempt = callAudio.play();
          if (attempt && attempt.catch) {
            attempt.catch(function () { setPressed(false); });
          }
        } else {
          callAudio.pause();
        }
      }

      if (callSurface) callSurface.addEventListener('click', toggleCall);
      callAudio.addEventListener('play', function () {
        call.classList.add('is-playing');
        setPressed(true);
      });
      callAudio.addEventListener('pause', function () {
        call.classList.remove('is-playing');
        setPressed(false);
      });
      callAudio.addEventListener('ended', function () {
        callAudio.pause();
        callAudio.currentTime = 0;
        call.classList.remove('is-playing');
        setPressed(false);
      });
    }
  });
})();
