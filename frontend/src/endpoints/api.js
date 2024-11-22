import { EASINGS } from "@chakra-ui/react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api/";

const LOGIN_URL = `${BASE_URL}token/`;
const HISTORY_URL = `${BASE_URL}history/`;
const USAGES_URL = `${BASE_URL}getUsages/`;
const REFRESH_URL = `${BASE_URL}token/refresh/`;
const AUTH_CHECK_URL = `${BASE_URL}authcheck/`;
const LOGOUT_URL = `${BASE_URL}logout/`;
const ADMIN_URL = `${BASE_URL}checkAdmin/`;
const CREATE_USER = `${BASE_URL}createUser/`;
const PASSWORD_URL = `${BASE_URL}changePassword/1/`;
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
  await axios.post(LOGOUT_URL, {}, { withCredentials: true });

  return true;
};

export const createUser = async (username, first_name, last_name, email, PESEL) => {
  await axios.post(
    CREATE_USER,
    { username, first_name, last_name, email , PESEL},
    { withCredentials: true }
  );

  return true;
};


export const changePassword = async (new_password) => {
  await axios.put(
    PASSWORD_URL,
    { new_password},
    { withCredentials: true }
  );

  return true;
};

export const getHistory = async () => {
  const response = await axios.get(HISTORY_URL, { withCredentials: true });
  return response.data;
};

export const getUsages = async () => {
  const response = await axios.get(USAGES_URL, { withCredentials: true });
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
