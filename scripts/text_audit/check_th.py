import json, re, collections, sys
items=[json.loads(l) for l in open('lint/items.jsonl')]
out=[]
def flag(i,kind,msg): out.append((kind,i['src'],i['id'],i['ko'],msg))

# 1) consistency: same Korean with different Thai meaning/read
by=collections.defaultdict(list)
for i in items:
    if i['ko'] and i['src'] not in('lesson-title','gear'): by[i['ko'].strip()].append(i)
for ko,L in by.items():
    ths={x['th'].strip() for x in L if x['th']}; rds={x['read'].strip() for x in L if x['read']}
    if len(rds)>1: out.append(('consistency-read','*','*',ko,' | '.join(sorted(rds))))
    if len(ths)>1 and not all(x['src'].startswith('story-vocab') for x in L): out.append(('consistency-th','*','*',ko,' | '.join(sorted(ths))))

# 2) structure: Korean chars
for i in items:
    ko=i['ko']
    if not ko: flag(i,'empty-ko','missing'); continue
    if i['src']!='lesson-letter' and re.search(r'[ㄱ-ㅣ]',ko) and i['src'] not in ('lesson-title',): flag(i,'stray-jamo','')
    if re.search(r'  +|^\s|\s$',ko): flag(i,'spacing','double/edge spaces')
    if i['src'] in('lesson-word','lesson-phrase','story-line','routine','trick') and not i['read']: flag(i,'missing-read','')
    if i['src'] in('lesson-word','lesson-phrase','story-line','routine','trick','food','mood','quest','achievement') and not i['th']: flag(i,'missing-th','')
    if re.search(r'[A-Za-z]',i['read']): flag(i,'latin-in-read',i['read'])
    if re.search(r'[가-힣]',i['th']) and i['src'] not in('quest','achievement'): flag(i,'korean-in-th',i['th'])
    if re.search(r'[ๆ]{2}|  +',i['th']+i['read']): flag(i,'double-space-thai','')
# 3) Thai spelling (dictionary OOV)
from pythainlp.tokenize import word_tokenize
from pythainlp.corpus import thai_words
D=set(thai_words())
oov=collections.Counter(); where=collections.defaultdict(list)
for i in items:
    for field in ('th',):
        t=i[field]
        for w in word_tokenize(re.sub(r'[^ก-๙]+',' ',t),keep_whitespace=False):
            if re.search(r'[ก-๙]',w) and w not in D and len(w)>1: oov[w]+=1; where[w].append((i['src'],i['ko'],t))
print('OOV Thai tokens (th):',len(oov))
for w,c in oov.most_common(120): print(' ',w,c,'|',where[w][0][2][:50])
