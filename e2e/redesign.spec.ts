import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";

// Illustrative catalog data is confined to this browser test. Production uses the API.
const categories = [
  { id: "demo-category", name: "Công nghệ", parentId: null },
  { id: "design", name: "Thiết kế", parentId: null },
  { id: "languages", name: "Ngoại ngữ", parentId: null },
  { id: "office", name: "Tin học văn phòng", parentId: null },
  { id: "english", name: "Tiếng Anh", parentId: "languages" },
  { id: "ielts", name: "IELTS", parentId: "english" },
];
const titles = ["Lập trình web từ những bước đầu tiên", "Thiết kế giao diện với Figma", "Tiếng Anh giao tiếp trong công việc", "Excel: từ cơ bản đến ứng dụng", "Quản lý mã nguồn với Git & GitHub", "Tư duy thiết kế cho người mới bắt đầu", "Xây dựng ứng dụng với Java Spring Boot", "Kể chuyện bằng dữ liệu"];
const courses = titles.map((title, i) => ({ id: `visual-${i}`, ownerId: "demo-teacher", categoryId: categories[i % 4].id,
  title, instructor: "Giảng viên minh họa", category: categories[i % 4].name,
  introduction: "Bắt đầu từ nền tảng, thực hành từng bước và vận dụng kiến thức vào công việc của bạn.",
  description: "<p>Khóa học giúp bạn làm quen với kiến thức nền tảng thông qua các bài học và ví dụ thực hành.</p><h3>Nội dung bạn sẽ khám phá</h3><ul><li>Các khái niệm cơ bản và cách áp dụng.</li><li>Thực hành theo từng chương, từ đơn giản đến hoàn chỉnh.</li></ul>",
  price: i === 0 ? 0 : 255000 + i * 20000, enrollments: i * 13, status: "PUBLISHED",
  chapters: [{ id: "intro", title: "Bắt đầu hành trình học tập", lessons: [{ id: "demo-lesson", title: "Giới thiệu khóa học", kind: "ARTICLE", preview: true }] },
    { id: "practice", title: "Kiến thức nền tảng và thực hành", lessons: [{ id: "practice-lesson", title: "Thực hành đầu tiên", kind: "VIDEO", preview: false }] }], reviews: [],
}));

async function catalogFixtures(page: Page) {
  await page.route("**/api/public/categories", route => route.fulfill({ json: categories }));
  await page.route("**/api/public/courses**", route => {
    const url = new URL(route.request().url());
    const id = url.pathname.split("/").at(-1);
    if (id !== "courses") return id?.startsWith("visual-") ? route.fulfill({ json: courses.find(c => c.id === id) }) : route.continue();
    const category = url.searchParams.get("category"), q = url.searchParams.get("q")?.toLowerCase();
    const filtered = courses.filter(c => (!category || c.categoryId === category) && (!q || c.title.toLowerCase().includes(q)));
    return route.fulfill({ json: { content: filtered, total: filtered.length } });
  });
}

async function capture(page: Page, name: string) {
  await expect(page.locator('main [role="status"]')).toHaveCount(0);
  await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${name}: horizontal page overflow`).toBeTruthy();
  await page.screenshot({ path: `.impeccable/review/${name}.png`, fullPage: true, animations: "disabled" });
}

test("marketplace, detail and login render at desktop and mobile widths", async ({ page }) => {
  test.setTimeout(120000);
  fs.mkdirSync(".impeccable/review", { recursive: true });
  await catalogFixtures(page);
  for (const [device, width] of [["desktop", 1440], ["mobile", 390]] as const) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: titles[0] })).toBeVisible();
    await expect(page.locator(".shell > aside")).toHaveCount(0);
    await capture(page, device);
    const picker = page.locator("header").getByRole("button", { name: "Danh mục", exact: true });
    await picker.click();
    await page.getByRole("button", { name: "Mở danh mục con của Ngoại ngữ" }).click();
    await page.getByRole("button", { name: "Mở danh mục con của Tiếng Anh" }).click();
    await expect(page.getByRole("button", { name: "IELTS", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(picker).toBeFocused();
    await page.locator(".topic-tabs").getByRole("button", { name: "Thiết kế", exact: true }).click();
    await expect(page).toHaveURL(/category=design/);
    await expect(page.locator(".course-card")).toHaveCount(2);
    await page.goto("/courses/visual-0");
    await expect(page.getByRole("heading", { name: titles[0], exact: true })).toBeVisible();
    await capture(page, `detail-${device}`);
    await page.locator(".curriculum-chapter").nth(1).locator("summary").click();
    await expect(page.getByRole("link", { name: "Thực hành đầu tiên" })).toBeVisible();
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Chào mừng trở lại" })).toBeVisible();
    await capture(page, `login-${device}`);
  }
});

test("workspaces and learning keep their functions and fit both viewports", async ({ page }) => {
  test.setTimeout(180000);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@e2e.local");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("E2ePassword123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/courses/demo-course");
  await page.getByRole("button", { name: "Đăng ký miễn phí", exact: true }).click();
  await expect(page.getByRole("link", { name: "Tiếp tục học", exact: true })).toBeVisible();
  // The real seed body is one sentence. Extend only this visual fixture to exercise reading layout.
  await page.route("**/api/public/lessons/demo-lesson", async route => {
    const response = await route.fetch();
    const lesson = await response.json();
    await route.fulfill({ response, json: { ...lesson, body: `<p>${lesson.body}</p><h2>Hiểu cách một trang web hoạt động</h2><p>Khi bạn mở một địa chỉ trong trình duyệt, máy tính gửi yêu cầu đến máy chủ. Máy chủ trả về nội dung để trình duyệt hiển thị thành trang web bạn đang xem.</p><p>Trong bài này, chúng ta bắt đầu với ba thành phần quen thuộc: HTML mô tả nội dung, CSS định dạng giao diện và JavaScript bổ sung tương tác.</p><h3>Chuẩn bị cho bài thực hành</h3><ul><li>Mở trình soạn thảo và tạo một thư mục dành cho dự án.</li><li>Tạo file index.html để lưu cấu trúc trang đầu tiên.</li><li>Mở file bằng trình duyệt và quan sát kết quả khi thay đổi nội dung.</li></ul><pre><code>&lt;h1&gt;Xin chào, Wisdom!&lt;/h1&gt;\n&lt;p&gt;Đây là trang web đầu tiên của tôi.&lt;/p&gt;</code></pre><p>Hãy thử thay đổi tiêu đề và thêm một đoạn giới thiệu bản thân. Sau khi hoàn thành, đánh dấu bài học và chuyển sang bài tiếp theo.</p>` } });
  });
  const routes = [
    ["/admin", "Tổng quan hệ thống", "dashboard"],
    ["/admin/users", "Quản lý tài khoản", "users"],
    ["/admin/settings", "Cài đặt hệ thống", "settings"],
    ["/instructor/courses/new", "Khóa học mới", "editor"],
    ["/profile", "Hồ sơ cá nhân", "profile"],
    ["/courses/demo-course/learn/demo-lesson", "Bài học đầu tiên", "lesson"],
  ];
  for (const [device, width] of [["desktop", 1440], ["mobile", 390]] as const) {
    await page.setViewportSize({ width, height: 960 });
    for (const [route, heading, name] of routes) {
      await page.goto(route);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      if (name === "dashboard") await expect(page.locator(".stats").getByText(/0\s*₫/)).toBeVisible();
      if (name === "lesson") {
        await expect(page.getByText("Nội dung bài học chỉ dành cho học viên đã đăng ký.")).toBeVisible();
        await expect(page.getByRole("button", { name: "Đánh dấu hoàn thành", exact: true })).toBeVisible();
      }
      await capture(page, `${name}-${device}`);
    }
    if (device === "mobile") {
      await page.goto("/admin");
      await page.getByRole("button", { name: "Mở menu" }).click();
      await expect(page.getByRole("button", { name: "Đóng menu" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Mở menu" })).toBeFocused();
      await expect(page.locator(".shell > aside")).not.toBeVisible();
    }
    await page.goto("/");
    await expect(page.locator(".shell > aside")).toHaveCount(0);
  }
});
