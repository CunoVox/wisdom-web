import { test, expect } from "@playwright/test";

test("admin recovery controls work on desktop and mobile", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@e2e.local");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("E2ePassword123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL("/");
  // Provider behavior has backend integration coverage; these are admin UI fixtures.
  let emailStatus = "FAILED", fileReady = false, refunded = false;
  await page.route("**/api/admin/email-jobs**", async route => {
    if (route.request().method() === "POST") {
      emailStatus = "PENDING";
      await route.fulfill({ json: { message: "Đã đưa email vào hàng đợi gửi lại" } });
    } else await route.fulfill({ json: [{ id: "email-job", status: emailStatus, attempts: 5,
      createdAt: new Date().toISOString(), nextAttemptAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString() }] });
  });
  await page.route("**/api/admin/file-issues", route => route.fulfill({ json: fileReady ? [] : [{
    id: "file-job", name: "Tài liệu bài học cần đối chiếu.pdf", state: "UNKNOWN",
    providerId: null, settingId: "setting-snapshot",
  }] }));
  await page.route("**/api/admin/files/file-job/reconcile", async route => {
    expect(route.request().postDataJSON()).toEqual({ providerId: "remote-file", page: 0 });
    fileReady = true;
    await route.fulfill({ json: { id: "file-job", state: "READY" } });
  });
  await page.route("**/api/admin/orders?*", route => route.fulfill({ json: { total: 1, content: [{
    id: "duplicate-order", amount: 20000, status: refunded ? "REFUNDED" : "PAID_DUPLICATE",
    createdAt: new Date().toISOString(), transactionNo: "bank-transaction",
  }] } }));
  await page.route("**/api/admin/orders/duplicate-order/refund-record", async route => {
    expect(route.request().postDataJSON()).toEqual({ reference: "bank-refund-123" });
    refunded = true;
    await route.fulfill({ json: { message: "Đã ghi nhận hoàn tiền" } });
  });
  for (const [name, width] of [["desktop", 1440], ["mobile", 390]] as const) {
    emailStatus = "FAILED"; fileReady = false; refunded = false;
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: "Lịch sử gửi email" })).toBeVisible();
    await page.getByRole("button", { name: "Gửi lại email", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/email-jobs-${name}.png`, fullPage: true });
    await page.getByRole("button", { name: "Gửi lại email", exact: true }).click();
    await expect(page.getByRole("cell", { name: "Chờ gửi", exact: true })).toBeVisible();
    await page.goto("/admin/file-issues");
    await page.getByRole("button", { name: "Xử lý file", exact: true }).click();
    await page.getByLabel("Mã file trên HaoBox").fill("remote-file");
    const fieldBounds = await page.getByLabel("Mã file trên HaoBox").boundingBox();
    expect(fieldBounds!.width).toBeGreaterThan(200);
    expect(fieldBounds!.x + fieldBounds!.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/file-recovery-${name}.png`, fullPage: true });
    await page.getByRole("button", { name: "Kiểm tra và khôi phục" }).click();
    await expect(page.getByText("Chưa có dữ liệu", { exact: true })).toBeVisible();
    await page.goto("/admin/orders");
    await page.getByText("Ghi nhận hoàn tiền", { exact: true }).click();
    await page.getByLabel("Mã đối soát / giao dịch hoàn tiền").fill("bank-refund-123");
    await page.getByRole("button", { name: "Ghi nhận đã hoàn tiền" }).click();
    await expect(page.getByText("Đã ghi nhận hoàn tiền", { exact: true }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
  }
});
