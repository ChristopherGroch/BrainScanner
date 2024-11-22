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
} from "@chakra-ui/react";
import { useState } from "react";
import { downloadFile } from "../endpoints/api";

const HistoryItem = ({
  image,
  patient,
  date,
  tumor_type,
  no_tumor_prob,
  pituitary_prob,
  meningioma_prob,
  glioma_prob,
  image_id,
}) => {

  const handleDownloadFile = async () => {
    // console.log(image_id)
    await downloadFile(image_id,`${patient}-image.jpg`);
  };

  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Flex
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        p={4}
        alignItems="center"
        gap={4}
      >
        <Image
          src={image}
          alt={patient}
          boxSize="100px"
          objectFit="cover"
          borderRadius="md"
          cursor="pointer"
          onClick={onOpen}
        />
        <Box>
          <Heading as="h2" size="md" mb={2}>
            {patient}
          </Heading>
          <Text fontSize="sm" color="gray.600">
            Date: {new Date(date).toLocaleString()}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Class: {tumor_type}
          </Text>
          <Text fontSize="sm" color="gray.600">
            No tumor: {no_tumor_prob}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Pituitary: {pituitary_prob}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Glioma: {glioma_prob}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Meningioma: {meningioma_prob}
          </Text>
          <Button colorScheme="green" size="sm" onClick={handleDownloadFile}>
            Download Image
          </Button>
        </Box>
      </Flex>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent maxW="80%">
          <ModalCloseButton />
          <ModalBody
            p={4}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={4}
          >
            <Image
              src={image}
              alt={patient}
              objectFit="contain"
              w="100%"
              borderRadius="md"
            />

            <Box textAlign="center">
              <Text fontWeight="bold" fontSize="lg">
                {patient}
              </Text>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HistoryItem;
