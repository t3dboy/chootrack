/* ============================================================================
   ChooTrack site: animation engine.
   Split-flap headline, scroll reveals, hero live↔past crossfade, board wall,
   theme screenshot swapping, train dividers, 3D phone tilt. No dependencies.
   ========================================================================== */
(function () {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------------------------------------------------- split-flap headline */
  $$("[data-flap]").forEach((line) => {
    const accent = line.dataset.accent; // amber | coral | undefined
    const text = line.textContent;
    line.textContent = "";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "flap-ch" + (ch === " " ? " sp" : "") + (accent && ch !== " " ? " " + accent : "");
      s.textContent = ch === " " ? " " : ch;
      s.style.setProperty("--i", i);
      if (!reduceMotion) s.classList.add("deal");
      line.appendChild(s);
    });
  });

  // Fit the headline: find the largest size at which EVERY row fits its
  // container on one line, then apply that same size to all rows (uniform).
  function fitFlapRows() {
    const rows = $$("[data-flap]");
    if (!rows.length) return;
    let common = Infinity;
    rows.forEach((line) => {
      const max = line.parentElement.clientWidth;
      if (!max) return;
      $$(".flap-ch", line).forEach((c) => (c.style.fontSize = ""));
      let size = parseFloat(getComputedStyle($(".flap-ch", line)).fontSize);
      let guard = 60;
      const apply = (s) => $$(".flap-ch", line).forEach((c) => (c.style.fontSize = s + "px"));
      while (line.scrollWidth > max && size > 24 && guard--) {
        size *= 0.96;
        apply(size);
      }
      common = Math.min(common, size);
    });
    if (isFinite(common)) rows.forEach((line) => $$(".flap-ch", line).forEach((c) => (c.style.fontSize = common + "px")));
  }
  fitFlapRows();
  addEventListener("resize", fitFlapRows);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFlapRows);

  // Periodic random tile re-flips (the idle "mechanical twitch").
  if (!reduceMotion) {
    const tiles = $$(".flap-ch:not(.sp)");
    setInterval(() => {
      const t = tiles[Math.floor(Math.random() * tiles.length)];
      if (!t) return;
      t.classList.remove("flip");
      void t.offsetWidth;
      t.classList.add("flip");
    }, 2800);
  }

  /* ------------------------------------------------------- reveal on scroll */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { threshold: 0.16, rootMargin: "0px 0px -30px 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  /* -------------------------------------------------------- 3D phone tilt */
  if (!reduceMotion && matchMedia("(pointer:fine)").matches) {
    $$(".phone[data-tilt]").forEach((ph) => {
      const frame = $(".phone-frame", ph);
      ph.addEventListener("mousemove", (ev) => {
        const r = ph.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5;
        const y = (ev.clientY - r.top) / r.height - 0.5;
        frame.style.setProperty("--ry", (x * 13).toFixed(2) + "deg");
        frame.style.setProperty("--rx", (-y * 9).toFixed(2) + "deg");
      });
      ph.addEventListener("mouseleave", () => {
        frame.style.setProperty("--ry", "0deg");
        frame.style.setProperty("--rx", "0deg");
      });
    });
  }

  /* ------------------------------------------ hero: live <-> past crossfade */
  const heroX = $("#heroXfade");
  if (heroX) {
    const heroPhone = heroX.closest(".phone");
    if (reduceMotion) heroPhone.classList.add("past"); // show the signature state
    else setInterval(() => heroPhone.classList.toggle("past"), 3800);
  }

  /* ------------------------------------------------------------ boardwall */
  const WALL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:· ";
  $$("[data-boardwall] .bw-line").forEach((line) => {
    const raw = line.dataset.text.replace(/\|/g, "  ");
    const tone = line.dataset.tone || "";
    [...raw].forEach((ch) => {
      const c = document.createElement("span");
      c.className = "bw-cell" + (ch === " " ? " blank" : tone ? " " + tone : "");
      c.textContent = " ";
      c.dataset.ch = ch;
      line.appendChild(c);
    });
  });
  // size each wall line so every cell fits the container width
  function fitWall() {
    $$("[data-boardwall] .bw-line").forEach((line) => {
      const n = line.childElementCount;
      if (!n) return;
      const W = line.parentElement.clientWidth;
      const em = (W - 2 * n) / (1.36 * n + 0.31 * (n - 1));
      line.style.fontSize = Math.max(8, Math.min(26, Math.floor(em))) + "px";
    });
  }
  const wall = $("[data-boardwall]");
  if (wall) {
    fitWall();
    addEventListener("resize", fitWall);
    const spellLine = (line, lineIdx) => {
      $$(".bw-cell", line).forEach((cell, i) => {
        const target = cell.dataset.ch;
        if (target === " ") return;
        const delay = lineIdx * 240 + i * 32;
        setTimeout(() => {
          if (reduceMotion) { cell.textContent = target; return; }
          let n = 0, total = 5 + Math.floor(Math.random() * 7);
          const iv = setInterval(() => {
            n++;
            cell.textContent = n >= total ? target
              : WALL_CHARS[Math.floor(Math.random() * WALL_CHARS.length)];
            if (n >= total) clearInterval(iv);
          }, 44);
        }, delay);
      });
    };
    const wio = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        wio.unobserve(wall);
        $$(".bw-line", wall).forEach(spellLine);
        // safety net: whatever happens to timers, settle every cell in the end
        setTimeout(() => {
          $$(".bw-cell", wall).forEach((c) => (c.textContent = c.dataset.ch));
        }, 4200);
      });
    }, { threshold: 0.3 });
    wio.observe(wall);
  }

  /* -------------------------------------------------------- train dividers */
  $$("[data-train]").forEach((tl) => {
    const tio = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) { tl.classList.add("go"); tio.unobserve(tl); }
      });
    }, { threshold: 0.55 });
    tio.observe(tl);
  });

  /* -------------------------------------------------------------- themes */
  const THEMES = {
    dark: {
      h: "Dark: the original Split-Flap",
      p: "Warm amber on near-black, coral for the past, teal for on-time. The whole app reads like the big board at Paddington after dark.",
      sw: ["#0D0E11", "#F5B301", "#FF5A4D", "#2EC4B6"],
      shot: "shots/board-live.png",
      alt: "The Paddington departure board in the Dark theme",
    },
    light: {
      h: "Paper & Enamel",
      p: "Warm ivory and white cards, with amber split by role: still a vivid fill on buttons and pills, but a deep legible gold as text, because yellow text on paper is a crime.",
      sw: ["#F4EEE1", "#F5B301", "#9A6300", "#E14B3F"],
      shot: "shots/theme-light.png",
      alt: "The same board in the Paper & Enamel light theme: ivory ground, white cards, dark mechanical board",
    },
    intercity: {
      h: "InterCity: the Swallow, reimagined",
      p: "Early-'90s British Rail livery gone green-dominant: deep InterCity green grounds, livery yellow for headings and fills, red strictly for alerts, and the board itself stays the deepest green of all.",
      sw: ["#0D4331", "#F5C518", "#F04434", "#06241B"],
      shot: "shots/theme-intercity.png",
      alt: "The same board in the InterCity theme: deep green grounds, livery yellow accents, red alert chips",
    },
  };
  const themeSec = $("#themes");
  const themeShot = $("#themeShot");
  const themeCopy = $("#themeCopy");
  const themeSw = $("#themeSwatches");
  // preload theme shots so swaps are instant
  Object.values(THEMES).forEach((t) => { const i = new Image(); i.src = t.shot; });
  $$(".tchip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const t = chip.dataset.t;
      const cfg = THEMES[t];
      $$(".tchip").forEach((c) => c.classList.toggle("on", c === chip));
      themeSec.dataset.mode = t;
      themeShot.classList.add("swapping");
      setTimeout(() => {
        themeShot.src = cfg.shot;
        themeShot.alt = cfg.alt;
        themeShot.classList.remove("swapping");
      }, reduceMotion ? 0 : 220);
      themeCopy.innerHTML = "<h3>" + cfg.h + "</h3><p>" + cfg.p + "</p>";
      themeSw.innerHTML = cfg.sw
        .map((x) => '<span class="sw" style="background:' + x + '"></span>')
        .join("");
    });
  });
})();
