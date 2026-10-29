// Sokratik AI Tutor: Gemini varsa onu kullanır, yoksa çevrimdışı soru motoruna düşer.
// Her iki yolda da yanıt, cevabı ele vermediğinden emin olmak için süzgeçten geçer.

import { buildTutorSystemPrompt } from "./prompts.js";

const GEMINI_MODEL = "gemini-2.5-flash";

// Karar başına Sokratik soru bankası. `keys` oyuncunun mesajında geçen konuyu yakalar.
const QUESTION_BANK = {
  architecture: [
    { keys: ["şema", "veritaban", "migration", "db", "tablo"], q: "Geri dönmeden önce veritabanı şemasının değişip değişmediğini nasıl anlarsın?" },
    { keys: ["rollback", "geri dön", "eski sürüm"], q: "Eski kod, gece değişmiş olabilecek bir veritabanıyla karşılaşırsa ne olur?" },
    { keys: ["hotfix", "yama", "düzelt"], q: "Kök nedeni henüz bilmiyorsan, yamanın ne kadar süreceğini nasıl tahmin edersin?" },
    { keys: ["süre", "zaman", "hızlı", "hasta", "bekl"], q: "Şu an önceliğin kök nedeni bulmak mı, yoksa hastaların beklemesini durdurmak mı? Neden?" },
    { keys: ["risk", "güvenli", "tehlike"], q: "Her iki seçenekte de 10 dakika sonra sistemin hangi durumda olacağını ne kadar kesin söyleyebilirsin?" },
    { keys: ["log", "hata", "neden", "kök"], q: "Loglarda hatanın yeni sürümle başladığını gösteren bir iz var mı, bunu nasıl doğrularsın?" },
    { keys: ["veri", "kayıt", "randevu"], q: "Gece boyunca yeni sürümle oluşturulan randevu kayıtlarına ne olacağını düşündün mü?" },
    { keys: ["ekip", "kim", "yardım", "onay"], q: "Bu kararı tek başına mı vermelisin, yoksa önce kimi bilgilendirmen gerekir?" },
    { keys: ["kullanıcı", "ekran", "arayüz", "frontend"], q: "Hastalar şu an ekranda ne görüyor ve bu, kararının aciliyetini nasıl etkiliyor?" },
    { keys: [], q: "Dün geceki sürümde tam olarak neler değişti ve bunlardan hangileri geri alınabilir?" },
  ],
  testing: [
    { keys: ["kapsa", "smoke", "duman"], q: "3 dakikalık bir test hangi kritik yolları kapsıyor, hangilerini kapsamıyor?" },
    { keys: ["süre", "zaman", "hızlı", "bekl", "acele"], q: "3 dakikalık gecikmeyi, olası ikinci bir kesintinin süresiyle nasıl karşılaştırırsın?" },
    { keys: ["yayın", "deploy", "canlı", "prod"], q: "Değişiklik canlıda bozulursa bunu kim, ne kadar sürede fark eder?" },
    { keys: ["hata", "bug", "bozul"], q: "Düzelttiğin sorunun yanında başka bir şeyi bozmadığını nasıl bilebilirsin?" },
    { keys: ["risk", "güvenli"], q: "Baskı altındayken riski azaltmanın, adımları atlamaktan başka hangi yolları var?" },
    { keys: ["test", "zorunda"], q: "Bu değişiklikte seni en çok endişelendiren kısım hangisi ve onu nasıl gözlemleyebilirsin?" },
    { keys: ["geri al", "rollback", "dön"], q: "Yayından sonra bir sorun çıkarsa geri dönüş planın ne olurdu?" },
    { keys: ["hasta", "kullanıcı"], q: "Bu değişikliğin en kötü senaryoda kaç hastayı etkileyeceğini düşündün mü?" },
    { keys: ["otomatik", "pipeline", "ci"], q: "Testin hangi kısmı otomatik, hangi kısmı senin elle kontrolüne bağlı?" },
    { keys: [], q: "Değişikliğin gerçekten çalıştığını yayından önce hangi kanıtla gösterebilirsin?" },
  ],
  kvkk: [
    { keys: ["kvkk", "yasa", "kanun", "hukuk", "ihlal"], q: "KVKK'ya göre sağlık verisi hangi veri kategorisine girer ve bu neyi değiştirir?" },
    { keys: ["ad", "isim"], q: "Ekibin kök nedeni bulması için hastanın adını bilmesi gerekiyor mu?" },
    { keys: ["mask", "anonim", "gizle", "sansür"], q: "Logun hangi alanları hata ayıklama için gerekli, hangileri değil?" },
    { keys: ["ekip", "kanal", "paylaş", "gönder", "at"], q: "Bu log paylaşıldığı kanalda kimler tarafından görülebilir?" },
    { keys: ["süre", "hızlı", "zaman"], q: "Hız kazanmak için paylaştığın bir veriyi sonradan geri alabilir misin?" },
    { keys: ["güven", "dış", "danışman"], q: "Bir verinin kimlerle paylaşılabileceğini neye göre belirlersin: güvene mi, amaca mı?" },
    { keys: ["bölüm", "onkoloji", "sağlık"], q: "Hastanın hangi bölümde randevusu olduğu bilgisi tek başına ne anlatır?" },
    { keys: ["log", "kayıt"], q: "Hasta bilgilerinin loga düşmesini gelecekte nasıl önleyebilirsin?" },
    { keys: ["hasta", "kişi"], q: "Logdaki hasta sen olsaydın, bilgilerinin nerelere gitmesini isterdin?" },
    { keys: [], q: "Bu logu paylaşmanın amacı ne ve bu amaç için hangi bilgiler yeterli?" },
  ],
};

// Soru bankası tükendiğinde kullanılan, karara bağlı olmayan yansıtma soruları.
const REFLECTIVE = [
  "Şimdiye kadar düşündüklerini özetlesen, iki seçeneğin en kötü sonuçları neler?",
  "Bu kararı bir yıl sonra bir meslektaşına anlatsan, hangi gerekçeyi öne çıkarırdın?",
  "Kararını değiştirecek tek bir bilgi olsaydı, bu ne olurdu?",
  "Hangi varsayımına en az güveniyorsun ve onu nasıl sınayabilirsin?",
];

// Oyuncunun mesajı senaryoyla ilgili mi? Hiçbiri yoksa konu dışı sayılır.
const DOMAIN_TERMS = [
  "seçenek", "şık", "karar", "sistem", "sürüm", "hasta", "log", "test", "veri", "kvkk",
  "rollback", "hotfix", "yama", "yayın", "deploy", "kod", "hata", "randevu", "ekip", "mask",
  "risk", "migration", "şema", "veritaban", "kriz", "çöktü", "ipucu", "cevap", "doğru",
];

const ANSWER_SEEKING = [
  /hangisi|doğru|cevap|söyle|ne yap(ay[ıi]m|mal[ıi]y[ıi]m)|ne seç|seçmeli|seçeyim|seçerdin|öner|tavsiye|en iyi/,
  /(^|[^\p{L}])[ab] m[ıi](?![\p{L}])|(^|[^\p{L}])[ab] mi(?![\p{L}])/u,
  /evet (ya da|veya|mi) hayır|evet\/hayır/,
  /tell me|the answer|which (one|option|is)|pick (one|for me)|choose for me|should i|a or b|just say/,
];

const UNETHICAL = /cezadan|cezas[ıi]ndan|cezay[ıi] (önle|engelle|atla)|kimse (fark|görmez|bilmez|duymaz)|fark edilmeden|yakalanma|nas[ıi]l kaçar|kaçabilir miyim|gizlice|örtbas/;

const DEFINITION = /\s*(ne demek|nedir|ne anlama gelir|ne anlama geliyor|what is|what does .* mean)\s*\??\s*$/;

const REFUSALS = [
  "Bu kararı senin yerine veremem; ama birlikte düşünebiliriz.",
  "Cevabı ben söylersem kararı sen vermemiş olursun.",
  "Doğru seçeneği söylemeyeceğim, ama sana yol gösterecek bir soru sorabilirim.",
];

const ACKS = ["Birlikte bakalım.", "Bunu biraz açalım.", "Şöyle düşünelim."];

const OFF_TOPIC = "Bu, şu anki krizin dışında kalıyor; karara geri dönelim.";

const ETHICS = "Amaç cezadan kaçmak değil, hastaların verisini korumak; KVKK'nın neden var olduğunu düşünelim.";

const GOAL_LABEL = { kvkk: "KVKK", architecture: "mimari", testing: "test" };

function lower(text) {
  return text.toLocaleLowerCase("tr");
}

/* ---------- Cevap sızıntısı süzgeci ---------- */

// Her seçeneği işaret eden kökler (etiketler, kısa adlar, eş anlamlılar).
const OPTION_STEMS = {
  architecture: {
    A: ["eski sürüm", "geri dön", "geri al", "rollback", "önceki sürüm"],
    B: ["yama", "hotfix", "canlıda düzelt", "canlıda yama"],
  },
  testing: {
    A: ["kısa test", "test koş", "testi koş", "testleri koş", "önce test"],
    B: ["hemen yayın", "yayına al", "testi atla", "test etmeden", "testsiz"],
  },
  kvkk: {
    A: ["maskele", "anonimleştir", "gizle", "sansürle"],
    B: ["olduğu gibi", "ekibe at", "maskelemeden", "açık haliyle"],
  },
};

const OPTION_LETTER = [
  /(^|[^\p{L}])[AB](?![\p{L}])/u, // büyük harf tek başına: "A", "B)"
  /(^|[^\p{L}])[ab]['’](y[ıi]|ye|ya|n[ıi]n|da|de)(?![\p{L}])/u, // "A'yı", "B'ye"
  /(^|[^\p{L}])[ab] (seçeneğ|seçenek|şık|option)/u,
  /(birinci|ikinci|ilk|son|diğer|first|second|other) (seçenek|şık|yol|option)/u,
];

// Öneri, zorunluluk veya değerlendirme bildiren işaretler.
const VERDICT = new RegExp(
  [
    "doğru", "yanlış", "daha iyi", "en iyi", "güvenli", "mantıklı", "akıllıca", "isabetli",
    "önerilir", "öneririm", "tavsiye", "mutlaka", "kesinlikle", "şart", "gerek", "lazım", "yeterli",
    "ihlal", "aykırı", "hata olur", "kötü", "riskli", "felaket",
    "m[ae]l[ıi](s[ıi]n([ıi]z)?)?(?![\\p{L}])", // -malısın / -melisin / -meli
    "olsam", "(ar|er|ır|ir|ur|ür)d[ıi]m(?![\\p{L}])", // ben olsam ... dönerdim
    "seç(?![\\p{L}])", "seçin(?![\\p{L}])", "tercih et",
    "answer is", "should", "must", "go with", "way to go", "pick", "choose", "better", "best", "correct", "wrong",
  ].join("|"),
  "u",
);

function mentionsOption(original, lowered, decisionId) {
  if (OPTION_LETTER.some((p) => p.test(original) || p.test(lowered))) return true;
  const stems = OPTION_STEMS[decisionId] ?? { A: [], B: [] };
  return [...stems.A, ...stems.B].some((s) => lowered.includes(s));
}

// Bir tutor yanıtının doğru seçeneği ele verip vermediğini yakalar.
// Kural: soru olmayan bir cümle hem bir seçeneği işaret edip hem de öneri/değerlendirme içeriyorsa sızıntıdır.
export function revealsAnswer(text, decision) {
  const sentences = text.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
  return sentences.some((sentence) => {
    if (sentence.endsWith("?")) return false;
    const l = lower(sentence);
    // Seçenek etiketinin birebir geçtiği öneriler (ör. "Hemen yayına al en doğrusu.")
    const labels = ["A", "B"].map((k) => lower(decision.options[k].label));
    const mentioned = mentionsOption(sentence, l, decision.id) || labels.some((lb) => l.includes(lb));
    return mentioned && VERDICT.test(l);
  });
}

/* ---------- Tutor ---------- */

export function createTutor({ profile, decision }) {
  const bank = QUESTION_BANK[decision.id];
  const asked = []; // sorulan soruların sırası
  const history = [];
  let turn = 0;

  const wasAsked = (q) => asked.includes(q);

  function take(q) {
    asked.push(q);
    return q;
  }

  // Önce konuyla eşleşen, sonra herhangi bir sorulmamış soru; tükenirse yansıtma soruları;
  // o da tükenirse son 4 soruyu tekrar etmeden döngüye girer.
  function nextQuestion(message) {
    const text = lower(message);
    const fresh = bank.filter((item) => !wasAsked(item.q));
    const match = fresh.find((item) => item.keys.some((k) => text.includes(k))) ?? fresh[0];
    if (match) return take(match.q);
    const reflective = REFLECTIVE.find((q) => !wasAsked(q));
    if (reflective) return take(reflective);
    const recent = asked.slice(-4);
    const pool = [...bank.map((b) => b.q), ...REFLECTIVE].filter((q) => !recent.includes(q));
    return take(pool[turn % pool.length]);
  }

  function definitionReply(message) {
    const term = message.trim().replace(DEFINITION, "").trim();
    return take(
      `Önce senin tahminini duymak isterim: "${term}" sence ne anlama geliyor ve bu karardaki hangi bilgiyi etkiliyor?`,
    );
  }

  function offlineReply(message) {
    const text = lower(message);
    if (UNETHICAL.test(text)) return `${ETHICS} ${nextQuestion("kvkk yasa")}`;
    if (ANSWER_SEEKING.some((p) => p.test(text))) {
      return `${REFUSALS[turn % REFUSALS.length]} ${nextQuestion(message)}`;
    }
    if (DEFINITION.test(text)) return `Bu kavramı birlikte keşfedelim. ${definitionReply(message)}`;
    if (!DOMAIN_TERMS.some((t) => text.includes(t))) return `${OFF_TOPIC} ${nextQuestion(message)}`;
    return `${ACKS[turn % ACKS.length]} ${nextQuestion(message)}`;
  }

  // Yanıtı ele vermezlik ve "soruyla bitme" kurallarına göre denetler.
  function guard(reply, message) {
    if (!reply || revealsAnswer(reply, decision)) return offlineReply(message);
    return reply.includes("?") ? reply : `${reply} ${nextQuestion(message)}`;
  }

  function opening() {
    const focus =
      decision.goal === profile.goal
        ? `Bu karar hedefinle (${GOAL_LABEL[profile.goal]}) doğrudan ilgili. `
        : "";
    return `${focus}Cevabı söylemeyeceğim ama düşünmene yardım edeceğim. ${take(bank[bank.length - 1].q)}`;
  }

  async function ask(message) {
    let reply;
    try {
      reply = await askGemini(message);
    } catch (err) {
      console.warn("Gemini kullanılamadı, çevrimdışı tutora geçildi:", err);
    }
    reply = reply ? guard(reply, message) : offlineReply(message);
    history.push({ role: "user", text: message }, { role: "model", text: reply });
    turn += 1;
    return reply;
  }

  async function askGemini(message) {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const { GoogleGenAI } = await import("https://esm.sh/@google/genai@1.20.0");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: "user", parts: [{ text: message }] },
      ],
      config: {
        systemInstruction: buildTutorSystemPrompt({ profile, decision }),
        temperature: 0.7,
        maxOutputTokens: 200,
      },
    });
    return response.text?.trim() || null;
  }

  return { opening, ask };
}

// Google AI Studio, anahtarı process.env üzerinden enjekte eder; yerelde yoksa çevrimdışı çalışılır.
function getApiKey() {
  try {
    return process.env.API_KEY || process.env.GEMINI_API_KEY || null;
  } catch {
    return null;
  }
}
