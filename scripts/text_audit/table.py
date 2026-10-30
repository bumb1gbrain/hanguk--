import json, sys
sys.path.insert(0,'lint')
from g2p import g2p
items=[json.loads(l) for l in open('lint/items.jsonl')]
seen=set(); rows=[]
for i in items:
    if i['src'] in('gear',) : continue
    key=(i['ko'],i['read'],i['th'])
    if key in seen: continue
    seen.add(key); rows.append(i)
json.dump(rows,open('lint/rows.json','w'),ensure_ascii=False)
print(len(rows))
