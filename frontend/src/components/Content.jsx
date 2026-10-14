import { useEffect, useState } from 'react';
import { fetchBooks, fetchReaders, fetchBorrowedRecords } from '../api.js';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function BooksTable() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .catch((err) => setError('Không thể tải dữ liệu sách'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Đang tải...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tiêu đề</th>
          <th>Tác giả</th>
          <th>ISBN</th>
          <th>Năm XB</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {books.map((book) => (
          <tr key={book.id}>
            <td>{book.id}</td>
            <td>{book.title}</td>
            <td>{book.author}</td>
            <td>{book.isbn}</td>
            <td>{book.publishedYear ?? '-'}</td>
            <td>
              <span className={`badge ${book.status === 'AVAILABLE' ? 'badge-green' : 'badge-red'}`}>
                {book.status === 'AVAILABLE' ? 'Có sẵn' : 'Đã mượn'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReadersTable() {
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReaders()
      .then(setReaders)
      .catch((err) => setError('Không thể tải dữ liệu độc giả'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Đang tải...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Họ tên</th>
          <th>Email</th>
          <th>Số điện thoại</th>
          <th>Địa chỉ</th>
        </tr>
      </thead>
      <tbody>
        {readers.map((reader) => (
          <tr key={reader.id}>
            <td>{reader.id}</td>
            <td>{reader.fullName}</td>
            <td>{reader.email}</td>
            <td>{reader.phone ?? '-'}</td>
            <td>{reader.address ?? '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BorrowedTable() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchBorrowedRecords(status || undefined)
      .then(setRecords)
      .catch((err) => setError('Không thể tải dữ liệu phiếu mượn'))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <div className="filter-bar">
        <label>Lọc theo trạng thái: </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="BORROWING">Đang mượn</option>
          <option value="RETURNED">Đã trả</option>
        </select>
      </div>
      {loading && <p className="loading">Đang tải...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sách</th>
              <th>Người mượn</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.book?.title ?? '-'}</td>
                <td>{record.reader?.fullName ?? '-'}</td>
                <td>{formatDate(record.borrowedDate)}</td>
                <td>{formatDate(record.dueDate)}</td>
                <td>
                  <span className={`badge ${record.status === 'BORROWING' ? 'badge-yellow' : 'badge-green'}`}>
                    {record.status === 'BORROWING' ? 'Đang mượn' : 'Đã trả'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Content({ activeTab }) {
  return (
    <main className="content">
      {activeTab === 'books' && <BooksTable />}
      {activeTab === 'readers' && <ReadersTable />}
      {activeTab === 'borrowed' && <BorrowedTable />}
    </main>
  );
}
