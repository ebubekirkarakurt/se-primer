import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: false,
  },
  // DESIGN.md referans çerçevesi (iPhone 390×844)
  viewportWidth: 390,
  viewportHeight: 844,
  video: true,
  videoCompression: 32,
  screenshotOnRunFailure: true,
});
