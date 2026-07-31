#!/bin/bash
D='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/八字象义/bazi_xiangyi_site/mobile'
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
rm -rf /tmp/xym && mkdir -p /tmp/xym && cp -R "$D"/* /tmp/xym/
cat >> /tmp/xym/index.html <<'EOF'
<script>
window.addEventListener('load',function(){setTimeout(function(){
  var i=document.getElementById('searchInput')||document.querySelector('input');
  if(i){i.value='隐秘';i.dispatchEvent(new Event('input',{bubbles:true}));}
  setTimeout(function(){
    var vw=document.documentElement.clientWidth;
    var q=document.getElementById('quickRow');
    var a=q&&q.querySelector('button.active');
    var over=[];
    document.querySelectorAll('*').forEach(function(e){
      var r=e.getBoundingClientRect();
      if(r.width===0)return;
      if(r.right>vw+1)over.push(e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&e.className.toString?'.'+e.className.toString().split(' ')[0]:'')+'@'+Math.round(r.right));
    });
    var ar=a?a.getBoundingClientRect():null;
    document.title='RESULT|vw='+vw
      +'|docW='+document.documentElement.scrollWidth
      +'|quickScrollLeft='+(q?Math.round(q.scrollLeft):'-')
      +'|activeText='+(a?a.textContent:'无')
      +'|activeInView='+(ar?(ar.left>=-1&&ar.right<=vw+1):'-')
      +'|overflowCount='+over.length
      +'|overflow='+over.slice(0,6).join(',');
  },700);
},600);});
</script>
EOF
"$CH" --headless --disable-gpu --window-size=432,760 --virtual-time-budget=7000 \
  --dump-dom "file:///tmp/xym/index.html" 2>/dev/null | grep -o '<title>[^<]*</title>' | head -1
