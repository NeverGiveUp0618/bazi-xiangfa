const fs=require('fs');
const R='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/八字象义/bazi_xiangyi_site/';
const M=R+'mobile/';
const B='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/bazi-game/index.html';
const errs=[];
const t=(n,f)=>{try{const r=f();const ok=r===true;console.log((ok?'✓ ':'✗ ')+n+(ok?'':' → '+r));if(!ok)errs.push(n)}catch(e){console.log('✗ '+n+' → THREW '+e.message);errs.push(n)}};
global.window={};
eval(fs.readFileSync(M+'data.js','utf8'));
// cross_arts_data.js 会向 BAZI_GRAPH 追加体系，出题引擎对全部节点生效，必须一并纳入
if(fs.existsSync(M+'cross_arts_data.js'))eval(fs.readFileSync(M+'cross_arts_data.js','utf8'));
const app=fs.readFileSync(M+'app.js','utf8'), bg=fs.readFileSync(B,'utf8');
const G=window.BAZI_GRAPH, all=G.systems.flatMap(s=>s.nodes.map(n=>({...n,sys:s.title})));
const grab=(s,re)=>{const m=s.match(re);return m?(m[1].match(/[一-龥]{2}/g)||[]):[]};
const norm=a=>[...new Set(a.map(x=>[...x].sort().join('')))].sort().join(' ');

console.log('【data.js 结构】');
t('运行时体系/节点齐全（data.js + cross_arts_data.js）',()=>{
  console.log(`   ${G.systems.length} 体系 / ${all.length} 节点`);
  return (G.systems.length>=20&&all.length>=201)||`仅 ${G.systems.length}体系 ${all.length}节点`;});
t('节点 id 唯一（戊土 wu-gan 撞车已修）',()=>{const ids=all.map(n=>n.id);
  const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);return dup.length?'重复: '+[...new Set(dup)]:true});
t('戊土 id 为 wu-gan、午火 id 为 wu',()=>{
  const a=all.find(n=>n.title==='戊土'),b=all.find(n=>n.title==='午火');
  return (a&&a.id==='wu-gan'&&b&&b.id==='wu')?true:`戊土=${a&&a.id} 午火=${b&&b.id}`});
t('每个节点 title/core/branches 齐全',()=>{const bad=all.filter(n=>!n.title||!n.core||!n.branches);
  return bad.length?bad.length+' 条缺字段':true});

console.log('\n【data.js「组合」栏 ↔ app.js 引擎常量】');
const ENG={
 六破:grab(app,/PO_PAIRS = \[([^\]]*)\]/), 暗合:grab(app,/ANHE_PAIRS = \[([^\]]*)\]/),
 绝:grab(app,/JUE_PAIRS = \[([^\]]*)\]/),
 干支自合:grab(app,/ZIHE_PILLARS = new Set\(\[([^\]]*)\]/),
 穿:grab(app,/CHUAN_SHENG = \[([^\]]*)\]/).concat(grab(app,/CHUAN_KE = \[([^\]]*)\]/)),
};
Object.keys(ENG).forEach(k=>t(`${k}·组合 = 引擎`,()=>{
  const n=all.find(x=>x.title===k), raw=(n.branches['组合']||[]).join('；');
  const got=k==='干支自合'?(raw.match(/[一-龥]{2}/g)||[]):(raw.match(/[一-龥]{2}(?=破|穿|绝|暗合)/g)||[]);
  return norm(got)===norm(ENG[k])?true:`data[${got.join(' ')}] 引擎[${ENG[k].join(' ')}]`}));
t('六破·组合为四正破（不是传统六破）',()=>{
  const n=all.find(x=>x.title==='六破');
  return norm((n.branches['组合']||[]).map(x=>x.slice(0,2)))===norm(['子卯','子酉','卯午','午酉'])?true:
    (n.branches['组合']||[]).join('/')});
t('三刑组与引擎一致且不含子卯',()=>{
  const n=all.find(x=>x.title==='三刑'), s=(n.branches['组合']||[]).join('；');
  const eng=app.match(/XING_GROUPS = \[([\s\S]*?)\];/)[1];
  const okEng=eng.includes('寅')&&eng.includes('巳')&&eng.includes('申')&&eng.includes('丑')&&eng.includes('戌')&&eng.includes('未')&&!/子|卯/.test(eng);
  return (s.includes('寅巳申')&&s.includes('丑戌未')&&!s.includes('子卯')&&okEng)?true:`data[${s}] engHasZiMao=${!okEng}`});

console.log('\n【与 bazi-game 同源体系】');
const BG={六破:grab(bg,/PO_SET=new Set\(\[([^\]]*)\]/),暗合:grab(bg,/ANHE_SET=new Set\(\[([^\]]*)\]/),
 绝:grab(bg,/JUE_SET=new Set\(\[([^\]]*)\]/),干支自合:grab(bg,/const ZIHE=new Set\(\[([^\]]*)\]/),
 穿:grab(bg,/CHUAN_S_CANON=new Set\(\[([^\]]*)\]/).concat(grab(bg,/CHUAN_K_CANON=new Set\(\[([^\]]*)\]/))};
Object.keys(BG).forEach(k=>t(`${k} 两站集合一致`,()=>norm(ENG[k])===norm(BG[k])?true:
  `象义[${ENG[k].join(' ')}] bazi-game[${BG[k].join(' ')}]`));

console.log('\n【测验不会出坏题】');
t('makeContextQuestion 已排除同栏取值',()=>{
  return /ownSet\s*=\s*new Set\(values\.map\(String\)\)/.test(app)&&/const usable = v =>[^\n]*!ownSet\.has/.test(app)
    ?true:'app.js 未见同栏排除逻辑，坏题会复现'});
t('实跑 makeContextQuestion：每题唯一正解',()=>{
  // 复刻修正后的取题逻辑，对全部节点全部可出题栏位穷举
  const QUIZABLE=k=>!/大白话|为什么|像什么|提醒|风险|不能这样断|反例|口径/.test(k);
  const bad=[];let n=0;
  all.forEach(node=>{
    const groups=Object.entries(node.branches||{}).filter(([k,v])=>QUIZABLE(k)&&v.some(v2=>String(v2).length<=10));
    groups.forEach(([key,values])=>{
      const ownSet=new Set(values.map(String));
      const usable=v=>String(v).length<=10&&!ownSet.has(String(v));
      const others=groups.filter(([k])=>k!==key).flatMap(([,vs])=>vs.filter(usable));
      const fb=all.filter(x=>x.id!==node.id).flatMap(x=>Object.values(x.branches||{}).flat()).filter(usable);
      const pool=others.length>=3?others:fb;
      const alsoRight=pool.filter(v=>ownSet.has(String(v)));
      n++;
      if(alsoRight.length)bad.push(`${node.title}·${key} 干扰池含本栏答案 ${[...new Set(alsoRight)].slice(0,3).join(',')}`);
    });
  });
  console.log(`   （穷举 ${n} 个可出题栏位）`);
  return bad.length?bad.slice(0,5).join(' | ')+(bad.length>5?` …共${bad.length}`:''):true});

console.log('\n【横向条：选中项须滚进可视范围】');
t('存在 scrollActiveIntoView 且只动容器 scrollLeft',()=>{
  if(!/function scrollActiveIntoView\(row\)/.test(app))return '函数缺失';
  const body=app.slice(app.indexOf('function scrollActiveIntoView'),app.indexOf('function scrollActiveIntoView')+700);
  if(/scrollIntoView\(/.test(body))return '用了 scrollIntoView，会连带滚动整页';
  if(!/row\.scrollLeft\s*=/.test(body))return '未设置 row.scrollLeft';
  if(!/scrollWidth\s*<=\s*row\.clientWidth/.test(body))return '缺「未溢出则不动」的短路';
  return true});
t('renderQuickRow 渲染后调用归位',()=>{
  const i=app.indexOf('function renderQuickRow');
  const seg=app.slice(i,i+700);
  return /scrollActiveIntoView\(el\.quickRow\)/.test(seg)||'renderQuickRow 未调用'});
t('术数条与图鉴条同样归位',()=>{
  const i=app.indexOf('function renderTraditionRows');
  const seg=app.slice(i,i+900);
  const miss=[];
  if(!/scrollActiveIntoView\(el\.traditionRow\)/.test(seg))miss.push('traditionRow');
  if(!/scrollActiveIntoView\(el\.libraryTraditions\)/.test(seg))miss.push('libraryTraditions');
  return miss.length?'未归位: '+miss.join(','):true});
t('QUICK_TERMS 条数多到会溢出（故必须归位）',()=>{
  const m=app.match(/const QUICK_TERMS = \[([^\]]*)\]/);
  if(!m)return '未找到 QUICK_TERMS';
  const n=(m[1].match(/"/g)||[]).length/2;
  return n>=8?true:`仅 ${n} 项，若已缩短可放宽此断言`});

console.log('\n【死文件提示】');
t('根级 index.html 只做跳转、不加载脚本',()=>{
  const h=fs.readFileSync(R+'index.html','utf8');
  return (!/<script[^>]*src=/.test(h)&&/location\.replace/.test(h))?true:'根页已开始加载脚本，需重新评估根级 js 是否还是死文件'});

console.log('\n'+(errs.length?'❌ '+errs.length+' 项未通过':'✅ 全部通过'));
process.exit(errs.length?1:0);
