import json, sys
sys.path.insert(0,'lint')
from g2p import g2p
rows=json.load(open('lint/rows.json')); a,b=int(sys.argv[1]),int(sys.argv[2])
for n,r in enumerate(rows[a:b],a):
    ko=r['ko']; pr=g2p(ko) if r['src'] not in('lesson-letter',) else ''
    pr=f' [{pr}]' if pr and pr!=ko else ''
    rom=f" ({r['rom']})" if r['rom'] else ''
    ex=f" +{r['extra']}" if r['extra'] else ''
    print(f"{n} {r['src'].replace('lesson-','L-').replace('story-','S-')} {ko}{pr}{rom} | {r['read']} | {r['th']}{ex}")
