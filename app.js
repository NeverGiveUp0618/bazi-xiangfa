const graph = window.BAZI_GRAPH;
let activeSystemId = "ten-gods";
let selectedNode = graph.systems.find(system => system.id === activeSystemId)?.nodes[0] || graph.systems[0].nodes[0];

const navEl = document.querySelector("#nav");
const treeEl = document.querySelector("#tree");
const detailEl = document.querySelector("#detail");
const searchInput = document.querySelector("#searchInput");
const emptyEl = document.querySelector("#empty");
const viewTitle = document.querySelector("#viewTitle");
const viewDesc = document.querySelector("#viewDesc");
const insightPanel = document.querySelector("#insightPanel");
const casePanel = document.querySelector("#casePanel");
const networkPanel = document.querySelector("#networkPanel");
const studyPanel = document.querySelector("#studyPanel");
const studyTools = document.querySelector("#studyTools");
const casePointInput = document.querySelector("#casePointInput");
const casePointsEl = document.querySelector("#casePoints");
const addCasePointButton = document.querySelector("#addCasePoint");
const runCaseQueryButton = document.querySelector("#runCaseQuery");
const clearCasePointsButton = document.querySelector("#clearCasePoints");
const baziCellsEl = document.querySelector("#baziCells");
const baziCharPickerEl = document.querySelector("#baziCharPicker");
const addBaziPointsButton = document.querySelector("#addBaziPoints");
const scanBaziRelationsButton = document.querySelector("#scanBaziRelations");

let studyCard = null;
let studyAnswerVisible = false;
let networkPreviewNodeId = "";
let networkFilter = storageGet("bazi_xiangyi_network_filter", "all");
let weightMode = storageGet("bazi_xiangyi_weight_mode", "balanced");
let caseSearch = "";
let casePoints = storageGet("bazi_xiangyi_case_points", []);
let caseBazi = storageGet("bazi_xiangyi_case_bazi", ["甲", "甲", "甲", "甲", "子", "子", "子", "子"]);
let selectedBaziCell = 0;
let scannedBaziRelations = [];

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
const ZHI_ANHE = new Set(["申卯", "卯申", "亥午", "午亥", "丑寅", "寅丑", "子巳", "巳子"]);
const ZHI_CHUAN = new Set(["寅巳", "巳寅", "丑午", "午丑", "申亥", "亥申", "酉戌", "戌酉", "卯辰", "辰卯", "子未", "未子"]);
const ZHI_PO = new Set(["子卯", "卯子", "子酉", "酉子", "卯午", "午卯", "午酉", "酉午"]);
const ZHI_JUE = new Set(["申卯", "卯申", "亥午", "午亥", "子巳", "巳子", "寅酉", "酉寅"]);
const ZHI_SANHE = [["申", "子", "辰", "水"], ["亥", "卯", "未", "木"], ["寅", "午", "戌", "火"], ["巳", "酉", "丑", "金"]];
const ZHI_SANHUI = [["寅", "卯", "辰", "木"], ["巳", "午", "未", "火"], ["申", "酉", "戌", "金"], ["亥", "子", "丑", "水"]];

const synonymGroups = [
  ["文书", "合同", "证书", "档案", "手续", "证明", "审批", "学历"],
  ["财富", "财", "钱财", "资产", "资源", "收入", "变现"],
  ["官", "官杀", "正官", "七杀", "规则", "权力", "压力", "职位"],
  ["印", "印星", "正印", "偏印", "母亲", "学历", "房产", "庇护"],
  ["食伤", "食神", "伤官", "表达", "技术", "才华", "输出"],
  ["比劫", "比肩", "劫财", "竞争", "朋友", "同辈", "团队"],
  ["合", "六合", "天干五合", "暗合", "绑定", "合作", "合绊"],
  ["冲", "六冲", "变动", "迁移", "分离", "冲突"],
  ["穿", "六穿", "害", "六害", "暗伤", "漏洞", "背后损害"],
  ["破", "六破", "破局", "破损", "裂痕"],
  ["墓库", "库", "财库", "仓库", "收藏", "入墓", "开库"],
  ["日支", "夫妻宫", "配偶宫", "婚姻宫", "配偶"],
  ["年柱", "祖上", "长辈", "早年"],
  ["月柱", "父母", "事业", "兄弟", "环境"],
  ["时柱", "子女", "晚年", "结果"]
];

const comboCards = [
  {
    id: "combo-yin-cai",
    title: "印 + 财",
    keys: ["印", "正印", "偏印", "财", "正财", "偏财"],
    core: "文书、资质、房产、母亲、平台与钱财资源发生关系。",
    plain: "像拿证、买房、办手续、用学历资质赚钱；不顺时也像财坏印，钱和学习、名声、母亲、文书打架。",
    check: "重点看印是不是用神、财是否坏印、文书房产是否归主。"
  },
  {
    id: "combo-shishang-guan",
    title: "食伤 + 官杀",
    keys: ["食神", "伤官", "食伤", "官", "正官", "七杀", "官杀"],
    core: "表达、技术、才华与规则、权力、压力相遇。",
    plain: "顺的时候是靠技术表达进入体制或掌权；不顺的时候是伤官见官，才华变成顶撞规则。",
    check: "重点看有没有印化、财通关、杀是否有制。"
  },
  {
    id: "combo-bi-cai",
    title: "比劫 + 财",
    keys: ["比肩", "劫财", "比劫", "财", "正财", "偏财"],
    core: "同辈、人群、竞争与钱财资源相遇。",
    plain: "像合伙、分账、抢客户、团队做钱；不顺时就是夺财、破财、朋友同事牵扯钱。",
    check: "重点看财是否归主，比劫是帮身聚人，还是分财夺财。"
  },
  {
    id: "combo-he-cai",
    title: "合 + 财",
    keys: ["合", "六合", "天干五合", "暗合", "财", "正财", "偏财"],
    core: "钱财、资源、对象被关系牵住。",
    plain: "像合同、合作、婚恋钱财、客户绑定；不顺时也像被钱和人情拖住。",
    check: "重点看合来、合去、合绊、争合，以及财是否能被自己使用。"
  },
  {
    id: "combo-chong-gong",
    title: "冲 + 宫位",
    keys: ["冲", "六冲", "年柱", "月柱", "日柱", "时柱", "宫位"],
    core: "变动、分离、打开与人生位置相遇。",
    plain: "冲年像根源长辈动，冲月像工作父母环境动，冲日像自己或婚恋动，冲时像子女结果动。",
    check: "重点看冲到哪个宫位、哪个十神，是冲开机会还是冲坏根基。"
  },
  {
    id: "combo-muku-cai",
    title: "墓库 + 财",
    keys: ["墓库", "库", "财库", "财", "正财", "偏财"],
    core: "钱财资源被收藏、关闭或打开。",
    plain: "像存款、仓库、房产、旧资产、保险箱；冲开时可能拿到东西，也可能库破流失。",
    check: "重点看库里藏什么、是否透出、被冲是开库还是破库。"
  },
  {
    id: "combo-chuan-fuqi",
    title: "穿 + 夫妻宫",
    keys: ["穿", "六穿", "日支", "夫妻", "配偶"],
    core: "暗伤、漏洞、背后损害落到亲密关系。",
    plain: "不像冲那么明着吵，更像关系里有刺、有漏洞、有难说的不舒服。",
    check: "重点看穿到的是喜用还是忌神，是否同时见合、破、刑。"
  },
  {
    id: "combo-yin-wenshu",
    title: "印 + 文书",
    keys: ["印", "正印", "偏印", "文书", "合同", "证书", "学历"],
    core: "证明、记录、背书、保护、名分。",
    plain: "像证书、学历、合同、档案、审批、手续，有人或制度给你背书。",
    check: "重点看印是否清、是否被财坏、是否被冲破。"
  }
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function storageGet(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function expandQueryTerms(query) {
  const rawTokens = tokenizeQuery(query);
  const expanded = new Set(rawTokens);
  rawTokens.forEach(token => {
    const lower = token.toLowerCase();
    synonymGroups.forEach(group => {
      if (group.some(item => item.toLowerCase() === lower || item.toLowerCase().includes(lower) || lower.includes(item.toLowerCase()))) {
        group.forEach(item => expanded.add(item));
      }
    });
  });
  return [...expanded];
}

function queryTextForMatch(query) {
  return expandQueryTerms(query).join(" ");
}

function saveCaseBazi() {
  storageSet("bazi_xiangyi_case_bazi", caseBazi);
}

function getBaziCellLabel(index) {
  const pillar = PILLARS[index % 4];
  return `${pillar}${index < 4 ? "干" : "支"}`;
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
        value: caseBazi[index],
        label: getBaziCellLabel(index)
      });
    }
  }
  return cells;
}

function tenGod(dayGan, otherGan) {
  if (!dayGan || !otherGan) return "";
  if (dayGan === otherGan) return "日主";
  const dayWx = GAN_WUXING[dayGan];
  const otherWx = GAN_WUXING[otherGan];
  const samePolarity = GAN_YINYANG[dayGan] === GAN_YINYANG[otherGan];
  if (dayWx === otherWx) return samePolarity ? "比肩" : "劫财";
  if (WUXING_SHENG[dayWx] === otherWx) return samePolarity ? "食神" : "伤官";
  if (WUXING_SHENG[otherWx] === dayWx) return samePolarity ? "偏印" : "正印";
  if (WUXING_KE[dayWx] === otherWx) return samePolarity ? "偏财" : "正财";
  if (WUXING_KE[otherWx] === dayWx) return samePolarity ? "七杀" : "正官";
  return "";
}

function relationItem(title, points, why) {
  return { title, points: [...new Set(points)], why };
}

function relationPriority(item) {
  const title = item.title;
  if (title.includes("六冲")) return 100;
  if (title.includes("穿")) return 92;
  if (title.includes("六合") || title.includes("五合")) return 88;
  if (title.includes("暗合")) return 84;
  if (title.includes("破")) return 78;
  if (title.includes("绝")) return 74;
  if (title.includes("三合") || title.includes("半合") || title.includes("拱合")) return 70;
  if (title.includes("三会")) return 68;
  if (title.includes("相克")) return 58;
  if (title.includes("相生")) return 54;
  if (title.includes("日主") || title.includes("日支")) return 48;
  if (title.includes("伏吟")) return 28;
  return 35;
}

function scanBaziRelationItems() {
  const cells = getBaziCells();
  const ganCells = cells.filter(cell => cell.type === "gan");
  const zhiCells = cells.filter(cell => cell.type === "zhi");
  const items = [];

  for (let i = 0; i < ganCells.length; i++) {
    for (let j = i + 1; j < ganCells.length; j++) {
      const a = ganCells[i];
      const b = ganCells[j];
      if (GAN_HE[a.value] === b.value) {
        items.push(relationItem(`${a.value}${b.value}天干五合`, ["天干五合", "合", `${a.label}${a.value}`, `${b.label}${b.value}`], "天干五合主牵连、合绊、合作或控制，要看合来合去。"));
      }
      if (a.value === b.value) {
        items.push(relationItem(`${a.value}伏吟`, ["伏吟", "重复", `${a.label}${a.value}`, `${b.label}${b.value}`], "同一字重复，主同象加强、旧事重来或反复。"));
      }
      const aw = GAN_WUXING[a.value];
      const bw = GAN_WUXING[b.value];
      if (WUXING_SHENG[aw] === bw || WUXING_SHENG[bw] === aw) {
        items.push(relationItem(`${a.value}${b.value}天干相生`, ["相生", "流通", `${a.value}${b.value}`], "相生代表能量流动和递送，需看生到喜神还是忌神。"));
      }
      if (WUXING_KE[aw] === bw || WUXING_KE[bw] === aw) {
        items.push(relationItem(`${a.value}${b.value}天干相克`, ["相克", "制约", `${a.value}${b.value}`], "相克代表管束、切割、压力，也可能成制化。"));
      }
    }
  }

  for (let i = 0; i < zhiCells.length; i++) {
    for (let j = i + 1; j < zhiCells.length; j++) {
      const a = zhiCells[i];
      const b = zhiCells[j];
      const pair = a.value + b.value;
      if (ZHI_CHONG[a.value] === b.value) {
        items.push(relationItem(`${a.value}${b.value}六冲`, ["六冲", "冲", "变动", `${a.label}${a.value}`, `${b.label}${b.value}`], "六冲主动荡、位移、分离或打开，重点看冲到哪个宫位。"));
      }
      if (ZHI_HE[a.value] === b.value) {
        items.push(relationItem(`${a.value}${b.value}六合`, ["六合", "合", "绑定", `${a.label}${a.value}`, `${b.label}${b.value}`], "六合主亲近、绑定、合作，也可能合绊拖住。"));
      }
      if (ZHI_ANHE.has(pair)) {
        items.push(relationItem(`${a.value}${b.value}暗合`, ["暗合", "隐秘", "私下牵连", `${a.label}${a.value}`, `${b.label}${b.value}`], "暗合主隐性牵连、私下关系或暗中配合。"));
      }
      if (ZHI_CHUAN.has(pair)) {
        items.push(relationItem(`${a.value}${b.value}穿`, ["穿", "六穿", "暗伤", "漏洞", `${a.label}${a.value}`, `${b.label}${b.value}`], "穿主暗伤、漏洞、背后损耗，常比冲更隐蔽。"));
      }
      if (ZHI_PO.has(pair)) {
        items.push(relationItem(`${a.value}${b.value}破`, ["破", "破局", "裂痕", `${a.label}${a.value}`, `${b.label}${b.value}`], "破主完整性受损、关系或生助路径有裂痕。"));
      }
      if (ZHI_JUE.has(pair)) {
        items.push(relationItem(`${a.value}${b.value}绝`, ["绝", "断缘", "隔绝", `${a.label}${a.value}`, `${b.label}${b.value}`], "绝主气断、缘薄、隔绝，要看断的是喜神还是忌神。"));
      }
      if (a.value === b.value) {
        items.push(relationItem(`${a.value}伏吟`, ["伏吟", "重复", `${a.label}${a.value}`, `${b.label}${b.value}`], "同支重复，主同象加强、事件反复。"));
      }
    }
  }

  ZHI_SANHE.forEach(group => {
    const present = group.slice(0, 3).filter(zhi => zhiCells.some(cell => cell.value === zhi));
    if (present.length >= 2) {
      items.push(relationItem(`${present.join("")}${present.length === 3 ? "三合" : "半合/拱合"}${group[3]}局`, ["三合", "半合", "拱合", `${group[3]}局`, "局势"], "三合主力量汇聚，半合拱合代表已有方向，待岁运或中神引动。"));
    }
  });
  ZHI_SANHUI.forEach(group => {
    const present = group.slice(0, 3).filter(zhi => zhiCells.some(cell => cell.value === zhi));
    if (present.length === 3) {
      items.push(relationItem(`${present.join("")}三会${group[3]}方`, ["三会", `${group[3]}方`, "环境成势"], "三会主方气和季节环境成势，力量偏大。"));
    }
  });

  const dayGan = caseBazi[2];
  const dayZhi = caseBazi[6];
  items.push(relationItem(`日主${dayGan}`, ["日主", `${dayGan}日主`, dayGan, tenGod(dayGan, dayGan)], "日干是命例观察中心，十神都围绕它来定。"));
  items.push(relationItem(`日支${dayZhi}`, ["日支", "夫妻宫", "配偶宫", dayZhi, `${dayZhi}支`], "日支可看自己坐下、亲密关系、居住和配偶宫。"));
  PILLARS.forEach((pillar, index) => {
    const gan = caseBazi[index];
    const zhi = caseBazi[index + 4];
    const god = index === 2 ? "日主" : tenGod(dayGan, gan);
    items.push(relationItem(`${pillar}柱${gan}${zhi}`, [`${pillar}柱`, `${pillar}干${gan}`, `${pillar}支${zhi}`, gan, zhi, god].filter(Boolean), `${pillar}柱可作为宫位入口，天干偏外，地支偏内。`));
  });

  return items.sort((a, b) => relationPriority(b) - relationPriority(a) || a.title.localeCompare(b.title, "zh-CN"));
}

function renderBaziPicker() {
  const cells = getBaziCells();
  baziCellsEl.innerHTML = `
    ${cells.map(cell => `
      <button type="button" class="bazi-cell ${selectedBaziCell === cell.index ? "active" : ""} ${cell.index === 2 ? "day-master" : ""}" data-bazi-cell="${cell.index}">
        <strong>${escapeHtml(cell.value)}</strong>
        <span>${escapeHtml(cell.label)}</span>
      </button>
    `).join("")}
  `;
  const pool = selectedBaziCell < 4 ? GAN : ZHI;
  baziCharPickerEl.innerHTML = pool.map(char => `
    <button type="button" class="${caseBazi[selectedBaziCell] === char ? "active" : ""}" data-bazi-pick="${char}">${char}</button>
  `).join("");
}

function addBaziObservationPoints() {
  const dayGan = caseBazi[2];
  const dayZhi = caseBazi[6];
  const points = [
    `${dayGan}日主`,
    "日支",
    "夫妻宫",
    ...PILLARS.flatMap((pillar, index) => [`${pillar}柱`, `${pillar}干${caseBazi[index]}`, `${pillar}支${caseBazi[index + 4]}`])
  ];
  setCasePoints([...casePoints, ...points]);
}

function scanAndApplyBaziRelations() {
  scannedBaziRelations = scanBaziRelationItems();
  const relationPoints = scannedBaziRelations.flatMap(item => item.points).slice(0, 32);
  setCasePoints([...casePoints, ...relationPoints]);
  renderCasePanel();
}

function getActiveSystem() {
  return graph.systems.find(system => system.id === activeSystemId);
}

function allNodes() {
  return graph.systems.flatMap(system => system.nodes);
}

function nodeText(node) {
  return [
    node.title,
    node.type,
    ...node.core,
    ...Object.keys(node.branches),
    ...Object.values(node.branches).flat(),
    ...node.rules,
    ...node.relations
  ].join(" ").toLowerCase();
}

function renderNav() {
  navEl.innerHTML = graph.systems.map(system => `
    <button type="button" class="${system.id === activeSystemId ? "active" : ""}" data-system="${system.id}">
      <span>${system.title}</span>
      <span class="count">${system.nodes.length}</span>
    </button>
  `).join("");
}

function renderTree() {
  const system = getActiveSystem();
  viewTitle.textContent = system.title;
  viewDesc.textContent = system.desc;
  const query = searchInput.value.trim().toLowerCase();

  const visibleNodes = system.nodes.filter(node => !query || nodeText(node).includes(query));
  emptyEl.classList.toggle("show", visibleNodes.length === 0);

  treeEl.innerHTML = visibleNodes.map(node => {
    const branches = Object.entries(node.branches).map(([branch, terms]) => {
      const filteredTerms = query
        ? terms.filter(term => term.toLowerCase().includes(query) || branch.toLowerCase().includes(query) || nodeText(node).includes(query))
        : terms;
      return `
        <div class="branch" data-branch="${branch}">
          <div class="branch-title">
            <button type="button" title="收起或展开分支" data-toggle-branch>${filteredTerms.length ? "−" : "+"}</button>
            <span>${branch}</span>
          </div>
          <div class="terms">
            ${filteredTerms.map(term => `<button type="button" class="chip" data-term="${term}" data-node="${node.id}">${term}</button>`).join("")}
          </div>
        </div>
      `;
    }).join("");

    const open = query || node.id === selectedNode.id ? "open" : "";
    return `
      <details class="node" ${open} data-node="${node.id}">
        <summary>
          <span class="twist">›</span>
          <span class="node-title">
            <strong>${node.title}</strong>
            <span class="tag">${node.type}</span>
          </span>
          <span class="summary-actions">
            <button class="icon-btn" type="button" title="查看详情" data-select="${node.id}">详</button>
          </span>
        </summary>
        <div class="children">
          <div class="terms">
            ${node.core.map(term => `<button type="button" class="chip" data-term="${term}" data-node="${node.id}">${term}</button>`).join("")}
          </div>
          ${branches}
        </div>
      </details>
    `;
  }).join("");
}

function findTermBranch(node, term) {
  if (!term) return "";
  const entry = Object.entries(node.branches).find(([, terms]) => terms.includes(term));
  return entry?.[0] || (node.core.includes(term) ? "核心义" : "");
}

function getPlainText(node) {
  const preferredKeys = ["大白话", "气质", "像什么"];
  for (const key of preferredKeys) {
    const values = node.branches[key];
    if (values?.length) return values[0];
  }
  return "";
}

function getBranchReason(branch) {
  const reasons = {
    "核心义": "核心义就是这个符号最底层的意思，后面的分支都是从这里继续发散出来的。",
    "文书": "文书类象通常来自“证明、记录、背书、保护、名分”这些意思，所以会延伸到证书、合同、档案、手续。",
    "人物": "人物类象是把这个符号放到人际关系里看：谁在生我、克我、帮我、我生谁、我克谁，就对应不同的人。",
    "事物": "事物类象是把抽象关系落到具体物品上，找和它功能相似的东西。",
    "物象": "物象是最直观的取法：看形状、材质、颜色、用途、状态和这个符号哪里相似。",
    "心理": "心理类象来自这个符号的作用方式。比如保护会变成依赖，竞争会变成好胜，规则会变成自律或压力。",
    "身体": "身体类象多从五行、寒热燥湿、脏腑和功能来取，不是单看字面。",
    "职业": "职业类象是把这个符号的功能放到社会分工里看：它负责保护、表达、管理、流通、裁断还是承载。",
    "吉凶": "吉凶不是固定好坏，而是这个象发挥得顺不顺、有没有过头、有没有被冲克破坏。",
    "组合": "组合类象看的是两个符号碰在一起后，谁生谁、谁克谁、谁牵制谁。",
    "关系": "关系类象重点看连接方式：是帮助、争夺、合住、冲开、隐藏还是破坏。",
    "时空": "时空类象来自地支本身的季节、方位和时辰，是地支取象的底座。",
    "藏干": "藏干说明地支里面暗藏哪些天干，所以一个地支不只表面一种五行。",
    "事件": "事件类象是把符号的动作翻译成现实场景，比如冲就是动，合就是绑定，刑就是别扭和内耗。",
    "应期": "应期类象看什么时候这个象被岁运、流月、冲合刑害触发。",
    "分辨": "分辨类象提醒你不要机械套用，要看喜忌、宫位、旺衰和组合条件。",
    "气质": "气质是把这个符号当成一种性格底色来看，方便初学者先抓感觉。",
    "优点": "优点是这个象发挥顺畅时的表现。",
    "风险": "风险是这个象过旺、受伤、失衡或用错地方时的表现。",
    "方向": "方向是把这个象落实到适合发展的场景、职业或用法上。",
    "提醒": "提醒是防止误读的地方，通常告诉你不能只看一个字就下结论。",
    "使用提醒": "使用提醒是告诉你这个象能怎么迁移，哪些部分不能硬套。"
  };
  return reasons[branch] || "这个分支是从核心义继续往现实场景里发散出来的，实际判断还要结合五行、十神、宫位和岁运。";
}

function getTypeReason(node) {
  const reasons = {
    "基础": "基础类象用来判断显隐、动静、内外，是其他象义的底层语法。",
    "五行": "五行取象先看自然属性：木生发，火显现，土承载，金裁断，水流动；再延伸到人物、身体、职业和事件。",
    "十神": "十神取象的关键是“和日主的关系”。生我的是印，我生的是食伤，克我的是官杀，我克的是财，同我是比劫。",
    "天干": "天干偏外、偏显，像露在外面的气质和功能；取象时看它的阴阳五行、形态和组合。",
    "地支": "地支偏内、偏根，像季节、环境、身体内部和隐藏关系；取象要看藏干、方位、月令和支间作用。",
    "关系": "关系类象不是单个符号，而是符号之间的动作。合像牵住，冲像撞开，刑像内耗，库像收藏。",
    "神煞": "神煞适合做辅助标签，帮助你抓事件色彩，但不能脱离五行、十神、宫位独断。",
    "纳音": "纳音更像一层比喻和气质标签，用来补充画面感，不能替代原局五行十神判断。",
    "宫位": "宫位取象看这个符号落在人生哪个位置：年看根源，月看环境，日看自己和夫妻，时看子女和结果。",
    "岁运": "岁运取象看什么时候被触发：大运定十年背景，流年流月按时间把原局信息引出来。",
    "资料映射": "资料映射是把其他术数里能和八字相通的象义转译过来，只取共通部分，不照搬原术数规则。"
  };
  return reasons[node.type] || "这个象义来自它的五行属性、关系功能和现实相似性。";
}

function getTermReason(node, term) {
  const branch = findTermBranch(node, term);
  if (!term) return getTypeReason(node);
  const branchText = branch ? `你点的“${term}”属于“${branch}”分支。` : `你点的“${term}”是从“${node.title}”发散出来的一个象。`;
  return `${branchText}${getBranchReason(branch)}`;
}

function nodeTerms(node) {
  const weighted = new Map();
  const add = (term, weight, source) => {
    if (!term || term.length < 2) return;
    const current = weighted.get(term);
    if (!current || weight > current.weight) {
      weighted.set(term, { weight, sources: new Set([source]) });
      return;
    }
    current.sources.add(source);
  };
  node.core.forEach(term => add(term, 4, "核心义"));
  Object.entries(node.branches).forEach(([branch, terms]) => {
    add(branch, 2, "分支名");
    terms.forEach(term => add(term, 2, branch));
  });
  node.relations.forEach(term => add(term, 3, "人工关联"));
  node.rules.forEach(rule => {
    node.core.forEach(term => {
      if (rule.includes(term)) add(term, 1, "规则文本");
    });
  });
  add(node.title, 5, "节点名");
  return weighted;
}

function sharedTermExplanation(term, sourceInfo, targetInfo) {
  const sourceSources = [...sourceInfo.sources];
  const targetSources = [...targetInfo.sources];
  const strong = sourceInfo.weight + targetInfo.weight >= 7;
  const sourceText = sourceSources.slice(0, 2).join("、");
  const targetText = targetSources.slice(0, 2).join("、");
  const reason = strong
    ? "这个词在两边都不是边角料，所以关联度较高"
    : "这个词在两边都出现，说明有一条辅助线索";
  return `“${term}”在当前节点属于${sourceText}，在对方节点属于${targetText}，${reason}`;
}

function overlapExplanation(currentNode, item, focus) {
  const topShared = item.sharedDetails.slice(0, 3);
  if (!topShared.length) return "当前只是弱关联，适合作为辅助参考。";
  const first = topShared[0];
  const firstLine = sharedTermExplanation(first.term, first.sourceInfo, first.targetInfo);
  const rest = topShared.slice(1).map(detail => detail.term);
  const restLine = rest.length ? `同时还重叠了：${rest.join("、")}。` : "";
  const focusLine = focus && item.shared.includes(focus)
    ? `你当前聚焦的“${focus}”也出现在「${item.node.title}」里，所以它对当前问题更值得先看。`
    : "";
  return `${firstLine}。${restLine}${focusLine}`;
}

function getOverlapNodes(node, term) {
  const currentTerms = nodeTerms(node);
  const focus = term?.trim();
  return allNodes()
    .filter(candidate => candidate.id !== node.id)
    .map(candidate => {
      const candidateTerms = nodeTerms(candidate);
      const shared = [];
      const sharedDetails = [];
      let score = 0;

      if (focus && nodeText(candidate).includes(focus.toLowerCase())) {
        shared.push(focus);
        score += 8;
      }

      currentTerms.forEach((sourceInfo, sharedTerm) => {
        const targetInfo = candidateTerms.get(sharedTerm);
        if (targetInfo) {
          shared.push(sharedTerm);
          sharedDetails.push({ term: sharedTerm, sourceInfo, targetInfo, score: sourceInfo.weight + targetInfo.weight });
          score += sourceInfo.weight + targetInfo.weight;
        }
      });

      sharedDetails.sort((a, b) => b.score - a.score);

      return {
        node: candidate,
        score,
        shared: [...new Set(shared)].slice(0, 8),
        sharedDetails
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || b.shared.length - a.shared.length)
    .slice(0, 8);
}

function renderOverlap(node, term) {
  const overlaps = getOverlapNodes(node, term);
  if (!overlaps.length) {
    return `<p>暂时没有找到明显重叠节点。后续内容越多，这里会越有价值。</p>`;
  }
  return `
    <div class="overlap-list">
      ${overlaps.map(item => `
        <div class="overlap-item">
          <button type="button" class="overlap-title" data-select="${item.node.id}">
            <span>${item.node.title}</span>
            <span>${item.node.type}</span>
          </button>
          <div class="overlap-meta">重叠强度：${item.score}</div>
          <p class="overlap-why">${overlapExplanation(node, item, term?.trim())}</p>
          <div class="terms">
            ${item.shared.map(shared => `<button type="button" class="chip" data-term="${shared}" data-node="${item.node.id}">${shared}</button>`).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function tokenizeQuery(query) {
  return [...new Set(query
    .split(/[\s+＋,，、/|]+/)
    .map(item => item.trim())
    .filter(Boolean))];
}

function nodeMatchDetails(node, query) {
  const normalized = query.trim().toLowerCase();
  const tokens = expandQueryTerms(query);
  const rawTokens = tokenizeQuery(query);
  const details = [];
  let score = 0;

  const add = (label, value, weight, reason) => {
    if (!value) return;
    const text = String(value);
    const lower = text.toLowerCase();
    const hit = normalized && lower.includes(normalized);
    const tokenHits = tokens.filter(token => lower.includes(token.toLowerCase()));
    if (!hit && !tokenHits.length) return;
    const matched = hit ? [query] : tokenHits;
    const expandedPenalty = matched.some(item => !rawTokens.includes(item)) ? 0.75 : 1;
    score += weight * Math.max(1, matched.length) * expandedPenalty;
    details.push({ label, value: text, matched, reason, weight });
  };

  add("节点名", node.title, 16, "直接命中节点名，说明这是最明确的入口。");
  add("类型", node.type, 5, "命中节点类型，适合先作为大方向参考。");
  node.core.forEach(term => add("核心义", term, 14, "命中核心义，关联度高，因为它是这个节点的顶层词。"));
  Object.entries(node.branches).forEach(([branch, terms]) => {
    add("分支名", branch, 8, "命中分支名，说明查询词属于这一类发散方向。");
    terms.forEach(term => add(branch, term, 9, `命中「${branch}」分支，可作为具体取象参考。`));
  });
  node.relations.forEach(term => add("人工关联", term, 11, "命中人工关联，说明这个节点被主动串到该主题。"));
  node.rules.forEach(rule => add("规则文本", rule, 6, "命中规则说明，适合看判断条件和限制。"));

  if (tokens.length > 1) {
    const covered = tokens.filter(token => nodeText(node).includes(token.toLowerCase()));
    if (covered.length > 1) {
      score += covered.length * 8;
      details.unshift({
        label: "组合命中",
        value: covered.join(" + "),
        matched: covered,
        reason: "多个查询词同时落在这个节点里，属于更强的共象线索。",
        weight: covered.length * 10
      });
    }
  }

  return { score, details };
}

function strengthLabel(score, detailCount) {
  if (score >= 42 || detailCount >= 5) return { label: "强共象", className: "strong", tip: "多条线索同时指向，可优先看。", scoreText: "依据充分" };
  if (score >= 22 || detailCount >= 3) return { label: "可重点看", className: "medium", tip: "有明确重叠，适合辅助判断。", scoreText: "依据较多" };
  return { label: "参考象", className: "light", tip: "线索较少，先当提示。", scoreText: "依据较少" };
}

function queryResults(query) {
  if (!query.trim()) return [];
  return allNodes()
    .map(node => {
      const match = nodeMatchDetails(node, query);
      return { node, ...match, score: Math.round(match.score * nodeWeight(node)) };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || b.details.length - a.details.length)
    .slice(0, 24);
}

function nodeWeight(node) {
  const map = {
    balanced: {},
    relation: { "关系": 1.35, "组合": 1.2, "十神": 1.05, "纳音": .72 },
    tengod: { "十神": 1.35, "组合": 1.12, "关系": 1.02, "纳音": .7 },
    palace: { "宫位": 1.45, "岁运": 1.25, "组合": 1.12, "关系": 1.05 },
    stembranch: { "天干": 1.28, "地支": 1.28, "关系": 1.12, "组合": 1.05 },
    nayin: { "纳音": 1.45, "五行": 1.15, "关系": .9 }
  };
  return map[weightMode]?.[node.type] || 1;
}

function reverseQueryText(eventText) {
  const text = eventText.trim();
  const rules = [
    [/合同|纠纷|签约|手续/, "文书 合 正印 官杀 财"],
    [/搬家|迁移|出行|变动|换工作/, "六冲 驿马 宫位 岁运"],
    [/婚姻|感情|配偶|离婚|不稳/, "日支 夫妻宫 合 冲 穿 财 官杀"],
    [/考试|学历|证书|学习/, "正印 偏印 文书 官杀 食伤"],
    [/破财|亏损|借钱|投资/, "财 比劫 破 穿 墓库"],
    [/官非|诉讼|处罚|规则/, "官杀 伤官 刑 冲 文书"],
    [/疾病|手术|伤病|血光/, "冲 刑 穿 五行 身体"],
    [/房产|买房|租房|搬迁/, "印 房产 文书 财 墓库 冲"]
  ];
  const hit = rules.find(([pattern]) => pattern.test(text));
  return hit ? hit[1] : text;
}

function matchedCombos(query) {
  const text = query.trim().toLowerCase();
  const tokens = expandQueryTerms(query).map(token => token.toLowerCase());
  if (!text) return [];
  return comboCards
    .map(card => {
      const hits = card.keys.filter(key => text.includes(key.toLowerCase()) || tokens.includes(key.toLowerCase()));
      const plusBonus = /[+＋、,，\s]/.test(query) && hits.length >= 2 ? 8 : 0;
      return { ...card, hits: [...new Set(hits)], score: hits.length * 10 + plusBonus };
    })
    .filter(card => card.hits.length >= 2 || text.includes(card.title.toLowerCase()))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function reverseWarnings(query, combos, results) {
  const text = queryTextForMatch(query).toLowerCase();
  const warnings = new Set();
  if (text.includes("合")) warnings.add("见合先分合来、合去、合绊、争合，不要直接断成好合作。");
  if (text.includes("冲")) warnings.add("见冲先看冲到哪个宫位和喜忌，冲开库或冲动机会时不一定为凶。");
  if (text.includes("穿") || text.includes("害")) warnings.add("穿害偏暗损和漏洞，通常不如冲那么外显，不宜直接断成明面分离。");
  if (text.includes("财")) warnings.add("财多不等于富，重点看是否归主、能否流通、有没有被比劫夺或被合走。");
  if (text.includes("印")) warnings.add("印不只代表学历和母亲，也可能代表依赖、手续拖延、文书压力。");
  if (text.includes("官")) warnings.add("官杀不只代表权力，也可能是压力、规则、病灾、官非，需看制化。");
  if (text.includes("墓") || text.includes("库")) warnings.add("墓库要分收藏和关闭，逢冲可能开库取物，也可能破库漏失。");
  if (text.includes("日支") || text.includes("夫妻")) warnings.add("日支被触发先看自己、居住和亲密关系三层，不要只断婚姻。");
  if (combos.length) warnings.add("组合卡片是取象入口，不是断语结论；最后仍要回到喜忌、旺衰、宫位、岁运。");
  if (results.length && results[0].details.some(detail => detail.label === "规则文本")) warnings.add("命中规则文本时，优先读限制条件，避免只取好听的象。");
  return [...warnings].slice(0, 5);
}

function querySuggestions(query, results) {
  const terms = new Set();
  tokenizeQuery(query).forEach(term => {
    synonymGroups
      .filter(group => group.includes(term))
      .flat()
      .forEach(item => terms.add(item));
  });
  results.slice(0, 5).forEach(item => {
    item.node.core.slice(0, 2).forEach(term => terms.add(term));
    item.node.relations.slice(0, 2).forEach(term => terms.add(term));
  });
  tokenizeQuery(query).forEach(term => terms.delete(term));
  return [...terms].slice(0, 10);
}

function renderInsightPanel() {
  const query = searchInput.value.trim();
  const controls = `
    <div class="insight-controls">
      <div class="reverse-row">
        <input id="reverseQueryInput" type="text" placeholder="反查现实事件：合同纠纷、搬家、婚姻不稳、破财..." />
        <button type="button" data-reverse-query>反查</button>
      </div>
      <label>
        排序口径
        <select id="weightModeSelect">
          <option value="balanced"${weightMode === "balanced" ? " selected" : ""}>均衡</option>
          <option value="relation"${weightMode === "relation" ? " selected" : ""}>关系优先</option>
          <option value="tengod"${weightMode === "tengod" ? " selected" : ""}>十神优先</option>
          <option value="palace"${weightMode === "palace" ? " selected" : ""}>宫位优先</option>
          <option value="stembranch"${weightMode === "stembranch" ? " selected" : ""}>干支字象优先</option>
          <option value="nayin"${weightMode === "nayin" ? " selected" : ""}>纳音辅助</option>
        </select>
      </label>
    </div>
  `;
  if (!query) {
    insightPanel.innerHTML = `
      <div class="insight-empty">
        <strong>实战查询</strong>
        <span>输入“财库”“正印 合”“食神+官”“日支被穿”等，会按共象强弱列出相关节点、组合卡片和判断提醒。</span>
      </div>
      ${controls}
    `;
    return;
  }

  const results = queryResults(query);
  const combos = matchedCombos(query);
  const warnings = reverseWarnings(query, combos, results);
  const suggestions = querySuggestions(query, results);
  const top = results[0];
  const topText = top
    ? `最强入口是「${top.node.title}」，因为命中了 ${top.details.slice(0, 3).map(item => item.label).join("、")}。`
    : "没有找到明确节点，可以换成更短的词，比如“文书”“财”“合”“墓库”。";

  insightPanel.innerHTML = `
    <div class="insight-head">
      <div>
        <div class="eyebrow">实战关联查询</div>
        <h3>${escapeHtml(query)}</h3>
        <p>${escapeHtml(topText)}</p>
      </div>
      <div class="insight-stats">
        <strong>${results.length}</strong>
        <span>相关节点</span>
      </div>
    </div>
    ${controls}

    ${combos.length ? `
      <div class="combo-grid">
        ${combos.map(card => `
          <article class="combo-card">
            <div class="combo-top">
              <strong>${escapeHtml(card.title)}</strong>
              <span>命中：${card.hits.map(escapeHtml).join("、")}</span>
            </div>
            <p>${escapeHtml(card.core)}</p>
            <p><b>大白话：</b>${escapeHtml(card.plain)}</p>
            <p><b>判断：</b>${escapeHtml(card.check)}</p>
          </article>
        `).join("")}
      </div>
    ` : ""}

    ${warnings.length ? `
      <div class="warning-box">
        <h4>反向提醒</h4>
        ${warnings.map(item => `<p>${escapeHtml(item)}</p>`).join("")}
      </div>
    ` : ""}

    ${suggestions.length ? `
      <div class="suggestion-row">
        <span>可继续加点：</span>
        ${suggestions.map(item => `<button type="button" data-add-case-term="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}
      </div>
    ` : ""}

    <div class="result-list">
      ${results.slice(0, 10).map(item => {
        const strength = strengthLabel(item.score, item.details.length);
        return `
          <article class="result-item ${strength.className}">
            <button type="button" class="result-title" data-select="${item.node.id}">
              <span>${escapeHtml(item.node.title)}</span>
              <em>${escapeHtml(item.node.type)}</em>
            </button>
            <div class="result-meta">
              <span>${strength.label}</span>
              <span>${strength.scoreText}</span>
              <span>${strength.tip}</span>
            </div>
            <div class="reason-list">
              ${item.details.slice(0, 4).map(detail => `
                <div>
                  <b>${escapeHtml(detail.label)}：</b>${escapeHtml(detail.value)}
                  <small>${escapeHtml(detail.reason)}</small>
                </div>
              `).join("")}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderNetwork() {
  const allOverlaps = getOverlapNodes(selectedNode).slice(0, 16);
  const overlaps = allOverlaps
    .filter(item => networkFilter === "all" || item.node.type === networkFilter)
    .slice(0, 10);
  if (!networkPreviewNodeId || !overlaps.some(item => item.node.id === networkPreviewNodeId)) {
    networkPreviewNodeId = overlaps[0]?.node.id || "";
  }
  const previewItem = overlaps.find(item => item.node.id === networkPreviewNodeId);
  const width = 760;
  const height = 340;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 128;
  const points = overlaps.map((item, index) => {
    const angle = (Math.PI * 2 * index / Math.max(overlaps.length, 1)) - Math.PI / 2;
    return {
      item,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      r: Math.max(20, Math.min(36, 15 + item.score / 5))
    };
  });

  networkPanel.innerHTML = `
    <div class="network-head">
      <div>
        <div class="eyebrow">当前节点关系网</div>
        <h3>${escapeHtml(selectedNode.title)}</h3>
      </div>
      <span>点节点只预览，点“打开详情”才跳转</span>
    </div>
    <div class="network-filter">
      ${["all", "十神", "关系", "宫位", "纳音", "组合"].map(type => `
        <button type="button" class="${networkFilter === type ? "active" : ""}" data-network-filter="${type}">
          ${type === "all" ? "全部" : type}
        </button>
      `).join("")}
    </div>
    <svg class="network-map" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(selectedNode.title)}关系网">
      ${points.map(point => `<line x1="${cx}" y1="${cy}" x2="${point.x}" y2="${point.y}" stroke-width="${Math.max(1, Math.min(7, point.item.score / 12))}" />`).join("")}
      <circle class="network-center" cx="${cx}" cy="${cy}" r="42" />
      <text class="network-label center" x="${cx}" y="${cy + 5}">${escapeHtml(selectedNode.title)}</text>
      ${points.map(point => `
        <g class="network-node ${point.item.node.id === networkPreviewNodeId ? "active" : ""}" data-network-preview="${point.item.node.id}" tabindex="0">
          <circle cx="${point.x}" cy="${point.y}" r="${point.r}" />
          <text class="network-label" x="${point.x}" y="${point.y + 4}">${escapeHtml(point.item.node.title.slice(0, 5))}</text>
        </g>
      `).join("")}
    </svg>
    <div class="network-legend">
      ${overlaps.slice(0, 6).map(item => `
        <button type="button" class="${item.node.id === networkPreviewNodeId ? "active" : ""}" data-network-preview="${item.node.id}">
          ${escapeHtml(item.node.title)}
          <span>${item.shared.slice(0, 3).map(escapeHtml).join("、")}</span>
        </button>
      `).join("")}
    </div>
    ${previewItem ? `
      <div class="network-preview">
        <div>
          <strong>${escapeHtml(previewItem.node.title)}</strong>
          <span>${escapeHtml(previewItem.node.type)} · ${strengthLabel(previewItem.score, previewItem.shared.length).label}</span>
        </div>
        <p>${escapeHtml(overlapExplanation(selectedNode, previewItem))}</p>
        <div class="terms">
          ${previewItem.shared.slice(0, 6).map(term => `<button type="button" class="chip" data-term="${escapeHtml(term)}" data-node="${previewItem.node.id}">${escapeHtml(term)}</button>`).join("")}
        </div>
        <button type="button" class="network-open" data-select="${previewItem.node.id}">打开详情</button>
      </div>
    ` : `<div class="network-preview"><p>当前节点暂时没有明显关系网。</p></div>`}
  `;
}

function getFavorites() {
  return storageGet("bazi_xiangyi_favorites", []);
}

function setFavorites(values) {
  storageSet("bazi_xiangyi_favorites", values);
}

function getNotes() {
  return storageGet("bazi_xiangyi_notes", {});
}

function setNotes(values) {
  storageSet("bazi_xiangyi_notes", values);
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id) {
  const favorites = getFavorites();
  const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [id, ...favorites];
  setFavorites(next);
  renderDetail();
  renderStudyTools();
}

function saveNote(id, value) {
  const notes = getNotes();
  if (value.trim()) notes[id] = value.trim();
  else delete notes[id];
  setNotes(notes);
  renderStudyTools();
}

function renderStudyTools() {
  const favorites = getFavorites();
  const notes = getNotes();
  studyTools.innerHTML = `
    <button type="button" data-study-action="random">随机学习 <span>${allNodes().length}</span></button>
    <button type="button" data-study-action="favorites">收藏 <span>${favorites.length}</span></button>
    <button type="button" data-study-action="notes">笔记 <span>${Object.keys(notes).length}</span></button>
  `;
}

function randomNode() {
  const nodes = allNodes();
  return nodes[Math.floor(Math.random() * nodes.length)];
}

function randomNodeBySystem(systemId) {
  const system = graph.systems.find(item => item.id === systemId);
  const nodes = system?.nodes?.length ? system.nodes : allNodes();
  return nodes[Math.floor(Math.random() * nodes.length)];
}

function renderStudyPanel(mode = "") {
  if (mode === "favorites") {
    const nodes = getFavorites().map(id => allNodes().find(node => node.id === id)).filter(Boolean);
    studyPanel.innerHTML = `
      <div class="study-head">
        <div><div class="eyebrow">我的收藏</div><h3>${nodes.length} 个节点</h3></div>
      </div>
      <div class="study-list">
        ${nodes.length ? nodes.map(node => `<button type="button" data-select="${node.id}">${escapeHtml(node.title)}<span>${escapeHtml(node.type)}</span></button>`).join("") : "<p>还没有收藏。打开右侧详情后可以收藏节点。</p>"}
      </div>
    `;
    return;
  }

  if (mode === "notes") {
    const notes = getNotes();
    const rows = Object.entries(notes).map(([id, text]) => ({ node: allNodes().find(item => item.id === id), text })).filter(item => item.node);
    studyPanel.innerHTML = `
      <div class="study-head">
        <div><div class="eyebrow">我的笔记</div><h3>${rows.length} 条</h3></div>
      </div>
      <div class="note-list">
        ${rows.length ? rows.map(row => `
          <button type="button" data-select="${row.node.id}">
            <strong>${escapeHtml(row.node.title)}</strong>
            <span>${escapeHtml(row.text)}</span>
          </button>
        `).join("") : "<p>还没有笔记。可以在右侧详情里记录自己的案例和理解。</p>"}
      </div>
    `;
    return;
  }

  if (mode === "random" || mode.startsWith("train:") || !studyCard) {
    studyCard = mode.startsWith("train:") ? randomNodeBySystem(mode.slice(6)) : randomNode();
    studyAnswerVisible = false;
  }
  if (mode === "answer") {
    studyAnswerVisible = true;
  }
  studyPanel.innerHTML = `
    <div class="study-head">
      <div>
        <div class="eyebrow">学习卡片</div>
        <h3>${escapeHtml(studyCard.title)}</h3>
      </div>
      <button type="button" data-study-action="random">换一张</button>
    </div>
    <div class="flash-card">
      <div>
        <span>${escapeHtml(studyCard.type)}</span>
        <strong>看到「${escapeHtml(studyCard.title)}」，你能先想出哪些核心象？</strong>
      </div>
      ${studyAnswerVisible ? `
        <div class="flash-answer">
          <b>${studyCard.core.map(escapeHtml).join(" / ")}</b>
          <p>${escapeHtml(getPlainText(studyCard) || getTypeReason(studyCard))}</p>
        </div>
      ` : `<p>先在脑子里说出 3 个象义，再点“看答案”。</p>`}
      <button type="button" data-study-action="answer">${studyAnswerVisible ? "已显示答案" : "看答案"}</button>
      <button type="button" data-select="${studyCard.id}">打开详情</button>
      <div class="study-train-row">
        <button type="button" data-study-action="train:ten-gods">十神专项</button>
        <button type="button" data-study-action="train:relations">关系专项</button>
        <button type="button" data-study-action="train:nayin">纳音专项</button>
        <button type="button" data-study-action="train:combo-cards">组合专项</button>
      </div>
    </div>
  `;
}

function getCases() {
  return storageGet("bazi_xiangyi_cases", []);
}

function setCases(cases) {
  storageSet("bazi_xiangyi_cases", cases);
}

function setCasePoints(points) {
  casePoints = [...new Set(points.map(point => point.trim()).filter(Boolean))];
  storageSet("bazi_xiangyi_case_points", casePoints);
  renderCasePoints();
  renderCasePanel();
}

function addCasePoint(value) {
  const point = value.trim();
  if (!point) return;
  setCasePoints([...casePoints, point]);
  casePointInput.value = "";
}

function removeCasePoint(value) {
  setCasePoints(casePoints.filter(point => point !== value));
}

function caseQuery() {
  return casePoints.join(" ");
}

function renderCasePoints() {
  casePointsEl.innerHTML = casePoints.length
    ? casePoints.map(point => `
      <button type="button" class="case-point" data-remove-case-point="${escapeHtml(point)}">
        ${escapeHtml(point)} <span>×</span>
      </button>
    `).join("")
    : `<span class="case-hint">可从右侧详情词义加入，也可手动输入。</span>`;
}

function runCaseQuery() {
  const query = caseQuery();
  if (!query) return;
  searchInput.value = query;
  renderTree();
  renderInsightPanel();
  renderCasePanel();
}

function renderBaziSummary() {
  const dayGan = caseBazi[2];
  const relationItems = scannedBaziRelations.length ? scannedBaziRelations : scanBaziRelationItems().slice(0, 10);
  return `
    <div class="bazi-summary">
      <div class="bazi-summary-grid">
        ${PILLARS.map((pillar, index) => {
          const gan = caseBazi[index];
          const zhi = caseBazi[index + 4];
          const god = index === 2 ? "日主" : tenGod(dayGan, gan);
          return `
            <div class="bazi-pillar-card">
              <span>${pillar}柱</span>
              <strong>${gan}${zhi}</strong>
              <em>${god || "—"}</em>
            </div>
          `;
        }).join("")}
      </div>
      <div class="bazi-relation-list">
        <h4>排盘关系扫描</h4>
        ${relationItems.slice(0, 12).map(item => `
          <button type="button" data-add-case-term="${escapeHtml(item.points.slice(0, 3).join(" "))}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.why)}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function saveCurrentCase() {
  const query = caseQuery() || searchInput.value.trim();
  if (!query) return;
  const textarea = document.querySelector("#caseMemo");
  const memo = textarea?.value.trim() || "";
  const structured = {
    phenomenon: document.querySelector("#casePhenomenon")?.value.trim() || "",
    evidence: document.querySelector("#caseEvidence")?.value.trim() || "",
    conclusion: document.querySelector("#caseConclusion")?.value.trim() || "",
    verification: document.querySelector("#caseVerification")?.value.trim() || ""
  };
  const topNodes = queryResults(query).slice(0, 5).map(item => ({
    id: item.node.id,
    title: item.node.title,
    score: item.score
  }));
  const cases = getCases();
  cases.unshift({
    id: String(Date.now()),
    date: new Date().toLocaleString("zh-CN"),
    bazi: [...caseBazi],
    points: [...casePoints],
    query,
    memo,
    structured,
    topNodes
  });
  setCases(cases.slice(0, 50));
  renderCasePanel();
}

function loadCase(id) {
  const record = getCases().find(item => item.id === id);
  if (!record) return;
  if (Array.isArray(record.bazi) && record.bazi.length === 8) {
    caseBazi = [...record.bazi];
    saveCaseBazi();
    renderBaziPicker();
  }
  setCasePoints(record.points?.length ? record.points : tokenizeQuery(record.query));
  searchInput.value = record.query;
  renderTree();
  renderInsightPanel();
  renderCasePanel();
}

function deleteCase(id) {
  setCases(getCases().filter(item => item.id !== id));
  renderCasePanel();
}

function exportCases() {
  const payload = {
    app: "bazi-xiangyi",
    version: 1,
    exportedAt: new Date().toISOString(),
    cases: getCases(),
    favorites: getFavorites(),
    notes: getNotes()
  };
  const text = JSON.stringify(payload, null, 2);
  navigator.clipboard?.writeText(text).catch(() => {});
  const box = document.querySelector("#caseImportBox");
  if (box) {
    box.value = text;
    box.select();
  }
}

function exportCurrentReport() {
  const query = caseQuery() || searchInput.value.trim();
  const top = query ? queryResults(query).slice(0, 8) : [];
  const relations = scanBaziRelationItems().slice(0, 12);
  const lines = [
    "# 八字象义命例报告",
    "",
    `八字：${PILLARS.map((p, i) => `${p}柱${caseBazi[i]}${caseBazi[i + 4]}`).join("　")}`,
    `观察点：${casePoints.join("、") || "未填写"}`,
    "",
    "## 排盘关系",
    ...relations.map(item => `- ${item.title}：${item.why}`),
    "",
    "## 优先查询入口",
    ...top.map(item => `- ${item.node.title}（${strengthLabel(item.score, item.details.length).label}）：${item.details.slice(0, 2).map(d => d.label).join("、")}`),
    "",
    "## 命例记录",
    `原局现象：${document.querySelector("#casePhenomenon")?.value.trim() || ""}`,
    `象义依据：${document.querySelector("#caseEvidence")?.value.trim() || ""}`,
    `最终判断：${document.querySelector("#caseConclusion")?.value.trim() || ""}`,
    `事后验证：${document.querySelector("#caseVerification")?.value.trim() || ""}`
  ];
  const box = document.querySelector("#caseImportBox");
  if (box) {
    box.value = lines.join("\n");
    box.select();
  }
  navigator.clipboard?.writeText(lines.join("\n")).catch(() => {});
}

function importCases() {
  const box = document.querySelector("#caseImportBox");
  const raw = box?.value.trim();
  if (!raw) return;
  try {
    const payload = JSON.parse(raw);
    if (Array.isArray(payload.cases)) setCases(payload.cases.slice(0, 100));
    if (Array.isArray(payload.favorites)) setFavorites(payload.favorites);
    if (payload.notes && typeof payload.notes === "object") setNotes(payload.notes);
    renderCasePanel();
    renderStudyTools();
    renderDetail();
  } catch {
    if (box) box.value = `${raw}\n\n导入失败：请粘贴导出的 JSON 文本。`;
  }
}

function renderCasePanel() {
  const query = caseQuery();
  const cases = getCases();
  const notes = getNotes();
  const filteredCases = cases.filter(record => {
    const text = [
      record.query,
      record.memo,
      record.points?.join(" "),
      record.topNodes?.map(item => item.title).join(" "),
      record.structured?.phenomenon,
      record.structured?.evidence,
      record.structured?.conclusion,
      record.structured?.verification
    ].join(" ").toLowerCase();
    return !caseSearch || text.includes(caseSearch.toLowerCase());
  });
  const noteHits = Object.entries(notes)
    .map(([id, text]) => ({ node: allNodes().find(node => node.id === id), text }))
    .filter(item => item.node && caseSearch && `${item.node.title} ${item.text}`.toLowerCase().includes(caseSearch.toLowerCase()))
    .slice(0, 5);
  const results = query ? queryResults(query).slice(0, 6) : [];
  casePanel.innerHTML = `
    <div class="case-panel-head">
      <div>
        <div class="eyebrow">命例工作台</div>
        <h3>${casePoints.length ? casePoints.map(escapeHtml).join(" + ") : "尚未加入观察点"}</h3>
      </div>
      <div class="case-panel-actions">
        <button type="button" data-case-action="save">保存命例</button>
        <button type="button" data-case-action="report">导出报告</button>
        <button type="button" data-case-action="export">导出</button>
        <button type="button" data-case-action="import">导入</button>
      </div>
    </div>
    <div class="case-panel-body">
      <div class="case-memo">
        <textarea id="caseMemo" placeholder="记录这个命例：原局现象、你为什么想到这些点、最后如何判断..."></textarea>
        <div class="case-structured">
          <textarea id="casePhenomenon" placeholder="原局现象 / 来访问题"></textarea>
          <textarea id="caseEvidence" placeholder="象义依据：哪些点重叠？"></textarea>
          <textarea id="caseConclusion" placeholder="最终判断"></textarea>
          <textarea id="caseVerification" placeholder="事后验证"></textarea>
        </div>
      </div>
      <div class="case-top">
        <h4>当前观察点的优先入口</h4>
        ${results.length ? results.map(item => {
          const strength = strengthLabel(item.score, item.details.length);
          return `<button type="button" data-select="${item.node.id}">
            <strong>${escapeHtml(item.node.title)}</strong>
            <span>${strength.label} / ${item.score} / ${item.details.slice(0, 2).map(detail => escapeHtml(detail.label)).join("、")}</span>
          </button>`;
        }).join("") : `<p>加入观察点后，这里会显示最值得先看的节点。</p>`}
      </div>
    </div>
    ${renderBaziSummary()}
    <div class="saved-cases">
      <h4>已保存命例</h4>
      <input id="caseSearchInput" type="search" value="${escapeHtml(caseSearch)}" placeholder="搜索命例和笔记：财库、卯酉冲、婚姻..." />
      <textarea id="caseImportBox" placeholder="导出时这里会生成备份 JSON；导入时把 JSON 粘贴到这里再点“导入”。"></textarea>
      ${noteHits.length ? `<div class="case-note-hits">${noteHits.map(item => `<button type="button" data-select="${item.node.id}"><strong>${escapeHtml(item.node.title)}</strong><span>${escapeHtml(item.text)}</span></button>`).join("")}</div>` : ""}
      ${filteredCases.length ? filteredCases.slice(0, 6).map(record => `
        <article>
          <button type="button" class="saved-case-main" data-load-case="${record.id}">
            <strong>${escapeHtml(record.query)}</strong>
            <span>${escapeHtml(record.date)} · ${record.topNodes.map(item => escapeHtml(item.title)).join("、")}</span>
          </button>
          <button type="button" class="saved-case-delete" data-delete-case="${record.id}">删除</button>
        </article>
      `).join("") : `<p>${caseSearch ? "没有匹配命例。" : "暂无保存记录。"}</p>`}
    </div>
  `;
}

function renderDetail(term) {
  const node = selectedNode;
  const title = term || node.title;
  const plainText = getPlainText(node);
  const favorite = isFavorite(node.id);
  const note = getNotes()[node.id] || "";
  const termLine = term ? `<p>当前聚焦词：<strong>${term}</strong>。它属于「${node.title}」节点，可继续向人物、事物、心理、事件和组合条件发散。</p>` : "";
  const plainLine = plainText ? `<p><strong>大白话：</strong>${plainText}</p>` : "";
  const reasonLine = `<p><strong>为什么这样取象：</strong>${getTermReason(node, term)}</p>`;
  const rulesList = node.rules.length
    ? `<ul>${node.rules.map(rule => `<li>${rule}</li>`).join("")}</ul>`
    : `<p>这个节点暂时没有专业规则补充，后续可以继续加入出处、组合和案例。</p>`;
  detailEl.innerHTML = `
    <h3>${title}</h3>
    <div class="type">${node.type} / ${node.title}</div>
    <div class="detail-actions">
      <button type="button" data-favorite="${node.id}" class="${favorite ? "active" : ""}">${favorite ? "已收藏" : "收藏"}</button>
      <button type="button" data-add-case-term="${escapeHtml(title)}">加入工作台</button>
      <button type="button" data-study-action="random">随机学习</button>
    </div>

    <div class="detail-block">
      <h4>核心义</h4>
      <div class="terms">
        ${node.core.map(item => `<button type="button" class="chip" data-term="${item}" data-node="${node.id}">${item}</button>`).join("")}
      </div>
    </div>

    <div class="detail-block">
      <h4>取象说明</h4>
      ${termLine}
      ${plainLine}
      ${reasonLine}
      ${rulesList}
    </div>

    <div class="detail-block">
      <h4>关联与重叠</h4>
      <div class="relations">
        ${node.relations.map(rel => `<button type="button" class="link-button" data-relation="${rel}">${rel}</button>`).join("")}
      </div>
      <p>自动重叠会找出和当前节点共享象义词的地方。重叠越多，通常越值得在实断中优先参考。</p>
      ${renderOverlap(node, term)}
    </div>

    <div class="detail-block">
      <h4>后续可补字段</h4>
      <p>出处、门派差异、正反象、应期条件、案例、古籍原文、现代职业映射。</p>
    </div>

    <div class="detail-block">
      <h4>我的笔记</h4>
      <textarea data-note="${node.id}" placeholder="记录你的案例、断语、疑问或门派差异...">${escapeHtml(note)}</textarea>
      <p class="note-tip">笔记保存在当前浏览器本地，适合先积累自己的案例。</p>
    </div>
  `;
}

function findFirstSystemWithQuery(query, preferredSystemId) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return getActiveSystem();
  const preferredSystem = graph.systems.find(system => system.id === preferredSystemId);
  if (preferredSystem?.nodes.some(node => nodeText(node).includes(normalized))) {
    return preferredSystem;
  }
  return graph.systems.find(system =>
    system.nodes.some(node => nodeText(node).includes(normalized))
  );
}

function applyGlobalSearch(query, preferredSystemId) {
  searchInput.value = query;
  const system = findFirstSystemWithQuery(query, preferredSystemId);
  if (system) {
    activeSystemId = system.id;
    const normalized = query.trim().toLowerCase();
    selectedNode = system.nodes.find(node => nodeText(node).includes(normalized)) || system.nodes[0];
    renderNav();
    renderTree();
    renderDetail();
    renderInsightPanel();
    renderNetwork();
    return;
  }
  renderTree();
  renderInsightPanel();
}

function setSystem(id) {
  activeSystemId = id;
  selectedNode = getActiveSystem().nodes[0];
  networkPreviewNodeId = "";
  renderNav();
  renderTree();
  renderDetail();
  renderInsightPanel();
  renderNetwork();
}

function selectNode(id, term) {
  const node = allNodes().find(item => item.id === id);
  if (!node) return;
  selectedNode = node;
  networkPreviewNodeId = "";
  const system = graph.systems.find(item => item.nodes.some(child => child.id === id));
  activeSystemId = system.id;
  renderNav();
  renderTree();
  renderDetail(term);
  renderInsightPanel();
  renderNetwork();
  document.querySelector(`[data-node="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

navEl.addEventListener("click", event => {
  const button = event.target.closest("[data-system]");
  if (button) setSystem(button.dataset.system);
});

document.body.addEventListener("click", event => {
  const selectButton = event.target.closest("[data-select]");
  if (selectButton) {
    event.preventDefault();
    selectNode(selectButton.dataset.select);
  }

  const chip = event.target.closest("[data-term]");
  if (chip) {
    selectNode(chip.dataset.node, chip.dataset.term);
  }

  const relation = event.target.closest("[data-relation]");
  if (relation) {
    applyGlobalSearch(relation.dataset.relation);
  }

  const networkPreview = event.target.closest("[data-network-preview]");
  if (networkPreview) {
    event.preventDefault();
    event.stopPropagation();
    const scrollTop = window.scrollY;
    networkPreviewNodeId = networkPreview.dataset.networkPreview;
    renderNetwork();
    window.scrollTo({ top: scrollTop, left: 0 });
    return;
  }

  const networkFilterButton = event.target.closest("[data-network-filter]");
  if (networkFilterButton) {
    networkFilter = networkFilterButton.dataset.networkFilter;
    storageSet("bazi_xiangyi_network_filter", networkFilter);
    networkPreviewNodeId = "";
    renderNetwork();
  }

  const reverseButton = event.target.closest("[data-reverse-query]");
  if (reverseButton) {
    const input = document.querySelector("#reverseQueryInput");
    const query = reverseQueryText(input?.value || "");
    if (query) {
      searchInput.value = query;
      renderTree();
      renderInsightPanel();
    }
  }

  const quick = event.target.closest("[data-quick]");
  if (quick) {
    applyGlobalSearch(quick.dataset.quick, quick.dataset.targetSystem);
  }

  const addCaseTerm = event.target.closest("[data-add-case-term]");
  if (addCaseTerm) {
    addCasePoint(addCaseTerm.dataset.addCaseTerm);
  }

  const baziCell = event.target.closest("[data-bazi-cell]");
  if (baziCell) {
    selectedBaziCell = Number(baziCell.dataset.baziCell);
    renderBaziPicker();
  }

  const baziPick = event.target.closest("[data-bazi-pick]");
  if (baziPick) {
    caseBazi[selectedBaziCell] = baziPick.dataset.baziPick;
    saveCaseBazi();
    scannedBaziRelations = [];
    renderBaziPicker();
    renderCasePanel();
  }

  const toggle = event.target.closest("[data-toggle-branch]");
  if (toggle) {
    const branch = toggle.closest(".branch");
    const terms = branch.querySelector(".terms");
    const hidden = terms.style.display === "none";
    terms.style.display = hidden ? "flex" : "none";
    toggle.textContent = hidden ? "−" : "+";
  }

  const favorite = event.target.closest("[data-favorite]");
  if (favorite) {
    toggleFavorite(favorite.dataset.favorite);
  }

  const studyAction = event.target.closest("[data-study-action]");
  if (studyAction) {
    renderStudyPanel(studyAction.dataset.studyAction);
  }

  const removePoint = event.target.closest("[data-remove-case-point]");
  if (removePoint) {
    removeCasePoint(removePoint.dataset.removeCasePoint);
  }

  const caseAction = event.target.closest("[data-case-action]");
  if (caseAction?.dataset.caseAction === "save") {
    saveCurrentCase();
  }
  if (caseAction?.dataset.caseAction === "export") {
    exportCases();
  }
  if (caseAction?.dataset.caseAction === "import") {
    importCases();
  }
  if (caseAction?.dataset.caseAction === "report") {
    exportCurrentReport();
  }

  const loadCaseButton = event.target.closest("[data-load-case]");
  if (loadCaseButton) {
    loadCase(loadCaseButton.dataset.loadCase);
  }

  const deleteCaseButton = event.target.closest("[data-delete-case]");
  if (deleteCaseButton) {
    deleteCase(deleteCaseButton.dataset.deleteCase);
  }
});

document.body.addEventListener("input", event => {
  const note = event.target.closest("[data-note]");
  if (note) {
    saveNote(note.dataset.note, note.value);
  }
  const modeSelect = event.target.closest("#weightModeSelect");
  if (modeSelect) {
    weightMode = modeSelect.value;
    storageSet("bazi_xiangyi_weight_mode", weightMode);
    renderInsightPanel();
    renderCasePanel();
  }
  const caseSearchInput = event.target.closest("#caseSearchInput");
  if (caseSearchInput) {
    caseSearch = caseSearchInput.value.trim();
    renderCasePanel();
  }
});

document.body.addEventListener("keydown", event => {
  const networkPreview = event.target.closest("[data-network-preview]");
  if (networkPreview && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    const scrollTop = window.scrollY;
    networkPreviewNodeId = networkPreview.dataset.networkPreview;
    renderNetwork();
    window.scrollTo({ top: scrollTop, left: 0 });
  }
});

searchInput.addEventListener("input", () => {
  renderTree();
  renderInsightPanel();
});

document.querySelector("#expandAll").addEventListener("click", () => {
  document.querySelectorAll("details.node").forEach(item => item.open = true);
});

document.querySelector("#collapseAll").addEventListener("click", () => {
  document.querySelectorAll("details.node").forEach(item => item.open = false);
});

document.querySelector("#resetSearch").addEventListener("click", () => {
  searchInput.value = "";
  renderTree();
  renderInsightPanel();
});

addCasePointButton.addEventListener("click", () => addCasePoint(casePointInput.value));
casePointInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCasePoint(casePointInput.value);
  }
});
runCaseQueryButton.addEventListener("click", runCaseQuery);
clearCasePointsButton.addEventListener("click", () => setCasePoints([]));
addBaziPointsButton.addEventListener("click", addBaziObservationPoints);
scanBaziRelationsButton.addEventListener("click", scanAndApplyBaziRelations);

renderNav();
renderStudyTools();
renderBaziPicker();
renderCasePoints();
renderInsightPanel();
renderCasePanel();
renderNetwork();
renderStudyPanel("random");
renderTree();
renderDetail();
