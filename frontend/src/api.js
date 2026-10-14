import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// ---- Sách ----
export const fetchBooks = () => api.get('/books').then((res) => res.data);

// ---- Độc giả ----
export const fetchReaders = () => api.get('/readers').then((res) => res.data);

// ---- Phiếu mượn ----
export const fetchBorrowedRecords = (status) => {
  const params = status ? { status } : {};
  return api.get('/borrowed-records', { params }).then((res) => res.data);
};
