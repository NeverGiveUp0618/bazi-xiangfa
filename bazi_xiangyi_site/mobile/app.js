/* ===== 象义随身 · 手机版 =====
 * 设计原则：
 * 1. 查询：一个词 -> 共象聚合 -> 为什么匹配 -> 详情
 * 2. 排盘：点选八字，自动标出关系/神煞/纳音/十神，每一项都能点进象义库
 * 3. 学习：客观答题为主，对错自动进入本地间隔复习；解析只用于查看
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
const JUE_PAIRS = ["申卯", "亥午", "子巳", "寅酉"];
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

// 8-11 为叠加的岁运槽位：大运干/大运支/流年干/流年支
const LUCK_SLOT_LABELS = ["大运干", "大运支", "流年干", "流年支"];

function slotLabel(i) {
  if (i >= 8) return LUCK_SLOT_LABELS[i - 8] || "";
  return PILLARS[i % 4] + (i < 4 ? "干" : "支");
}

function palaceOfSlot(i) {
  if (i >= 8) return i < 10 ? "大运" : "流年";
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

const SEASON_BY_MONTH = {
  寅: { name: "孟春", season: "春木初生", wang: "木旺、火相、水休、金囚、土死", hint: "像启动、萌发、计划成形；木气刚起，宜看生发和方向，不宜直接断结果已稳。" },
  卯: { name: "仲春", season: "春木最旺", wang: "木旺、火相、水休、金囚、土死", hint: "像生长、人际、门户、审美最明显；木太旺也有枝蔓、纠缠、规矩松散。" },
  辰: { name: "季春", season: "春末湿土", wang: "土渐起、木有余气、水入库", hint: "像收束、库、湿土、旧事沉淀；辰带水库，常把流动之事收进手续或库存。" },
  巳: { name: "孟夏", season: "夏火初旺", wang: "火旺、土相、木休、水囚、金死", hint: "像热度、曝光、行动、技术启动；火起但未极，先看传播、动力和外显。" },
  午: { name: "仲夏", season: "夏火最旺", wang: "火旺、土相、木休、水囚、金死", hint: "像名气、速度、热闹、情绪最强；火太旺也取急躁、炎症、口舌、过度曝光。" },
  未: { name: "季夏", season: "夏末燥土", wang: "土旺、火有余气、木入库", hint: "像承载、田宅、库、成果收纳；未为木库，常把生发之物收成资源或负担。" },
  申: { name: "孟秋", season: "秋金初旺", wang: "金旺、水相、土休、火囚、木死", hint: "像规则、切割、工具、执行开始；金气起，先看制度、技术、边界。" },
  酉: { name: "仲秋", season: "秋金最旺", wang: "金旺、水相、土休、火囚、木死", hint: "像精细、口舌、审美、金属、兑象最明显；金太旺也取挑剔、分离、伤口。" },
  戌: { name: "季秋", season: "秋末燥土", wang: "土旺、金有余气、火入库", hint: "像收尾、库、规章沉淀、旧火收藏；戌为火库，常把名气、热度、心气收住。" },
  亥: { name: "孟冬", season: "冬水初旺", wang: "水旺、木相、金休、土囚、火死", hint: "像流动、信息、远方、暗处启动；水起，宜看迁移、想法、资源流。" },
  子: { name: "仲冬", season: "冬水最旺", wang: "水旺、木相、金休、土囚、火死", hint: "像智慧、隐秘、流动、寒冷最强；水太旺也取拖延、寒湿、情绪暗涌。" },
  丑: { name: "季冬", season: "冬末湿土", wang: "土渐起、水有余气、金入库", hint: "像低温收藏、账本、库存、旧资产；丑为金库，常把规则、钱物、器具收住。" }
};

function monthSeasonInfo(bazi) {
  const month = bazi[5];
  const info = SEASON_BY_MONTH[month];
  if (!info) return null;
  const monthNode = nodeForChar(month);
  return {
    month,
    ...info,
    nodeId: monthNode?.id || "",
    plain: nodePlain(monthNode)
  };
}

function nayinPillarUse(pillar) {
  return {
    年柱: "年柱纳音偏看根源、祖上、早年环境和外界给你的底色。",
    月柱: "月柱纳音偏看父母、单位平台、职业环境和当令气候。",
    日柱: "日柱纳音偏看自己、配偶宫附近的气质、居住与亲密关系底色。",
    时柱: "时柱纳音偏看子女、作品、晚年结果和事情落点。"
  }[pillar] || "";
}

function relItem(name, kindLabel, kindClass, cells, nodeTitle, note) {
  const node = nodeByTitle.get(nodeTitle);
  return {
    name, kindLabel, kindClass, nodeTitle,
    nodeId: node?.id || "",
    pos: posText(cells),
    palace: palaceLine(cells),
    brief: nodePlain(node),
    scanWhy: `盘中同时见 ${posText(cells)}，按检测口径归入「${kindLabel}」象。`,
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
      if (CHUAN_SHENG.includes(p12) || CHUAN_SHENG.includes(p21)) found.push(relItem(`${z1.ch}${z2.ch}相穿`, "穿", "k-穿", [z1, z2], "穿", "属生穿：一边给一边伤，多看心性、模式、关系方式转换。"));
      if (CHUAN_KE.includes(p12) || CHUAN_KE.includes(p21)) found.push(relItem(`${z1.ch}${z2.ch}相穿`, "穿", "k-穿", [z1, z2], "穿", "属克穿：直接卡住生路，实质损伤、穿跑穿走的力道更硬。"));
      const liuheEl = ZHI_LIUHE[p12] || ZHI_LIUHE[p21];
      if (liuheEl) found.push(relItem(`${z1.ch}${z2.ch}六合`, "合", "k-合", [z1, z2], "地支六合", `对应合化五行为${liuheEl}，但先按合留、合绊、牵连取象。`));
      if (ANHE_PAIRS.includes(p12) || ANHE_PAIRS.includes(p21)) found.push(relItem(`${z1.ch}${z2.ch}暗合`, "暗合", "k-合", [z1, z2], "暗合"));
      if (JUE_PAIRS.includes(p12) || JUE_PAIRS.includes(p21)) {
        const hasAnhe = ANHE_PAIRS.includes(p12) || ANHE_PAIRS.includes(p21);
        const note = hasAnhe ? "此组也入暗合：绝看明气不通，暗合看暗线牵连。" : "绝主气机不接、缘分变薄，喜忌决定是摆脱还是损失。";
        found.push(relItem(`${z1.ch}${z2.ch}相绝`, "绝", "k-破", [z1, z2], "绝", note));
      }
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
  const pairHas = (chars, a, b) => chars.includes(a) && chars.includes(b);
  const zhongBrokenBy = (zhong, chars) => {
    const blockers = [];
    chars.forEach(ch => {
      if (ch === zhong) return;
      const p = zhong + ch, q = ch + zhong;
      if (ZHI_CHONG[zhong] === ch) blockers.push(`${zhong}${ch}冲`);
      if (CHUAN_SHENG.includes(p) || CHUAN_SHENG.includes(q) || CHUAN_KE.includes(p) || CHUAN_KE.includes(q)) blockers.push(`${zhong}${ch}穿`);
      if (PO_PAIRS.includes(p) || PO_PAIRS.includes(q)) blockers.push(`${zhong}${ch}破`);
      if (JUE_PAIRS.includes(p) || JUE_PAIRS.includes(q)) blockers.push(`${zhong}${ch}绝`);
    });
    return blockers;
  };
  SANHE.forEach(([sheng, zhong, mu, el]) => {
    const hits = zhis.filter(z => [sheng, zhong, mu].includes(z.ch));
    const distinct = [...new Set(hits.map(z => z.ch))];
    if (distinct.length === 3) {
      const broken = zhongBrokenBy(zhong, zhis.map(z => z.ch));
      const note = broken.length
        ? `三字齐全，但中神${zhong}见${broken.join("、")}，按本体系要先验破局。`
        : `三字齐全且未见中神${zhong}被冲穿绝破，三合${el}局较稳。`;
      found.push(relItem(`${sheng}${zhong}${mu}三合${el}局`, "三合", "k-合", hits, "地支三合", note));
    } else if (distinct.length === 2) {
      if (distinct.includes(zhong)) {
        const hasSheng = pairHas(distinct, sheng, zhong);
        const pairName = hasSheng ? `${sheng}${zhong}` : `${zhong}${mu}`;
        found.push(relItem(`${distinct.join("")}半合${el}`, "半合", "k-合", hits, "地支三合", `${pairName}半合，含中神${zhong}，方向已定但不按完整成局。`));
      } else {
        found.push(relItem(`${distinct.join("")}拱${zhong}`, "拱合", "k-合", hits, "地支三合", `两头拱中神${zhong}，${zhong}未到，多看意向、虚位，等岁运填实。`));
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

  const order = { 冲: 1, 刑: 2, 穿: 3, 破: 4, 绝: 5, 反吟: 6, 合: 7, 三合: 8, 半合: 8, 拱合: 8, 三会: 8, 暗合: 9, 自合: 9, 伏吟: 10, 禄: 11, 库: 12 };
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
    item.scanWhy = `${baseDesc}，目标字落在${slotLabel(cell.i)}${cell.ch}，所以扫到${name}。`;
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
    return { pillar: p + "柱", ganzhi: gz, name, nodeId: node?.id || "", brief: nodePlain(node), scanWhy: name ? `${p}柱为${gz}，六十甲子纳音表对应「${name}」。` : `${p}柱${gz}干支阴阳不匹配，所以不取纳音。` };
  });
}

/* ---------- 组合象识别（盘里出现的十神组合，连到组合卡） ---------- */
const CAI_MU_OF_WX = { 木: "未", 火: "戌", 土: "戌", 金: "丑", 水: "辰" };

// 统计盘里出现的十神组（含地支藏干），返回 { 组名: [{god, where}] }
function chartGodGroups(bazi) {
  const dg = bazi[2];
  const groups = {};
  const push = (grp, god, where) => { if (!grp) return; (groups[grp] = groups[grp] || []).push({ god, where }); };
  [0, 1, 3].forEach(p => push(GOD_GROUP[tenGod(dg, bazi[p])], tenGod(dg, bazi[p]), `${PILLARS[p]}干${bazi[p]}`));
  [4, 5, 6, 7].forEach(i => (CANG_GAN[bazi[i]] || []).forEach(hg => {
    const g = tenGod(dg, hg);
    push(GOD_GROUP[g], g, `${PILLARS[i % 4]}支${bazi[i]}藏${hg}`);
  }));
  return groups;
}

// 识别盘中成立的组合卡
function detectCombos(bazi) {
  const g = chartGodGroups(bazi);
  const godsOf = grp => (g[grp] ? [...new Set(g[grp].map(x => x.god))].join("、") : "");
  const has = grp => !!(g[grp] && g[grp].length);
  const rels = scanRelations(bazi);
  const hasChong = rels.some(r => r.kindLabel === "冲");
  const hasHe = rels.some(r => ["合", "三合", "半合", "拱合", "暗合"].includes(r.kindLabel));
  const dayZhi = bazi[6];
  const spouseChuan = [4, 5, 7].some(i => {
    const p = dayZhi + bazi[i], q = bazi[i] + dayZhi;
    return CHUAN_SHENG.includes(p) || CHUAN_SHENG.includes(q) || CHUAN_KE.includes(p) || CHUAN_KE.includes(q);
  });
  const caiWx = WUXING_KE[GAN_WUXING[bazi[2]]];
  const caiMu = CAI_MU_OF_WX[caiWx];
  const caiMuHit = has("财星") && [4, 5, 6, 7].some(i => bazi[i] === caiMu);

  const out = [];
  const add = (title, why) => { const n = nodeByTitle.get(title); if (n) out.push({ nodeTitle: title, nodeId: n.id, why }); };

  // 顺序：具体/少见的组合在前，最宽泛的（冲+宫位、印+文书）在后
  if (has("食伤") && has("官杀")) add("食伤 + 官杀", `盘中${godsOf("食伤")}遇${godsOf("官杀")}：看是食神制杀（吉），还是伤官见官（要小心）。`);
  if (has("印星") && has("财星")) add("印 + 财", `盘中${godsOf("印星")}遇${godsOf("财星")}：先分清是财破印，还是有印护身、财生官护印。`);
  if (has("比劫") && has("财星")) add("比劫 + 财", `盘中${godsOf("比劫")}遇${godsOf("财星")}：留意比劫夺财、合伙分账。`);
  if (caiMuHit) add("墓库 + 财", `财星属${caiWx}，其墓库「${caiMu}」在盘中：财易入库，是财库也可能被关住。`);
  if (spouseChuan) add("穿 + 夫妻宫", `日支（夫妻宫）${dayZhi}被穿：婚姻感情宫位有暗损、难言的别扭。`);
  if (has("财星") && hasHe) add("合 + 财", `盘中有${godsOf("财星")}又有合：财被合住，看是合来（得财）还是合去（失财）。`);
  if (hasChong) add("冲 + 宫位", "盘中有六冲：重点看冲动了哪个宫位、可能应什么变动。");
  if (has("印星")) add("印 + 文书", `盘中有${godsOf("印星")}：印主文书、证件、学历与庇护，办证签约类事看印。`);
  return out;
}

/* ---------- 岁运叠加（大运/流年与原局的作用与应期） ---------- */
// luck: [大运干, 大运支, 流年干, 流年支]，未选为空串
function luckUnits(luck) {
  const arr = Array.isArray(luck) ? luck : ["", "", "", ""];
  const units = [];
  if (arr[0] || arr[1]) units.push({ name: "大运", gi: 8, zi: 9, gan: arr[0], zhi: arr[1] });
  if (arr[2] || arr[3]) units.push({ name: "流年", gi: 10, zi: 11, gan: arr[2], zhi: arr[3] });
  return units;
}

// 岁运干对日主的十神＝这步运/这年的主题
function luckGodThemes(bazi, luck) {
  const dayGan = bazi[2];
  return luckUnits(luck).filter(u => u.gan).map(u => {
    const god = tenGod(dayGan, u.gan);
    const node = nodeByTitle.get(god);
    return { name: u.name, gan: u.gan, god, nodeId: node?.id || "", brief: nodePlain(node) };
  });
}

function scanLuck(bazi, luck) {
  const found = [];
  const units = luckUnits(luck);
  if (!units.length) return found;
  const dayGan = bazi[2];
  const natalGans = [0, 1, 2, 3].map(i => ({ i, ch: bazi[i] }));
  const natalZhis = [4, 5, 6, 7].map(i => ({ i, ch: bazi[i] }));
  const chongPalaceNote = z => ({
    4: "冲年支：根基、祖上、早年环境之事被引动。",
    5: "冲提纲（月令）：全局气候被撼动，应期分量最重。",
    6: "冲夫妻宫（日支）：婚恋与贴身环境先动。",
    7: "冲时支：子女、下属、成果落点之事被引动。"
  }[z.i] || "");

  for (const u of units) {
    if (u.gan) {
      const gc = { i: u.gi, ch: u.gan };
      for (const g of natalGans) {
        const heEl = GAN_HE[pairKey(u.gan, g.ch)] || GAN_HE[pairKey(g.ch, u.gan)];
        if (heEl) found.push(relItem(`${u.name}${u.gan}合${slotLabel(g.i)}${g.ch}`, "合", "k-合", [gc, g], "天干五合",
          `岁运合原局天干，先看合动、合绊${g.i === 2 ? "；合到日主，这步的主题直接找上门" : ""}；欲化${heEl}仍要看月令与通根。`));
        if (u.gan === g.ch) found.push(relItem(`${u.name}${u.gan}与${slotLabel(g.i)}伏吟`, "伏吟", "k-吟", [gc, g], "伏吟", "岁运见同字：旧事重提，这个字管的事加倍显象。"));
      }
    }
    if (u.zhi) {
      const zc = { i: u.zi, ch: u.zhi };
      for (const z of natalZhis) {
        const p12 = pairKey(u.zhi, z.ch), p21 = pairKey(z.ch, u.zhi);
        if (ZHI_CHONG[u.zhi] === z.ch) {
          const kuNote = (KU_MAP[u.zhi] || KU_MAP[z.ch]) ? "又属辰戌丑未之冲，先分开库还是破库。" : "";
          found.push(relItem(`${u.name}${u.zhi}冲${slotLabel(z.i)}${z.ch}`, "冲", "k-冲", [zc, z], "六冲", `${chongPalaceNote(z)}${kuNote}`));
        }
        if (CHUAN_SHENG.includes(p12) || CHUAN_SHENG.includes(p21)) found.push(relItem(`${u.name}${u.zhi}穿${slotLabel(z.i)}${z.ch}`, "穿", "k-穿", [zc, z], "穿", `生穿：${z.i === 6 ? "穿到夫妻宫，" : ""}岁运引动心性与相处模式的转换。`));
        if (CHUAN_KE.includes(p12) || CHUAN_KE.includes(p21)) found.push(relItem(`${u.name}${u.zhi}穿${slotLabel(z.i)}${z.ch}`, "穿", "k-穿", [zc, z], "穿", `克穿：${z.i === 6 ? "穿到夫妻宫，" : ""}实质损伤更硬，穿跑穿走看这步。`));
        const liuheEl = ZHI_LIUHE[p12] || ZHI_LIUHE[p21];
        if (liuheEl) found.push(relItem(`${u.name}${u.zhi}合${slotLabel(z.i)}${z.ch}`, "合", "k-合", [zc, z], "地支六合", `岁运合动原局${z.ch}：${z.i === 6 ? "夫妻宫被合，婚恋之事被引动；" : ""}看是合来、合留还是合绊。`));
        if (ANHE_PAIRS.includes(p12) || ANHE_PAIRS.includes(p21)) found.push(relItem(`${u.name}${u.zhi}暗合${slotLabel(z.i)}${z.ch}`, "暗合", "k-合", [zc, z], "暗合", "岁运暗合：暗线牵连的人事这段时间浮出来。"));
        if (JUE_PAIRS.includes(p12) || JUE_PAIRS.includes(p21)) found.push(relItem(`${u.name}${u.zhi}绝${slotLabel(z.i)}${z.ch}`, "绝", "k-破", [zc, z], "绝", "岁运逢绝：气机不接，看是摆脱旧事还是缘分变薄。"));
        if (PO_PAIRS.includes(p12) || PO_PAIRS.includes(p21)) found.push(relItem(`${u.name}${u.zhi}破${slotLabel(z.i)}${z.ch}`, "破", "k-破", [zc, z], "六破", "四正破口径：岁运来破，旧格局被敲掉一角。"));
        if (u.zhi === z.ch) {
          const note = ZI_XING.has(u.zhi) ? `${u.zhi}${u.zhi}并见也构成自刑，反复纠缠更明显。` : "岁运填实伏吟：原局这个字管的事被点名，虚象转实。";
          found.push(relItem(`${u.name}${u.zhi}与${slotLabel(z.i)}伏吟`, "伏吟", "k-吟", [zc, z], "伏吟", note));
        }
      }
      // 三刑：岁运补字成刑
      XING_GROUPS.forEach(group => {
        if (!group.chars.includes(u.zhi)) return;
        const hits = natalZhis.filter(z => group.chars.includes(z.ch) && z.ch !== u.zhi);
        const distinct = [...new Set(hits.map(z => z.ch))];
        if (distinct.length === 2) {
          found.push(relItem(`${u.name}${u.zhi}补齐${group.chars.join("")}三刑`, "刑", "k-刑", [zc, ...hits], "三刑", `${group.name}：原局半刑被岁运补齐，三字齐动，刑象应期到。`));
        } else if (distinct.length === 1) {
          found.push(relItem(`${u.name}${u.zhi}刑${slotLabel(hits[0].i)}${distinct[0]}`, "刑", "k-刑", [zc, ...hits], "三刑", `${group.name}组半刑，由岁运引动，岁运再补${group.chars.find(c => c !== u.zhi && c !== distinct[0])}则全刑。`));
        }
      });
      // 三合：岁运凑齐成局 / 填实拱位
      SANHE.forEach(([sheng, zhong, mu, el]) => {
        const trio = [sheng, zhong, mu];
        if (!trio.includes(u.zhi)) return;
        const hits = natalZhis.filter(z => trio.includes(z.ch) && z.ch !== u.zhi);
        const distinct = [...new Set(hits.map(z => z.ch))];
        if (distinct.length === 2) {
          found.push(relItem(`${u.name}${u.zhi}凑齐${trio.join("")}三合${el}局`, "三合", "k-合", [zc, ...hits], "地支三合",
            u.zhi === zhong ? `原局两头拱${zhong}，岁运填实中神：虚位成真，${el}局之事应期最明显。` : `岁运补上${u.zhi}，按三合${el}局成局看（仍要验中神${zhong}是否被冲穿绝破）。`));
        }
      });
      // 三会：岁运会齐
      SANHUI.forEach(([a, b, c, el]) => {
        const trio = [a, b, c];
        if (!trio.includes(u.zhi)) return;
        const hits = natalZhis.filter(z => trio.includes(z.ch) && z.ch !== u.zhi);
        const distinct = [...new Set(hits.map(z => z.ch))];
        if (distinct.length === 2) found.push(relItem(`${u.name}${u.zhi}会齐${trio.join("")}三会${el}方`, "三会", "k-合", [zc, ...hits], "地支三会", `岁运到位会成${el}方，一方之气最旺，${el}所主之事集中应。`));
      });
      // 墓库引动
      if (KU_MAP[u.zhi]) {
        const caiWx = WUXING_KE[GAN_WUXING[dayGan]];
        const bits = [];
        if (CAI_MU_OF_WX[caiWx] === u.zhi) bits.push(`正是日主${dayGan}的财库（财属${caiWx}）`);
        const inMu = [0, 1, 2, 3].filter(p => GAN_MU[bazi[p]] === u.zhi).map(p => `${PILLARS[p]}干${bazi[p]}`);
        if (inMu.length) bits.push(`${inMu.join("、")}逢之入墓`);
        if (bits.length) found.push(relItem(`${u.name}${u.zhi}带${KU_MAP[u.zhi]}`, "库", "k-库", [zc], "墓库", `岁运带库：${bits.join("；")}。库要冲开、刑开才用得上，只入不开反而闭气。`));
      }
    }
    // 岁运柱自合
    if (u.gan && u.zhi && ZIHE_PILLARS.has(u.gan + u.zhi)) {
      found.push(relItem(`${u.name}${u.gan}${u.zhi}自合`, "自合", "k-合", [{ i: u.gi, ch: u.gan }, { i: u.zi, ch: u.zhi }], "干支自合", "岁运柱自合：这段时间的事自我纠缠、自己内部消化。"));
    }
  }

  // 大运 × 流年
  const dy = units.find(u => u.name === "大运");
  const ln = units.find(u => u.name === "流年");
  if (dy && ln) {
    if (dy.gan && dy.zhi && dy.gan === ln.gan && dy.zhi === ln.zhi) {
      found.push(relItem(`岁运并临（${dy.gan}${dy.zhi}）`, "伏吟", "k-吟", [{ i: 8, ch: dy.gan }, { i: 9, ch: dy.zhi }, { i: 10, ch: ln.gan }, { i: 11, ch: ln.zhi }], "伏吟", "大运流年同干支：同一股气双倍压过来，这一年最容易见大事。"));
    } else {
      if (dy.gan && ln.gan) {
        const heEl = GAN_HE[pairKey(dy.gan, ln.gan)] || GAN_HE[pairKey(ln.gan, dy.gan)];
        if (heEl) found.push(relItem(`大运${dy.gan}合流年${ln.gan}`, "合", "k-合", [{ i: 8, ch: dy.gan }, { i: 10, ch: ln.gan }], "天干五合", "运与年相合：两股外来之气纠在一起，事情多有牵扯。"));
      }
      if (dy.zhi && ln.zhi) {
        if (ZHI_CHONG[dy.zhi] === ln.zhi) found.push(relItem(`大运${dy.zhi}冲流年${ln.zhi}`, "冲", "k-冲", [{ i: 9, ch: dy.zhi }, { i: 11, ch: ln.zhi }], "六冲", "运与太岁相冲：外环境本身动荡，再看各自牵动原局哪个宫位。"));
        const pk = pairKey(dy.zhi, ln.zhi), qk = pairKey(ln.zhi, dy.zhi);
        if (ZHI_LIUHE[pk] || ZHI_LIUHE[qk]) found.push(relItem(`大运${dy.zhi}合流年${ln.zhi}`, "合", "k-合", [{ i: 9, ch: dy.zhi }, { i: 11, ch: ln.zhi }], "地支六合", "运与太岁相合：外环境合成一股劲，顺逆都被放大。"));
      }
    }
  }

  const order = { 冲: 1, 刑: 2, 穿: 3, 破: 4, 绝: 5, 合: 6, 三合: 7, 三会: 7, 暗合: 8, 自合: 8, 伏吟: 9, 库: 10 };
  return found.sort((x, y) => (order[x.kindLabel] || 99) - (order[y.kindLabel] || 99));
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

function sourceCompare(results, query) {
  const specs = [
    { id: "ten-gods", title: "十神来的象", why: "从人事关系和资源角色取象，比如印为文书庇护、财为钱物客户、官为规则名分。" },
    { id: "combo-cards", title: "组合来的象", why: "多个十神、宫位或关系叠在一起，先看条件是否成立，再看反例。" },
    { id: "relations", title: "干支关系来的象", why: "冲合刑穿破让字与字发生作用，重点看哪个宫位被引动。" },
    { id: "shen-sha", title: "神煞来的象", why: "神煞补画面和场景，不单独定吉凶，要回到宫位与十神。" },
    { id: "nayin", title: "纳音来的象", why: "纳音补充一柱的质地和背景，年/月/日/时应的位置不同。" },
    { id: "palace-luck", title: "宫位岁运来的象", why: "同一个象落年/月/日/时，应到长辈、平台、自己婚恋、结果子女会不同。" }
  ];
  const groups = specs.map(spec => ({
    ...spec,
    hits: results.filter(r => r.node.systemId === spec.id).slice(0, 4).map(r => r.node.title)
  })).filter(g => g.hits.length);
  const known = new Set(specs.map(s => s.id));
  const other = results.filter(r => !known.has(r.node.systemId)).slice(0, 4).map(r => r.node.title);
  if (other.length) {
    groups.push({ id: "other", title: "本象来的象", why: `直接从字、五行或资料映射里命中「${query}」，先看本义，再看是否与其他来源重叠。`, hits: other });
  }
  return groups.slice(0, 5);
}

const ANTI_KEYS = ["不能这样断", "反例", "不成立条件"];

function antiEvidenceOf(node, terms = []) {
  const out = [];
  Object.entries(node.branches || {}).forEach(([key, values]) => {
    const isAnti = ANTI_KEYS.some(k => key.includes(k)) || key === "小案例";
    if (!isAnti) return;
    values.forEach(v => {
      const text = String(v);
      const isCaseAnti = key === "小案例" && !text.includes("反例");
      if (isCaseAnti) return;
      if (terms.length && !terms.some(t => text.includes(t) || node.title.includes(t) || (node.core || []).some(c => c.includes(t)))) return;
      out.push({ label: key, text });
    });
  });
  return out.slice(0, 3);
}

function applyAntiFirst(results, terms) {
  return results.map((r, idx) => ({ ...r, anti: antiEvidenceOf(r.node, terms), originalIndex: idx }))
    .sort((a, b) => (b.anti.length - a.anti.length) || (b.score - a.score) || (a.originalIndex - b.originalIndex));
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
const GRAPH_ALIAS = {
  "五行": ["木", "火", "土", "金", "水"],
  "冲": ["六冲"], "破": ["六破"], "夫妻宫": ["日支"],
  // 十神统称 → 具体词条，让「财富载体」这类按组说事的节点入网
  "财星": ["正财", "偏财"], "印星": ["正印", "偏印"], "官杀": ["正官", "七杀"],
  "比劫": ["比肩", "劫财"], "食伤": ["食神", "伤官"]
};

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

/* ---------- 象义树：连线理由（为什么这两个词连着） ---------- */
// 纳音名 -> 两组干支，如 杨柳木 -> [壬午, 癸未]
const NAYIN_GANZHI = {};
NAYIN_NAMES.forEach((name, k) => {
  NAYIN_GANZHI[name] = [2 * k, 2 * k + 1].map(i => GAN[i % 10] + ZHI[i % 12]);
});

const GOD_GROUP = { 正印: "印星", 偏印: "印星", 比肩: "比劫", 劫财: "比劫", 食神: "食伤", 伤官: "食伤", 正财: "财星", 偏财: "财星", 正官: "官杀", 七杀: "官杀" };
const GROUP_SHENG = { 印星: "比劫", 比劫: "食伤", 食伤: "财星", 财星: "官杀", 官杀: "印星" };
const GROUP_KE = { 印星: "食伤", 比劫: "财星", 食伤: "官杀", 财星: "印星", 官杀: "比劫" };
const GROUP_COMBO_NAME = {
  "官杀印星": "官印相生", "印星比劫": "印生身", "比劫食伤": "身生食伤", "食伤财星": "食伤生财", "财星官杀": "财生官",
  "财星印星": "财破印", "比劫财星": "比劫夺财", "食伤官杀": "食神制杀、伤官见官", "印星食伤": "印制食伤", "官杀比劫": "官杀克身"
};
const SHENSHA_SPOTS = {
  桃花: { spots: "子午卯酉", why: "桃花按三合局起，永远落在子午卯酉四正（沐浴）之位" },
  将星: { spots: "子午卯酉", why: "将星是三合局的中神，只会是子午卯酉" },
  驿马: { spots: "寅申巳亥", why: "驿马按三合局起，永远落在寅申巳亥四驿（长生冲位）" },
  华盖: { spots: "辰戌丑未", why: "华盖是三合局的墓神，只会是辰戌丑未四库" }
};

// 取节点代表的单字（甲木->甲、未土->未、五行节点->本字）
function charOfNode(n) {
  if (n.systemId === "stems" || n.systemId === "branches") return n.title[0];
  if (n.systemId === "five-elements" && n.title.length === 1) return n.title;
  return "";
}

const HARM_RELS = new Set(["六冲", "三刑", "六害", "六破", "穿", "反吟", "绝", "患"]);
const HE_RELS = new Set(["天干五合", "地支六合", "暗合", "干支自合", "地支三合", "地支三会"]);

// 需要命理常识才能讲清的连线，逐对手写大白话
const PAIR_NOTES = {
  "财富载体|正财": "财富载体的第一入口就是正财：工资、正业、稳定进项，直接是钱。",
  "财富载体|偏财": "偏财是流动之财：生意、机会财、大众之财，最典型的财富载体。",
  "财富载体|食神": "没有财星也能富：食神是技术、手艺、产品，靠食神生财输出变现。",
  "财富载体|伤官": "伤官是才华、名气、表现力，靠曝光和作品变现，也是财富载体。",
  "财富载体|正印": "印是资质、证书、房产、牌照——凭证类资产同样承载财富。",
  "财富载体|偏印": "偏印是冷门技术、独门手艺、特殊资质，照样能作为变现载体。",
  "财富载体|正官": "官是职位、名分、平台，位置本身带来资源，也是财富的承载方式。",
  "财富载体|七杀": "七杀是权力、掌控、竞争性行业，掌控力可以直接换成资源。",
  "财富载体|比肩": "比劫是人群、人脉、渠道：靠人多成事也能变现，但同时主分财。",
  "财富载体|劫财": "劫财能借人群和胆量成财，也最容易夺财——载体与漏口是同一个字。",
  "干支虚实|干支互通禄位": "坐禄就是天干在地支的本气强根，是“实”的最典型形态。",
  "干支虚实|墓库": "库中余气也是根，但闭在库里透不出来，介于虚实之间，开库才用得上。",
  "干支虚实|生克关系": "定虚实除了看根，还要看全局生扶克泄：被生则实一分，被克泄则虚一分。",
  "干支虚实|日主": "断盘第一步就是定日主的虚实状态，状态定了才谈喜忌和意向。",
  "患|比肩": "患就是同五行不同心的竞争象，比肩正是同类并立，喜则帮身、忌则添堵。",
  "患|劫财": "劫财是患最尖锐的一面：同类抢同一份资源，内耗和夺财都从这里出。",
  "禄神|正财": "禄即俸禄饭碗，与正财的稳定进项同路；身有禄根，财才担得住。",
  "禄神|偏财": "进阶口径把禄也算财富载体：食禄、可享用资源，与偏财的机会财互参。",
  "时柱|食神": "时柱是子女宫，食神是生养输出之星，宫星互参；两者也都主作品和成果。",
  "时柱|日支": "日支时支贴身相邻：日支看自己和配偶，时柱看子女晚年，常一起断家庭内部。",
  "时柱|大运": "时柱管晚年与结果，大运定人生阶段；看晚景要把时柱之象叠在晚年那几步大运上。",
  "华盖|偏印": "华盖与偏印气质同类：孤高、玄学、冷门学问，常互相印证。",
  "羊刃|劫财": "羊刃就是阳干的劫财旺地，刃是劫财的极端形态。",
  "羊刃|七杀": "羊刃驾杀是经典格局：刃的狠劲要靠七杀来统领使用。",
  "禄神|比肩": "禄是日主同气之根，禄位藏干正是比肩。",
  "天乙贵人|正印": "贵人主庇护提携，与正印的庇护、资格之象相合。",
  "天乙贵人|正官": "贵人常应在名分、体制内的提携上，与正官同路。",
  "文昌|正印": "文昌主文书考试，正印主文凭证书，文事相通。",
  "文昌|食神": "文昌主聪明才思，食神主才华输出，都是吐秀之象。",
  "文昌|伤官": "文昌的聪明外露一面，与伤官的表达才华同路。",
  "将星|七杀": "将星主掌权统兵，配七杀（权力威严）最典型。",
  "将星|正官": "将星主掌权，正官主职位名分，合看权位。",
  "将星|正印": "将星配印，权力有靠山有印信，主掌实权。",
  "贵人类|天乙贵人": "天乙贵人是贵人类神煞里的头牌。",
  "贵人类|正印": "贵人类神煞多应庇护提携，与正印同气。",
  "贵人类|正官": "贵人类常应体制内的提携，与正官名分同路。",
  "煞类|七杀": "七杀本身就是十神里的『煞』，凶煞类的核心字。",
  "煞类|三刑": "三刑是煞类总纲下常用的凶象之一。",
  "煞类|羊刃": "羊刃属凶煞类，气烈而狠。",
  "华盖|墓库": "华盖本身就落在辰戌丑未四墓库支上，天生带收藏孤静之气。",
  "孤辰寡宿|华盖": "都偏孤：华盖孤高自处，孤寡孤冷少伴，常合看六亲缘分。",
  "孤辰寡宿|日支": "孤寡落在日支（夫妻宫）才最应婚姻孤象。",
  "干支互通禄位|禄神": "同一个『禄』：禄位讲天干在地支的根，禄神把它当神煞看饭碗根基。",
  "空亡|伏吟": "空亡主虚、伏吟主原地反复，都常表现为使不上劲、没结果。",
  "驿马|六冲": "驿马逢冲则动——马要冲才跑，冲是驿马应事的扳机。",
  "六冲|墓库": "四库逢冲论开库破库，冲是墓库最重要的动象。",
  "地支六合|六冲": "合与冲互为反象：合主绑定、冲主打开；冲可解合，合可绊冲。",
  "海中金|水": "海中金生于甲子乙丑（水旺之地），金沉海底，与水气相依。",
  "三元类象|共象": "都是取象方法论：三元类象提供来源维度，共象取重叠交集。",
  "大运|月柱": "大运从月柱顺逆排出，是月令气数的延伸。",
  "年柱|月柱": "年管祖上早年、月管父母青年，是前后相续的两个宫位。",
  "年柱|大运": "大运一步步走过的气数与年柱根基相应，早年运先看家底。",
  "日主|日支": "日主坐日支：自己与配偶、身与家同在一柱。",
  "日支|流年": "流年冲合日支时，婚姻、家庭、身体的事最容易应验。",
  "日支|六冲": "日支被冲是夫妻宫动的第一信号，主家宅婚姻变动。",
  "官鬼爻 -> 官杀|六冲": "官鬼爻主克身之事，冲同属克动之象，可互相印证。",
  "官鬼爻 -> 官杀|三刑": "官鬼爻主克身之事，刑同属克伤纠缠之象，可互相印证。",
  "地支三合|土": "三合局的收尾（墓神）都是土支——辰戌丑未随局收藏。",
  "地支三会|土": "三会每一方都以土支收尾（春辰夏未秋戌冬丑），土是聚气的收藏端。"
};

function pairNote(a, b) {
  return PAIR_NOTES[a.title + "|" + b.title] || PAIR_NOTES[b.title + "|" + a.title] || null;
}

function explainPair(a, b) {
  // 手写精注 > 结构规则 > 原文摘句 > 兜底
  return pairNote(a, b)
    || explainDirected(a, b) || explainDirected(b, a)
    || explainByQuote(a, b) || explainByQuote(b, a)
    || "两个条目在资料里互相标注为关联词，取象时常放在一起看。";
}

function explainDirected(a, b) {
  const ca = charOfNode(a), cb = charOfNode(b);

  // 纳音 -> 干支 / 五行
  if (a.systemId === "nayin") {
    const pair = NAYIN_GANZHI[a.title] || [];
    if (cb) {
      const hitGz = pair.find(gz => gz.includes(cb));
      if (hitGz && b.systemId === "stems") return `「${a.title}」由${pair.join("、")}两柱组成，${cb}是其中${hitGz}柱的天干。`;
      if (hitGz && b.systemId === "branches") return `「${a.title}」由${pair.join("、")}两柱组成，${cb}是其中${hitGz}柱的地支。`;
      if (b.systemId === "five-elements" && a.title.endsWith(cb)) return `「${a.title}」的纳音五行就是${cb}。`;
    }
    return null;
  }

  // 五行 <- 天干/地支
  if (b.systemId === "five-elements" && cb) {
    if (a.systemId === "stems" && GAN_WUXING[ca] === cb) return `天干${ca}五行属${cb}，是${cb}的${ganYinYang(ca)}性形态。`;
    if (a.systemId === "branches" && ZHI_WUXING[ca] === cb) return `地支${ca}五行属${cb}。`;
    if (a.systemId === "branches" && KU_MAP[ca] === cb + "库") return `${ca}是${cb}库，${cb}的气收藏在${ca}里。`;
  }

  // 五行 <-> 五行
  if (a.systemId === "five-elements" && b.systemId === "five-elements" && ca && cb) {
    if (WUXING_SHENG[ca] === cb) return `五行相生：${ca}生${cb}。`;
    if (WUXING_SHENG[cb] === ca) return `五行相生：${cb}生${ca}。`;
    if (WUXING_KE[ca] === cb) return `五行相克：${ca}克${cb}。`;
    if (WUXING_KE[cb] === ca) return `五行相克：${cb}克${ca}。`;
  }

  if (ca && cb) {
    // 地支 <-> 地支
    if (ZHI_IDX[ca] !== undefined && ZHI_IDX[cb] !== undefined) {
      if (ZHI_CHONG[ca] === cb) return `${ca}${cb}相冲（六冲），一动一开，是最直接的作用关系。`;
      if (ZHI_LIUHE[ca + cb] || ZHI_LIUHE[cb + ca]) return `${ca}${cb}六合，气相亲、能绑在一起。`;
      if (CHUAN_SHENG.includes(ca + cb) || CHUAN_SHENG.includes(cb + ca)) return `${ca}${cb}相穿（生穿），暗中损耗。`;
      if (CHUAN_KE.includes(ca + cb) || CHUAN_KE.includes(cb + ca)) return `${ca}${cb}相穿（克穿），直接卡住生路。`;
      if (PO_PAIRS.includes(ca + cb) || PO_PAIRS.includes(cb + ca)) return `${ca}${cb}相破，完整性受损。`;
      const isAnhePair = ANHE_PAIRS.includes(ca + cb) || ANHE_PAIRS.includes(cb + ca);
      const isJuePair = JUE_PAIRS.includes(ca + cb) || JUE_PAIRS.includes(cb + ca);
      if (isAnhePair && isJuePair) return `${ca}${cb}兼具暗合与绝的口径：暗合看暗线牵连，绝看明气不通。`;
      if (isAnhePair) return `${ca}${cb}暗合，藏干私下勾连。`;
      if (isJuePair) return `${ca}${cb}相绝，气机不接、缘分变薄。`;
      const sh = SANHE.find(g => g.slice(0, 3).includes(ca) && g.slice(0, 3).includes(cb));
      if (sh) return `${ca}${cb}同属${sh.slice(0, 3).join("")}三合${sh[3]}体系，气脉相近；是否成局仍看三字齐全和中神是否被坏。`;
      const hui = SANHUI.find(g => g.slice(0, 3).includes(ca) && g.slice(0, 3).includes(cb));
      if (hui) return `${ca}${cb}同属${hui.slice(0, 3).join("")}三会${hui[3]}方，季节同气。`;
      const xing = XING_GROUPS.find(g => g.chars.includes(ca) && g.chars.includes(cb));
      if (xing) return `${ca}${cb}同在${xing.chars.join("")}${xing.name}组里，相刑纠缠。`;
    }
    // 天干 <-> 地支
    if (GAN_IDX[ca] !== undefined && ZHI_IDX[cb] !== undefined) {
      const parts = [];
      if (LU_MAP[ca] === cb) parts.push(`${ca}的禄在${cb}，${ca}在${cb}最有根气`);
      if ((CANG_GAN[cb] || []).includes(ca)) parts.push(`${cb}的藏干里有${ca}（${(CANG_GAN[cb] || []).join("")}），${ca}在${cb}中通根`);
      if (GAN_MU[ca] === cb) parts.push(`${ca}的墓库在${cb}，气归藏于此`);
      if (YANGREN[ca] === cb) parts.push(`${cb}是${ca}的羊刃（帝旺之地），气最旺最烈`);
      if (parts.length) return parts.join("；") + "。";
      if (GAN_WUXING[ca] === ZHI_WUXING[cb]) return `${ca}与${cb}同属${GAN_WUXING[ca]}，干支同气。`;
    }
    // 天干 <-> 天干
    if (GAN_IDX[ca] !== undefined && GAN_IDX[cb] !== undefined) {
      if (GAN_HE[ca + cb] || GAN_HE[cb + ca]) return `${ca}${cb}天干五合，欲化${GAN_HE[ca + cb] || GAN_HE[cb + ca]}。`;
      if (GAN_WUXING[ca] === GAN_WUXING[cb]) return `${ca}${cb}同属${GAN_WUXING[ca]}，一阳一阴，是同一种气的两副面孔。`;
      if (WUXING_SHENG[GAN_WUXING[ca]] === GAN_WUXING[cb]) return `${GAN_WUXING[ca]}生${GAN_WUXING[cb]}，${ca}能生${cb}。`;
      if (WUXING_KE[GAN_WUXING[ca]] === GAN_WUXING[cb]) return `${GAN_WUXING[ca]}克${GAN_WUXING[cb]}，${ca}能克${cb}。`;
    }
  }

  // 十神 <-> 十神
  if (GOD_GROUP[a.title] && GOD_GROUP[b.title]) {
    const ga = GOD_GROUP[a.title], gb = GOD_GROUP[b.title];
    if (ga === gb) return `${a.title}和${b.title}同属${ga}，一正一偏，象义同源、用法有别。`;
    if (GROUP_SHENG[ga] === gb) return `${ga}生${gb}${GROUP_COMBO_NAME[ga + gb] ? `（${GROUP_COMBO_NAME[ga + gb]}）` : ""}，两者常连着看。`;
    if (GROUP_SHENG[gb] === ga) return `${gb}生${ga}${GROUP_COMBO_NAME[gb + ga] ? `（${GROUP_COMBO_NAME[gb + ga]}）` : ""}，两者常连着看。`;
    if (GROUP_KE[ga] === gb) return `${ga}克${gb}${GROUP_COMBO_NAME[ga + gb] ? `（${GROUP_COMBO_NAME[ga + gb]}）` : ""}，是一对典型的作用关系。`;
    if (GROUP_KE[gb] === ga) return `${gb}克${ga}${GROUP_COMBO_NAME[gb + ga] ? `（${GROUP_COMBO_NAME[gb + ga]}）` : ""}，是一对典型的作用关系。`;
  }

  // 组合卡 -> 组成元素
  if (a.systemId === "combo-cards") {
    const short = b.title[0];
    if (a.title.includes(b.title) || (GOD_GROUP[b.title] && a.title.includes(GOD_GROUP[b.title][0]))) {
      return `「${a.title}」这张组合卡就是由${b.title}这类字参与构成的。`;
    }
    if (a.title.includes(short)) return `「${a.title}」组合里包含「${short}」，${b.title}是它的组成元素之一。`;
  }

  // 神煞 -> 地支落点
  if (a.systemId === "shen-sha" && SHENSHA_SPOTS[a.title] && cb && SHENSHA_SPOTS[a.title].spots.includes(cb)) {
    return `${SHENSHA_SPOTS[a.title].why}，${cb}是其中之一。`;
  }

  // 羊刃 -> 天干
  if (a.title === "羊刃" && b.systemId === "stems" && YANGREN[cb]) {
    return `${cb}的羊刃在${YANGREN[cb]}——阳干才有刃，${b.title}是典型的带刃之干。`;
  }

  // 阴阳 -> 五行
  if (a.title === "阴阳" && b.systemId === "five-elements" && cb) {
    return `每一行都分阴阳两面（如甲为阳${cb}、乙为阴${cb}这样成对），阴阳是五行的底层属性。`;
  }

  // 墓库条目 -> 四库支
  if (a.title === "墓库" && cb && KU_MAP[cb]) {
    return `${cb}就是四墓库之一（${KU_MAP[cb]}），墓库讲的正是这四个字。`;
  }

  // 损伤类关系互连
  if (HARM_RELS.has(a.title) && HARM_RELS.has(b.title)) {
    return "同属损伤动荡类关系，只是方式不同：冲明撞、刑纠缠、穿暗损、破裂缝、害阻隔。";
  }

  // 合类关系互连
  if (HE_RELS.has(a.title) && HE_RELS.has(b.title)) {
    return "同属合类关系：都是把字绑在一起，只是明暗、深浅、成局与否不同。";
  }

  // 象法方法 -> 关系素材
  if (a.systemId === "xiangfa-rules" && b.systemId === "relations") {
    if (a.title === "合象" && (HE_RELS.has(b.title) || b.title.includes("合"))) return `「合象」是统一解读各种合的取象方法，${b.title}是它的素材之一。`;
    if ((a.title === "字象" || a.title === "倒象") && HARM_RELS.has(b.title)) return `「${a.title}」断字时常借冲破来拆解变形，${b.title}是常用的作用方式。`;
    return `「${a.title}」是取象方法，${b.title}是它常用的作用素材。`;
  }

  // 组合卡 -> 关系类型
  if (a.systemId === "combo-cards" && b.systemId === "relations") {
    if ((HE_RELS.has(b.title) || b.title.includes("合")) && a.title.includes("合")) return `「${a.title}」组合里的『合』可以是${b.title}这一类。`;
    if (b.title === "六冲" && a.title.includes("冲")) return `「${a.title}」组合里的『冲』就是六冲。`;
    if (b.title === "墓库" && (a.title.includes("库") || a.title.includes("墓"))) return `「${a.title}」组合里的『库』就是墓库。`;
  }

  // 资料映射条目（六爻/卦象 -> 八字）
  if (a.systemId === "source-mapping" && a.title.includes(" -> ")) {
    const [src, dst] = a.title.split(" -> ");
    if (GOD_GROUP[b.title] && dst.includes(GOD_GROUP[b.title])) {
      return `六爻资料里的${src}对应八字的${GOD_GROUP[b.title]}，${b.title}属${GOD_GROUP[b.title]}，象义可直接迁移借用。`;
    }
    const el = dst[0];
    if (cb && "木火土金水".includes(el) && (GAN_WUXING[cb] === el || ZHI_WUXING[cb] === el)) {
      return `卦象${src}五行属${el}，与${b.title}同气，可借卦象补充${el}类取象。`;
    }
    return `这是${src}到八字体系的映射条目，与「${b.title}」同走一路象义。`;
  }

  return null;
}

// 从条目原文里摘一句提到对方的话作为证据
function explainByQuote(a, b) {
  const needle = b.title;
  for (const [key, values] of Object.entries(a.branches || {})) {
    if (key.includes(needle)) return `「${a.title}」条目专门有一栏「${key}」讲它。`;
    for (const v of values) {
      const s = String(v);
      if (s.includes(needle) && s !== needle) return `「${a.title}」条目里提到：${s.length > 42 ? s.slice(0, 42) + "…" : s}`;
    }
  }
  for (const r of a.rules || []) {
    if (r.includes(needle)) return `「${a.title}」的判断提醒里提到：${r.length > 42 ? r.slice(0, 42) + "…" : r}`;
  }
  return null;
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

let chartStudyPart = "all";
let chartBookTagFilter = "";

function baziTitle(arr) {
  if (!Array.isArray(arr) || arr.length !== 8) return "未命名命例";
  return PILLARS.map((p, i) => `${p}:${arr[i]}${arr[i + 4]}`).join(" ");
}

function baziKey(arr) {
  return Array.isArray(arr) ? arr.join("") : "";
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeChartBook(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => Array.isArray(item?.bazi) && item.bazi.length === 8)
    .map(item => ({
      id: item.id || uid("chart"),
      title: String(item.title || baziTitle(item.bazi)),
      bazi: item.bazi.slice(0, 8),
      note: String(item.note || ""),
      noteSections: normalizeChartNoteSections(item.noteSections, item.note),
      tags: normalizeTags(item.tags),
      createdAt: Number(item.createdAt || Date.now()),
      updatedAt: Number(item.updatedAt || item.createdAt || Date.now())
    }));
}

function chartBookAll() {
  return normalizeChartBook(storageGet("chartBook", []));
}

const CHART_NOTE_FIELDS = [
  { id: "firstLook", title: "初看共象", hint: "先写最显眼的重复象：财、文书、冲动、桃花、库、关系等。" },
  { id: "evidence", title: "盘中证据", hint: "写证据链：哪个字、哪个宫位、哪个关系/十神支持这个象。" },
  { id: "anti", title: "不能这样断", hint: "写反例和边界：哪些结论现在还不能下。" },
  { id: "trigger", title: "岁运触发", hint: "写可能被岁运补齐、冲开、合动、引动的位置。" },
  { id: "review", title: "复盘结论", hint: "事后补：哪些象应了，哪些误取，为什么。" }
];

function normalizeChartNoteSections(value, legacyNote = "") {
  const out = Object.fromEntries(CHART_NOTE_FIELDS.map(f => [f.id, ""]));
  if (value && typeof value === "object") {
    CHART_NOTE_FIELDS.forEach(f => { out[f.id] = String(value[f.id] || ""); });
  } else if (legacyNote) {
    out.firstLook = String(legacyNote);
  }
  return out;
}

function chartNotePlain(sections) {
  const s = normalizeChartNoteSections(sections);
  return CHART_NOTE_FIELDS
    .map(f => s[f.id] ? `${f.title}：${s[f.id]}` : "")
    .filter(Boolean)
    .join("\n");
}

// 复盘笔记草稿：输入即存，防止排盘页任何重渲染吃掉未保存的内容
function chartNoteDraft() {
  const d = storageGet("chartNoteDraft", null);
  return d && d.chartId ? d : null;
}

function clearChartNoteDraft() {
  storageSet("chartNoteDraft", null);
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map(t => String(t).trim()).filter(Boolean))].slice(0, 12);
}

function parseTags(text) {
  return normalizeTags(String(text || "").split(/[、,，\s]+/));
}

function suggestedChartTags(arr) {
  const tags = new Set();
  const rels = scanRelations(arr);
  const combos = detectCombos(arr);
  const shensha = scanShensha(arr);
  const add = t => { if (t) tags.add(t); };
  combos.forEach(c => {
    if (c.nodeTitle.includes("夫妻宫")) add("感情");
    if (c.nodeTitle.includes("财")) add("财运");
    if (c.nodeTitle.includes("食伤") || c.nodeTitle.includes("印")) add("学业/技能");
    add(c.nodeTitle);
  });
  rels.forEach(r => {
    if (r.palace.includes("日支")) add("夫妻宫");
    if (r.kindLabel === "冲") add("冲");
    if (r.kindLabel === "穿") add("穿");
    if (r.kindLabel === "库") add("库");
  });
  shensha.forEach(s => {
    if (s.name.includes("桃花")) add("桃花");
    if (s.name.includes("驿马")) add("迁移");
    if (s.name.includes("文昌")) add("学业/文书");
    if (s.name.includes("孤") || s.name.includes("寡")) add("感情");
  });
  if (tags.size === 0) add("待复盘");
  return [...tags].slice(0, 8);
}

function currentChartEntry(book, arr) {
  const key = baziKey(arr);
  return book.find(item => baziKey(item.bazi) === key) || null;
}

function chartStudyDeck() {
  const deck = storageGet("chartStudyDeck", null);
  if (!deck || !Array.isArray(deck.ids)) return { ids: [], items: [], title: "", bazi: [], savedAt: 0 };
  const ids = [...new Set(deck.ids)].filter(id => nodeById.has(id));
  const items = Array.isArray(deck.items)
    ? deck.items.filter(x => x && ids.includes(x.id)).map(x => ({ id: x.id, why: String(x.why || ""), source: String(x.source || "") }))
    : ids.map(id => ({ id, why: "", source: "" }));
  return {
    ids,
    items,
    title: String(deck.title || ""),
    bazi: Array.isArray(deck.bazi) ? deck.bazi.slice(0, 8) : [],
    savedAt: Number(deck.savedAt || 0)
  };
}

function chartStudyNodes() {
  const deck = chartStudyDeck();
  return deck.ids.map(id => nodeById.get(id)).filter(Boolean);
}

const CHART_STUDY_PARTS = [
  { id: "all", title: "全部", sources: [] },
  { id: "chars", title: "字本身", sources: ["年干", "月干", "日干", "时干", "年支", "月支", "日支", "时支"] },
  { id: "gods", title: "十神藏干", sources: ["十神", "藏干十神"] },
  { id: "rels", title: "关系组合", sources: ["干支关系", "组合提示"] },
  { id: "marks", title: "神煞纳音", sources: ["神煞", "纳音"] }
];

function chartStudyPartCounts() {
  const deck = chartStudyDeck();
  const counts = Object.fromEntries(CHART_STUDY_PARTS.map(p => [p.id, 0]));
  counts.all = deck.ids.length;
  deck.items.forEach(item => {
    CHART_STUDY_PARTS.slice(1).forEach(part => {
      if (part.sources.some(src => item.source.includes(src))) counts[part.id]++;
    });
  });
  return counts;
}

function chartStudyNodesByPart(partId) {
  const deck = chartStudyDeck();
  if (partId === "all") return chartStudyNodes();
  const part = CHART_STUDY_PARTS.find(p => p.id === partId) || CHART_STUDY_PARTS[0];
  const ids = deck.items
    .filter(item => part.sources.some(src => item.source.includes(src)))
    .map(item => item.id);
  return [...new Set(ids)].map(id => nodeById.get(id)).filter(Boolean);
}

function collectChartStudyItems(bazi) {
  const map = new Map();
  const add = (nodeId, source, why) => {
    if (!nodeId || !nodeById.has(nodeId)) return;
    if (map.has(nodeId)) {
      const old = map.get(nodeId);
      if (source && !old.source.includes(source)) old.source += `、${source}`;
      return;
    }
    map.set(nodeId, { id: nodeId, source, why });
  };

  bazi.forEach((ch, i) => {
    const n = nodeForChar(ch);
    add(n?.id, slotLabel(i), `${slotLabel(i)}见${ch}，先把这个字本身的五行、性情、像法记住。`);
  });

  detectCombos(bazi).forEach(c => add(c.nodeId, "组合提示", c.why));
  scanRelations(bazi).forEach(r => add(r.nodeId, "干支关系", `${r.name}落在${r.pos}：${r.note || r.brief}`));
  scanShensha(bazi).forEach(s => add(s.nodeId, "神煞", `${s.name}落${slotLabel(s.cell.i)}${s.cell.ch}，${s.baseDescs.join("；")}。`));
  scanNayin(bazi).forEach(n => add(n.nodeId, "纳音", `${n.pillar}${n.ganzhi}为${n.name}，先记它的大象。`));

  const dayGan = bazi[2];
  [0, 1, 3].forEach(p => {
    const god = tenGod(dayGan, bazi[p]);
    const n = nodeByTitle.get(god);
    add(n?.id, "十神", `${PILLARS[p]}干${bazi[p]}对日主${dayGan}为${god}。`);
  });
  [4, 5, 6, 7].forEach(i => (CANG_GAN[bazi[i]] || []).forEach(hg => {
    const god = tenGod(dayGan, hg);
    const n = nodeByTitle.get(god);
    add(n?.id, "藏干十神", `${slotLabel(i)}${bazi[i]}藏${hg}，对日主${dayGan}为${god}。`);
  }));

  return [...map.values()];
}

function chartExportSnapshot(arr) {
  const items = collectChartStudyItems(arr);
  return {
    title: baziTitle(arr),
    studyItems: items.map(item => {
      const n = nodeById.get(item.id);
      return {
        id: item.id,
        title: n?.title || item.id,
        system: n?.systemTitle || "",
        source: item.source,
        why: item.why
      };
    })
  };
}

function chartPathSteps(bazi, season, combos, rels, shensha, nayin, luckInfo) {
  const dayGan = bazi[2], dayZhi = bazi[6], monthZhi = bazi[5];
  const day = `${dayGan}${dayZhi}`;
  const dayRoot = (CANG_GAN[dayZhi] || []).includes(dayGan);
  const sameWxZhi = [4, 5, 6, 7].filter(i => ZHI_WUXING[bazi[i]] === GAN_WUXING[dayGan]).map(i => `${slotLabel(i)}${bazi[i]}`);
  const ganHeTargets = [0, 1, 3].map(i => {
    const heEl = GAN_HE[dayGan + bazi[i]] || GAN_HE[bazi[i] + dayGan];
    return heEl ? `${PILLARS[i]}干${bazi[i]}五合${heEl}` : "";
  }).filter(Boolean);
  const dayProduces = [0, 1, 3].map(i => {
    const god = tenGod(dayGan, bazi[i]);
    return ["食神", "伤官", "正财", "偏财", "正官", "七杀", "正印", "偏印"].includes(god) ? `${PILLARS[i]}干${bazi[i]}为${god}` : "";
  }).filter(Boolean);
  const relTxt = rels.slice(0, 4).map(r => r.name).join("、") || "未扫到明显合冲刑穿破绝";
  const comboTxt = combos.slice(0, 3).map(c => c.nodeTitle).join("、") || "暂未扫到高频组合卡";
  const ssTxt = shensha.slice(0, 3).map(s => `${s.name}在${slotLabel(s.cell.i)}`).join("、");
  const nyTxt = nayin.filter(n => n.name).slice(0, 2).map(n => `${n.pillar}${n.name}`).join("、");
  const supplement = [ssTxt && `神煞：${ssTxt}`, nyTxt && `纳音：${nyTxt}`].filter(Boolean).join("；") || "神煞、纳音可作为补像，不单独定吉凶";
  return [
    {
      title: "1. 日干天元先入命",
      body: `先锁定日干${dayGan}，日柱${day}，所有十神、生克、喜忌都围绕这个“我”展开。`
    },
    {
      title: "2. 干支虚实定状态",
      body: `${dayGan}坐${dayZhi}${dayRoot ? "，日支藏干见日干，先按有根承载看" : "，日支不藏日干，先留意是否虚透或借根"}；同五行地支${sameWxZhi.length ? `见${sameWxZhi.join("、")}` : "暂未明显出现"}。${season ? `月令${monthZhi}为${season.season}，${season.wang}。` : ""}`
    },
    {
      title: "3. 十干喜忌判吉凶",
      body: "在状态基础上再判喜忌：先看月令气候、通根虚实、全局生克泄耗。网站提示气候和关系，但喜忌要按本体系十干喜忌法则综合，不用冷冰冰分数。"
    },
    {
      title: "4. 干支意向定方向",
      body: `${ganHeTargets.length ? `日干相关合象：${ganHeTargets.join("、")}。` : "日干未见明显天干五合。"}${dayProduces.length ? `十神牵引：${dayProduces.join("、")}。` : "外透十神牵引暂不明显。"}用它判断求财、求贵、求技术、求精神等人生意向。`
    },
    {
      title: "5. 十神格局看事情",
      body: `组合提示：${comboTxt}。点进组合卡看成立条件、不成立条件和不能这样断，先定事情领域，再落到人事。`
    },
    {
      title: "6. 作用方式定性质",
      body: `作用关系：${relTxt}。合、冲、刑、穿、绝、破、伏吟、反吟决定事件性质；同一十神遇不同作用，结果完全不同。`
    },
    {
      title: "7. 宫位大运限阶段",
      body: "把上面的象落回年、月、日、时：年看根基早年，月看父母平台，日看自身贴身，时看结果晚年；再配大限和大运，定位人生阶段。"
    },
    {
      title: "8. 大运流年定应期",
      body: (() => {
        const units = luckInfo?.units || [];
        const items = luckInfo?.items || [];
        if (!units.length) return `原局未清不推应期。原局主线清楚后，在下方「岁运应象」叠上大运/流年干支，看哪条组合被引动。${supplement}。`;
        const desc = units.map(u => `${u.name}${u.gan}${u.zhi}`).join("、");
        if (!items.length) return `当前叠加${desc}：与原局没有扫到明显冲合刑穿破绝，先按平运看，主题回到岁运干的十神。${supplement}。`;
        return `当前叠加${desc}：引动 ${items.slice(0, 3).map(x => x.name).join("、")}${items.length > 3 ? ` 等 ${items.length} 条` : ""}。原局主线清楚后，这些就是应期入口，详见「岁运应象」。${supplement}。`;
      })()
    }
  ];
}

/* ---------- 学习（间隔复习） ---------- */
const SRS_IVL_DAYS = [0.5, 1, 3, 7, 15, 30];

function srsAll() { return storageGet("srs", {}); }

function scopeNodes(scope) {
  if (scope === "chart-current") return chartStudyNodesByPart(chartStudyPart);
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

/* ---------- 学习出题（选择题，全部由 data.js 生成） ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(arr, n, exclude = new Set()) {
  const pool = [...new Set(arr)].filter(x => !exclude.has(x));
  return shuffle(pool).slice(0, n);
}

// 一个节点里出现过的所有词，用来排除“其实也对”的干扰项
function nodeWordSet(node) {
  const set = new Set([node.title, node.type]);
  (node.core || []).forEach(w => set.add(w));
  Object.values(node.branches || {}).forEach(vs => vs.forEach(v => set.add(String(v))));
  (node.rules || []).forEach(r => set.add(r));
  (node.relations || []).forEach(r => set.add(r));
  return set;
}

// 地支关系题库：从关系表生成 (甲,乙,关系名,对应词条)
function relQuizPool() {
  const pool = [];
  const chongSeen = new Set();
  Object.entries(ZHI_CHONG).forEach(([a, b]) => {
    const key = [a, b].sort().join("");
    if (chongSeen.has(key)) return;
    chongSeen.add(key);
    pool.push({ a, b, label: "六冲", node: "六冲" });
  });
  Object.keys(ZHI_LIUHE).forEach(k => pool.push({ a: k[0], b: k[1], label: "六合", node: "地支六合" }));
  CHUAN_SHENG.concat(CHUAN_KE).forEach(k => pool.push({ a: k[0], b: k[1], label: "相穿", node: "穿" }));
  PO_PAIRS.forEach(k => pool.push({ a: k[0], b: k[1], label: "相破", node: "六破" }));
  ANHE_PAIRS.forEach(k => pool.push({ a: k[0], b: k[1], label: "暗合", node: "暗合" }));
  JUE_PAIRS.forEach(k => pool.push({ a: k[0], b: k[1], label: "相绝", node: "绝" }));
  SANHE.forEach(([s, z, m]) => pool.push({ a: s, b: m, label: "拱合", node: "地支三合" }));
  return pool;
}
const REL_LABELS = ["六冲", "六合", "拱合", "相穿", "相破", "暗合", "相绝"];

function makeQuizQuestion(scope) {
  const pool = scopeNodes(scope);
  if (!pool.length) return null;
  const relOk = scope === "all" || scope === "relations" || scope === "branches";

  // 约 1/3 概率出地支关系题
  if (relOk && Math.random() < 0.34) {
    const q = relQuizPool()[Math.floor(Math.random() * relQuizPool().length)];
    const node = nodeByTitle.get(q.node);
    const distract = sample(REL_LABELS, 3, new Set([q.label]));
    const options = shuffle([{ text: q.label, correct: true }, ...distract.map(t => ({ text: t, correct: false }))]);
    return {
      kind: "rel",
      nodeId: node?.id || null,
      prompt: `地支「${q.a}」和「${q.b}」之间是什么关系？`,
      options,
      why: `${q.a}${q.b}${q.label}。${node ? nodePlain(node) : ""}`
    };
  }

  const node = pickStudyNode(scope, null);
  if (!node) return null;
  const cores = (node.core || []).filter(Boolean);
  const canReverse = cores.length >= 3;

  // 象→词：给核心象，猜词条名
  if (canReverse && Math.random() < 0.5) {
    const sig = shuffle(cores).slice(0, 4);
    const sameSys = pool.filter(n => n.id !== node.id).map(n => n.title);
    const others = sample(sameSys.length >= 3 ? sameSys : nodes.map(n => n.title), 3, new Set([node.title]));
    const options = shuffle([{ text: node.title, correct: true }, ...others.map(t => ({ text: t, correct: false }))]);
    return {
      kind: "toTitle",
      nodeId: node.id,
      prompt: `“${sig.join("、")}” 说的是哪个词条？`,
      options,
      why: `${node.title}（${node.systemTitle}）：${nodePlain(node)}`
    };
  }

  // 词→象：给词条名，选正确的核心象义
  const correct = cores.length ? cores[Math.floor(Math.random() * Math.min(cores.length, 4))] : node.title;
  const own = nodeWordSet(node);
  const distractPool = [];
  (pool.length >= 8 ? pool : nodes).forEach(n => {
    if (n.id === node.id) return;
    (n.core || []).forEach(c => { if (c.length <= 5 && !own.has(c)) distractPool.push(c); });
  });
  const distract = sample(distractPool, 3, new Set([correct]));
  if (distract.length < 3) return makeQuizQuestion(scope); // 干扰项不足，换一题
  const options = shuffle([{ text: correct, correct: true }, ...distract.map(t => ({ text: t, correct: false }))]);
  return {
    kind: "toCore",
    nodeId: node.id,
    prompt: `「${node.title}」最核心的象义，下面哪个对？`,
    options,
    why: `${node.title}：${nodePlain(node)}`
  };
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
    luckGrid: document.querySelector("#luckGrid"),
    charPicker: document.querySelector("#charPicker"),
    quizMode: document.querySelector("#quizMode"),
    resetBazi: document.querySelector("#resetBazi"),
    chartBook: document.querySelector("#chartBook"),
    chartAnalysis: document.querySelector("#chartAnalysis"),
    studyMode: document.querySelector("#studyMode"),
    dailyStudy: document.querySelector("#dailyStudy"),
    studyScope: document.querySelector("#studyScope"),
    chartStudyFilter: document.querySelector("#chartStudyFilter"),
    studyStats: document.querySelector("#studyStats"),
    studyCard: document.querySelector("#studyCard"),
    systemTabs: document.querySelector("#systemTabs"),
    systemDesc: document.querySelector("#systemDesc"),
    libraryNodes: document.querySelector("#libraryNodes"),
    detailBack: document.querySelector("#detailBack"),
    detailCard: document.querySelector("#detailCard")
  };

  const QUICK_TERMS = ["文书", "财富", "竞争", "表达", "规则", "母亲", "财库", "冲", "合", "穿", "纳音"];
  const CHANGELOG = [
    ["26.7.11", "🗓️ 大运流年叠加上线——排盘页选岁运干支，自动扫引动：冲提纲、穿夫妻宫、补齐三刑、填实拱位、开财库、岁运并临，八步第8步直接报应期入口"],
    ["26.7.11", "🕸️ 象义树孤岛清零——财富载体、干支虚实、时柱接入关系网，新增26条连线全部配好理由"],
    ["26.7.11", "🛟 复盘笔记防丢——输入即存草稿，点盘、选字、切模式都不会吃掉没保存的笔记"],
    ["26.7.9", "📖 进阶资料补充——吸收财运、合象三分、干支互通带象、墓库、空亡神煞等边界口径"],
    ["26.7.9", "🎯 学习页去主观自评——默认客观测验，掌握度只按答题对错更新；解析模式不再出现自评按钮"],
    ["26.7.9", "🧭 排盘取象路径改按八步入命法——日干天元、虚实状态、十干喜忌、意向、格局、作用、宫位大运、岁运应期"],
    ["26.7.9", "🧹 全站口径审校——统一六合/暗合、子卯破刑、六害穿、三合成局与绝暗合重叠说明"],
    ["26.7.9", "📚 PDF 笔记口径校准——以八初中/八高/八公材料为主，补三合破局、生克穿、墓库大限和反例提醒"],
    ["26.7.9", "⚑ 搜索加反例优先——先看不能这样断、反例、不成立条件，再看常规象义"],
    ["26.7.9", "🏷️ 命例本加标签筛选——自动建议感情、财运、冲、穿、桃花等标签，导入导出保留"],
    ["26.7.9", "📌 高频词条补小案例——财库、伤官见官、桃花、夫妻宫等加正例、反例、变体"],
    ["26.7.9", "🔎 搜索加同象不同源——把十神、组合、关系、神煞、纳音、宫位来源分开解释"],
    ["26.7.9", "🧾 命例笔记模板化——按初看共象、盘中证据、不能这样断、岁运触发、复盘结论记录"],
    ["26.7.9", "🧭 排盘加取象路径和学习路线——后续已按八步入命法重排，不再用泛化断盘顺序"],
    ["26.7.9", "🕸️ 共象搜索联动象义树——搜到一批词条后可直接在树上高亮命中，看它们分布和连线"],
    ["26.7.9", "📴 PWA 离线缓存——手机添加到主屏幕后可离线打开，联网时仍优先拉新版本"],
    ["26.7.9", "🌿 排盘补月令提纲与纳音逐柱——先看季节气候，再分年/月/日/时纳音各应什么位置"],
    ["26.7.9", "🔍 排盘结果补“为什么扫到”——关系、神煞、纳音、十神藏干都加检测理由，不只给结论"],
    ["26.7.9", "📦 命例本导出带盘中象快照——每个命例导出时附学习点、来源和入组理由"],
    ["26.7.9", "🧩 十神组合细化成立/不成立条件——官印相生、伤官见官、食神制杀、财破印、比劫夺财更好分辨"],
    ["26.7.9", "🧭 盘中象可分组复习——按字本身、十神藏干、关系组合、神煞纳音拆开刷，先抓一类象再扩展"],
    ["26.7.9", "📝 命例本升级研究笔记——每个已保存八字盘可记录自断、重点共象和复盘结论，导入导出会一起保留"],
    ["26.7.9", "⚠️ 补「不能这样断」反例——伤官见官、财库、桃花、夫妻宫等高频误断点加新手防误用提醒"],
    ["26.7.9", "📚 排盘和学习打通——盘里扫到的天干地支、十神、关系、神煞、纳音可一键加入「盘中象」卡组"],
    ["26.7.9", "🗂️ 命例本上线——可保存多个八字盘，随时载入复盘，并支持 JSON 导入导出"],
    ["26.7.8", "🌳 象义树取象路径——点两个词看最短取象链，逐跳说清为什么这么串；关掉路径回到起点那个字的连线态"],
    ["26.7.8", "🎯 学习加「答题」模式——由词选象 / 由象猜词 / 地支关系判断三种题，答对答错自动喂间隔复习"],
    ["26.7.8", "🧩 排盘加「组合提示」——自动识别印+财、伤官见官、食神制杀、财入库、穿夫妻宫等组合，点进组合卡"],
    ["26.7.8", "🔤 排盘天干候选改每行5个（甲乙丙丁戊 / 己庚辛壬癸），排版更齐"],
    ["26.7.8", "🐛 修复戊土/午火 id 撞车——以前点戊土会误开午火、共享复习记录"],
    ["26.7.8", "🔗 象义树352条连线全部标注理由——为什么杨柳木连着午火、未土，一看就懂"],
    ["26.7.8", "🌌 象义树上线——131个词条织成发光关系网，点谁亮谁、双指缩放、按体系聚焦"],
    ["26.7.7", "📱 手机版整体重做——共象聚合查询 / 点选八字自动解盘 / 学习复习 / 体系图鉴"]
  ];
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
  let luck = storageGet("luck", ["", "", "", ""]);
  if (!Array.isArray(luck) || luck.length !== 4) luck = ["", "", "", ""];
  let selectedSlot = 0;
  let quizOn = storageGet("quiz", false);
  let quizRevealed = { rel: false, ss: false };
  let antiFirst = storageGet("antiFirst", false);
  let studyScope = storageGet("studyScope", "all");
  if (studyScope === "chart-current" && !chartStudyDeck().ids.length) studyScope = "all";
  chartStudyPart = storageGet("chartStudyPart", "all");
  if (!CHART_STUDY_PARTS.some(p => p.id === chartStudyPart)) chartStudyPart = "all";
  let studyNodeId = null;
  let studyMode = storageGet("studyMode", "quiz"); // quiz | explain
  if (studyMode === "flip" || !["quiz", "explain"].includes(studyMode)) {
    studyMode = "quiz";
    storageSet("studyMode", studyMode);
  }
  let currentQuiz = null;
  let quizChosen = -1;
  let activeSystemId = graph.systems[0]?.id;
  let detailStack = [];
  const viewScroll = {};
  let currentViewKey = null;
  try { history.scrollRestoration = "manual"; } catch { /* 忽略 */ }

  function getViewKey(view) {
    return view === "detail" ? `detail:${detailStack[detailStack.length - 1] || ""}` : `tab:${view}`;
  }

  function restoreViewScroll(key) {
    const top = viewScroll[key] || 0;
    const restore = () => window.scrollTo({ top, left: 0, behavior: "auto" });
    restore();
    requestAnimationFrame(() => { restore(); requestAnimationFrame(restore); });
  }

  /* ---- 视图切换 ---- */
  function showView(view) {
    if (currentViewKey) viewScroll[currentViewKey] = window.scrollY;
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === `view-${view}`));
    document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.toggle("active", b.dataset.view === (view === "detail" ? activeTab : view)));
    el.topHint.textContent = HINTS[view] || "";
    currentViewKey = getViewKey(view);
    restoreViewScroll(currentViewKey);
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
    const { node, evidence, anti } = result;
    const matchLines = (evidence || [])
      .filter(e => e.label !== "词条名")
      .map(e => `<p class="match-line"><b>${escapeHtml(e.label)}</b>${highlight(e.text, terms)}</p>`)
      .join("");
    const antiLines = (anti || []).map(e =>
      `<p class="anti-line"><b>${escapeHtml(e.label)}</b>${highlight(e.text, terms)}</p>`
    ).join("");
    return `
      <button class="node-card" type="button" data-open-node="${escapeHtml(node.id)}">
        <div class="node-title-row">
          <strong>${terms ? highlight(node.title, terms) : escapeHtml(node.title)}</strong>
          <span class="type-pill">${escapeHtml(node.type)}</span>
          <span class="sys-pill">${escapeHtml(node.systemTitle)}</span>
        </div>
        <div class="core-row">${(node.core || []).slice(0, 5).map(c => `<span>${terms ? highlight(c, terms) : escapeHtml(c)}</span>`).join("")}</div>
        ${antiLines ? `<div class="anti-lines">${antiLines}</div>` : ""}
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
          <button class="home-entry" type="button" data-entry="study"><span class="entry-badge">学</span><span><strong>今天测一组</strong><p>用选择题检验，不靠主观自评判断会不会</p></span></button>
        </div>
        <div class="dev-log">
          <div class="dev-log-head">开发时间节点</div>
          <div class="dev-log-list">
            ${CHANGELOG.map(([d, t]) => `<div class="dev-log-row"><span class="dev-log-date">${escapeHtml(d)}</span><span class="dev-log-text">${escapeHtml(t)}</span></div>`).join("")}
          </div>
        </div>`;
      return;
    }
    const terms = query.split(/\s+/).filter(Boolean);
    let results = searchNodes(query);
    if (!results.length) {
      el.searchBody.innerHTML = `<div class="empty-card">没有找到「${escapeHtml(query)}」。换个说法试试，比如“文书”“财库”“子午冲”。</div>`;
      return;
    }
    if (antiFirst) results = applyAntiFirst(results, terms);
    const summary = overlapSummary(results, terms);
    const antiCount = results.filter(r => r.anti?.length).length;
    const antiToggleHtml = `
      <label class="anti-toggle">
        <input type="checkbox" data-anti-first ${antiFirst ? "checked" : ""} />
        <span>反例优先</span>
        <small>${antiFirst ? `已优先显示 ${antiCount} 条有边界提醒的词条` : "先看不能这样断、反例、不成立条件"}</small>
      </label>`;
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
          <button type="button" class="tree-search-btn" data-tree-search="${escapeHtml(query)}">在象义树看这批命中 →</button>
        </div>`;
    }
    const compare = sourceCompare(results, query);
    const compareHtml = compare.length >= 2 ? `
      <div class="source-compare-card">
        <h3>同象不同源</h3>
        ${compare.map(group => `
          <div class="source-compare-row">
            <strong>${escapeHtml(group.title)}</strong>
            <p>${escapeHtml(group.why)}</p>
            <div>${group.hits.map(t => `<button type="button" data-quick="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}</div>
          </div>`).join("")}
      </div>` : "";
    el.searchBody.innerHTML = antiToggleHtml + overlapHtml + compareHtml + results.map(r => nodeCardHtml(r, terms)).join("");
  }

  /* ---- 排盘页 ---- */
  function renderChart() {
    renderChartBook();
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

    // 岁运叠加格（槽位 8-11）
    const luckCells = LUCK_SLOT_LABELS.map((lab, k) => {
      const i = 8 + k;
      const ch = luck[k];
      const wx = ch ? (k % 2 === 0 ? GAN_WUXING[ch] : ZHI_WUXING[ch]) : "";
      const sub = !ch ? "" : (k % 2 === 0 ? tenGod(bazi[2], ch) : (CANG_GAN[ch] || []).join(" "));
      return `
        <button type="button" class="bazi-cell luck-cell ${selectedSlot === i ? "active" : ""} ${ch ? "" : "empty"}" data-slot="${i}">
          <span class="slot">${lab}</span>
          <span class="char ${ch ? "wx-" + wx : ""}">${escapeHtml(ch || "＋")}</span>
          <span class="god">${escapeHtml(sub)}</span>
        </button>`;
    }).join("");
    el.luckGrid.innerHTML = `
      <div class="luck-head">
        <strong>岁运叠加</strong>
        <span>选大运/流年，看引动与应期</span>
        ${luck.some(Boolean) ? `<button type="button" class="ghost-btn" data-luck-clear>清空</button>` : ""}
      </div>
      <div class="luck-cells">${luckCells}</div>`;

    const isLuck = selectedSlot >= 8;
    const isGan = isLuck ? selectedSlot % 2 === 0 : selectedSlot < 4;
    const pool = isGan ? GAN : ZHI;
    const pillarGan = isLuck ? luck[selectedSlot - 9] : bazi[selectedSlot % 4];
    const curChar = isLuck ? luck[selectedSlot - 8] : bazi[selectedSlot];
    let hint = "";
    if (!isGan && pillarGan) {
      hint = `<p class="picker-hint">正选 ${slotLabel(selectedSlot)}。提示：真实${isLuck ? "干支" : "八字"}里阳干配阳支、阴干配阴支（本柱天干为${escapeHtml(pillarGan)}）。</p>`;
    } else {
      hint = `<p class="picker-hint">正选 ${slotLabel(selectedSlot)}。</p>`;
    }
    // 天干10字每行5个（甲乙丙丁戊 / 己庚辛壬癸），地支12字每行6个
    el.charPicker.className = "char-picker " + (isGan ? "cols-5" : "cols-6");
    const clearBtn = isLuck ? `<button type="button" class="picker-none ${curChar ? "" : "active"}" data-char="">不选</button>` : "";
    el.charPicker.innerHTML = hint + clearBtn + pool.map(ch => {
      const dim = !isGan && pillarGan && (GAN_IDX[pillarGan] % 2) !== (ZHI_IDX[ch] % 2);
      return `<button type="button" class="${curChar === ch ? "active" : ""} ${dim ? "dim" : ""}" data-char="${ch}">${ch}</button>`;
    }).join("");

    el.quizMode.checked = !!quizOn;
    renderAnalysis();
  }

  function renderChartBook() {
    const book = chartBookAll();
    const currentKey = baziKey(bazi);
    const current = currentChartEntry(book, bazi);
    const allTags = [...new Set(book.flatMap(item => item.tags || []))].slice(0, 18);
    if (chartBookTagFilter && !allTags.includes(chartBookTagFilter)) chartBookTagFilter = "";
    const visibleBook = chartBookTagFilter ? book.filter(item => (item.tags || []).includes(chartBookTagFilter)) : book;
    const rows = visibleBook.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10).map(item => `
      <div class="chart-book-row ${baziKey(item.bazi) === currentKey ? "active" : ""}">
        <button type="button" data-load-chart="${escapeHtml(item.id)}">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(baziTitle(item.bazi))}</span>
          ${(item.tags || []).length ? `<em>${item.tags.map(t => `#${escapeHtml(t)}`).join(" ")}</em>` : ""}
        </button>
        <button type="button" class="chart-book-del" data-delete-chart="${escapeHtml(item.id)}" aria-label="删除命例">删</button>
      </div>`).join("");
    el.chartBook.innerHTML = `
      <div class="chart-book-head">
        <strong>命例本</strong>
        <span>${book.length ? `${book.length} 个命例` : "先保存当前盘，之后可反复载入"}</span>
      </div>
      <div class="chart-book-actions">
        <button type="button" data-save-chart>保存当前盘</button>
        <button type="button" data-export-charts ${book.length ? "" : "disabled"}>导出</button>
        <button type="button" data-import-charts>导入</button>
      </div>
      ${allTags.length ? `
        <div class="chart-tag-filter">
          <button type="button" class="${chartBookTagFilter ? "" : "active"}" data-chart-tag-filter="">全部</button>
          ${allTags.map(tag => `<button type="button" class="${chartBookTagFilter === tag ? "active" : ""}" data-chart-tag-filter="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join("")}
        </div>` : ""}
      ${current ? (() => {
        const draft = chartNoteDraft();
        const useDraft = draft && draft.chartId === current.id;
        const tagsValue = useDraft ? String(draft.tags || "") : (current.tags || []).join("、");
        return `
        <div class="chart-note-box" data-chart-note-draft-for="${escapeHtml(current.id)}">
          <div class="chart-note-title">命例复盘模板</div>
          <label for="chartTags">标签</label>
          <input id="chartTags" class="chart-tags-input" data-chart-tags-input value="${escapeHtml(tagsValue)}" placeholder="感情、财运、冲、桃花；用顿号或逗号分隔" />
          <div class="chart-tag-suggest">
            <span>建议</span>
            ${suggestedChartTags(bazi).map(tag => `<button type="button" data-add-chart-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join("")}
          </div>
          ${CHART_NOTE_FIELDS.map(field => `
            <label for="chartNote_${escapeHtml(field.id)}">${escapeHtml(field.title)}</label>
            <textarea id="chartNote_${escapeHtml(field.id)}" data-chart-note-field="${escapeHtml(field.id)}" rows="2" placeholder="${escapeHtml(field.hint)}">${escapeHtml(useDraft ? String(draft.sections?.[field.id] || "") : (current.noteSections?.[field.id] || ""))}</textarea>
          `).join("")}
          <div class="chart-note-save-row">
            <button type="button" data-save-chart-note="${escapeHtml(current.id)}">保存笔记</button>
            ${useDraft ? `<span class="chart-note-draft-hint">草稿已自动保留，点保存才写进命例</span>` : ""}
          </div>
        </div>`;
      })() : ""}
      ${rows ? `<div class="chart-book-list">${rows}</div>` : ""}`;
  }

  function relCardHtml(item) {
    return `
      <button class="rel-card ${item.kindClass}" type="button" ${item.nodeId ? `data-open-node="${escapeHtml(item.nodeId)}"` : ""}>
        <div class="rel-title"><strong>${escapeHtml(item.name)}</strong><span class="rel-kind">${escapeHtml(item.kindLabel)}</span></div>
        <p class="rel-pos">${escapeHtml(item.pos)}</p>
        <p class="rel-brief">${escapeHtml(item.brief)}</p>
        ${item.scanWhy ? `<p class="scan-why">为什么扫到：${escapeHtml(item.scanWhy)}</p>` : ""}
        ${item.note ? `<p class="rel-brief">${escapeHtml(item.note)}</p>` : ""}
        <p class="rel-palace">${escapeHtml(item.palace)}</p>
        ${item.nodeId ? `<p class="rel-more">点开看「${escapeHtml(item.nodeTitle)}」完整象义 →</p>` : ""}
      </button>`;
  }

  function renderAnalysis() {
    const rels = scanRelations(bazi);
    const shensha = scanShensha(bazi);
    const nayin = scanNayin(bazi);
    const combos = detectCombos(bazi);
    const season = monthSeasonInfo(bazi);
    const chartStudyItems = collectChartStudyItems(bazi);
    const luckItems = scanLuck(bazi, luck);
    const luckThemes = luckGodThemes(bazi, luck);
    const luckUnitsArr = luckUnits(luck);
    const pathSteps = chartPathSteps(bazi, season, combos, rels, shensha, nayin, { units: luckUnitsArr, items: luckItems });
    const savedDeck = chartStudyDeck();
    const currentDeckKey = chartStudyItems.map(x => x.id).sort().join("|");
    const savedDeckKey = savedDeck.ids.slice().sort().join("|");
    const isSavedDeck = baziKey(savedDeck.bazi) === baziKey(bazi) && savedDeckKey === currentDeckKey;
    const sourceSummary = [...new Set(chartStudyItems.map(x => x.source).filter(Boolean))].slice(0, 6).join("、");

    const relBody = quizOn && !quizRevealed.rel
      ? `<button class="reveal-btn" type="button" data-reveal="rel">先自己找：盘里哪些字在冲、合、穿、破、刑？想好了点这里揭晓 ${rels.length} 条</button>`
      : (rels.length ? rels.map(relCardHtml).join("") : `<div class="empty-card">这个盘里暂时没扫到干支关系。</div>`);

    const ssCards = shensha.map(s => `
      <button class="info-row" type="button" ${s.nodeId ? `data-open-node="${escapeHtml(s.nodeId)}"` : ""}>
        <div class="row-line"><strong>${escapeHtml(s.name)}</strong><span class="where">${escapeHtml(slotLabel(s.cell.i))}${escapeHtml(s.cell.ch)} · ${escapeHtml(s.baseDescs.join("；"))}</span></div>
        <p class="brief">${escapeHtml(nodePlain(nodeByTitle.get(s.nodeTitle)))}</p>
        <p class="scan-why">为什么扫到：${escapeHtml(s.scanWhy || s.baseDescs.join("；"))}</p>
      </button>`).join("");
    const ssBody = quizOn && !quizRevealed.ss
      ? `<button class="reveal-btn" type="button" data-reveal="ss">先自己找：桃花、驿马、贵人、空亡都落在哪？点这里揭晓 ${shensha.length} 个</button>`
      : (ssCards || `<div class="empty-card">这个盘里没扫到常用神煞。</div>`);

    const nayinBody = nayin.map(n => `
      <button class="info-row" type="button" ${n.nodeId ? `data-open-node="${escapeHtml(n.nodeId)}"` : ""}>
        <div class="row-line"><strong>${escapeHtml(n.pillar)} ${escapeHtml(n.ganzhi)}</strong><span class="where">${n.name ? escapeHtml(n.name) : "干支阴阳不匹配，无纳音"}</span></div>
        ${n.name ? `<p class="brief">${escapeHtml(n.brief)}</p>` : ""}
        <p class="scan-why">为什么扫到：${escapeHtml(n.scanWhy)}</p>
        <p class="scan-why">逐柱取象：${escapeHtml(nayinPillarUse(n.pillar))}</p>
      </button>`).join("");

    const godRows = [0, 1, 3].map(p => {
      const god = tenGod(bazi[2], bazi[p]);
      const gNode = nodeByTitle.get(god);
      return `
        <div class="god-row">
          <span class="pos-label">${PILLARS[p]}干</span>
          <span class="big-char wx-${GAN_WUXING[bazi[p]]}">${escapeHtml(bazi[p])}</span>
          <button type="button" class="god-link" ${gNode ? `data-open-node="${escapeHtml(gNode.id)}"` : ""}>${escapeHtml(god)}</button>
          <span class="god-why">日主${escapeHtml(bazi[2])}看${escapeHtml(bazi[p])}为${escapeHtml(god)}</span>
        </div>`;
    }).join("");
    const hiddenRows = [4, 5, 6, 7].map(i => {
      const ch = bazi[i];
      const parts = (CANG_GAN[ch] || []).map(hg => {
        const god = tenGod(bazi[2], hg);
        const gNode = nodeByTitle.get(god);
        return `<span>${escapeHtml(hg)}</span><button type="button" class="god-link" ${gNode ? `data-open-node="${escapeHtml(gNode.id)}"` : ""}>${escapeHtml(god)}</button>`;
      }).join("");
      const whyParts = (CANG_GAN[ch] || []).map(hg => `${hg}为${tenGod(bazi[2], hg)}`).join("、");
      return `
        <div class="god-row">
          <span class="pos-label">${slotLabel(i)}</span>
          <span class="big-char wx-${ZHI_WUXING[ch]}">${escapeHtml(ch)}</span>
          <span class="hidden-gods">藏 ${parts}</span>
          <span class="god-why">${escapeHtml(ch)}藏干：${escapeHtml(whyParts)}</span>
        </div>`;
    }).join("");

    const comboBody = combos.map(c => `
      <button class="combo-row" type="button" data-open-node="${escapeHtml(c.nodeId)}">
        <div class="row-line"><strong>${escapeHtml(c.nodeTitle)}</strong><span class="combo-go">看组合卡 →</span></div>
        <p class="brief">${escapeHtml(c.why)}</p>
      </button>`).join("");
    const comboSection = combos.length ? `
      <section class="ana-section">
        <div class="ana-head"><h3>组合提示</h3><span class="ana-count">${combos.length} 组</span></div>
        ${comboBody}
      </section>` : "";
    const luckSection = luckUnitsArr.length ? `
      <section class="ana-section luck-section">
        <div class="ana-head"><h3>岁运应象</h3><span class="ana-count">${luckUnitsArr.map(u => u.name + u.gan + u.zhi).join(" ")} · ${luckItems.length} 条</span></div>
        ${luckThemes.map(t => `
          <button class="info-row" type="button" ${t.nodeId ? `data-open-node="${escapeHtml(t.nodeId)}"` : ""}>
            <div class="row-line"><strong>${escapeHtml(t.name)}干${escapeHtml(t.gan)}为${escapeHtml(t.god)}</strong><span class="where">这${t.name === "大运" ? "步运" : "一年"}的主题字</span></div>
            <p class="brief">${escapeHtml(t.brief)}</p>
          </button>`).join("")}
        ${luckItems.length ? luckItems.map(relCardHtml).join("") : `<div class="empty-card">岁运与原局没有扫到明显冲合刑穿破绝，先按平运平年看，主题回到岁运干的十神。</div>`}
      </section>` : "";
    const studyDeckSection = `
      <div class="chart-study-box">
        <div>
          <strong>盘中象学习卡组</strong>
          <p>本盘扫到 ${chartStudyItems.length} 个可复习词条：${escapeHtml(sourceSummary || "天干地支、十神、关系、神煞、纳音")}</p>
        </div>
        <div class="chart-study-actions">
          <button type="button" data-add-chart-study>${isSavedDeck ? "更新卡组" : "加入学"}</button>
          <button type="button" data-go-chart-study ${isSavedDeck ? "" : "disabled"}>去复习</button>
        </div>
        <div class="study-route-actions">
          <span>建议路线</span>
          <button type="button" data-go-chart-study-part="chars" ${isSavedDeck ? "" : "disabled"}>字本身</button>
          <button type="button" data-go-chart-study-part="gods" ${isSavedDeck ? "" : "disabled"}>十神藏干</button>
          <button type="button" data-go-chart-study-part="rels" ${isSavedDeck ? "" : "disabled"}>关系组合</button>
          <button type="button" data-go-chart-study-part="marks" ${isSavedDeck ? "" : "disabled"}>神煞纳音</button>
        </div>
      </div>`;
    const pathSection = `
      <section class="ana-section">
        <div class="ana-head"><h3>八步入命法</h3><span class="ana-count">按八字笔记顺序断，不跳步</span></div>
        <div class="chart-path-list">
          ${pathSteps.map(step => `
            <div class="chart-path-step">
              <strong>${escapeHtml(step.title)}</strong>
              <p>${escapeHtml(step.body)}</p>
            </div>`).join("")}
        </div>
      </section>`;
    const seasonSection = season ? `
      <section class="ana-section">
        <div class="ana-head"><h3>月令提纲</h3><span class="ana-count">${escapeHtml(season.month)}月 · ${escapeHtml(season.name)}</span></div>
        <button class="info-row season-row" type="button" ${season.nodeId ? `data-open-node="${escapeHtml(season.nodeId)}"` : ""}>
          <div class="row-line"><strong>${escapeHtml(season.season)}</strong><span class="where">${escapeHtml(season.wang)}</span></div>
          <p class="brief">${escapeHtml(season.hint)}</p>
          <p class="scan-why">为什么先看月令：月支是全局气候，决定五行得令与否；同一个字在不同季节，力量和应象会变。</p>
          ${season.plain ? `<p class="scan-why">本月支字象：${escapeHtml(season.plain)}</p>` : ""}
        </button>
      </section>` : "";

    el.chartAnalysis.innerHTML = `
      ${studyDeckSection}
      ${pathSection}
      ${seasonSection}
      ${comboSection}
      ${luckSection}
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
  function renderDailyStudy() {
    const day = Math.floor(Date.now() / DAY_MS);
    const sys = graph.systems[day % graph.systems.length];
    const date = new Date(), dateKey = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
    const done = storageGet(`daily-${dateKey}`, {});
    const item = (id, label, action, scope = "") => `<div class="daily-study-item">
      <button type="button" class="daily-check ${done[id] ? "done" : ""}" disabled aria-label="${done[id] ? "系统已确认完成" : "等待系统确认"}">${done[id] ? "✓" : "○"}</button>
      <button type="button" class="daily-go" data-daily-study="${action}" ${scope ? `data-daily-scope="${escapeHtml(scope)}"` : ""}>${label}</button></div>`;
    el.dailyStudy.innerHTML = `
      <div class="daily-study-head"><strong>今日学习清单</strong><span>约 5–10 分钟</span></div>
      <div class="daily-study-topic">今日主题：${escapeHtml(sys.title)}</div>
      <div class="daily-study-list">
        ${item("read", "① 精读 1 条核心象义", "explain", sys.id)}
        ${item("quiz", "② 完成 3 道今日测验", "quiz", sys.id)}
        ${item("chart", "③ 用排盘验证 1 次", "chart")}
      </div>`;
  }
  function markDailyAuto(id) {
    const date = new Date(), dateKey = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
    const key = `daily-${dateKey}`, done = storageGet(key, {});
    if (id === "quiz") done.quizCount = (done.quizCount || 0) + 1;
    if (id !== "quiz" || done.quizCount >= 3) done[id] = true;
    storageSet(key, done); renderDailyStudy();
  }

  function renderStudyMode() {
    el.studyMode.innerHTML = `
      <button type="button" class="${studyMode === "quiz" ? "active" : ""}" data-study-mode="quiz">测验</button>
      <button type="button" class="${studyMode === "explain" ? "active" : ""}" data-study-mode="explain">解析</button>`;
  }

  function renderStudyScope() {
    const deck = chartStudyDeck();
    const scopes = [
      { id: "all", title: "全部" },
      { id: "chart-current", title: deck.ids.length ? `盘中象 ${deck.ids.length}` : "盘中象" },
      ...graph.systems.map(s => ({ id: s.id, title: s.title }))
    ];
    el.studyScope.innerHTML = scopes.map(s =>
      `<button type="button" class="${studyScope === s.id ? "active" : ""}" data-scope="${escapeHtml(s.id)}" ${s.id === "chart-current" && !deck.ids.length ? "disabled" : ""}>${escapeHtml(s.title)}</button>`
    ).join("");
  }

  function renderChartStudyFilter() {
    if (studyScope !== "chart-current") {
      el.chartStudyFilter.innerHTML = "";
      return;
    }
    const counts = chartStudyPartCounts();
    if (!counts.all) {
      el.chartStudyFilter.innerHTML = `<div class="empty-card">还没有盘中象卡组。回到「盘」页点“加入学”。</div>`;
      return;
    }
    if (!counts[chartStudyPart]) chartStudyPart = "all";
    el.chartStudyFilter.innerHTML = `
      <div class="chart-study-filter-head">按取象来源复习</div>
      <div class="chart-study-filter-row">
        ${CHART_STUDY_PARTS.map(part => `
          <button type="button" class="${chartStudyPart === part.id ? "active" : ""}" data-chart-study-part="${escapeHtml(part.id)}" ${counts[part.id] ? "" : "disabled"}>
            ${escapeHtml(part.title)}<small>${counts[part.id] || 0}</small>
          </button>`).join("")}
      </div>`;
  }

  function renderStudyStats() {
    const { ok, doing, fresh } = srsStats(studyScope);
    el.studyStats.innerHTML = `
      <div class="stat-box s-ok"><b>${ok}</b><span>测过关</span></div>
      <div class="stat-box s-doing"><b>${doing}</b><span>待巩固</span></div>
      <div class="stat-box s-new"><b>${fresh}</b><span>未测</span></div>`;
  }

  function chartStudyReason(nodeId) {
    if (studyScope !== "chart-current") return "";
    const hit = chartStudyDeck().items.find(x => x.id === nodeId);
    return hit?.why || "";
  }

  function renderQuiz(pickNew = false) {
    if (pickNew || !currentQuiz) {
      currentQuiz = makeQuizQuestion(studyScope);
      quizChosen = -1;
    }
    if (!currentQuiz) {
      el.studyCard.innerHTML = `<div class="empty-card">这个范围里的词条不够出题。可以换个范围，或切到“解析”看词条。</div>`;
      return;
    }
    const q = currentQuiz;
    const answered = quizChosen >= 0;
    const chosenCorrect = answered && q.options[quizChosen].correct;
    const kindLabel = { rel: "地支关系", toTitle: "由象猜词", toCore: "由词选象" }[q.kind] || "";
    const opts = q.options.map((o, i) => {
      let cls = "quiz-opt";
      if (answered) {
        if (o.correct) cls += " correct";
        else if (i === quizChosen) cls += " wrong";
        else cls += " faded";
      }
      return `<button type="button" class="${cls}" data-quiz-opt="${i}" ${answered ? "disabled" : ""}>${escapeHtml(o.text)}</button>`;
    }).join("");
    el.studyCard.innerHTML = `
      <div class="quiz-card">
        <p class="quiz-kind">${escapeHtml(kindLabel)}</p>
        <h3 class="quiz-prompt">${escapeHtml(q.prompt)}</h3>
        <div class="quiz-opts">${opts}</div>
        ${answered ? `
          <div class="quiz-feedback ${chosenCorrect ? "ok" : "no"}">
            <strong>${chosenCorrect ? "答对了 ✓" : "再记一下 ✗"}</strong>
            <p>${escapeHtml(q.why)}</p>
          </div>
          <div class="quiz-after">
            ${q.nodeId ? `<button class="flash-detail-link" type="button" data-open-node="${escapeHtml(q.nodeId)}">看完整象义</button>` : "<span></span>"}
            <button class="quiz-next" type="button" data-quiz-next>下一题 →</button>
          </div>` : ""}
      </div>`;
  }

  function renderStudy(pickNew = false) {
    renderDailyStudy();
    renderStudyMode();
    renderStudyScope();
    renderChartStudyFilter();
    renderStudyStats();
    if (studyMode === "quiz") { renderQuiz(pickNew); return; }
    if (pickNew || !studyNodeId || !scopeNodes(studyScope).some(n => n.id === studyNodeId)) {
      const next = pickStudyNode(studyScope, studyNodeId);
      studyNodeId = next?.id || null;
    }
    const node = nodeById.get(studyNodeId);
    if (!node) {
      el.studyCard.innerHTML = `<div class="empty-card">这个范围里没有词条。</div>`;
      return;
    }
    const srs = srsAll()[node.id];
    const status = !srs?.seen ? "未测过" : (srs.lv >= 3 ? "测验通过 · 复习" : `测验进度 ${srs.lv}/5`);
    const chartWhy = chartStudyReason(node.id);
    const like = node.branches?.["像什么"];
    const why = node.branches?.["为什么"];
    const anti = node.branches?.["不能这样断"];
    el.studyCard.innerHTML = `
      <div class="flash-card">
        <p class="flash-meta">${escapeHtml(node.systemTitle)} · ${escapeHtml(node.type)} · ${escapeHtml(status)}</p>
        <h2 class="flash-title" style="font-size:28px">${escapeHtml(node.title)}</h2>
        <div class="flash-core">${(node.core || []).slice(0, 6).map(c => `<span>${escapeHtml(c)}</span>`).join("")}</div>
        ${chartWhy ? `<p class="flash-chart-why">${escapeHtml(chartWhy)}</p>` : ""}
        <p class="flash-plain">${escapeHtml(nodePlain(node))}</p>
        ${like?.length ? `<p class="flash-like">像什么：${escapeHtml(like.slice(0, 4).join("、"))}</p>` : ""}
        ${why?.length ? `<p class="flash-like">为什么：${escapeHtml(why.slice(0, 2).join("；"))}</p>` : ""}
        ${anti?.length ? `<p class="flash-like">防误断：${escapeHtml(anti[0])}</p>` : ""}
      </div>
      <div class="quiz-after">
        <button class="flash-detail-link" type="button" data-open-node="${escapeHtml(node.id)}">看完整象义</button>
        <button class="quiz-next" type="button" data-study-next>换一个解析 →</button>
      </div>`;
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
      if (target) {
        return `
          <div class="rel-link-row">
            <button type="button" data-open-node="${escapeHtml(target.id)}">${escapeHtml(r)}</button>
            <span>${escapeHtml(explainPair(node, target))}</span>
          </div>`;
      }
      return `
        <div class="rel-link-row">
          <button type="button" data-quick="${escapeHtml(r)}">${escapeHtml(r)}</button>
          <span>库里暂无同名词条，点击按词搜索相关象义。</span>
        </div>`;
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
    n: [], e: [], adj: [], idxById: null, anchors: [],
    cam: { x: 0, y: 0, s: 0.8 },
    alpha: 0, selected: -1, neighbors: new Set(), focusSys: "",
    searchSet: new Set(), searchQuery: "",
    pathStart: -1, pathOrigin: -1, pathNodes: [], pathNodeSet: new Set(), pathEdgeSet: new Set(),
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
    // 邻接表，供取象路径 BFS 用
    tree.adj = gnodes.map(() => []);
    edges.forEach(([a, b]) => { tree.adj[a].push(b); tree.adj[b].push(a); });
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
    const hasPath = tree.pathNodes.length >= 2;
    const hasSearch = tree.searchSet.size > 0;

    // 边
    for (const [i, j] of tree.e) {
      const ni = tree.n[i], nj = tree.n[j];
      const [x1, y1] = w2s(ni.x, ni.y);
      const [x2, y2] = w2s(nj.x, nj.y);
      let alpha = 0.16, width = 1, color = ni.color;
      if (hasPath) {
        const on = tree.pathEdgeSet.has(Math.min(i, j) + "-" + Math.max(i, j));
        alpha = on ? 1 : 0.03;
        width = on ? 2.6 : 1;
        if (on) color = "#ffe08a";
      } else if (hasSearch) {
        const on = tree.searchSet.has(i) || tree.searchSet.has(j);
        alpha = on ? 0.5 : 0.035;
        width = on ? 1.5 : 1;
        if (on) color = "#ffe08a";
      } else if (hasSel) {
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
      const onPath = hasPath && tree.pathNodeSet.has(ni.i);
      if (hasPath) dimmed = !onPath;
      else if (hasSearch) dimmed = !tree.searchSet.has(ni.i);
      else if (hasSel) dimmed = !(ni.i === tree.selected || tree.neighbors.has(ni.i));
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
      const isEnd = hasPath && (ni.i === tree.pathNodes[0] || ni.i === tree.pathNodes[tree.pathNodes.length - 1]);
      if (ni.i === tree.selected || onPath) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = isEnd ? "#ffe08a" : "#ffffff";
        ctx.lineWidth = isEnd ? 3 : 2;
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
      if (hasPath) show = tree.pathNodeSet.has(ni.i);
      else if (hasSearch) show = tree.searchSet.has(ni.i);
      else if (hasSel) show = ni.i === tree.selected || tree.neighbors.has(ni.i);
      else if (focus) show = ni.sysId === focus ? (s > 0.4 || ni.deg >= 5) : false;
      else show = s >= 0.62 || ni.deg >= 7;
      if (!show) continue;
      const [sx, sy] = w2s(ni.x, ni.y);
      if (sx < -20 || sy < -20 || sx > tree.W + 20 || sy > tree.H + 20) continue;
      const bold = ni.i === tree.selected || (hasPath && tree.pathNodeSet.has(ni.i));
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

  // BFS 找两节点间最短取象路径（返回节点下标数组，含首尾）
  function bfsPath(a, b) {
    if (a === b) return [a];
    const prev = new Int32Array(tree.n.length).fill(-1);
    const seen = new Uint8Array(tree.n.length);
    const queue = [a];
    seen[a] = 1;
    for (let head = 0; head < queue.length; head++) {
      const cur = queue[head];
      for (const nx of tree.adj[cur]) {
        if (seen[nx]) continue;
        seen[nx] = 1;
        prev[nx] = cur;
        if (nx === b) {
          const path = [b];
          let p = cur;
          while (p !== -1) { path.push(p); p = prev[p]; }
          return path.reverse();
        }
        queue.push(nx);
      }
    }
    return null;
  }

  function clearPath() {
    tree.pathStart = -1;
    tree.pathOrigin = -1;
    tree.pathNodes = [];
    tree.pathNodeSet = new Set();
    tree.pathEdgeSet = new Set();
  }

  function clearTreeSearch() {
    tree.searchSet = new Set();
    tree.searchQuery = "";
  }

  // 退出路径，回到起点那个字的单选（相关字连线）状态
  function exitPathToOrigin() {
    const origin = tree.pathOrigin;
    clearPath();
    selectTreeNode(origin, false);
  }

  function setPath(nodesIdx) {
    tree.pathNodes = nodesIdx;
    tree.pathNodeSet = new Set(nodesIdx);
    tree.pathEdgeSet = new Set();
    for (let k = 0; k + 1 < nodesIdx.length; k++) {
      const a = nodesIdx[k], b = nodesIdx[k + 1];
      tree.pathEdgeSet.add(Math.min(a, b) + "-" + Math.max(a, b));
    }
    tree.selected = -1;
    tree.neighbors = new Set();
    tree.pathStart = -1;
    treeFitTo(nodesIdx.map(i => tree.n[i]));
    renderTreeInfo();
    tree.dirty = true;
  }

  function armPathStart(i) {
    tree.pathStart = i;
    tree.pathOrigin = i;
    renderTreeInfo();
    tree.dirty = true;
  }

  function renderTreeInfo() {
    // 状态零：搜索高亮
    if (tree.searchSet.size) {
      const hits = [...tree.searchSet].map(i => tree.n[i]).slice(0, 18);
      treeInfo.innerHTML = `
        <div class="tree-card">
          <div class="tc-path-head">
            <strong>搜索命中</strong>
            <span>「${escapeHtml(tree.searchQuery)}」· ${tree.searchSet.size} 个词条</span>
            <button type="button" data-tree-search-clear>✕</button>
          </div>
          <div class="tree-hit-list">
            ${hits.map(gn => `<button type="button" data-tree-select="${gn.i}" style="border-color:${gn.color};color:${gn.color}">${escapeHtml(gn.title)}</button>`).join("")}
          </div>
        </div>`;
      return;
    }
    // 状态一：路径已生成，渲染为竖向链：词 →理由→ 词
    if (tree.pathNodes.length >= 2) {
      const parts = [];
      tree.pathNodes.forEach((idx, k) => {
        const gnk = tree.n[idx];
        parts.push(`<button type="button" class="tc-chain-node" data-open-node="${escapeHtml(gnk.id)}" style="color:${gnk.color}">${escapeHtml(gnk.title)}</button>`);
        if (k + 1 < tree.pathNodes.length) {
          const to = tree.n[tree.pathNodes[k + 1]];
          const reason = explainPair(nodeById.get(gnk.id), nodeById.get(to.id));
          parts.push(`<div class="tc-chain-why"><span class="tc-arrow">↓</span><span>${escapeHtml(reason)}</span></div>`);
        }
      });
      const a = tree.n[tree.pathNodes[0]], z = tree.n[tree.pathNodes[tree.pathNodes.length - 1]];
      treeInfo.innerHTML = `
        <div class="tree-card">
          <div class="tc-path-head">
            <strong>取象路径</strong>
            <span>${escapeHtml(a.title)} → ${escapeHtml(z.title)} · ${tree.pathNodes.length - 1} 步</span>
            <button type="button" data-path-clear>✕</button>
          </div>
          <div class="tc-chain">${parts.join("")}</div>
        </div>`;
      return;
    }
    // 状态二：已选起点，等终点
    if (tree.pathStart >= 0) {
      const gn = tree.n[tree.pathStart];
      treeInfo.innerHTML = `
        <div class="tree-card tc-arm">
          <span class="tc-arm-line">起点 <b style="color:${gn.color}">${escapeHtml(gn.title)}</b> · 再点一个词，看它俩怎么串起来</span>
          <button type="button" data-path-clear>取消</button>
        </div>`;
      return;
    }
    // 状态三：无选中
    if (tree.selected < 0) {
      treeInfo.innerHTML = `<span class="hint">点词看关联 · 点开后可"连一条取象路径" · 双指缩放</span>`;
      return;
    }
    // 状态四：单点选中
    const gn = tree.n[tree.selected];
    const node = nodeById.get(gn.id);
    const nbs = [...tree.neighbors].map(i => tree.n[i]).slice(0, 12);
    const nbRows = nbs.map(nb => {
      const reason = explainPair(node, nodeById.get(nb.id));
      return `
        <div class="tc-nb-row">
          <button type="button" data-tree-select="${nb.i}" style="color:${nb.color};border-color:${nb.color}">${escapeHtml(nb.title)}</button>
          <span>${escapeHtml(reason)}</span>
        </div>`;
    }).join("");
    treeInfo.innerHTML = `
      <div class="tree-card">
        <div class="tc-title">
          <strong>${escapeHtml(gn.title)}</strong>
          <span class="tc-sys" style="color:${gn.color}">${escapeHtml(node.systemTitle)}</span>
        </div>
        <p class="tc-core">${escapeHtml((node.core || []).slice(0, 5).join(" · "))}</p>
        ${nbRows ? `<div class="tc-nb-list">${nbRows}</div>` : ""}
        <div class="tc-actions">
          <button class="tc-path-btn" type="button" data-path-start="${gn.i}">从这里连一条取象路径 →</button>
          <button class="tc-open" type="button" data-open-node="${escapeHtml(gn.id)}">看完整象义 →</button>
        </div>
      </div>`;
  }

  function selectTreeNode(i, center = true) {
    clearPath();
    clearTreeSearch();
    tree.selected = i;
    tree.neighbors = new Set();
    if (i >= 0) {
      for (const nx of tree.adj[i]) tree.neighbors.add(nx);
      if (center) {
        tree.cam.x = tree.n[i].x;
        tree.cam.y = tree.n[i].y;
        if (tree.cam.s < 0.75) tree.cam.s = 1.1;
      }
    }
    renderTreeInfo();
    tree.dirty = true;
  }

  // 点击某节点，根据当前是否在"选路径"状态决定行为
  function treeTapNode(hit) {
    if (hit < 0) {
      if (tree.pathStart >= 0 || tree.pathNodes.length) { clearPath(); selectTreeNode(-1, false); }
      else selectTreeNode(-1, false);
      return;
    }
    if (tree.pathStart >= 0 && hit !== tree.pathStart) {
      const path = bfsPath(tree.pathStart, hit);
      if (path && path.length >= 2) { setPath(path); return; }
      // 不连通：保留起点，叉号/好 仍能回到起点单选态
      const a = tree.n[tree.pathStart], b = tree.n[hit];
      tree.pathStart = -1;
      tree.pathNodes = [];
      tree.pathNodeSet = new Set();
      tree.pathEdgeSet = new Set();
      treeInfo.innerHTML = `
        <div class="tree-card tc-arm">
          <span class="tc-arm-line">「${escapeHtml(a.title)}」和「${escapeHtml(b.title)}」在图里暂时没有连通路径（这个词关联还少）。</span>
          <button type="button" data-path-clear>好</button>
        </div>`;
      tree.dirty = true;
      return;
    }
    selectTreeNode(hit);
  }

  function showSearchInTree(query) {
    const results = searchNodes(query);
    if (!results.length) return;
    switchTab("tree");
    treeStart();
    clearPath();
    tree.selected = -1;
    tree.neighbors = new Set();
    tree.focusSys = "";
    tree.searchQuery = query;
    tree.searchSet = new Set(results.map(r => tree.idxById.get(r.node.id)).filter(i => i !== undefined));
    if (tree.searchSet.size) treeFitTo([...tree.searchSet].map(i => tree.n[i]));
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
      treeTapNode(hit);
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
    clearTreeSearch();
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
    clearTreeSearch();
    selectTreeNode(-1, false);
    treeLegend.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.treeSys === tree.focusSys));
    if (tree.focusSys) treeFitTo(tree.n.filter(ni => ni.sysId === tree.focusSys));
    else treeFitTo(tree.n);
  });

  window.addEventListener("resize", () => {
    if (tree.running) treeResize();
  });

  function saveCurrentChart() {
    const book = chartBookAll();
    const key = baziKey(bazi);
    const old = book.find(item => baziKey(item.bazi) === key);
    const name = prompt("给这个命例起个名字：", old?.title || baziTitle(bazi));
    if (name === null) return;
    const now = Date.now();
    if (old) {
      old.title = name.trim() || baziTitle(bazi);
      old.bazi = bazi.slice();
      if (!old.tags.length) old.tags = suggestedChartTags(bazi);
      old.updatedAt = now;
    } else {
      book.push({ id: uid("chart"), title: name.trim() || baziTitle(bazi), bazi: bazi.slice(), note: "", noteSections: normalizeChartNoteSections(null), tags: suggestedChartTags(bazi), createdAt: now, updatedAt: now });
    }
    storageSet("chartBook", book);
    renderChartBook();
  }

  function saveChartNote(id) {
    const book = chartBookAll();
    const item = book.find(x => x.id === id);
    if (!item) return;
    const sections = {};
    document.querySelectorAll("[data-chart-note-field]").forEach(input => {
      sections[input.dataset.chartNoteField] = input.value.trim();
    });
    item.noteSections = normalizeChartNoteSections(sections);
    item.note = chartNotePlain(item.noteSections);
    item.tags = parseTags(document.querySelector("[data-chart-tags-input]")?.value || "");
    item.updatedAt = Date.now();
    storageSet("chartBook", book);
    clearChartNoteDraft();
    renderChartBook();
  }

  function loadChart(id) {
    const item = chartBookAll().find(x => x.id === id);
    if (!item) return;
    bazi = item.bazi.slice();
    selectedSlot = 0;
    quizRevealed = { rel: false, ss: false };
    storageSet("bazi", bazi);
    renderChart();
  }

  function deleteChart(id) {
    const book = chartBookAll();
    const item = book.find(x => x.id === id);
    if (!item) return;
    if (!confirm(`删除命例「${item.title}」？`)) return;
    storageSet("chartBook", book.filter(x => x.id !== id));
    if (chartNoteDraft()?.chartId === id) clearChartNoteDraft();
    renderChartBook();
  }

  function exportCharts() {
    const charts = chartBookAll().map(item => ({
      ...item,
      chartStudySnapshot: chartExportSnapshot(item.bazi)
    }));
    const payload = { app: "bazi-xiangyi", type: "chart-book", version: 2, exportedAt: new Date().toISOString(), charts };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `八字象义_命例本_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importCharts() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || ""));
          const incoming = normalizeChartBook(Array.isArray(parsed) ? parsed : parsed.charts);
          if (!incoming.length) { alert("没有读到可导入的命例。"); return; }
          const book = chartBookAll();
          const byKey = new Map(book.map(x => [baziKey(x.bazi), x]));
          incoming.forEach(item => {
            const key = baziKey(item.bazi);
            const old = byKey.get(key);
            if (old) {
              old.title = item.title || old.title;
              old.noteSections = normalizeChartNoteSections(item.noteSections, item.note || old.note);
              old.note = item.note || old.note || "";
              old.tags = normalizeTags(item.tags?.length ? item.tags : old.tags);
              old.updatedAt = Date.now();
            } else {
              item.id = uid("chart");
              book.push(item);
            }
          });
          storageSet("chartBook", book);
          renderChartBook();
          alert(`已导入 ${incoming.length} 个命例。`);
        } catch {
          alert("导入失败：JSON 格式不对。");
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function saveChartStudyDeck() {
    const items = collectChartStudyItems(bazi);
    storageSet("chartStudyDeck", {
      title: baziTitle(bazi),
      bazi: bazi.slice(),
      ids: items.map(x => x.id),
      items,
      savedAt: Date.now()
    });
    studyScope = "chart-current";
    chartStudyPart = "all";
    storageSet("studyScope", studyScope);
    storageSet("chartStudyPart", chartStudyPart);
    studyNodeId = null;
    currentQuiz = null;
    renderAnalysis();
    renderStudy(true);
    markDailyAuto("chart");
  }

  /* ---- 事件 ---- */
  document.body.addEventListener("click", event => {
    const daily = event.target.closest("[data-daily-study]");
    if (daily) {
      const action = daily.dataset.dailyStudy;
      if (action === "chart") { switchTab("chart"); return; }
      studyScope = daily.dataset.dailyScope || "all";
      studyMode = action;
      if (action === "explain") markDailyAuto("read");
      storageSet("studyScope", studyScope); storageSet("studyMode", studyMode);
      switchTab("study");
      renderStudy(true); return;
    }
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

    const treeSearch = event.target.closest("[data-tree-search]");
    if (treeSearch) { showSearchInTree(treeSearch.dataset.treeSearch); return; }

    if (event.target.closest("[data-tree-search-clear]")) {
      clearTreeSearch();
      renderTreeInfo();
      tree.dirty = true;
      return;
    }

    const pathStartBtn = event.target.closest("[data-path-start]");
    if (pathStartBtn) { armPathStart(Number(pathStartBtn.dataset.pathStart)); return; }

    const pathClear = event.target.closest("[data-path-clear]");
    if (pathClear) { exitPathToOrigin(); return; }

    const open = event.target.closest("[data-open-node]");
    if (open) { openDetail(open.dataset.openNode); return; }

    const quick = event.target.closest("[data-quick]");
    if (quick) {
      el.globalSearch.value = quick.dataset.quick;
      if (activeTab !== "search" || detailStack.length) switchTab("search");
      renderSearch();
      return;
    }

    const antiToggle = event.target.closest("[data-anti-first]");
    if (antiToggle) {
      antiFirst = !!antiToggle.checked;
      storageSet("antiFirst", antiFirst);
      renderSearch();
      return;
    }

    const slot = event.target.closest("[data-slot]");
    if (slot) { selectedSlot = Number(slot.dataset.slot); renderChart(); return; }

    const charBtn = event.target.closest("[data-char]");
    if (charBtn) {
      const ch = charBtn.dataset.char || "";
      if (selectedSlot >= 8) {
        luck[selectedSlot - 8] = ch;
        storageSet("luck", luck);
        selectedSlot = selectedSlot < 11 ? selectedSlot + 1 : 8;
      } else {
        if (!ch) return;
        bazi[selectedSlot] = ch;
        storageSet("bazi", bazi);
        quizRevealed = { rel: false, ss: false };
        selectedSlot = ENTRY_ORDER[(ENTRY_ORDER.indexOf(selectedSlot) + 1) % 8];
      }
      renderChart();
      return;
    }

    if (event.target.closest("[data-luck-clear]")) {
      luck = ["", "", "", ""];
      storageSet("luck", luck);
      if (selectedSlot >= 8) selectedSlot = 8;
      renderChart();
      return;
    }

    const reveal = event.target.closest("[data-reveal]");
    if (reveal) { quizRevealed[reveal.dataset.reveal] = true; renderAnalysis(); markDailyAuto("chart"); return; }

    if (event.target.closest("[data-save-chart]")) { saveCurrentChart(); markDailyAuto("chart"); return; }
    if (event.target.closest("[data-export-charts]")) { exportCharts(); return; }
    if (event.target.closest("[data-import-charts]")) { importCharts(); return; }

    const saveNoteBtn = event.target.closest("[data-save-chart-note]");
    if (saveNoteBtn) { saveChartNote(saveNoteBtn.dataset.saveChartNote); return; }

    const tagFilterBtn = event.target.closest("[data-chart-tag-filter]");
    if (tagFilterBtn) {
      chartBookTagFilter = tagFilterBtn.dataset.chartTagFilter || "";
      renderChartBook();
      return;
    }

    const addTagBtn = event.target.closest("[data-add-chart-tag]");
    if (addTagBtn) {
      const input = document.querySelector("[data-chart-tags-input]");
      if (!input) return;
      const tags = new Set(parseTags(input.value));
      tags.add(addTagBtn.dataset.addChartTag);
      input.value = [...tags].join("、");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    const loadChartBtn = event.target.closest("[data-load-chart]");
    if (loadChartBtn) { loadChart(loadChartBtn.dataset.loadChart); return; }

    const deleteChartBtn = event.target.closest("[data-delete-chart]");
    if (deleteChartBtn) { deleteChart(deleteChartBtn.dataset.deleteChart); return; }

    if (event.target.closest("[data-add-chart-study]")) { saveChartStudyDeck(); return; }
    if (event.target.closest("[data-go-chart-study]")) {
      if (!chartStudyDeck().ids.length) return;
      studyScope = "chart-current";
      storageSet("studyScope", studyScope);
      switchTab("study");
      renderStudy(true);
      return;
    }

    const routePartBtn = event.target.closest("[data-go-chart-study-part]");
    if (routePartBtn) {
      if (!chartStudyDeck().ids.length) return;
      studyScope = "chart-current";
      chartStudyPart = routePartBtn.dataset.goChartStudyPart;
      storageSet("studyScope", studyScope);
      storageSet("chartStudyPart", chartStudyPart);
      switchTab("study");
      renderStudy(true);
      return;
    }

    const chartPartBtn = event.target.closest("[data-chart-study-part]");
    if (chartPartBtn) {
      chartStudyPart = chartPartBtn.dataset.chartStudyPart;
      storageSet("chartStudyPart", chartStudyPart);
      studyNodeId = null;
      currentQuiz = null;
      renderStudy(true);
      return;
    }

    const studyModeBtn = event.target.closest("[data-study-mode]");
    if (studyModeBtn) {
      studyMode = studyModeBtn.dataset.studyMode;
      storageSet("studyMode", studyMode);
      renderStudy();
      return;
    }

    const scope = event.target.closest("[data-scope]");
    if (scope) {
      studyScope = scope.dataset.scope;
      storageSet("studyScope", studyScope);
      if (studyScope !== "chart-current") {
        chartStudyPart = "all";
        storageSet("chartStudyPart", chartStudyPart);
      }
      renderStudy(true);
      return;
    }

    if (event.target.closest("[data-study-next]")) { renderStudy(true); return; }

    const quizOpt = event.target.closest("[data-quiz-opt]");
    if (quizOpt) {
      if (quizChosen >= 0 || !currentQuiz) return;
      quizChosen = Number(quizOpt.dataset.quizOpt);
      if (currentQuiz.nodeId) gradeStudy(currentQuiz.nodeId, currentQuiz.options[quizChosen].correct ? "good" : "bad");
      markDailyAuto("quiz");
      renderStudyStats();
      renderQuiz();
      return;
    }

    if (event.target.closest("[data-quiz-next]")) { renderQuiz(true); renderStudyStats(); return; }

    const system = event.target.closest("[data-system]");
    if (system) { activeSystemId = system.dataset.system; renderLibrary(); return; }
  });

  // 复盘笔记输入即存草稿：排盘页重渲染或误触也不会丢
  document.body.addEventListener("input", event => {
    const box = event.target.closest("[data-chart-note-draft-for]");
    if (!box) return;
    if (!event.target.matches("[data-chart-note-field], [data-chart-tags-input]")) return;
    const sections = {};
    box.querySelectorAll("[data-chart-note-field]").forEach(t => { sections[t.dataset.chartNoteField] = t.value; });
    storageSet("chartNoteDraft", {
      chartId: box.dataset.chartNoteDraftFor,
      tags: box.querySelector("[data-chart-tags-input]")?.value || "",
      sections,
      savedAt: Date.now()
    });
  });

  el.globalSearch.addEventListener("input", renderSearch);
  el.clearSearch.addEventListener("click", () => { el.globalSearch.value = ""; renderSearch(); });
  el.resetBazi.addEventListener("click", () => {
    bazi = ["甲", "乙", "丙", "丁", "子", "丑", "午", "酉"];
    luck = ["", "", "", ""];
    selectedSlot = 0;
    quizRevealed = { rel: false, ss: false };
    storageSet("bazi", bazi);
    storageSet("luck", luck);
    renderChart();
  });
  el.quizMode.addEventListener("change", () => {
    quizOn = el.quizMode.checked;
    quizRevealed = { rel: false, ss: false };
    storageSet("quiz", quizOn);
    renderAnalysis();
  });
  el.detailBack.addEventListener("click", goBack);

  // 顶部刷新条：带时间戳强刷，绕过 GitHub Pages 缓存看到新版
  const updateBar = document.querySelector("#updateBar");
  if (updateBar) updateBar.addEventListener("click", () => {
    location.replace(location.pathname + "?r=" + Date.now());
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => { /* 离线能力失败不影响主功能 */ });
    });
  }

  /* ---- 启动 ---- */
  history.replaceState({ tab: "search" }, "");
  renderSearch();
  renderChart();
  renderStudy();
  renderLibrary();
}
