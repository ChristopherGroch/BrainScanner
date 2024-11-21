import { VStack, Text, Button } from "@chakra-ui/react";

import { useEffect, useState } from "react";
import { useAuth } from "../context/auth";
import { getHistory } from "../endpoints/api";

const HistoryMenu = () => {
  const [classifications, setClassifications] = useState([]);
  const { logoutUser } = useAuth();

  useEffect(() => {
    const fetchClassifications = async () => {
      try {
        const classifications = await getHistory();
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
      <Button onClick={handleLogout} colorScheme="red">
        Logout
      </Button>
      <VStack alignItems="start" pb="50px">
        {classifications.map((classifications) => {
          return (
            <Text key={classifications.id} fontSize="22px">
              {classifications.date_of_creation}
            </Text>
          );
        })}
      </VStack>
    </VStack>
  );
};
export default HistoryMenu;
