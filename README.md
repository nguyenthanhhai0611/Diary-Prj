# Nhật Ký Hằng Ngày

Ứng dụng nhật ký cá nhân nhẹ, giao diện tông hồng đáng yêu, viết bằng HTML/CSS/JS (Bootstrap). Thiết kế để chạy tĩnh (static site) và dễ deploy lên các dịch vụ host tĩnh.

---

## Tính năng chính
- Giao diện "letter-paper" thân thiện, nhiều trang trí hoa và hiệu ứng nhẹ.
- Đăng ký/đăng nhập người dùng (client-side logic có tích hợp Supabase trong code — xem `index.html`).
- Lưu, xem nhanh (preview) và xem toàn bộ lịch sử nhật ký.
- Chọn biểu tượng cảm xúc (icon) cho từng entry.
- Nhạc nền nhẹ, đồng bộ trạng thái giữa các tab.
- Các module JS tách biệt để dễ bảo trì: `utils.js`, `auth.js`, `entries.js`, `music.js`, `app.js` (entrypoint).

## Chuẩn bị nhanh để chạy local
1. Mở terminal trong thư mục dự án (`d:\Thank`).
2. Dùng một HTTP server tĩnh (tránh mở file trực tiếp bằng `file://` vì module imports):


3. Mở trình duyệt: `http://localhost:5500`

> Nếu trình duyệt cache favicon hoặc tệp tĩnh cũ, hãy thử làm mới bằng `Ctrl+F5`.

## Cấu trúc dự án (tóm tắt)
- `index.html` — Trang chính, form nhập nhật ký, preview.
- `history.html` — Trang hiển thị toàn bộ lịch sử nhật ký.
- `styles.css` — CSS theme + layout.
- `app.js` — Entry module: import `utils.js`, `auth.js`, `entries.js`, `music.js` và khởi tạo UI.
- `utils.js`, `auth.js`, `entries.js`, `music.js` — Các module logic riêng.
- `favicon.svg` — Favicon mới cho trang.
- `music.mp3` — (tuỳ chọn) nhạc nền nếu bạn đặt file này trong thư mục project.

---


