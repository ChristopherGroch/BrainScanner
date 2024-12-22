import { useState } from "react";
import { refresh } from "../endpoints/api";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getReports } from "../endpoints/api";

import {
  VStack,
  Stack,
  Spinner,
  Text,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { Box, Flex} from "@chakra-ui/react";
import ReportItem from "../components/reportItem";
import { toast } from "sonner";
import Pagination from "@mui/material/Pagination";

const ReportHistory = () => {
  const BASE_URL = "http://127.0.0.1:8000";
  const [reports, setReports] = useState([]);
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchBar, setSearchBar] = useState("");

  const [page, setPage] = useState(1);
  const [numberOfPages, setNumberOfPages] = useState(1);
  const handleChange = (event, value) => {
    setPage(value);
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  };

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const reports = await getReports();
        console.log(reports);
        setReports(reports);
        setNumberOfPages(Math.ceil(reports.length / 5));
        setLoading(false);
      } catch (error) {
        console.log("w");
        if (error.response && error.response.status === 401) {
          try {
            await refresh();
            const reports = await getReports();
            console.log(reports);
            setReports(reports);
            setNumberOfPages(Math.ceil(reports.length / 5));
            setLoading(false);
          } catch (refreshError) {
            if (refreshError.response && refreshError.response.status === 401) {
              console.error("Nie udało się odświeżyć tokena", refreshError);
              alert("Twoja sesja wygasła. Zaloguj się ponownie.");
              nav("/login");
            } else {
              setReports([]);
              toast.error(error.response?.data?.reason || "Unexpected error.");
            }
          }
        } else {
          // alert(error.response?.data?.reason || "Wystąpił błąd.");
          setReports([]);
          toast.error(error.response?.data?.reason || "Unexpected error.");
        }
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    const number = Math.ceil(
      (searchBar
        ? reports.filter((report) =>
            report.patients.some((patient) =>
              patient.patient.toLowerCase().includes(searchBar.toLowerCase())
            )
          )
        : reports
      ).length / 5
    );
    setNumberOfPages(number);
    if (number < page) {
      setPage(1);
    }
  }, [searchBar]);

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
        spacing={2}
        display={"flex"}
        align={"center"}
        justify={"center"}
        width={"650px"}
        height="100%"
        maxW={"100%"}
        py={5}
      >
        {/* <Stack align={"center"}>
          <Heading fontSize={"4xl"} color="#04080F">
            Report history
          </Heading>
        </Stack> */}
        <Box
          rounded={"lg"}
          bg={"white"}
          boxShadow={"lg"}
          px={6}
          py={4}
          minH="50%"
          width={"100%"}
        >
          <VStack width={"100%"} spacing={5}>
            <FormControl>
              <FormLabel>Search</FormLabel>
              <Input
                onChange={(e) => setSearchBar(e.target.value)}
                placeholder="Enter a term to search..."
                value={searchBar}
                type="text"
                border="1px solid black"
                boxShadow="md"
              />
            </FormControl>
            {loading && (
              <VStack>
                <Spinner sizer="4xl" />
                <Text>Loading...</Text>
              </VStack>
            )}
            {(searchBar
              ? reports.filter((report) =>
                  report.patients.some((patient) =>
                    patient.patient
                      .toLowerCase()
                      .includes(searchBar.toLowerCase())
                  )
                )
              : reports
            )
              .slice(page * 5 - 5, page * 5)
              .map((menuItem, key) => {
                return (
                  <ReportItem
                    key={key}
                    file={`${BASE_URL}${menuItem.report.report.file}`}
                    date={menuItem.report.date_of_creation}
                    file_id={menuItem.report.report.id}
                    patients={menuItem.patients}
                  />
                );
              })}
            <Stack spacing={2}>
              <Pagination
                count={numberOfPages}
                page={page}
                onChange={handleChange}
                size="lg"
                sx={{
                  ".Mui-selected": {
                    backgroundColor: "#A1C6EA",
                    color: "black",
                    fontWeight: "bold",
                  },
                  "button:hover": {
                    backgroundColor: "#A1C6EA",
                  },
                }}
              />
              <Text fontSize="md" textAlign="center">
                Current page: {page}
              </Text>
            </Stack>
          </VStack>
        </Box>
      </Stack>
    </Flex>
  );
};
export default ReportHistory;
