"""Seçki klasöründen site görsellerini ve data.js dosyasını üretir.

Kullanım:  python tools/build.py <secki klasörü> [showreel.mp4]
Seçkiyi değiştirmek için: secki klasöründeki dosyaları değiştir, tools/series.json'u
gerekirse güncelle, bu betiği yeniden çalıştır.
"""
import hashlib, json, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageFilter, ImageOps

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
SRC = sys.argv[1]
REEL = sys.argv[2] if len(sys.argv) > 2 else None
IMG = os.path.join(SITE, 'img')
SIZES = {'l': 2200, 'm': 1100}


def year_of(im):
    try:
        ex = im.getexif()
        dt = ex.get_ifd(0x8769).get(0x9003) or ex.get(0x0132)
        y = int(str(dt)[:4])
        return y if 1990 < y < 2100 else None
    except Exception:
        return None


# Küçük kareler için Real-ESRGAN (tools/realesrgan). AI_MIX: 0 = yalnız klasik, 1 = yalnız yapay zekâ
ESR = os.path.join(HERE, 'realesrgan', 'realesrgan-ncnn-vulkan.exe')
AI_MIX = 0


def upscale_ai(im):
    if not os.path.exists(ESR):
        return None
    tmp = tempfile.mkdtemp()
    try:
        a, b = os.path.join(tmp, 'in.png'), os.path.join(tmp, 'out.png')
        im.save(a)
        subprocess.run([ESR, '-i', a, '-o', b, '-n', 'realesrgan-x4plus'], cwd=os.path.dirname(ESR),
                       check=True, capture_output=True)
        return Image.open(b).convert('RGB')
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def export(src, dst_base):
    im = Image.open(src)
    y = year_of(im)
    im = ImageOps.exif_transpose(im).convert('RGB')
    w, h = im.size
    for k, edge in SIZES.items():
        out = im.copy()
        if k == 'l' and max(w, h) < edge:
            # küçük kaynak: uzun kenar sabit olsun diye büyüt
            f = edge / max(w, h)
            size = (round(w * f), round(h * f))
            classic = out.resize(size, Image.LANCZOS)
            ai = upscale_ai(out) if AI_MIX > 0 else None
            if ai is not None and AI_MIX > 0:
                out = Image.blend(classic, ai.resize(size, Image.LANCZOS), AI_MIX)
            else:
                out = classic.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
        out.thumbnail((edge, edge), Image.LANCZOS)
        out.save(f"{dst_base}_{k}.jpg", quality=82 if k == 'l' else 78, optimize=True, progressive=True)
    return w, h, y


cfg = json.load(open(os.path.join(HERE, 'series.json'), encoding='utf-8'))
if os.path.isdir(IMG):
    shutil.rmtree(IMG)
os.makedirs(IMG)
data = {'photo': [], 'film': []}

for s in cfg['photo']:
    d = os.path.join(IMG, s['id'])
    os.makedirs(d)
    files = []
    for folder in s['src']:
        p = os.path.join(SRC, folder)
        files += [os.path.join(p, n) for n in sorted(os.listdir(p)) if n.lower().endswith(('.jpg', '.jpeg'))]
    # series.json'daki "first" listesi: bu dosyalar verilen sırayla en başa alınır
    first = s.get('first', [])
    files.sort(key=lambda f: first.index(os.path.basename(f)) if os.path.basename(f) in first else len(first))
    items, years = [], []
    for i, f in enumerate(files, 1):
        # dosya adına kaynağın kısa özeti: kare değişince adres de değişir, tarayıcı önbelleği karışmaz
        st = os.stat(f)
        tag = hashlib.md5(f"{os.path.basename(f)}|{st.st_size}|{AI_MIX}".encode()).hexdigest()[:8]
        name = f"{i:02d}-{tag}"
        w, h, y = export(f, os.path.join(d, name))
        items.append({'f': f"img/{s['id']}/{name}", 'w': w, 'h': h})
        if y:
            years.append(y)
    yr = '' if not years else (str(min(years)) if min(years) == max(years) else f"{min(years)}–{max(years)}")
    data['photo'].append({'id': s['id'], 'title': s['title'], 'section': s.get('section', 'documentary'), 'place': s.get('place', ''),
                          'year': s.get('year', yr), 'items': items})
    print(s['id'], len(items), yr)

if REEL and os.path.exists(REEL) and cfg['film']:
    d = os.path.join(IMG, 'film')
    os.makedirs(d)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', REEL],
                               capture_output=True, text=True).stdout.strip())
    for s in cfg['film']:
        tmp = os.path.join(d, s['id'] + '_src.jpg')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(dur * s['at']), '-i', REEL, '-frames:v', '1', '-q:v', '2', tmp], check=True)
        w, h, _ = export(tmp, os.path.join(d, s['id']))
        os.remove(tmp)
        e = {k: s[k] for k in ('id', 'title', 'cat', 'client', 'dur', 'year', 'role')}
        e['items'] = [{'f': f"img/film/{s['id']}", 'w': w, 'h': h}]
        e['placeholder'] = True
        data['film'].append(e)
    print('film', len(data['film']), f"{dur:.0f}s")

with open(os.path.join(SITE, 'data.js'), 'w', encoding='utf-8') as fh:
    fh.write('window.SITE = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(IMG) for f in fs)
print('img total MB', round(total / 1e6, 1))
