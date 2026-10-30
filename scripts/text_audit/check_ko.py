import json, re
from kiwipiepy import Kiwi
kiwi=Kiwi()
items=[json.loads(l) for l in open('lint/items.jsonl')]
seen=set(); rows=[]
for i in items:
    ko=i['ko'].strip()
    if not ko or ko in seen or i['src'] in('lesson-letter','lesson-title') or re.search(r'[ㄱ-ㅣ]',ko): continue
    seen.add(ko)
    toks,score=kiwi.analyze(ko)[0]
    unk=[t.form for t in toks if t.tag in('UN','W_SERIAL') or (t.tag=='NNP' and len(t.form)>1 and not t.form in ko.split())]
    sp=kiwi.space(ko, reset_whitespace=False)
    sentence = i['src'] in('lesson-phrase','story-line','story-option','story-reply','routine')
    rows.append((i['src'],ko,round(score,1),[(t.form,t.tag) for t in toks if t.tag in('UN','NNP','SL')],sp if (sentence and sp.replace(' ','')==ko.replace(' ','') and sp!=ko) else None))
print('analysed',len(rows))
print('\n-- unknown/proper-noun tokens:')
for r in rows:
    if r[3]: print(' ',r[0],r[1],r[3])
print('\n-- spacing differences suggested by Kiwi (sentences only):')
for r in rows:
    if r[4]: print(' ',r[0],'|',r[1],'=>',r[4])
