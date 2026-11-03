# -*- coding: utf-8 -*-
"""象义随身·大六壬象义 ← 《图解六壬大全》（第1部 占法及神煞）OCR校对版 .docx
抽取十二支神「类神」原文＋原注、十二天将「类神」行，生成 bazi_xiangyi_site/mobile/liuren_daquan_data.js。
原文只拆分、不改写；原注里的条件（如「临日干」）并入条目，写成 〔…〕。
用法：python3 _gen_daquan.py  （需 docx 在 DOCX 路径）"""
import re, json, zipfile, os
DOCX = '/Users/xiaojin/Documents/文稿同步文件夹/02_项目 (Projects)/马老师项目/大六壬笔记提炼/图解 六壬大全（第1部 占法及神煞）_OCR校对版.docx'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bazi_xiangyi_site', 'mobile', 'liuren_daquan_data.js')
x = zipfile.ZipFile(DOCX).read('word/document.xml').decode('utf-8')
L = [''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>', p, re.S)).strip() for p in re.findall(r'<w:p[ >].*?</w:p>', x, re.S)]
L = [l for l in L if l]

def find(pat, start=0):
    for i in range(start, len(L)):
        if re.match(pat, L[i]):
            return i
    raise SystemExit('找不到 ' + pat)

# —— 章节边界（按标题行定位，不写死行号）——
sp0 = find(r'^十二神释：详解十二支神$', 20000)
jj0 = find(r'^十二将释：详解十二天将$', sp0)
SP_NAMES = ['登明', '河魁', '从魁', '传送', '小吉', '胜光', '太乙', '天罡', '太冲', '功曹', '大吉', '神后']
SP_ZHI = ['亥', '戌', '酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑', '子']
sp_start = [find(r'^%d\. .{1,3}月将：%s' % (i + 1, SP_NAMES[i]), sp0) for i in range(12)]
sp_end = sp_start[1:] + [jj0]
JJ_NAMES = ['贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后']
JJ_HEAD = ['天帝之神：贵人论', '腊蛇论', '朱雀论', '六合论', '勾陈论', '青龙论', '天空论', '白虎论', '太常论', '玄武论', '太阴论', '天后论']
jj_start = [find(r'^%d\. %s' % (i + 1, JJ_HEAD[i]), jj0) for i in range(12)]
jj_end = jj_start[1:] + [find(r'^1\. 局外行藏', jj_start[-1])]

NOISE = re.compile(r'^(\||第 ?\d+ ?页|白话图解|【原文】$|左图为|.{1,3}将对应的事物|(名称|月份|日[躔踵骁]|星座|起始中气|星宿|分野|属相|方位|音|数|味)[：:])')

def clean_join(lines):
    out = []
    for s in lines:
        if NOISE.match(s) or s.startswith('__BLANK__'):
            continue
        out.append(s.replace('【原文】', ''))
    return ''.join(out)

BODY = re.compile(r'肝|胆|肾|脾|肺|心|肠|胃|膀胱|发|足|腿|骨|血|目|口窍|耳|咽|喉|头|面|脊|胁|腹|命门|筋|脉|舌|唇|病|疾|泻|痢|痈|肿|瘵|膈|胸|腰|脚|声音|皮毛|爪|精')
PLACE = re.compile(r'宫|室|城|寺|观|庙|园|林|井|墙|坟|桥|道路|田|庭|院|楼|台|厕|狱|山|冈|海|池|泽|仓|廪|街|巷|庵|堂|社|衙|祠|灵柩|陵|阁|廊|沟|栏|窑|厨|坑|户|岭|殿|坛|圃|店|肆|房|场|宅|路|门|塔|碑')
EVENT = re.compile(r'惊|恐|疑|文书|口舌|咒|胎|兵|词讼|信息|光彩|征召|喜庆|忧|取索|亡失|谒见|请召|庆贺|筵会|离别|旱|蝗|悲|虑|娠|梦|缢|官事|敕书|欺|杀斗|动摇|顽恶|坚硬|凶怪|表奏|举荐|福德|爵|冤仇|淫|奸|私祷|聪明|女经|产乳|水厄|仇|攻劫|馈送|失脱|逃|出入|门户不宁|诚信|夫妇不和|孝服|边兵|官禄|轻狂|毁骂|徒配|取|孕')
PEOPLE = re.compile(r'人|妇|女|公|官|僧|道|师|匠|婢|妾|翁|婆|儿|童|子|将军|夫人|客|丐|贼|盗|尼|妓|奴|使|兵|主|长|母|父|兄|弟|姑|嫂|姨|妹|舅|君|相|吏|医|客|督|宰|辖|监|司|尉|帅|商|贾|户|工|农|仆')

def notes_of(blk_lines):
    txt = ''.join(l for l in blk_lines if not NOISE.match(l) and not l.startswith('__BLANK__'))
    d = {}
    for m in re.finditer(r'[（(](\d+)[）)]([^（(]*?)(?=[（(]\d+[）)]|$)', txt):
        d[m.group(1)] = m.group(2).strip().rstrip('。；;')
    return d

def toks(s, notes):
    s = re.sub(r'^(又)?为|^类为|^又为', '', s.strip())
    out = []
    for t in re.split(r'[、，]', s):
        t = re.sub(r'^(又为|又)', '', t.strip())
        t = re.sub(r'[（(](\d+)[）)]', lambda m: ('〔%s〕' % notes[m.group(1)].replace('，', '，')) if m.group(1) in notes else '', t)
        t = t.replace('(', '（').replace(')', '）').strip()
        if t:
            out.append(t)
    return out

def bucket_for(tk, first_person):
    n = len(tk) or 1
    def frac(rx): return sum(1 for t in tk if rx.search(re.sub(r'〔.*?〕', '', t))) / n
    if first_person: return '人物'
    if frac(BODY) >= .5: return '身体病症'
    if frac(PLACE) >= .4: return '处所'
    if frac(PEOPLE) >= .5: return '人物'
    if frac(EVENT) >= .3: return '事体'
    return '器物物产'

def spirit(i):
    seg = L[sp_start[i]:sp_end[i]]
    k = next(j for j, s in enumerate(seg) if re.search(r'之类神', s) and len(s) < 30)
    e = next(j for j in range(k + 1, len(seg)) if seg[j].startswith('【原注】') or seg[j].startswith('【白话'))
    body = clean_join(seg[k + 1:e])
    notes = {}
    if seg[e].startswith('【原注】'):
        e2 = next(j for j in range(e + 1, len(seg)) if seg[j].startswith('【白话'))
        notes = notes_of(seg[e + 1:e2])
    stmts = [s for s in re.split(r'[；。]', body) if s.strip()]
    br = {}
    first_done = False
    for s in stmts:
        s = s.strip()
        if s.startswith('类为'):
            br.setdefault('天象', []).extend(toks(s, notes)); continue
        if s.startswith('为姓'):
            br.setdefault('姓氏', []).append(re.sub(r'^为姓，', '', re.sub(r'[（(]\d+[）)]', '', s))); continue
        tk = toks(s, notes)
        b = bucket_for(tk, not first_done)
        first_done = True
        br.setdefault(b, []).extend(tk)
    # 形貌/所主（原文第一段）
    seg_txt = [s for s in seg[:k] if s.startswith(SP_NAMES[i] + '神，') or s.startswith('所主')]
    return br, ''.join(seg_txt)

def general(i):
    seg = L[jj_start[i]:jj_end[i]]
    line = None
    for a, s in enumerate(seg):
        if s.startswith('白话') or '类神' in s or s.startswith('【白话'): continue
        s2 = s.replace('【原文】', '')
        if re.match(r'^(类为|于人)', s2):
            joined, b = s2, a + 1
            while not re.search(r'数[^；。]{0,2}。', joined) and b < min(a + 6, len(seg)) and not seg[b].startswith('【') and not seg[b].startswith('白话'):
                joined += seg[b]; b += 1
            if '色' in joined and '数' in joined:
                line = joined; break
    if not line:
        return {}
    br = {}
    last = None
    def put(k, v):
        nonlocal last
        br.setdefault(k, []).extend(v); last = k
    for st in [x for x in re.split(r'[；。]', line) if x.strip()]:
        st = st.strip().lstrip('，')
        if st.startswith('类为'): put('类象', toks(st, {}))
        elif st.startswith('变异'): put('变异', toks(re.sub(r'^变异(为)?', '', st), {}))
        elif re.match(r'^(于)?人', st): put('人物', toks(re.sub(r'^(于)?人(为)?', '', st), {}))
        elif re.match(r'^(于)?祟', st): put('神鬼', toks(re.sub(r'^(于)?祟(为)?', '', st), {}))
        elif re.match(r'^(于)?[病疾]', st): put('身体病症', toks(re.sub(r'^(于)?[病疾](为|在)?', '', st), {}))
        elif st.startswith('于五谷'): put('五谷', toks(re.sub(r'^于五谷(为)?', '', st), {}))
        elif st.startswith('于兽'): put('禽兽', toks(re.sub(r'^于兽(为)?', '', st), {}))
        elif st.startswith('于水中'): put('器物', [re.sub(r'^于', '', st)])
        elif st.startswith('又为'): put('器物', toks(st, {}))
        elif st.startswith('一云') and last: br[last].append(st)
        elif re.match(r'^(味|色|形|数)', st): put('色·数·味', [st])
        else: put('其他', [st])
    # 「变异为…」混在别的条里的拆出来
    for k in list(br):
        keep = []
        for t in br[k]:
            if t.startswith('变异为') and k != '变异':
                br.setdefault('变异', []).append(t[3:])
            else:
                keep.append(t)
        br[k] = keep
    return {k: v for k, v in br.items() if v}

def sp_core(i):
    seg = L[sp_start[i]:sp_end[i]]
    k = next(j for j, t in enumerate(seg) if re.search(r'之类神', t) and len(t) < 30)
    line = next((t for t in seg[:k] if t.startswith('所主')), '')
    return [re.sub(r'[（(]\d+[）)]', '', p).strip() for p in re.split(r'[。]', line) if p.strip()][:5]

def jj_core(i):
    seg = L[jj_start[i]:jj_end[i]]
    head = seg[0].split('：')[-1] if False else seg[1].split('：', 1)[-1]
    txt = ''.join(t for t in seg[:40] if not t.startswith('|'))
    m = re.search(r'([^。，；]*(?:，[^。；]*?)*?[吉凶]将也)', txt)
    s2 = ''
    for t in re.split(r'(?<=[。])', txt):
        if re.search(r'[吉凶]将也', t) and '白话' not in t:
            s2 = re.sub(r'^.*?(位居|天乙贵人)', r'\1', t).rstrip('。'); break
    return [x for x in [head.strip(), s2] if x]

out = {}
for i, n in enumerate(SP_NAMES):
    br, hint = spirit(i)
    out[n] = {'core': sp_core(i), 'branches': br, 'source': '《图解六壬大全》第1部 · 十二神释 · %s（%s）· 类神原文' % (n, SP_ZHI[i])}
for i, n in enumerate(JJ_NAMES):
    br = general(i)
    out[n] = {'core': jj_core(i), 'branches': br, 'source': '《图解六壬大全》第1部 · 十二将释 · %s论 · 类神原文' % n}
js = '/* 由 _gen_daquan.py 从《图解六壬大全》第1部（OCR校对版 .docx）抽取，勿手改。 */\nwindow.LIUREN_DAQUAN = %s;\n' % json.dumps(out, ensure_ascii=False, indent=1)
open(OUT, 'w', encoding='utf-8').write(js)
for k, v in out.items():
    print(k, {a: len(b) for a, b in v['branches'].items()})
