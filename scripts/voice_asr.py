# ตัวช่วยตรวจเสียงพูดด้วยการถอดกลับเป็นข้อความ (Whisper บนเครื่อง ฟรี) ใช้ร่วมกันโดย supertonic_synth.py และ verify_voice.py
import re, unicodedata
import numpy as np

_model = None
def model(name='small'):
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel(name, device='cpu', compute_type='int8')
    return _model

SINO = '영일이삼사오육칠팔구'
def _sino(n):
    if n == 0: return '영'
    out = ''
    for val, name in [(10000, '만'), (1000, '천'), (100, '백'), (10, '십')]:
        d, n = divmod(n, val)
        if d: out += ('' if d == 1 else SINO[d]) + name
    return out + (SINO[n] if n else '')

def norm(t):
    # ตัวเลขอารบิกที่ Whisper ชอบเขียน → คำอ่านเกาหลี (3,000 → 삼천) แล้วเก็บเฉพาะพยางค์ฮันกึล
    t = re.sub(r'\d[\d,]*', lambda m: _sino(int(m.group().replace(',', ''))), t)
    t = t.replace('에요', '예요')  # สะกดสองแบบที่อ่านเหมือนกัน
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

def to16k(x, sr):
    # ลดอัตราสุ่มตัวอย่างเป็น 16 kHz แบบง่าย (กรองเฉลี่ยก่อนเพื่อลด aliasing)
    k = max(1, int(round(sr / 16000)))
    if k > 1:
        x = np.convolve(x, np.ones(k) / k, mode='same')
    n = int(len(x) * 16000 / sr)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)

def heard(x, sr=44100):
    segs, _ = model().transcribe(to16k(x, sr), language='ko', beam_size=5, vad_filter=False, condition_on_previous_text=False)
    return ' '.join(s.text.strip() for s in segs)

def recall(expected, got):
    e, g = norm(expected), norm(got)
    return lcs(e, g) / max(1, len(e))
