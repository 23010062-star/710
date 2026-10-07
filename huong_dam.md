# 📖 HƯỚNG DẪN KẾT NỐI CSDL VÀ TEST API

Ứng dụng: **Quản lý Thư viện — NestJS + TypeORM**

---

## 1. Cài đặt & chạy ứng dụng

```bash
cd /workspaces/710        # thư mục project
npm install               # cài dependencies (chạy 1 lần)
npm run start:dev         # chạy dev server → http://localhost:3000
```

Ứng dụng đọc cấu hình từ file **`.env`** (đã được tạo sẵn).

---

## 2. Kết nối CSDL (Câu 3.1)

### ✅ Mặc định: SQLite (Local) — không cần cài gì thêm

```env
DB_TYPE=sqlite
DATABASE_FILE=library.db
```

File CSDL `library.db` tự động được tạo trong thư mục project.

### 🔄 Đổi sang Aiven / MySQL

**Bước 1:** Cài driver MySQL

```bash
npm install mysql2
```

**Bước 2:** Sửa file `.env`:

```env
DB_TYPE=mysql
DB_HOST=mysql-webgis-st-1fb7.i.aivencloud.com
DB_PORT=12076
DB_USERNAME=avnadmin
DB_PASSWORD=<your_aiven_password>
DB_NAME=defaultdb
```

> 💡 Thông tin Aiven đã có sẵn trong file `.env.example`. Copy `.env.example` → `.env` rồi bỏ comment phần MySQL.

**Bước 3:** Khởi động lại server. TypeORM sẽ **tự động tạo 3 bảng** `books`, `readers`, `borrowed_records` trên Aiven (`synchronize: true`).

**Kiểm tra kết nối thành công:** log server hiển thị:

```
[NestApplication] Nest application successfully started
🚀 Library API đang chạy tại: http://localhost:3000
```
Nếu sai thông tin, log sẽ báo `Unable to connect to the database. Retrying...`

> ⚠️ Lưu ý: Aiven yêu cầu kết nối SSL — code đã cấu hình sẵn `ssl: { rejectUnauthorized: false }`.
> ⚠️ Nếu chạy ở environment không truy cập được mạng ngoài (DNS không phân giải được hostname Aiven), hãy để `DB_TYPE=sqlite`.

---

## 3. Test API

### 📚 Sách (Book)

```bash
# Thêm sách (Câu 2)
curl -X POST localhost:3000/books -H "Content-Type: application/json" \
  -d '{"title":"Lap trinh Co ban","author":"Nguyen A","isbn":"978-3-16-148410-0","publishedYear":2020}'

# Danh sách sách
curl localhost:3000/books

# Chi tiết 1 sách
curl localhost:3000/books/1
```

### 👤 Độc giả (Reader)

```bash
# Thêm độc giả (Câu 2)
curl -X POST localhost:3000/readers -H "Content-Type: application/json" \
  -d '{"fullName":"Tran Van B","email":"tranb@example.com","phone":"0909123456"}'

# Danh sách độc giả
curl localhost:3000/readers
```

### 🔄 Mượn sách (Câu 3.3)

```bash
curl -X POST localhost:3000/borrowed-records/borrow \
  -H "Content-Type: application/json" \
  -d '{"readerId":1,"bookId":1}'
```

- Nếu không truyền `dueDate` → mặc định hạn trả = **ngày mượn + 14 ngày**
- Truyền hạn trả tùy chỉnh: thêm `"dueDate":"2026-11-01T00:00:00.000Z"`
- **Kết quả mong đợi:** JSON chứa `book`, `reader`, `borrowedDate`, `dueDate`, `status: "BORROWING"`
- Mượn lại sách đang được mượn → **HTTP 400** (Sách hiện đang được mượn)

### 📋 Liệt kê sách đã mượn (Câu 3.4)

```bash
# Đang mượn
curl "localhost:3000/borrowed-records?status=BORROWING"

# Đã trả
curl "localhost:3000/borrowed-records?status=RETURNED"

# Tất cả
curl localhost:3000/borrowed-records
```

**Kết quả mong đợi:** mỗi bản ghi chứa:
- `book` → thông tin SÁCH (title, author, isbn...)
- `reader` → thông tin NGƯỜI MƯỢN (fullName, email...)
- `borrowedDate` → **ngày mượn**
- `dueDate` → **hạn trả**
- `status` → BORROWING / RETURNED

### ↩️ Trả sách (bonus)

```bash
curl -X PUT localhost:3000/borrowed-records/1/return
```

---

## 4. 📸 Chụp màn hình nộp bài

Yêu cầu nộp: *Ảnh chụp màn hình ỨNG DỤNG CHẠY ĐƯỢC 3.1, 3.2 và test API cho 3.3, 3.4*

| Ảnh | Nội dung cần chụp |
|---|---|
| **3.1** | Terminal chạy `npm run start:dev` + log `Nest application successfully started` (chứng minh kết nối CSDL OK) |
| **3.2** | Cây thư mục project (`src/books`, `src/readers`, `src/borrowed-records`) hoặc log `RoutesResolver`/`RouterExplorer` khi server khởi động |
| **3.3** | Terminal/Postman: lệnh `curl POST /borrowed-records/borrow` + response JSON có `status: "BORROWING"` |
| **3.4** | Terminal/Postman: lệnh `curl GET /borrowed-records?status=BORROWING` + response JSON có `book`, `reader`, `borrowedDate`, `dueDate` |

> 💡 Mẹo: dùng Postman/Insomnia thay curl sẽ có giao diện đẹp hơn khi chụp màn hình.

---

## 5. Kiểm thử tự động (nếu cần)

```bash
npm test          # unit test
npm run test:e2e  # e2e test
npm run build     # build (kiểm tra lỗi TypeScript)
```
