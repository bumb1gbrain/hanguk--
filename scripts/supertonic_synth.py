# สังเคราะห์เสียงด้วย Supertonic 2 (โมเดลโอเพนซอร์ส รันในเครื่อง ไม่ใช้อินเทอร์เน็ตหลังโหลดโมเดลครั้งแรก)
# ใช้โดย scripts/gen-voice.mjs:  python supertonic_synth.py jobs.json out_dir
import json, sys, os
from supertonic import TTS
from supertonic.core import Style

jobs = json.load(open(sys.argv[1]))
out = sys.argv[2]
tts = TTS(model='supertonic-2', auto_download=True)
cache = {}

def style(spec):
    # 'M3' = เสียงสำเร็จรูป · 'M1+F5@0.5' = ผสมเสียง (สัดส่วนเสียงที่สองตามหลัง @)
    if spec in cache:
        return cache[spec]
    if '+' in spec:
        pair, _, t = spec.partition('@')
        a, b = pair.split('+')
        t = float(t or 0.5)
        A, B = tts.get_voice_style(a), tts.get_voice_style(b)
        s = Style(style_ttl_onnx=A.ttl * (1 - t) + B.ttl * t, style_dp_onnx=A.dp * (1 - t) + B.dp * t)
    else:
        s = tts.get_voice_style(spec)
    cache[spec] = s
    return s

for i, j in enumerate(jobs, 1):
    wav, _ = tts.synthesize(j['text'], voice_style=style(j['voice']), lang='ko', speed=j.get('speed', 1.0))
    tts.save_audio(wav, os.path.join(out, j['key'] + '.wav'))
    print(f"[{i}/{len(jobs)}] {j['speaker']} {j['voice']} {j['text']}", flush=True)
