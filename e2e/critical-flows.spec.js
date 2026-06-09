import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("homepage renders with hero and jobs", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/careers\.ky/i);
    await expect(page.locator("main, body")).toContainText(/career/i);
  });

  test("careers page shows job search and live listings", async ({ page }) => {
    await page.goto("/careers");
    const search = page.getByPlaceholder("Search by job title or employer...");
    await expect(search).toBeVisible();
    // Jobs from the WORC feed should render as links to detail pages
    const jobLinks = page.locator('a[href^="/jobs/"]');
    await expect(jobLinks.first()).toBeVisible({ timeout: 15_000 });
  });

  test("job detail page shows Express Interest as primary CTA", async ({ page }) => {
    await page.goto("/careers");
    const jobLinks = page.locator('a[href^="/jobs/"]');
    await expect(jobLinks.first()).toBeVisible({ timeout: 15_000 });
    const href = await jobLinks.first().getAttribute("href");
    await page.goto(href);
    // Signed out, the CTA invites sign-in to express interest
    await expect(page.getByText(/express interest/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("sign-in page offers OAuth providers", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText("Continue with Google")).toBeVisible();
    await expect(page.getByText("Continue with LinkedIn")).toBeVisible();
  });
});

test.describe("candidate flow (dev login)", () => {
  test("dev login creates a session and dashboard loads", async ({ page }) => {
    const res = await page.request.post("/api/dev/login-candidate", { data: {} });
    expect(res.ok()).toBeTruthy();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator("body")).not.toContainText(/sign in to continue/i);
  });
});
