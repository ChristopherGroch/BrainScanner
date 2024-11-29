import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
} from "@chakra-ui/react";

import { useState, useEffect } from "react";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();
  const { loginUser, user, get_authenticated } = useAuth();

  const handleLogin = async () => {
    await loginUser(username, password);
  };
  useEffect(() => {
    if(user){
      nav('/menu')
    }
  }, [user]);

  return (
    <VStack>
      <FormControl>
        <FormLabel>Username</FormLabel>
        <Input
          onChange={(e) => setUsername(e.target.value)}
          value={username}
          type="text"
        />
      </FormControl>
      <FormControl>
        <FormLabel>Password</FormLabel>
        <Input
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
        />
      </FormControl>
      <Button onClick={handleLogin}>Login</Button>
    </VStack>
  );
};

export default Login;
