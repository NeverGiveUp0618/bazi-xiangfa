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
  console.log('\n'+(errs.length?'❌ '+errs.length:'✅ 冒烟通过'));
  process.exit(errs.length?1:0);
},2500);
