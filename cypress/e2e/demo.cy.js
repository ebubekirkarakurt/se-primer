// SE Primer — ~60 saniyelik demo videosu (cypress/videos/demo.cy.js.mp4).
// Bekleme süreleri, izleyicinin her ekranı okuyabilmesi için bilinçli olarak eklenmiştir.
// Çalıştırma: npm run cy:demo

const cy$ = (name) => cy.get(`[data-cy=${name}]`);

describe("SE Primer demo", () => {
  it("Baştan sona bir oynanış (Son A)", () => {
    // 00:00 – 00:10 · Giriş: Seviye / Rol / Hedef → Başla
    cy.visit("/");
    cy.wait(2500);
    cy$("level-new").click();
    cy.wait(1800);
    cy$("role-backend").click();
    cy.wait(1800);
    cy$("goal-kvkk").click();
    cy.wait(1800);
    cy$("start").click();

    // 00:10 – 00:25 · Karar 1: Tutor'a sor, Sokratik cevabı göster, seçim yap
    cy.wait(2500);
    cy$("tutor-open").click();
    cy.wait(1500);
    cy$("tutor-input").type("A mı B mi seçeyim?", { delay: 150 });
    cy$("tutor-send").click();
    cy$("msg-tutor").should("have.length", 2);
    cy.wait(6000);
    cy$("tutor-close").click();
    cy.wait(1000);
    cy$("option-A").click();
    cy.wait(4500);
    cy$("next").click();

    // 00:25 – 00:40 · Karar 2 ve "Ne oldu / Neden oldu" geri bildirimi
    cy.wait(4000);
    cy$("option-A").click();
    cy$("feedback").should("be.visible");
    cy.wait(7000);
    cy$("next").click();

    // 00:40 – 00:55 · Karar 3 (KVKK): Maskele → Son A
    cy.wait(4500);
    cy$("option-A").click();
    cy.wait(5000);
    cy$("next").click();
    cy$("ending-A").should("be.visible");
    cy.wait(5000);

    // 00:55 – 01:00 · Tekrar Oyna
    cy$("restart").scrollIntoView().should("be.visible");
    cy.wait(4000);
  });
});
