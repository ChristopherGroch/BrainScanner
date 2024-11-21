import { VStack, Text, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";

const Menu = () => {
  const nav = useNavigate();
  const { logoutUser } = useAuth();

  const moveToHistory = () => {
    nav("/history");
  };

  const moveToCreateUser = () => {
    nav("/createUser");
  };

  const handleLogout = async () => {
    await logoutUser();
  };
  return (
    <VStack alignItems="start">
      <Button onClick={moveToHistory} colorScheme="blue">
        Classification History
      </Button>
      <Button onClick={handleLogout} colorScheme="red">
        Logout
      </Button>
      <Button onClick={moveToCreateUser} colorScheme="green">
        Create User
      </Button>
    </VStack>
  );
};
export default Menu;
