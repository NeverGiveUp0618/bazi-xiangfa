/* ===== 象义随身 · 手机版 =====
 * 设计原则：
 * 1. 查询：一个词 -> 共象聚合 -> 为什么匹配 -> 详情
 * 2. 排盘：点选八字，自动标出关系/神煞/纳音/十神，每一项都能点进象义库
 * 3. 学习：先回忆再翻面，认识/模糊/不熟 本地间隔复习
 * 所有检测口径与 data.js 中的象义条目保持一致（四正破、生穿克穿、三刑分组等）。
 */

const graph = window.BAZI_GRAPH;
const STORAGE_PREFIX = "bazi_xiangyi_mobile_v2__";
const DAY_MS = 24 * 60 * 60 * 1000;

/* ---------- 基础表 ---------- */
const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const PILLARS = ["年", "月", "日", "时"];
const GAN_WUXING = { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" };
const ZHI_WUXING = { 子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水" };
const WUXING_SHENG = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const WUXING_KE = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

const GAN_HE = { 甲己: "土", 乙庚: "金", 丙辛: "水", 丁壬: "木", 戊癸: "火" };
const ZHI_CHONG = { 子: "午", 丑: "未", 寅: "申", 卯: "酉", 辰: "戌", 巳: "亥", 午: "子", 未: "丑", 申: "寅", 酉: "卯", 戌: "辰", 亥: "巳" };
const ZHI_LIUHE = { 子丑: "土", 寅亥: "木", 卯戌: "火", 辰酉: "金", 巳申: "水", 午未: "火" };
// 穿（六害）：数据条目分生穿 / 克穿
const CHUAN_SHENG = ["寅巳", "丑午", "申亥", "酉戌"];
const CHUAN_KE = ["卯辰", "子未"];
// 破：按练习体系的四正破口径（详情里附传统六破参考）
const PO_PAIRS = ["子卯", "子酉", "卯午", "午酉"];
const ANHE_PAIRS = ["申卯", "亥午", "丑寅", "子巳"];
// 三刑组（子卯归入破口径，自刑走伏吟附注）
const XING_GROUPS = [
  { chars: ["寅", "巳", "申"], name: "无恩刑" },
  { chars: ["丑", "戌", "未"], name: "恃势刑" }
];
const ZI_XING = new Set(["辰", "午", "酉", "亥"]);
// 三合局：[长生, 中神, 墓, 五行]
const SANHE = [
  ["申", "子", "辰", "水"],
  ["亥", "卯", "未", "木"],
  ["寅", "午", "戌", "火"],
  ["巳", "酉", "丑", "金"]
];
const SANHUI = [
  ["寅", "卯", "辰", "木"],
  ["巳", "午", "未", "火"],
  ["申", "酉", "戌", "金"],
  ["亥", "子", "丑", "水"]
];
// 干支自合（与数据条目组合一致）
const ZIHE_PILLARS = new Set(["戊子", "壬午", "甲午", "壬戌", "丙戌", "丁亥", "己亥", "辛巳", "癸巳"]);
const LU_MAP = { 甲: "寅", 乙: "卯", 丙: "巳", 丁: "午", 戊: "巳", 己: "午", 庚: "申", 辛: "酉", 壬: "亥", 癸: "子" };
const GAN_MU = { 甲: "未", 乙: "戌", 丙: "戌", 丁: "丑", 戊: "戌", 己: "丑", 庚: "丑", 辛: "辰", 壬: "辰", 癸: "未" };
const KU_MAP = { 辰: "水库", 戌: "火库", 丑: "金库", 未: "木库" };
// 地支藏干（本气在前）
const CANG_GAN = {
  子: ["癸"], 丑: ["己", "癸", "辛"], 寅: ["甲", "丙", "戊"], 卯: ["乙"],
  辰: ["戊", "乙", "癸"], 巳: ["丙", "庚", "戊"], 午: ["丁", "己"], 未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"], 酉: ["辛"], 戌: ["戊", "辛", "丁"], 亥: ["壬", "甲"]
};
// 神煞速查
const TAOHUA = { 申子辰: "酉", 寅午戌: "卯", 巳酉丑: "午", 亥卯未: "子" };
const YIMA = { 申子辰: "寅", 寅午戌: "申", 巳酉丑: "亥", 亥卯未: "巳" };
const HUAGAI = { 申子辰: "辰", 寅午戌: "戌", 巳酉丑: "丑", 亥卯未: "未" };
const JIANGXING = { 申子辰: "子", 寅午戌: "午", 巳酉丑: "酉", 亥卯未: "卯" };
const TIANYI = { 甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"], 乙: ["子", "申"], 己: ["子", "申"], 丙: ["亥", "酉"], 丁: ["亥", "酉"], 辛: ["午", "寅"], 壬: ["卯", "巳"], 癸: ["卯", "巳"] };
const WENCHANG = { 甲: "巳", 乙: "午", 丙: "申", 戊: "申", 丁: "酉", 己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯" };
const YANGREN = { 甲: "卯", 丙: "午", 戊: "午", 庚: "酉", 壬: "子" };
const GUCHEN = { 亥子丑: ["寅", "戌"], 寅卯辰: ["巳", "丑"], 巳午未: ["申", "辰"], 申酉戌: ["亥", "未"] };
// 纳音三十名（与六十甲子顺序对应，每两组一名）
const NAYIN_NAMES = [
  "海中金", "炉中火", "大林木", "路旁土", "剑锋金", "山头火", "涧下水", "城头土", "白蜡金", "杨柳木",
  "泉中水", "屋上土", "霹雳火", "松柏木", "长流水", "沙中金", "山下火", "平地木", "壁上土", "金箔金",
  "覆灯火", "天河水", "大驿土", "钗钏金", "桑柘木", "大溪水", "沙中土", "天上火", "石榴木", "大海水"
];

/* ---------- 数据索引 ---------- */
const nodes = graph.systems.flatMap(sys => sys.nodes.map(n => ({ ...n, systemId: sys.id, systemTitle: sys.title })));
const nodeById = new Map(nodes.map(n => [n.id, n]));
const nodeByTitle = new Map(nodes.map(n => [n.title, n]));

function nodeForChar(ch) {
  if (GAN_WUXING[ch]) return nodeByTitle.get(ch + GAN_WUXING[ch]);
  if (ZHI_WUXING[ch]) return nodeByTitle.get(ch + ZHI_WUXING[ch]);
  return null;
}

function nodePlain(node) {
  if (!node) return "";
  const keys = ["大白话", "像什么", "取象", "判断"];
  for (const key of keys) {
    const v = node.branches?.[key];
    if (v?.length) return v[0];
  }
  return node.rules?.[0] || (node.core || []).slice(0, 4).join("、");
}

function nodeWhy(node) {
  return node?.branches?.["为什么"]?.[0] || "";
}

// 宫位口径来自数据里的宫位条目
function palaceGloss(title) {
  const n = nodeByTitle.get(title);
  return n ? n.core.slice(0, 3).join("、") : "";
}

/* ---------- 十神 ---------- */
const GAN_IDX = Object.fromEntries(GAN.map((g, i) => [g, i]));
const ZHI_IDX = Object.fromEntries(ZHI.map((z, i) => [z, i]));

function ganYinYang(g) { return GAN_IDX[g] % 2 === 0 ? "阳" : "阴"; }

function tenGod(dayGan, otherGan) {
  if (!dayGan || !otherGan) return "";
  const dw = GAN_WUXING[dayGan], ow = GAN_WUXING[otherGan];
  const same = ganYinYang(dayGan) === ganYinYang(otherGan);
  if (dw === ow) return same ? "比肩" : "劫财";
  if (WUXING_SHENG[dw] === ow) return same ? "食神" : "伤官";
  if (WUXING_SHENG[ow] === dw) return same ? "偏印" : "正印";
  if (WUXING_KE[dw] === ow) return same ? "偏财" : "正财";
  return same ? "七杀" : "正官";
}

/* ---------- 排盘：全盘扫描引擎 ---------- */
// bazi: 8 个字，0-3 为年月日时天干，4-7 为年月日时地支

function slotLabel(i) {
  return PILLARS[i % 4] + (i < 4 ? "干" : "支");
}

function palaceOfSlot(i) {
  const p = i % 4;
  if (p === 2) return i < 4 ? "日主" : "日支";
  return PILLARS[p] + "柱";
}

function posText(cells) {
  return cells.map(c => slotLabel(c.i) + c.ch).join(" ↔ ");
}

function palaceLine(cells) {
  const seen = new Set();
  const parts = [];
  cells.forEach(c => {
    const t = palaceOfSlot(c.i);
    if (seen.has(t)) return;
    seen.add(t);
    const gloss = palaceGloss(t);
    parts.push(gloss ? `${t}（${gloss}）` : t);
  });
  return "落宫：" + parts.join(" × ");
}

function relItem(name, kindLabel, kindClass, cells, nodeTitle, note) {
  const node = nodeByTitle.get(nodeTitle);
  return {
    name, kindLabel, kindClass, nodeTitle,
    nodeId: node?.id || "",
    pos: posText(cells),
    palace: palaceLine(cells),
    brief: nodePlain(node),
    note: note || ""
  };
}

function pairKey(a, b) { return a + b; }

function scanRelations(bazi) {
  const found = [];
  const gans = [0, 1, 2, 3].map(i => ({ i, ch: bazi[i] }));
  const zhis = [4, 5, 6, 7].map(i => ({ i, ch: bazi[i] }));

  // 天干：五合 / 伏吟 / 天克地冲(反吟)
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      const g1 = gans[a], g2 = gans[b];
      const heEl = GAN_HE[pairKey(g1.ch, g2.ch)] || GAN_HE[pairKey(g2.ch, g1.ch)];
      if (heEl) found.push(relItem(`${g1.ch}${g2.ch}五合`, "合", "k-合", [g1, g2], "天干五合", `合而欲化${heEl}，能不能化要看月令与通根。`));
      if (g1.ch === g2.ch) found.push(relItem(`${g1.ch}${g2.ch}天干伏吟`, "伏吟", "k-吟", [g1, g2], "伏吟"));
      const ke12 = WUXING_KE[GAN_WUXING[g1.ch]] === GAN_WUXING[g2.ch];
      const ke21 = WUXING_KE[GAN_WUXING[g2.ch]] === GAN_WUXING[g1.ch];
      const z1 = zhis[a], z2 = zhis[b];
      if ((ke12 || ke21) && ZHI_CHONG[z1.ch] === z2.ch) {
        found.push(relItem(`${PILLARS[a]}柱${PILLARS[b]}柱天克地冲`, "反吟", "k-吟",
          [g1, z1, g2, z2], "反吟", "干克干、支冲支，整柱被撼动，变化比单冲更大。"));
      }
    }
  }

  // 地支两两关系
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      const z1 = zhis[a], z2 = zhis[b];
      const p12 = pairKey(z1.ch, z2.ch), p21 = pairKey(z2.ch, z1.ch);
      if (ZHI_CHONG[z1.ch] === z2.ch) found.push(relItem(`${z1.ch}${z2.ch}六冲`, "冲", "k-冲", [z1, z2], "六冲"));
      if (CHUAN_SHENG.includes(p12) || CHUAN_SHENG.includes(p21)) found.push(relItem(`${z1.ch}${z2.ch}相穿`, "穿", "k-穿", [z1, z2], "穿", "属生穿：一边给一边伤，暗中损耗。"));
      if (CHUAN_KE.includes(p12) || CHUAN_KE.includes(p21)) found.push(relItem(`${z1.ch}${z2.ch}相穿`, "穿", "k-穿", [z1, z2], "穿", "属克穿：直接卡住生路，损耗更硬。"));
      const liuheEl = ZHI_LIUHE[p12] || ZHI_LIUHE[p21];
      if (liuheEl) found.push(relItem(`${z1.ch}${z2.ch}六合`, "合", "k-合", [z1, z2], "地支六合", `合化倾向${liuheEl}，也可能只是合绊拖住。`));
      if (ANHE_PAIRS.includes(p12) || ANHE_PAIRS.includes(p21)) found.push(relItem(`${z1.ch}${z2.ch}暗合`, "暗合", "k-合", [z1, z2], "暗合"));
      if (PO_PAIRS.includes(p12) || PO_PAIRS.includes(p21)) {
        const note = (p12 === "子卯" || p21 === "子卯") ? "四正破口径；部分体系把子卯归无礼刑。" : "四正破口径，传统六破另有组合，见详情。";
        found.push(relItem(`${z1.ch}${z2.ch}相破`, "破", "k-破", [z1, z2], "六破", note));
      }
      if (z1.ch === z2.ch) {
        const note = ZI_XING.has(z1.ch) ? `${z1.ch}${z1.ch}同时构成自刑，反复纠缠更明显。` : "";
        found.push(relItem(`${z1.ch}${z2.ch}地支伏吟`, "伏吟", "k-吟", [z1, z2], "伏吟", note));
      }
    }
  }

  // 三刑（寅巳申 / 丑戌未；两字为半刑）
  XING_GROUPS.forEach(group => {
    const hits = zhis.filter(z => group.chars.includes(z.ch));
    const distinct = [...new Set(hits.map(z => z.ch))];
    if (distinct.length === 3) {
      found.push(relItem(`${group.chars.join("")}三刑`, "刑", "k-刑", hits, "三刑", `${group.name}全刑，三字齐动，压力与纠缠都重。`));
    } else if (distinct.length === 2) {
      const missing = group.chars.find(c => !distinct.includes(c));
      found.push(relItem(`${distinct.join("")}相刑`, "刑", "k-刑", hits, "三刑", `${group.name}组半刑（缺${missing}），岁运补齐时刑象更明显。`));
    }
  });

  // 三合 / 半合 / 拱合
  SANHE.forEach(([sheng, zhong, mu, el]) => {
    const hits = zhis.filter(z => [sheng, zhong, mu].includes(z.ch));
    const distinct = [...new Set(hits.map(z => z.ch))];
    if (distinct.length === 3) {
      found.push(relItem(`${sheng}${zhong}${mu}三合${el}局`, "三合", "k-合", hits, "地支三合"));
    } else if (distinct.length === 2) {
      if (distinct.includes(zhong)) {
        found.push(relItem(`${distinct.join("")}半合${el}`, "半合", "k-合", hits, "地支三合", `含中神${zhong}，方向已定，力量减半。`));
      } else {
        found.push(relItem(`${distinct.join("")}拱${zhong}`, "拱合", "k-合", hits, "地支三合", `两头拱中神${zhong}，${zhong}虽不在盘上，气已暗聚。`));
      }
    }
  });

  // 三会（三字齐才算）
  SANHUI.forEach(([a, b, c, el]) => {
    const hits = zhis.filter(z => [a, b, c].includes(z.ch));
    const distinct = [...new Set(hits.map(z => z.ch))];
    if (distinct.length === 3) found.push(relItem(`${a}${b}${c}三会${el}方`, "三会", "k-合", hits, "地支三会"));
  });

  // 干支自合（同柱）
  for (let p = 0; p < 4; p++) {
    const pz = bazi[p] + bazi[p + 4];
    if (ZIHE_PILLARS.has(pz)) {
      found.push(relItem(`${PILLARS[p]}柱${pz}自合`, "自合", "k-合", [gans[p], zhis[p]], "干支自合"));
    }
  }

  // 坐禄（同柱干支互通禄位）
  for (let p = 0; p < 4; p++) {
    if (LU_MAP[bazi[p]] === bazi[p + 4]) {
      found.push(relItem(`${PILLARS[p]}干${bazi[p]}坐禄（${bazi[p + 4]}）`, "禄", "k-库", [gans[p], zhis[p]], "干支互通禄位"));
    }
  }

  // 墓库
  zhis.forEach(z => {
    const ku = KU_MAP[z.ch];
    if (!ku) return;
    const inMu = [0, 1, 2, 3].filter(p => GAN_MU[bazi[p]] === z.ch).map(p => `${PILLARS[p]}干${bazi[p]}`);
    const note = inMu.length ? `${inMu.join("、")}的墓在${z.ch}，注意入墓与开库。` : "";
    found.push(relItem(`${slotLabel(z.i)}${z.ch}为${ku}`, "库", "k-库", [z], "墓库", note));
  });

  const order = { 冲: 1, 刑: 2, 穿: 3, 破: 4, 反吟: 5, 合: 6, 三合: 7, 半合: 7, 拱合: 7, 三会: 7, 暗合: 8, 自合: 8, 伏吟: 9, 禄: 10, 库: 11 };
  return found.sort((x, y) => (order[x.kindLabel] || 99) - (order[y.kindLabel] || 99));
}

/* ---------- 神煞 ---------- */
function sanheGroupOf(zhi) {
  const g = SANHE.find(group => group.slice(0, 3).includes(zhi));
  return g ? g.slice(0, 3).join("") : "";
}

function scanShensha(bazi) {
  const items = [];
  const zhis = [4, 5, 6, 7].map(i => ({ i, ch: bazi[i] }));
  const dayGan = bazi[2];
  const bases = [{ i: 4, name: "年支" }, { i: 6, name: "日支" }];
  const merged = new Map(); // name+目标格 去重合并

  function hit(name, nodeTitle, cell, baseDesc) {
    const key = name + "@" + cell.i;
    if (merged.has(key)) {
      merged.get(key).baseDescs.push(baseDesc);
      return;
    }
    const item = { name, nodeTitle, nodeId: nodeByTitle.get(nodeTitle)?.id || "", cell, baseDescs: [baseDesc] };
    merged.set(key, item);
    items.push(item);
  }

  // 以年支、日支起的神煞
  bases.forEach(base => {
    const group = sanheGroupOf(bazi[base.i]);
    if (!group) return;
    const tables = [["桃花", TAOHUA], ["驿马", YIMA], ["华盖", HUAGAI], ["将星", JIANGXING]];
    tables.forEach(([name, table]) => {
      const target = table[group];
      zhis.forEach(z => {
        if (z.i !== base.i && z.ch === target) hit(name, name, z, `以${base.name}${bazi[base.i]}起`);
      });
    });
  });

  // 以日干起的神煞
  (TIANYI[dayGan] || []).forEach(t => {
    zhis.forEach(z => { if (z.ch === t) hit("天乙贵人", "天乙贵人", z, `日干${dayGan}的贵人`); });
  });
  zhis.forEach(z => { if (z.ch === WENCHANG[dayGan]) hit("文昌", "文昌", z, `日干${dayGan}的文昌`); });
  zhis.forEach(z => { if (z.ch === YANGREN[dayGan]) hit("羊刃", "羊刃", z, `日干${dayGan}的刃`); });
  zhis.forEach(z => { if (z.ch === LU_MAP[dayGan]) hit("禄神", "禄神", z, `日干${dayGan}的禄`); });

  // 孤辰寡宿（以年支起）
  const yearZhi = bazi[4];
  const guKey = Object.keys(GUCHEN).find(k => k.includes(yearZhi));
  if (guKey) {
    const [gu, gua] = GUCHEN[guKey];
    zhis.forEach(z => {
      if (z.i === 4) return;
      if (z.ch === gu) hit("孤辰", "孤辰寡宿", z, `年支${yearZhi}起孤辰`);
      if (z.ch === gua) hit("寡宿", "孤辰寡宿", z, `年支${yearZhi}起寡宿`);
    });
  }

  // 空亡（以日柱旬起）
  const g = GAN_IDX[bazi[2]], z = ZHI_IDX[bazi[6]];
  if ((g % 2) === (z % 2)) {
    const k1 = ZHI[(z - g + 10 + 12) % 12], k2 = ZHI[(z - g + 11 + 12) % 12];
    zhis.forEach(cell => {
      if (cell.i !== 6 && (cell.ch === k1 || cell.ch === k2)) {
        hit("空亡", "空亡", cell, `日柱${bazi[2]}${bazi[6]}旬空${k1}${k2}`);
      }
    });
  }

  return items;
}

/* ---------- 纳音 ---------- */
function nayinOf(gan, zhi) {
  const g = GAN_IDX[gan], z = ZHI_IDX[zhi];
  if (g === undefined || z === undefined || (g % 2) !== (z % 2)) return null;
  for (let i = g; i < 60; i += 10) {
    if (i % 12 === z) return NAYIN_NAMES[i >> 1];
  }
  return null;
}

function scanNayin(bazi) {
  return PILLARS.map((p, idx) => {
    const gz = bazi[idx] + bazi[idx + 4];
    const name = nayinOf(bazi[idx], bazi[idx + 4]);
    const node = name ? nodeByTitle.get(name) : null;
    return { pillar: p + "柱", ganzhi: gz, name, nodeId: node?.id || "", brief: nodePlain(node) };
  });
}

/* ---------- 搜索与共象聚合 ---------- */
function escapeHtml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function highlight(text, terms) {
  let out = escapeHtml(text);
  terms.forEach(t => {
    if (!t) return;
    out = out.replace(new RegExp(escapeReg(escapeHtml(t)), "g"), m => `<mark>${m}</mark>`);
  });
  return out;
}

function matchNode(node, terms) {
  let score = 0;
  let matchedTerms = 0;
  const evidence = [];
  terms.forEach(term => {
    let termScore = 0;
    const add = (s, label, text) => {
      if (s > termScore) termScore = s;
      if (text && evidence.length < 6) evidence.push({ label, text, s });
    };
    if (node.title.includes(term)) add(100, "词条名", node.title);
    (node.core || []).forEach(c => { if (c.includes(term)) add(46, "核心象", node.core.join("、")); });
    Object.entries(node.branches || {}).forEach(([key, values]) => {
      if (key.includes(term)) add(26, "分类", key + "：" + values.slice(0, 6).join("、"));
      values.forEach(v => {
        if (String(v).includes(term)) {
          add(key === "大白话" || key === "为什么" ? 22 : 15, key, String(v));
        }
      });
    });
    (node.rules || []).forEach(r => { if (r.includes(term)) add(12, "判断提醒", r); });
    (node.relations || []).forEach(r => { if (r.includes(term)) add(14, "关联", r); });
    if (termScore > 0) matchedTerms++;
    score += termScore;
  });
  if (matchedTerms === 0) return null;
  if (terms.length > 1) score += (matchedTerms - 1) * 60;
  evidence.sort((a, b) => b.s - a.s);
  const seen = new Set();
  const lines = [];
  for (const e of evidence) {
    if (seen.has(e.text)) continue;
    seen.add(e.text);
    lines.push(e);
    if (lines.length >= 2) break;
  }
  return { node, score, evidence: lines };
}

function searchNodes(query, limit = 20) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return nodes
    .map(n => matchNode(n, terms))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.node.title.localeCompare(b.node.title, "zh-CN"))
    .slice(0, limit);
}

const OVERLAP_SKIP_KEYS = new Set(["大白话", "为什么", "提醒", "使用提醒", "怎么用", "实战例子", "风险", "判断", "口径差异"]);

function overlapSummary(results, terms) {
  const top = results.slice(0, 12);
  if (top.length < 2) return null;
  const wordNodes = new Map(); // word -> Set(nodeId)
  top.forEach(({ node }) => {
    const pool = [...(node.core || [])];
    Object.entries(node.branches || {}).forEach(([key, values]) => {
      if (OVERLAP_SKIP_KEYS.has(key)) return;
      values.forEach(v => { if (typeof v === "string" && v.length <= 6) pool.push(v); });
    });
    const words = new Set(pool.filter(w => typeof w === "string" && w.length >= 2 && w.length <= 6 && !/[，。、：；\s]/.test(w)));
    words.forEach(w => {
      if (terms.some(t => w === t)) return;
      if (!wordNodes.has(w)) wordNodes.set(w, new Set());
      wordNodes.get(w).add(node.id);
    });
  });
  const overlaps = [...wordNodes.entries()]
    .map(([word, set]) => ({ word, count: set.size }))
    .filter(x => x.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const sysCount = new Map();
  top.forEach(({ node }) => sysCount.set(node.systemTitle, (sysCount.get(node.systemTitle) || 0) + 1));
  const dist = [...sysCount.entries()].sort((a, b) => b[1] - a[1]);
  return { overlaps, dist, topCount: top.length };
}

/* ---------- 象义树：图数据 ---------- */
const SYS_COLORS = {
  "five-elements": "#ffd54f",
  "source-mapping": "#90a4ae",
  "xiangfa-rules": "#ff8a65",
  "combo-cards": "#f06292",
  "ten-gods": "#ef5350",
  "stems": "#4fc3f7",
  "branches": "#66bb6a",
  "relations": "#26c6da",
  "shen-sha": "#c158dc",
  "nayin": "#d4e157",
  "palace-luck": "#9575cd"
};

// 少量类别词别名，帮孤立节点接回网络
const GRAPH_ALIAS = { "五行": ["木", "火", "土", "金", "水"], "冲": ["六冲"], "破": ["六破"], "夫妻宫": ["日支"] };

function buildGraphData() {
  const gnodes = nodes.map((n, i) => ({ i, id: n.id, title: n.title, sysId: n.systemId, deg: 0 }));
  const idxByTitle = new Map(gnodes.map(g => [g.title, g.i]));
  const idxById = new Map(gnodes.map(g => [g.id, g.i]));
  const edgeSet = new Set();
  const edges = [];
  nodes.forEach((n, i) => {
    (n.relations || []).forEach(r => {
      const targets = idxByTitle.has(r) ? [r] : (GRAPH_ALIAS[r] || []);
      targets.forEach(t => {
        const j = idxByTitle.get(t);
        if (j === undefined || j === i) return;
        const key = Math.min(i, j) + "-" + Math.max(i, j);
        if (edgeSet.has(key)) return;
        edgeSet.add(key);
        edges.push([i, j]);
      });
    });
  });
  edges.forEach(([a, b]) => { gnodes[a].deg++; gnodes[b].deg++; });
  return { gnodes, edges, idxById };
}

/* ---------- 本地存储 ---------- */
function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}

function storageSet(key, value) {
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch { /* 忽略 */ }
}

/* ---------- 学习（间隔复习） ---------- */
const SRS_IVL_DAYS = [0.5, 1, 3, 7, 15, 30];

function srsAll() { return storageGet("srs", {}); }

function scopeNodes(scope) {
  return scope === "all" ? nodes : nodes.filter(n => n.systemId === scope);
}

function srsStats(scope) {
  const srs = srsAll();
  let ok = 0, doing = 0, fresh = 0;
  scopeNodes(scope).forEach(n => {
    const e = srs[n.id];
    if (!e || !e.seen) fresh++;
    else if (e.lv >= 3) ok++;
    else doing++;
  });
  return { ok, doing, fresh };
}

function pickStudyNode(scope, excludeId) {
  const srs = srsAll();
  const pool = scopeNodes(scope);
  if (!pool.length) return null;
  const now = Date.now();
  const due = pool.filter(n => n.id !== excludeId && srs[n.id]?.seen && srs[n.id].due <= now)
    .sort((a, b) => (srs[a.id].lv - srs[b.id].lv) || (srs[a.id].due - srs[b.id].due));
  if (due.length) return due[0];
  const fresh = pool.filter(n => n.id !== excludeId && !srs[n.id]?.seen);
  if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)];
  const rest = pool.filter(n => n.id !== excludeId);
  return rest.length ? rest[Math.floor(Math.random() * rest.length)] : pool[0];
}

function gradeStudy(nodeId, grade) {
  const srs = srsAll();
  const e = srs[nodeId] || { lv: 0, due: 0, seen: 0 };
  e.seen = (e.seen || 0) + 1;
  if (grade === "bad") {
    e.lv = 0;
    e.due = Date.now() + 10 * 60 * 1000;
  } else if (grade === "mid") {
    e.lv = Math.max(1, e.lv);
    e.due = Date.now() + SRS_IVL_DAYS[Math.min(e.lv, 1)] * DAY_MS * 0.5;
  } else {
    e.lv = Math.min((e.lv || 0) + 1, 5);
    e.due = Date.now() + SRS_IVL_DAYS[e.lv] * DAY_MS;
  }
  srs[nodeId] = e;
  storageSet("srs", srs);
}

/* ================= DOM 层 ================= */
if (typeof document !== "undefined") {

  const el = {
    topHint: document.querySelector("#topHint"),
    globalSearch: document.querySelector("#globalSearch"),
    clearSearch: document.querySelector("#clearSearch"),
    quickRow: document.querySelector("#quickRow"),
    searchBody: document.querySelector("#searchBody"),
    baziGrid: document.querySelector("#baziGrid"),
    charPicker: document.querySelector("#charPicker"),
    quizMode: document.querySelector("#quizMode"),
    resetBazi: document.querySelector("#resetBazi"),
    chartAnalysis: document.querySelector("#chartAnalysis"),
    studyScope: document.querySelector("#studyScope"),
    studyStats: document.querySelector("#studyStats"),
    studyCard: document.querySelector("#studyCard"),
    systemTabs: document.querySelector("#systemTabs"),
    systemDesc: document.querySelector("#systemDesc"),
    libraryNodes: document.querySelector("#libraryNodes"),
    detailBack: document.querySelector("#detailBack"),
    detailCard: document.querySelector("#detailCard")
  };

  const QUICK_TERMS = ["文书", "财富", "竞争", "表达", "规则", "母亲", "财库", "冲", "合", "穿", "纳音"];
  const HINTS = {
    search: "想到一个词，先查共象",
    chart: "点格子选字，全盘自动标注",
    study: "先自己回忆，再翻面对答案",
    tree: "131个词条织成一张网，点谁看谁",
    library: "按体系慢慢翻",
    detail: "完整象义"
  };
  // 录入顺序：年干→年支→月干→月支→日干→日支→时干→时支
  const ENTRY_ORDER = [0, 4, 1, 5, 2, 6, 3, 7];

  let activeTab = "search";
  let bazi = storageGet("bazi", ["甲", "乙", "丙", "丁", "子", "丑", "午", "酉"]);
  if (!Array.isArray(bazi) || bazi.length !== 8) bazi = ["甲", "乙", "丙", "丁", "子", "丑", "午", "酉"];
  let selectedSlot = 0;
  let quizOn = storageGet("quiz", false);
  let quizRevealed = { rel: false, ss: false };
  let studyScope = storageGet("studyScope", "all");
  let studyNodeId = null;
  let studyFlipped = false;
  let activeSystemId = graph.systems[0]?.id;
  let detailStack = [];

  /* ---- 视图切换 ---- */
  function showView(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === `view-${view}`));
    document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.toggle("active", b.dataset.view === (view === "detail" ? activeTab : view)));
    el.topHint.textContent = HINTS[view] || "";
    window.scrollTo({ top: 0 });
    if (view === "tree") treeStart(); else treeStop();
  }

  function switchTab(tab, pushHistory = true) {
    activeTab = tab;
    detailStack = [];
    showView(tab);
    if (pushHistory) history.replaceState({ tab }, "");
  }

  function openDetail(nodeId, pushHistory = true) {
    const node = nodeById.get(nodeId);
    if (!node) return;
    detailStack.push(nodeId);
    renderDetail(node);
    showView("detail");
    if (pushHistory) history.pushState({ tab: activeTab, detail: detailStack.slice() }, "");
  }

  function goBack() {
    if (!detailStack.length) { switchTab(activeTab); return; }
    detailStack.pop();
    if (detailStack.length) {
      const node = nodeById.get(detailStack[detailStack.length - 1]);
      if (node) renderDetail(node);
      showView("detail");
    } else {
      showView(activeTab);
    }
    // 与浏览器历史保持同步；popstate 会重渲染同一状态，属幂等操作
    try { history.back(); } catch { /* 忽略 */ }
  }

  window.addEventListener("popstate", event => {
    const st = event.state || {};
    if (st.detail?.length) {
      detailStack = st.detail.slice();
      const node = nodeById.get(detailStack[detailStack.length - 1]);
      if (node) {
        renderDetail(node);
        showView("detail");
        return;
      }
    }
    detailStack = [];
    activeTab = st.tab || activeTab;
    showView(activeTab);
  });

  /* ---- 查询页 ---- */
  function renderQuickRow(query) {
    el.quickRow.innerHTML = QUICK_TERMS.map(t =>
      `<button type="button" class="${query === t ? "active" : ""}" data-quick="${escapeHtml(t)}">${escapeHtml(t)}</button>`
    ).join("");
  }

  function nodeCardHtml(result, terms) {
    const { node, evidence } = result;
    const matchLines = (evidence || [])
      .filter(e => e.label !== "词条名")
      .map(e => `<p class="match-line"><b>${escapeHtml(e.label)}</b>${highlight(e.text, terms)}</p>`)
      .join("");
    return `
      <button class="node-card" type="button" data-open-node="${escapeHtml(node.id)}">
        <div class="node-title-row">
          <strong>${terms ? highlight(node.title, terms) : escapeHtml(node.title)}</strong>
          <span class="type-pill">${escapeHtml(node.type)}</span>
          <span class="sys-pill">${escapeHtml(node.systemTitle)}</span>
        </div>
        <div class="core-row">${(node.core || []).slice(0, 5).map(c => `<span>${terms ? highlight(c, terms) : escapeHtml(c)}</span>`).join("")}</div>
        ${matchLines ? `<div class="match-lines">${matchLines}</div>` : `<p class="plain-line">${escapeHtml(nodePlain(node))}</p>`}
      </button>`;
  }

  function renderSearch() {
    const query = el.globalSearch.value.trim();
    renderQuickRow(query);
    if (!query) {
      el.searchBody.innerHTML = `
        <div class="home-entries">
          <button class="home-entry" type="button" data-entry="search"><span class="entry-badge">查</span><span><strong>查一个象</strong><p>想到词就搜：文书、财库、口舌、搬家……</p></span></button>
          <button class="home-entry" type="button" data-entry="chart"><span class="entry-badge">盘</span><span><strong>输入命例</strong><p>点选八字，冲合穿破、神煞纳音自动标出</p></span></button>
          <button class="home-entry" type="button" data-entry="study"><span class="entry-badge">学</span><span><strong>今天学一个</strong><p>翻卡回忆象义，认识/不熟自动安排复习</p></span></button>
        </div>`;
      return;
    }
    const terms = query.split(/\s+/).filter(Boolean);
    const results = searchNodes(query);
    if (!results.length) {
      el.searchBody.innerHTML = `<div class="empty-card">没有找到「${escapeHtml(query)}」。换个说法试试，比如“文书”“财库”“子午冲”。</div>`;
      return;
    }
    const summary = overlapSummary(results, terms);
    let overlapHtml = "";
    if (summary && summary.overlaps.length) {
      overlapHtml = `
        <div class="overlap-card">
          <h3>共象聚合</h3>
          <p class="overlap-note">「${escapeHtml(query)}」命中 ${results.length} 条。下面这些象在多条词条里重复出现——重叠越多，取象越稳：</p>
          <div class="chip-row">
            ${summary.overlaps.map(o => `<button type="button" class="chip ${o.count >= 3 ? "hot" : ""}" data-quick="${escapeHtml(o.word)}">${escapeHtml(o.word)}<small>×${o.count}</small></button>`).join("")}
          </div>
          <p class="sys-dist">常落体系：${summary.dist.slice(0, 4).map(([s, c]) => `${escapeHtml(s)} ${c}条`).join(" · ")}</p>
        </div>`;
    }
    el.searchBody.innerHTML = overlapHtml + results.map(r => nodeCardHtml(r, terms)).join("");
  }

  /* ---- 排盘页 ---- */
  function renderChart() {
    // 上排天干、下排地支
    const cellsHtml = [];
    for (const row of [0, 4]) {
      for (let p = 0; p < 4; p++) {
        const i = row + p;
        const ch = bazi[i];
        const wx = row === 0 ? GAN_WUXING[ch] : ZHI_WUXING[ch];
        let sub;
        if (row === 0) {
          sub = p === 2 ? "日主" : tenGod(bazi[2], ch);
        } else {
          sub = (CANG_GAN[ch] || []).join(" ");
        }
        cellsHtml.push(`
          <button type="button" class="bazi-cell ${selectedSlot === i ? "active" : ""} ${i === 2 ? "day-master" : ""}" data-slot="${i}">
            <span class="slot">${slotLabel(i)}</span>
            <span class="char wx-${wx}">${escapeHtml(ch)}</span>
            <span class="god">${escapeHtml(sub)}</span>
          </button>`);
      }
    }
    el.baziGrid.innerHTML = cellsHtml.join("");

    const isGan = selectedSlot < 4;
    const pool = isGan ? GAN : ZHI;
    const pillarGan = bazi[selectedSlot % 4];
    let hint = "";
    if (!isGan) {
      hint = `<p class="picker-hint">正选 ${slotLabel(selectedSlot)}。提示：真实八字里阳干配阳支、阴干配阴支（本柱天干为${escapeHtml(pillarGan)}）。</p>`;
    } else {
      hint = `<p class="picker-hint">正选 ${slotLabel(selectedSlot)}。</p>`;
    }
    el.charPicker.innerHTML = hint + pool.map(ch => {
      const dim = !isGan && (GAN_IDX[pillarGan] % 2) !== (ZHI_IDX[ch] % 2);
      return `<button type="button" class="${bazi[selectedSlot] === ch ? "active" : ""} ${dim ? "dim" : ""}" data-char="${ch}">${ch}</button>`;
    }).join("");

    el.quizMode.checked = !!quizOn;
    renderAnalysis();
  }

  function relCardHtml(item) {
    return `
      <button class="rel-card ${item.kindClass}" type="button" ${item.nodeId ? `data-open-node="${escapeHtml(item.nodeId)}"` : ""}>
        <div class="rel-title"><strong>${escapeHtml(item.name)}</strong><span class="rel-kind">${escapeHtml(item.kindLabel)}</span></div>
        <p class="rel-pos">${escapeHtml(item.pos)}</p>
        <p class="rel-brief">${escapeHtml(item.brief)}</p>
        ${item.note ? `<p class="rel-brief">${escapeHtml(item.note)}</p>` : ""}
        <p class="rel-palace">${escapeHtml(item.palace)}</p>
        ${item.nodeId ? `<p class="rel-more">点开看「${escapeHtml(item.nodeTitle)}」完整象义 →</p>` : ""}
      </button>`;
  }

  function renderAnalysis() {
    const rels = scanRelations(bazi);
    const shensha = scanShensha(bazi);
    const nayin = scanNayin(bazi);

    const relBody = quizOn && !quizRevealed.rel
      ? `<button class="reveal-btn" type="button" data-reveal="rel">先自己找：盘里哪些字在冲、合、穿、破、刑？想好了点这里揭晓 ${rels.length} 条</button>`
      : (rels.length ? rels.map(relCardHtml).join("") : `<div class="empty-card">这个盘里暂时没扫到干支关系。</div>`);

    const ssCards = shensha.map(s => `
      <button class="info-row" type="button" ${s.nodeId ? `data-open-node="${escapeHtml(s.nodeId)}"` : ""}>
        <div class="row-line"><strong>${escapeHtml(s.name)}</strong><span class="where">${escapeHtml(slotLabel(s.cell.i))}${escapeHtml(s.cell.ch)} · ${escapeHtml(s.baseDescs.join("；"))}</span></div>
        <p class="brief">${escapeHtml(nodePlain(nodeByTitle.get(s.nodeTitle)))}</p>
      </button>`).join("");
    const ssBody = quizOn && !quizRevealed.ss
      ? `<button class="reveal-btn" type="button" data-reveal="ss">先自己找：桃花、驿马、贵人、空亡都落在哪？点这里揭晓 ${shensha.length} 个</button>`
      : (ssCards || `<div class="empty-card">这个盘里没扫到常用神煞。</div>`);

    const nayinBody = nayin.map(n => `
      <button class="info-row" type="button" ${n.nodeId ? `data-open-node="${escapeHtml(n.nodeId)}"` : ""}>
        <div class="row-line"><strong>${escapeHtml(n.pillar)} ${escapeHtml(n.ganzhi)}</strong><span class="where">${n.name ? escapeHtml(n.name) : "干支阴阳不匹配，无纳音"}</span></div>
        ${n.name ? `<p class="brief">${escapeHtml(n.brief)}</p>` : ""}
      </button>`).join("");

    const godRows = [0, 1, 3].map(p => {
      const god = tenGod(bazi[2], bazi[p]);
      const gNode = nodeByTitle.get(god);
      return `
        <div class="god-row">
          <span class="pos-label">${PILLARS[p]}干</span>
          <span class="big-char wx-${GAN_WUXING[bazi[p]]}">${escapeHtml(bazi[p])}</span>
          <button type="button" class="god-link" ${gNode ? `data-open-node="${escapeHtml(gNode.id)}"` : ""}>${escapeHtml(god)}</button>
        </div>`;
    }).join("");
    const hiddenRows = [4, 5, 6, 7].map(i => {
      const ch = bazi[i];
      const parts = (CANG_GAN[ch] || []).map(hg => {
        const god = tenGod(bazi[2], hg);
        const gNode = nodeByTitle.get(god);
        return `<span>${escapeHtml(hg)}</span><button type="button" class="god-link" ${gNode ? `data-open-node="${escapeHtml(gNode.id)}"` : ""}>${escapeHtml(god)}</button>`;
      }).join("");
      return `
        <div class="god-row">
          <span class="pos-label">${slotLabel(i)}</span>
          <span class="big-char wx-${ZHI_WUXING[ch]}">${escapeHtml(ch)}</span>
          <span class="hidden-gods">藏 ${parts}</span>
        </div>`;
    }).join("");

    el.chartAnalysis.innerHTML = `
      <section class="ana-section">
        <div class="ana-head"><h3>干支关系</h3><span class="ana-count">${rels.length} 条</span></div>
        ${relBody}
      </section>
      <section class="ana-section">
        <div class="ana-head"><h3>神煞</h3><span class="ana-count">${shensha.length} 个</span></div>
        ${ssBody}
      </section>
      <section class="ana-section">
        <div class="ana-head"><h3>四柱纳音</h3></div>
        ${nayinBody}
      </section>
      <section class="ana-section">
        <div class="ana-head"><h3>十神与藏干</h3><span class="ana-count">以日干${escapeHtml(bazi[2])}为主</span></div>
        <div class="god-table">${godRows}${hiddenRows}</div>
      </section>`;
  }

  /* ---- 学习页 ---- */
  function renderStudyScope() {
    const scopes = [{ id: "all", title: "全部" }, ...graph.systems.map(s => ({ id: s.id, title: s.title }))];
    el.studyScope.innerHTML = scopes.map(s =>
      `<button type="button" class="${studyScope === s.id ? "active" : ""}" data-scope="${escapeHtml(s.id)}">${escapeHtml(s.title)}</button>`
    ).join("");
  }

  function renderStudyStats() {
    const { ok, doing, fresh } = srsStats(studyScope);
    el.studyStats.innerHTML = `
      <div class="stat-box s-ok"><b>${ok}</b><span>已掌握</span></div>
      <div class="stat-box s-doing"><b>${doing}</b><span>学习中</span></div>
      <div class="stat-box s-new"><b>${fresh}</b><span>未学</span></div>`;
  }

  function renderStudy(pickNew = false) {
    renderStudyScope();
    renderStudyStats();
    if (pickNew || !studyNodeId || !scopeNodes(studyScope).some(n => n.id === studyNodeId)) {
      const next = pickStudyNode(studyScope, studyNodeId);
      studyNodeId = next?.id || null;
      studyFlipped = false;
    }
    const node = nodeById.get(studyNodeId);
    if (!node) {
      el.studyCard.innerHTML = `<div class="empty-card">这个范围里没有词条。</div>`;
      return;
    }
    const srs = srsAll()[node.id];
    const status = !srs?.seen ? "新词条" : (srs.lv >= 3 ? "已掌握 · 复习" : `熟练度 ${srs.lv}/5`);
    if (!studyFlipped) {
      el.studyCard.innerHTML = `
        <div class="flash-card">
          <p class="flash-meta">${escapeHtml(node.systemTitle)} · ${escapeHtml(node.type)} · ${escapeHtml(status)}</p>
          <h2 class="flash-title">${escapeHtml(node.title)}</h2>
          <p class="flash-ask">它的核心象义是什么？大白话怎么讲？先自己想。</p>
        </div>
        <button class="flash-flip" type="button" data-flip>翻面看答案</button>`;
    } else {
      const like = node.branches?.["像什么"];
      el.studyCard.innerHTML = `
        <div class="flash-card">
          <p class="flash-meta">${escapeHtml(node.systemTitle)} · ${escapeHtml(node.type)}</p>
          <h2 class="flash-title" style="font-size:28px">${escapeHtml(node.title)}</h2>
          <div class="flash-core">${(node.core || []).slice(0, 6).map(c => `<span>${escapeHtml(c)}</span>`).join("")}</div>
          <p class="flash-plain">${escapeHtml(nodePlain(node))}</p>
          ${like?.length ? `<p class="flash-like">像什么：${escapeHtml(like.slice(0, 4).join("、"))}</p>` : ""}
        </div>
        <div class="grade-row">
          <button class="grade-bad" type="button" data-grade="bad">不熟</button>
          <button class="grade-mid" type="button" data-grade="mid">模糊</button>
          <button class="grade-good" type="button" data-grade="good">认识</button>
        </div>
        <button class="flash-detail-link" type="button" data-open-node="${escapeHtml(node.id)}">看完整象义（为什么这样取象）</button>`;
    }
  }

  /* ---- 图鉴页 ---- */
  function renderLibrary() {
    el.systemTabs.innerHTML = graph.systems.map(s =>
      `<button type="button" class="${s.id === activeSystemId ? "active" : ""}" data-system="${escapeHtml(s.id)}">${escapeHtml(s.title)}</button>`
    ).join("");
    const sys = graph.systems.find(s => s.id === activeSystemId) || graph.systems[0];
    el.systemDesc.textContent = `${sys.desc || ""}（${sys.nodes.length} 条）`;
    el.libraryNodes.innerHTML = sys.nodes.map(n => {
      const full = nodeById.get(n.id) || n;
      return nodeCardHtml({ node: full, evidence: [] }, null);
    }).join("");
  }

  /* ---- 详情页 ---- */
  const PLAIN_KEYS = ["大白话", "为什么", "像什么"];

  function renderDetail(node) {
    const branches = Object.entries(node.branches || {});
    const plainBlocks = PLAIN_KEYS
      .filter(k => node.branches?.[k]?.length)
      .map(k => {
        const values = node.branches[k];
        const body = values.length === 1
          ? `<p>${escapeHtml(values[0])}</p>`
          : `<ul>${values.map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>`;
        const label = k === "为什么" ? "为什么这样取象" : k;
        return `<div class="plain-box"><h4>${escapeHtml(label)}</h4>${body}</div>`;
      }).join("");

    const otherBlocks = branches
      .filter(([k]) => !PLAIN_KEYS.includes(k))
      .map(([k, values]) => {
        const short = values.every(v => String(v).length <= 8);
        const body = short
          ? `<div class="chip-row">${values.map(v => `<button type="button" class="chip" data-quick="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join("")}</div>`
          : `<ul>${values.map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>`;
        return `<div class="branch-block"><h4>${escapeHtml(k)}</h4>${body}</div>`;
      }).join("");

    const relChips = (node.relations || []).map(r => {
      const target = nodeByTitle.get(r);
      return target
        ? `<button type="button" data-open-node="${escapeHtml(target.id)}">${escapeHtml(r)}</button>`
        : `<button type="button" data-quick="${escapeHtml(r)}">${escapeHtml(r)}</button>`;
    }).join("");

    el.detailCard.innerHTML = `
      <div class="detail-title-row">
        <h2>${escapeHtml(node.title)}</h2>
        <span class="type-pill">${escapeHtml(node.type)}</span>
      </div>
      <p class="detail-sys">${escapeHtml(node.systemTitle)}</p>
      <div class="detail-core">${(node.core || []).map(c => `<button type="button" data-quick="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("")}</div>
      ${plainBlocks}
      ${otherBlocks}
      ${node.rules?.length ? `<div class="branch-block"><h4>判断提醒</h4><ul>${node.rules.map(r => `<li>${escapeHtml(r)}</li>`).join("")}</ul></div>` : ""}
      ${relChips ? `<div class="branch-block"><h4>关联词条</h4><div class="relation-links">${relChips}</div></div>` : ""}`;
  }

  /* ---- 象义树 ---- */
  const tree = {
    inited: false, running: false, raf: 0, physics: false, dirty: true,
    n: [], e: [], idxById: null, anchors: [],
    cam: { x: 0, y: 0, s: 0.8 },
    alpha: 0, selected: -1, neighbors: new Set(), focusSys: "",
    W: 320, H: 480, dpr: 1,
    pointers: new Map(), pinch0: null, dragNode: -1, panStart: null, moved: 0, downAt: 0
  };
  const treeCanvas = document.querySelector("#treeCanvas");
  const treeCtx = treeCanvas.getContext("2d");
  const treeWrap = document.querySelector("#treeWrap");
  const treeInfo = document.querySelector("#treeInfo");
  const treeLegend = document.querySelector("#treeLegend");

  function treeInit() {
    const { gnodes, edges, idxById } = buildGraphData();
    tree.idxById = idxById;
    tree.e = edges;
    const sysIds = graph.systems.map(s => s.id);
    // 竖椭圆排布锚点，贴合手机竖屏
    const RX = 420, RY = 660;
    tree.anchors = sysIds.map((id, k) => {
      const a = (k / sysIds.length) * Math.PI * 2 - Math.PI / 2;
      return { id, x: Math.cos(a) * RX, y: Math.sin(a) * RY };
    });
    const anchorOf = Object.fromEntries(tree.anchors.map(a => [a.id, a]));
    tree.n = gnodes.map(g => {
      const a = anchorOf[g.sysId];
      return {
        ...g,
        x: a.x + (Math.random() - 0.5) * 200,
        y: a.y + (Math.random() - 0.5) * 200,
        vx: 0, vy: 0,
        ax: a.x, ay: a.y,
        r: 4 + Math.min(g.deg, 12) * 0.65,
        color: SYS_COLORS[g.sysId] || "#ffffff"
      };
    });
    tree.alpha = 1;
    for (let i = 0; i < 240; i++) treeTick();
    tree.alpha = 0.12;
    treeLegend.innerHTML = graph.systems.map(s =>
      `<button type="button" data-tree-sys="${escapeHtml(s.id)}"><span class="dot" style="color:${SYS_COLORS[s.id]};background:${SYS_COLORS[s.id]}"></span>${escapeHtml(s.title)}</button>`
    ).join("");
    renderTreeInfo();
    tree.inited = true;
  }

  function treeTick() {
    const N = tree.n, E = tree.e, a = tree.alpha;
    // 斥力（全对）
    for (let i = 0; i < N.length; i++) {
      const ni = N[i];
      for (let j = i + 1; j < N.length; j++) {
        const nj = N[j];
        let dx = ni.x - nj.x, dy = ni.y - nj.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1; }
        if (d2 > 300000) continue;
        const f = Math.min(1750 / d2, 4) * a;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f, fy = (dy / d) * f;
        ni.vx += fx; ni.vy += fy;
        nj.vx -= fx; nj.vy -= fy;
      }
    }
    // 边弹簧（跨体系的连线放松，让集群分得开）
    for (const [i, j] of E) {
      const ni = N[i], nj = N[j];
      const dx = nj.x - ni.x, dy = nj.y - ni.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const cross = ni.sysId !== nj.sysId;
      const f = (d - (cross ? 130 : 80)) * (cross ? 0.008 : 0.02) * a;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      ni.vx += fx; ni.vy += fy;
      nj.vx -= fx; nj.vy -= fy;
    }
    // 体系锚点引力 + 全局向心
    for (const ni of N) {
      ni.vx += (ni.ax - ni.x) * 0.014 * a + (0 - ni.x) * 0.0012 * a;
      ni.vy += (ni.ay - ni.y) * 0.014 * a + (0 - ni.y) * 0.0012 * a;
      ni.vx *= 0.85; ni.vy *= 0.85;
      if (tree.dragNode !== ni.i) { ni.x += ni.vx; ni.y += ni.vy; }
    }
    tree.alpha *= 0.995;
    if (tree.alpha < 0.02) { tree.alpha = 0; tree.physics = false; }
    tree.dirty = true;
  }

  function w2s(x, y) {
    return [(x - tree.cam.x) * tree.cam.s + tree.W / 2, (y - tree.cam.y) * tree.cam.s + tree.H / 2];
  }

  function s2w(sx, sy) {
    return [(sx - tree.W / 2) / tree.cam.s + tree.cam.x, (sy - tree.H / 2) / tree.cam.s + tree.cam.y];
  }

  function treeRender() {
    if (!treeCtx) return;
    const ctx = treeCtx, s = tree.cam.s;
    ctx.setTransform(tree.dpr, 0, 0, tree.dpr, 0, 0);
    ctx.fillStyle = "#0d0b14";
    ctx.fillRect(0, 0, tree.W, tree.H);
    const hasSel = tree.selected >= 0;
    const focus = tree.focusSys;

    // 边
    for (const [i, j] of tree.e) {
      const ni = tree.n[i], nj = tree.n[j];
      const [x1, y1] = w2s(ni.x, ni.y);
      const [x2, y2] = w2s(nj.x, nj.y);
      let alpha = 0.16, width = 1, color = ni.color;
      if (hasSel) {
        const on = (i === tree.selected || j === tree.selected);
        alpha = on ? 0.9 : 0.04;
        width = on ? 1.8 : 1;
        if (on) color = tree.n[tree.selected].color;
      } else if (focus) {
        const on = ni.sysId === focus || nj.sysId === focus;
        alpha = on ? 0.32 : 0.04;
      }
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 节点（光晕 + 实心核）
    for (const ni of tree.n) {
      const [sx, sy] = w2s(ni.x, ni.y);
      if (sx < -40 || sy < -40 || sx > tree.W + 40 || sy > tree.H + 40) continue;
      let dimmed = false;
      if (hasSel) dimmed = !(ni.i === tree.selected || tree.neighbors.has(ni.i));
      else if (focus) dimmed = ni.sysId !== focus;
      const r = ni.r * s;
      ctx.globalAlpha = dimmed ? 0.10 : 0.22;
      ctx.fillStyle = ni.color;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = dimmed ? 0.25 : 1;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      if (ni.i === tree.selected) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 文字（屏幕空间，恒定字号）
    ctx.globalAlpha = 1;
    ctx.font = "11px -apple-system, 'PingFang SC', sans-serif";
    ctx.textAlign = "center";
    for (const ni of tree.n) {
      let show;
      if (hasSel) show = ni.i === tree.selected || tree.neighbors.has(ni.i);
      else if (focus) show = ni.sysId === focus ? (s > 0.4 || ni.deg >= 5) : false;
      else show = s >= 0.62 || ni.deg >= 7;
      if (!show) continue;
      const [sx, sy] = w2s(ni.x, ni.y);
      if (sx < -20 || sy < -20 || sx > tree.W + 20 || sy > tree.H + 20) continue;
      const bold = ni.i === tree.selected;
      ctx.font = (bold ? "600 13px" : "11px") + " -apple-system, 'PingFang SC', sans-serif";
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillText(ni.title, sx + 1, sy + ni.r * s + 13);
      ctx.fillStyle = bold ? "#ffffff" : "rgba(255,255,255,0.85)";
      ctx.fillText(ni.title, sx, sy + ni.r * s + 12);
    }
  }

  function treeLoop() {
    if (!tree.running) return;
    if (tree.physics) { treeTick(); treeTick(); }
    if (tree.dirty) { treeRender(); tree.dirty = false; }
    tree.raf = requestAnimationFrame(treeLoop);
  }

  function treeResize() {
    const navH = document.querySelector(".bottom-nav")?.offsetHeight || 64;
    const top = treeWrap.getBoundingClientRect().top;
    const h = Math.max(420, window.innerHeight - top - navH - 4);
    const w = treeWrap.clientWidth || window.innerWidth;
    tree.dpr = Math.min(window.devicePixelRatio || 1, 2);
    tree.W = w; tree.H = h;
    treeCanvas.style.height = h + "px";
    treeCanvas.width = Math.round(w * tree.dpr);
    treeCanvas.height = Math.round(h * tree.dpr);
    tree.dirty = true;
  }

  function treeFitTo(list) {
    if (!list.length) return;
    // 用分位数裁剪，外围孤点不把视野拉偏
    const xs = list.map(n => n.x).sort((p, q) => p - q);
    const ys = list.map(n => n.y).sort((p, q) => p - q);
    const lo = Math.floor(xs.length * 0.06), hi = Math.ceil(xs.length * 0.94) - 1;
    const x1 = xs[lo], x2 = xs[hi], y1 = ys[lo], y2 = ys[hi];
    const bw = Math.max(x2 - x1, 60), bh = Math.max(y2 - y1, 60);
    tree.cam.s = Math.min(Math.min(tree.W / bw, tree.H / bh) * 0.82, 2.2);
    tree.cam.x = (x1 + x2) / 2;
    tree.cam.y = (y1 + y2) / 2;
    tree.dirty = true;
  }

  function renderTreeInfo() {
    if (tree.selected < 0) {
      treeInfo.innerHTML = `<span class="hint">点节点看关联 · 双指缩放 · 可拖动揉网</span>`;
      return;
    }
    const gn = tree.n[tree.selected];
    const node = nodeById.get(gn.id);
    const nbs = [...tree.neighbors].map(i => tree.n[i]).slice(0, 10);
    treeInfo.innerHTML = `
      <div class="tree-card">
        <div class="tc-title">
          <strong>${escapeHtml(gn.title)}</strong>
          <span class="tc-sys" style="color:${gn.color}">${escapeHtml(node.systemTitle)}</span>
        </div>
        <p class="tc-core">${escapeHtml((node.core || []).slice(0, 5).join(" · "))}</p>
        ${nbs.length ? `<div class="tc-neighbors">${nbs.map(nb => `<button type="button" data-tree-select="${nb.i}">${escapeHtml(nb.title)}</button>`).join("")}</div>` : ""}
        <button class="tc-open" type="button" data-open-node="${escapeHtml(gn.id)}">看完整象义 →</button>
      </div>`;
  }

  function selectTreeNode(i, center = true) {
    tree.selected = i;
    tree.neighbors = new Set();
    if (i >= 0) {
      tree.e.forEach(([a, b]) => {
        if (a === i) tree.neighbors.add(b);
        if (b === i) tree.neighbors.add(a);
      });
      if (center) {
        tree.cam.x = tree.n[i].x;
        tree.cam.y = tree.n[i].y;
        if (tree.cam.s < 0.75) tree.cam.s = 1.1;
      }
    }
    renderTreeInfo();
    tree.dirty = true;
  }

  function treeStart() {
    if (!tree.inited) treeInit();
    treeResize();
    if (!tree.fitted) { treeFitTo(tree.n); tree.fitted = true; }
    if (!tree.running) {
      tree.running = true;
      if (tree.alpha > 0.02) tree.physics = true;
      tree.dirty = true;
      tree.raf = requestAnimationFrame(treeLoop);
    }
  }

  function treeStop() {
    tree.running = false;
    if (tree.raf) cancelAnimationFrame(tree.raf);
    tree.raf = 0;
  }

  function treeHit(sx, sy) {
    const [wx, wy] = s2w(sx, sy);
    let best = -1, bestD = Infinity;
    for (const ni of tree.n) {
      const dx = ni.x - wx, dy = ni.y - wy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const hitR = ni.r + 12 / tree.cam.s;
      if (d < hitR && d < bestD) { best = ni.i; bestD = d; }
    }
    return best;
  }

  function canvasPos(ev) {
    const rect = treeCanvas.getBoundingClientRect();
    return [ev.clientX - rect.left, ev.clientY - rect.top];
  }

  treeCanvas.addEventListener("pointerdown", ev => {
    treeCanvas.setPointerCapture(ev.pointerId);
    const [sx, sy] = canvasPos(ev);
    tree.pointers.set(ev.pointerId, { sx, sy });
    tree.moved = 0;
    tree.downAt = Date.now();
    if (tree.pointers.size === 1) {
      const hit = treeHit(sx, sy);
      if (hit >= 0) {
        tree.dragNode = hit;
        tree.alpha = Math.max(tree.alpha, 0.25);
        tree.physics = true;
      } else {
        tree.panStart = { camx: tree.cam.x, camy: tree.cam.y, sx, sy };
      }
    } else if (tree.pointers.size === 2) {
      tree.dragNode = -1;
      tree.panStart = null;
      const pts = [...tree.pointers.values()];
      tree.pinch0 = {
        d: Math.hypot(pts[0].sx - pts[1].sx, pts[0].sy - pts[1].sy),
        s: tree.cam.s,
        mid: [(pts[0].sx + pts[1].sx) / 2, (pts[0].sy + pts[1].sy) / 2]
      };
      tree.pinch0.world = s2w(tree.pinch0.mid[0], tree.pinch0.mid[1]);
    }
  });

  treeCanvas.addEventListener("pointermove", ev => {
    if (!tree.pointers.has(ev.pointerId)) return;
    const [sx, sy] = canvasPos(ev);
    const prev = tree.pointers.get(ev.pointerId);
    tree.moved += Math.abs(sx - prev.sx) + Math.abs(sy - prev.sy);
    tree.pointers.set(ev.pointerId, { sx, sy });

    if (tree.pointers.size === 2 && tree.pinch0) {
      const pts = [...tree.pointers.values()];
      const d = Math.hypot(pts[0].sx - pts[1].sx, pts[0].sy - pts[1].sy) || 1;
      tree.cam.s = Math.min(4, Math.max(0.15, tree.pinch0.s * (d / tree.pinch0.d)));
      const mid = [(pts[0].sx + pts[1].sx) / 2, (pts[0].sy + pts[1].sy) / 2];
      tree.cam.x = tree.pinch0.world[0] - (mid[0] - tree.W / 2) / tree.cam.s;
      tree.cam.y = tree.pinch0.world[1] - (mid[1] - tree.H / 2) / tree.cam.s;
      tree.dirty = true;
      return;
    }
    if (tree.dragNode >= 0) {
      const [wx, wy] = s2w(sx, sy);
      const ni = tree.n[tree.dragNode];
      ni.x = wx; ni.y = wy; ni.vx = 0; ni.vy = 0;
      tree.alpha = Math.max(tree.alpha, 0.2);
      tree.physics = true;
      tree.dirty = true;
      return;
    }
    if (tree.panStart) {
      tree.cam.x = tree.panStart.camx - (sx - tree.panStart.sx) / tree.cam.s;
      tree.cam.y = tree.panStart.camy - (sy - tree.panStart.sy) / tree.cam.s;
      tree.dirty = true;
    }
  });

  function treePointerEnd(ev) {
    if (!tree.pointers.has(ev.pointerId)) return;
    const { sx, sy } = tree.pointers.get(ev.pointerId);
    tree.pointers.delete(ev.pointerId);
    if (tree.pointers.size < 2) tree.pinch0 = null;
    const wasTap = tree.moved < 10 && Date.now() - tree.downAt < 400;
    if (wasTap) {
      const hit = treeHit(sx, sy);
      selectTreeNode(hit, hit >= 0);
    }
    tree.dragNode = -1;
    tree.panStart = null;
  }
  treeCanvas.addEventListener("pointerup", treePointerEnd);
  treeCanvas.addEventListener("pointercancel", treePointerEnd);

  treeCanvas.addEventListener("wheel", ev => {
    ev.preventDefault();
    const [sx, sy] = canvasPos(ev);
    const [wx, wy] = s2w(sx, sy);
    tree.cam.s = Math.min(4, Math.max(0.15, tree.cam.s * (ev.deltaY < 0 ? 1.12 : 0.89)));
    tree.cam.x = wx - (sx - tree.W / 2) / tree.cam.s;
    tree.cam.y = wy - (sy - tree.H / 2) / tree.cam.s;
    tree.dirty = true;
  }, { passive: false });

  document.querySelector("#treeFit").addEventListener("click", () => {
    tree.focusSys = "";
    selectTreeNode(-1, false);
    treeLegend.querySelectorAll("button").forEach(b => b.classList.remove("active"));
    treeFitTo(tree.n);
  });

  document.querySelector("#treeShuffle").addEventListener("click", () => {
    tree.n.forEach(ni => {
      ni.x = ni.ax + (Math.random() - 0.5) * 240;
      ni.y = ni.ay + (Math.random() - 0.5) * 240;
      ni.vx = 0; ni.vy = 0;
    });
    tree.alpha = 1;
    tree.physics = true;
    tree.dirty = true;
  });

  treeLegend.addEventListener("click", ev => {
    const btn = ev.target.closest("[data-tree-sys]");
    if (!btn) return;
    const sys = btn.dataset.treeSys;
    tree.focusSys = tree.focusSys === sys ? "" : sys;
    selectTreeNode(-1, false);
    treeLegend.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.treeSys === tree.focusSys));
    if (tree.focusSys) treeFitTo(tree.n.filter(ni => ni.sysId === tree.focusSys));
    else treeFitTo(tree.n);
  });

  window.addEventListener("resize", () => {
    if (tree.running) treeResize();
  });

  /* ---- 事件 ---- */
  document.body.addEventListener("click", event => {
    const nav = event.target.closest("[data-view]");
    if (nav) { switchTab(nav.dataset.view); return; }

    const entry = event.target.closest("[data-entry]");
    if (entry) {
      const to = entry.dataset.entry;
      if (to === "search") { el.globalSearch.focus(); return; }
      switchTab(to);
      if (to === "study") renderStudy();
      return;
    }

    const treeSel = event.target.closest("[data-tree-select]");
    if (treeSel) { selectTreeNode(Number(treeSel.dataset.treeSelect)); return; }

    const open = event.target.closest("[data-open-node]");
    if (open) { openDetail(open.dataset.openNode); return; }

    const quick = event.target.closest("[data-quick]");
    if (quick) {
      el.globalSearch.value = quick.dataset.quick;
      if (activeTab !== "search" || detailStack.length) switchTab("search");
      renderSearch();
      return;
    }

    const slot = event.target.closest("[data-slot]");
    if (slot) { selectedSlot = Number(slot.dataset.slot); renderChart(); return; }

    const charBtn = event.target.closest("[data-char]");
    if (charBtn) {
      bazi[selectedSlot] = charBtn.dataset.char;
      storageSet("bazi", bazi);
      quizRevealed = { rel: false, ss: false };
      const next = ENTRY_ORDER[(ENTRY_ORDER.indexOf(selectedSlot) + 1) % 8];
      selectedSlot = next;
      renderChart();
      return;
    }

    const reveal = event.target.closest("[data-reveal]");
    if (reveal) { quizRevealed[reveal.dataset.reveal] = true; renderAnalysis(); return; }

    const scope = event.target.closest("[data-scope]");
    if (scope) {
      studyScope = scope.dataset.scope;
      storageSet("studyScope", studyScope);
      renderStudy(true);
      return;
    }

    if (event.target.closest("[data-flip]")) { studyFlipped = true; renderStudy(); return; }

    const grade = event.target.closest("[data-grade]");
    if (grade) {
      gradeStudy(studyNodeId, grade.dataset.grade);
      renderStudy(true);
      return;
    }

    const system = event.target.closest("[data-system]");
    if (system) { activeSystemId = system.dataset.system; renderLibrary(); return; }
  });

  el.globalSearch.addEventListener("input", renderSearch);
  el.clearSearch.addEventListener("click", () => { el.globalSearch.value = ""; renderSearch(); });
  el.resetBazi.addEventListener("click", () => {
    bazi = ["甲", "乙", "丙", "丁", "子", "丑", "午", "酉"];
    selectedSlot = 0;
    quizRevealed = { rel: false, ss: false };
    storageSet("bazi", bazi);
    renderChart();
  });
  el.quizMode.addEventListener("change", () => {
    quizOn = el.quizMode.checked;
    quizRevealed = { rel: false, ss: false };
    storageSet("quiz", quizOn);
    renderAnalysis();
  });
  el.detailBack.addEventListener("click", goBack);

  /* ---- 启动 ---- */
  history.replaceState({ tab: "search" }, "");
  renderSearch();
  renderChart();
  renderStudy();
  renderLibrary();
}
