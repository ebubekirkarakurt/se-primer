# SE Primer

Yazılım mühendisliği öğrencileri için, sağlık krizinde mimari, test ve KVKK kararlarını
Sokratik bir AI Tutor rehberliğinde simüle eden mobil web oyunu.

| Belge | İçerik |
|-------|--------|
| [spec.md](spec.md) | Problem, kapsam dışı, 5 kabul örneği, akış şeması |
| [DESIGN.md](DESIGN.md) | Tasarım sistemi, 3 mobil ekran, renk ve tipografi |
| [eval.md](eval.md) · [tutor-eval.json](tutor-eval.json) | AI Tutor değerlendirmesi (20 örnek) |

## Ürün Kararları — Yapılmayan 3 Özellik

| Özellik | Neden yapılmadı |
|---------|-----------------|
| **Kullanıcı Kayıt / Giriş Sistemi (Auth)** | Oyuncunun simülasyona doğrudan erişmesini sağlamak ve sürtünmeyi (friction) en aza indirmek amacıyla anonim oturum yapısı tercih edilmiştir. |
| **İkinci Bölüm / Ek Senaryolar** | Tek bir kritik kriz senaryosuna (sağlık randevu sistemi) odaklanarak derinlemesine Sokratik öğrenme deneyimi sunmak hedeflenmiştir. |
| **Native Mobil Uygulama (iOS/Android)** | Kullanıcıların herhangi bir mağaza indirmesi yapmadan mobil tarayıcı üzerinden anında erişebilmesi için duyarlı (responsive) web mimarisi seçilmiştir. |

## Çalıştırma

Derleme adımı yoktur; statik dosyalar herhangi bir sunucuyla açılır:

```bash
python -m http.server 5173
```

Ardından `http://localhost:5173` adresini telefonda veya tarayıcının mobil görünümünde açın.

## Testler (Cypress E2E)

İlk kurulum:

```bash
npm install
```

Sunucu açıkken (`python -m http.server 5173`) tüm testleri koşmak için:

```bash
npx cypress run
```

Sunucuyu otomatik başlatıp testleri koşmak için:

```bash
npm run test:e2e
```

Yalnızca 60 saniyelik demo videosunu üretmek için:

```bash
npm run cy:demo
```

| Spec | Kapsam |
|------|--------|
| `cypress/e2e/game_flow.cy.js` | Son A akışı, Son B akışı, deneyimli mod 60 sn sayaç, süre dolması, yeni başlayan modu, Sokratik Tutor, 8 yolun tamamı |
| `cypress/e2e/demo.cy.js` | ~60 sn'lik baştan sona oynanış; video `cypress/videos/demo.cy.js.mp4` dosyasına kaydedilir |

Videolar 390×844 (iPhone) görünümünde kaydedilir.

## Dosya Yapısı

| Dosya | İçerik |
|-------|--------|
| `index.html`, `styles.css` | Uygulama iskeleti ve DESIGN.md token'ları |
| `src/scenario.js` | 3 karar, rol bazlı anlatı, geri bildirimler, sonlar |
| `src/main.js` | Ekranlar, oyun akışı, 60 sn sayaç |
| `src/prompts.js` | Sokratik Tutor sistem prompt'u |
| `src/tutor.js` | Tutor: Gemini + çevrimdışı soru motoru + cevap sızıntısı süzgeci |
| `eval/run-eval.mjs` | Tutor değerlendirmesini yeniden üretir (`npm run eval`) |

## AI Tutor

- Google AI Studio'da çalışırken `process.env.API_KEY` (veya `GEMINI_API_KEY`) varsa
  `gemini-2.5-flash` modeli `src/prompts.js` içindeki sistem prompt'uyla kullanılır.
- Anahtar yoksa veya istek başarısız olursa çevrimdışı Sokratik soru bankası devreye girer.
- Her iki durumda da yanıt `revealsAnswer()` süzgecinden geçer: doğru seçeneği ele veren
  yanıt atılır ve yerine bir Sokratik soru gösterilir; soru içermeyen yanıta soru eklenir.
