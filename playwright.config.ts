import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	// Look for test files in the "tests" directory, relative to this configuration file.
	testDir: "e2e",
	testMatch: /.*\.e2e\.ts/,

	// Run all tests in parallel.
	fullyParallel: true,

	// Fail the build on CI if you accidentally left test.only in the source code.
	forbidOnly: !!process.env.CI,

	// Retry on CI only.
	retries: process.env.CI ? 2 : 0,

	// Opt out of parallel tests on CI.
	workers: process.env.CI ? 1 : undefined,

	// Reporter to use
	reporter: "html",

	use: {
		// Base URL to use in actions like `await page.goto('/')`.
		baseURL: "http://127.0.0.1:3001",

		// Collect trace when retrying the failed test.
		trace: "on-first-retry",
	},
	// Configure projects for major browsers.
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	// Run your local dev server before starting the tests.
	webServer: [
		{
			command: "bun --filter client dev",
			url: "http://localhost:3001",
			stdout: "pipe",
			stderr: "pipe",
			timeout: 120 * 1000,
			reuseExistingServer: true,
		},
		{
			command: "bun --filter server dev",
			stdout: "pipe",
			stderr: "pipe",
			url: "http://localhost:3000",
			timeout: 120 * 1000,
			reuseExistingServer: true,
		},
	],
});
