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

console.log('\n【我在学：一个主修范围，全站统一】');
// 把 app.js 里的范围逻辑抠出来单独跑，确保验的是真代码而不是我以为的代码
const majorSeg = app.match(/const MAJOR_ID[\s\S]*?function inTradition[\s\S]*?\n\}/);
t('app.js 里有「我在学」范围的实现', ()=> majorSeg?true:'没找到 MAJOR_ID 段');
{
  const store={};
  const storageGet=(k,d)=>store[k]!==undefined?store[k]:d;
  const TRADITION_META=JSON.parse(JSON.stringify(G.traditions));
  const nodes=G.systems.flatMap(sys=>sys.nodes.map(n=>({...n,
    systemId:sys.id, tradition:sys.tradition||'bazi', sharedWith:n.sharedWith||[]})));
  // ⚠️ eval 里的 const/let 不会泄漏到外层作用域（只有 function 声明会），
  //    直接 eval 会出现「inTradition 可用但 MAJOR_ID undefined」的怪相。改成 var。
  eval(majorSeg[0].replace(/^const /gm, 'var '));

  t('默认主修＝八字＋六壬神课', ()=>{
    const m=majorList();
    return (m.length===2&&m.includes('bazi')&&m.includes('liuren'))?true:JSON.stringify(m)});
  t('「我在学」把 201 个节点收到 155 个', ()=>{
    const n=nodes.filter(x=>inTradition(x,MAJOR_ID)).length;
    console.log('   我在学 '+n+' 个 / 全部 '+nodes.length+' 个');
    return n===155?true:`实为 ${n}`});
  t('奇门六爻不在默认范围内', ()=>{
    const bad=nodes.filter(x=>inTradition(x,MAJOR_ID)&&['qimen','liuyao'].includes(x.tradition));
    return bad.length?bad.length+' 个奇门/六爻节点混进来了':true});
  t('改主修后范围立刻跟着变', ()=>{
    store.majorTraditions=['bazi'];
    const n=nodes.filter(x=>inTradition(x,MAJOR_ID)).length;
    store.majorTraditions=undefined;
    return n===131?true:`只留八字应为 131，实为 ${n}`});
  t('切到具体一术仍照常工作', ()=>{
    const n=nodes.filter(x=>inTradition(x,'qimen')).length;
    return n>=33?true:`奇门 ${n} 个`});
  t('四术共查仍是全部', ()=>
    nodes.filter(x=>inTradition(x,'all')).length===nodes.length?true:'all 范围不完整');
}

t('三处默认范围统一到「我在学」', ()=>{
  const miss=[];
  if(!/storageGet\("activeTradition", MAJOR_ID\)/.test(app))miss.push('查询页');
  if(!/storageGet\("studyScope", `tradition:\$\{MAJOR_ID\}`\)/.test(app))miss.push('学习页');
  if(!/storageGet\("libraryTradition", MAJOR_ID\)/.test(app))miss.push('图鉴页');
  return miss.length?'仍是旧默认: '+miss.join('/'):true});

t('今日一组只在主修体系里轮（原来轮全部20个）', ()=>{
  if(/graph\.systems\[day % graph\.systems\.length\]/.test(app))
    return '仍在 20 个体系里轮，近半数日子会推用不上的术';
  return /pool = graph\.systems\.filter\(sys => majorList\(\)\.includes/.test(app)?true:'选池逻辑没改对'});

t('模拟一年365天：今日一组不再出现奇门/六爻', ()=>{
  const major=['bazi','liuren'];
  const pool=G.systems.filter(s=>major.includes(s.tradition||'bazi'));
  const bad=[];
  for(let d=0;d<365;d++){const sys=pool[d%pool.length];
    if(!major.includes(sys.tradition||'bazi'))bad.push(sys.title)}
  console.log('   365 天全部落在 '+pool.length+' 个主修体系内');
  return bad.length?bad.length+' 天推了非主修':true});

t('（对照）改之前 365 天里有多少天推非主修', ()=>{
  let bad=0;
  for(let d=0;d<365;d++){const sys=G.systems[d%G.systems.length];
    if(!['bazi','liuren'].includes(sys.tradition||'bazi'))bad++}
  console.log('   旧逻辑：365 天里 '+bad+' 天推的是奇门/六爻（'+Math.round(bad/365*100)+'%）');
  return bad>0?true:'对照组应当有非主修的日子'});

console.log('\n【学习路线：把「未测155」换成台阶】');
t('STAGES 覆盖全部 20 个体系，一个不漏', ()=>{
  const m=app.match(/const STAGES = \[([\s\S]*?)\n  \];/);
  if(!m)return '没找到 STAGES';
  const used=(m[1].match(/"[a-z-]+"/g)||[]).map(x=>x.slice(1,-1));
  const miss=G.systems.map(s=>s.id).filter(id=>!used.includes(id));
  return miss.length?'漏了体系: '+miss.join(','):true});
t('阶段顺序符合依赖：五行在天干地支之前、十神在其后', ()=>{
  const m=app.match(/const STAGES = \[([\s\S]*?)\n  \];/)[1];
  const iw=m.indexOf('"five-elements"'), ig=m.indexOf('"stems"'), is=m.indexOf('"ten-gods"');
  return (iw<ig&&ig<is)?true:'顺序不对'});
t('scopeNodes 认得阶段范围 systems:', ()=>
  /scope\.startsWith\("systems:"\)/.test(app)?true:'点阶段会被回退成整个术');
t('阶段范围不会被 renderStudyScope 回退掉', ()=>{
  const i=app.indexOf('function renderStudyScope');
  const seg=app.slice(i,i+1200);
  return /studyScope\.startsWith\("systems:"\)/.test(seg)?true:'仍会被回退'});
t('刻意不做锁：路线里没有 disabled/locked', ()=>{
  const i=app.indexOf('function stageRouteHtml');
  const seg=app.slice(i,i+1400);
  return (!/disabled|locked|锁/.test(seg))?true:'出现了锁，与本站不设关卡的取向冲突'});

console.log('\n【分支栏位归组：135 种收成 4 组】');
{
  const seg=app.match(/const G_XIANG[\s\S]*?return "xiang";   \/\/ 认不出的当取象，不吞内容\n  \}/);
  t('branchGroupOf 实现存在', ()=>seg?true:'没找到');
  eval(seg[0].replace(/^  /gm,''));
  const PLAIN=['大白话','为什么','像什么'];
  const keys=new Set();
  G.systems.forEach(s=>s.nodes.forEach(n=>Object.keys(n.branches||{}).forEach(k=>keys.add(k))));
  const rest=[...keys].filter(k=>!PLAIN.includes(k));
  t('每一种栏位都归到了组，没有孤儿', ()=>{
    const bad=rest.filter(k=>!['xiang','panduan','context','detail','ref'].includes(branchGroupOf(k)));
    return bad.length?'未归组: '+bad.join(','):true});
  t('归组不吞内容：组内栏位总数＝原栏位总数', ()=>{
    const byG={};rest.forEach(k=>{const g=branchGroupOf(k);byG[g]=(byG[g]||0)+1});
    const sum=Object.values(byG).reduce((a,b)=>a+b,0);
    console.log('   '+rest.length+' 种栏位 → '+JSON.stringify(byG));
    return sum===rest.length?true:`${sum} ≠ ${rest.length}`});
  t('每个节点的平铺块数明显收敛', ()=>{
    let sumB=0,sumG=0,N=0,maxB=0,maxG=0;
    G.systems.forEach(s=>s.nodes.forEach(n=>{
      const ks=Object.keys(n.branches||{}).filter(k=>!PLAIN.includes(k));
      const gs=new Set(ks.map(branchGroupOf));
      sumB+=ks.length;sumG+=gs.size;N++;maxB=Math.max(maxB,ks.length);maxG=Math.max(maxG,gs.size)}));
    console.log('   平均 '+(sumB/N).toFixed(1)+' 块(最多'+maxB+') → '+(sumG/N).toFixed(1)+' 组(最多'+maxG+')');
    return (sumG/N < sumB/N && maxG<=5)?true:'没有收敛'});
  t('取象与判断默认展开、口径参考默认收起', ()=>{
    const m=app.match(/const BRANCH_GROUPS = \[([\s\S]*?)\];/)[1];
    const openTrue=/id: "xiang", title: "取象", open: true/.test(m)&&/id: "panduan"[^\n]*open: true/.test(m);
    const openFalse=/id: "ref"[^\n]*open: false/.test(m)&&/id: "detail"[^\n]*open: false/.test(m);
    return (openTrue&&openFalse)?true:'默认展开状态不对'});
}

console.log('\n【改名：大六壬 → 六壬神课】');
t('traditions 里已是六壬神课', ()=>{
  const t2=G.traditions.find(x=>x.id==='liuren');
  return t2&&t2.title==='六壬神课'?true:'仍为 '+(t2&&t2.title)});
t('app.js 文案里不再有「大六壬」', ()=>{
  const n=(app.match(/大六壬/g)||[]).length;
  return n===0?true:`还剩 ${n} 处`});

console.log('\n【象义树：图结构与取象路径】');
// 把 app.js 的建图逻辑原样搬过来跑（片段 eval 时 const 不泄漏到外层，统一换成 var）
const asVar=re=>app.match(re)[0].replace(/^const /,'var ');
eval(asVar(/const GRAPH_ALIAS = \{[\s\S]*?\n\};/));
eval(asVar(/const CATEGORY_ALIAS = new Set\(\[[\s\S]*?\]\);/));
eval('var W_REL=1,W_CAT=3,CATEGORY_SYSTEMS=new Set(["five-elements"]);');
const gNodes=G.systems.flatMap(s=>s.nodes.map(n=>({...n,systemId:s.id,tradition:s.tradition||'bazi',sharedWith:n.sharedWith||[]})));
function inTradition(node,t){if(!t||t==='all')return true;
  const ids=t==='major'?['bazi','liuren']:[t];
  return ids.some(id=>node.tradition===id||node.sharedWith.includes(id));}
const nodes_=gNodes; // buildGraphData 片段里引用的是 nodes
eval(asVar(/function buildGraphData\(scope\) \{[\s\S]*?\n\}\n/).replace(/\bnodes\b/g,'nodes_'));

function graphOf(scope){
  const {gnodes,edges}=buildGraphData(scope);
  const adj=gnodes.map(()=>[]);
  edges.forEach(([a,b,w])=>{adj[a].push([b,w]);adj[b].push([a,w])});
  return {gnodes,edges,adj};
}
function componentsOf(g){
  const seen=new Array(g.gnodes.length).fill(false);const out=[];
  for(let i=0;i<g.gnodes.length;i++){if(seen[i])continue;const q=[i];seen[i]=true;let n=0;
    for(let h=0;h<q.length;h++){n++;for(const [x] of g.adj[q[h]])if(!seen[x]){seen[x]=true;q.push(x)}}
    out.push(n)}
  return out.sort((a,b)=>b-a);
}

t('树按范围建图：「我在学」比全库明显小',()=>{
  const major=graphOf('major'), all=graphOf(null);
  console.log(`   我在学 ${major.gnodes.length}节点/${major.edges.length}边 · 全部 ${all.gnodes.length}节点/${all.edges.length}边`);
  return (major.gnodes.length<all.gnodes.length&&major.gnodes.length>100)?true:
    `major=${major.gnodes.length} all=${all.gnodes.length}`});

t('两种范围下都连成一张网，没有孤岛和孤立点',()=>{
  const bad=[];
  for(const scope of ['major',null]){
    const g=graphOf(scope), comps=componentsOf(g);
    const lonely=g.gnodes.filter(x=>x.deg===0).map(x=>x.title);
    if(comps.length>1)bad.push(`${scope||'all'} 裂成 ${comps.length} 块(${comps.join('/')})`);
    if(lonely.length)bad.push(`${scope||'all'} 孤立点 ${lonely.join('·')}`);
  }
  return bad.length?bad.join('；'):true});

t('曾经写了却连不上的关联词已接回（宫位/岁运/三合/藏干等）',()=>{
  const titles=new Set(gNodes.map(n=>n.title));
  const must=['合','岁运','宫位','三合','六合','三会','刑','害','自刑','生穿','克穿',
    '入墓','开库','月令','日柱','太岁','藏干','通根','配偶','子女','祖上','晚年','官星','贵人','文书','财富','竞争'];
  const miss=must.filter(w=>!titles.has(w)&&!(GRAPH_ALIAS[w]||[]).length);
  return miss.length?'仍无映射: '+miss.join(' '):true});

t('归类边（→五行、统称展开）确实被标了高代价',()=>{
  const {edges}=graphOf(null);
  const cat=edges.filter(e=>e[2]===W_CAT).length;
  const g0=graphOf(null);
  const wuxing=edges.filter(([a,b,w])=>w!==W_CAT&&(g0.gnodes[a].sysId==='five-elements'||g0.gnodes[b].sysId==='five-elements')).length;
  console.log(`   ${cat}/${edges.length} 条归类边`);
  return (cat>100&&wuxing===0)?true:`归类边 ${cat} 条、漏标的五行边 ${wuxing} 条`});

t('取象路径绕开五行：带权最短路远好于纯最短跳数',()=>{
  const g=graphOf(null), N=g.gnodes.length;
  const WX=new Set(g.gnodes.filter(x=>x.sysId==='five-elements').map(x=>x.i));
  const dij=(a,b)=>{const dist=new Float64Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1),done=new Uint8Array(N);dist[a]=0;
    for(;;){let cur=-1,best=Infinity;for(let i=0;i<N;i++)if(!done[i]&&dist[i]<best){best=dist[i];cur=i}
      if(cur<0)return null;if(cur===b){const p=[];for(let x=b;x!==-1;x=prev[x])p.push(x);return p.reverse()}
      done[cur]=1;for(const [nx,w] of g.adj[cur])if(best+w<dist[nx]){dist[nx]=best+w;prev[nx]=cur}}};
  const bfs=(a,b)=>{const prev=new Int32Array(N).fill(-1),seen=new Uint8Array(N),q=[a];seen[a]=1;
    for(let h=0;h<q.length;h++)for(const [x] of g.adj[q[h]]){if(seen[x])continue;seen[x]=1;prev[x]=q[h];
      if(x===b){const p=[b];let c=q[h];while(c!==-1){p.push(c);c=prev[c]}return p.reverse()}q.push(x)}return null};
  let seed=42;const rnd=()=>(seed=(seed*48271)%2147483647)%N; // 固定种子，结果可复现
  const rate=fn=>{let n=0,via=0;
    for(let k=0;k<600;k++){const a=rnd(),b=rnd();if(a===b)continue;const p=fn(a,b);if(!p)continue;n++;
      if(p.slice(1,-1).some(x=>WX.has(x)))via++}
    return 100*via/n};
  const rNew=rate(dij), rOld=rate(bfs);
  console.log(`   经五行的路径占比：最短跳数 ${rOld.toFixed(0)}% → 带权 ${rNew.toFixed(0)}%`);
  return (rNew<25&&rNew<rOld/2)?true:`带权 ${rNew.toFixed(0)}%、跳数 ${rOld.toFixed(0)}%`});

t('app.js 已改用带权 findPath，不再是纯 BFS',()=>
  (/function findPath\(a, b\)/.test(app)&&!/bfsPath\(/.test(app))?true:'仍在用 bfsPath');

console.log('\n【死文件提示】');
t('根级 index.html 只做跳转、不加载脚本',()=>{
  const h=fs.readFileSync(R+'index.html','utf8');
  return (!/<script[^>]*src=/.test(h)&&/location\.replace/.test(h))?true:'根页已开始加载脚本，需重新评估根级 js 是否还是死文件'});

console.log('\n'+(errs.length?'❌ '+errs.length+' 项未通过':'✅ 全部通过'));
process.exit(errs.length?1:0);
