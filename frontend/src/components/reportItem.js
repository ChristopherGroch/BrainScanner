import {
  Flex,
  Heading,
  HStack,
  Button,
  VStack,
  Stack,
  Text,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { downloadReport } from "../endpoints/api";
import { refresh } from "../endpoints/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ReportItem = ({ file, date, file_id, patients }) => {
  const nav = useNavigate();
  const handleDownloadFile = async () => {
    try {
      await downloadReport(file_id, "Report.txt");
    } catch (error) {
      console.log("w");
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          await downloadReport(file_id, "Report.txt");
        } catch (refreshError) {
          if (refreshError.response && refreshError.response.status === 401) {
            console.error("Nie udało się odświeżyć tokena", refreshError);
            alert("Twoja sesja wygasła. Zaloguj się ponownie.");
            nav("/login");
          } else {
            toast.error(error.response?.data?.reason || "Unexpected error.");
          }
        }
      } else {
        // alert(error.response?.data?.reason || "Wystąpił błąd.");
        toast.error(error.response?.data?.reason || "Unexpected error.");
      }
    }
  };

  return (
    <Flex
      borderRadius="lg"
      overflow="hidden"
      align={"center"}
      justify={"center"}
      px={0}
      height={"auto"}
      width="100%"
      // border="1px solid gray"
      bg="gray.50"
      boxShadow="md"
      flex="1"
    >
      <VStack spacing={4} p={4} width="100%">
        <Heading as="h2" size="md" mb={2}>
          Report created on {new Date(date).toLocaleString()}
        </Heading>
        <Text fontSize="md" fontWeight="bold" textAlign={"center"}>
          Patients included in report:
        </Text>
        <UnorderedList width="fit-content">
          {patients.map((patient, index) => (
            <ListItem key={index} ml={4}>
              {patient.patient}: {patient.classification_count}{" "}
              classification(s)
            </ListItem>
          ))}
        </UnorderedList>
        <HStack
          justify="center"
          align="center"
          width="100%"
          height="100%"
          // border="1px solid gray"
          spacing={4}
        >
          <Button
            bg="#4CAF50"
            color="white"
            _hover={{
              bg: "green.700",
            }}
            size="sm"
            onClick={handleDownloadFile}
            width="30%"
            boxShadow="md"
          >
            Download Report
          </Button>
          <a
            href={file}
            target="_blank"
            style={{ width: "30%" }}
            rel="noopener noreferrer"
          >
            <Button
              bg="#507DBC"
              color="white"
              _hover={{ bg: "blue.700" }}
              width="100%"
              boxShadow="md"
              size="sm"
            >
              View Report
            </Button>
          </a>
        </HStack>
      </VStack>
    </Flex>
  );
};

export default ReportItem;
