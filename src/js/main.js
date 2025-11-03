// Use the Bootstrap bundle so Popper (tooltips) is included.
import "bootstrap/dist/js/bootstrap.bundle";

import data from "../data/patchbay.json";
import { Tooltip } from "bootstrap";

async function load() {
  renderAll(data);
}

function renderAll(data) {
  renderMeta(data);
  renderLegend(data);
  renderFrontPanel(data);
  renderTable(data);
  enableTooltips();
  wireFilter();
}

function renderMeta(data) {
  const el = document.getElementById("meta");
  const rows = data?.rows ? `${data.rows.A} / ${data.rows.B}` : "top/bottom";
  el.textContent = `${data.meta?.name ?? "Patchbay"} · ${
    data.meta?.device ?? ""
  } · ${rows} · ${data.meta?.channels_total ?? ""} channels`;
}

function renderLegend(data) {
  const gWrap = document.getElementById("legend-groups");
  const nWrap = document.getElementById("legend-norm");
  const notes = document.getElementById("legend-notes");

  const groups = data.legend?.groups || {};
  const colors = data.legend?.colors || {};
  gWrap.innerHTML = "";
  Object.entries(groups).forEach(([key, label]) => {
    const color = toCssColor(colors[key]);
    const item = document.createElement("div");
    item.innerHTML = `
      <span class="legend-dot" style="background:${color}"></span>
      <strong>${key}</strong> <span class="text-secondary">${label}</span>
    `;
    gWrap.appendChild(item);
  });

  const norm = data.legend?.normalling || {};
  nWrap.innerHTML = "";
  Object.entries(norm).forEach(([code, text]) => {
    const badgeClass =
      code === "HN" ? "badge-hn" : code === "TH" ? "badge-th" : "badge-fn";
    const div = document.createElement("div");
    div.innerHTML = `<span class="badge ${badgeClass}">${code}</span> <span class="text-secondary">${text}</span>`;
    nWrap.appendChild(div);
  });

  notes.textContent = data.meta?.notes || "";
}

function toCssColor(name) {
  const map = {
    amber: "var(--color-amber)",
    teal: "var(--color-teal)",
    purple: "var(--color-purple)",
    rose: "var(--color-rose)",
    blue: "var(--color-blue)",
    green: "var(--color-green)",
    gray: "var(--color-gray)",
  };
  return map[name] || "var(--color-gray)";
}

function renderFrontPanel(data) {
  const stripA = document.getElementById("stripA");
  const stripB = document.getElementById("stripB");
  stripA.innerHTML = "";
  stripB.innerHTML = "";

  const chanByIndex = new Map();
  (data.channels || []).forEach((c) => chanByIndex.set(c.ch, c));

  const labelsA = data.front_panel_labels?.stripA || [];
  const labelsB = data.front_panel_labels?.stripB || [];

  for (let i = 0; i < labelsA.length; i++) {
    const chNum = i + 1;
    const ch = chanByIndex.get(chNum);
    const norm = ch?.normalling || data.meta?.normalling_default || "HN";
    const groupKey = ch?.group || "AUX";
    const aFull = ch?.a_full || "";
    const tipA = ch?.tooltips?.a || "";
    const title = [aFull, tipA].filter(Boolean).join(" — ");

    const jack = document.createElement("div");
    jack.className = "jack";
    jack.setAttribute("data-bs-toggle", "tooltip");
    jack.setAttribute("data-bs-title", title);
    jack.innerHTML = `
      <span class="ch">${chNum}</span>
      <span class="norm">${norm}</span>
      <span class="group-dot g-${groupKey}"></span>
      <div>${escapeHtml(labelsA[i])}</div>
    `;
    stripA.appendChild(jack);
  }

  for (let i = 0; i < labelsB.length; i++) {
    const chNum = i + 1;
    const ch = chanByIndex.get(chNum);
    const norm = ch?.normalling || data.meta?.normalling_default || "HN";
    const groupKey = ch?.group || "AUX";
    const bFull = ch?.b_full || "";
    const tipB = ch?.tooltips?.b || "";
    const title = [bFull, tipB].filter(Boolean).join(" — ");

    const jack = document.createElement("div");
    jack.className = "jack";
    jack.setAttribute("data-bs-toggle", "tooltip");
    jack.setAttribute("data-bs-title", title);
    jack.innerHTML = `
      <span class="ch">${chNum}</span>
      <span class="norm">${norm}</span>
      <span class="group-dot g-${groupKey}"></span>
      <div>${escapeHtml(labelsB[i])}</div>
    `;
    stripB.appendChild(jack);
  }
}

function renderTable(data) {
  const tbody = document.getElementById("channels-body");
  tbody.innerHTML = "";
  (data.channels || []).forEach((c) => {
    const tr = document.createElement("tr");
    tr.dataset.search = [
      c.ch,
      c.group,
      c.normalling,
      c.a_short,
      c.a_full,
      c.b_short,
      c.b_full,
      c.tooltips?.a,
      c.tooltips?.b,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    tr.innerHTML = `
      <td><span class="badge text-bg-secondary">${c.ch}</span></td>
      <td><span class="legend-dot" style="background:${groupColor(
        data,
        c.group
      )}"></span> ${c.group}</td>
      <td>${normBadge(c.normalling)}</td>
      <td><code>${escapeHtml(c.a_short || "")}</code></td>
      <td><code>${escapeHtml(c.b_short || "")}</code></td>
      <td class="text-secondary small">
        ${escapeHtml(c.tooltips?.a || "")}
        ${c.tooltips?.a && c.tooltips?.b ? " · " : ""}
        ${escapeHtml(c.tooltips?.b || "")}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function normBadge(code = "HN") {
  const cls =
    code === "HN" ? "badge-hn" : code === "TH" ? "badge-th" : "badge-fn";
  return `<span class="badge ${cls}">${code}</span>`;
}

function groupColor(data, key) {
  const name = (data.legend?.colors || {})[key] || "gray";
  return toCssColor(name);
}

function wireFilter() {
  const input = document.getElementById("filter");
  const rows = Array.from(document.querySelectorAll("#channels-body tr"));
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    rows.forEach((tr) => {
      const hay = tr.dataset.search || "";
      tr.style.display = hay.includes(q) ? "" : "none";
    });
  });
}

function enableTooltips() {
  // Bootstrap 5 tooltips (delegated)
  new Tooltip(document.body, {
    selector: "[data-bs-toggle='tooltip']",
    container: "body",
    boundary: "window",
  });
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

load();
