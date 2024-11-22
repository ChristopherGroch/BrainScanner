import {
  Flex,
  Box,
  Image,
  Heading,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Select,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useState } from "react";
import { downloadReport } from "../endpoints/api";
import { classify, refresh } from "../endpoints/api";
import { useNavigate } from "react-router-dom";

const ReportItem = ({ file, date, file_id }) => {
  const handleDownloadFile = async () => {
      await downloadReport(file_id, 'Report.txt');
  };

  return (
    <Flex
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      alignItems="center"
      gap={4}
    >
      <Box>
        <Heading as="h2" size="md" mb={2}>
          Date: {new Date(date).toLocaleString()}
        </Heading>
        <Button colorScheme="green" size="sm" onClick={handleDownloadFile}>
          Download Report
        </Button>
        <a href={file} target="_blank" rel="noopener noreferrer">
          <Button colorScheme="blue" size="sm">
            View Report
          </Button>
        </a>
      </Box>
    </Flex>
  );
};

export default ReportItem;
