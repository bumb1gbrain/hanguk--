# สังเคราะห์เสียงด้วย Supertonic 2 (โอเพนซอร์ส รันในเครื่อง ไม่ใช้อินเทอร์เน็ตหลังโหลดโมเดลครั้งแรก)
# ใช้โดย scripts/gen-voice.mjs:  python supertonic_synth.py jobs.json out_dir
#
# โมเดลนี้สุ่มผลลัพธ์ทุกครั้ง (บางเทคมี "หางสั่นๆ" หรือเสียงลากต่อท้าย) และเสียงเบากว่าเสียงสังเคราะห์ในเบราว์เซอร์
# และบางเทค "ตกคำ" (กลืนคำ/พยางค์บางตัวหาย) จึงทำ 4 อย่างต่อไฟล์:
# 1) สร้างหลายเทค 2) ถอดเสียงกลับเป็นข้อความด้วย Whisper แล้วคัดเทคที่พูดครบตรงกับข้อความที่สุด (พยางค์เดี่ยวใช้ Whisper ไม่ได้ จึงคัดจากความสะอาดของเสียง)
# 3) ตัดช่วงเงียบ/หางที่เกิน + เฟดท้าย 4) ปรับความดังให้สม่ำเสมอ
import json, sys, os
import numpy as np
from supertonic import TTS
from supertonic.core import Style
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voice_asr as ASR
import av, fractions

jobs = json.load(open(sys.argv[1]))
out = sys.argv[2]
resume = '--resume' in sys.argv  # ข้ามไฟล์ที่สร้างเสร็จแล้วในโฟลเดอร์ out (ใช้ต่อจากที่ค้างไว้เมื่อโดนขัดจังหวะ)
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

def read_audio(path):
    c = av.open(path)
    rs = av.AudioResampler(format='flt', layout='mono', rate=SR)
    parts = []
    for fr in c.decode(audio=0):
        for r in rs.resample(fr):
            parts.append(r.to_ndarray().flatten())
    for r in rs.resample(None):
        parts.append(r.to_ndarray().flatten())
    c.close()
    return np.concatenate(parts).astype(np.float32)

def stretch(x, factor):
    # factor > 1 = ช้าลง ไม่เปลี่ยนระดับเสียง (atempo ของ ffmpeg ผ่าน PyAV)
    g = av.filter.Graph()
    src = g.add_abuffer(format='flt', sample_rate=SR, layout='mono', time_base=fractions.Fraction(1, SR))
    f = g.add('atempo', str(1.0 / factor))
    snk = g.add('abuffersink')
    src.link_to(f); f.link_to(snk); g.configure()
    frame = av.AudioFrame.from_ndarray(x.reshape(1, -1), format='flt', layout='mono')
    frame.sample_rate = SR; frame.pts = 0
    src.push(frame); src.push(None)
    out_parts = []
    while True:
        try:
            out_parts.append(snk.pull().to_ndarray().flatten())
        except (av.error.EOFError, av.error.BlockingIOError):
            break
    return np.concatenate(out_parts).astype(np.float32)

rpath = os.path.join(out, '_report.json')
report = json.load(open(rpath)) if resume and os.path.exists(rpath) else {}
for i, j in enumerate(jobs, 1):
    if resume and os.path.exists(os.path.join(out, j['key'] + '.wav')):
        continue
    if j.get('src'):  # เสียงช้า: ยืดคลิปปกติที่คัดไว้แล้ว (ไม่สังเคราะห์ใหม่)
        if not os.path.exists(j['src']):
            print(f"[{i}/{len(jobs)}] ข้าม {j['speaker']} {j['text']}: ยังไม่มีคลิปปกติ", flush=True)
            continue
        y = stretch(read_audio(j['src']), float(j['stretch']))
        f_out = int(0.07 * SR)
        y[-f_out:] *= np.linspace(1, 0, f_out)
        pk = np.abs(y).max()
        if pk > PEAK_LIMIT:
            y = np.tanh(y / PEAK_LIMIT) * PEAK_LIMIT
        tts.save_audio(y.astype(np.float32), os.path.join(out, j['key'] + '.wav'))
        report[j['key']] = dict(text=j['text'], stretched=float(j['stretch']))
        print(f"[{i}/{len(jobs)}] {j['speaker']} {j['text']}  (ยืด ×{j['stretch']})", flush=True)
        continue
    single = bool(j.get('single'))
    takes = int(j.get('takes', 8))
    best = None
    for n in range(takes):
        wav, _d = tts.synthesize(j['text'], voice_style=style(j['voice']), lang='ko', speed=j.get('speed', 1.0))
        x = np.asarray(wav, dtype=np.float32).flatten()
        a = analyse(x)
        art = score(a, single)
        rec = None
        y = post(x, a, single)  # ตรวจจากเสียงที่ผ่านการตัด/ปรับความดังแล้ว (ตรงกับที่ผู้เล่นจะได้ยินจริง)
        if not single:
            rec = ASR.recall(j['text'], ASR.heard(y, SR))
            sc = (1 - rec) * 100 + art
        else:
            sc = art
        if best is None or sc < best[0]:
            best = (sc, y, a, rec, n + 1)
        if rec is not None and rec >= 0.95 and a['extra'] == 0:
            break  # พูดครบและสะอาดแล้ว ไม่ต้องลองเทคต่อ
    y = best[1]
    tts.save_audio(y, os.path.join(out, j['key'] + '.wav'))
    report[j['key']] = dict(text=j['text'], recall=best[3], takes_used=best[4])
    rtxt = '' if best[3] is None else f', ครบ {best[3]:.0%}'
    json.dump(report, open(rpath, 'w'), ensure_ascii=False)  # เซฟรายงานทุกไฟล์ เผื่อถูกขัดจังหวะ
    print(f"[{i}/{len(jobs)}] {j['speaker']} {j['voice']} {j['text']}  (ใช้ {best[4]}/{takes} เทค{rtxt})", flush=True)
json.dump(report, open(rpath, 'w'), ensure_ascii=False)
