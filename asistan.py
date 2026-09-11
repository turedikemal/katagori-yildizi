import os, sys, json, urllib.request, urllib.error, subprocess, time

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key and os.path.exists(".env"):
    with open(".env") as f:
        for line in f:
            if "GEMINI_API_KEY" in line:
                api_key = line.partition("=")[2].strip("'\" \n")

if not api_key:
    print("Hata: GEMINI_API_KEY bulunamadi.")
    sys.exit(1)

if len(sys.argv) < 2:
    print("Kullanim: python3 asistan.py \"Talimat\"")
    sys.exit(1)

prompt = " ".join(sys.argv[1:])
files_ctx = {}
for root, dirs, files in os.walk("."):
    if ".git" in dirs:
        dirs.remove(".git")
    for f in files:
        if f in ["asistan.py", ".env", ".DS_Store"]:
            continue
        p = os.path.relpath(os.path.join(root, f), ".")
        try:
            with open(p, "r", encoding="utf-8", errors="ignore") as fl:
                files_ctx[p] = fl.read()
        except Exception:
            pass

files_str = json.dumps(files_ctx, ensure_ascii=False)
prompt_text = (
    "Sen bir yazilim gelistiricisisin. Proje: katagori-yildizi\n"
    f"Talimat: {prompt}\n"
    f"Mevcut dosyalar:\n{files_str}\n\n"
    "Lutfen JSON formatinda uret:\n"
    '{"commit_message": "ozet", "files": [{"path": "dosya.ext", "content": "icerik"}]}'
)

body = {
    "contents": [{"parts": [{"text": prompt_text}]}],
    "generationConfig": {"responseMimeType": "application/json"}
}

# Modelleri dinamik listele ve sirala
models_to_try = []
try:
    list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    with urllib.request.urlopen(list_url, timeout=5) as res:
        m_data = json.loads(res.read().decode())
        available = [
            m.get("name", "").replace("models/", "")
            for m in m_data.get("models", [])
            if "generateContent" in m.get("supportedGenerationMethods", [])
        ]
        for m in available:
            if "flash" in m and "latest" in m and m not in models_to_try:
                models_to_try.append(m)
        for m in available:
            if "flash" in m and m not in models_to_try:
                models_to_try.append(m)
        for m in available:
            if "pro" in m and m not in models_to_try:
                models_to_try.append(m)
        for m in available:
            if m not in models_to_try:
                models_to_try.append(m)
except Exception:
    models_to_try = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro-latest"]

if not models_to_try:
    models_to_try = ["gemini-1.5-flash", "gemini-1.5-pro"]

out = None
for model_name in models_to_try:
    print(f"Deneniyor: {model_name}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode())
            txt = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
            if txt.startswith("```json"): txt = txt[7:]
            if txt.startswith("```"): txt = txt[3:]
            if txt.endswith("```"): txt = txt[:-3]
            out = json.loads(txt.strip())
            print(f" {model_name} yanit verdi!")
            break
    except urllib.error.HTTPError as e:
        if e.code in [503, 429, 404]:
            print(f"⚠️ {model_name} yogunluk/hata verdi ({e.code}), diger modele geciliyor...")
            time.sleep(0.5)
            continue
        else:
            print(f"API Hatasi ({e.code}): {e.read().decode()}")
            break
    except Exception as e:
        print(f"⚠️ {model_name} atlandi ({e}), diger modele geciliyor...")
        time.sleep(0.5)
        continue

if not out:
    print("Hata: Modellerden yanit alinamadi. Lutfen biraz sonra tekrar deneyin.")
    sys.exit(1)

for f in out.get("files", []):
    fp = f.get("path", "")
    if fp:
        if os.path.dirname(fp):
            os.makedirs(os.path.dirname(fp), exist_ok=True)
        with open(fp, "w", encoding="utf-8") as fl:
            fl.write(f.get("content", ""))
        print(f" Olusturuldu: {fp}")

msg = out.get("commit_message", "Gemini guncellemesi")
subprocess.run(["git", "add", "."])
subprocess.run(["git", "commit", "-m", msg])
ret = subprocess.run(["git", "push", "-u", "origin", "main"])
if ret.returncode == 0:
    print("\n Başarılı! GitHub ve Railway güncellendi.")
else:
    print("\n⚠️ Push tamamlanamadı.")