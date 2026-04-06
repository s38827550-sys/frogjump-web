const API_BASE = process.env.REACT_APP_API_URL || 'https://frogjump-leaderboard-remake.onrender.com';

export const getToken = () => localStorage.getItem('access_token');
export const getUsername = () => localStorage.getItem('username');
export const getNickname = () => localStorage.getItem('nickname');

export const saveToken = (token, username, nickname) => {
  localStorage.setItem('access_token', token);
  localStorage.setItem('username', username);
  localStorage.setItem('nickname', nickname);
};

export const clearToken = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('username');
  localStorage.removeItem('nickname');
};

export const api = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, options);

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    return null;
  }

  return res;
};