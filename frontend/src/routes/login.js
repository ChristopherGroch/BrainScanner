import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  Heading,
  IconButton,
  InputGroup,
  InputRightElement,
  useColorModeValue,
  Flex,
  Box,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { loginUser, user } = useAuth();

  const handleLogin = async () => {
    await loginUser(username, password);
  };
  useEffect(() => {
    if (user) {
      nav("/menu");
    }
  }, [user]);

  return (
    <Flex minH={"100vh"} maxW={"100%"} align={"center"} justify={"center"} bg="#DAE3E5">
      <Stack spacing={8} mx={"auto"} maxW={"2xl"} py={12} px={6}>
        <Stack align={"center"}>
          <Heading fontSize={"4xl"} color="#04080F">
            Sign in to your account
          </Heading>
        </Stack>
        <Box
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.700")}
          boxShadow={"lg"}
          p={8}
        >
          <Stack spacing={4}>
            <FormControl id="email">
              <FormLabel color="#04080F">Username</FormLabel>
              <Input
                color="#04080F"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
                type="text"
              />
            </FormControl>
            <FormControl id="password">
              <FormLabel color="#04080F">Password</FormLabel>
              <InputGroup>
                <Input
                  color="#04080F"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  type={showPassword ? "text" : "password"}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowPassword((prev) => !prev)}
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <Stack spacing={10}>
              <Button
                bg="#507DBC"
                color={"white"}
                onClick={handleLogin}
                _hover={{
                  bg: "blue.700",
                }}
              >
                Sign in
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  );
};

export default Login;
