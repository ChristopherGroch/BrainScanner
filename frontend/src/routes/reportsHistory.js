import { useState } from "react";
import { downloadFile } from "../endpoints/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { useEffect } from "react";
import { getReports } from "../endpoints/api";

import { VStack, Text, Button } from "@chakra-ui/react";
import {
  Box,
  Flex,
  Image,
  Heading,
  FormControl,
  Input,
  FormLabel,
} from "@chakra-ui/react";
import ReportItem from "../components/reportItem";

const ReportHistory = () => {
  const BASE_URL = "http://127.0.0.1:8000";
  const [reports, setReports] = useState([]);
  const { logoutUser } = useAuth();
  const nav = useNavigate();

  const moveToMenu = () => {
    nav("/menu");
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reports = await getReports();
        console.log(reports);
        setReports(reports);
      } catch (error) {
        setReports([]);
      }
    };
    fetchReports();
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

      <Heading as="h1" mb={6} textAlign="center">
        Reports
      </Heading>
      <Flex direction="column" gap={6}>
        {reports.map((menuItem, key) => {
          return (
            <ReportItem
              key={key}
              file={`${BASE_URL}${menuItem.report.file}`}
              date={menuItem.date_of_creation}
              file_id={menuItem.report.id}
            />
          );
        })}
      </Flex>
    </Box>
  );
};
export default ReportHistory;
