/**
 * Nænsomt – script.js
 * Vanilla JS only. No libraries, no frameworks.
 * Features:
 *   1. Smooth scroll for anchor links
 *   2. Sticky header shadow on scroll
 *   3. Mobile nav toggle
 *   4. Product accordion (Learn more)
 *   5. Scroll-reveal via IntersectionObserver
 *   6. Contact form client-side validation
 *   7. Footer year update
 */
'use strict';
/* ─────────────────────────────────────────────
   1. SMOOTH SCROLL
   All internal <a href="#..."> links.
───────────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      // Close mobile menu if open
      closeMobileMenu();
      const navHeight = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-h')
          .trim()
      ) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top: top, behavior: 'smooth' });
      // Move focus to target for accessibility
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
})();
/* ─────────────────────────────────────────────
   2. STICKY HEADER SHADOW
───────────────────────────────────────────── */
(function initHeaderScroll() {
  var header = document.querySelector('.site-header');
  if (!header) return;
  function updateHeader() {
    if (window.scrollY > 8) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader(); // run on load
})();
/* ─────────────────────────────────────────────
   3. MOBILE NAV TOGGLE
───────────────────────────────────────────── */
var mobileMenuOpen = false;
function closeMobileMenu() {
  var toggle = document.getElementById('navToggle');
  var menu   = document.getElementById('navMenu');
  if (!toggle || !menu) return;
  mobileMenuOpen = false;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
  menu.classList.remove('is-open');
}
(function initMobileNav() {
  var toggle = document.getElementById('navToggle');
  var menu   = document.getElementById('navMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', function () {
    mobileMenuOpen = !mobileMenuOpen;
    toggle.setAttribute('aria-expanded', String(mobileMenuOpen));
    toggle.setAttribute('aria-label', mobileMenuOpen ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', mobileMenuOpen);
  });
  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenuOpen) {
      closeMobileMenu();
      toggle.focus();
    }
  });
  // Close when clicking outside nav
  document.addEventListener('click', function (e) {
    if (mobileMenuOpen && !e.target.closest('.nav-inner')) {
      closeMobileMenu();
    }
  });
})();
/* ─────────────────────────────────────────────
   4. PRODUCT ACCORDION (Learn more)
───────────────────────────────────────────── */
(function initAccordions() {
  var toggles = document.querySelectorAll('.accordion-toggle');
  toggles.forEach(function (toggle) {
    var bodyId = toggle.getAttribute('aria-controls');
    var body   = bodyId ? document.getElementById(bodyId) : null;
    if (!body) return;
    toggle.addEventListener('click', function () {
      var isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      // Collapse all others in the same parent context (optional: isolate per card)
      toggles.forEach(function (otherToggle) {
        if (otherToggle !== toggle) {
          var otherId   = otherToggle.getAttribute('aria-controls');
          var otherBody = otherId ? document.getElementById(otherId) : null;
          if (otherBody && !otherBody.hidden) {
            otherToggle.setAttribute('aria-expanded', 'false');
            otherBody.hidden = true;
            otherBody.classList.remove('is-open');
          }
        }
      });
      // Toggle this one
      if (isExpanded) {
        toggle.setAttribute('aria-expanded', 'false');
        body.hidden = true;
        body.classList.remove('is-open');
      } else {
        toggle.setAttribute('aria-expanded', 'true');
        body.hidden = false;
        // Small rAF so the hidden→visible transition fires correctly
        requestAnimationFrame(function () {
          body.classList.add('is-open');
        });
      }
    });
  });
})();
/* ─────────────────────────────────────────────
   5. SCROLL REVEAL (IntersectionObserver)
───────────────────────────────────────────── */
(function initScrollReveal() {
  // Respect user preference for reduced motion
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Make all reveal elements immediately visible
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
    return;
  }
  if (!('IntersectionObserver' in window)) {
    // Fallback: show everything
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
    return;
  }
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // reveal once
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );
  // Add staggered delay to product cards and ecology cards
  var staggeredGroups = [
    { selector: '.product-card', delay: 80 },
    { selector: '.ecology-card', delay: 80 },
    { selector: '.timeline-step', delay: 100 }
  ];
  staggeredGroups.forEach(function (group) {
    document.querySelectorAll(group.selector).forEach(function (el, i) {
      el.style.transitionDelay = (i * group.delay) + 'ms';
    });
  });
  document.querySelectorAll('.reveal').forEach(function (el) {
    observer.observe(el);
  });
})();
/* ─────────────────────────────────────────────
   6. CONTACT FORM — CLIENT-SIDE VALIDATION
───────────────────────────────────────────── */
(function initContactForm() {
  var form    = document.getElementById('contactForm');
  var success = document.getElementById('formSuccess');
  if (!form || !success) return;
  /**
   * Returns an error string or '' if valid.
   */
  function validateField(field) {
    var val = field.value.trim();
    if (!val) return 'This field is required.';
    if (field.type === 'email') {
      // Simple RFC-ish email check
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRe.test(val)) return 'Please enter a valid email address.';
    }
    if (field.tagName === 'TEXTAREA' && val.length < 10) {
      return 'Please write at least 10 characters.';
    }
    return '';
  }
  function showError(field, msg) {
    var errorEl = document.getElementById(field.id + '-error');
    field.classList.toggle('is-invalid', !!msg);
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (errorEl) errorEl.textContent = msg;
  }
  function clearError(field) {
    showError(field, '');
  }
  // Live validation on blur
  form.querySelectorAll('input, textarea').forEach(function (field) {
    field.addEventListener('blur', function () {
      showError(field, validateField(field));
    });
    field.addEventListener('input', function () {
      // Clear error while the user is correcting
      if (field.classList.contains('is-invalid')) {
        clearError(field);
      }
    });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fields  = Array.from(form.querySelectorAll('input, textarea'));
    var isValid = true;
    fields.forEach(function (field) {
      var msg = validateField(field);
      showError(field, msg);
      if (msg) isValid = false;
    });
    if (!isValid) {
      // Focus first invalid field
      var firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    // All good — show success message (no server submit)
    form.querySelectorAll('input, textarea').forEach(function (f) {
      f.value = '';
      clearError(f);
    });
    success.hidden = false;
    requestAnimationFrame(function () {
      success.classList.add('is-visible');
    });
    // Scroll to success
    success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // Hide success after 6 seconds
    setTimeout(function () {
      success.classList.remove('is-visible');
      setTimeout(function () {
        success.hidden = true;
      }, 300);
    }, 6000);
  });
})();
/* ─────────────────────────────────────────────
   7. FOOTER YEAR
───────────────────────────────────────────── */
(function setFooterYear() {
  var el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
})();
