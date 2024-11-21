import React from "react";
import { useAuth } from "../context/auth";
import { Heading } from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user, loading} = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      nav("/login"); 
    }
  }, [loading, user]);

  if (loading) {
    return <Heading>Loading...</Heading>; 
  }

  if (user) {
    return children; 
  }

  return null;
};

export default ProtectedRoute;
