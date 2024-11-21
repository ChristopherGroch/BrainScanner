import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api/";

const LOGIN_URL = `${BASE_URL}token/`;
const HISTORY_URL = `${BASE_URL}history/`;
const REFRESH_URL = `${BASE_URL}token/refresh/`;
const AUTH_CHECK_URL = `${BASE_URL}authcheck/`;
const LOGOUT_URL = `${BASE_URL}logout/`;
const ADMIN_URL = `${BASE_URL}checkAdmin/`;
// axios.defaults.withCredentials = true;

export const login = async (username, password) => {
  await axios.post(
    LOGIN_URL,
    { username, password },
    { withCredentials: true }
  );

  return true;
};

export const logout = async (username, password) => {
    await axios.post(
      LOGOUT_URL,
      {},
      { withCredentials: true }
    );
  
    return true;
  };

export const getHistory = async () => {
  const response = await axios.get(HISTORY_URL, { withCredentials: true });
  return response.data;
};

export const getIsAdmin = async () => {
    const response = await axios.get(ADMIN_URL, { withCredentials: true });
    return response.data.is_admin;
  };

export const refresh = async () => {
  await axios.post(REFRESH_URL, {}, { withCredentials: true });
  return true;
};

export const is_auth = async () => {
  await axios.get(AUTH_CHECK_URL, { withCredentials: true });
  return true;
};
