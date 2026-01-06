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

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = document.querySelectorAll(".reveal");
  const markerItems = document.querySelectorAll(".marker-line");
  const quoteItems = document.querySelectorAll(".quote-track");
  const finalCta = document.querySelector(".cta-secondary");
  const heroTitle = document.querySelector(".hero-title");

  const makeVisible = (element) => {
    element.classList.add("is-visible");
  };

  if (heroTitle) {
    const wordsPerSecond = 5.5;
    const baseDelay = 0.15;
    const walker = document.createTreeWalker(
      heroTitle,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.nodeType === Node.TEXT_NODE) {
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
        const words = textSoFar.trim().split(/\s+/).filter(Boolean).length;
        const rawDelay = baseDelay + words / wordsPerSecond;
        const delay = Math.min(4.5, Math.max(0.6, rawDelay));
        node.style.setProperty("--marker-delay", `${delay.toFixed(2)}s`);
        textSoFar += ` ${node.textContent}`;
      }
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
      threshold: 0.2,
      rootMargin: "0px 0px -12% 0px"
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

  if (finalCta) {
    const ctaObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("cta-glint");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.65
      }
    );

    ctaObserver.observe(finalCta);
  }
});
