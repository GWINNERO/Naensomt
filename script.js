/**
* Nænsomt – script.js
 * Vanilla JS only. No libraries, no frameworks.
 *
 * Features:
 *   1. Progressive-enhancement flag (enables reveal animations)
 *   2. Smooth scroll for anchor links (uses real header height)
 *   3. Sticky header shadow on scroll
 *   4. Mobile nav toggle (Esc + outside-click closes)
 *   5. Product accordion (only one open at a time)
 *   6. Scroll-reveal via IntersectionObserver (with fallbacks)
 *   7. Contact form client-side validation + mailto handoff
 *   8. Footer year update
 */
'use strict';

/* ─────────────────────────────────────────────
   0. Progressive-enhancement flag
   Marks the document so CSS may hide .reveal
   elements before they animate in. Without JS,
   nothing is hidden.
───────────────────────────────────────────── */
document.documentElement.classList.add('js-anim');

var prefersReducedMotion = window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function getHeaderHeight() {
  var header = document.querySelector('.site-header');
  return header ? Math.round(header.getBoundingClientRect().height) : 72;
}

/* ─────────────────────────────────────────────
   1. SMOOTH SCROLL for internal anchors
───────────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();

      closeMobileMenu();

      var top = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight() - 8;
      window.scrollTo({
        top: top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

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
    if (window.scrollY > 8) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
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

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
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
   4. PRODUCT ACCORDION — only one open at a time
───────────────────────────────────────────── */
(function initAccordions() {
  var toggles = document.querySelectorAll('.accordion-toggle');
  if (!toggles.length) return;

  function closeToggle(toggle) {
    var bodyId = toggle.getAttribute('aria-controls');
    var body   = bodyId ? document.getElementById(bodyId) : null;
    toggle.setAttribute('aria-expanded', 'false');
    if (body) { body.hidden = true; body.classList.remove('is-open'); }
  }

  toggles.forEach(function (toggle) {
    var bodyId = toggle.getAttribute('aria-controls');
    var body   = bodyId ? document.getElementById(bodyId) : null;
    if (!body) return;

    toggle.addEventListener('click', function () {
      var isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      // Collapse all others
      toggles.forEach(function (other) { if (other !== toggle) closeToggle(other); });

      if (isExpanded) {
        closeToggle(toggle);
      } else {
        toggle.setAttribute('aria-expanded', 'true');
        body.hidden = false;
        requestAnimationFrame(function () { body.classList.add('is-open'); });
      }
    });
  });
})();

/* ─────────────────────────────────────────────
   5. SCROLL REVEAL (IntersectionObserver)
   Progressive enhancement: without JS, .reveal
   elements stay visible. If IO is missing or
   the user prefers reduced motion, show all.
───────────────────────────────────────────── */
(function initScrollReveal() {
  var revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  // Staggered delays for grouped items
  var staggered = [
    { selector: '.product-card',  delay: 80 },
    { selector: '.ecology-card',  delay: 80 },
    { selector: '.timeline-step', delay: 100 }
  ];
  staggered.forEach(function (group) {
    document.querySelectorAll(group.selector).forEach(function (el, i) {
      el.style.transitionDelay = (i * group.delay) + 'ms';
    });
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(function (el) { observer.observe(el); });
})();

/* ─────────────────────────────────────────────
   6. CONTACT FORM — client-side validation +
      mailto: handoff (no server, no third party)
───────────────────────────────────────────── */
(function initContactForm() {
  var form    = document.getElementById('contactForm');
  var success = document.getElementById('formSuccess');
  if (!form) return;

  function validateField(field) {
    var val = field.value.trim();
    if (!val) return 'This field is required.';
    if (field.type === 'email') {
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
  function clearError(field) { showError(field, ''); }

  form.querySelectorAll('input, textarea').forEach(function (field) {
    field.addEventListener('blur',  function () { showError(field, validateField(field)); });
    field.addEventListener('input', function () {
      if (field.classList.contains('is-invalid')) clearError(field);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fields  = Array.prototype.slice.call(form.querySelectorAll('input, textarea'));
    var isValid = true;
    fields.forEach(function (field) {
      var msg = validateField(field);
      showError(field, msg);
      if (msg) isValid = false;
    });
    if (!isValid) {
      var firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Build a mailto: link — the user's mail client handles it.
    var nameField    = document.getElementById('name');
    var emailField   = document.getElementById('email');
    var messageField = document.getElementById('message');
    var subject = 'Website enquiry from ' + (nameField ? nameField.value.trim() : '');
    var body    = (messageField ? messageField.value.trim() : '') +
                  '\n\n— ' + (nameField  ? nameField.value.trim()  : '') +
                  '\n'    + (emailField ? emailField.value.trim() : '');
    var href = 'mailto:naensomt@gmail.com' +
               '?subject=' + encodeURIComponent(subject) +
               '&body='    + encodeURIComponent(body);
    window.location.href = href;

    if (success) {
      success.hidden = false;
      requestAnimationFrame(function () { success.classList.add('is-visible'); });
      setTimeout(function () {
        success.classList.remove('is-visible');
        setTimeout(function () { success.hidden = true; }, 300);
      }, 8000);
    }
  });
})();

/* ─────────────────────────────────────────────
   7. FOOTER YEAR
───────────────────────────────────────────── */
(function setFooterYear() {
  var el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
})();