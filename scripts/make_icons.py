# Generates PWA icons from the 범이 tiger head pixel grid.
from PIL import Image
HEAD = [
  '..kk........kk..', '.kook......kook.', '.kopokkkkkkopok.', '.kooooboobooook.',
  'kbooooobbooooobk', 'kooooooooooooook', 'kooewooooooewook', 'kooeeooooooeeook',
  'kbooyyyyyyyyoobk', 'koopyyykkyyypook', 'kooyyykyykyyyook', '.kooyyyyyyyyook.',
  '..kkooooooookk..',
]
PAL = {'k': '#2a1a12', 'o': '#f28c28', 'y': '#ffe7c2', 'b': '#3a2418', 'p': '#ff9aa8', 'e': '#1b1424', 'w': '#ffffff'}
BG = '#1d1a2f'
def hexc(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5)) + (255,)
def make(size, pad, path, bg=True):
    grid_w, grid_h = 16, len(HEAD)
    cell = (size - 2 * pad) // grid_w
    img = Image.new('RGBA', (size, size), hexc(BG) if bg else (0, 0, 0, 0))
    ox = (size - cell * grid_w) // 2
    oy = (size - cell * grid_h) // 2
    for r, row in enumerate(HEAD):
        for c, ch in enumerate(row):
            if ch == '.': continue
            for y in range(cell):
                for x in range(cell):
                    img.putpixel((ox + c * cell + x, oy + r * cell + y), hexc(PAL[ch]))
    img.save(path)
make(192, 16, 'public/icon-192.png')
make(512, 40, 'public/icon-512.png')
make(512, 96, 'public/icon-512-maskable.png')
make(180, 14, 'public/apple-touch-icon.png')
make(64, 0, 'public/favicon.png', bg=False)
print('icons ok')
