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

CSS = """
/* 阅读材料配色（2026-10-22 用户：原来的朱砂配色「作为阅读材料看着太累」）
   原则：底色柔和不刺眼、正文深灰不纯黑、粗体不变色、朱砂只留给小标记。 */
:root{--bg:#faf8f3;--card:#ffffff;--ink:#33302b;--ink2:#5c574f;--muted:#948c80;--line:#ebe5da;
--acc:#a8573f;--soft:#f3efe7;--th:#f5f1ea}
@media (prefers-color-scheme:dark){:root{--bg:#1c1b19;--card:#242320;--ink:#dcd6cc;--ink2:#b5aea3;--muted:#8d867b;--line:#36332e;
--acc:#c98a6f;--soft:#2a2825;--th:#2a2825}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.95 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;letter-spacing:.01em}
main{max-width:720px;margin:0 auto;padding:0 18px 80px}
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
table{border-collapse:collapse;width:100%;font-size:15px;line-height:1.7}
th{background:var(--th);color:var(--ink2);text-align:left;font-weight:600;white-space:nowrap}
th,td{padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--ink)}
tr:last-child td{border-bottom:0}
td:first-child{white-space:nowrap}
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
            '<title>%s · 象义随身</title><style>%s</style></head><body>'
            '<div class="top"><a href="../mobile/">‹ 象义随身</a><b>断事图</b><span style="width:60px"></span></div>'
            '<main><div class="hero"><small>断事图</small><h1>%s</h1><p>%s</p></div>'
            '<div class="toc">%s</div>%s</main></body></html>') % (
        html.escape(title), CSS, html.escape(sub[0].replace('断事图 · ', '')),
        html.escape(sub[1] if len(sub) > 1 else ''), toc, body)
    os.makedirs(OUT, exist_ok=True)
    name = {'官职': 'gz', '疾病': 'jb', '公司经营': 'gs', '婚姻': 'hy', '官司': 'ss', '房产': 'fc', '学业': 'xy', '出行': 'cx', '子女': 'zn', '职业': 'zy', '父母': 'fm', '兄弟朋友': 'xd', '性格': 'xg', '失物': 'sw'}.get(os.path.splitext(os.path.basename(md_path))[0], 'page')
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

ORDER = ['性格', '官职', '职业', '公司经营', '婚姻', '子女', '疾病', '官司', '房产', '学业', '出行', '父母', '兄弟朋友', '失物']   # 目录页顺序
pages = []
for p in sorted(glob.glob(os.path.join(HERE, '*.md')),
                key=lambda x: ORDER.index(os.path.splitext(os.path.basename(x))[0]) if os.path.splitext(os.path.basename(x))[0] in ORDER else 99):
    build(p)
    md = open(p, encoding='utf-8').read()
    t = re.search(r'^# (.+)$', md, re.M).group(1).replace('断事图 · ', '')
    pages.append((os.path.splitext(os.path.basename(p))[0], t))

# 目录页：index.html 也走 latest.json 跳正文，自己是静态小页，不怕缓存（列表很少改）
names = {'官职': 'gz', '疾病': 'jb', '公司经营': 'gs', '婚姻': 'hy', '官司': 'ss', '房产': 'fc', '学业': 'xy', '出行': 'cx', '子女': 'zn', '职业': 'zy', '父母': 'fm', '兄弟朋友': 'xd', '性格': 'xg', '失物': 'sw'}
items = ''.join('<a class="it" href="%s.html"><b>%s</b><span>%s</span></a>' % (
    names.get(k, 'page'), html.escape(t.split('：')[0]), html.escape(t.split('：')[1] if '：' in t else '')) for k, t in pages)
idx = ('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
       '<title>断事图 · 象义随身</title><style>%s'
       '.it{display:block;padding:16px 18px;margin:10px 0;background:var(--card);border:1px solid var(--line);border-radius:10px;text-decoration:none;color:var(--ink)}'
       '.it b{display:block;font-size:19px;font-family:"Noto Serif SC",Songti SC,serif}.it span{color:var(--ink2);font-size:15px}</style></head><body>'
       '<div class="top"><a href="../mobile/">‹ 象义随身</a><b>断事图</b><span style="width:60px"></span></div>'
       '<main><div class="hero"><small>断事图</small><h1>从一件事读盘</h1>'
       '<p>算不了认知以外的命。每一篇先讲这件事在现实里怎么回事，再讲八字、六壬怎么看，最后是案例和断之前要问清的事。</p></div>%s</main></body></html>') % (CSS, items)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(idx)
print('✓ duanshi/index.html（%d 篇）' % len(pages))
