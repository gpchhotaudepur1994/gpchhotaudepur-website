// Government Polytechnic, Chhotaudepur — Training & Placement gallery carousel
// Page-scoped: only training-placement.html loads this file, so unlike
// js/main.js it never needs to work from more than one page depth. See
// CLAUDE.md "Path & link conventions".

document.addEventListener("DOMContentLoaded", initTrainingPlacementCarousel);

function initTrainingPlacementCarousel() {
  var carousel = document.getElementById("tpo-carousel");
  if (!carousel) return;

  var slides = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-slide"));
  var dots = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-dot"));
  if (slides.length < 2) return;

  var AUTOPLAY_MS = 4000;
  // Matches the CSS transition durations in .carousel-slide / the
  // prefers-reduced-motion override, so the leaving slide is only reset
  // after its transition has actually finished.
  var TRANSITION_MS = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 400 : 900;

  var current = 0; // slide 0 starts as .is-active in the markup
  var autoplayTimer = null;
  var leaveTimer = null;

  function goTo(index) {
    var total = slides.length;
    index = ((index % total) + total) % total;
    if (index === current) return;

    var prevSlide = slides[current];
    var nextSlide = slides[index];

    window.clearTimeout(leaveTimer);
    prevSlide.classList.remove("is-active");
    nextSlide.classList.remove("is-leaving");

    prevSlide.classList.add("is-leaving");
    prevSlide.setAttribute("aria-hidden", "true");
    nextSlide.classList.add("is-active");
    nextSlide.setAttribute("aria-hidden", "false");

    dots.forEach(function (dot, i) {
      var isCurrent = i === index;
      dot.classList.toggle("is-active", isCurrent);
      if (isCurrent) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    // The leaving slide is fully transparent for the whole move, so resetting
    // its position back to the right once the fade finishes is invisible to
    // the visitor — it's just ready to enter from the right again next time.
    leaveTimer = window.setTimeout(function () {
      prevSlide.classList.remove("is-leaving");
    }, TRANSITION_MS + 50);

    current = index;
  }

  function next() {
    goTo(current + 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = window.setInterval(next, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (autoplayTimer) window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      goTo(i);
      startAutoplay();
    });
  });

  // Pause while the visitor is pointing at or has keyboard focus on the
  // carousel (WCAG 2.2.2 — auto-updating content needs a way to pause it).
  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);
  carousel.addEventListener("focusin", stopAutoplay);
  carousel.addEventListener("focusout", startAutoplay);

  startAutoplay();
}
