# NHẬT KÝ CHI TIẾT CÁC THAY ĐỔI CODE FRONT END (`Front_End`)
> **Dự án:** Hệ thống E-Commerce Bán Sách BookRunner  
> **Phạm vi cập nhật:** Đồng bộ toàn diện API, Interceptor Axios, Validation Bảo mật, DTO Mapping và Cơ chế Mock Fallback  
> **Thời gian thực hiện:** 29/09/2026  
> **Trạng thái:** Đã kiểm thử, biên dịch thành công (`npm run build` - 0 lỗi)

---

## 📌 1. TỔNG QUAN NGUYÊN TẮC THAY ĐỔI
1. **Chuẩn hóa Base URL & Prefix:** Tránh trùng lặp prefix (ví dụ `/api/v1/v1/auth/login`). Toàn bộ API gọi qua `api` instance chuẩn với `BASE_URL = '/api/v1'`.
2. **Bảo vệ Vòng lặp Refresh Token:** Tách riêng instance `refreshClient` không có response interceptor để gọi `/auth/refresh`, ngăn chặn vòng lặp vô hạn khi token hết hạn. Bỏ qua logic refresh cho các endpoint đăng xuất, đăng nhập và refresh.
3. **Thu hẹp Cơ chế Mock Fallback:** Mock fallback chỉ kích hoạt khi hệ thống mất mạng hoặc máy chủ Backend chưa khởi chạy (HTTP 502 Bad Gateway / Network Error). Giữ nguyên và hiển thị lỗi thực tế từ Backend (HTTP 400, 401, 403, 500) qua Toast UI, không nuốt lỗi.
4. **Đồng bộ Quy tắc Validation (Regex, Độ dài):** Đồng bộ validation mật khẩu ở Frontend ($\ge 8$ ký tự, chữ và số) khớp với `@Pattern` và thuật toán BCrypt của Spring Boot.
5. **Chống Gian lận Giá (Price Tampering):** Client chỉ gửi `{ bookId, quantity }` khi đặt hàng, không gửi `price`. Giá bán được Backend khóa bi quan (`PESSIMISTIC_WRITE`) và đọc trực tiếp từ DB.
6. **Đồng bộ Sắp xếp & soldCount:** Map tham số UI `best_seller` về `sortBy=soldCount&sortDir=desc`.

---

## 📋 2. BẢNG TỔNG HỢP CÁC FILE ĐÃ CHỈNH SỬA (12 FILES)

| STT | Đường dẫn File | Loại thay đổi | Mô tả tóm tắt |
| :---: | :--- | :---: | :--- |
| 1 | [`src/api/axios.js`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/api/axios.js) | Config / Core | Chuẩn hóa `BASE_URL = '/api/v1'`, tạo `refreshClient` riêng, chặn đệ quy 401 |
| 2 | [`src/api/authApi.js`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/api/authApi.js) | API Service | Bỏ tiền tố thừa `/v1`, chuẩn hóa username tối thiểu 3 ký tự, thu hẹp fallback |
| 3 | [`src/api/bookApi.js`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/api/bookApi.js) | API Service | Chuẩn hóa endpoint admin, mapping sort `soldCount`, unwrap `ApiResponse` |
| 4 | [`src/api/orderApi.js`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/api/orderApi.js) | API Service | Đổi endpoint `my-orders`, HTTP method `cancel`/`status` sang `PUT`, unwrap |
| 5 | [`src/api/cartApi.js`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/api/cartApi.js) | API Service | Dọn sạch giỏ hàng trong `finally` sau checkout, unwrap `ApiResponse` |
| 6 | [`src/api/reviewApi.js`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/api/reviewApi.js) | API Service | Chuẩn hóa endpoint `/books/{bookId}/reviews`, thu hẹp mock fallback |
| 7 | [`src/api/adminApi.js`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/api/adminApi.js) | API Service | Thu hẹp mock fallback chỉ khi 404/502/mất mạng, giữ nguyên lỗi nghiệp vụ |
| 8 | [`src/context/AuthContext.jsx`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/context/AuthContext.jsx) | State / Context | Gọi `authApi.logout()`, đưa dọn dẹp storage vào `finally` |
| 9 | [`src/pages/public/RegisterPage.jsx`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/pages/public/RegisterPage.jsx) | UI Page | Cập nhật validation mật khẩu $\ge 8$ ký tự, chữ và số |
| 10 | [`src/pages/user/CheckoutPage.jsx`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/pages/user/CheckoutPage.jsx) | UI Page | Truyền `items: [{ bookId, quantity }]` khi đặt hàng |
| 11 | [`src/pages/user/OrderHistoryPage.jsx`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/pages/user/OrderHistoryPage.jsx) | UI Page | Hỗ trợ mapping cả DTO phẳng Backend (`bookTitle`, `bookAuthor`) và mock lồng |
| 12 | [`src/pages/user/ProfilePage.jsx`](file:///C:/Users/testu/OneDrive/Máy tính/New folder (2)/Front_End/src/pages/user/ProfilePage.jsx) | UI Page | Cập nhật validation đổi pass $\ge 8$ ký tự, chữ + số, hiển thị lỗi server qua Toast |

---

## 🔍 3. CHI TIẾT THAY ĐỔI TỪNG FILE

### 3.1. `src/api/axios.js`
- **Mục đích:**
  - Chuẩn hóa `BASE_URL = '/api/v1'` để mọi request gọi tương đối không bị lặp tiền tố `/v1`.
  - Tạo một instance Axios độc lập `refreshClient` không gắn interceptor response để thực hiện refresh token, loại bỏ hoàn toàn khả năng treo trình duyệt do đệ quy khi refresh token hết hạn.
  - Bổ sung điều kiện kiểm tra `isAuthEndpoint` để không kích hoạt refresh token khi người dùng đang thực hiện `logout`, `login`, hoặc chính request `refresh`.
- **Code thay đổi tiêu biểu:**
```javascript
// Trước:
const BASE_URL = '/api';
...
if (error.response?.status === 401 && !originalRequest._retry) {
  ...
  const response = await axios.post(`${BASE_URL}/v1/auth/refresh`, { refreshToken });
}

// Sau:
const BASE_URL = '/api/v1';

const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});
...
const isAuthEndpoint =
  originalRequest?.url?.includes('/auth/logout') ||
  originalRequest?.url?.includes('/auth/login') ||
  originalRequest?.url?.includes('/auth/refresh');

if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
  ...
  const response = await refreshClient.post('/auth/refresh', { refreshToken });
}
```

---

### 3.2. `src/api/authApi.js`
- **Mục đích:**
  - Bỏ tiền tố `/v1` thừa trong các hàm gọi API: `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/refresh`, `/auth/me`, `/users/profile`, `/users/change-password`.
  - Tự động sinh `username` đảm bảo độ dài tối thiểu 3 ký tự nếu người dùng đăng ký chỉ bằng email ngắn.
  - Viết hàm `isOfflineOrUnimplemented(err)` để chỉ fallback sang mock khi mất kết nối mạng hoặc lỗi 502/404, giữ nguyên lỗi 400/401/403 để người dùng nhận được thông báo lỗi chính xác.
- **Code thay đổi tiêu biểu:**
```javascript
// Trước:
await api.post('/v1/auth/login', payload);
await api.post('/v1/auth/register', payload);
await api.put('/v1/auth/me', profileData);
await api.put('/v1/auth/me/password', passwordData);

// Sau:
await api.post('/auth/login', payload);
let generatedUsername = (userData.username || userData.email?.split('@')[0] || userData.email || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
if (generatedUsername.length < 3) {
  generatedUsername = `${generatedUsername}user`.slice(0, 50);
}
await api.post('/auth/register', { username: generatedUsername, ...userData });
await api.put('/users/profile', profileData);
await api.put('/users/change-password', passwordData);
```

---

### 3.3. `src/api/bookApi.js`
- **Mục đích:**
  - Ánh xạ tham số sắp xếp: `best_seller` $\rightarrow$ `sortBy: 'soldCount'`, `rating` $\rightarrow$ `sortBy: 'averageRating'`, `price_asc` $\rightarrow$ `sortBy: 'price', sortDir: 'asc'`.
  - Thay đổi endpoint quản trị: `POST /books`, `PUT /books/{id}`, `DELETE /books` (truyền `@RequestBody List<Long> ids`).
  - Hỗ trợ unwrap dữ liệu an toàn `response.data?.data || response.data` cho chuẩn `ApiResponse<T>`.
  - Lấy sách nổi bật / gợi ý qua endpoint chuẩn `GET /books?size=8&sortBy=createdAt&sortDir=desc`.
- **Code thay đổi tiêu biểu:**
```javascript
// Mapping sort:
if (params.sort === 'best_seller') {
  queryParams.sortBy = 'soldCount';
  queryParams.sortDir = 'desc';
} else if (params.sort === 'rating') {
  queryParams.sortBy = 'averageRating';
  queryParams.sortDir = 'desc';
}

// Admin delete:
await api.delete('/books', { data: [Number(id)] });

// Unwrap:
return data?.data || data;
```

---

### 3.4. `src/api/orderApi.js`
- **Mục đích:**
  - Chuẩn hóa endpoint lấy danh sách đơn của tôi: `GET /orders/my-orders` (thay vì `/orders/my`).
  - Cập nhật đúng HTTP method của Backend: `PUT /orders/{id}/cancel` (thay vì `PATCH`), `PUT /admin/orders/{id}/status` (thay vì `PATCH`).
  - Hỗ trợ unwrap response bọc bởi `ApiResponse<OrderResponseDTO>`.
- **Code thay đổi tiêu biểu:**
```javascript
// Trước:
const { data } = await api.get('/orders/my', { params });
const { data } = await api.patch(`/orders/${id}/cancel`);
const { data } = await api.patch(`/admin/orders/${id}/status`, { status });

// Sau:
const response = await api.get('/orders/my-orders', { params });
const response = await api.put(`/orders/${id}/cancel`);
const response = await api.put(`/admin/orders/${id}/status`, { status });
return response.data?.data || response.data;
```

---

### 3.5. `src/api/cartApi.js`
- **Mục đích:**
  - Chuyển `localStorage.removeItem(CART_KEY)` vào khối `finally` trong `clearCart()`. Điều này đảm bảo giỏ hàng trên trình duyệt luôn luôn được xóa sau khi thanh toán thành công kể cả khi Backend trả về lỗi 404 (do phân hệ giỏ hàng DB chưa bật).
  - Thu hẹp fallback lỗi mạng bằng `isOfflineOrUnimplemented`.
- **Code thay đổi tiêu biểu:**
```javascript
clearCart: async () => {
  try {
    await api.delete('/cart');
  } catch (err) {
    if (!isOfflineOrUnimplemented(err)) throw err;
  } finally {
    localStorage.removeItem(CART_KEY);
  }
}
```

---

### 3.6. `src/api/reviewApi.js`
- **Mục đích:**
  - Chuẩn hóa đường dẫn RESTful theo đúng quy ước tài liệu Backend: `GET /books/{bookId}/reviews` và `POST /books/{bookId}/reviews`.
  - Bổ sung unwrap và thu hẹp fallback.
- **Code thay đổi tiêu biểu:**
```javascript
// Trước:
await api.get(`/books/${bookId}/reviews`);
await api.post('/reviews', reviewData);

// Sau:
const response = await api.get(`/books/${bookId}/reviews`, { params });
const response = await api.post(`/books/${reviewData.bookId}/reviews`, reviewData);
return response.data?.data || response.data;
```

---

### 3.7. `src/api/adminApi.js`
- **Mục đích:**
  - Áp dụng bộ lọc `isOfflineOrUnimplemented` cho các hàm quản trị (`getStats`, `getRevenueChart`, `getBestSellers`, `getUsers`, `getUser`, `updateUser`, `toggleUserEnabled`).
  - Đảm bảo khi Backend trả về lỗi phân quyền 403 hoặc lỗi nghiệp vụ 400, ứng dụng ném lỗi thật thay vì âm thầm trả về mock user.
- **Code thay đổi tiêu biểu:**
```javascript
const isOfflineOrUnimplemented = (err) => {
  if (!err?.response) return true;
  if (err.response.status === 502) return true;
  if (err.response.status === 404) return true;
  return false;
};
```

---

### 3.8. `src/context/AuthContext.jsx`
- **Mục đích:**
  - Đảm bảo quá trình Đăng xuất (`logout`) luôn giải phóng sạch token phía client.
  - Gọi API `authApi.logout()` (Backend sẽ tăng `tokenVersion` để vô hiệu hóa token ngay lập tức trên DB).
  - Đưa việc xóa `localStorage` và `dispatch({ type: 'LOGOUT' })` vào khối `finally` để người dùng luôn đăng xuất thành công khỏi giao diện ngay cả khi mất mạng hoặc token đã hết hạn từ trước.
- **Code thay đổi tiêu biểu:**
```javascript
// Trước:
const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  dispatch({ type: 'LOGOUT' });
};

// Sau:
const logout = async () => {
  try {
    await authApi.logout();
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  }
};
```

---

### 3.9. `src/pages/public/RegisterPage.jsx`
- **Mục đích:**
  - Khắc phục lỗi xung đột validation mật khẩu: Frontend trước đây chỉ yêu cầu $\ge 6$ ký tự, trong khi Backend Spring Boot yêu cầu $\ge 8$ ký tự kèm ít nhất 1 chữ cái và 1 chữ số (`^(?=.*[A-Za-z])(?=.*\\d).+$`).
  - Bổ sung regex kiểm tra trực tiếp ở form đăng ký và cập nhật gợi ý placeholder cho người dùng.
- **Code thay đổi tiêu biểu:**
```javascript
// Trước:
if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
else if (form.password.length < 6) errs.password = 'Mật khẩu ít nhất 6 ký tự';

// Sau:
if (!form.password) {
  errs.password = 'Vui lòng nhập mật khẩu';
} else if (form.password.length < 8) {
  errs.password = 'Mật khẩu phải có ít nhất 8 ký tự';
} else if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(form.password)) {
  errs.password = 'Mật khẩu phải chứa ít nhất một chữ cái và một chữ số';
}
```

---

### 3.10. `src/pages/user/CheckoutPage.jsx`
- **Mục đích:**
  - Bảo vệ chống Price Tampering: Frontend không gửi thuộc tính `price` lên server.
  - Truyền danh sách `items: [{ bookId, quantity }]` khi gọi `orderApi.createOrder`. Nhờ đó, Backend có thể lấy dữ liệu sản phẩm ngay cả khi giỏ hàng database trống (người dùng đặt hàng từ local cart).
- **Code thay đổi tiêu biểu:**
```javascript
// Bổ sung danh sách items tinh gọn:
await orderApi.createOrder({
  recipientName: form.recipientName,
  recipientPhone: form.recipientPhone,
  shippingAddress: form.shippingAddress,
  note: form.note,
  paymentMethod: 'COD',
  items: items.map((it) => ({
    bookId: it.book?.id || it.id,
    quantity: it.quantity,
  })),
});
await clearCart();
```

---

### 3.11. `src/pages/user/OrderHistoryPage.jsx`
- **Mục đích:**
  - Tương thích kép (Backwards-compatibility): Backend trả về `OrderItemResponseDTO` có cấu trúc phẳng (`bookId`, `bookTitle`, `bookAuthor`, `coverImageUrl`), trong khi mock data cũ trả về đối tượng lồng (`item.book`).
  - Màn hình lịch sử đơn hàng đọc linh hoạt cả hai định dạng, tránh lỗi `undefined` và hiển thị ảnh mặc định khi lỗi link.
- **Code thay đổi tiêu biểu:**
```javascript
{order.items?.map((item) => {
  const bookId = item.book?.id || item.bookId;
  const bookTitle = item.book?.title || item.bookTitle || 'Sách';
  const bookAuthor = item.book?.author || item.bookAuthor || '';
  const coverUrl = item.book?.coverImageUrl || item.coverImageUrl || DEFAULT_BOOK_COVER;
  return (
    <div key={item.id} className="order-item">
      <img src={coverUrl} alt={bookTitle} className="order-item-img" onError={(e) => { e.target.src = DEFAULT_BOOK_COVER; }} />
      <div className="order-item-info">
        {bookId ? (
          <Link to={`/books/${bookId}`} className="order-item-title">{bookTitle}</Link>
        ) : (
          <span className="order-item-title">{bookTitle}</span>
        )}
        {bookAuthor && <div className="order-item-author">{bookAuthor}</div>}
        <div className="order-item-qty-price">
          <span>x{item.quantity}</span>
          <span>{formatCurrency(item.price)}</span>
        </div>
      </div>
      <div className="order-item-total">
        {formatCurrency(item.subtotal || item.price * item.quantity)}
      </div>
    </div>
  );
})}
```

---

### 3.12. `src/pages/user/ProfilePage.jsx`
- **Mục đích:**
  - Đồng bộ quy tắc đổi mật khẩu: Kiểm tra độ dài $\ge 8$ ký tự và chứa cả chữ lẫn số.
  - Hiển thị trực tiếp thông điệp lỗi trả về từ máy chủ Backend qua Toast (`err.response?.data?.message || err.message`).
  - Cập nhật gợi ý: `hint="Ít nhất 8 ký tự, gồm cả chữ và số"`.
- **Code thay đổi tiêu biểu:**
```javascript
// Trước:
if (passwordForm.newPassword.length < 6) {
  toast.error('Mật khẩu mới ít nhất 6 ký tự');
  return;
}

// Sau:
if (passwordForm.newPassword.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d)/.test(passwordForm.newPassword)) {
  toast.error('Mật khẩu mới phải từ 8 ký tự, bao gồm cả chữ và số');
  return;
}
...
catch (err) {
  toast.error(err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại');
}
```

---

## 🎯 4. KẾT QUẢ NGHIỆM THU BUILD
```bash
> front-end@0.0.0 build
> vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 2573 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                              1.23 kB │ gzip:   0.62 kB
...
✓ built in 634ms
```
- **Tổng số module:** 2,573 modules
- **Thời gian biên dịch:** 634ms
- **Số lỗi (Errors):** 0
- **Số cảnh báo (Warnings):** 0
