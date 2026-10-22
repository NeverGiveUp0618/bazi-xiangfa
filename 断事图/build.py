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
:root{--bg:#f6f1e7;--card:#fffdf7;--soft:#f8f3e9;--ink:#2d2721;--muted:#8a7f70;--line:#e6dcc9;
--acc:#b23a26;--acc-ink:#8f2e1e;--acc-soft:#f6e6df;--gold:#9a7b2d;--gold-soft:#f3ecd8;--green:#3e7d5a;--green-soft:#e3efe6}
@media (prefers-color-scheme:dark){:root{--bg:#181512;--card:#221e1a;--soft:#2a251f;--ink:#ece5d8;--muted:#9c9184;--line:#3a332b;
--acc:#d4694f;--acc-ink:#e08a73;--acc-soft:#3a2620;--gold:#c9a44e;--gold-soft:#332c1c;--green:#7fb896;--green-soft:#22312a}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.85 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}
main{max-width:760px;margin:0 auto;padding:0 16px 60px}
.top{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 16px;display:flex;gap:10px;align-items:center}
.top a{color:var(--acc);text-decoration:none;font-size:14px}.top b{flex:1;text-align:center;font-size:15px}
.hero{margin:16px 0 8px;padding:20px 18px;border-radius:16px;color:#fff;background:linear-gradient(135deg,#b23a26,#7a2416)}
.hero small{letter-spacing:.3em;opacity:.8;font-size:11.5px}.hero h1{margin:4px 0 6px;font-family:"Noto Serif SC",Songti SC,serif;font-size:26px;letter-spacing:.08em}
.hero p{margin:0;opacity:.85;font-size:13.5px}
.toc{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 4px}.toc a{font-size:12.5px;padding:4px 10px;border-radius:12px;background:var(--card);border:1px solid var(--line);color:var(--ink);text-decoration:none}
h1.doc-t{display:none}
h2{font-family:"Noto Serif SC",Songti SC,serif;font-size:21px;margin:34px 0 12px;padding:10px 14px;border-radius:12px;background:var(--acc-soft);color:var(--acc-ink);border-left:5px solid var(--acc)}
h3{font-size:17px;margin:24px 0 8px;color:var(--ink);display:flex;align-items:center;gap:8px}
h3::before{content:"";width:6px;height:18px;border-radius:3px;background:var(--gold)}
p,li{font-size:15.5px}
blockquote{margin:12px 0;padding:10px 14px;background:var(--card);border:1px solid var(--line);border-left:4px solid var(--gold);border-radius:10px;color:var(--ink)}
blockquote p{margin:4px 0}
.tw{overflow-x:auto;margin:10px 0;border-radius:12px;border:1px solid var(--line);background:var(--card)}
table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.65}
th{background:var(--gold-soft);color:var(--gold);text-align:left;font-weight:600;white-space:nowrap}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
td:first-child{font-weight:600;white-space:nowrap}
strong{color:var(--acc-ink)}
hr{border:0;border-top:1px dashed var(--line);margin:28px 0}
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
            '<main><div class="hero"><small>断事图 · 样板</small><h1>%s</h1><p>%s</p></div>'
            '<div class="toc">%s</div>%s</main></body></html>') % (
        html.escape(title), CSS, html.escape(sub[0].replace('断事图 · ', '')),
        html.escape(sub[1] if len(sub) > 1 else ''), toc, body)
    os.makedirs(OUT, exist_ok=True)
    name = {'官职': 'guanzhi'}.get(os.path.splitext(os.path.basename(md_path))[0], 'page')
    out = os.path.join(OUT, name + '.html')
    open(out, 'w', encoding='utf-8').write(page)
    print('✓', os.path.relpath(out, ROOT), '%.1f KB' % (len(page.encode()) / 1024))

for p in sorted(glob.glob(os.path.join(HERE, '*.md'))):
    build(p)
