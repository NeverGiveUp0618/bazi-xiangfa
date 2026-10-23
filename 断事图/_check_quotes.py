import re,glob,os,sys
R='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/'
corpus=''
for p in glob.glob(R+'bazi-course/content/**/*.md',recursive=True)+glob.glob(R+'liuren-course/content/*.md')+glob.glob(R+'bazi-course/content/*.md'):
    corpus+=open(p,encoding='utf-8').read()
def norm(s): return re.sub(r'[^\u4e00-\u9fff0-9A-Za-z]','',re.sub('盲派易','',s))
C=norm(corpus)
tot=bad=0
for f in sorted(glob.glob(R+'八字象义/断事图/*.md')):
    if f.endswith('问诊单.md'): continue
    t=open(f,encoding='utf-8').read()
    # skip section 一 (常识) — between "## 一、" and "## 二、"
    t2=re.sub(r'## 一、.*?(?=## 二、)','',t,flags=re.S)
    miss=[]
    for q in re.findall(r'「([^「」]{6,})」',t2):
        n=norm(q)
        # split on ……
        if len(n)<8: continue
        tot+=1
        sh=[n[i:i+6] for i in range(0,len(n)-5,3)]
        hit=sum(1 for x in sh if x in C)/max(1,len(sh))
        if hit<0.7: miss.append('%.2f '%hit+q)
    if miss:
        bad+=len(miss)
        print('##',os.path.basename(f),len(miss))
        for q in miss: print('   ',q[:110])
print('total',tot,'miss',bad)
