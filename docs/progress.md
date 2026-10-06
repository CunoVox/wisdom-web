> Cập nhật chính sách HaoBox: theo yêu cầu người dùng, file bài học được chấp nhận bất kể visibility PUBLIC/PRIVATE hoặc không được trả về. Không đưa file vào thùng rác vì visibility. Quyền đọc qua API Wisdom vẫn được kiểm tra. Các ghi chú private guard trong lịch sử bên dưới mô tả hành vi cũ.

# Tiến độ triển khai Wisdom

## 05/10/2026 — Thiết kế lại toàn bộ frontend

- Theo định hướng Udemy đã duyệt, giữ logo/mascot và bảng màu Wisdom: tìm kiếm ngang, cây danh mục, tab chủ đề, thẻ khóa học gọn và nền trắng. Không có sidebar trên trang công khai kể cả khi đăng nhập admin.
- Chi tiết khóa học: phần giới thiệu navy, khung đăng ký riêng, điều hướng nội dung và chương bài thu gọn; đánh giá/số học viên/giá lấy từ API.
- Trang học: nội dung đọc/video, mục lục thu gọn (ở trên nội dung trên mobile), bài trước/sau, tiến độ và thảo luận. Đồng bộ khóa đã lưu, khóa của tôi và hồ sơ.
- Đăng nhập/đăng ký bố cục mới; admin/giảng viên dùng sidebar riêng, bảng cuộn trên điện thoại, form và trạng thái thống nhất. Số tiền tổng/doanh thu 0 hiển thị 0 ₫; chỉ giá khóa học 0 hiển thị Miễn phí.
- Style chính: `src/styles/wisdom.css`; font Manrope phục vụ nội bộ, có giấy phép OFL. Bỏ stylesheet cũ; thêm skip link, focus menu, Escape và giảm chuyển động theo thiết lập hệ thống.
- `npm run build` thành công; **7/7 Playwright E2E đạt**. Kiểm tra 9 loại trang × desktop/mobile, cây danh mục bằng bàn phím, menu mobile, tràn ngang và các luồng nghiệp vụ hiện có. Bộ ảnh trong `.impeccable/review/` (gitignored); dữ liệu minh họa chỉ dùng trong test. Không đổi `.env`, backend hay dữ liệu thật.
- Test FE chuyển sang cổng 5174, dùng origin/API riêng để không ảnh hưởng dev server 5173. Định hướng: [interface-direction.md](interface-direction.md); hệ thống giao diện: [DESIGN.md](../DESIGN.md).

## 05/10/2026 — Thao tác vận hành cho admin

- SMTP: lịch sử công việc email, trạng thái gửi và gửi lại email lỗi còn hạn.
- Đối chiếu upload: chọn file rồi đối soát bằng ID provider, hỗ trợ tiếp tục tra cứu từ trang khác và thử xóa lại file lỗi. Form nằm ngoài bảng để nhập thuận tiện trên điện thoại.
- Hóa đơn: hiển thị thanh toán trùng và ghi nhận mã hoàn tiền sau khi admin đã xử lý tại cổng thanh toán. Nút chỉ ghi nhận, không chuyển tiền.
- Build frontend thành công; 5/5 Playwright E2E đạt, gồm thao tác vận hành trên desktop/mobile. Backend có 31 kiểm thử đạt trên H2/provider giả lập. Xem hướng dẫn vận hành tại `../wisdom-api/docs/reliability.md` tính từ thư mục repository frontend.

## Lịch sử triển khai ban đầu

Ngày kiểm tra: 19/09/2026. Các trạng thái dưới đây phân biệt code chạy local với tích hợp dịch vụ bên ngoài.

| Giai đoạn | Backend + frontend | Bằng chứng |
|---|---|---|
| 1. Nền tảng, auth, layout, admin | Đã triển khai | Java 11 build, Flyway/JPA validate; login/verify/reset/refresh, khóa tài khoản và thu hồi quyền có integration test; bootstrap bằng console, không phụ thuộc SMTP |
| 2. Settings, SMTP, HaoBox | Đã triển khai; provider thật chưa nghiệm thu | AES-GCM, KEEP/REPLACE/DELETE, admin-only, audit, cấu hình phiên bản; SMTP local đổi port không restart; HTTP double upload/Range/PRIVATE guard; Playwright lưu và reload settings |
| 3. Soạn khóa, chương/bài, duyệt | Đã triển khai | Playwright tạo khóa/chương/bài → gửi duyệt → admin duyệt; backend kiểm tra ownership/role và khóa cấu trúc khi có học viên |
| 4. Catalog, enroll, học, tiến độ | Đã triển khai | Playwright kiểm tra bài bị khóa → đăng ký miễn phí → đọc nội dung → hoàn thành; integration test enrollment duy nhất, quyền học sau archive |
| 5. VNPay và hóa đơn | Đã triển khai; sandbox thật chưa nghiệm thu | HMAC, merchant, amount từ DB, setting snapshot, transaction + khóa order/course, callback lặp; history UI đọc DB |
| 6. Cộng đồng, bookmark, dashboard | Đã triển khai | Bình luận/reply, review, moderation, bookmark thêm/bỏ/list; Playwright thảo luận và bookmark; dashboard aggregate database theo quyền |

## Kiểm tra thực tế

- Điều chỉnh sidebar theo cả vai trò và trang: trang chủ/trang người học dùng navbar ngang với mọi tài khoản. Sidebar chỉ hiện ở /admin, /instructor và /files cho người có vai trò phù hợp. Navbar có lối vào Giảng dạy/Quản lý. Đã kiểm tra chuyển trang chủ → giảng dạy → trang chủ bằng tài khoản INSTRUCTOR và ADMIN; build thành công.

- Giao diện khách/học viên chuyển sang header ngang với logo, tìm kiếm và danh mục cây; học viên có điều hướng khóa đã học, bookmark, thanh toán và hồ sơ. Giữ sidebar cho vai trò giảng viên và quản lý. Kiểm tra trình duyệt cho khách, STUDENT, INSTRUCTOR, ADMIN; tìm kiếm header hoạt động và mobile không tràn ngang.

- Xem file qua HaoBox trực tiếp: endpoint nội dung Wisdom kiểm tra quyền rồi trả HTTP 307 tới baseUrl của phiên bản lưu trữ gắn với file + /view/{providerId}. Trình duyệt lấy nội dung trực tiếp từ HaoBox; backend không truyền dữ liệu file, không gửi API key cho trình duyệt. Visibility chỉ là metadata, không dùng làm điều kiện. Ghi chú streaming qua backend trước đây mô tả cơ chế cũ.

- Rà soát câu chữ học viên/giảng viên: nhãn tải file theo mục đích, bỏ hướng dẫn cấu hình HaoBox/private và diễn giải backend/IPN. Việt hóa mục đích/trạng thái file; đơn hàng PENDING hiển thị Chờ thanh toán. Thông báo dịch vụ email, thanh toán và file dùng ngôn ngữ hướng tới người dùng. Xóa cảnh báo private lỗi thời trong trang cài đặt quản trị.

- Đổi theme theo ảnh thương hiệu Wisdom người dùng cung cấp: xanh dương #075bd8, cyan #00aeef, navy #06243b, nền #f5f9ff và điểm nhấn vàng cam #f5a623. Áp dụng cho navigation, nút, form, badge, tiến độ, hero và thẻ khóa học; đổi token `moss` thành `brand`. Build TypeScript/Vite thành công. Chưa thay logo bằng ảnh mới vì ảnh đính kèm chưa có file nguồn trong workspace.

- 19/09/2026: xử lý lỗi schema có bảng nhưng thiếu lịch sử Flyway trên MySQL 8.0.46. Đối chiếu 17 bảng, kiểu/độ dài/nullability cột, khóa ngoại, unique/index và bootstrap singleton với V1/V2; ghi baseline phiên bản 2 một lần, giữ dữ liệu nghiệp vụ. Khởi động Spring Boot trên database này thành công: Flyway validate 2 migrations, Hibernate schema validate và Tomcat chạy ở cổng localhost ngẫu nhiên; đã đóng context sau kiểm tra. Không bật baseline tự động trong cấu hình.

- Sửa lỗi khởi động MySQL được báo sau bàn giao: thêm `org.flywaydb:flyway-mysql` vào backend (phiên bản do Spring Boot quản lý). Thêm kiểm thử hồi quy nhận diện MySQL 8 qua registry Flyway với JDBC mock; kiểm thử này không thay thế chạy migration trên server MySQL thật. Log người dùng xác nhận kết nối JDBC đã thành công trước khi gặp lỗi thiếu module.

- `mvnw.cmd package`: thành công với Java 11.0.32.1; JAR `wisdom-api/target/wisdom-api-1.0.0.jar`.
- 10 integration tests backend: **10 passed, 0 failures, 0 errors**, lần cuối 31,94 giây; bao gồm hai migration và rà soát phân trang.
- `npm run build`: thành công TypeScript + Vite; route chunks tải theo nhu cầu, bundle entry khoảng 390 kB trước gzip.
- 4 Playwright flows: **4 passed**, lần chạy cuối khoảng 1 phút, dùng frontend thật + Spring API thật + H2 riêng; đã chạy lại sau rà soát giao diện/phân trang. Đã xem ảnh catalog/settings desktop và trạng thái rỗng trên mobile. Kiểm thử mobile riêng sau khi dữ liệu tải xong: 1 passed (25,2 giây gồm khởi động server).
- `npm install` audit: 0 vulnerabilities được npm báo tại thời điểm cài. Không thay thế một cuộc đánh giá bảo mật độc lập.
- Không sửa dự án tham khảo. Không sao chép .git, .env thật, node_modules, target hoặc dist từ nguồn tham khảo.

## Giới hạn cần xác minh với môi trường triển khai

1. **HaoBox private:** mã tham khảo upload mặc định PUBLIC, Developer API chưa có đổi visibility. Wisdom chặn file bài học PUBLIC và thử đưa vào Trash. Không được xem video/tài liệu trả phí là tích hợp hoàn tất cho đến khi provider thực tế hỗ trợ private và vượt qua kiểm tra upload/download/Range không có public bypass.
2. **SMTP/HaoBox/VNPay thật:** chưa có credentials, nên chưa gửi email, upload hoặc thanh toán thật. Test doubles không chứng minh cấu hình tài khoản của nhà cung cấp.
3. **MySQL runtime:** đã kiểm tra khởi động và schema validation trên MySQL 8.0.46 với schema V1/V2 có sẵn, được baseline ở phiên bản 2. Chưa kiểm tra tạo schema từ rỗng bằng Flyway trên MySQL thật; migration từ rỗng đã được kiểm thử trên H2 MySQL mode.
4. **Khối lượng lớn:** catalog, admin tables, khóa cá nhân, bookmark, khóa giảng dạy, lịch sử thanh toán và bình luận có phân trang. Các collection phụ (danh mục, chương/bài trong một khóa, review trong chi tiết, danh sách học viên/tài nguyên/đối chiếu) giới hạn 500; cần mở rộng phân trang/cấu trúc UI cho quy mô vượt giới hạn này.
5. **Vận hành:** upload timeout không thể biết chắc remote đã tạo file hay chưa. Journal UNKNOWN/ORPHAN cho đối chiếu thủ công, không tự retry. SMTP hiện gửi đồng bộ, chưa có outbox/retry queue. Rate limit auth ở một instance; deployment nhiều replica cần rate limit chung ở proxy.
6. **Ngoài phạm vi:** thi/chứng chỉ/livestream/AI/chi trả tự động/HLS không được triển khai theo yêu cầu ban đầu.

Không còn scaffold hoặc API dữ liệu giả trong luồng sản phẩm; dữ liệu demo là tùy chọn và được tách khỏi cấu hình production. Chưa triển khai lên môi trường public, chưa commit hoặc thay đổi git history.

## Category tree

- Category parent/child relationship uses additive Flyway V3 migration; existing categories remain roots. Admin can select parents; cycle creation and deletion of parents with children are rejected.
- Catalog menu expands into columns on hover or arrow-button click; selecting a parent includes descendant courses. Author category options display hierarchy.
- Verified frontend build, three-level menu selection and mobile overflow with browser fixtures; backend integration suite and two category guard tests pass. Restart backend to apply V3 before using parent selection.


## Edumim UI redesign (2026-10-06)
- User-approved mint/coral visual system across public pages, course detail, learning, auth, profile, author and admin screens.
- Morphicons, Motion and Radix Tooltip integrated; reduced motion honored. Original Wisdom fullscreen mascot spinner restored for bootstrap/session/lazy routes; uploads stay inline.
- Reference images stored locally as WebP with source provenance. No reference sample statistics or endorsements copied.
- Build passed; 7 E2E tests passed; final 2 screenshot-matrix tests passed. Independent visual review: ship at the reviewed 19-capture scope, no material findings.
- Remaining minor polish: native file chooser language follows browser; admin tables scroll horizontally; fallback course covers repeat titles. Vite reports a main chunk size advisory.
