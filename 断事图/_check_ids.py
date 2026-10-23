import re,sys
R='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/'
def load(p,pat):
    d={}
    for l in open(R+p):
        m=re.match(pat,l)
        if m:d[int(m.group(1))]=l.strip()[:70]
    return d
B=load('bazi-course/content/实用八字教材/99-命例题库.md',r'### 【题(\d+)】')
L=load('liuren-course/content/99-课例题库.md',r'### 【例(\d+)】')
t=open(sys.argv[1]).read()
bs=sorted(set(int(x) for x in re.findall(r'【题(\d+)】',t)))
print('八字',len(bs))
for n in bs: print(n,B.get(n,'!!!缺'))
ls=sorted(set(int(x) for x in re.findall(r'例 ?(\d+)',t)))
print('六壬',len(ls))
for n in ls: print(n,L.get(n,'!!!缺'))
