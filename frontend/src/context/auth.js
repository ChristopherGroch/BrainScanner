import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { login, is_auth, refresh, logout, getIsAdmin } from "../endpoints/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(false);
  const [admin, setADmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const get_authenticated = async () => {
    try {
      await is_auth();
      console.log('true_auth')
      setUser(true);
    } catch (error) {
      try {
        await refresh();
        console.log('true_refresh')
        setUser(true)
      } catch {
        console.log('false')
        setUser(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (username, password) => {
    try {
      const info = await login(username, password);
      setUser(info);
      const isAdmin = await getIsAdmin();
      setADmin(isAdmin)
      nav("/menu");
    } catch (error) {
      alert(error);
    }
  };

  const logoutUser = async () => {
    try {
        await logout();
    } catch(error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          await logout();
        } catch (refreshError) {
        }
      } else {
      }
    }
    nav('/login')
  }

  useEffect(() => {
    get_authenticated();
  }, [window.location.pathname]);

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, refresh, logoutUser,admin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
