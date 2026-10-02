# 📋 DANH SÁCH CÔNG VIỆC FRONTEND CẦN THỰC HIỆN (FRONTEND TASKS)

> **Dự án:** BookRunner — E-Commerce Website & Recommender System  
> **Repository:** `Front_End` (Branch: `api_fix`)  
> **Cập nhật lần cuối:** 02/10/2026  
> **Trạng thái build hiện tại:** `npm run build` thành công 100% (0 lỗi)

---

## 🎯 TỔNG QUAN TIẾN ĐỘ

- [x] **Core & Auth:** Đăng nhập, đăng ký, JWT Interceptor tự động refresh token, bảo vệ Route (`ProtectedRoute`, `AdminRoute`, `GuestRoute`).
- [x] **Book Public:** Trang chủ (Home), danh sách sách (Filter theo Category, Price, Search, Sort), trang chi tiết sách (Book Detail).
- [x] **Cart Module (Đã xong Giai đoạn 1):** Bổ sung adapter `normalizeCartData` trong `cartApi.js` ánh xạ `cartItemDTOList` từ Backend sang format items lồng, thêm hàm `deleteItems` xóa hàng loạt.
- [ ] **Admin & User UI Actions (Đang thực hiện):** Bổ sung các nút bấm, modal tương tác cho các API Backend đã hoàn thiện.
- [ ] **Quản lý danh mục (Categories):** Xây dựng trang Admin quản lý danh mục.
- [ ] **Modules chờ Backend:** Review, Voucher, Thống kê Dashboard, RecSys (hiện chạy mock fallback).

---

## 🚀 NHÓM 1: ƯU TIÊN CAO — TÍCH HỢP UI CHO CÁC API BACKEND ĐÃ CÓ SẴN

Các API này Backend đã xây dựng hoàn thiện và kiểm thử thành công, Frontend đã có hàm gọi API tương ứng nhưng **chưa có giao diện (UI) để người dùng/admin thao tác**.

### 1.1. Bổ sung nút "Hủy đơn hàng" cho Khách hàng
- **File:** `src/pages/user/OrderHistoryPage.jsx`
- **API đã có:** `orderApi.cancelOrder(orderId)` ➔ `PUT /api/v1/orders/{id}/cancel`
- **Mô tả công việc:**
  - [ ] Hiển thị nút **"Hủy đơn hàng"** khi đơn ở trạng thái `PENDING` (Chờ xử lý) hoặc `CONFIRMED` (Đã xác nhận).
  - [ ] Thêm popup/modal xác nhận trước khi hủy: *"Bạn có chắc chắn muốn hủy đơn hàng này không?"*.
  - [ ] Gọi `orderApi.cancelOrder(order.id)`, cập nhật trạng thái đơn thành `CANCELLED` trên UI và hiển thị Toast thông báo.

### 1.2. Bổ sung nút Toggle Featured ⭐ trên bảng Quản lý sách
- **File:** `src/pages/admin/ManageBooksPage.jsx`
- **API đã có:** `bookApi.toggleFeatured(bookId)` ➔ `PATCH /api/v1/admin/books/{id}/featured`
- **Mô tả công việc:**
  - [ ] Thêm icon/nút ngôi sao ⭐ (hoặc nút gạt Switch) tại mỗi dòng của bảng danh sách sách.
  - [ ] Ngôi sao sáng vàng (`fill="var(--accent)"`) khi `book.isFeatured === true`, màu xám mờ khi `false`.
  - [ ] Khi click, gọi `bookApi.toggleFeatured(book.id)` và cập nhật tức thì state `books`, toast thông báo thành công.

### 1.3. Bổ sung Modal "Xem chi tiết đơn hàng" cho Admin
- **File:** `src/pages/admin/ManageOrdersPage.jsx`
- **API đã có:** `orderApi.getOrder(orderId)` ➔ `GET /api/v1/orders/{id}` (Backend cho phép Admin xem mọi đơn)
- **Mô tả công việc:**
  - [ ] Thêm nút icon Xem chi tiết (`<Eye size={16} />`) ở cột Thao tác tại mỗi dòng đơn hàng.
  - [ ] Tạo Modal hiển thị chi tiết đơn hàng:
    - Danh sách các cuốn sách đã mua (Ảnh bìa, Tên sách, Tác giả, Đơn giá, Số lượng, Thành tiền).
    - Thông tin người nhận: Họ tên, Số điện thoại, Địa chỉ giao hàng, Ghi chú.
    - Phương thức thanh toán (`COD` / `VNPAY`), Trạng thái thanh toán (`PAID` / `PENDING`).
    - Tổng tiền hàng, Phí vận chuyển, Tổng thanh toán.

### 1.4. Bổ sung Modal "Sửa thông tin & Phân quyền User" cho Admin
- **File:** `src/pages/admin/ManageUsersPage.jsx`
- **API đã có:** `adminApi.updateUser(userId, data)` ➔ `PUT /api/v1/admin/users/{id}`
- **Mô tả công việc:**
  - [ ] Thêm nút icon Sửa (`<Pencil size={14} />`) bên cạnh nút Khóa/Mở khóa.
  - [ ] Tạo Modal chỉnh sửa người dùng:
    - Chỉnh sửa thông tin cá nhân: `fullName`, `phone`, `address`.
    - Phân quyền tài khoản (Dropdown chọn `ROLE_CUSTOMER` hoặc `ROLE_ADMIN`).
    - Trạng thái hoạt động `enabled` (Switch Bật/Tắt).
  - [ ] Gọi `adminApi.updateUser(user.id, payload)` và cập nhật lại danh sách `users`.

### 1.5. Bổ sung chức năng Checkbox chọn nhiều & Xóa hàng loạt giỏ hàng
- **File:** `src/pages/user/CartPage.jsx`
- **API đã có:** `cartApi.deleteItems(bookIds)` ➔ `DELETE /api/v1/cart/items` (body: `List<Long>`)
- **Mô tả công việc:**
  - [ ] Thêm checkbox chọn từng item và checkbox "Chọn tất cả" ở đầu bảng giỏ hàng.
  - [ ] Hiển thị thanh thao tác hàng loạt: *"Đã chọn X sản phẩm"* kèm nút *"Xóa các mục đã chọn"*.
  - [ ] Gọi `cartApi.deleteItems(selectedIds)` và refresh lại giỏ hàng.

---

## 🛠️ NHÓM 2: ƯU TIÊN TRUNG BÌNH — XÂY DỰNG TRANG QUẢN LÝ MỚI

Backend đã có toàn bộ CRUD cho danh mục sách ([`CategoryAPI.java`](file:///C:/Users/testu/OneDrive/Máy%20tính/New%20folder%20(2)/book-runner/src/main/java/com/example/bookrunner/controller/CategoryAPI.java)), Frontend cần bổ sung giao diện tương ứng:

### 2.1. Bổ sung API Service cho Category
- **File:** `src/api/bookApi.js` (hoặc tạo mới `src/api/categoryApi.js`)
- **Endpoints tích hợp:**
  - `POST /api/v1/categories` — Thêm danh mục mới (`{ name, description, slug }`)
  - `PUT /api/v1/categories/{id}` — Cập nhật danh mục
  - `DELETE /api/v1/categories` — Xóa danh mục theo mảng ID (`List<Long> ids`)

### 2.2. Xây dựng trang `ManageCategoriesPage.jsx`
- **File tạo mới:** `src/pages/admin/ManageCategoriesPage.jsx`
- **Mô tả giao diện:**
  - [ ] Bảng danh sách danh mục (ID, Tên danh mục, Slug, Mô tả, Số lượng sách thuộc danh mục).
  - [ ] Nút "Thêm danh mục mới" mở Modal (nhập tên, mô tả).
  - [ ] Nút Sửa & Nút Xóa danh mục (kèm popup xác nhận).
  - [ ] Thanh tìm kiếm danh mục.

### 2.3. Khai báo Route & Điều hướng Admin Layout
- **File:** `src/App.jsx` và `src/components/layout/AdminLayout.jsx`
- **Mô tả công việc:**
  - [ ] Thêm route `<Route path="categories" element={<ManageCategoriesPage />} />` trong nhóm Admin.
  - [ ] Thêm menu item "Quản lý danh mục" vào Sidebar của Admin với icon thích hợp (ví dụ `<FolderTree size={18} />` hoặc `<Tag size={18} />`).

---

## ⏳ NHÓM 3: CHUẨN BỊ TÍCH HỢP KHI BACKEND HOÀN THIỆN (MOCK ➔ REAL API)

Hiện tại các module này phía Frontend đã có sẵn giao diện rất đẹp và code API service đầy đủ, đang chạy qua cơ chế `mock fallback / localStorage`. Khi Backend triển khai xong Controller, chỉ cần kiểm tra lại kết nối:

| Module | File API FE | File UI FE | Trạng thái Backend cần |
|:---|:---|:---|:---|
| **1. Đánh giá & Bình luận (Reviews)** | `src/api/reviewApi.js` | `src/pages/public/BookDetailPage.jsx` | Chờ BE viết `ReviewService` và `ReviewController` (`GET/POST /books/{id}/reviews`, `PUT/DELETE /reviews/{id}`). |
| **2. Thống kê Dashboard Admin** | `src/api/adminApi.js` | `src/pages/admin/DashboardPage.jsx` | Chờ BE viết `AdminStatsController` (`/admin/stats`, `/admin/stats/revenue`, `/admin/stats/best-sellers`). |
| **3. Mã giảm giá (Vouchers)** | `src/api/voucherApi.js` | `src/pages/user/CartPage.jsx`<br>`src/pages/user/CheckoutPage.jsx` | Chờ BE thiết kế Entity `Voucher` và Controller xác thực mã giảm giá. |
| **4. Gợi ý thông minh (RecSys)** | `src/api/bookApi.js` (`getRecommendations`) | `src/pages/public/HomePage.jsx` | Chờ BE viết Controller expose danh sách sách gợi ý từ bảng `user_recommendations`. |

---

## 🎨 NHÓM 4: TINH CHỈNH & ĐỒNG BỘ QUERY PARAMS

- [ ] **Đồng bộ Filter Featured:** Khi Backend cập nhật `BookAPI.java` hỗ trợ `@RequestParam(required = false) Boolean isFeatured`:
  - Cập nhật `bookApi.getBooks()` gửi param `isFeatured: true`.
  - Cập nhật `getFeaturedBooks()` trong `bookApi.js` gọi `/books?isFeatured=true&size=8`.
- [ ] **Đồng bộ Sort Admin Orders:** Bỏ tham số `sort: 'newest'` không chuẩn khi gọi `orderApi.getAllOrders()` trong `DashboardPage.jsx`.
- [ ] **Dọn dẹp code & Gỡ TODO:** Sau khi tích hợp xong, rà soát lại các ghi chú `TODO` trong các file `.jsx` và `.js`.
