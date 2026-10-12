// Layout probe: finds visible jumps. It needs no React and no DevTools hook, so it works on any page.
//
// Use: paste this whole file into the page (devtools console, or the "evaluate JavaScript" call of
// a browser tool). It starts at once. Then do the interaction and read the result:
//   __layoutProbe.report()                              -> { frames, jumps, shrinks, shifts, ... }
//   __layoutProbe.start({ scroller: "#messages" })      -> start again with other options
//   __layoutProbe.reset()                               -> clear the data, keep the options
//   __layoutProbe.stop()                                -> stop recording
//
// Options (pass to start(), or set `window.__layoutProbeOptions` before you paste):
//   scroller   CSS selector of the scroll container. Default: the page scroller.
//   observe    CSS selector of elements to watch for shrinking. Default: the scroller's children
//              and grandchildren. Elements added later are watched too.
//   shrinkPx   Report an element that loses more than this height in one step. Default 20.
//   dropPx     Report a frame where the scroll height falls by more than this. Default 30.
//   jumpPx     Report a frame where the scroll position moves by more than this. Default 150.
//
// How to read the report:
//   jumps      `dHeight` far below zero that comes back in the next frames: content collapsed and
//              grew again (a remount, or data that was empty for a moment). `dTop` with no height
//              change: scroll code moved the view. `msSinceInput` under about 100: the person
//              scrolled, so it is not a bug. `null`: no input since the probe started.
//   shrinks    The elements that lost height, newest last. Match their time `t` with a jump.
//   shifts     Layout Shift entries of the browser with the moved elements (Chromium only).
//              Shifts in the 500 ms after input are not included.
//
// Timing: the probe reads sizes in a task after each animation frame, which is after the paint. A
// read inside the frame callback can show a state that the browser never paints. A hidden or
// background tab gets no frames: bring the tab to the front first, and check `frames` is above 0.
(() => {
  window.__layoutProbe?.stop();

  let options = { scroller: null, observe: null, shrinkPx: 20, dropPx: 30, jumpPx: 150 };
  let running = false;
  let frames = [];
  let shrinks = [];
  let shifts = [];
  let sizes = new WeakMap();
  let watched = new WeakSet();
  let lastInput = -Infinity;
  let resizeObserver;
  let mutationObserver;
  let shiftObserver;

  const describe = (element) => {
    if (!(element instanceof Element)) return String(element?.nodeName ?? element);
    const parts = [element.tagName.toLowerCase()];
    if (element.id) parts.push(`#${element.id}`);
    for (const name of ["data-testid", "data-slot", "role", "aria-label"]) {
      const value = element.getAttribute(name);
      if (value) parts.push(`[${name}="${value.slice(0, 40)}"]`);
    }
    const classes = typeof element.className === "string" ? element.className.trim() : "";
    if (classes) parts.push(`.${classes.split(/\s+/).slice(0, 3).join(".")}`);
    return parts.join("");
  };

  const scrollerElement = () =>
    (options.scroller ? document.querySelector(options.scroller) : null) ?? document.scrollingElement;
  const observedElements = () => {
    if (options.observe) return document.querySelectorAll(options.observe);
    const scroller = scrollerElement();
    return scroller ? scroller.querySelectorAll(":scope > *, :scope > * > *") : [];
  };
  const watchElements = () => {
    for (const element of observedElements()) {
      if (watched.has(element)) continue;
      watched.add(element);
      resizeObserver.observe(element);
    }
  };

  const sample = () => {
    if (!running) return;
    const scroller = scrollerElement();
    if (scroller) {
      frames.push({
        t: Math.round(performance.now()),
        top: Math.round(scroller.scrollTop),
        height: Math.round(scroller.scrollHeight),
        msSinceInput: Math.round(performance.now() - lastInput),
      });
      if (frames.length > 20000) frames.shift();
    }
    requestAnimationFrame(afterPaint);
  };
  // A message task runs after the frame's style, layout, and paint. A timer can be clamped to 4 ms.
  const channel = new MessageChannel();
  channel.port1.onmessage = sample;
  const afterPaint = () => channel.port2.postMessage(0);

  const onInput = () => {
    lastInput = performance.now();
  };
  const INPUT_EVENTS = ["wheel", "touchmove", "keydown", "pointerdown"];

  const reset = () => {
    frames = [];
    shrinks = [];
    shifts = [];
  };

  const stop = () => {
    running = false;
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    shiftObserver?.disconnect();
    for (const type of INPUT_EVENTS) removeEventListener(type, onInput, true);
  };

  window.__layoutProbe = {
    start(next = {}) {
      stop();
      options = { ...options, ...next };
      sizes = new WeakMap();
      watched = new WeakSet();
      reset();

      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = Math.round(entry.contentRect.height);
          const previous = sizes.get(entry.target);
          if (previous != null && height < previous - options.shrinkPx) {
            if (shrinks.length >= 500) shrinks.shift();
            shrinks.push({ t: Math.round(performance.now()), from: previous, to: height, element: describe(entry.target) });
          }
          sizes.set(entry.target, height);
        }
      });
      mutationObserver = new MutationObserver(watchElements);
      mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
      watchElements();

      if (PerformanceObserver.supportedEntryTypes?.includes("layout-shift")) {
        shiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.hadRecentInput) continue;
            if (shifts.length >= 500) shifts.shift();
            shifts.push({
              t: Math.round(entry.startTime),
              value: Math.round(entry.value * 10000) / 10000,
              elements: (entry.sources ?? []).slice(0, 3).map((source) => describe(source.node)),
            });
          }
        });
        shiftObserver.observe({ type: "layout-shift", buffered: false });
      }

      for (const type of INPUT_EVENTS) addEventListener(type, onInput, { capture: true, passive: true });
      running = true;
      requestAnimationFrame(afterPaint);
      const scroller = scrollerElement();
      return `Layout probe on. Scroller: ${scroller ? describe(scroller) : "not found yet"}`;
    },
    reset,
    stop,
    report({ last = 20 } = {}) {
      const jumps = [];
      for (let index = 1; index < frames.length; index += 1) {
        const dHeight = frames[index].height - frames[index - 1].height;
        const dTop = frames[index].top - frames[index - 1].top;
        if (dHeight < -options.dropPx || Math.abs(dTop) > options.jumpPx) {
          jumps.push({ t: frames[index].t, dHeight, dTop, msSinceInput: frames[index].msSinceInput });
        }
      }
      return {
        running,
        frames: frames.length,
        jumpCount: jumps.length,
        shrinkCount: shrinks.length,
        shiftTotal: Math.round(shifts.reduce((sum, shift) => sum + shift.value, 0) * 10000) / 10000,
        jumps: jumps.slice(-last),
        shrinks: shrinks.slice(-last),
        shifts: shifts.slice(-last),
      };
    },
  };
  return window.__layoutProbe.start(window.__layoutProbeOptions ?? {});
})();
