import { Text, Stack } from "@chakra-ui/react";
import {
  Box,
  Flex,
  Heading,
  VStack,
  Spinner,
  FormControl,
  Input,
  FormLabel,
} from "@chakra-ui/react";

import Pagination from "@mui/material/Pagination";
import { useEffect, useState } from "react";
import { getUsages, refresh } from "../endpoints/api";
import { useNavigate } from "react-router-dom";
import HistoryItem from "../components/historyItem";

const HistoryMenu = () => {
  const TUMOR_TYPES = {
    0: "Unknown",
    1: "glioma",
    2: "meningioma",
    3: "pituitary",
    4: "no_tumor",
  };
  const BASE_URL = "http://127.0.0.1:8000";
  const [classifications, setClassifications] = useState([]);
  const [searchBar, setSearchBar] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
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
    const fetchClassifications = async () => {
      setLoading(true);
      try {
        const classifications = await getUsages();
        console.log(classifications);
        setClassifications(classifications);
        setNumberOfPages(Math.ceil(classifications.length / 10));
        setLoading(false);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          try {
            await refresh();
            const classifications = await getUsages();
            console.log(classifications);
            setClassifications(classifications);
            setNumberOfPages(Math.ceil(classifications.length / 10));
            setLoading(false);
          } catch (refresherror) {
            alert("Twoja sesja wygasła. Zaloguj się ponownie.");
            nav("/login");
          }
        } else {
          setClassifications([]);
          setLoading(false);
        }
      }
    };
    fetchClassifications();
  }, []);

  useEffect(() => {
    const number = Math.ceil(
      classifications.filter((menuItem) => {
        return searchBar.toLocaleLowerCase() === ""
          ? menuItem
          : menuItem.patient
              .toLocaleLowerCase()
              .includes(searchBar.toLocaleLowerCase()) ||
              (TUMOR_TYPES[menuItem.tumor_type] || "Unknown")
                .toLocaleLowerCase()
                .includes(searchBar.toLocaleLowerCase());
      }).length / 10
    );
    setNumberOfPages(number);
    if (number < page) {
      setPage(1);
    }
  }, [searchBar]);

  const updateTumorType = (image_id, tumor_type) => {
    const updatedClassifications = classifications.map((item) => {
      if (item.image_id === image_id) {
        return { ...item, tumor_type };
      }
      return item;
    });
    setClassifications(updatedClassifications);
  };
  return (
    <>
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
          width={"750px"}
          height="100%"
          maxW={"100%"}
          py={5}
        >
          {/* <Stack align={"center"}>
            <Heading fontSize={"4xl"} color="#04080F">
              Usage history
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
            <Stack
              spacing={4}
              justify="space-around"
              align="stretch"
              height="100%"
            >
              <FormControl>
                <FormLabel>Search</FormLabel>
                <Input
                  placeholder="Enter a term to search..." 
                  onChange={(e) => setSearchBar(e.target.value)}
                  value={searchBar}
                  type="text"
                  border="1px solid black"
                  boxShadow="md"
                />
              </FormControl>
              <VStack width={"100%"} spacing={5}>
                {loading && (
                  <VStack>
                    <Spinner sizer="4xl" />
                    <Text>Loading...</Text>
                  </VStack>
                )}

                {classifications
                  .filter((menuItem) => {
                    return searchBar.toLocaleLowerCase() === ""
                      ? menuItem
                      : menuItem.patient
                          .toLocaleLowerCase()
                          .includes(searchBar.toLocaleLowerCase()) ||
                          (TUMOR_TYPES[menuItem.tumor_type] || "Unknown")
                            .toLocaleLowerCase()
                            .includes(searchBar.toLocaleLowerCase());
                  })
                  .slice(page * 10 - 10, page * 10)
                  .map((menuItem, key) => {
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
                        classifyFunction={updateTumorType}
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
            </Stack>
          </Box>
        </Stack>
      </Flex>
    </>
  );
};
export default HistoryMenu;
