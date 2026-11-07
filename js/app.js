/* ==========================================================================
   Lineup: application logic
   Sections: helpers, theme, navigation, rendering, search & filter,
   countdowns, event drawer, registration form, local storage, init.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Helpers ---------- */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const STORAGE_KEYS = {
    theme: "lineup.theme",
    registrations: "lineup.registrations"
  };

  const dateFmt = new Intl.DateTimeFormat("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
  const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });

  function formatDate(iso) { return dateFmt.format(new Date(iso)); }
  function formatTime(iso) { return timeFmt.format(new Date(iso)); }
  function dayNum(iso) { return new Date(iso).getDate(); }
  function monthShort(iso) {
    return new Date(iso).toLocaleString("en-IN", { month: "short" });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function findEvent(id) { return EVENTS.find((e) => e.id === id); }

  function sortedEvents() {
    return [...EVENTS].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /* ---------- Toast ---------- */

  let toastTimer;
  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  /* ---------- Local storage ---------- */

  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      toast("Could not save on this device. Storage may be full or blocked.");
      return false;
    }
  }

  function getRegistrations() { return readStorage(STORAGE_KEYS.registrations, []); }
  function isRegistered(eventId) { return getRegistrations().some((r) => r.eventId === eventId); }

  function addRegistration(reg) {
    const list = getRegistrations();
    list.push(reg);
    return writeStorage(STORAGE_KEYS.registrations, list);
  }

  function removeRegistration(ticketId) {
    const list = getRegistrations().filter((r) => r.ticketId !== ticketId);
    writeStorage(STORAGE_KEYS.registrations, list);
  }

  function makeTicketId() {
    const stamp = Date.now().toString(36).toUpperCase().slice(-4);
    const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
    return `LN-${stamp}${rand}`;
  }

  /* ---------- Theme (dark / light) ---------- */

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = $("#themeToggle");
    const dark = theme === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    $(".theme-toggle-text", btn).textContent = dark ? "Light" : "Dark";
  }

  function initTheme() {
    const saved = readStorage(STORAGE_KEYS.theme, null);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));

    $("#themeToggle").addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      writeStorage(STORAGE_KEYS.theme, next);
    });
  }

  /* ---------- Navigation ---------- */

  function initNav() {
    const toggle = $("#menuToggle");
    const nav = $("#mobileNav");

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      toggle.classList.toggle("is-open", open);
    });

    $$("a", nav).forEach((a) => a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }));

    const header = $(".site-header");
    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 12);
    }, { passive: true });
  }

  /* ---------- Countdown ---------- */

  function diffParts(target) {
    const ms = new Date(target) - Date.now();
    if (ms <= 0) return null;
    const s = Math.floor(ms / 1000);
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60
    };
  }

  function compactCountdown(target, endTarget) {
    const p = diffParts(target);
    if (!p) {
      if (endTarget && new Date(endTarget) > Date.now()) return "Happening now";
      return "Ended";
    }
    if (p.days > 0) return `Starts in ${p.days}d ${p.hours}h`;
    if (p.hours > 0) return `Starts in ${p.hours}h ${p.minutes}m`;
    return `Starts in ${p.minutes}m ${p.seconds}s`;
  }

  const pad = (n) => String(n).padStart(2, "0");

  function tickAll() {
    // Card chips
    $$("[data-countdown]").forEach((el) => {
      const ev = findEvent(el.dataset.countdown);
      if (ev) el.textContent = compactCountdown(ev.date, ev.endDate);
    });

    // Hero and drawer block countdowns
    $$("[data-countdown-block]").forEach((block) => {
      const ev = findEvent(block.dataset.countdownBlock);
      if (!ev) return;
      const p = diffParts(ev.date);
      const cells = {
        days: $('[data-unit="days"]', block),
        hours: $('[data-unit="hours"]', block),
        minutes: $('[data-unit="minutes"]', block),
        seconds: $('[data-unit="seconds"]', block)
      };
      if (!p) {
        Object.values(cells).forEach((c) => { if (c) c.textContent = "00"; });
        block.classList.add("is-live");
        return;
      }
      block.classList.remove("is-live");
      cells.days.textContent = pad(p.days);
      cells.hours.textContent = pad(p.hours);
      cells.minutes.textContent = pad(p.minutes);
      cells.seconds.textContent = pad(p.seconds);
    });
  }

  /* ---------- Hero: next event ---------- */

  function initHero() {
    const upcoming = sortedEvents().find((e) => new Date(e.date) > Date.now()) || sortedEvents()[0];
    $("#nextEventName").textContent = upcoming.name;
    $("#nextEventMeta").textContent = `${formatDate(upcoming.date)}, ${formatTime(upcoming.date)} at ${upcoming.venue}`;
    $("#heroCountdown").dataset.countdownBlock = upcoming.id;
    $("#nextEventBtn").addEventListener("click", () => openDrawer(upcoming.id));

    // Ticker strip
    const items = sortedEvents().map((e) =>
      `<span class="ticker-item">${escapeHtml(e.name)} <em>${monthShort(e.date)} ${dayNum(e.date)}</em></span>`
    ).join("");
    $("#tickerTrack").innerHTML = items + items; // duplicated for seamless loop
  }

  /* ---------- Cards ---------- */

  function cardTemplate(ev, variant = "card") {
    const registered = isRegistered(ev.id);
    return `
      <article class="event-card ${variant === "featured" ? "event-card--featured" : ""}" data-id="${ev.id}" tabindex="0" aria-label="${escapeHtml(ev.name)}">
        <div class="event-card-media">
          <img src="${eventArt(ev)}" alt="Abstract artwork for ${escapeHtml(ev.name)}" loading="lazy" width="600" height="400">
          <span class="event-cat event-cat--${ev.category.toLowerCase()}">${ev.category}</span>
          ${registered ? '<span class="event-badge">Registered</span>' : ""}
        </div>
        <div class="event-card-body">
          <div class="event-date-tab" aria-hidden="true">
            <span class="event-day">${dayNum(ev.date)}</span>
            <span class="event-month">${monthShort(ev.date)}</span>
          </div>
          <div class="event-card-text">
            <h3 class="event-name">${escapeHtml(ev.name)}</h3>
            <p class="event-venue">${escapeHtml(ev.venue)}</p>
            <p class="event-short">${escapeHtml(ev.short)}</p>
          </div>
        </div>
        <div class="event-card-foot">
          <span class="event-countdown" data-countdown="${ev.id}">${compactCountdown(ev.date, ev.endDate)}</span>
          <button class="btn btn-small btn-primary" type="button" data-open="${ev.id}">View details</button>
        </div>
      </article>`;
  }

  function renderFeatured() {
    const grid = $("#featuredGrid");
    grid.innerHTML = sortedEvents().filter((e) => e.featured).map((e) => cardTemplate(e, "featured")).join("");
  }

  /* ---------- Search & filter ---------- */

  const state = { query: "", category: "All" };

  function matches(ev) {
    const q = state.query.trim().toLowerCase();
    const catOk = state.category === "All" || ev.category === state.category;
    if (!catOk) return false;
    if (!q) return true;
    const hay = `${ev.name} ${ev.venue} ${ev.short} ${ev.description} ${ev.category}`.toLowerCase();
    return hay.includes(q);
  }

  function renderEvents() {
    const list = sortedEvents().filter(matches);
    const grid = $("#eventGrid");
    const empty = $("#eventsEmpty");
    grid.innerHTML = list.map((e) => cardTemplate(e)).join("");
    empty.hidden = list.length > 0;
    $("#eventsCount").textContent = list.length === EVENTS.length
      ? `${EVENTS.length} events coming up`
      : `${list.length} of ${EVENTS.length} events`;
  }

  function renderChips() {
    const wrap = $("#categoryChips");
    wrap.innerHTML = CATEGORIES.map((c) =>
      `<button type="button" class="chip ${c === state.category ? "is-active" : ""}" data-cat="${c}" aria-pressed="${c === state.category}">${c}</button>`
    ).join("");
  }

  function initFilters() {
    renderChips();
    $("#categoryChips").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (!btn) return;
      state.category = btn.dataset.cat;
      renderChips();
      renderEvents();
    });

    let debounce;
    $("#searchInput").addEventListener("input", (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.query = e.target.value;
        renderEvents();
      }, 120);
    });

    $("#clearFilters").addEventListener("click", () => {
      state.query = "";
      state.category = "All";
      $("#searchInput").value = "";
      renderChips();
      renderEvents();
      $("#searchInput").focus();
    });
  }

  /* ---------- Drawer (event details + registration) ---------- */

  let lastFocus = null;
  let currentEventId = null;

  function drawerTemplate(ev) {
    const registration = getRegistrations().find((r) => r.eventId === ev.id);
    const eventOptions = sortedEvents().map((e) =>
      `<option value="${e.id}" ${e.id === ev.id ? "selected" : ""}>${escapeHtml(e.name)}</option>`
    ).join("");

    const registeredBlock = registration ? `
      <div class="confirm" role="status">
        <h3>You are on the list.</h3>
        <p>Registered as <strong>${escapeHtml(registration.name)}</strong>. Your ticket reference is <strong>${registration.ticketId}</strong>. A copy is saved under My registrations.</p>
        <button class="btn btn-ghost" type="button" data-cancel="${registration.ticketId}">Cancel registration</button>
      </div>` : `
      <form class="reg-form" id="regForm" novalidate>
        <h3 class="form-title">Register for this event</h3>
        <div class="field">
          <label for="fName">Full name</label>
          <input id="fName" name="name" type="text" autocomplete="name" placeholder="Priya Sharma" required>
          <p class="error" id="errName" aria-live="polite"></p>
        </div>
        <div class="field">
          <label for="fEmail">Email address</label>
          <input id="fEmail" name="email" type="email" autocomplete="email" placeholder="priya@kiit.ac.in" required>
          <p class="error" id="errEmail" aria-live="polite"></p>
        </div>
        <div class="field">
          <label for="fPhone">Phone number</label>
          <input id="fPhone" name="phone" type="tel" autocomplete="tel" inputmode="numeric" placeholder="10 digit mobile number" required>
          <p class="error" id="errPhone" aria-live="polite"></p>
        </div>
        <div class="field">
          <label for="fEvent">Event</label>
          <select id="fEvent" name="event" required>${eventOptions}</select>
          <p class="error" id="errEvent" aria-live="polite"></p>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Save my spot</button>
        <p class="form-note">Your details are stored only in this browser.</p>
      </form>`;

    return `
      <div class="drawer-media">
        <img src="${eventArt(ev)}" alt="Abstract artwork for ${escapeHtml(ev.name)}" width="600" height="400">
      </div>
      <div class="drawer-body">
        <span class="event-cat event-cat--${ev.category.toLowerCase()}">${ev.category}</span>
        <h2 class="drawer-title" id="drawerTitle">${escapeHtml(ev.name)}</h2>

        <dl class="facts">
          <div><dt>Date</dt><dd>${formatDate(ev.date)}</dd></div>
          <div><dt>Time</dt><dd>${formatTime(ev.date)} to ${formatTime(ev.endDate)}</dd></div>
          <div><dt>Venue</dt><dd>${escapeHtml(ev.venue)}</dd></div>
          <div><dt>Capacity</dt><dd>${ev.capacity} seats</dd></div>
        </dl>

        <div class="countdown countdown--inline" data-countdown-block="${ev.id}" role="timer" aria-label="Countdown to ${escapeHtml(ev.name)}">
          <div class="countdown-cell"><span class="countdown-value" data-unit="days">00</span><span class="countdown-unit">days</span></div>
          <div class="countdown-cell"><span class="countdown-value" data-unit="hours">00</span><span class="countdown-unit">hours</span></div>
          <div class="countdown-cell"><span class="countdown-value" data-unit="minutes">00</span><span class="countdown-unit">min</span></div>
          <div class="countdown-cell"><span class="countdown-value" data-unit="seconds">00</span><span class="countdown-unit">sec</span></div>
        </div>

        <p class="drawer-desc">${escapeHtml(ev.description)}</p>

        ${registeredBlock}
      </div>`;
  }

  function openDrawer(id) {
    const ev = findEvent(id);
    if (!ev) return;
    currentEventId = id;
    lastFocus = document.activeElement;

    $("#drawerContent").innerHTML = drawerTemplate(ev);
    $("#drawerContent").scrollTop = 0;

    const drawer = $("#drawer");
    const backdrop = $("#drawerBackdrop");
    drawer.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      drawer.classList.add("open");
      backdrop.classList.add("open");
    });
    document.body.classList.add("no-scroll");
    tickAll();

    const form = $("#regForm");
    if (form) initForm(form, ev);
    setTimeout(() => $("#drawerClose").focus(), 50);
  }

  function closeDrawer() {
    const drawer = $("#drawer");
    const backdrop = $("#drawerBackdrop");
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    document.body.classList.remove("no-scroll");
    currentEventId = null;
    setTimeout(() => {
      drawer.hidden = true;
      backdrop.hidden = true;
      $("#drawerContent").innerHTML = "";
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }, 320);
  }

  function initDrawer() {
    $("#drawerClose").addEventListener("click", closeDrawer);
    $("#drawerBackdrop").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#drawer").hidden) closeDrawer();
    });

    // Open from any card or button anywhere in the page
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open]");
      if (btn) { openDrawer(btn.dataset.open); return; }

      const cancel = e.target.closest("[data-cancel]");
      if (cancel) {
        removeRegistration(cancel.dataset.cancel);
        toast("Registration cancelled.");
        refreshAfterRegistrationChange();
        if (currentEventId) openDrawer(currentEventId);
        return;
      }

      const card = e.target.closest(".event-card");
      if (card && !e.target.closest("button")) openDrawer(card.dataset.id);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const card = e.target.closest(".event-card");
      if (card && e.target === card) openDrawer(card.dataset.id);
    });

    // Focus trap inside the drawer
    $("#drawer").addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', $("#drawer"))
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Registration form & validation ---------- */

  const validators = {
    name(v) {
      const value = v.trim();
      if (!value) return "Enter your full name.";
      if (value.length < 3) return "Name should be at least 3 characters.";
      if (!/^[A-Za-z][A-Za-z .'-]*$/.test(value)) return "Use letters, spaces, apostrophes or hyphens only.";
      return "";
    },
    email(v) {
      const value = v.trim();
      if (!value) return "Enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(value)) return "That does not look like a valid email.";
      return "";
    },
    phone(v) {
      const digits = v.replace(/[\s()-]/g, "");
      if (!digits) return "Enter your phone number.";
      if (!/^(\+91)?[6-9]\d{9}$/.test(digits)) return "Enter a valid 10 digit Indian mobile number.";
      return "";
    },
    event(v) {
      if (!v || !findEvent(v)) return "Choose an event.";
      if (isRegistered(v)) return "You are already registered for this event.";
      return "";
    }
  };

  function showError(field, message) {
    const input = $(`[name="${field}"]`);
    const err = $(`#err${field.charAt(0).toUpperCase() + field.slice(1)}`);
    err.textContent = message;
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function initForm(form, ev) {
    // Validate on blur, clear on input
    Object.keys(validators).forEach((field) => {
      const input = $(`[name="${field}"]`, form);
      input.addEventListener("blur", () => showError(field, validators[field](input.value)));
      input.addEventListener("input", () => { if (input.classList.contains("is-invalid")) showError(field, validators[field](input.value)); });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      let firstBad = null;

      Object.keys(validators).forEach((field) => {
        const msg = validators[field](data[field] || "");
        showError(field, msg);
        if (msg && !firstBad) firstBad = $(`[name="${field}"]`, form);
      });

      if (firstBad) {
        firstBad.focus();
        form.classList.add("shake");
        setTimeout(() => form.classList.remove("shake"), 420);
        return;
      }

      const target = findEvent(data.event);
      const reg = {
        ticketId: makeTicketId(),
        eventId: target.id,
        eventName: target.name,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.replace(/[\s()-]/g, ""),
        registeredAt: new Date().toISOString()
      };

      if (!addRegistration(reg)) return;

      form.outerHTML = `
        <div class="confirm confirm--fresh" role="status">
          <h3>Registered! See you there.</h3>
          <p><strong>${escapeHtml(reg.name)}</strong>, your spot for <strong>${escapeHtml(target.name)}</strong> is saved. Ticket reference <strong>${reg.ticketId}</strong>. We will look for you at ${escapeHtml(target.venue)} on ${formatDate(target.date)}.</p>
          <button class="btn btn-ghost" type="button" data-cancel="${reg.ticketId}">Cancel registration</button>
        </div>`;

      toast(`Registered for ${target.name}.`);
      refreshAfterRegistrationChange();
    });
  }

  /* ---------- My registrations ---------- */

  function renderRegistrations() {
    const list = getRegistrations().sort((a, b) => {
      const ea = findEvent(a.eventId), eb = findEvent(b.eventId);
      return new Date(ea ? ea.date : 0) - new Date(eb ? eb.date : 0);
    });
    const wrap = $("#regList");
    const empty = $("#regEmpty");
    empty.hidden = list.length > 0;

    wrap.innerHTML = list.map((r) => {
      const ev = findEvent(r.eventId);
      if (!ev) return "";
      return `
        <article class="ticket" data-id="${ev.id}">
          <div class="ticket-stub">
            <span class="event-day">${dayNum(ev.date)}</span>
            <span class="event-month">${monthShort(ev.date)}</span>
          </div>
          <div class="ticket-main">
            <h3>${escapeHtml(ev.name)}</h3>
            <p>${formatTime(ev.date)} at ${escapeHtml(ev.venue)}</p>
            <p class="ticket-ref">Ref ${r.ticketId} <span class="dot-sep">for</span> ${escapeHtml(r.name)}</p>
            <span class="event-countdown" data-countdown="${ev.id}">${compactCountdown(ev.date, ev.endDate)}</span>
          </div>
          <div class="ticket-actions">
            <button class="btn btn-small btn-ghost" type="button" data-open="${ev.id}">Details</button>
            <button class="btn btn-small btn-danger" type="button" data-cancel="${r.ticketId}">Cancel</button>
          </div>
        </article>`;
    }).join("");
  }

  function refreshAfterRegistrationChange() {
    renderFeatured();
    renderEvents();
    renderRegistrations();
  }

  /* ---------- Page load reveal ---------- */

  function initReveal() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { document.body.classList.add("ready"); return; }
    requestAnimationFrame(() => document.body.classList.add("ready"));
  }

  /* ---------- Init ---------- */

  function init() {
    initTheme();
    initNav();
    initHero();
    renderFeatured();
    initFilters();
    renderEvents();
    renderRegistrations();
    initDrawer();
    initReveal();
    tickAll();
    setInterval(tickAll, 1000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
