# 每一行引用的题号/例号：行内关键词在该题正文里的命中率
import re,glob,os
R='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/'
def load(p,pat):
    t=open(R+p,encoding='utf-8').read(); d={}
    for blk in re.split(r'(?m)^(?=### 【)',t):
        m=re.match(pat,blk)
        if m: d[int(m.group(1))]=blk
    return d
B=load('bazi-course/content/实用八字教材/99-命例题库.md',r'### 【题(\d+)】')
L=load('liuren-course/content/99-课例题库.md',r'### 【例(\d+)】')
def norm(s): return re.sub(r'[^一-鿿0-9]','',s)
STOP=set('一个这个那个就是不是没有可以表示之意出处原话常识对照资料命例案例题库盘上断语现实'.split())
out=[]
for f in sorted(glob.glob(R+'八字象义/断事图/*.md')):
    if os.path.basename(f) in ('问诊单.md',): continue
    for ln,line in enumerate(open(f,encoding='utf-8'),1):
        bs=[int(x) for x in re.findall(r'【题(\d+)】',line)]
        ls=[int(x) for x in re.findall(r'(?<![0-9])例 ?(\d+)',line)] if '【题' not in line or '例' in line else []
        if not bs and not ls: continue
        txt=re.sub(r'【题\d+】|例 ?\d+|〔[^〕]*〕','',line)
        n=norm(txt)
        if len(n)<6: continue
        bodies=[B.get(x,'') for x in bs]+[L.get(x,'') for x in ls]
        if any(b=='' for b in bodies):
            out.append((0,os.path.basename(f),ln,'!!缺题号',line.strip()[:120])); continue
        body=norm(''.join(bodies))
        grams=[n[i:i+3] for i in range(len(n)-2)]
        hit=sum(g in body for g in grams)/len(grams)
        if hit<0.45: out.append((hit,os.path.basename(f),ln,'',line.strip()[:150]))
out.sort()
for o in out: print('%.2f %s:%d %s %s'%o)
print(len(out))
