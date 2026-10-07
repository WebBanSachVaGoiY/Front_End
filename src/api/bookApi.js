import api from './axios';
import { INITIAL_BOOKS, MOCK_CATEGORIES } from '../utils/mockData';

const BOOKS_KEY = 'bookrunner_books';
const CATEGORIES_KEY = 'bookrunner_categories';

const getStoredCategories = () => {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(MOCK_CATEGORIES));
      return MOCK_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return MOCK_CATEGORIES;
  }
};

const saveCategories = (categories) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

const getStoredBooks = () => {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    if (!raw) {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(INITIAL_BOOKS));
      return INITIAL_BOOKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKS;
  }
};

const saveBooks = (books) => {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
};

const isOfflineOrUnimplemented = (err) => {
  if (!err?.response) return true; // Mất mạng / Backend chưa bật
  if (err.response.status === 502) return true; // Vite proxy Bad Gateway
  if (err.response.status === 404) return true; // Endpoint Backend chưa viết
  return false;
};

export const bookApi = {
  // Public endpoints
  getBooks: async (params = {}) => {
    const queryParams = { ...params };
    if (params.sort) {
      if (params.sort === 'price_asc') {
        queryParams.sortBy = 'price';
        queryParams.sortDir = 'asc';
      } else if (params.sort === 'price_desc') {
        queryParams.sortBy = 'price';
        queryParams.sortDir = 'desc';
      } else if (params.sort === 'rating') {
        queryParams.sortBy = 'averageRating';
        queryParams.sortDir = 'desc';
      } else if (params.sort === 'best_seller') {
        queryParams.sortBy = 'soldCount';
        queryParams.sortDir = 'desc';
      } else if (params.sort === 'oldest') {
        queryParams.sortBy = 'createdAt';
        queryParams.sortDir = 'asc';
      } else {
        queryParams.sortBy = 'createdAt';
        queryParams.sortDir = 'desc';
      }
      delete queryParams.sort;
    }

    try {
      const { data } = await api.get('/books', { params: queryParams });
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return data?.data || data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      let books = getStoredBooks();

      // Filtering
      if (params.categoryId) {
        books = books.filter((b) => String(b.category?.id) === String(params.categoryId));
      }
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        books = books.filter(
          (b) =>
            b.title?.toLowerCase().includes(kw) ||
            b.author?.toLowerCase().includes(kw) ||
            b.publisher?.toLowerCase().includes(kw)
        );
      }
      if (params.minPrice) {
        books = books.filter((b) => (b.discountPrice || b.price) >= Number(params.minPrice));
      }
      if (params.maxPrice) {
        books = books.filter((b) => (b.discountPrice || b.price) <= Number(params.maxPrice));
      }

      // Sorting
      if (params.sort === 'price_asc') {
        books.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
      } else if (params.sort === 'price_desc') {
        books.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
      } else if (params.sort === 'rating') {
        books.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      } else if (params.sort === 'best_seller') {
        books.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
      }

      // Pagination
      const page = Number(params.page) || 0;
      const size = Number(params.size) || 12;
      const start = page * size;
      const content = books.slice(start, start + size);

      return {
        content,
        totalElements: books.length,
        totalPages: Math.ceil(books.length / size),
        number: page,
        size,
      };
    }
  },

  getBook: async (id) => {
    try {
      const { data } = await api.get(`/books/${id}`);
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return data?.data || data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const books = getStoredBooks();
      const book = books.find((b) => String(b.id) === String(id));
      if (!book) throw new Error('Không tìm thấy sách');
      return book;
    }
  },

  getFeaturedBooks: async () => {
    try {
      const res = await api.get('/books', { params: { isFeatured: true, size: 8, sortBy: 'createdAt', sortDir: 'desc' } });
      const data = res.data?.data || res.data;
      return data.content || data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const books = getStoredBooks();
      return books.filter((b) => b.isFeatured).slice(0, 8);
    }
  },

  getRecommendations: async () => {
    try {
      const res = await api.get('/books', { params: { size: 4, sortBy: 'averageRating', sortDir: 'desc' } });
      const data = res.data?.data || res.data;
      return data.content || data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const books = getStoredBooks();
      return [...books].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 4);
    }
  },

  searchBooks: async (keyword, params = {}) => {
    return bookApi.getBooks({ keyword, ...params });
  },

  getCategories: async () => {
    try {
      const { data } = await api.get('/categories');
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return data?.data || data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      return getStoredCategories();
    }
  },

  createCategory: async (categoryData) => {
    try {
      const { data } = await api.post('/categories', categoryData);
      return data?.data || data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const categories = getStoredCategories();
      const newCategory = {
        ...categoryData,
        id: Date.now(),
      };
      categories.push(newCategory);
      saveCategories(categories);
      return newCategory;
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      const { data } = await api.put(`/categories/${id}`, categoryData);
      return data?.data || data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const categories = getStoredCategories();
      const idx = categories.findIndex((c) => String(c.id) === String(id));
      if (idx !== -1) {
        categories[idx] = { ...categories[idx], ...categoryData };
        saveCategories(categories);
        return categories[idx];
      }
      throw new Error('Không tìm thấy danh mục');
    }
  },

  deleteCategory: async (id) => {
    try {
      // Backend CategoryAPI takes @RequestBody List<Long> ids
      await api.delete('/categories', { data: [Number(id)] });
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const categories = getStoredCategories();
      const filtered = categories.filter((c) => String(c.id) !== String(id));
      saveCategories(filtered);
    }
  },

  getBooksByCategory: async (categoryId, params = {}) => {
    return bookApi.getBooks({ categoryId, ...params });
  },

  // Admin endpoints
  createBook: async (bookData) => {
    try {
      const { data } = await api.post('/books', bookData);
      return data?.data || data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const books = getStoredBooks();
      const cat = MOCK_CATEGORIES.find((c) => String(c.id) === String(bookData.categoryId)) || MOCK_CATEGORIES[0];
      const newBook = {
        ...bookData,
        id: Date.now(),
        category: cat,
        averageRating: 5.0,
        totalReviews: 0,
        active: true,
        isFeatured: false,
        createdAt: new Date().toISOString(),
      };
      books.unshift(newBook);
      saveBooks(books);
      return newBook;
    }
  },

  updateBook: async (id, bookData) => {
    try {
      const { data } = await api.put(`/books/${id}`, bookData);
      return data?.data || data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const books = getStoredBooks();
      const idx = books.findIndex((b) => String(b.id) === String(id));
      if (idx === -1) throw new Error('Không tìm thấy sách');
      const cat = MOCK_CATEGORIES.find((c) => String(c.id) === String(bookData.categoryId)) || books[idx].category;
      books[idx] = {
        ...books[idx],
        ...bookData,
        category: cat,
      };
      saveBooks(books);
      return books[idx];
    }
  },

  deleteBook: async (id) => {
    try {
      await api.delete('/books', { data: [Number(id)] });
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const books = getStoredBooks();
      const filtered = books.filter((b) => String(b.id) !== String(id));
      saveBooks(filtered);
    }
  },

  toggleFeatured: async (id) => {
    try {
      const { data } = await api.patch(`/admin/books/${id}/featured`);
      return data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const books = getStoredBooks();
      const book = books.find((b) => String(b.id) === String(id));
      if (book) {
        book.isFeatured = !book.isFeatured;
        saveBooks(books);
      }
      return book;
    }
  },
};
