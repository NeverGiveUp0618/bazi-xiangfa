const fs=require('fs'),{JSDOM,VirtualConsole}=require('jsdom');
const M='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/八字象义/bazi_xiangyi_site/mobile/';
const errs=[];const vc=new VirtualConsole();
vc.on('jsdomError',e=>{if(!/scrollTo|Not implemented|canvas|getContext/.test(e.message))errs.push(e.message)});
let html=fs.readFileSync(M+'index.html','utf8');
['data.js','cross_arts_data.js','app.js'].forEach(f=>{
  if(fs.existsSync(M+f)){const body=fs.readFileSync(M+f,'utf8');
    html=html.replace(`<script src="${f}"></script>`, () => '<script>'+body+'<'+'/script>');}
});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',virtualConsole:vc});
setTimeout(()=>{const w=dom.window;
  const t=(n,f)=>{try{const r=f();console.log((r===true?'✓ ':'✗ ')+n+(r===true?'':' → '+r));if(r!==true)errs.push(n)}catch(e){console.log('✗ '+n+' → '+e.message);errs.push(n)}};
  t('页面无脚本错误',()=>errs.length===0?true:errs.slice(0,2).join('|'));
  t('BAZI_GRAPH 已挂载',()=>{
    if(!w.BAZI_GRAPH)return '未挂载';
    const sys=w.BAZI_GRAPH.systems, nodes=sys.flatMap(s=>s.nodes);
    console.log(`   运行时：${sys.length} 体系 / ${nodes.length} 节点`);
    return sys.length>=11?true:'体系仅 '+sys.length;});
  t('makeContextQuestion 连出200题不崩且选项4个唯一',()=>{
    const nodes=w.BAZI_GRAPH.systems.flatMap(s=>s.nodes);let made=0,bad=[];
    for(let i=0;i<400&&made<200;i++){
      const n=nodes[Math.floor(Math.random()*nodes.length)];
      const q=w.makeContextQuestion?w.makeContextQuestion(n,nodes):null;
      if(!q)continue;made++;
      const texts=q.options.map(o=>o.text);
      if(new Set(texts).size!==texts.length)bad.push('选项重复:'+q.prompt);
      if(q.options.filter(o=>o.correct).length!==1)bad.push('正解数≠1:'+q.prompt);
    }
    return bad.length?bad.slice(0,2).join(' | '):(made>=50?true:'只出了'+made+'题');
  });
  /* ---- 象义树 ---- */
  const doc=w.document;
  const click=elm=>elm.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  t('进得了象义树（搜索→详情→关联网络）',()=>{
    const input=doc.querySelector('#globalSearch');
    input.value='甲木';
    input.dispatchEvent(new w.Event('input',{bubbles:true}));
    const card=doc.querySelector('#searchBody [data-open-node]');
    if(!card)return '搜不到结果卡';
    click(card);
    const entry=doc.querySelector('.detail-tree-entry');
    if(!entry)return '详情页没有「查看关联网络」入口';
    click(entry);
    return doc.querySelector('#view-tree').classList.contains('active')?true:'树没打开';
  });
  t('树默认只铺「我在学」范围，不是全部 20 体系',()=>{
    const label=doc.querySelector('#treeScope').textContent;
    const legend=doc.querySelectorAll('#treeLegend button').length;
    console.log(`   范围按钮：${label}；图例 ${legend} 个体系`);
    const count=Number(label.split('·')[1]);
    return (label.includes('我在学')&&count>0&&count<201&&legend<20)?true:`按钮=${label} 图例=${legend}`;
  });
  t('信息卡能收起，只留标题那一行',()=>{
    const info=doc.querySelector('#treeInfo');
    const card=doc.querySelector('#treeInfo .tree-card');
    if(!card)return '当前不是卡片状态';
    const fold=doc.querySelector('[data-tree-fold]');
    if(!fold)return '没有收起把手';
    click(fold);
    const folded=info.classList.contains('folded');
    click(doc.querySelector('[data-tree-fold]'));
    const back=info.classList.contains('folded');
    return (folded&&!back)?true:`收起=${folded} 再点=${back}`;
  });
  t('收起状态会记住',()=>{
    const fold=doc.querySelector('[data-tree-fold]');
    click(fold);
    const saved=w.localStorage.getItem('bazi_xiangyi_mobile_v2__treeInfoFolded');
    click(doc.querySelector('[data-tree-fold]'));
    return saved==='true'?true:'未写入存储，实为 '+saved;
  });
  t('范围按钮能切到全部再切回来',()=>{
    const btn=doc.querySelector('#treeScope');
    click(btn);
    const all=btn.textContent, allLegend=doc.querySelectorAll('#treeLegend button').length;
    click(btn);
    const back=btn.textContent;
    return (Number(all.split('·')[1])===201&&allLegend===20&&back.includes('我在学'))
      ?true:`切全部=${all}(图例${allLegend}) 切回=${back}`;
  });
  t('布局已缓存，二次进树不再重跑力导向',()=>{
    const keys=Object.keys(w.localStorage).filter(k=>k.includes('treeLayout__'));
    return keys.length?true:'没写入 treeLayout 缓存';
  });
  t('每条关联边都说得出理由（零兜底）',()=>{
    const r=w.eval(`(function(){
      const {gnodes,edges}=buildGraphData(null);
      const bad=[];
      for(const [i,j,w,via] of edges){
        const a=nodeById.get(gnodes[i].id), b=nodeById.get(gnodes[j].id);
        const why=via?(via.from===i?explainEdge(a,b,via.word):explainEdge(b,a,via.word)):explainPair(a,b);
        if(!why||why===FALLBACK_WHY)bad.push(gnodes[i].title+'—'+gnodes[j].title);
      }
      return {n:edges.length,bad};
    })()`);
    console.log(`   ${r.n} 条边`);
    return r.bad.length?`${r.bad.length} 条没理由：`+r.bad.slice(0,3).join(' '):true;
  });

  console.log('\n'+(errs.length?'❌ '+errs.length:'✅ 冒烟通过'));
  process.exit(errs.length?1:0);
},2500);
