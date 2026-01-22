window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lato", "sans-serif"]
      },
      colors: {
        brand: {
          dark: "#100135",
          purple: "#640FEA",
          white: "#FFFFFF",
          black: "#000000",
          green: "#0FFC7E",
          gray: {
            light: "#DFE4EA",
            mid: "#B8BEC4"
          }
        }
      }
    }
  }
};

document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = document.querySelectorAll(".reveal");
  const markerItems = document.querySelectorAll(".marker-line");
  const quoteItems = document.querySelectorAll(".quote-track");
  const heroTitle = document.querySelector(".hero-title");
  const stickyCta = document.querySelector(".sticky-cta");
  const stickyCtaButton = stickyCta ? stickyCta.querySelector("a") : null;
  const stickyCtaTargets = document.querySelectorAll("[data-cta-watch]");
  const bookingForm = document.querySelector("#bookingForm");
  const bookingFields = bookingForm ? Array.from(bookingForm.querySelectorAll("[data-validate]")) : [];
  const submissionModal = document.querySelector("#submissionModal");
  const submissionModalCard = submissionModal ? submissionModal.querySelector(".modal-card") : null;
  const submissionModalClose = submissionModal ? submissionModal.querySelector(".modal-close") : null;
  const submissionProgress = submissionModal ? submissionModal.querySelector(".modal-progress") : null;
  const submissionProgressBar = submissionModal ? submissionModal.querySelector(".modal-progress-bar") : null;
  const submissionProgressDuration = prefersReducedMotion ? 250 : 2400;
  let lastActiveElement = null;
  let progressAnimationFrame = null;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const makeVisible = (element) => {
    element.classList.add("is-visible");
  };

  const setStickyCtaState = (shouldShow) => {
    if (!stickyCta) {
      return;
    }
    stickyCta.classList.toggle("is-visible", shouldShow);
    if (!stickyCtaButton) {
      return;
    }
    if (shouldShow) {
      stickyCta.removeAttribute("aria-hidden");
      stickyCtaButton.removeAttribute("tabindex");
      return;
    }
    stickyCta.setAttribute("aria-hidden", "true");
    stickyCtaButton.setAttribute("tabindex", "-1");
  };

  const getFieldErrorElement = (field) => {
    const describedBy = field.getAttribute("aria-describedby");
    if (describedBy) {
      const errorElement = document.getElementById(describedBy);
      if (errorElement) {
        return errorElement;
      }
    }
    const fieldWrapper = field.closest(".booking-field");
    return fieldWrapper ? fieldWrapper.querySelector(".field-error") : null;
  };

  const setFieldError = (field, message) => {
    const fieldWrapper = field.closest(".booking-field");
    if (fieldWrapper) {
      fieldWrapper.classList.add("has-error");
    }
    field.setAttribute("aria-invalid", "true");
    const errorElement = getFieldErrorElement(field);
    if (errorElement) {
      errorElement.textContent = message;
    }
  };

  const clearFieldError = (field) => {
    const fieldWrapper = field.closest(".booking-field");
    if (fieldWrapper) {
      fieldWrapper.classList.remove("has-error");
    }
    field.setAttribute("aria-invalid", "false");
    const errorElement = getFieldErrorElement(field);
    if (errorElement) {
      errorElement.textContent = "";
    }
  };

  const getFieldErrorMessage = (field) => {
    const value = field.value.trim();
    if (field.hasAttribute("required") && value === "") {
      return field.dataset.requiredMessage || "Este campo es obligatorio.";
    }
    if (field.type === "email" && value !== "" && !emailPattern.test(value)) {
      return field.dataset.invalidMessage || "Ingresa un correo valido.";
    }
    return "";
  };

  const validateBookingForm = () => {
    if (!bookingFields.length) {
      return true;
    }
    let isValid = true;
    let firstInvalidField = null;

    bookingFields.forEach((field) => {
      const errorMessage = getFieldErrorMessage(field);
      if (errorMessage) {
        setFieldError(field, errorMessage);
        isValid = false;
        if (!firstInvalidField) {
          firstInvalidField = field;
        }
      } else {
        clearFieldError(field);
      }
    });

    if (firstInvalidField) {
      firstInvalidField.focus();
    }

    return isValid;
  };

  const resetSubmissionProgress = () => {
    if (progressAnimationFrame) {
      cancelAnimationFrame(progressAnimationFrame);
      progressAnimationFrame = null;
    }
    if (submissionProgressBar) {
      submissionProgressBar.style.transform = "scaleX(0)";
    }
    if (submissionProgress) {
      submissionProgress.setAttribute("aria-valuenow", "0");
    }
  };

  const startSubmissionProgress = () => {
    if (!submissionModal || !submissionProgress || !submissionProgressBar) {
      completeSubmissionModal();
      return;
    }
    resetSubmissionProgress();
    submissionModal.classList.add("is-loading");
    const startTime = performance.now();

    const updateProgress = (now) => {
      if (!submissionModal.classList.contains("is-open")) {
        resetSubmissionProgress();
        return;
      }
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / submissionProgressDuration, 1);
      submissionProgressBar.style.transform = `scaleX(${progress})`;
      submissionProgress.setAttribute("aria-valuenow", `${Math.round(progress * 100)}`);
      if (progress < 1) {
        progressAnimationFrame = requestAnimationFrame(updateProgress);
        return;
      }
      progressAnimationFrame = null;
      completeSubmissionModal();
    };

    progressAnimationFrame = requestAnimationFrame(updateProgress);
  };

  const openSubmissionModal = () => {
    if (!submissionModal) {
      return;
    }
    lastActiveElement = document.activeElement;
    submissionModal.classList.add("is-open");
    submissionModal.classList.remove("is-complete", "is-loading");
    submissionModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    resetSubmissionProgress();
    if (submissionModalClose) {
      submissionModalClose.setAttribute("disabled", "");
    }
    if (submissionModalCard) {
      submissionModalCard.focus();
    }
  };

  const completeSubmissionModal = () => {
    if (!submissionModal || submissionModal.classList.contains("is-complete")) {
      return;
    }
    submissionModal.classList.add("is-complete");
    submissionModal.classList.remove("is-loading");
    if (bookingForm) {
      bookingForm.classList.add("is-submitted");
    }
    if (submissionModalClose) {
      submissionModalClose.removeAttribute("disabled");
      submissionModalClose.focus();
    }
  };

  const closeSubmissionModal = () => {
    if (!submissionModal) {
      return;
    }
    submissionModal.classList.remove("is-open", "is-complete", "is-loading");
    submissionModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    resetSubmissionProgress();
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus();
    }
  };

  if (bookingForm) {
    bookingFields.forEach((field) => {
      field.addEventListener("input", () => {
        const fieldWrapper = field.closest(".booking-field");
        if (!fieldWrapper || !fieldWrapper.classList.contains("has-error")) {
          return;
        }
        const errorMessage = getFieldErrorMessage(field);
        if (errorMessage) {
          setFieldError(field, errorMessage);
          return;
        }
        clearFieldError(field);
      });

      field.addEventListener("blur", () => {
        const errorMessage = getFieldErrorMessage(field);
        if (errorMessage) {
          setFieldError(field, errorMessage);
          return;
        }
        clearFieldError(field);
      });
    });

    bookingForm.addEventListener("submit", (event) => {
      if (!validateBookingForm()) {
        event.preventDefault();
        return;
      }
      bookingForm.classList.remove("is-submitted");
      openSubmissionModal();
      startSubmissionProgress();
    });
  }

  if (submissionModal && submissionModalClose) {
    submissionModalClose.addEventListener("click", () => {
      if (submissionModalClose.hasAttribute("disabled")) {
        return;
      }
      closeSubmissionModal();
    });

    submissionModal.addEventListener("click", (event) => {
      if (event.target !== submissionModal) {
        return;
      }
      if (!submissionModal.classList.contains("is-complete")) {
        return;
      }
      closeSubmissionModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }
      if (!submissionModal.classList.contains("is-open")) {
        return;
      }
      if (!submissionModal.classList.contains("is-complete")) {
        return;
      }
      closeSubmissionModal();
    });
  }

  if (heroTitle) {
    const wordsPerSecondDelay = 4.2;
    const wordsPerSecondDuration = 1.4;
    const baseDelay = 0.25;
    const minDelay = 0.5;
    const maxDelay = 3.6;
    const minDuration = 2.2;
    const maxDuration = 5.0;
    const walker = document.createTreeWalker(
      heroTitle,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            if (node.parentElement && node.parentElement.classList.contains("marker-line")) {
              return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
          if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("marker-line")) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let textSoFar = "";
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE) {
        textSoFar += ` ${node.textContent}`;
        continue;
      }
      if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("marker-line")) {
        const wordsBefore = textSoFar.trim().split(/\s+/).filter(Boolean).length;
        const offset = Number.parseFloat(node.dataset.markerOffset || "0") || 0;
        const rawDelay = baseDelay + wordsBefore / wordsPerSecondDelay + offset;
        const delay = Math.min(maxDelay, Math.max(minDelay, rawDelay));
        node.style.setProperty("--marker-delay", `${delay.toFixed(2)}s`);
        const wordsInMarker = node.textContent.trim().split(/\s+/).filter(Boolean).length;
        const rawDuration = wordsInMarker / wordsPerSecondDuration;
        const duration = Math.min(maxDuration, Math.max(minDuration, rawDuration));
        node.style.setProperty("--marker-duration", `${duration.toFixed(2)}s`);
        textSoFar += ` ${node.textContent}`;
      }
    }
  }

  if (stickyCta && stickyCtaTargets.length) {
    const visibleTargets = new Set();
    const updateStickyCta = () => {
      setStickyCtaState(visibleTargets.size === 0);
    };

    if ("IntersectionObserver" in window) {
      const ctaObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleTargets.add(entry.target);
              return;
            }
            visibleTargets.delete(entry.target);
          });
          updateStickyCta();
        },
        {
          threshold: 0.01
        }
      );

      stickyCtaTargets.forEach((target) => ctaObserver.observe(target));
    } else {
      let ticking = false;

      const checkVisibility = () => {
        visibleTargets.clear();
        stickyCtaTargets.forEach((target) => {
          const rect = target.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < window.innerHeight) {
            visibleTargets.add(target);
          }
        });
        updateStickyCta();
      };

      const scheduleCheck = () => {
        if (ticking) {
          return;
        }
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          checkVisibility();
        });
      };

      window.addEventListener("scroll", scheduleCheck, { passive: true });
      window.addEventListener("resize", scheduleCheck);
      checkVisibility();
    }
  }

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(makeVisible);
    markerItems.forEach(makeVisible);
    quoteItems.forEach(makeVisible);
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        makeVisible(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px 10% 0px"
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  const markerObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.55,
      rootMargin: "0px 0px -30% 0px"
    }
  );

  markerItems.forEach((item) => markerObserver.observe(item));

  if (quoteItems.length) {
    const quoteObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -20% 0px"
      }
    );

    quoteItems.forEach((item) => quoteObserver.observe(item));
  }

});
