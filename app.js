// Config impostata dalla pagina (andata/ritorno) prima di caricare questo file.
const CFG = window.APP_CONFIG || {
  from: "Chiasso", to: "Bioggio Molinazzo", dir: "andata",
  walkBefore: 6, walkAfter: 10, beforeLabel: "Esci di casa", afterLabel: "Al lavoro",
};
const SHOW = 3;               // quanti viaggi mostrare
const REFRESH_MS = 60 * 1000; // aggiorna dati ogni 60s

const listEl = document.getElementById("list");
const dotEl = document.getElementById("status-dot");
const statusEl = document.getElementById("status-text");

let connections = [];

// ---------- Orologio ----------
function tickClock() {
  const now = new Date();
  const t = document.getElementById("clock-time");
  const d = document.getElementById("clock-date");
  if (t) t.textContent = now.toLocaleTimeString("it-CH", { hour: "2-digit", minute: "2-digit" });
  if (d) d.textContent = now.toLocaleDateString("it-CH", { weekday: "long", day: "numeric", month: "long" });
}
function fmtTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString("it-CH", { hour: "2-digit", minute: "2-digit" });
}

// ---------- Ritardo ----------
// Legge il ritardo dai dati SBB: prima il campo "delay", altrimenti lo calcola
// dalla differenza tra orario di orario e orario previsto (prognosis).
function getDelayMin(cp) {
  if (cp && typeof cp.delay === "number") return cp.delay;
  if (cp && cp.prognosis && cp.prognosis.departure && cp.departure)
    return Math.round((new Date(cp.prognosis.departure) - new Date(cp.departure)) / 60000);
  if (cp && cp.prognosis && cp.prognosis.arrival && cp.arrival)
    return Math.round((new Date(cp.prognosis.arrival) - new Date(cp.arrival)) / 60000);
  return 0;
}
function shortLine(journey) {
  const cat = (journey.category || "").trim();
  const num = journey.number ? String(journey.number).trim() : "";
  return (cat + num) || cat || "Treno";
}

// ---------- Fetch ----------
async function loadConnections() {
  const url = `https://transport.opendata.ch/v1/connections?from=${encodeURIComponent(CFG.from)}&to=${encodeURIComponent(CFG.to)}&limit=6`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    connections = (data.connections || []);
    setStatus(true, "Aggiornato alle " + new Date().toLocaleTimeString("it-CH"));
  } catch (err) {
    setStatus(false, "Errore di rete: " + err.message);
  }
  render();
}
function setStatus(ok, msg) {
  dotEl.classList.toggle("err", !ok);
  statusEl.textContent = msg;
}

// Estrae le tratte (treni) con orario reale, + arrivo finale.
function buildTrip(conn) {
  const journeys = (conn.sections || []).filter(s => s.journey);
  if (journeys.length === 0) return null;

  const legs = journeys.map(s => {
    const dep = s.departure, arr = s.arrival;
    const depDelay = getDelayMin(dep);
    const realPlat = dep.prognosis?.platform || dep.platform;
    return {
      depTs: dep.departureTimestamp,
      depDelay,
      depReal: dep.departureTimestamp + depDelay * 60,
      station: dep.station?.name || "",
      platform: realPlat,
      platChanged: !!(dep.prognosis?.platform && dep.prognosis.platform !== dep.platform),
      line: shortLine(s.journey),
      isFlp: /flp/i.test(s.journey.operator || "") || /^S6\d/.test(shortLine(s.journey)),
      arrTs: arr.arrivalTimestamp,
      arrDelay: getDelayMin(arr),
      arrStation: arr.station?.name || "",
    };
  });

  const last = legs[legs.length - 1];
  const arrReal = last.arrTs + last.arrDelay * 60;
  return {
    legs,
    arrStation: last.arrStation,
    arrTs: last.arrTs,
    arrDelay: last.arrDelay,
    arrReal,
    leaveTs: legs[0].depReal - (CFG.walkBefore || 0) * 60, // quando uscire
    doorArrTs: arrReal + (CFG.walkAfter || 0) * 60,        // quando arrivi a destinazione
    firstDepDelay: legs[0].depDelay,
  };
}

// ---------- Render ----------
function render() {
  const now = Date.now() / 1000;
  const rows = connections
    .map(c => ({ c, trip: buildTrip(c) }))
    .filter(x => x.trip && x.trip.legs[0].depTs > now - 60)
    .slice(0, SHOW);

  if (rows.length === 0) {
    listEl.innerHTML = `<div class="state-msg">Nessun treno imminente trovato.<br>Nuovo tentativo in corso…</div>`;
    return;
  }
  listEl.innerHTML = rows.map((x, i) => renderCard(x.trip, i === 0)).join("");
  updateCountdowns();
}

function timeCell(ts, delay) {
  if (delay > 0) return `<span class="t late">${fmtTime(ts)} <small>+${delay}′</small></span>`;
  return `<span class="t">${fmtTime(ts)}</span>`;
}

function renderCard(trip, isNext) {
  const legRows = trip.legs.map(leg => {
    const badge = `<span class="leg-line ${leg.isFlp ? "flp" : ""}"><span class="badge">${escapeHtml(leg.line)}</span></span>`;
    const plat = leg.platform
      ? ` <span class="plat ${leg.platChanged ? "changed" : ""}">bin. <b>${escapeHtml(leg.platform)}</b>${leg.platChanged ? " (cambiato)" : ""}</span>`
      : "";
    return `<div class="tl-row train">
        <span class="ico td"></span>
        ${timeCell(leg.depReal, leg.depDelay)}
        <span class="place"><b>${escapeHtml(leg.station)}</b> ${badge}${plat}</span>
      </div>`;
  }).join("");

  const delayChip = trip.firstDepDelay > 0
    ? `<span class="delay late">+${trip.firstDepDelay}′ ritardo</span>`
    : `<span class="delay ontime">in orario</span>`;

  return `
    <div class="card ${isNext ? "next" : ""}">
      <div class="card-head">
        <div class="count" data-leave="${trip.leaveTs}">
          <span class="big">--</span>
          <span class="unit">min prima di uscire</span>
        </div>
        ${delayChip}
      </div>
      <div class="tl">
        <div class="tl-row walk lead">
          <span class="ico">🚶</span>
          <span class="t">${fmtTime(trip.leaveTs)}</span>
          <span class="place">${escapeHtml(CFG.beforeLabel || "Parti")} <small>(${CFG.walkBefore}′ a piedi)</small></span>
        </div>
        ${legRows}
        <div class="tl-row arr">
          <span class="ico">🏁</span>
          ${timeCell(trip.arrReal, trip.arrDelay)}
          <span class="place"><b>${escapeHtml(trip.arrStation)}</b></span>
        </div>
        <div class="tl-row walk">
          <span class="ico">🏁</span>
          <span class="t">${fmtTime(trip.doorArrTs)}</span>
          <span class="place">${escapeHtml(CFG.afterLabel || "Arrivo")} <small>(${CFG.walkAfter}′ a piedi)</small></span>
        </div>
      </div>
    </div>`;
}

function updateCountdowns() {
  const now = Date.now() / 1000;
  document.querySelectorAll(".count").forEach(el => {
    const leave = Number(el.dataset.leave);
    const diffMin = Math.round((leave - now) / 60);
    const bigEl = el.querySelector(".big");
    const unitEl = el.querySelector(".unit");
    el.classList.remove("soon", "now");
    if (diffMin <= 0) {
      bigEl.textContent = "ora";
      unitEl.textContent = "esci adesso";
      el.classList.add("now");
    } else {
      bigEl.textContent = diffMin;
      unitEl.textContent = "min prima di uscire";
      if (diffMin <= 5) el.classList.add("soon");
    }
  });
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------- Avvio ----------
tickClock();
setInterval(tickClock, 1000);
setInterval(updateCountdowns, 1000);
setInterval(loadConnections, REFRESH_MS);
loadConnections();
