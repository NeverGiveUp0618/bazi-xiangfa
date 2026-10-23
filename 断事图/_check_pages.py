import re,glob,os
R='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/'
files=glob.glob(R+'bazi-course/content/**/*.md',recursive=True)+glob.glob(R+'liuren-course/content/*.md')
raw='\n'.join(open(p,encoding='utf-8').read() for p in files)
plain=re.sub(r'\*\*|`|⭐|●','',raw)
bad=[];tot=0
for f in sorted(glob.glob(R+'八字象义/断事图/*.md')):
    if f.endswith('问诊单.md'): continue
    t=open(f,encoding='utf-8').read()
    for m in re.finditer(r'「([^「」]{8,}?)」[^「」\n]{0,12}?〔([^〕]*?p\s?(\d+)[^〕]*)〕',t):
        q=re.sub(r'\*\*|`|⭐|●','',m.group(1)); page=m.group(3)
        frags=[x for x in re.split(r'……|——|[，。；：、（）()「」『』\s]',q) if len(x)>=6]
        if not frags: continue
        frag=max(frags,key=len)[:14]
        locs=[mm.start() for mm in re.finditer(re.escape(frag),plain)]
        if not locs: continue
        tot+=1
        ok=any(re.search(r'p\s?%s(?!\d)'%page, plain[max(0,l-1500):l+1500]) or re.search(r'p\s?\d+\s?[-–]\s?%s(?!\d)'%page, plain[max(0,l-1500):l+1500]) for l in locs)
        if not ok:
            # what pages are near
            near=set(re.findall(r'p\s?(\d+)',plain[max(0,locs[0]-800):locs[0]+800]))
            bad.append((os.path.basename(f),m.group(2),frag,sorted(near,key=int)[:8]))
for b in bad: print(b)
print('checked',tot,'bad',len(bad))
