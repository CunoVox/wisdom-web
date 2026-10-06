> Cập nhật chính sách HaoBox: theo yêu cầu người dùng, file bài học được chấp nhận bất kể visibility PUBLIC/PRIVATE hoặc không được trả về. Không đưa file vào thùng rác vì visibility. Quyền đọc qua API Wisdom vẫn được kiểm tra. Các ghi chú private guard trong lịch sử bên dưới mô tả hành vi cũ.

# Wisdom Web

Ứng dụng học trực tuyến tiếng Việt, React + TypeScript + Vite. API đi cùng: `../wisdom-api`. Giao diện dùng palette và cách tổ chức component của file-manager; các màn hình nghiệp vụ gọi API thật.

## Chạy local

Cần Node.js 22.12+ hoặc 24, Java 11 và MySQL 8 cho backend.

```powershell
npm ci
npm run dev
```

Mở http://localhost:5173. Vite chuyển `/api` đến http://localhost:8080. Xem [hướng dẫn backend](../wisdom-api/README.md) để tạo database, khóa hạ tầng và admin đầu tiên. Không có mật khẩu admin mặc định.

Sao chép `.env.example` thành `.env`: `VITE_API_URL=/api` là đường dẫn FE gọi, `API_PROXY_TARGET=http://localhost:8080` là địa chỉ backend để Vite dev proxy chuyển request tới. Đổi địa chỉ/cổng backend trong `API_PROXY_TARGET`, rồi khởi động lại `npm run dev`. Biến môi trường của process được ưu tiên hơn file `.env`. Không nhập SMTP password, HaoBox API key hay VNPay secret vào frontend hoặc `.env`. Production cần reverse proxy `/api` về backend cùng origin để cookie HttpOnly và video hoạt động; `API_PROXY_TARGET` chỉ dành cho dev server. SPA fallback về `index.html` cho các URL trang.

## Khu vực sử dụng

- Học viên: khám phá/tìm kiếm, chi tiết khóa, học thử, đăng ký miễn phí hoặc VNPay, nội dung bài, video/tài liệu, tiến độ, bình luận/phản hồi, đánh giá, bookmark, hồ sơ/avatar và lịch sử thanh toán.
- Giảng viên: dashboard, tạo/sửa khóa, chương/bài và thứ tự, ảnh bìa/video/tài liệu, gửi duyệt, lý do duyệt, học viên và doanh thu khóa của mình.
- Quản lý: dashboard, danh mục, duyệt/ẩn khóa, xem tài khoản/hóa đơn, ẩn nội dung vi phạm.
- ADMIN: thêm quản lý quyền/khóa tài khoản, cài đặt dịch vụ, nhật ký và đối chiếu upload lỗi.

Khóa đã có học viên không sửa cấu trúc; ẩn khóa vẫn giữ quyền học của học viên cũ. Khóa mới cần người khác duyệt, kể cả khi tác giả là admin.

## Cấu hình dịch vụ qua UI

Đăng nhập ADMIN → **Cài đặt hệ thống**:

1. **Gửi email:** host, port, username, TLS mode, địa chỉ/tên người gửi; chọn **Thay bằng secret mới**, nhập password, bật và lưu. Nhập email nhận thử, bấm gửi thử. Lịch sử gửi email bên dưới hỗ trợ gửi lại email lỗi còn hạn.
2. **Lưu trữ file:** nhập API base URL được nhà cung cấp xác nhận (khác URL website docs), API key, parentId tùy chọn, giới hạn byte và danh sách MIME. Bật/lưu rồi kiểm tra quyền đọc danh sách. Cần scope `files:read`, `files:write`, `files:delete`. Chấp nhận file bất kể visibility.
3. **Thanh toán:** sandbox/production, TMN code, secret, endpoint thanh toán, return URL trỏ tới `/orders`, IPN URL backend `/api/payments/ipn`. Đăng ký IPN với VNPay. Nút kiểm tra chỉ xác nhận định dạng; cần giao dịch sandbox thật để nghiệm thu.

Secret có ba hành động **giữ nguyên / thay mới / xóa**. Secret đã lưu không được tải về trình duyệt. Tắt dịch vụ trước khi xóa secret. Phiên bản cũ được giữ để file và giao dịch cũ vẫn dùng đúng provider/merchant.

## Kiểm thử

```powershell
npm run build
# Chuẩn bị classpath kiểm thử tại ../wisdom-api:
cd ../wisdom-api
.\mvnw.cmd test dependency:build-classpath '-Dmdep.outputFile=target/test-classpath.txt' '-Dmdep.includeScope=test'
cd ../wisdom-web
npx playwright install chromium
npm run test:e2e
```

Playwright tự chạy API ở cổng 18080 bằng H2 riêng và frontend ở 5174 (có thể đổi bằng `E2E_WEB_PORT`), tách khỏi dev server 5173. Origin và API của test được cấu hình riêng. Tài khoản `@e2e.local` chỉ được tạo bởi nguồn kiểm thử, không được đóng gói vào production. SMTP/HaoBox dùng test double trong kiểm thử backend; không gọi dịch vụ thật. Cần để hai cổng test trống khi chạy. Ảnh kiểm tra desktop/mobile được lưu ở `.impeccable/review/`; dữ liệu khóa học minh họa chỉ nằm trong browser test.

## Giao diện Wisdom

Bố cục marketplace theo hướng Udemy, giữ logo và màu xanh dương/cyan Wisdom. Navbar ngang và tìm kiếm cho các trang học viên; sidebar chỉ ở khu giảng dạy/quản trị. Bộ style chung nằm tại `src/styles/wisdom.css`, rich text tại `src/styles/rich-text.css`. Font Manrope được phục vụ nội bộ từ `public/fonts` kèm giấy phép OFL.

Xem [hệ thống giao diện](DESIGN.md), [phạm vi sản phẩm](PRODUCT.md) và [định hướng đã duyệt](docs/interface-direction.md).

## Tài liệu và giới hạn nghiệm thu

- [Khảo sát, phạm vi, kiến trúc và mô hình dữ liệu](docs/implementation.md)
- [Tiến độ, kết quả kiểm thử và phần chưa xác minh](docs/progress.md)
- [Hợp đồng API và tích hợp](../wisdom-api/docs/api.md)

Wisdom chấp nhận file HaoBox PUBLIC/PRIVATE hoặc thiếu visibility theo yêu cầu. API Wisdom vẫn kiểm tra quyền truy cập. Không có signed URL giả định. SMTP, HaoBox và VNPay thật cần cấu hình do quản trị viên nhập trên UI và nghiệm thu với nhà cung cấp.
