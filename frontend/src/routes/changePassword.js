import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  FormErrorMessage
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { changePassword, refresh } from "../endpoints/api";

const ChangePasasword = () => {
  const [new_password, setNewPassword] = useState("");
  const [repeat_password, setRepeat] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();

  const moveToMenu = () => {
    nav("/menu");
  };

  const handleCreateUser = async () => {
    if (repeat_password === new_password) {
      try {
        await changePassword(new_password);
        nav("/login");
      } catch (error) {
        if (error.response && error.response.status === 401) {
          try {
            await refresh();
            await changePassword(new_password);
            nav("/login");
          } catch (refreshError) {
            if (refreshError.response && refreshError.response.status === 401) {
              console.error("Nie udało się odświeżyć tokena", refreshError);
              alert("Twoja sesja wygasła. Zaloguj się ponownie.");
              nav("/login");
            } else {
              alert(
                refreshError.response?.data?.reason || "Wystąpił błąd."
              );
            }
          }
        } else {
          alert(error.response?.data?.reason || "Wystąpił błąd.");
        }
      }
    } else {
      setError("Fields must match");
    }
  };

  return (
    <VStack>
      <Button onClick={moveToMenu}>Menu</Button>
      <FormControl>
        <FormLabel>New password</FormLabel>
        <Input
          onChange={(e) => setNewPassword(e.target.value)}
          value={new_password}
          type="password"
        />
      </FormControl>
      <FormControl isInvalid={!!error}>
        <FormLabel>Repeat new password</FormLabel>
        <Input
          onChange={(e) => setRepeat(e.target.value)}
          value={repeat_password}
          type="password"
        />
        <FormErrorMessage>{error}</FormErrorMessage>
      </FormControl>
      <Button onClick={handleCreateUser}>Change Password</Button>
    </VStack>
  );
};
export default ChangePasasword;
