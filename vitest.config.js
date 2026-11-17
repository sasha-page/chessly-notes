import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

// Two ways to run the same test files:
//   jsdom   - a fake page inside Node, for quick runs while working (npm test)
//   firefox - real Firefox through Playwright, before merging (npm run test:firefox)
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["tests/**/*.test.js"],
        },
      },
      {
        test: {
          name: "firefox",
          include: ["tests/**/*.test.js"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "firefox" }],
          },
        },
      },
    ],
  },
});
