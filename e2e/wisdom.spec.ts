import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, role: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(`${role}@e2e.local`);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("E2ePassword123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL("/");
}
test("catalog, enrollment, protected lesson, progress, bookmarks and comments", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Nhập môn lập trình web" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/catalog-desktop.png",
    fullPage: true,
  });
  await page.goto("/courses/demo-course/learn/demo-lesson");
  await expect(
    page.getByRole("alert").filter({ hasText: "Đăng ký khóa học" }),
  ).toBeVisible();
  await login(page, "student");
  await page.goto("/courses/demo-course");
  await page.getByRole("button", { name: "Lưu khóa học" }).click();
  await page.goto("/bookmarks");
  await expect(
    page.getByRole("heading", { name: "Nhập môn lập trình web" }),
  ).toBeVisible();
  await page.goto("/courses/demo-course");
  await page.getByRole("button", { name: "Đăng ký miễn phí" }).click();
  await expect(
    page.getByRole("link", { name: "Tiếp tục học", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Bài học đầu tiên" }).click();
  await expect(
    page.getByText("Nội dung bài học chỉ dành cho học viên đã đăng ký."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Đánh dấu hoàn thành", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Đã hoàn thành · Đánh dấu chưa học" }),
  ).toBeVisible();
  await page
    .getByLabel("Bình luận", { exact: true })
    .fill("Tôi đã hoàn thành bài học.");
  await page.getByRole("button", { name: "Gửi bình luận" }).click();
  await expect(
    page.getByText("Tôi đã hoàn thành bài học.", { exact: true }),
  ).toBeVisible();
  await page.goto("/learning");
  await expect(page.getByText("1/1 bài hoàn thành")).toBeVisible();
  await page.goto("/bookmarks");
  await page
    .getByRole("button", { name: "Bỏ lưu Nhập môn lập trình web" })
    .click();
  await expect(page.getByText("Bạn chưa lưu khóa học nào")).toBeVisible();
});
test("admin saves encrypted settings, keeps and deletes secret without exposing it", async ({
  page,
}) => {
  await login(page, "admin");
  await page.goto("/admin/settings");
  await expect(
    page.getByRole("heading", { name: "Cấu hình gửi email" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/settings-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("SMTP host", { exact: true }).fill("localhost");
  await page.getByLabel("Port", { exact: true }).fill("2525");
  await page.getByLabel("Username", { exact: true }).fill("test-user");
  await page
    .getByLabel("Chế độ kết nối", { exact: true })
    .selectOption("STARTTLS");
  await page
    .getByLabel("Địa chỉ người gửi", { exact: true })
    .fill("wisdom@example.com");
  await page.getByLabel("Tên người gửi", { exact: true }).fill("Wisdom");
  await page
    .getByLabel("Thao tác với secret", { exact: true })
    .selectOption("REPLACE");
  await page
    .getByLabel("SMTP password", { exact: true })
    .fill("never-return-this-secret");
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/admin/settings/SMTP") &&
      r.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Lưu cấu hình", exact: true }).click();
  expect(await (await response).text()).not.toContain(
    "never-return-this-secret",
  );
  await expect(page.getByText("Đã lưu secret", { exact: true })).toBeVisible();
  await expect(page.getByLabel("SMTP password", { exact: true })).toHaveValue(
    "",
  );
  await page.reload();
  await expect(page.getByLabel("SMTP host", { exact: true })).toHaveValue(
    "localhost",
  );
  await page
    .getByLabel("Thao tác với secret", { exact: true })
    .selectOption("DELETE");
  await page.getByRole("button", { name: "Lưu cấu hình", exact: true }).click();
  await expect(
    page.getByText("Chưa cấu hình secret", { exact: true }),
  ).toBeVisible();
});
test("instructor authors course and admin approves it", async ({ page }) => {
  await login(page, "teacher");
  await page.goto("/instructor/courses/new");
  await page
    .getByLabel("Tên khóa học", { exact: true })
    .fill("Khóa học kiểm thử E2E");
  await page
    .getByLabel("Giới thiệu ngắn", { exact: true })
    .fill("Khóa học thực hành giúp kiểm chứng toàn bộ hành trình học tập.");
  await page
    .getByLabel("Mô tả khóa học", { exact: true })
    .fill("Nội dung tạo từ trình duyệt và lưu bằng API thật.");
  await page
    .getByLabel("Danh mục", { exact: true })
    .selectOption("demo-category");
  await page.getByRole("button", { name: "Lưu bản nháp" }).click();
  await expect(
    page.getByRole("heading", { name: "Quản lý khóa học" }),
  ).toBeVisible();
  const courseUrl = page.url();
  await page.getByLabel("Tên chương", { exact: true }).fill("Chương kiểm thử");
  await page.getByRole("button", { name: "Lưu chương" }).click();
  await page.getByRole("button", { name: "Thêm bài", exact: true }).click();
  await page.getByLabel("Tiêu đề", { exact: true }).fill("Bài kiểm thử");
  await page
    .getByRole("textbox", { name: "Nội dung bài học", exact: true })
    .fill("Bài viết từ Playwright.");
  await page.getByRole("button", { name: "Lưu bài học" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Gửi duyệt", exact: true }).click();
  await expect(page.getByText("Chờ duyệt", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Menu tài khoản" }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page, "admin");
  await page.goto("/admin/courses");
  const row = page
    .getByRole("row")
    .filter({ hasText: "Khóa học kiểm thử E2E" });
  await row.getByRole("button", { name: "Duyệt", exact: true }).click();
  await expect(row.getByText("Đã xuất bản")).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Khóa học kiểm thử E2E" }),
  ).toBeVisible();
});
test("student cannot enter admin and mobile navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "student");
  await page.goto("/admin/settings");
  await expect(page.getByRole("alert")).toHaveText(
    "Bạn không có quyền truy cập khu vực này.",
  );
  await expect(page.getByRole("button", { name: "Mở menu" })).toHaveCount(0);
  await page.getByRole("button", { name: "Menu tài khoản" }).click();
  await page.screenshot({ path: "test-results/account-menu-mobile.png" });
  await expect(
    page.getByRole("navigation", { name: "Điều hướng học tập" }).getByRole("link", { name: "Khóa học của tôi" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Điều hướng học tập" }).getByRole("link", { name: "Giảng dạy" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Menu tài khoản" })).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Điều hướng học tập" })).toHaveCount(0);
  await page.getByRole("button", { name: "Menu tài khoản" }).click();
  await page.getByRole("navigation", { name: "Điều hướng học tập" }).getByRole("link", { name: "Khóa học của tôi" }).click();
  await expect(page.getByRole("navigation", { name: "Điều hướng học tập" })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Khóa học của tôi" }),
  ).toBeVisible();
  await expect(page.getByText("Đang tải dữ liệu…", {exact:true})).toHaveCount(0);
  await page.screenshot({
    path: "test-results/learning-mobile.png",
    fullPage: true,
  });
});
