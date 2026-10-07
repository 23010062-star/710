# 📚 Quản lý Thư viện - NestJS

Ứng dụng quản lý thư viện xây dựng bằng **NestJS** + **TypeORM**, gồm 3 thực thể:
**Sách (Book)**, **Độc giả (Reader)**, **Độc giả mượn sách (BorrowedRecord)**.

## 🚀 Cài đặt & chạy

```bash
npm install
cp .env.example .env      # tùy chọn, file .env mặc định dùng SQLite
npm run start:dev         # chạy dev tại http://localhost:3000
```

## 🗄️ 3.1 Kết nối CSDL

Cấu hình qua `.env`:

- **Local (mặc định)**: SQLite, file `library.db` — không cần cài server gì thêm.
- **Aiven / MySQL**: đặt `DB_TYPE=mysql` và điền `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` lấy từ dashboard Aiven, sau đó cài driver:

```bash
npm install mysql2
```

## 📂 Cấu trúc

```
src/
├── main.ts                          # ValidationPipe toàn cục
├── app.module.ts                    # ConfigModule + TypeOrmModule (kết nối CSDL)
├── books/                           # Thực thể SÁCH
│   ├── entities/book.entity.ts
│   ├── dto/create-book.dto.ts
│   ├── books.controller.ts
│   ├── books.service.ts
│   └── books.module.ts
├── readers/                         # Thực thể ĐỘC GIẢ
│   ├── entities/reader.entity.ts
│   ├── dto/create-reader.dto.ts
│   ├── readers.controller.ts
│   ├── readers.service.ts
│   └── readers.module.ts
└── borrowed-records/                # Thực thể ĐỘC GIẢ MƯỢN SÁCH
    ├── entities/borrowed-record.entity.ts
    ├── dto/borrow-book.dto.ts
    ├── borrowed-records.controller.ts
    ├── borrowed-records.service.ts
    └── borrowed-records.module.ts
```

## 🔌 API

### Sách
| Method | URL | Mô tả |
|---|---|---|
| GET | `/books` | Danh sách sách |
| GET | `/books/:id` | Chi tiết sách |
| POST | `/books` | Thêm sách `{title, author, isbn, publishedYear?, description?}` |
| PATCH | `/books/:id` | Sửa sách |
| DELETE | `/books/:id` | Xóa sách |

### Độc giả
| Method | URL | Mô tả |
|---|---|---|
| GET | `/readers` | Danh sách độc giả |
| GET | `/readers/:id` | Chi tiết độc giả |
| POST | `/readers` | Thêm độc giả `{fullName, email, phone?, address?}` |
| PATCH | `/readers/:id` | Sửa độc giả |
| DELETE | `/readers/:id` | Xóa độc giả |

### Mượn / trả sách
| Method | URL | Mô tả |
|---|---|---|
| POST | `/borrowed-records/borrow` | **Mượn sách** `{readerId, bookId, dueDate?}` (mặc định hạn trả +14 ngày) |
| GET | `/borrowed-records?status=BORROWING` | **Liệt kê sách đã mượn**: tên sách, ngày mượn, người mượn, hạn trả. `status` = `BORROWING` (đang mượn) hoặc `RETURNED` (đã trả) |
| PUT | `/borrowed-records/:id/return` | Trả sách |

## 🧪 Test nhanh

```bash
# Thêm sách
curl -X POST localhost:3000/books -H "Content-Type: application/json" \
  -d '{"title":"Lập trình Cơ bản","author":"Nguyen A","isbn":"978-604-11-1111-1","publishedYear":2020}'

# Thêm độc giả
curl -X POST localhost:3000/readers -H "Content-Type: application/json" \
  -d '{"fullName":"Tran Van B","email":"tranb@example.com","phone":"0909123456"}'

# Mượn sách (readerId=1, bookId=1)
curl -X POST localhost:3000/borrowed-records/borrow -H "Content-Type: application/json" \
  -d '{"readerId":1,"bookId":1}'

# Liệt kê sách đang được mượn
curl "localhost:3000/borrowed-records?status=BORROWING"

# Trả sách (recordId=1)
curl -X PUT localhost:3000/borrowed-records/1/return
```

## ⚙️ Ghi chú

- `synchronize: true` tự động tạo bảng từ Entity (phù hợp dev; production nên dùng migrations).
- Giao dịch (transaction) đảm bảo khi mượn/trả sách: tạo phiếu mượn và cập nhật trạng thái sách thành công/cùng thất bại.
