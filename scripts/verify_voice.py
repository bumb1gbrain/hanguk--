# ตรวจว่าไฟล์เสียงพูดตรงกับข้อความที่ควรพูด (ไม่ตกคำ) ด้วยการถอดเสียงกลับเป็นข้อความ (Whisper บนเครื่อง ฟรี)
# ใช้: python verify_voice.py jobs.json public/voice out.json [--only speaker,speaker] [--model small]
import json, sys, os, re, time, unicodedata
from faster_whisper import WhisperModel

jobs = json.load(open(sys.argv[1])); voice_dir = sys.argv[2]; out_path = sys.argv[3]
only = None
if '--only' in sys.argv: only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
model_name = sys.argv[sys.argv.index('--model') + 1] if '--model' in sys.argv else 'small'
manifest = json.load(open(os.path.join(voice_dir, 'manifest.json')))
model = WhisperModel(model_name, device='cpu', compute_type='int8')

SINO = '영일이삼사오육칠팔구'
def sino(n):
    if n == 0: return '영'
    out = ''
    for val, name in [(10000, '만'), (1000, '천'), (100, '백'), (10, '십')]:
        d, n = divmod(n, val)
        if d: out += ('' if d == 1 else SINO[d]) + name
    return out + (SINO[n] if n else '')
def norm(t):
    t = re.sub(r'\d[\d,]*', lambda m: sino(int(m.group().replace(',', ''))), t)
    return re.sub(r'[^가-힣]', '', unicodedata.normalize('NFC', t))
def lcs(a, b):
    dp = [0] * (len(b) + 1)
    for x in a:
        prev = 0
        for j, y in enumerate(b, 1):
            cur = dp[j]
            dp[j] = prev + 1 if x == y else max(dp[j], dp[j - 1])
            prev = cur
    return dp[-1]

res = {}; t0 = time.time()
items = [(k, v) for k, v in jobs.items() if k in manifest and (not only or v['speaker'] in only)]
for i, (k, v) in enumerate(items, 1):
    path = os.path.join(voice_dir, os.path.basename(manifest[k]))
    segs, _ = model.transcribe(path, language='ko', beam_size=5, vad_filter=False, condition_on_previous_text=False)
    heard = ' '.join(s.text.strip() for s in segs)
    exp, got = norm(v['text']), norm(heard)
    recall = lcs(exp, got) / max(1, len(exp)); precision = lcs(exp, got) / max(1, len(got))
    res[k] = dict(speaker=v['speaker'], text=v['text'], heard=heard, recall=round(recall, 2), precision=round(precision, 2), n=len(exp))
    if i % 25 == 0: print(f'[{i}/{len(items)}] {time.time()-t0:.0f}s', flush=True)
json.dump(res, open(out_path, 'w'), ensure_ascii=False, indent=1)
print('done', len(res), f'{time.time()-t0:.0f}s')
