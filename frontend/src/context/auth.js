import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { login, is_auth, refresh, logout, getIsAdmin } from "../endpoints/api";
import { toast } from "sonner";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(false);
  const [userName, setUserName] = useState('');
  const [admin, setADmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const get_authenticated = async () => {
    try {
      const response = await is_auth();
      const isAdmin = await getIsAdmin();
      setADmin(isAdmin);
      console.log("true_auth");
      setUser(true);
      if (response.data.first_name === ''){
        setUserName('Admin')
      }else {
        setUserName(`${response.data.first_name} ${response.data.last_name}`)
      }
    } catch (error) {
      try {
        await refresh();
        const response = await is_auth();
        const isAdmin = await getIsAdmin();
        setADmin(isAdmin);
        console.log("true_refresh");
        setUser(true);
        if (response.data.first_name === ''){
          setUserName('Admin')
        }else {
          setUserName(`${response.data.first_name} ${response.data.last_name}`)
        }
      } catch {
        console.log("false");
        nav('/login')
        setUser(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (username, password) => {
    try {
      console.log('proba')
      const info = await login(username, password);
      console.log('Udalo sie')
      setUser(info);
      const isAdmin = await getIsAdmin();
      setADmin(isAdmin);
      nav("/menu");
    } catch (error) {
      toast.error('Bad credentials')
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
      setUser(false);
      nav("/login");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          await logout();
          setUser(false);
          nav("/login");
        } catch (refreshError) {}
      } else {
      }
    }
  };

  useEffect(() => {
    get_authenticated();
  }, [window.location.pathname]);

  return (
    <AuthContext.Provider
      value={{ user, loading, loginUser, refresh, logoutUser, admin, userName }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
