// SE Primer — oyun akışı E2E testleri (spec.md kabul örnekleri).

const cy$ = (name) => cy.get(`[data-cy=${name}]`);

function startGame({ level = "new", role = "backend", goal = "kvkk" } = {}) {
  cy$(`level-${level}`).click();
  cy$(`role-${role}`).click();
  cy$(`goal-${goal}`).click();
  cy$("start").should("be.enabled").click();
  cy$("screen-decision").should("be.visible");
}

// Bir karar ekranında seçim yapar, geri bildirimi doğrular ve sonraki adıma geçer.
function decide(decisionId, choice) {
  cy$("screen-decision").should("have.attr", "data-decision", decisionId);
  cy$(`option-${choice}`).click();
  cy$("feedback-what").should("contain.text", "NE OLDU?");
  cy$("feedback-why").should("contain.text", "NEDEN OLDU?");
  cy$("next").click();
}

describe("SE Primer oyun akışı", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("Test 1 — Son A (İyi): Rollback → Kısa test → Maskele", () => {
    startGame();
    cy$("option-A").should("contain.text", "Rollback");
    decide("architecture", "A");
    cy$("option-A").should("contain.text", "Önce kısa test koş");
    decide("testing", "A");
    cy$("option-A").should("contain.text", "Maskele");
    decide("kvkk", "A");

    cy$("screen-result").should("have.attr", "data-ending", "A");
    cy$("ending-A")
      .should("be.visible")
      .and("contain.text", "SON A · İYİ");
    cy$("ending-title").contains("08:25 sistem ayakta, veri güvende", { matchCase: false });
    cy$("summary").find("li").should("have.length", 3);
    cy$("restart").should("be.visible");
  });

  it("Test 2 — Son B (Kötü): Karar 3'te 'Ekibe olduğu gibi at'", () => {
    startGame();
    decide("architecture", "A");
    decide("testing", "A");
    cy$("option-B").should("contain.text", "Ekibe olduğu gibi at");
    decide("kvkk", "B");

    cy$("screen-result").should("have.attr", "data-ending", "B");
    cy$("ending-B")
      .should("be.visible")
      .and("contain.text", "SON B · KÖTÜ");
    cy$("ending-title").contains("Sistem ayakta ama KVKK ihlali", { matchCase: false });
    cy$("summary-kvkk").should("contain.text", "Olduğu gibi at");
  });

  it("Test 3 — Deneyimli mod: 60 sn sayaç başlar ve geri sayar", () => {
    cy.clock();
    cy.visit("/");
    startGame({ level: "experienced" });

    cy$("timer").should("be.visible").and("have.text", "1:00");
    cy.tick(1000);
    cy$("timer").should("have.text", "0:59");
    cy.tick(49000);
    cy$("timer").should("have.text", "0:10").and("have.class", "urgent");
    // İpucu deneyimli modda otomatik gösterilmez
    cy$("hint").should("not.exist");
    cy$("show-hint").should("be.visible");
  });

  it("Deneyimli mod: süre dolunca riskli seçenek (B) uygulanır", () => {
    cy.clock();
    cy.visit("/");
    startGame({ level: "experienced" });

    cy.tick(60000);
    cy$("timeout").should("be.visible").and("contain.text", "Süre doldu");
    cy$("selected-choice").should("contain.text", "B · Canlıda yama yap");
    cy$("timer").should("not.exist");
  });

  it("Yeni başlayan modda sayaç yoktur ve ipucu otomatik görünür", () => {
    startGame({ level: "new" });
    cy$("timer").should("not.exist");
    cy$("hint").should("be.visible");
  });

  it("Sokratik Tutor cevabı vermez, soru sorar", () => {
    startGame();
    cy$("tutor-open").click();
    cy$("tutor-input").type("A mı B mi seçeyim?{enter}");
    cy$("msg-tutor")
      .last()
      .invoke("text")
      .should((text) => {
        expect(text.trim()).to.match(/\?$/);
        expect(text).to.contain("veremem");
        expect(text).not.to.match(/(^|\s)[AB](\)|\s+seçeneği)?\s+(doğru|daha iyi|en iyi)/);
      });
  });

  // Her yol: 2 × 2 × 2 = 8 kombinasyon; sonu yalnızca KVKK kararı belirler.
  const paths = [];
  for (const d1 of ["A", "B"]) for (const d2 of ["A", "B"]) for (const d3 of ["A", "B"]) paths.push([d1, d2, d3]);

  paths.forEach(([d1, d2, d3]) => {
    it(`Tüm yollar — ${d1}${d2}${d3} → Son ${d3}`, () => {
      startGame({ level: "new", role: "fullstack", goal: "testing" });
      decide("architecture", d1);
      decide("testing", d2);
      decide("kvkk", d3);
      cy$("screen-result").should("have.attr", "data-ending", d3);
      cy$("restart").click();
      cy$("screen-onboarding").should("be.visible");
      cy$("start").should("be.disabled");
    });
  });
});
