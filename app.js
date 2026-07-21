// Config impostata dalla pagina (andata/ritorno) prima di caricare questo file.
const CFG = window.APP_CONFIG || { from: "Chiasso", to: "Bioggio", dir: "andata" };
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
function fmtISO(iso) {
  return new Date(iso).toLocaleTimeString("it-CH", { hour: "2-digit", minute: "2-digit" });
}

// ---------- Ritardo ----------
// Legge il ritardo dai dati SBB: prima il campo "delay", altrimenti lo calcola
// dalla differenza tra orario previsto (prognosis) e orario di orario.
function getDelayMin(cp) {
  if (cp && typeof cp.delay === "number") return cp.delay;
  if (cp && cp.prognosis && cp.prognosis.departure && cp.departure) {
    return Math.round((new Date(cp.prognosis.departure) - new Date(cp.departure)) / 60000);
  }
  if (cp && cp.prognosis && cp.prognosis.arrival && cp.arrival) {
    return Math.round((new Date(cp.prognosis.arrival) - new Date(cp.arrival)) / 60000);
  }
  return 0;
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

function buildLegs(conn) {
  const legs = [];
  for (const s of (conn.sections || [])) {
    if (s.journey) {
      legs.push({
        shortLabel: shortLine(s.journey),
        operator: s.journey.operator || "",
        from: s.departure?.station?.name || "",
        to: s.arrival?.station?.name || "",
      });
    }
  }
  return legs;
}
function shortLine(journey) {
  const cat = (journey.category || "").trim();
  const num = journey.number ? String(journey.number).trim() : "";
  return (cat + num) || cat || "Treno";
}

// ---------- Render ----------
function render() {
  const now = Date.now() / 1000;
  const upcoming = connections
    .filter(c => c.from && c.from.departureTimestamp && c.from.departureTimestamp > now - 60)
    .slice(0, SHOW);

  if (upcoming.length === 0) {
    listEl.innerHTML = `<div class="state-msg">Nessun treno imminente trovato.<br>Nuovo tentativo in corso…</div>`;
    return;
  }
  listEl.innerHTML = upcoming.map((c, i) => renderCard(c, i === 0)).join("");
  updateCountdowns();
}

function renderCard(c, isNext) {
  const depTs = c.from.departureTimestamp;
  const arrTs = c.to.arrivalTimestamp;
  const transfers = c.transfers || 0;
  const durMin = arrTs && depTs ? Math.round((arrTs - depTs) / 60) : null;

  const depDelay = getDelayMin(c.from);
  const arrDelay = getDelayMin(c.to);

  // Orario di partenza: se in ritardo, mostro l'orario di orario barrato + quello reale.
  let depBlock;
  if (depDelay > 0) {
    const realDep = c.from.prognosis?.departure ? fmtISO(c.from.prognosis.departure) : fmtTime(depTs + depDelay * 60);
    depBlock = `<span class="dep-time struck">${fmtTime(depTs)}</span><span class="dep-real">${realDep}</span>`;
  } else {
    depBlock = `<span class="dep-time">${fmtTime(depTs)}</span>`;
  }

  const delayHtml = depDelay > 0
    ? `<span class="delay late">+${depDelay}′ ritardo</span>`
    : `<span class="delay ontime">in orario</span>`;

  // Binario: se il pronostico ne indica uno diverso, lo segnalo.
  const schedPlat = c.from.platform;
  const realPlat = c.from.prognosis?.platform || schedPlat;
  const platChanged = c.from.prognosis?.platform && c.from.prognosis.platform !== schedPlat;
  const platHtml = realPlat
    ? `<span class="platform ${platChanged ? "changed" : ""}">Binario <b>${escapeHtml(realPlat)}</b>${platChanged ? " (cambiato)" : ""}</span>`
    : "";

  const legs = buildLegs(c);
  const legsHtml = legs.map((leg, idx) => {
    const isFlp = /flp/i.test(leg.operator) || /^S6\d/.test(leg.shortLabel);
    const arrow = idx < legs.length - 1
      ? `<span class="leg-arrow">→ ${escapeHtml(leg.to)} →</span>` : "";
    return `<span class="leg-line ${isFlp ? "flp" : ""}"><span class="badge">${escapeHtml(leg.shortLabel)}</span></span>${arrow}`;
  }).join("");

  const transferTxt = transfers === 0
    ? "Diretto"
    : `${transfers} cambio${transfers > 1 ? "i" : ""}${legs.length > 1 ? " · " + escapeHtml(legs[0].to) : ""}`;

  // Arrivo: se in ritardo, mostro l'orario reale in giallo.
  let arrHtml;
  if (arrDelay > 0) {
    const realArr = c.to.prognosis?.arrival ? fmtISO(c.to.prognosis.arrival) : fmtTime(arrTs + arrDelay * 60);
    arrHtml = `Arrivo <b class="late-arr">${realArr}</b> <span class="late-arr">(+${arrDelay}′)</span>`;
  } else {
    arrHtml = `Arrivo <b>${fmtTime(arrTs)}</b>`;
  }

  // Countdown basato sull'orario reale di partenza.
  const realDepTs = depTs + depDelay * 60;

  return `
    <div class="card ${isNext ? "next" : ""}">
      <div class="dep">
        <div>${depBlock}</div>
        <div class="dep-meta">${delayHtml} ${platHtml}</div>
      </div>
      <div class="path">
        <div class="route-legs">${legsHtml}</div>
        <div class="trip-info">${transferTxt}${durMin != null ? " · " + durMin + " min" : ""}</div>
      </div>
      <div class="count" data-dep="${realDepTs}">
        <div class="big">--</div>
        <div class="unit">min alla partenza</div>
        <div class="arr">${arrHtml}</div>
      </div>
    </div>`;
}

function updateCountdowns() {
  const now = Date.now() / 1000;
  document.querySelectorAll(".count").forEach(el => {
    const dep = Number(el.dataset.dep);
    const diffMin = Math.round((dep - now) / 60);
    const bigEl = el.querySelector(".big");
    const unitEl = el.querySelector(".unit");
    el.classList.remove("soon", "now");
    if (diffMin <= 0) {
      bigEl.textContent = "ora";
      unitEl.textContent = "in partenza";
      el.classList.add("now");
    } else {
      bigEl.textContent = diffMin;
      unitEl.textContent = "min alla partenza";
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
