import {
  LEVELS, ROLES, GOALS, DECISIONS, DECISION_SECONDS, CRISIS_INTRO,
  endingFor, choiceStatus,
} from "./scenario.js";
import { createTutor } from "./tutor.js";

const app = document.getElementById("app");

const STATUS_ICON = { safe: "✓", risky: "!", breach: "✕" };
const STATUS_LABEL = { safe: "Güvenli", risky: "Riskli", breach: "İhlal" };

let state = initialState();
let timerId = null;

function initialState() {
  return {
    screen: "onboarding",
    profile: { level: null, role: null, goal: null },
    index: 0,
    choices: {},
    phase: "choose", // choose | feedback
    timedOut: false,
    remaining: DECISION_SECONDS,
    hintOpen: false,
    tutorOpen: false,
    tutor: null,
    messages: [],
    waiting: false,
  };
}

const isExperienced = () => state.profile.level === "experienced";
const currentDecision = () => DECISIONS[state.index];

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/* ---------- Ekran 1: Onboarding ---------- */

function choiceGroup(name, title, items, segmented = false) {
  const selected = state.profile[name];
  return `
    <fieldset class="question" data-cy="q-${name}">
      <legend class="h3">${title}</legend>
      <div class="choices ${segmented ? "segmented" : ""}">
        ${items.map((it) => `
          <button type="button" class="chip" data-action="pick" data-name="${name}" data-value="${it.id}"
            data-cy="${name}-${it.id}" aria-pressed="${selected === it.id}">${it.label}</button>`).join("")}
      </div>
    </fieldset>`;
}

function renderOnboarding() {
  const { level, role, goal } = state.profile;
  const ready = level && role && goal;
  return `
    <section class="screen" data-cy="screen-onboarding">
      <header class="brand">
        <h1 class="h1">SE Primer</h1>
        <p class="dim">Nöbetçi sensin. Önce seni tanıyalım.</p>
      </header>
      ${choiceGroup("level", "1. Seviyen?", LEVELS, true)}
      ${choiceGroup("role", "2. Rolün?", ROLES)}
      ${choiceGroup("goal", "3. Hedefin?", GOALS)}
      ${level === "experienced" ? `
        <p class="info-note caption" data-cy="timer-note"><span aria-hidden="true">ⓘ</span>
          Deneyimli modda her karar için ${DECISION_SECONDS} saniyen var. Süre dolarsa riskli seçenek uygulanır.</p>` : ""}
      ${level === "new" ? `
        <p class="info-note caption" data-cy="hint-note"><span aria-hidden="true">ⓘ</span>
          Her kararda bir ipucu göreceksin. Süre baskısı yok.</p>` : ""}
      <div class="bottom">
        <button class="btn-primary" data-action="start" data-cy="start" ${ready ? "" : "disabled aria-disabled=\"true\""}>Başla</button>
      </div>
    </section>`;
}

/* ---------- Ekran 2: Sahne & Karar ---------- */

function renderTopbar(decision) {
  const steps = DECISIONS.map((_, i) => `<span class="${i <= state.index ? "on" : ""}"></span>`).join("");
  const showTimer = isExperienced() && state.phase === "choose";
  const pct = (state.remaining / DECISION_SECONDS) * 100;
  const urgent = state.remaining <= 10;
  return `
    <header class="topbar">
      <div class="topbar-row">
        <span class="caption" data-cy="step-label">Karar ${decision.step}/${DECISIONS.length} · ${decision.area}</span>
        ${showTimer ? `<span class="timer ${urgent ? "urgent" : ""}" data-cy="timer" role="timer"
            aria-label="Kalan süre">${formatTime(state.remaining)}</span>` : ""}
      </div>
      ${showTimer
        ? `<div class="progress ${urgent ? "urgent" : ""}" data-cy="timer-bar"><span style="width:${pct}%"></span></div>`
        : `<div class="steps" aria-hidden="true">${steps}</div>`}
    </header>`;
}

function renderScenario(decision) {
  const intro = decision.step === 1 ? `<p data-cy="role-intro">${CRISIS_INTRO[state.profile.role]}</p>` : "";
  const goalBadge = decision.goal === state.profile.goal
    ? `<span class="goal-badge caption" data-cy="goal-badge">Hedefinle ilgili</span>` : "";
  return `
    <article class="scenario" data-cy="scenario">
      <span class="caption dim">${decision.time} · KRİZ</span>
      ${goalBadge}
      <h2 class="h2" data-cy="scenario-title">${decision.title}</h2>
      ${intro}
      <p>${decision.narrative}</p>
      <p class="dim" data-cy="role-note">${decision.roleNote[state.profile.role]}</p>
    </article>`;
}

function renderOptions(decision) {
  const hint = renderHint(decision);
  return `
    <h2 class="h3">Ne yaparsın?</h2>
    <div class="options">
      ${["A", "B"].map((key) => `
        <button class="option" data-action="choose" data-choice="${key}" data-cy="option-${key}">
          <span class="badge">${key}</span>
          <span class="option-text">${decision.options[key].label}${decision.options[key].short !== decision.options[key].label
            ? `<small>${decision.options[key].short}</small>` : ""}</span>
        </button>`).join("")}
    </div>
    ${hint}`;
}

function renderHint(decision) {
  // Yeni başlayan oyuncu ipucunu otomatik görür; deneyimli oyuncu yalnızca isterse.
  const visible = !isExperienced() || state.hintOpen;
  if (!visible) {
    return `<button class="btn-link caption" data-action="show-hint" data-cy="show-hint">İpucu göster</button>`;
  }
  return `
    <aside class="hint" data-cy="hint">
      <span aria-hidden="true">💡</span>
      <p><strong>İpucu:</strong> ${decision.hint}</p>
    </aside>`;
}

function renderFeedback(decision) {
  const choice = state.choices[decision.id];
  const fb = decision.feedback[choice];
  const last = state.index === DECISIONS.length - 1;
  return `
    ${state.timedOut ? `<p class="timeout-banner" data-cy="timeout" role="alert">⏱ Süre doldu! Karar veremediğin için riskli seçenek uygulandı.</p>` : ""}
    <p class="caption dim" data-cy="selected-choice">Seçimin: ${choice} · ${decision.options[choice].label}</p>
    <article class="feedback" data-cy="feedback">
      <section data-cy="feedback-what">
        <h3>NE OLDU?</h3>
        <p>${fb.what}</p>
      </section>
      <section data-cy="feedback-why">
        <h3>NEDEN OLDU?</h3>
        <p>${fb.why}</p>
      </section>
    </article>
    <div class="bottom">
      <button class="btn-primary" data-action="next" data-cy="next">${last ? "Sonucu gör" : "Devam"} →</button>
    </div>`;
}

function renderTutor() {
  if (state.phase !== "choose") return "";
  const bar = `
    <button class="tutor-bar" data-action="open-tutor" data-cy="tutor-open" aria-expanded="${state.tutorOpen}">
      <span><span aria-hidden="true">?</span> AI Tutor'a sor</span><span aria-hidden="true">⌃</span>
    </button>`;
  if (!state.tutorOpen) return `<div class="bottom">${bar}</div>`;
  return `
    <div class="bottom">${bar}</div>
    <div class="sheet-backdrop" data-action="close-tutor"></div>
    <section class="sheet" role="dialog" aria-label="AI Tutor" data-cy="tutor-panel">
      <div class="sheet-handle" aria-hidden="true"></div>
      <header class="sheet-header">
        <h2 class="h3">AI Tutor · Sokratik</h2>
        <button class="icon-btn" data-action="close-tutor" data-cy="tutor-close" aria-label="Kapat">✕</button>
      </header>
      <div class="messages" data-cy="tutor-messages">${renderMessages()}</div>
      <form class="composer" data-cy="tutor-form">
        <input name="message" autocomplete="off" placeholder="Sorunu yaz..." aria-label="Tutor'a mesaj"
          data-cy="tutor-input" ${state.waiting ? "disabled" : ""} />
        <button type="submit" aria-label="Gönder" data-cy="tutor-send" ${state.waiting ? "disabled" : ""}>➤</button>
      </form>
    </section>`;
}

function renderMessages() {
  const list = state.messages.map((m) =>
    `<p class="msg ${m.from}" data-cy="msg-${m.from}">${escapeHtml(m.text)}</p>`).join("");
  return state.waiting ? `${list}<p class="msg tutor typing">Düşünüyor…</p>` : list;
}

function renderDecision() {
  const decision = currentDecision();
  return `
    <section class="screen" data-cy="screen-decision" data-decision="${decision.id}">
      ${renderTopbar(decision)}
      ${renderScenario(decision)}
      ${state.phase === "choose" ? renderOptions(decision) : renderFeedback(decision)}
      ${renderTutor()}
    </section>`;
}

/* ---------- Ekran 3: Sonuç ---------- */

function renderResult() {
  const ending = endingFor(state.choices);
  const rows = DECISIONS.map((d, i) => {
    const choice = state.choices[d.id];
    const status = choiceStatus(d.id, choice);
    return `
      <li data-cy="summary-${d.id}">
        <span class="area">${i + 1} · ${d.area}</span>
        <span class="pick">${choice} · ${d.options[choice].short}</span>
        <span class="status ${status}" title="${STATUS_LABEL[status]}" aria-label="${STATUS_LABEL[status]}">${STATUS_ICON[status]}</span>
      </li>`;
  }).join("");
  return `
    <section class="screen" data-cy="screen-result" data-ending="${ending.id}">
      <article class="result-banner ${ending.variant}" data-cy="ending-${ending.id}">
        <span class="result-icon" aria-hidden="true">${ending.variant === "success" ? "✓" : "⚠"}</span>
        <span class="caption">${ending.tag}</span>
        <h1 class="display" data-cy="ending-title">${ending.title}</h1>
        <p>${ending.text}</p>
      </article>
      <h2 class="h3">Kararların</h2>
      <ul class="summary" data-cy="summary">${rows}</ul>
      <div class="bottom">
        <button class="btn-primary" data-action="restart" data-cy="restart">Tekrar Oyna</button>
      </div>
    </section>`;
}

/* ---------- Render & zamanlayıcı ---------- */

function render() {
  const view = { onboarding: renderOnboarding, decision: renderDecision, result: renderResult }[state.screen];
  app.innerHTML = view();
  if (state.tutorOpen) {
    const box = app.querySelector(".messages");
    box.scrollTop = box.scrollHeight;
    app.querySelector(".composer input")?.focus();
  }
}

function formatTime(sec) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function updateTimerView() {
  const timer = app.querySelector("[data-cy=timer]");
  const bar = app.querySelector("[data-cy=timer-bar]");
  if (!timer || !bar) return;
  const urgent = state.remaining <= 10;
  timer.textContent = formatTime(state.remaining);
  timer.classList.toggle("urgent", urgent);
  bar.classList.toggle("urgent", urgent);
  bar.firstElementChild.style.width = `${(state.remaining / DECISION_SECONDS) * 100}%`;
}

function startTimer() {
  stopTimer();
  state.remaining = DECISION_SECONDS;
  if (!isExperienced()) return;
  timerId = setInterval(() => {
    state.remaining -= 1;
    if (state.remaining <= 0) {
      choose("B", true);
    } else {
      updateTimerView();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

/* ---------- Akış ---------- */

function enterDecision(index) {
  const decision = DECISIONS[index];
  Object.assign(state, {
    screen: "decision",
    index,
    phase: "choose",
    timedOut: false,
    hintOpen: false,
    tutorOpen: false,
    waiting: false,
    tutor: createTutor({ profile: state.profile, decision }),
    messages: [],
  });
  startTimer();
  render();
  window.scrollTo(0, 0);
}

function choose(choice, timedOut = false) {
  if (state.phase !== "choose") return;
  stopTimer();
  state.choices[currentDecision().id] = choice;
  Object.assign(state, { phase: "feedback", timedOut, tutorOpen: false });
  render();
  window.scrollTo(0, 0);
}

function next() {
  if (state.index < DECISIONS.length - 1) {
    enterDecision(state.index + 1);
  } else {
    state.screen = "result";
    render();
    window.scrollTo(0, 0);
  }
}

async function sendToTutor(text) {
  const tutor = state.tutor;
  state.messages.push({ from: "player", text });
  state.waiting = true;
  render();
  const reply = await tutor.ask(text);
  if (state.tutor !== tutor) return; // oyuncu bu arada karar verdi
  state.messages.push({ from: "tutor", text: reply });
  state.waiting = false;
  render();
}

app.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (!el || el.disabled) return;
  switch (el.dataset.action) {
    case "pick":
      state.profile[el.dataset.name] = el.dataset.value;
      render();
      break;
    case "start":
      state.choices = {};
      enterDecision(0);
      break;
    case "choose":
      choose(el.dataset.choice);
      break;
    case "show-hint":
      state.hintOpen = true;
      render();
      break;
    case "open-tutor":
      state.tutorOpen = true;
      if (state.messages.length === 0) state.messages.push({ from: "tutor", text: state.tutor.opening() });
      render();
      break;
    case "close-tutor":
      state.tutorOpen = false;
      render();
      break;
    case "next":
      next();
      break;
    case "restart":
      stopTimer();
      state = initialState();
      render();
      break;
  }
});

app.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = event.target.elements.message;
  const text = input.value.trim();
  if (text && !state.waiting) sendToTutor(text);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.tutorOpen) {
    state.tutorOpen = false;
    render();
  }
});

render();
