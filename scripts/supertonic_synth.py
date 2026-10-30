# สังเคราะห์เสียงด้วย Supertonic 2 (โอเพนซอร์ส รันในเครื่อง ไม่ใช้อินเทอร์เน็ตหลังโหลดโมเดลครั้งแรก)
# ใช้โดย scripts/gen-voice.mjs:  python supertonic_synth.py jobs.json out_dir
#
# โมเดลนี้สุ่มผลลัพธ์ทุกครั้ง (บางเทคมี "หางสั่นๆ" หรือเสียงลากต่อท้าย) และเสียงเบากว่าเสียงสังเคราะห์ในเบราว์เซอร์
# จึงทำ 3 อย่างต่อไฟล์: 1) สร้างหลายเทคแล้วคัดเทคที่สะอาดสุด 2) ตัดช่วงเงียบ/หางที่เกิน + เฟดท้าย 3) ปรับความดังให้สม่ำเสมอ
import json, sys, os
import numpy as np
from supertonic import TTS
from supertonic.core import Style

jobs = json.load(open(sys.argv[1]))
out = sys.argv[2]
tts = TTS(model='supertonic-2', auto_download=True)
cache = {}
SR = 44100
WIN = 0.01  # วินโดว์วิเคราะห์ 10 มิลลิวินาที
TARGET_RMS_DB = -18.0  # ความดังเป้าหมายของช่วงที่มีเสียงพูด
PEAK_LIMIT = 0.95

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

def envelope(x):
    n = int(SR * WIN)
    return np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + n] ** 2)) + 1e-9) for i in range(0, len(x) - n, n)])

def segments(env, floor_db, gap=5):
    # ช่วงที่มีเสียง (ดังกว่า floor_db) ยอมให้เว้นได้ไม่เกิน gap เฟรม (=50ms) ไม่ถือว่าขาดจากกัน
    on = env > floor_db
    segs, i = [], 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and (on[j] or on[j:j + gap].any()):
                j += 1
            segs.append((i, j))
            i = j
        else:
            i += 1
    return segs

def analyse(x):
    env = envelope(x)
    pk = env.max()
    segs = segments(env, pk - 35)
    peak_i = int(np.argmax(env))
    main = next((s for s in segs if s[0] <= peak_i < s[1]), segs[0])
    # หางสั่น = ช่วงหลังที่เสียงหลักตกลงต่ำกว่าจุดสูงสุด 12 dB แต่ยังมีเสียงลากต่อ
    drop = next((k for k in range(peak_i, main[1]) if env[k] < pk - 12), main[1])
    return dict(env=env, pk=pk, segs=segs, main=main, tail=main[1] - drop, extra=len(segs) - 1)

def score(a, single):
    # คะแนนยิ่งน้อยยิ่งดี: ไม่มีเสียงแยกต่อท้าย (สำคัญสุด) · หางลากสั้น · ความยาวรวมสั้น
    span = (a['segs'][-1][1] - a['segs'][0][0]) * WIN
    return (5 if single else 2) * a['extra'] + a['tail'] * WIN * 10 + span * (1.0 if single else 0.2)

def post(x, a, single):
    env = a['env']
    s0 = a['segs'][0][0]
    # พยางค์เดี่ยว: เก็บเฉพาะเสียงหลักช่วงแรก (ตัดเสียงแยกที่ต่อท้ายทิ้ง) · ประโยค: เก็บทุกช่วง
    e1 = a['main'][1] if single else a['segs'][-1][1]
    start = max(0, int((s0 - 6) * WIN * SR))
    end = min(len(x), int((e1 + 4) * WIN * SR))
    y = x[start:end].copy()
    f_in, f_out = int(0.012 * SR), int(0.07 * SR)
    y[:f_in] *= np.linspace(0, 1, f_in)
    y[-f_out:] *= np.linspace(1, 0, f_out)
    act = np.abs(y) > 0.01
    rms = np.sqrt(np.mean(y[act] ** 2)) if act.any() else 1.0
    y = y * (10 ** (TARGET_RMS_DB / 20) / rms)
    pk = np.abs(y).max()
    if pk > PEAK_LIMIT:
        y = np.tanh(y / PEAK_LIMIT) * PEAK_LIMIT  # ลิมิตเตอร์นุ่ม กันเสียงแตก
    pad = np.zeros(int(0.04 * SR), dtype=y.dtype)
    return np.concatenate([pad, y, pad]).astype(np.float32)

for i, j in enumerate(jobs, 1):
    single = bool(j.get('single'))
    takes = int(j.get('takes', 8 if single else 5))
    best = None
    for _ in range(takes):
        wav, _d = tts.synthesize(j['text'], voice_style=style(j['voice']), lang='ko', speed=j.get('speed', 1.0))
        x = np.asarray(wav, dtype=np.float32).flatten()
        a = analyse(x)
        sc = score(a, single)
        if best is None or sc < best[0]:
            best = (sc, x, a)
    y = post(best[1], best[2], single)
    tts.save_audio(y, os.path.join(out, j['key'] + '.wav'))
    print(f"[{i}/{len(jobs)}] {j['speaker']} {j['voice']} {j['text']}  (เลือกจาก {takes} เทค, คะแนน {best[0]:.1f})", flush=True)
