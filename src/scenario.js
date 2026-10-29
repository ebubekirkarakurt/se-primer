// SE Primer — senaryo içeriği.
// Tüm hasta adları ve kayıtlar kurgusaldır (spec.md · Kapsam Dışı).

export const LEVELS = [
  { id: "new", label: "Yeni başladım" },
  { id: "experienced", label: "Deneyimliyim" },
];

export const ROLES = [
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "fullstack", label: "Fullstack" },
];

export const GOALS = [
  { id: "kvkk", label: "KVKK" },
  { id: "architecture", label: "Mimari" },
  { id: "testing", label: "Test" },
];

export const DECISION_SECONDS = 60;

// Rol bazlı kriz girişi: anlatı oyuncunun rolüne uyar (spec.md · Senaryo 1).
export const CRISIS_INTRO = {
  frontend:
    "Telefonun titriyor. Randevu ekranı beyaz sayfa gösteriyor, tarayıcı konsolu kırmızı hatalarla dolu. Frontend tarafında ilk fark eden sensin.",
  backend:
    "Telefonun titriyor. Randevu API'si 500 dönüyor, sunucu logları hızla akıyor. Backend tarafında ilk fark eden sensin.",
  fullstack:
    "Telefonun titriyor. Ekran beyaz, API 500 dönüyor. Uçtan uca sistemi bilen tek kişi olarak ilk fark eden sensin.",
};

export const DECISIONS = [
  {
    id: "architecture",
    step: 1,
    area: "MİMARİ",
    goal: "architecture",
    time: "08:00",
    title: "Randevu sistemi çöktü",
    narrative:
      "Dün gece yeni sürüm çıktı. 300 hasta randevusunu bekliyor. Sistemi nasıl ayağa kaldıracaksın?",
    roleNote: {
      frontend: "Sorunun yeni arayüz paketinde mi, yoksa API'de mi olduğundan henüz emin değilsin.",
      backend: "Gece çalışan sürümde bir veritabanı migration'ı da vardı.",
      fullstack: "Sürüm hem arayüzü hem de veritabanı şemasını değiştirdi.",
    },
    options: {
      A: { label: "Eski sürüme geri dön", short: "Rollback" },
      B: { label: "Canlıda yama yap", short: "Hotfix" },
    },
    hint: "Geri dönüş, yeni sürümün veritabanında yaptığı değişiklikleri de geri alır mı?",
    feedback: {
      A: {
        what:
          "Bilinen son sağlam sürüme döndün. Migration geriye uyumlu olduğu için eski kod yeni şemayla çalıştı; 08:12'de randevu ekranı tekrar açıldı.",
        why:
          "Rollback, kök nedeni bulmadan kullanıcı etkisini hızla durdurur. Bilinen bir duruma dönmek, baskı altında bilinmeyen bir değişiklik yazmaktan daha az risklidir.",
      },
      B: {
        what:
          "Hatayı canlı ortamda düzeltmeye başladın. Kök nedeni buldun ama yamayı yazmak 20 dakika sürdü; bu sürede hastalar randevu alamadı.",
        why:
          "Hotfix kalıcı çözüme götürebilir ama kesinti süresini uzatır ve baskı altında yazılan kod yeni hata riski taşır. Kesinti anında önce etkiyi durdurmak genellikle daha güvenlidir.",
      },
    },
  },
  {
    id: "testing",
    step: 2,
    area: "TEST",
    goal: "testing",
    time: "08:14",
    title: "Değişiklik yayına hazır",
    narrative:
      "Düzeltme hazır görünüyor. Bekleme salonundaki hastalar sıraya girmeye başladı. Değişikliği nasıl yayına alacaksın?",
    roleNote: {
      frontend: "Randevu formunun uçtan uca testi yaklaşık 3 dakika sürüyor.",
      backend: "API'nin duman (smoke) testleri yaklaşık 3 dakika sürüyor.",
      fullstack: "Kritik yolu kapsayan kısa test paketi yaklaşık 3 dakika sürüyor.",
    },
    options: {
      A: { label: "Önce kısa test koş", short: "Kısa test" },
      B: { label: "Hemen yayına al", short: "Hemen yayın" },
    },
    hint: "3 dakikalık bir test, olası ikinci bir kesintiye kıyasla ne kadar pahalı?",
    feedback: {
      A: {
        what:
          "Kısa test paketi bir hatayı yakaladı: randevu iptal butonu çalışmıyordu. Düzeltip tekrar test ettin ve güvenle yayına aldın.",
        why:
          "Kritik yolu kapsayan kısa bir duman testi, kriz anında bile en ucuz sigortadır. Birkaç dakikalık gecikme, ikinci bir kesintiden çok daha az maliyetlidir.",
      },
      B: {
        what:
          "Değişiklik test edilmeden yayına çıktı. Randevu alma çalıştı ama iptal butonu bozuldu; destek hattı yeni şikâyetlerle doldu.",
        why:
          "Test edilmemiş bir değişiklik, düzelttiğini sandığın sorunun yanında yeni bir hata getirebilir. Baskı, testi atlamak için değil, testi küçültmek için bir nedendir.",
      },
    },
  },
  {
    id: "kvkk",
    step: 3,
    area: "KVKK",
    goal: "kvkk",
    time: "08:20",
    title: "Logda hasta adı var",
    narrative:
      "Sistem ayakta. Ekip, olayın kök neden analizi için hata logunu istiyor. Logda hasta adları ve randevu bölümleri açık metin olarak duruyor (ör. \"Ayşe Y. — Onkoloji\").",
    roleNote: {
      frontend: "Hata, formdan gönderilen hasta bilgilerinin konsola yazılmasından kaynaklanıyor.",
      backend: "Hata, istek gövdesinin olduğu gibi loglanmasından kaynaklanıyor.",
      fullstack: "Hasta bilgileri hem istemci hem sunucu loglarına düşmüş.",
    },
    options: {
      A: { label: "Maskele", short: "Maskele" },
      B: { label: "Ekibe olduğu gibi at", short: "Olduğu gibi at" },
    },
    hint: "Ekibin kök nedeni bulması için hastanın adını bilmesi gerekiyor mu?",
    feedback: {
      A: {
        what:
          "Hasta adlarını ve bölüm bilgisini maskeleyerek (ör. \"A*** Y. — [bölüm]\") logu ekiple paylaştın. Ekip kök nedeni yine buldu.",
        why:
          "6698 sayılı KVKK'ya göre sağlık verisi özel nitelikli kişisel veridir. Veri minimizasyonu ilkesi gereği, amaç için gerekmeyen kişisel veri paylaşılmaz.",
      },
      B: {
        what:
          "Log, hasta adları ve bölümleriyle birlikte ekip kanalına gönderildi. Kanalda dış danışmanlar da vardı.",
        why:
          "Sağlık verisi KVKK'da özel nitelikli kişisel veridir; amaca gerekli olmayan kişilerle maskelenmeden paylaşmak veri ihlalidir ve bildirim yükümlülüğü doğurabilir.",
      },
    },
  },
];

export const ENDINGS = {
  A: {
    id: "A",
    variant: "success",
    tag: "SON A · İYİ",
    title: "08:25 Sistem ayakta, veri güvende",
    text: "Randevu sistemi çalışıyor ve hiçbir hasta verisi gereksiz yere paylaşılmadı.",
  },
  B: {
    id: "B",
    variant: "danger",
    tag: "SON B · KÖTÜ",
    title: "Sistem ayakta ama KVKK ihlali",
    text:
      "Hasta adları maskelenmeden paylaşıldı. 6698 sayılı KVKK'ya göre sağlık verisi özel nitelikli kişisel veridir; bu paylaşım bir veri ihlalidir.",
  },
};

// Sonu yalnızca KVKK kararı belirler (spec.md · Akış Kuralları 1).
export function endingFor(choices) {
  return choices.kvkk === "A" ? ENDINGS.A : ENDINGS.B;
}

// Özet satırı durumu: A güvenli, B riskli, KVKK'da B ihlal.
export function choiceStatus(decisionId, choice) {
  if (choice === "A") return "safe";
  return decisionId === "kvkk" ? "breach" : "risky";
}
