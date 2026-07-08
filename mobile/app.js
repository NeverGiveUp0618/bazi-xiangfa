const graph = window.BAZI_GRAPH;
const STORAGE_PREFIX = "bazi_xiangyi_mobile_v2__";

const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const PILLARS = ["年", "月", "日", "时"];
const GAN_WUXING = { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" };
const ZHI_WUXING = { 子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水" };
const GAN_YINYANG = { 甲: "阳", 乙: "阴", 丙: "阳", 丁: "阴", 戊: "阳", 己: "阴", 庚: "阳", 辛: "阴", 壬: "阳", 癸: "阴" };
const WUXING_SHENG = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const WUXING_KE = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
const GAN_HE = { 甲: "己", 己: "甲", 乙: "庚", 庚: "乙", 丙: "辛", 辛: "丙", 丁: "壬", 壬: "丁", 戊: "癸", 癸: "戊" };
const ZHI_CHONG = { 子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅", 卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳" };
const ZHI_HE = { 子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯", 辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午" };
const ZHI_CHUAN = new Set(["寅巳", "巳寅", "丑午", "午丑", "申亥", "亥申", "酉戌", "戌酉", "卯辰", "辰卯", "子未", "未子"]);
const ZHI_PO = new Set(["子卯", "卯子", "子酉", "酉子", "卯午", "午卯", "午酉", "酉午"]);
const ZHI_ANHE = new Set(["申卯", "卯申", "亥午", "午亥", "丑寅", "寅丑", "子巳", "巳子"]);
const ZHI_SANHE = [["申", "子", "辰", "水"], ["亥", "卯", "未", "木"], ["寅", "午", "戌", "火"], ["巳", "酉", "丑", "金"]];
const ZHI_SANHUI = [["寅", "卯", "辰", "木"], ["巳", "午", "未", "火"], ["申", "酉", "戌", "金"], ["亥", "子", "丑", "水"]];

const el = {
  topHint: document.querySelector("#topHint"),
  globalSearch: document.querySelector("#globalSearch"),
  quickRow: document.querySelector("#quickRow"),
  clearSearch: document.querySelector("#clearSearch"),
  searchResults: document.querySelector("#searchResults"),
  baziCells: document.querySelector("#baziCells"),
  charPicker: document.querySelector("#charPicker"),
  scanRelations: document.querySelector("#scanRelations"),
  useBaziAsSearch: document.querySelector("#useBaziAsSearch"),
  resetBazi: document.querySelector("#resetBazi"),
  relationEvidence: document.querySelector("#relationEvidence"),
  baziResults: document.querySelector("#baziResults"),
  nextCard: document.querySelector("#nextCard"),
  studyCard: document.querySelector("#studyCard"),
  systemTabs: document.querySelector("#systemTabs"),
  libraryCount: document.querySelector("#libraryCount"),
  libraryNodes: document.querySelector("#libraryNodes"),
  detailTitle: document.querySelector("#detailTitle"),
  detailCard: document.querySelector("#detailCard"),
  backToPrevious: document.querySelector("#backToPrevious")
};

let activeView = "search";
let previousView = "search";
let activeSystemId = graph.systems[0]?.id;
let selectedNodeId = graph.systems[0]?.nodes[0]?.id;
let selectedBaziCell = 0;
let bazi = storageGet("bazi", ["甲", "乙", "丙", "丁", "子", "丑", "午", "酉"]);
let relations = [];
let studyNode = null;

const nodes = graph.systems.flatMap(system => system.nodes.map(node => ({ ...node, systemId: system.id, systemTitle: system.title })));
const quickTerms = ["文书", "财富", "竞争", "表达", "规则", "母亲", "财库", "冲", "合", "穿", "纳音"];

function storageGet(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PREFIX + key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textOfNode(node) {
  return [
    node.title,
    node.type,
    node.systemTitle,
    ...node.core,
    ...Object.keys(node.branches),
    ...Object.values(node.branches).flat(),
    ...node.rules,
    ...node.relations
  ].join(" ");
}

function branchPlain(node) {
  const keys = ["大白话", "像什么", "取象说明", "说明", "判断"];
  for (const key of keys) {
    const value = node.branches[key];
    if (value?.length) return value[0];
  }
  return node.rules[0] || node.core.slice(0, 4).join("、");
}

function scoreNode(node, query) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  const haystack = textOfNode(node).toLowerCase();
  return terms.reduce((score, term) => {
    const lower = term.toLowerCase();
    if (node.title.toLowerCase().includes(lower)) return score + 40;
    if (node.core.some(item => item.toLowerCase().includes(lower))) return score + 24;
    if (haystack.includes(lower)) return score + 10;
    return score;
  }, 0);
}

function searchNodes(query, limit = 18) {
  const normalized = query.trim();
  const source = normalized ? nodes : nodes.slice(0, 18);
  return source
    .map(node => ({ node, score: scoreNode(node, normalized) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.node.title.localeCompare(b.node.title, "zh-CN"))
    .slice(0, limit);
}

function renderQuickRow() {
  const query = el.globalSearch.value.trim();
  el.quickRow.innerHTML = quickTerms.map(term => `
    <button type="button" class="${query === term ? "active" : ""}" data-quick="${escapeHtml(term)}">${escapeHtml(term)}</button>
  `).join("");
}

function renderResults(container, results, emptyText = "没有找到匹配象义。") {
  container.innerHTML = results.length
    ? results.map(({ node, score }) => nodeCard(node, score)).join("")
    : `<div class="empty-card">${escapeHtml(emptyText)}</div>`;
}

function nodeCard(node, score) {
  return `
    <button class="node-card" type="button" data-open-node="${escapeHtml(node.id)}">
      <div class="node-title">
        <strong>${escapeHtml(node.title)}</strong>
        <span class="type-pill">${escapeHtml(node.type)}</span>
      </div>
      <div class="core-row">
        ${node.core.slice(0, 5).map(item => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
      <p class="plain">${escapeHtml(branchPlain(node))}</p>
      <div class="tag-row">
        <span>${escapeHtml(node.systemTitle)}</span>
        ${score > 1 ? `<span>匹配 ${score}</span>` : ""}
      </div>
    </button>
  `;
}

function renderSearch() {
  const query = el.globalSearch.value.trim();
  renderQuickRow();
  renderResults(el.searchResults, searchNodes(query), "换个词试试，比如“文书”“财库”“子午冲”。");
}

function getBaziCells() {
  const cells = [];
  for (let row = 0; row < 2; row++) {
    for (let pillar = 0; pillar < 4; pillar++) {
      const index = row * 4 + pillar;
      cells.push({
        index,
        pillar,
        type: row === 0 ? "gan" : "zhi",
        value: bazi[index],
        label: `${PILLARS[pillar]}${row === 0 ? "干" : "支"}`
      });
    }
  }
  return cells;
}

function relationKind(title) {
  if (title.includes("六冲")) return "冲";
  if (title.includes("穿")) return "穿";
  if (title.includes("六合") || title.includes("五合")) return "合";
  if (title.includes("暗合")) return "暗";
  if (title.includes("破")) return "破";
  if (title.includes("三合") || title.includes("半合") || title.includes("拱合")) return "三合";
  if (title.includes("三会")) return "三会";
  if (title.includes("伏吟")) return "伏";
  return "";
}

function relationItem(title, cells, why, points) {
  return { title, kind: relationKind(title), cells, why, points: [...new Set(points)] };
}

function relationText(item) {
  return item.cells.map(cell => `${cell.label}${cell.value}`).join(" ↔ ");
}

function tenGod(dayGan, otherGan) {
  if (!dayGan || !otherGan) return "";
  if (dayGan === otherGan) return "日主";
  const dayWx = GAN_WUXING[dayGan];
  const otherWx = GAN_WUXING[otherGan];
  const same = GAN_YINYANG[dayGan] === GAN_YINYANG[otherGan];
  if (dayWx === otherWx) return same ? "比肩" : "劫财";
  if (WUXING_SHENG[dayWx] === otherWx) return same ? "食神" : "伤官";
  if (WUXING_SHENG[otherWx] === dayWx) return same ? "偏印" : "正印";
  if (WUXING_KE[dayWx] === otherWx) return same ? "偏财" : "正财";
  if (WUXING_KE[otherWx] === dayWx) return same ? "七杀" : "正官";
  return "";
}

function scanBazi() {
  const cells = getBaziCells();
  const gan = cells.filter(cell => cell.type === "gan");
  const zhi = cells.filter(cell => cell.type === "zhi");
  const found = [];

  for (let i = 0; i < gan.length; i++) {
    for (let j = i + 1; j < gan.length; j++) {
      const a = gan[i], b = gan[j];
      if (GAN_HE[a.value] === b.value) found.push(relationItem(`${a.value}${b.value}天干五合`, [a, b], "天干五合主牵连、合绊、合作或控制。", ["天干五合", "合", a.value, b.value]));
      if (a.value === b.value) found.push(relationItem(`${a.value}伏吟`, [a, b], "同一字重复，主同象加强、旧事重来或反复。", ["伏吟", "重复", a.value]));
    }
  }

  for (let i = 0; i < zhi.length; i++) {
    for (let j = i + 1; j < zhi.length; j++) {
      const a = zhi[i], b = zhi[j], pair = a.value + b.value;
      if (ZHI_CHONG[a.value] === b.value) found.push(relationItem(`${a.value}${b.value}六冲`, [a, b], "六冲主动荡、位移、分离或打开，重点看冲到哪个宫位。", ["六冲", "冲", a.value, b.value]));
      if (ZHI_CHUAN.has(pair)) found.push(relationItem(`${a.value}${b.value}穿`, [a, b], "穿主暗伤、漏洞、背后损耗，常比冲更隐蔽。", ["穿", "六穿", a.value, b.value]));
      if (ZHI_HE[a.value] === b.value) found.push(relationItem(`${a.value}${b.value}六合`, [a, b], "六合主亲近、绑定、合作，也可能合绊拖住。", ["六合", "合", a.value, b.value]));
      if (ZHI_ANHE.has(pair)) found.push(relationItem(`${a.value}${b.value}暗合`, [a, b], "暗合主隐性牵连、私下关系或暗中配合。", ["暗合", a.value, b.value]));
      if (ZHI_PO.has(pair)) found.push(relationItem(`${a.value}${b.value}破`, [a, b], "破主完整性受损，关系或生助路径有裂痕。", ["破", a.value, b.value]));
      if (a.value === b.value) found.push(relationItem(`${a.value}伏吟`, [a, b], "同支重复，主同象加强、事件反复。", ["伏吟", "重复", a.value]));
    }
  }

  ZHI_SANHE.forEach(group => {
    const present = group.slice(0, 3).flatMap(item => zhi.filter(cell => cell.value === item));
    const values = [...new Set(present.map(cell => cell.value))];
    if (values.length >= 2) found.push(relationItem(`${values.join("")}${values.length === 3 ? "三合" : "半合/拱合"}${group[3]}局`, present, "三合主力量汇聚，半合拱合代表已有方向。", ["三合", "半合", `${group[3]}局`]));
  });
  ZHI_SANHUI.forEach(group => {
    const present = group.slice(0, 3).flatMap(item => zhi.filter(cell => cell.value === item));
    const values = [...new Set(present.map(cell => cell.value))];
    if (values.length === 3) found.push(relationItem(`${values.join("")}三会${group[3]}方`, present, "三会主方气和季节环境成势。", ["三会", `${group[3]}方`]));
  });

  return found.sort((a, b) => relationWeight(b) - relationWeight(a));
}

function relationWeight(item) {
  const weights = { 冲: 100, 穿: 92, 合: 88, 暗: 84, 破: 78, 三合: 70, 三会: 68, 伏: 28 };
  return weights[item.kind] || 30;
}

function markersForCell(index) {
  return [...new Set(relations
    .filter(item => item.kind && item.cells.some(cell => cell.index === index))
    .map(item => item.kind))]
    .sort((a, b) => relationWeight({ kind: b }) - relationWeight({ kind: a }))
    .slice(0, 3);
}

function renderBazi() {
  const cells = getBaziCells();
  el.baziCells.innerHTML = cells.map(cell => {
    const markers = markersForCell(cell.index);
    return `
      <button type="button" class="bazi-cell ${selectedBaziCell === cell.index ? "active" : ""} ${cell.index === 2 ? "day-master" : ""}" data-bazi-cell="${cell.index}">
        <strong>${escapeHtml(cell.value)}</strong>
        <span>${escapeHtml(cell.label)}</span>
        ${markers.length ? `<em>${markers.map(escapeHtml).join(" / ")}</em>` : ""}
      </button>
    `;
  }).join("");

  const pool = selectedBaziCell < 4 ? GAN : ZHI;
  el.charPicker.innerHTML = pool.map(char => `
    <button type="button" class="${bazi[selectedBaziCell] === char ? "active" : ""}" data-char="${char}">${char}</button>
  `).join("");

  renderRelationEvidence();
}

function renderRelationEvidence() {
  el.relationEvidence.innerHTML = relations.length
    ? relations.slice(0, 10).map(item => `
      <button class="evidence-card" type="button" data-relation-search="${escapeHtml(item.points.join(" "))}">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(relationText(item))}</span>
        <p>${escapeHtml(item.why)}</p>
      </button>
    `).join("")
    : `<div class="empty-card">点“扫描关系”，这里会直接写清楚哪两个字冲、合、穿、破。</div>`;
}

function queryFromBazi() {
  const dayGan = bazi[2];
  const dayZhi = bazi[6];
  const base = [`${dayGan}日主`, "日支", "夫妻宫", dayZhi, ...PILLARS.flatMap((pillar, index) => {
    const god = index === 2 ? "日主" : tenGod(dayGan, bazi[index]);
    return [`${pillar}柱`, `${pillar}干${bazi[index]}`, `${pillar}支${bazi[index + 4]}`, god];
  })];
  return [...new Set([...base, ...relations.flatMap(item => item.points)])].filter(Boolean).join(" ");
}

function renderBaziResults() {
  renderResults(el.baziResults, searchNodes(queryFromBazi(), 12), "先排盘并扫描关系，再按此盘查询。");
}

function randomNode() {
  return nodes[Math.floor(Math.random() * nodes.length)];
}

function renderStudy() {
  if (!studyNode) studyNode = randomNode();
  el.studyCard.innerHTML = `
    <div>
      <h3>${escapeHtml(studyNode.title)}</h3>
      <p class="study-meta">${escapeHtml(studyNode.systemTitle)} / ${escapeHtml(studyNode.type)}</p>
    </div>
    <div class="big-core">
      ${studyNode.core.slice(0, 4).map(item => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
    <p class="plain">${escapeHtml(branchPlain(studyNode))}</p>
    <button type="button" data-open-node="${escapeHtml(studyNode.id)}">看完整象义</button>
  `;
}

function renderLibrary() {
  el.libraryCount.textContent = `${nodes.length} 个节点`;
  el.systemTabs.innerHTML = graph.systems.map(system => `
    <button type="button" class="${system.id === activeSystemId ? "active" : ""}" data-system="${escapeHtml(system.id)}">
      ${escapeHtml(system.title)}
    </button>
  `).join("");
  const system = graph.systems.find(item => item.id === activeSystemId) || graph.systems[0];
  renderResults(el.libraryNodes, system.nodes.map(node => ({ node: nodes.find(item => item.id === node.id) || node, score: 1 })), "这个体系暂无内容。");
}

function openDetail(nodeId) {
  const node = nodes.find(item => item.id === nodeId);
  if (!node) return;
  selectedNodeId = nodeId;
  previousView = activeView === "detail" ? previousView : activeView;
  el.detailTitle.textContent = node.title;
  el.detailCard.innerHTML = `
    <div>
      <h3>${escapeHtml(node.title)}</h3>
      <p class="study-meta">${escapeHtml(node.systemTitle)} / ${escapeHtml(node.type)}</p>
    </div>
    <div class="big-core">
      ${node.core.slice(0, 6).map(item => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
    <p class="plain">${escapeHtml(branchPlain(node))}</p>
    ${Object.entries(node.branches).map(([title, values]) => `
      <section class="branch-block">
        <h4>${escapeHtml(title)}</h4>
        <ul>${values.slice(0, 18).map(value => `<li>${escapeHtml(value)}</li>`).join("")}</ul>
      </section>
    `).join("")}
    ${node.rules.length ? `<section class="branch-block"><h4>判断提醒</h4><ul class="rules">${node.rules.map(rule => `<li>${escapeHtml(rule)}</li>`).join("")}</ul></section>` : ""}
    ${node.relations.length ? `<section class="branch-block"><h4>关联入口</h4><ul>${node.relations.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : ""}
  `;
  switchView("detail");
}

function switchView(view) {
  activeView = view;
  document.querySelectorAll(".view").forEach(item => item.classList.toggle("active", item.id === `view-${view}`));
  document.querySelectorAll(".bottom-nav button").forEach(item => item.classList.toggle("active", item.dataset.view === view));
  el.topHint.textContent = {
    search: "想到一个词，先查共象",
    bazi: "先看哪两个字发生作用",
    study: "每天翻几张，熟悉象义",
    library: "按体系慢慢翻",
    detail: "完整解释"
  }[view] || "手机学习版";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function boot() {
  renderQuickRow();
  renderSearch();
  renderBazi();
  renderStudy();
  renderLibrary();
}

document.body.addEventListener("click", event => {
  const nav = event.target.closest("[data-view]");
  if (nav) {
    switchView(nav.dataset.view);
    return;
  }

  const quick = event.target.closest("[data-quick]");
  if (quick) {
    el.globalSearch.value = quick.dataset.quick;
    renderSearch();
    switchView("search");
    return;
  }

  const open = event.target.closest("[data-open-node]");
  if (open) {
    openDetail(open.dataset.openNode);
    return;
  }

  const cell = event.target.closest("[data-bazi-cell]");
  if (cell) {
    selectedBaziCell = Number(cell.dataset.baziCell);
    renderBazi();
    return;
  }

  const charButton = event.target.closest("[data-char]");
  if (charButton) {
    bazi[selectedBaziCell] = charButton.dataset.char;
    relations = [];
    storageSet("bazi", bazi);
    renderBazi();
    el.baziResults.innerHTML = "";
    return;
  }

  const relationSearch = event.target.closest("[data-relation-search]");
  if (relationSearch) {
    el.globalSearch.value = relationSearch.dataset.relationSearch;
    renderSearch();
    switchView("search");
    return;
  }

  const system = event.target.closest("[data-system]");
  if (system) {
    activeSystemId = system.dataset.system;
    renderLibrary();
    return;
  }
});

el.globalSearch.addEventListener("input", renderSearch);

el.clearSearch.addEventListener("click", () => {
  el.globalSearch.value = "";
  renderSearch();
});

el.scanRelations.addEventListener("click", () => {
  relations = scanBazi();
  renderBazi();
  renderBaziResults();
});

el.useBaziAsSearch.addEventListener("click", () => {
  if (!relations.length) relations = scanBazi();
  renderBazi();
  renderBaziResults();
});

el.resetBazi.addEventListener("click", () => {
  bazi = ["甲", "乙", "丙", "丁", "子", "丑", "午", "酉"];
  relations = [];
  selectedBaziCell = 0;
  storageSet("bazi", bazi);
  renderBazi();
  el.baziResults.innerHTML = "";
});

el.nextCard.addEventListener("click", () => {
  studyNode = randomNode();
  renderStudy();
});

el.backToPrevious.addEventListener("click", () => {
  switchView(previousView || "search");
});

boot();
