import {
  FormControl,
  FormLabel,
  Input,
  Button,
  FormErrorMessage,
  Stack,
  IconButton,
  InputGroup,
  InputRightElement,
  useColorModeValue,
  Flex,
  Box,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { changePassword, refresh } from "../endpoints/api";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { toast } from "sonner";
import { useAuth } from "../context/auth";

const ChangePasasword = () => {
  const [new_password, setNewPassword] = useState("");
  const [repeat_password, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { deleteUser } = useAuth();
  const nav = useNavigate();

  const handleCreateUser = async () => {
    if (repeat_password === new_password) {
      try {
        await changePassword(new_password);
        await deleteUser();
        nav("/login");
      } catch (error) {
        if (error.response && error.response.status === 401) {
          try {
            await refresh();
            await changePassword(new_password);
            await deleteUser();
            nav("/login");
          } catch (refreshError) {
            if (refreshError.response && refreshError.response.status === 401) {
              console.error("Nie udało się odświeżyć tokena", refreshError);
              alert("Twoja sesja wygasła. Zaloguj się ponownie.");
              nav("/login");
            } else {
              // alert(
              //   refreshError.response?.data?.reason || "Wystąpił błąd."
              // );
              setError("");
              if (
                refreshError.response?.data?.reason === "Password is the same"
              ) {
                toast.error(
                  "The new password must be different from the old one."
                );
              } else {
                toast.error(
                  refreshError.response?.data?.reason || "Wystąpił błąd."
                );
              }
            }
          }
        } else {
          // alert(error.response?.data?.reason || "Wystąpił błąd.");
          setError("");
          if (error.response?.data?.reason === "Password is the same") {
            toast.error("The new password must be different from the old one.");
          } else {
            toast.error(error.response?.data?.reason || "Wystąpił błąd.");
          }
        }
      }
    } else {
      setError("Fields must match");
    }
  };

  return (
    <Flex
      minH={"100%"}
      maxW={"100%"}
      align={"center"}
      justify={"center"}
      bg="#DAE3E5"
      flex="1"
    >
      <Stack
        spacing={8}
        mx={"auto"}
        maxW={"100%"}
        justify={"center"}
        width={"500px"}
        height={"70%"}
        py={6}
        px={6}
      >
        {/* <Stack align={"center"}>
          <Heading fontSize={"4xl"} color="#04080F">
            Change password
          </Heading>
        </Stack> */}
        <Box
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.700")}
          boxShadow={"lg"}
          p={8}
        >
          <Stack spacing={4}>
            <FormControl id="email">
              <FormLabel color="#04080F">New password</FormLabel>
              <Input
                color="#04080F"
                onChange={(e) => setNewPassword(e.target.value)}
                value={new_password}
                boxShadow="md"
                type="password"
              />
            </FormControl>
            <FormControl isInvalid={!!error}>
              <FormLabel color="#04080F">Repeat new password</FormLabel>
              <InputGroup>
                <Input
                  color="#04080F"
                  onChange={(e) => setRepeat(e.target.value)}
                  value={repeat_password}
                  type={showPassword ? "text" : "password"}
                  boxShadow="md"
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
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>
            <Stack spacing={10}>
              <Button
                bg="#507DBC"
                color={"white"}
                onClick={handleCreateUser}
                boxShadow="md"
                _hover={{
                  bg: "blue.700",
                }}
              >
                Change password
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
    // <VStack>
    //   <FormControl>
    //     <FormLabel>New password</FormLabel>
    //     <Input
    //       onChange={(e) => setNewPassword(e.target.value)}
    //       value={new_password}
    //       type="password"
    //     />
    //   </FormControl>
    //   <FormControl isInvalid={!!error}>
    //     <FormLabel>Repeat new password</FormLabel>
    //     <Input
    //       onChange={(e) => setRepeat(e.target.value)}
    //       value={repeat_password}
    //       type="password"
    //     />
    //     <FormErrorMessage>{error}</FormErrorMessage>
    //   </FormControl>
    //   <Button onClick={handleCreateUser}>Change Password</Button>
    // </VStack>
  );
};
export default ChangePasasword;
