const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Universal fetch wrapper with authorization header and error parsing
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // If unauthorized, clear token and redirect to login
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
};

export const api = {
  // Authentication
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getMe: () => request('/auth/me'),

  updateProfile: (profileData) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    }),

  // Books
  getBooks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/books?${query}`);
  },

  getBookById: (id) => request(`/books/${id}`),

  createBook: (bookData) =>
    request('/books', {
      method: 'POST',
      body: JSON.stringify(bookData)
    }),

  updateBook: (id, bookData) =>
    request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData)
    }),

  deleteBook: (id) =>
    request(`/books/${id}`, {
      method: 'DELETE'
    }),

  // Students
  getStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/students?${query}`);
  },

  getStudentById: (id) => request(`/students/${id}`),

  createStudent: (studentData) =>
    request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    }),

  updateStudent: (id, studentData) =>
    request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData)
    }),

  toggleStudentStatus: (id) =>
    request(`/students/${id}/status`, {
      method: 'PATCH'
    }),

  // Circulation Issues & Returns
  getIssues: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/issues?${query}`);
  },

  issueBook: (issueData) =>
    request('/issues', {
      method: 'POST',
      body: JSON.stringify(issueData)
    }),

  returnBook: (issueId, returnData = {}) =>
    request(`/issues/${issueId}/return`, {
      method: 'POST',
      body: JSON.stringify(returnData)
    }),

  getMyLoans: () => request('/issues/my-loans'),

  getFines: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/issues/fines?${query}`);
  },

  payFine: (issueId) =>
    request(`/issues/${issueId}/pay-fine`, {
      method: 'PATCH'
    }),

  // Dashboard & Reports
  getDashboardStats: () => request('/dashboard/stats'),

  getReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports?${query}`);
  }
};
