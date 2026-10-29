# SE Primer — Tasarım Sistemi (DESIGN.md)

> Google Stitch ile tasarlanan 3 mobil ekranın tasarım sistemi, renk şeması, UX kararları
> ve ekran düzenleri. Davranış kuralları için bkz. [spec.md](spec.md).

---

## 1. Tasarım Yaklaşımı ve UX Prensipleri

### 1.1 Mobil Öncelikli (Mobile-First) Düzen

| Özellik | Değer |
|---------|-------|
| Referans çerçeve | **390 × 844 px** (iPhone 12/13/14 formatı) |
| Yatay kenar boşluğu | 16 px |
| Izgara | Tek sütun, 8 px temel aralık birimi (8 / 16 / 24 / 32) |
| Güvenli alan | Üstte 47 px (çentik), altta 34 px (home indicator) boşluk |
| Minimum dokunma alanı | 48 × 48 px |
| Yönelim | Yalnızca dikey (portrait) |
| Daha geniş ekranlar | İçerik en fazla 480 px genişlikte ortalanır; yatay kaydırma yoktur |

### 1.2 UX Prensipleri

1. **Kriz hissi, karar netliği.** Arka plan koyu lacivert/siyah (`#0F172A`) ile "sabah 08:00, sistem çöktü" gerilimini verir. Kararın verildiği seçenek kartları ise açık renkli ve yüksek kontrastlıdır; göz doğrudan seçeneklere gider.
2. **Ekranda tek bir görev.** Her ekranda yalnızca bir birincil eylem vardır: *Başla*, *Seçeneklerden birini seç*, *Tekrar Oyna*. İkincil eylemler (Tutor, ipucu) görsel olarak geri planda kalır.
3. **Başparmak bölgesi.** Seçenek kartları ve birincil butonlar ekranın alt yarısında yer alır; tek elle kullanım hedeflenir.
4. **Süre baskısı görünür ama boğucu değil.** Deneyimli modda sayaç üst çubukta sabittir; son 10 saniyede rengi uyarı tonuna döner ve hafif nabız animasyonu başlar.
5. **Geri bildirim anında ve iki parçalı.** Her seçimden sonra "Ne oldu?" ve "Neden oldu?" başlıklı bir kart açılır (bkz. spec.md · Senaryo 4).
6. **Tutor rehberdir, kopya kâğıdı değil.** Tutor paneli varsayılan olarak daraltılmıştır ve oyuncu açar. Panelde cevap değil soru öne çıkar; bu yüzden mesaj balonları soru işaretli bir ikonla başlar.
7. **Renk tek başına anlam taşımaz.** Başarı ve ihlal durumları renk + ikon + metin üçlüsüyle iletilir (renk körlüğü erişilebilirliği).
8. **Erişilebilirlik.** Metin/arka plan kontrastı en az WCAG AA (4,5:1); sistem yazı boyutu büyütmesine uyum; `prefers-reduced-motion` açıksa animasyonlar kapanır.

---

## 2. 3 Mobil Ekran Tasarım Detayı

### Ekran 1 — Giriş / Onboarding

**Amaç:** Oyuncunun seviyesini, rolünü ve hedefini 3 soruda öğrenip anlatıyı kişiselleştirmek.

```
┌──────────────────────────────┐  390 px
│        (güvenli alan)        │
│  SE Primer                   │  ← Logo / başlık (H1)
│  Nöbetçi sensin. Önce seni   │  ← Alt başlık (Body, %70 opaklık)
│  tanıyalım.                  │
│                              │
│  1. Seviyen?                 │  ← Soru etiketi (H3)
│  ┌───────────┐┌───────────┐  │
│  │ Yeni      ││Deneyimli- │  │  ← Segment butonlar (2 seçenek)
│  │ başladım  ││ yim       │  │
│  └───────────┘└───────────┘  │
│                              │
│  2. Rolün?                   │
│  ┌────────┐┌────────┐┌─────┐ │
│  │Frontend││Backend ││Full-│ │  ← Chip grubu (3 seçenek)
│  └────────┘└────────┘│stack│ │
│                      └─────┘ │
│  3. Hedefin?                 │
│  ┌────────┐┌────────┐┌─────┐ │
│  │  KVKK  ││ Mimari ││Test │ │  ← Chip grubu (3 seçenek)
│  └────────┘└────────┘└─────┘ │
│                              │
│  ⓘ Deneyimli modda her karar │  ← Bilgi notu (yalnızca
│    için 60 sn'n var.         │     "Deneyimliyim" seçilince)
│                              │
│  ┌──────────────────────────┐│
│  │          Başla           ││  ← Birincil buton (sabit alt)
│  └──────────────────────────┘│
└──────────────────────────────┘  844 px
```

| Bileşen | Detay |
|---------|-------|
| Arka plan | `#0F172A` |
| Seviye seçimi | 2'li segment kontrol: **Yeni başladım** / **Deneyimliyim** |
| Rol seçimi | 3'lü tekli seçim chip grubu: **Frontend** / **Backend** / **Fullstack** |
| Hedef seçimi | 3'lü tekli seçim chip grubu: **KVKK** / **Mimari** / **Test** |
| Seçili durum | Chip dolgusu `#FFFFFF`, metin `#0F172A`, 2 px vurgu çerçevesi |
| Seçili değil | Şeffaf dolgu, 1 px `#334155` çerçeve, metin `#F8FAFC` |
| Başla butonu | Üç soru da cevaplanana kadar pasif (`opacity: 0.4`, `aria-disabled`); sonra aktif |
| Bilgi notu | "Deneyimliyim" seçilince açılır: 60 sn süre baskısı uyarısı |

**Durumlar:** Boş → Kısmen dolu (Başla pasif) → Tamamı dolu (Başla aktif).

---

### Ekran 2 — Sahne & Karar Ekranı

**Amaç:** Kriz anlatısını göstermek, oyuncunun A/B kararını almak ve Tutor desteği sunmak.
Bu ekran 3 karar için (Mimari, Test, KVKK) aynı şablonla tekrar kullanılır.

```
┌──────────────────────────────┐
│ Karar 1/3 · MİMARİ   ⏱ 0:47 │  ← Üst çubuk: ilerleme + sayaç
│ ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░ │  ← Sayaç ilerleme çubuğu
│                              │
│ ┌──────────────────────────┐ │
│ │ 🚨 08:00 · KRİZ          │ │  ← Senaryo kartı (koyu yüzey)
│ │ Randevu sistemi çöktü.   │ │
│ │ Dün gece yeni sürüm      │ │
│ │ çıktı. 300 hasta bekliyor│ │
│ └──────────────────────────┘ │
│                              │
│ Ne yaparsın?                 │
│ ┌──────────────────────────┐ │
│ │ A  Eski sürüme geri dön  │ │  ← Seçenek kartı A (beyaz)
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ B  Canlıda yama yap      │ │  ← Seçenek kartı B (beyaz)
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 💡 İpucu: Geri dönüş     │ │  ← İpucu kutusu (Yeni modda
│ │ veritabanını etkiler mi? │ │     otomatik açık)
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ? AI Tutor'a sor      ⌃  │ │  ← Daraltılmış Tutor paneli
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

**Tutor paneli genişletildiğinde (bottom sheet, ekranın ~%60'ı):**

```
┌──────────────────────────────┐
│ ─────                        │  ← Sürükleme tutamacı
│ AI Tutor · Sokratik       ✕  │
│ ┌────────────────────────┐   │
│ │ ? Geri dönmeden önce   │   │  ← Tutor balonu (sol)
│ │ veritabanı şemasının   │   │
│ │ değişip değişmediğini  │   │
│ │ nasıl anlarsın?        │   │
│ └────────────────────────┘   │
│        ┌─────────────────┐   │
│        │ Migration log'u │   │  ← Oyuncu balonu (sağ)
│        │ mu kontrol      │   │
│        │ etmeliyim?      │   │
│        └─────────────────┘   │
│ ┌────────────────────┐ ┌──┐  │
│ │ Sorunu yaz...      │ │➤ │  │  ← Mesaj girişi + gönder
│ └────────────────────┘ └──┘  │
└──────────────────────────────┘
```

**Seçim sonrası geri bildirim kartı (aynı ekranda, seçeneklerin yerine gelir):**

```
┌──────────────────────────────┐
│ Seçimin: B · Hemen yayına al │
│ ┌──────────────────────────┐ │
│ │ NE OLDU?                 │ │
│ │ Yama canlıda yeni bir    │ │
│ │ hata tetikledi...        │ │
│ ├──────────────────────────┤ │
│ │ NEDEN OLDU?              │ │
│ │ Test edilmemiş değişiklik│ │
│ │ ...                      │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │          Devam  →        │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

| Bileşen | Detay |
|---------|-------|
| Üst çubuk | "Karar n/3 · ALAN" etiketi; sağda sayaç (**yalnızca Deneyimli mod**) |
| Sayaç | 60 → 0 sn; 10 sn altında renk `#991B1B`'nin açık tonu `#F87171`'e döner + nabız animasyonu; süre dolunca B uygulanır (spec.md · Senaryo 2) |
| Senaryo kartı | `#1E293B` yüzey, sol kenarda 4 px uyarı şeridi, zaman damgası (ör. "08:00 · KRİZ") |
| Seçenek kartları A/B | `#FFFFFF` dolgu, `#0F172A` metin, sol tarafta harf rozeti (A/B), en az 64 px yükseklik, 12 px köşe yarıçapı |
| Seçenek basılı durumu | Kart %98 ölçeklenir, çerçeve kalınlaşır; seçimden sonra diğer kart sönükleşir |
| İpucu kutusu | Yeni modda otomatik açık; Deneyimli modda "İpucu göster" bağlantısı arkasında gizli |
| Tutor paneli | Daraltılmış: 56 px çubuk. Genişletilmiş: bottom sheet, mesaj geçmişi + giriş alanı |
| Geri bildirim kartı | "Ne oldu?" / "Neden oldu?" iki bölümlü kart + "Devam" birincil butonu |

**Durumlar:** Karar bekleniyor → Seçim yapıldı → Geri bildirim gösteriliyor → (Deneyimli) Süre doldu.

---

### Ekran 3 — Son Ekranı / Result

**Amaç:** Oyunun sonucunu bildirmek, karar zincirini özetlemek ve yeniden oynatmak.

```
┌──────────────────────────────┐    ┌──────────────────────────────┐
│ ┌──────────────────────────┐ │    │ ┌──────────────────────────┐ │
│ │        ✓  SON A          │ │    │ │        ⚠  SON B          │ │
│ │  08:25 Sistem ayakta,    │ │    │ │  Sistem ayakta ama       │ │
│ │  Veri Güvende            │ │    │ │  KVKK İhlali             │ │
│ └──────────────────────────┘ │    │ └──────────────────────────┘ │
│   (yeşil sonuç bandı)        │    │   (kırmızı sonuç bandı)      │
│                              │    │  Hasta adı maskelenmeden     │
│                              │    │  paylaşıldı (6698 s. KVKK).  │
│ Kararların                   │    │ Kararların                   │
│ ① Mimari  · A Geri dön    ✓ │    │ ① Mimari  · B Yama yap    ! │
│ ② Test    · A Kısa test   ✓ │    │ ② Test    · B Hemen yayın ! │
│ ③ KVKK    · A Maskele     ✓ │    │ ③ KVKK    · B Olduğu gibi ✕ │
│                              │    │                              │
│ ┌──────────────────────────┐ │    │ ┌──────────────────────────┐ │
│ │       Tekrar Oyna        │ │    │ │       Tekrar Oyna        │ │
│ └──────────────────────────┘ │    │ └──────────────────────────┘ │
└──────────────────────────────┘    └──────────────────────────────┘
```

| Bileşen | Detay |
|---------|-------|
| Sonuç bandı (Son A) | Dolgu `#166534`, beyaz metin, ✓ ikonu, başlık "08:25 Veri Güvende" |
| Sonuç bandı (Son B) | Dolgu `#991B1B`, beyaz metin, ⚠ ikonu, başlık "KVKK İhlali" + kısa KVKK açıklaması |
| Karar özeti | 3 satırlık liste: alan · seçilen seçenek · durum ikonu (✓ güvenli, ! riskli, ✕ ihlal) |
| Tekrar Oyna | Birincil buton; Ekran 1'e döner, önceki oyun saklanmaz |

---

## 3. Renk Paleti & Tipografi

### 3.1 Renk Paleti

| Token | Hex | Kullanım |
|-------|-----|----------|
| `--color-crisis-bg` | `#0F172A` | Kriz / başlangıç arka planı, uygulama zemini, kart üstü koyu metin |
| `--color-crisis-surface` | `#1E293B` | Senaryo kartı, daraltılmış Tutor çubuğu (yardımcı ton) |
| `--color-border-dark` | `#334155` | Koyu zemin üzerindeki çerçeveler (yardımcı ton) |
| `--color-card` | `#FFFFFF` | Seçenek kartları, birincil buton dolgusu |
| `--color-card-muted` | `#F8FAFC` | Koyu zemin üstü ana metin, geri bildirim kartı, Tutor paneli zemini |
| `--color-success` | `#166534` | Son A sonuç bandı, ✓ durum ikonları |
| `--color-danger` | `#991B1B` | Son B sonuç bandı, ✕ ihlal ikonları |
| `--color-danger-light` | `#F87171` | Koyu zemin üzerinde sayaç uyarısı (son 10 sn) (yardımcı ton) |

**Kontrast kontrolleri (WCAG AA ≥ 4,5:1):**

| Ön plan / Arka plan | Oran |
|---------------------|------|
| `#F8FAFC` metin / `#0F172A` zemin | ~17:1 ✓ |
| `#0F172A` metin / `#FFFFFF` kart | ~18:1 ✓ |
| `#FFFFFF` metin / `#166534` bant | ~7:1 ✓ |
| `#FFFFFF` metin / `#991B1B` bant | ~8:1 ✓ |
| `#F87171` sayaç / `#0F172A` zemin | ~6:1 ✓ |

> Not: `#166534` ve `#991B1B` koyu zemin (`#0F172A`) üzerinde metin rengi olarak **kullanılmaz** (kontrast yetersiz); yalnızca dolgu rengi olarak, üzerinde beyaz metinle kullanılır.

### 3.2 Tipografi

**Yazı tipi:** `Inter` (Türkçe karakter desteği tam), yedek: `system-ui, -apple-system, "Segoe UI", sans-serif`.
Sayaç için eş genişlikli rakamlar: `font-variant-numeric: tabular-nums` (rakamlar değişirken metin kaymaz).

| Stil | Boyut / Satır yüksekliği | Ağırlık | Kullanım |
|------|--------------------------|---------|----------|
| Display | 32 / 40 px | 800 | Son ekranı başlığı |
| H1 | 28 / 36 px | 700 | Uygulama başlığı (SE Primer) |
| H2 | 20 / 28 px | 700 | Senaryo kartı başlığı, "Ne yaparsın?" |
| H3 | 17 / 24 px | 600 | Soru etiketleri, "Ne oldu? / Neden oldu?" |
| Body | 16 / 24 px | 400 | Anlatı metni, seçenek metni |
| Caption | 13 / 18 px | 500 | Üst çubuk etiketi, bilgi notları, zaman damgası |
| Timer | 20 / 24 px | 700 | Geri sayım sayacı (tabular-nums) |

### 3.3 Diğer Tasarım Token'ları

| Token | Değer |
|-------|-------|
| Köşe yarıçapı | Kart 12 px · Buton 12 px · Chip 999 px (hap) · Bottom sheet üst 20 px |
| Gölge (açık kartlar) | `0 1px 2px rgba(15,23,42,.08), 0 4px 12px rgba(15,23,42,.12)` |
| Animasyon süresi | 150 ms (basma) · 250 ms (panel açılma) · `ease-out` |

---

## 4. Google Stitch Ekran Referansları

### 4.1 Stitch İstem (Prompt) Taslakları

Her ekran Stitch'te ayrı bir istemle, **Mobile** modunda üretilir:

- **Ekran 1:** *"Dark navy (#0F172A) mobile onboarding screen, 390x844, title 'SE Primer', subtitle 'Nöbetçi sensin. Önce seni tanıyalım.'. Three single-choice questions: Seviye (segmented: Yeni başladım / Deneyimliyim), Rol (chips: Frontend / Backend / Fullstack), Hedef (chips: KVKK / Mimari / Test). Full-width white 'Başla' button pinned to bottom. Inter font, Turkish text."*
- **Ekran 2:** *"Dark navy mobile crisis decision screen, 390x844. Top bar 'Karar 1/3 · MİMARİ' with 60-second countdown timer and progress bar. Dark slate scenario card '08:00 · KRİZ — Randevu sistemi çöktü. 300 hasta bekliyor.'. Two large white option cards labeled A 'Eski sürüme geri dön' and B 'Canlıda yama yap'. Hint box with lightbulb icon. Collapsed bottom bar 'AI Tutor'a sor' that expands into a chat bottom sheet."*
- **Ekran 3:** *"Mobile result screen, 390x844, dark navy background. Two variants: green (#166534) banner '08:25 Veri Güvende' with check icon, and red (#991B1B) banner 'KVKK İhlali' with warning icon. Below: decision summary list with 3 rows (Mimari, Test, KVKK) and status icons. White 'Tekrar Oyna' button at bottom."*

### 4.2 UI Bileşen Hiyerarşisi

```
App (390×844, bg: --color-crisis-bg)
├── Screen1_Onboarding
│   ├── Header
│   │   ├── Title "SE Primer"                         (H1)
│   │   └── Subtitle                                   (Body)
│   ├── QuestionGroup "Seviye"
│   │   ├── Label                                      (H3)
│   │   └── SegmentedControl [Yeni başladım | Deneyimliyim]
│   ├── QuestionGroup "Rol"
│   │   ├── Label                                      (H3)
│   │   └── ChipGroup [Frontend | Backend | Fullstack]
│   ├── QuestionGroup "Hedef"
│   │   ├── Label                                      (H3)
│   │   └── ChipGroup [KVKK | Mimari | Test]
│   ├── InfoNote (koşullu: Deneyimli)                  (Caption)
│   └── PrimaryButton "Başla" (disabled → enabled)
│
├── Screen2_Decision   (3 kez kullanılır: Mimari, Test, KVKK)
│   ├── TopBar
│   │   ├── StepLabel "Karar n/3 · ALAN"               (Caption)
│   │   └── CountdownTimer (koşullu: Deneyimli)        (Timer)
│   │       └── ProgressBar
│   ├── ScenarioCard
│   │   ├── Timestamp "08:00 · KRİZ"                   (Caption)
│   │   ├── Title                                      (H2)
│   │   └── Narrative                                  (Body)
│   ├── OptionList  ── (seçimden sonra FeedbackCard ile yer değiştirir)
│   │   ├── OptionCard A [Badge "A", Text]
│   │   └── OptionCard B [Badge "B", Text]
│   ├── FeedbackCard
│   │   ├── SelectedChoice
│   │   ├── Section "Ne oldu?"
│   │   ├── Section "Neden oldu?"
│   │   └── PrimaryButton "Devam"
│   ├── HintBox (Yeni: açık · Deneyimli: istek üzerine)
│   └── TutorPanel
│       ├── CollapsedBar "AI Tutor'a sor"
│       └── BottomSheet (genişletilmiş)
│           ├── Header [Title, CloseButton]
│           ├── MessageList [TutorBubble, PlayerBubble ...]
│           └── Composer [TextInput, SendButton]
│
└── Screen3_Result
    ├── ResultBanner (variant: success | danger)
    │   ├── Icon (✓ | ⚠)
    │   ├── Title ("08:25 Veri Güvende" | "KVKK İhlali")  (Display)
    │   └── Explanation (yalnızca danger)              (Body)
    ├── DecisionSummary
    │   └── SummaryRow ×3 [Alan, Seçim, DurumIkonu]
    └── PrimaryButton "Tekrar Oyna"
```

### 4.3 Ekran ↔ Spec Eşleşmesi

| Ekran | Karşıladığı kabul örneği (spec.md) |
|-------|-------------------------------------|
| Ekran 1 — Onboarding | Senaryo 1 (Kişiselleştirilmiş Başlangıç) |
| Ekran 2 — Sahne & Karar | Senaryo 2 (60 sn Süre Baskısı), Senaryo 3 (Sokratik Tutor), Senaryo 4 (Anında Geri Bildirim) |
| Ekran 3 — Result | Senaryo 5 (Son A / Son B) |

### 4.4 Stitch Çıktıları

Stitch'te üretilen ekran görüntüleri ve dışa aktarılan kod bu repoda aşağıdaki konuma konulacaktır:

```
design/
├── screen-1-onboarding.png
├── screen-2-decision.png
├── screen-2-tutor-expanded.png
├── screen-3-result-a.png
└── screen-3-result-b.png
```
