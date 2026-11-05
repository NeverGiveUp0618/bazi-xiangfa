# -*- coding: utf-8 -*-
"""断事图（样板，2026-10-22）：断事图/*.md → bazi_xiangyi_site/duanshi/*.html

markdown 是源，html 是产物，别手改 html。md 渲染借用命理精讲的 mdlite.py（同一套写法）。
用法：python3 断事图/build.py
"""
import glob, html, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'bazi_xiangyi_site', 'duanshi')
sys.path.insert(0, os.path.join(os.path.dirname(ROOT), 'bazi-course'))
import mdlite  # noqa: E402
import subprocess  # noqa: E402
subprocess.run([sys.executable, os.path.join(HERE, '_mk_wenzhen.py')], check=True)  # 问诊单由各篇汇总，先重做

CSS = """
/* 阅读材料配色（2026-10-22 用户：原来的朱砂配色「作为阅读材料看着太累」）
   原则：底色柔和不刺眼、正文深灰不纯黑、粗体不变色、朱砂只留给小标记。 */
:root{--bg:#faf8f3;--card:#ffffff;--ink:#33302b;--ink2:#5c574f;--muted:#948c80;--line:#ebe5da;
--acc:#a8573f;--soft:#f3efe7;--th:#f5f1ea}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1c1b19;--card:#242320;--ink:#dcd6cc;--ink2:#b5aea3;--muted:#8d867b;--line:#36332e;
--acc:#c98a6f;--soft:#2a2825;--th:#2a2825}}
:root[data-theme="dark"]{--bg:#1c1b19;--card:#242320;--ink:#dcd6cc;--ink2:#b5aea3;--muted:#8d867b;--line:#36332e;
--acc:#c98a6f;--soft:#2a2825;--th:#2a2825}
.theme-btn{width:60px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--muted);font-size:12px;padding:3px 0;cursor:pointer;font-family:inherit}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.95 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;letter-spacing:.01em}
main{max-width:720px;margin:0 auto;padding:0 18px 80px}
@media (min-width:1000px){main:not(.ix){max-width:980px}}
.top{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 16px;display:flex;gap:10px;align-items:center}
.top a{color:var(--muted);text-decoration:none;font-size:14px}.top b{flex:1;text-align:center;font-size:15px;font-weight:500;color:var(--ink2)}
.hero{margin:28px 0 10px;padding:0 0 18px;border-bottom:1px solid var(--line)}
.hero small{letter-spacing:.24em;color:var(--acc);font-size:12px}
.hero h1{margin:6px 0 4px;font-family:"Noto Serif SC",Songti SC,serif;font-size:28px;font-weight:600;letter-spacing:.06em;color:var(--ink)}
.hero p{margin:0;color:var(--ink2);font-size:15px}
.toc{display:flex;flex-wrap:wrap;gap:4px 14px;margin:14px 0 6px}
.toc a{font-size:14px;color:var(--ink2);text-decoration:none;border-bottom:1px dotted var(--muted)}
h2{font-family:"Noto Serif SC",Songti SC,serif;font-size:22px;font-weight:600;margin:48px 0 14px;padding-bottom:8px;border-bottom:1px solid var(--line);color:var(--ink)}
h3{font-size:18px;font-weight:600;margin:30px 0 8px;color:var(--ink)}
h3::before{content:"";display:inline-block;width:4px;height:15px;border-radius:2px;background:var(--acc);margin-right:8px;vertical-align:-1px;opacity:.7}
p,li{font-size:17px;color:var(--ink)}
strong{color:inherit;font-weight:600}
blockquote{margin:14px 0;padding:12px 16px;background:var(--soft);border-radius:8px;color:var(--ink2);border:0}
blockquote p,blockquote li{margin:4px 0;font-size:16px;color:var(--ink2)}
.tw{overflow-x:auto;margin:12px 0;border:1px solid var(--line);border-radius:8px;background:var(--card)}
table{border-collapse:collapse;width:max-content;min-width:100%;font-size:15px;line-height:1.7}
th{background:var(--th);color:var(--ink2);text-align:left;font-weight:600;white-space:normal}
th,td{padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--ink)}
tr:last-child td{border-bottom:0}
td:first-child{white-space:normal}
th,td{min-width:6em;overflow-wrap:anywhere}td{max-width:24em}th:first-child,td:first-child{min-width:4.5em;max-width:24em}
hr{border:0;border-top:1px solid var(--line);margin:36px 0}
ul{padding-left:1.2em}
"""

def build(md_path):
    md = open(md_path, encoding='utf-8').read()
    title = re.search(r'^# (.+)$', md, re.M).group(1).strip()
    sub = title.split('：', 1)
    body = mdlite.md2html(md, heading_offset=0) if 'heading_offset' in mdlite.md2html.__code__.co_varnames else mdlite.md2html(md)
    body = re.sub(r'<h1[^>]*>.*?</h1>', '', body, count=1, flags=re.S)
    heads = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body)
    toc = ''.join('<a href="#%s">%s</a>' % (i, re.sub(r'<[^>]+>', '', t).split('：')[0]) for i, t in heads)
    page = ('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>%s · 象义随身</title><script>(function(){try{var t=localStorage.getItem("xy_theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script><style>%s</style></head><body>'
            '<div class="top"><a href="../mobile/">‹ 象义随身</a><b>断事图</b><button type="button" class="theme-btn" id="themeBtn">☾ 黑</button></div>'
            '<main><div class="hero"><small>断事图</small><h1>%s</h1><p>%s</p></div>'
            '<div class="toc">%s</div>%s<p style="margin:40px 0 0;padding-top:14px;border-top:1px solid var(--line);font-size:14px;color:var(--muted)">延伸：<a href="https://nevergiveup0618.github.io/bazi-course/" style="color:var(--acc)">命理精讲（八字）</a>　<a href="https://nevergiveup0618.github.io/liuren-course/" style="color:var(--acc)">六壬神课（课程·案例）</a></p></main><script>(function(){var b=document.getElementById("themeBtn");if(!b)return;var r=document.documentElement;function e(){var t=r.getAttribute("data-theme");if(t)return t;return(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light"}function p(){b.textContent=e()==="dark"?"☀ 白":"☾ 黑"}b.addEventListener("click",function(){var n=e()==="dark"?"light":"dark";r.setAttribute("data-theme",n);try{localStorage.setItem("xy_theme",n)}catch(x){}p()});p()})();</script></body></html>') % (
        html.escape(title), CSS, html.escape(sub[0].replace('断事图 · ', '')),
        html.escape(sub[1] if len(sub) > 1 else ''), toc, body)
    os.makedirs(OUT, exist_ok=True)
    name = {'官职': 'gz', '疾病': 'jb', '公司经营': 'gs', '婚姻': 'hy', '官司': 'ss', '房产': 'fc', '学业': 'xy', '出行': 'cx', '子女': 'zn', '职业': 'zy', '父母': 'fm', '兄弟朋友': 'xd', '性格': 'xg', '失物': 'sw', '财运': 'cy', '感情': 'gq', '意外': 'yw', '寿元': 'sy', '小人是非': 'xr', '来意': 'ly', '问诊单': 'wz', '人生年龄': 'nl', '层次': 'cc', '合作': 'hz', '考公': 'kg', '示范': 'sf', '流年': 'ln', '进退': 'jt', '相貌': 'xm', '玄学': 'xs', '合婚': 'hh', '时辰': 'sc', '化解': 'hj'}.get(os.path.splitext(os.path.basename(md_path))[0], 'page')
    # ⚠️ 微信 X5 按路径缓存、刷新也不重新取（2026-10-22 用户改配色后「刷新了没变」）：
    #    正文写成带内容哈希的文件名 name.<hash>.html；固定入口 name.html 只是个跳转页，
    #    它用 fetch(no-store) 读 latest.json 找到当前哈希再跳——跳转页本身就算被缓存也不影响拿到新版。
    import hashlib, json
    h = hashlib.md5(page.encode()).hexdigest()[:8]
    for old in glob.glob(os.path.join(OUT, name + '.*.html')):
        os.remove(old)
    open(os.path.join(OUT, '%s.%s.html' % (name, h)), 'w', encoding='utf-8').write(page)
    lp = os.path.join(OUT, 'latest.json')
    latest = json.load(open(lp)) if os.path.exists(lp) else {}
    latest[name] = '%s.%s.html' % (name, h)
    json.dump(latest, open(lp, 'w'), ensure_ascii=False, indent=1)
    loader = ('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
              '<meta name="viewport" content="width=device-width,initial-scale=1">'
              '<meta http-equiv="Cache-Control" content="no-cache"><title>%s</title></head>'
              '<body style="background:#faf8f3;color:#948c80;font:15px sans-serif;text-align:center;padding-top:40vh">载入中…'
              '<script>fetch("latest.json",{cache:"no-store"}).then(function(r){return r.json()})'
              '.then(function(m){location.replace(m["%s"]+location.hash)})'
              '.catch(function(){location.replace("%s"+location.hash)});</script></body></html>') % (
        html.escape(title), name, latest[name])
    open(os.path.join(OUT, name + '.html'), 'w', encoding='utf-8').write(loader)
    if name == 'gz':   # 旧网址（第一版发出去的链接）也做成跳转页
        open(os.path.join(OUT, 'guanzhi.html'), 'w', encoding='utf-8').write(loader)
    print('✓ duanshi/%s.html → %s（%.1f KB）' % (name, latest[name], len(page.encode()) / 1024))

ORDER = ['来意', '时辰', '问诊单', '示范', '流年', '性格', '相貌', '官职', '考公', '职业', '进退', '财运', '公司经营', '合作', '感情', '婚姻', '合婚', '子女', '疾病', '意外', '寿元', '官司', '房产', '学业', '出行', '父母', '兄弟朋友', '小人是非', '失物', '玄学', '化解', '人生年龄', '层次']   # 目录页顺序
pages = []
for p in sorted(glob.glob(os.path.join(HERE, '*.md')),
                key=lambda x: ORDER.index(os.path.splitext(os.path.basename(x))[0]) if os.path.splitext(os.path.basename(x))[0] in ORDER else 99):
    build(p)
    md = open(p, encoding='utf-8').read()
    t = re.search(r'^# (.+)$', md, re.M).group(1).replace('断事图 · ', '')
    pages.append((os.path.splitext(os.path.basename(p))[0], t))

# 目录页：index.html 也走 latest.json 跳正文，自己是静态小页，不怕缓存（列表很少改）
names = {'官职': 'gz', '疾病': 'jb', '公司经营': 'gs', '婚姻': 'hy', '官司': 'ss', '房产': 'fc', '学业': 'xy', '出行': 'cx', '子女': 'zn', '职业': 'zy', '父母': 'fm', '兄弟朋友': 'xd', '性格': 'xg', '失物': 'sw', '财运': 'cy', '感情': 'gq', '意外': 'yw', '寿元': 'sy', '小人是非': 'xr', '来意': 'ly', '问诊单': 'wz', '人生年龄': 'nl', '层次': 'cc', '合作': 'hz', '考公': 'kg', '示范': 'sf', '流年': 'ln', '进退': 'jt', '相貌': 'xm', '玄学': 'xs', '合婚': 'hh', '时辰': 'sc', '化解': 'hj'}
GROUPS = [
    ('start', '入门四步', '先走这四步，再翻具体的事', '#a8573f', ['来意', '时辰', '问诊单', '示范']),
    ('ren', '看人', '这个人是什么样的人、在哪一档', '#5f7ba6', ['性格', '相貌', '层次', '人生年龄']),
    ('work', '事业财运', '官、职、财、学、合作', '#b07a1a', ['官职', '考公', '职业', '进退', '财运', '公司经营', '合作', '学业']),
    ('love', '感情家庭', '感情、婚姻、子女、六亲', '#b85c7a', ['感情', '婚姻', '合婚', '子女', '父母', '兄弟朋友']),
    ('fate', '运势健康', '流年、疾病、意外、寿元，以及断出凶之后', '#4f8a6d', ['流年', '疾病', '意外', '寿元', '化解']),
    ('misc', '事件杂项', '官司、房产、出行、失物、是非、玄学', '#7a6aa8', ['官司', '房产', '出行', '失物', '小人是非', '玄学']),
]
tmap = dict(pages)
used = set()

def tile(k, color, step=None):
    t = tmap.get(k, k)
    a, b = (t.split('：', 1) + [''])[:2]
    used.add(k)
    badge = ('<i class="ng" style="--c:%s">%d</i>' % (color, step)) if step else ('<i class="ng" style="--c:%s">%s</i>' % (color, html.escape(k[0])))
    return ('<a class="tl" href="%s.html" data-k="%s" data-q="%s" style="--c:%s">%s<div><b>%s</b><span>%s</span></div></a>'
            % (names.get(k, 'page'), html.escape(k), html.escape(k + a + b), color, badge, html.escape(a), html.escape(b)))

secs = ''
for gid, gname, gdesc, color, keys in GROUPS:
    keys = [k for k in keys if k in tmap]
    if gid == 'start':
        body = ''.join(tile(k, color, n + 1) for n, k in enumerate(keys))
        secs += '<section class="gp flow" data-g="%s"><h2>%s<small>%s</small></h2><div class="grid">%s</div></section>' % (gid, gname, gdesc, body)
    else:
        secs += ('<section class="gp" data-g="%s" style="--c:%s"><h2>%s<em>%d</em><small>%s</small></h2><div class="grid">%s</div></section>'
                 % (gid, color, gname, len(keys), gdesc, ''.join(tile(k, color) for k in keys)))
left = [k for k, _ in pages if k not in used]
if left:   # 新写了篇目但还没分组：先放进「更多」，别丢
    secs += '<section class="gp" data-g="more" style="--c:#8d867b"><h2>更多<em>%d</em></h2><div class="grid">%s</div></section>' % (len(left), ''.join(tile(k, '#8d867b') for k in left))

IDX_CSS = """
main.ix{max-width:980px}
.ix .hero{border:0;padding-bottom:6px}
.ix .hero p{max-width:34em}
.stat{display:flex;gap:18px;margin:14px 0 4px;color:var(--ink2);font-size:13px}
.stat b{font-size:22px;font-family:"Noto Serif SC",Songti SC,serif;color:var(--acc);margin-right:4px}
.resume{display:none;margin:12px 0 0;padding:12px 16px;border-radius:12px;background:var(--soft);text-decoration:none;color:var(--ink);font-size:14.5px;border:1px solid var(--line)}
.resume.on{display:flex;justify-content:space-between;align-items:center}
.resume b{color:var(--acc)}
.sch{position:relative;margin:18px 0 6px}
.sch input{width:100%;height:44px;border:1px solid var(--line);border-radius:22px;background:var(--card);color:var(--ink);padding:0 18px;font-size:15px;outline:0}
.sch input:focus{border-color:var(--acc)}
.gp{margin:26px 0 0}
.gp h2{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:0 0 12px;padding:0;border:0;font-size:19px}
.gp h2::before{content:"";align-self:center;width:5px;height:18px;border-radius:3px;background:var(--c,var(--acc))}
.gp h2 em{font-style:normal;font-size:12px;color:var(--muted);font-family:-apple-system,sans-serif}
.gp h2 small{flex-basis:100%;margin-left:13px;font-size:13px;font-weight:400;color:var(--muted);font-family:-apple-system,sans-serif}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.tl{display:flex;gap:11px;align-items:flex-start;padding:13px 13px;border-radius:14px;background:var(--card);border:1px solid var(--line);text-decoration:none;color:var(--ink);
border-left:4px solid var(--c);box-shadow:0 1px 3px rgba(80,50,20,.05);transition:transform .12s,box-shadow .12s}
.tl:active{transform:scale(.985)}
.tl .ng{flex:none;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-style:normal;font-size:16px;font-weight:700;font-family:"Noto Serif SC",Songti SC,serif;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent)}
.tl div{min-width:0}
.tl b{display:block;font-size:16px;line-height:1.35;font-family:"Noto Serif SC",Songti SC,serif}
.tl span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:3px;font-size:12.5px;line-height:1.5;color:var(--muted)}
.flow .grid{counter-reset:s}
.flow .tl{border-left:1px solid var(--line);border-top:4px solid var(--c);background:linear-gradient(180deg,color-mix(in srgb,var(--c) 7%,var(--card)),var(--card))}
.flow .tl .ng{background:var(--c);color:#fff;border-radius:50%;width:30px;height:30px;font-size:15px}
.none{display:none;text-align:center;color:var(--muted);padding:30px 0}
@media (min-width:700px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.flow .grid{grid-template-columns:repeat(4,minmax(0,1fr))}.tl:hover{box-shadow:0 4px 14px rgba(80,50,20,.1);transform:translateY(-1px)}}
@media (min-width:1000px){.grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
"""
IDX_JS = """
(function(){
  var KEY='ds-last';
  var tiles=[].slice.call(document.querySelectorAll('.tl'));
  tiles.forEach(function(t){t.addEventListener('click',function(){try{localStorage.setItem(KEY,t.dataset.k)}catch(e){}})});
  try{var k=localStorage.getItem(KEY),t=tiles.filter(function(x){return x.dataset.k===k})[0],r=document.getElementById('resume');
    if(t&&r){r.href=t.getAttribute('href');r.querySelector('b').textContent=t.querySelector('b').textContent;r.classList.add('on')}}catch(e){}
  var q=document.getElementById('q');
  q.addEventListener('input',function(){
    var w=q.value.trim().split(/\\s+/).filter(Boolean),any=false;
    tiles.forEach(function(t){var ok=w.every(function(x){return t.dataset.q.indexOf(x)>=0});t.style.display=ok?'':'none';if(ok)any=true});
    [].forEach.call(document.querySelectorAll('.gp'),function(g){g.style.display=[].some.call(g.querySelectorAll('.tl'),function(t){return t.style.display!=='none'})?'':'none'});
    document.getElementById('none').style.display=any?'none':'block';
  });
})();
"""
idx = ('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
       '<title>断事图 · 象义随身</title><script>(function(){try{var t=localStorage.getItem("xy_theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script><style>%s%s</style></head><body>'
       '<div class="top"><a href="../mobile/">‹ 象义随身</a><b>断事图</b><button type="button" class="theme-btn" id="themeBtn">☾ 黑</button></div>'
       '<main class="ix"><div class="hero"><small>断事图</small><h1>从一件事读盘</h1>'
       '<p>算不了认知以外的命。每一篇先讲这件事在现实里怎么回事，再讲八字、六壬怎么看，最后是案例和断之前要问清的事。</p>'
       '<div class="stat"><span><b>%d</b>篇</span><span><b>%d</b>类事</span></div>'
       '<a class="resume" id="resume" href="#"><span>继续上次：<b></b></span><span>›</span></a></div>'
       '<div class="sch"><input id="q" type="search" placeholder="搜一件事，如：婚姻 跳槽 失物" autocomplete="off"></div>'
       '%s<p class="none" id="none">没有找到。换个词试试。</p></main><script>(function(){var b=document.getElementById("themeBtn");if(!b)return;var r=document.documentElement;function e(){var t=r.getAttribute("data-theme");if(t)return t;return(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light"}function p(){b.textContent=e()==="dark"?"☀ 白":"☾ 黑"}b.addEventListener("click",function(){var n=e()==="dark"?"light":"dark";r.setAttribute("data-theme",n);try{localStorage.setItem("xy_theme",n)}catch(x){}p()});p()})();</script><script>%s</script></body></html>') % (
    CSS, IDX_CSS, len(pages), len(GROUPS) - 1, secs, IDX_JS)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(idx)
print('✓ duanshi/index.html（%d 篇）' % len(pages))
