# -*- coding: utf-8 -*-
"""断事图 → PDF 学习册（2026-11-09）。md 是源；每篇末尾带「练习」选择题（题库/*.json），答案附在该篇之后。
用法：python3 断事图/pdf_duanshi.py [--out path]
配色：薰衣草紫（区别于盲派的朱砂檀香、命理精讲的青瓷黛墨）。
"""
import datetime, html as H, io, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(os.path.dirname(ROOT), 'bazi-course'))
import mdlite  # noqa: E402

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
OUTDIR = '/Users/xiaojin/Documents/八笔记md/八字课程资料（服务器）/学习册'
subprocess.run([sys.executable, os.path.join(HERE, '_mk_wenzhen.py')], check=True)

GROUPS = [
    ('入门四步', '先走这四步，再翻具体的事', ['来意', '时辰', '问诊单', '示范']),
    ('看人', '这个人是什么样的人、在哪一档', ['性格', '相貌', '层次', '人生年龄']),
    ('事业财运', '官、职、财、学、合作', ['官职', '考公', '职业', '进退', '财运', '公司经营', '合作', '学业']),
    ('感情家庭', '感情、婚姻、子女、六亲', ['感情', '婚姻', '合婚', '子女', '父母', '兄弟朋友']),
    ('运势健康', '流年、疾病、意外、寿元，以及断出凶之后', ['流年', '疾病', '意外', '寿元', '化解']),
    ('事件杂项', '官司、房产、出行、失物、天气、求人、是非、玄学', ['官司', '房产', '出行', '失物', '小人是非', '天气', '求人', '玄学']),
]
L = 'ABCD'


def page_md(name):
    md = io.open(os.path.join(HERE, name + '.md'), encoding='utf-8').read()
    bf = os.path.join(HERE, '题库', name + '.json')
    qd = json.load(io.open(bf, encoding='utf-8')) if os.path.exists(bf) else None
    if qd and qd.get('brief') and '\n---\n' in md:
        blk = '\n## 先看这一页：抓住这一篇的 %d 条\n\n%s\n\n---\n' % (len(qd['brief']), '\n'.join('%d. %s' % (i + 1, t) for i, t in enumerate(qd['brief'])))
        i = md.index('\n---\n') + 5
        md = md[:i] + blk + md[i:]
    title = re.search(r'^# (.+)$', md, re.M).group(1).replace('断事图 · ', '').strip()
    body = mdlite.md2html(md)
    body = re.sub(r'<h1[^>]*>.*?</h1>', '', body, count=1, flags=re.S)
    body = body.replace('⭐', '★').replace('⚠️', '▲').replace('✅', '✓')
    body = re.sub(r'</?a\b[^>]*>', '', body)                 # 链接在纸上没用，留文字
    body = re.sub(r'<details\b([^>]*)>', r'<details open\1>', body)
    return title, body, qd


def quiz_html(qd):
    if not qd:
        return ''
    off = set(qd.get('off', []))
    items = [(n, q) for n, q in enumerate(qd['qs'], 1) if n not in off]
    out = ['<section class="quiz"><h3 class="qh">练习 · 选择题（%d 题）</h3>' % len(items)]
    keys, exps = [], []
    for i, (n, q) in enumerate(items, 1):
        opts = [q[1]] + list(q[2])
        k = (n * 7 + len(q[0])) % 4                       # 固定、可复现的正确答案位置
        opts = opts[1:1 + k] + [opts[0]] + opts[1 + k:]
        keys.append('%d%s' % (i, L[k]))
        exps.append('<li><b>%d%s</b>　%s<span class="src"> %s</span></li>' % (i, L[k], H.escape(q[3] or ''), H.escape(('· 见 ' + q[4]) if len(q) > 4 and q[4] else '')))
        out.append('<div class="q"><p class="qt"><b>%d.</b> %s</p><ol class="opts">%s</ol></div>' % (
            i, H.escape(q[0]), ''.join('<li><span class="ol">%s</span>%s</li>' % (L[j], H.escape(o)) for j, o in enumerate(opts))))
    out.append('<div class="key"><b>参考答案</b>：%s<ul class="exps">%s</ul></div></section>' % ('　'.join(keys), ''.join(exps)))
    return ''.join(out)


CSS = u'''
@page { size: A4; margin: 18mm 17mm 21mm 17mm; background: #f7f4fb;
  @bottom-center { content: counter(page); font-family: "Songti SC", serif; font-size: 10pt; color: #7a6a9c; }
  @bottom-left { content: "象义随身 · 断事图"; font-family: "Songti SC", serif; font-size: 9pt; color: #b3a8cc; }
}
@page :first { margin: 0; @bottom-center { content: none; } @bottom-left { content: none; } }
:root{ --paper:#f7f4fb; --ink:#2b2735; --muted:#6c6580; --h:#5b4a8a; --accent:#9a7fc4; --line:#d9d0e8; --soft:#ece6f6; }
*{box-sizing:border-box}
html{background:#fff}
body{margin:0;font-family:"Songti SC","STSong",serif;font-size:12pt;line-height:1.85;color:var(--ink);background:var(--paper);-webkit-print-color-adjust:exact;print-color-adjust:exact}
p{margin:.45em 0;text-align:justify;orphans:2;widows:2}
strong,b{color:var(--h)}
.cover{height:297mm;page-break-after:always;display:flex;flex-direction:column;justify-content:center;padding:0 24mm;background:linear-gradient(160deg,#f7f4fb 0%,#e4dcf2 100%);position:relative}
.cover:before{content:"";position:absolute;left:14mm;top:14mm;right:14mm;bottom:14mm;border:1.2pt solid var(--accent);border-radius:3mm}
.cover .kk{letter-spacing:.6em;color:var(--accent);font-size:13pt;margin-bottom:10mm}
.cover h1{font-family:"Kaiti SC","STKaiti",serif;font-size:56pt;line-height:1.25;margin:0 0 6mm;color:var(--h);letter-spacing:.12em}
.cover .sub{font-size:16pt;color:var(--muted);margin-bottom:18mm}
.cover .meta{font-size:12pt;color:var(--muted);line-height:2}
.cover .seal{position:absolute;right:26mm;bottom:30mm;width:26mm;height:26mm;border:2pt solid #b0577a;color:#b0577a;display:grid;place-items:center;font-family:"Kaiti SC",serif;font-size:19pt;line-height:1.2;text-align:center;border-radius:2mm;transform:rotate(-6deg)}
.toc{page-break-after:always}
.toc h2{font-family:"Kaiti SC",serif;font-size:26pt;color:var(--h);text-align:center;margin:8mm 0;letter-spacing:.3em}
.toc .part{font-family:"Kaiti SC",serif;font-size:17pt;color:var(--h);margin:6mm 0 2mm;padding-bottom:1mm;border-bottom:1pt solid var(--accent)}
.toc .part small{font-size:10.5pt;color:var(--muted);font-family:"Songti SC",serif;margin-left:3mm}
.toc ol{margin:0;padding:0;list-style:none;columns:2;column-gap:10mm}
.toc li{font-size:11.5pt;line-height:1.75;break-inside:avoid}
.toc li a{color:inherit;text-decoration:none;display:flex;align-items:baseline}
.toc li em{font-style:normal;margin-left:auto;color:var(--muted);padding-left:2mm}
.toc li a span.d{flex:1;border-bottom:.6pt dotted var(--line);margin:0 1.5mm}
.toc li i{font-style:normal;color:var(--accent);display:inline-block;width:2.2em}
.how{page-break-after:always}
.how h2{font-family:"Kaiti SC",serif;font-size:22pt;color:var(--h);margin:4mm 0 4mm}
.partpage{height:250mm;page-break-before:always;page-break-after:always;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.partpage h1{font-family:"Kaiti SC",serif;font-size:62pt;color:var(--h);letter-spacing:.3em;margin:0 0 8mm;padding-left:.3em}
.partpage p{font-size:14pt;color:var(--muted);max-width:120mm;text-align:center}
.partpage .rule{width:40mm;height:1.4pt;background:var(--accent);margin:0 0 8mm}
.chap{page-break-before:always}
.chead{margin:0 0 7mm;padding-bottom:4mm;border-bottom:1.4pt solid var(--accent)}
.chead .ck{color:var(--accent);letter-spacing:.35em;font-size:11.5pt;margin-bottom:2mm}
.chead h1{font-family:"Kaiti SC","STKaiti",serif;font-size:25pt;line-height:1.3;margin:0;color:var(--h)}
.doc h2{font-family:"Kaiti SC",serif;font-size:18pt;color:var(--h);margin:8mm 0 3mm;line-height:1.4;page-break-after:avoid;padding:1.2mm 0 1.2mm 3.5mm;border-left:2.6pt solid var(--accent);background:linear-gradient(90deg,var(--soft),transparent)}
.doc h3{font-family:"Kaiti SC",serif;font-size:15pt;color:#7058a8;margin:6mm 0 2mm;page-break-after:avoid}
.doc h4{font-size:13.5pt;color:var(--h);margin:4mm 0 1mm;page-break-after:avoid}
.doc ul,.doc ol{margin:.4em 0 .6em;padding-left:1.5em}
.doc li{margin:.18em 0}
blockquote{margin:3mm 0;padding:2.5mm 4mm;background:var(--soft);border-left:2.4pt solid var(--accent);border-radius:0 2mm 2mm 0;font-size:11.6pt}
blockquote p{margin:.25em 0}
hr{border:0;border-top:.8pt solid var(--line);margin:5mm 0}
.tw{margin:3mm 0;overflow:visible}
table{border-collapse:collapse;width:100%;font-size:10.6pt;line-height:1.6}
th,td{border:.6pt solid var(--line);padding:1.4mm 2.2mm;vertical-align:top;overflow-wrap:anywhere}
th{background:#e2d9f1;color:var(--h);font-weight:700}
tr{page-break-inside:avoid}
q{quotes:none;color:var(--h)}
details{margin:2.5mm 0;padding:2mm 3.5mm;background:#f0ebf8;border-left:2.2pt solid var(--accent);border-radius:0 2mm 2mm 0;font-size:11.6pt}
details summary{font-weight:700;color:var(--h);list-style:none}
details summary::-webkit-details-marker{display:none}
.quiz{margin-top:9mm;padding-top:4mm;border-top:1.2pt dashed var(--accent)}
.quiz .qh{font-family:"Kaiti SC",serif;font-size:17pt;color:var(--h);margin:0 0 3mm}
.q{margin:3mm 0;page-break-inside:avoid}
.qt{margin:0 0 1mm;font-size:12.6pt}
.opts{list-style:none;margin:0;padding:0 0 0 1.4em}
.opts li{margin:.5mm 0;font-size:12pt;line-height:1.7}
.opts .ol{display:inline-block;width:1.5em;color:var(--accent);font-weight:700}
.key{margin-top:4mm;padding:3mm 4mm;background:var(--soft);border-radius:2mm;font-size:11.8pt}
.exps{margin:2mm 0 0;padding-left:0;list-style:none;font-size:10.8pt;line-height:1.7;color:var(--muted)}
.exps li{margin:1mm 0}
.src{color:#9a90b3;font-size:10pt}
'''


def build(out=None, nums=None):
    nums = nums or {}
    toc = ['<section class="toc"><h2>目　录</h2>']
    body, n = [], 0
    for gi, (g, intro, names) in enumerate(GROUPS):
        toc.append('<div class="part">%s<small>%s</small></div><ol>' % (g, H.escape(intro)))
        body.append('<section class="partpage"><div class="rule"></div><h1>%s</h1><p>%s</p></section>' % (g, H.escape(intro)))
        for name in names:
            n += 1
            title, b, qd = page_md(name)
            head, _, sub = title.partition('：')
            toc.append('<li><a href="#c%d"><i>%d</i>%s<span class="d"></span><em>%s</em></a></li>' % (n, n, H.escape(head), nums.get(n, '000')))
            body.append('<article class="chap" id="c%d"><header class="chead"><div class="ck">%s · 第 %d 篇</div><h1>%s</h1></header><div class="doc">%s</div>%s</article>' % (
                n, g, n, H.escape(title), b, quiz_html(qd)))
        toc.append('</ol>')
    toc.append('</section>')
    today = datetime.date.today().strftime('%Y年%m月%d日')
    cover = ('<section class="cover"><div class="kk">学　习　册</div><h1>断事图<br>从一件事读盘</h1><div class="sub">八字 · 六壬 ｜ %d 篇 · 每篇附练习</div>'
             '<div class="meta">象义随身 · 第一版<br>算不了认知以外的命 · 先常识，再规则，再案例<br>%s</div><div class="seal">断<br>事图</div></section>' % (n, today))
    howp = ('<section class="how"><h2>怎么读这本书</h2>'
            '<p>先走「入门四步」：来意 → 时辰 → 问诊单 → 示范。再按要断的事翻对应的一篇。</p>'
            '<p>每篇先讲这件事在现实里是怎么回事（常识），再讲八字、六壬怎么看（只用老师资料，逐条带出处，资料没讲的写明「资料未讲」），最后是案例和断之前要问清的事。</p>'
            '<p>每篇开头有「先看这一页」，是这一篇最要紧的几条；篇末是选择题，答案和解析附在题后。正文里的「题N」「第N篇」是网站里的交叉指引，纸上请按目录查。</p></section>')
    htm = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>断事图</title><style>%s</style></head><body>%s%s%s%s</body></html>' % (
        CSS, cover, howp, ''.join(toc), ''.join(body))
    tmp = os.path.join(HERE, '_print.html')
    io.open(tmp, 'w', encoding='utf-8').write(htm)
    os.makedirs(OUTDIR, exist_ok=True)
    out = out or os.path.join(OUTDIR, '象义随身 · 断事图.pdf')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--no-sandbox', '--virtual-time-budget=60000',
                    '--print-to-pdf=' + out, 'file://' + tmp], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=900)
    print('篇', n, '->', out, round(os.path.getsize(out) / 1e6, 1), 'MB')
    return out, n


if __name__ == '__main__':
    a = sys.argv[1:]
    o = a[a.index('--out') + 1] if '--out' in a else None
    out, n = build(o)                       # 第一遍：目录页码先占位（位数相同，版面不变）
    import fitz
    d = fitz.open(out); nums = {}
    for k in range(1, n + 1):
        for i in range(4, len(d)):          # 目录页之后找「· 第 k 篇」篇头
            if re.search(r'· 第 %s 篇' % r'\s*'.join(str(k)), d[i].get_text()[:80]):
                nums[k] = i + 1; break
    d.close()
    assert len(nums) == n, (len(nums), n)
    build(o, nums)                          # 第二遍：填真页码
    d = fitz.open(out); bad = [k for k in nums if not re.search(r'· 第 %s 篇' % r'\s*'.join(str(k)), d[nums[k] - 1].get_text()[:80])]
    print('目录页码核对：', '全部对上' if not bad else bad)
