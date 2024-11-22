import { VStack, Text, Button } from "@chakra-ui/react";

import { useEffect, useState } from "react";
import { useAuth } from "../context/auth";
import { getUsages } from "../endpoints/api";
import { useNavigate } from "react-router-dom";

const HistoryMenu = () => {
  const [classifications, setClassifications] = useState([]);
  const { logoutUser } = useAuth();
  const nav = useNavigate()

  const moveToMenu = () => {
    nav('/menu')
  }

  useEffect(() => {
    const fetchClassifications = async () => {
      try {
        const classifications = await getUsages();
        console.log(classifications)
        setClassifications(classifications);
      } catch (error) {
        setClassifications([]);
      }
    };
    fetchClassifications();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <VStack alignItems="start">
      <Button onClick={moveToMenu}>Menu</Button>
      <Button onClick={handleLogout} colorScheme="red">
        Logout
      </Button>
      <VStack alignItems="start" pb="50px">
        {classifications.map((classifications) => {
          return (
            <Text key={classifications.id} fontSize="22px">
              {classifications.date}
            </Text>
          );
        })}
      </VStack>
    </VStack>
  );
};
export default HistoryMenu;
