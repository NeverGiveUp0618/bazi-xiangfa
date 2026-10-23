import re,glob,os
R='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/'
files=glob.glob(R+'bazi-course/content/**/*.md',recursive=True)+glob.glob(R+'liuren-course/content/*.md')
raw='\n'.join(open(p,encoding='utf-8').read() for p in files)
def norm(s): return re.sub(r'[^一-鿿0-9]','',s)
N=norm(raw)
out=[]
for f in sorted(glob.glob(R+'八字象义/断事图/*.md')):
    if f.endswith('问诊单.md'): continue
    t=open(f,encoding='utf-8').read()
    t=re.sub(r'## 一、.*?(?=## 二、)','',t,flags=re.S)
    header=None
    for line in t.splitlines():
        if not line.startswith('|'): header=None; continue
        cells=line.strip().strip('|').split('|')
        if header is None: header=cells; continue
        if '---' in line: continue
        if not re.search(r'盘上|规则|看什么|结构|作用|格|原话|盘象|字',header[0]): continue
        c0=re.sub(r'「[^」]*」','',cells[0])
        for b in re.findall(r'\*\*([^*]{4,})\*\*',c0)+([c0] if '**' not in c0 else []):
            n=norm(b)
            if len(n)<5: continue
            sh=[n[i:i+4] for i in range(0,len(n)-3,2)]
            hit=sum(x in N for x in sh)/len(sh)
            if hit<0.5: out.append((hit,os.path.basename(f),b.strip()[:40],line.strip()[:130]))
out.sort()
for o in out: print('%.2f %s 【%s】 %s'%o)
print(len(out))
