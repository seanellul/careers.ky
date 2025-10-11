import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useReducedMotion() {
  const prefers = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  return prefers;
}

export function useHeroIntro(ref) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!ref?.current) return;
    if (reduced) {
      gsap.set(ref.current, { opacity: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.0, ease: "power3.out", delay: 0.1 });
      const lines = ref.current.querySelectorAll("h1 span");
      if (lines?.length) {
        gsap.from(lines, { y: 30, opacity: 0, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.1 });
      }
    }, ref);
    return () => ctx.revert();
  }, [ref, reduced]);
}

export function useParallaxBackground(rootRef, selector = "#bg-gradient") {
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = rootRef?.current?.querySelector(selector);
    if (!el) return;
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.to(el, { backgroundPosition: "200% 50%", duration: 24, ease: "none", repeat: -1 });
    }, rootRef);
    return () => ctx.revert();
  }, [rootRef, selector, reduced]);
}

export function useFadeInOnScroll(refs) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!refs?.current) return;
    if (reduced) {
      refs.current.forEach((el) => el && gsap.set(el, { opacity: 1, y: 0 }));
      return;
    }
    const animations = [];
    refs.current.forEach((el) => {
      if (!el) return;
      const anim = gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none reverse" },
        }
      );
      animations.push(anim);
    });
    return () => animations.forEach((a) => a?.kill());
  }, [refs, reduced]);
}

export function useHoverFloat(selectorOrRef, options = {}) {
  const { y = -4, shadow = true } = options;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    let items = [];
    if (selectorOrRef?.current) {
      const el = selectorOrRef.current;
      items = el ? [el] : [];
    } else if (typeof selectorOrRef === "string") {
      items = Array.from(document.querySelectorAll(selectorOrRef));
    }
    if (!items.length) return;
    const onEnter = (el) => gsap.to(el, { y, boxShadow: shadow ? "0 10px 30px rgba(56,189,248,0.15)" : undefined, duration: 0.3, ease: "power3.out" });
    const onLeave = (el) => gsap.to(el, { y: 0, boxShadow: shadow ? "0 0 0 rgba(0,0,0,0)" : undefined, duration: 0.4, ease: "power3.out" });
    const handlers = [];
    items.forEach((el) => {
      const enter = () => onEnter(el);
      const leave = () => onLeave(el);
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      handlers.push([el, enter, leave]);
    });
    return () => handlers.forEach(([el, enter, leave]) => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    });
  }, [selectorOrRef, y, shadow, reduced]);
}

export function useMarqueeControl(selector = "#explore .animate-[marquee_24s_linear_infinite]") {
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = typeof document !== "undefined" ? document.querySelector(selector) : null;
    if (!el) return;
    if (reduced) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => el.style.animationPlayState = "running",
      onEnterBack: () => el.style.animationPlayState = "running",
      onLeave: () => el.style.animationPlayState = "paused",
      onLeaveBack: () => el.style.animationPlayState = "paused",
    });
    return () => st.kill();
  }, [selector, reduced]);
}

export function useStaggerList(selectorOrEls, opts = {}) {
  const { duration = 0.5, stagger = 0.05, y = 20 } = opts;
  const reduced = useReducedMotion();
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return; // run once
    const els = Array.isArray(selectorOrEls)
      ? selectorOrEls
      : (typeof document !== "undefined" && typeof selectorOrEls === "string")
        ? document.querySelectorAll(selectorOrEls)
        : null;
    if (!els || els.length === 0) return;
    ran.current = true;
    if (reduced) {
      els.forEach((el) => gsap.set(el, { opacity: 1, y: 0 }));
      return;
    }
    const tween = gsap.fromTo(
      els,
      { opacity: 0, y },
      { opacity: 1, y: 0, duration, stagger, ease: "power3.out" }
    );
    return () => tween.kill();
  }, [selectorOrEls, duration, stagger, y, reduced]);
}

export function useAccordionMotion(containerRef) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const root = containerRef?.current;
    if (!root || reduced) return;
    const triggers = root.querySelectorAll("button[data-state]");
    const observers = [];
    triggers.forEach((btn) => {
      const observer = new MutationObserver(() => {
        const content = btn.parentElement?.nextElementSibling;
        if (!content) return;
        const isOpen = btn.getAttribute("data-state") === "open";
        if (isOpen) {
          gsap.fromTo(content, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.5, ease: "back.out(1.5)" });
        } else {
          gsap.to(content, { height: 0, opacity: 0, duration: 0.3, ease: "power2.inOut" });
        }
      });
      observer.observe(btn, { attributes: true, attributeFilter: ["data-state"] });
      observers.push(observer);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, [containerRef, reduced]);
}

export function useCTAGradientPulse(selector = "#cta-gradient") {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const el = typeof document !== "undefined" ? document.querySelector(selector) : null;
    if (!el) return;
    const tween = gsap.to(el, { backgroundPosition: "200% 50%", duration: 30, ease: "none", repeat: -1 });
    return () => tween.kill();
  }, [selector, reduced]);
}

export function useFooterReveal(selector = "footer a") {
  const reduced = useReducedMotion();
  useEffect(() => {
    const els = typeof document !== "undefined" ? document.querySelectorAll(selector) : null;
    if (!els || !els.length) return;
    if (reduced) return;
    const st = gsap.from(els, {
      scrollTrigger: { trigger: "footer", start: "top 90%" },
      y: 16,
      opacity: 0,
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.08,
    });
    return () => st.kill();
  }, [selector, reduced]);
}


