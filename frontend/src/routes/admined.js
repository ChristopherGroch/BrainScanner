import { useAuth } from "../context/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminedRoute = ({children}) => {
  const { admin } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!admin) {
      nav("/menu");
    }
  }, [admin]);

  if (admin) {
    return children; 
  }

};

export default AdminedRoute;
