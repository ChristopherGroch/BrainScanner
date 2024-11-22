import { VStack, Text, Button } from "@chakra-ui/react";
import { Box, Flex, Image, Heading } from "@chakra-ui/react";

import { useEffect, useState } from "react";
import { useAuth } from "../context/auth";
import { getUsages } from "../endpoints/api";
import { useNavigate } from "react-router-dom";
import HistoryItem from "../components/historyItem";

const HistoryMenu = () => {
  const BASE_URL = "http://127.0.0.1:8000";
  const [classifications, setClassifications] = useState([]);
  const { logoutUser } = useAuth();
  const nav = useNavigate();

  const moveToMenu = () => {
    nav("/menu");
  };

  useEffect(() => {
    const fetchClassifications = async () => {
      try {
        const classifications = await getUsages();
        console.log(classifications);
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
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      pb="50px"
    >
      <Button onClick={moveToMenu}>Menu</Button>
      <Button onClick={handleLogout} colorScheme="red">
        Logout
      </Button>
      <Heading as="h1" mb={6} textAlign="center">
        Patient Images
      </Heading>
      <Flex direction="column" gap={6}>
        {classifications.map((menuItem, key) => {
          return (
            <HistoryItem
              key={key}
              image={`${BASE_URL}${menuItem.image_url}`}
              patient={menuItem.patient}
              date={menuItem.date}
              tumor_type={menuItem.tumor_type}
              no_tumor_prob={menuItem.no_tumor_prob}
              pituitary_prob={menuItem.pituitary_prob}
              glioma_prob={menuItem.glioma_prob}
              meningioma_prob={menuItem.meningioma_prob}
              image_id={menuItem.image_id}
            />
          );
        })}
      </Flex>
    </Box>
  );
};
export default HistoryMenu;
