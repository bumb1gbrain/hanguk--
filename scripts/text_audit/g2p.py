# G2P เกาหลีแบบย่อ (กฎการออกเสียงหลัก) → คืนค่าเป็นฮันกึลตามเสียงอ่านจริง ใช้เทียบกับคำอ่านไทยที่เขียนไว้
import re, json, sys
L=list('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'); V=list('ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'); T=['']+list('ㄱㄲ')+['ㄳ']+list('ㄴ')+['ㄵ','ㄶ']+list('ㄷㄹ')+['ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ']+list('ㅁㅂ')+['ㅄ']+list('ㅅㅆㅇㅈㅊㅋㅌㅍㅎ')
def dec(c):
    o=ord(c)-0xAC00
    return [L[o//588], V[(o%588)//28], T[o%28]]
def enc(l,v,t):
    return chr(0xAC00+L.index(l)*588+V.index(v)*28+T.index(t))
CLUS={'ㄳ':('ㄱ','ㅅ'),'ㄵ':('ㄴ','ㅈ'),'ㄶ':('ㄴ','ㅎ'),'ㄺ':('ㄹ','ㄱ'),'ㄻ':('ㄹ','ㅁ'),'ㄼ':('ㄹ','ㅂ'),'ㄽ':('ㄹ','ㅅ'),'ㄾ':('ㄹ','ㅌ'),'ㄿ':('ㄹ','ㅍ'),'ㅀ':('ㄹ','ㅎ'),'ㅄ':('ㅂ','ㅅ')}
NEUT={'ㄲ':'ㄱ','ㅋ':'ㄱ','ㅅ':'ㄷ','ㅆ':'ㄷ','ㅈ':'ㄷ','ㅊ':'ㄷ','ㅌ':'ㄷ','ㅍ':'ㅂ'}
TENSE={'ㄱ':'ㄲ','ㄷ':'ㄸ','ㅂ':'ㅃ','ㅅ':'ㅆ','ㅈ':'ㅉ'}
ASP={'ㄱ':'ㅋ','ㄷ':'ㅌ','ㅂ':'ㅍ','ㅈ':'ㅊ'}
def g2p(text):
    out=[]
    for word in re.split(r'(\s+|[^가-힣\s]+)',text):
        if not word or not re.match(r'[가-힣]',word): out.append(word); continue
        syl=[dec(c) for c in word]
        n=len(syl)
        for i in range(n):
            l,v,t=syl[i]
            nxt=syl[i+1] if i+1<n else None
            if t in CLUS and nxt is None: t=CLUS[t][0] if t not in('ㄺ','ㄻ','ㄿ') else {'ㄺ':'ㄱ','ㄻ':'ㅁ','ㄿ':'ㅂ'}[t]; syl[i][2]=t
            if not nxt: 
                if t in NEUT: syl[i][2]=NEUT[t]
                continue
            nl=nxt[0]
            # ㅎ-related
            if t=='ㅎ' or t in('ㄶ','ㅀ'):
                base={'ㄶ':'ㄴ','ㅀ':'ㄹ','ㅎ':''}[t]
                if nl in ASP: nxt[0]=ASP[nl]; syl[i][2]=base; continue
                if nl=='ㅇ': syl[i][2]=''; nxt[0]=base if base else 'ㅇ'; continue
                syl[i][2]=base if base else ''
                t=syl[i][2]
            if t=='' : continue
            if nl=='ㅎ' and t in('ㄱ','ㄷ','ㅂ','ㅈ','ㄲ','ㅋ','ㅅ','ㅆ','ㅊ','ㅌ','ㅍ'):
                tt=NEUT.get(t,t); 
                if tt in ASP: nxt[0]=ASP[tt]; syl[i][2]=''; continue
            if nl=='ㅇ':  # 연음
                if t in CLUS: a,b=CLUS[t]; syl[i][2]=a; nxt[0]=b if b!='ㅎ' else 'ㅇ'
                else:
                    syl[i][2]=''; nxt[0]=t if t!='ㅇ' else 'ㅇ'
                    if nxt[1]=='ㅣ' and t=='ㄷ': nxt[0]='ㅈ'
                    if nxt[1]=='ㅣ' and t=='ㅌ': nxt[0]='ㅊ'
                if t=='ㅇ': syl[i][2]='ㅇ'; nxt[0]='ㅇ'
                continue
            if t in CLUS: t=CLUS[t][0]; syl[i][2]=t
            t=NEUT.get(t,t); syl[i][2]=t
            # 비음화 / 유음화 / 경음화
            if t in('ㄱ','ㄷ','ㅂ') and nl in('ㄴ','ㅁ'): syl[i][2]={'ㄱ':'ㅇ','ㄷ':'ㄴ','ㅂ':'ㅁ'}[t]
            elif t in('ㄱ','ㄷ','ㅂ') and nl=='ㄹ': syl[i][2]={'ㄱ':'ㅇ','ㄷ':'ㄴ','ㅂ':'ㅁ'}[t]; nxt[0]='ㄴ'
            elif t=='ㄴ' and nl=='ㄹ': syl[i][2]='ㄹ'; nxt[0]='ㄹ'
            elif t=='ㄹ' and nl=='ㄴ': nxt[0]='ㄹ'
            elif t in('ㅁ','ㅇ') and nl=='ㄹ': nxt[0]='ㄴ'
            elif t in('ㄱ','ㄷ','ㅂ') and nl in TENSE: nxt[0]=TENSE[nl]
        out.append(''.join(enc(*s) for s in syl))
    return ''.join(out)
if __name__=='__main__':
    for t in ['학교','한국어','좋아요','맛있어요','먹었어요','감사합니다','괜찮아요','있어요','읽어요','밥','옷','꽃','십이','독립','신라','난로','같이','굳이','좋은 하루','낮','앞','부엌','많아요','싫어요','값','삼천 원이에요','천천히','못해요','반갑습니다','잘 먹겠습니다']:
        print(t,'→',g2p(t))
