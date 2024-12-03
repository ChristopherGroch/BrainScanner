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
import { downloadFile } from "../endpoints/api";
import { classify, refresh } from "../endpoints/api";
import { useNavigate } from "react-router-dom";

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
  classifyFunction,
}) => {
  const TUMOR_TYPES = {
    0: "Unknown",
    1: "glioma",
    2: "meningioma",
    3: "pituitary",
    4: "no_tumor",
  };
  const tumorName = TUMOR_TYPES[tumor_type] || "Unknown";

  const [showForm, setShowForm] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const nav = useNavigate();
  const handleClassifyClick = () => {
    setShowForm(!showForm);
  };

  const handleFormSubmit = async () => {
    console.log("Selected option:", selectedOption);
    classifyFunction(image_id, parseInt(selectedOption));
    try {
      console.log("EW")
      await classify(parseInt(selectedOption), image_id);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          await classify(parseInt(selectedOption), image_id);
        } catch (refreshError) {
          console.error("Nie udało się odświeżyć tokena", refreshError);
          alert("Twoja sesja wygasła. Zaloguj się ponownie.");
          nav("/login");
        }
      } else {
        alert(error.response?.data?.reason || "Wystąpił błąd.");
      }
    }
    setShowForm(false);
    onCloseModal2();
  };

  const handleDownloadFile = async () => {
    // console.log(image_id)
    await downloadFile(image_id, `${patient}-image.jpg`);
  };

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOpenModal2, onOpen: onOpenModal2, onClose: onCloseModal2 } = useDisclosure();

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
            Class: {tumorName}
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
          <Button
            colorScheme="blue"
            size="sm"
            display={tumor_type === null ? "inline-flex" : tumor_type === '0' ? "inline-flex" : " none"}
            onClick={handleClassifyClick}
          >
            Classify
          </Button>
          <Button colorScheme="green" size="sm" onClick={handleDownloadFile}>
            Download Image
          </Button>
          {showForm && (
            <Box mt={4}>
              <FormControl>
                <FormLabel>Wybierz rodzaj guza mózgu</FormLabel>
                <Select
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  placeholder="Rodzaj guza mózgu"
                >
                  <option value="1">Glioma</option>
                  <option value="2">Meningioma</option>
                  <option value="3">Pituitary</option>
                  <option value="4">No Tumor</option>
                </Select>
              </FormControl>

              <Button
                colorScheme="blue"
                mt={4}
                onClick={onOpenModal2}
                isDisabled={!selectedOption}
              >
                Submit
              </Button>
            </Box>
          )}
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
      <Modal isOpen={isOpenModal2} onClose={onCloseModal2} isCentered>
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
                {TUMOR_TYPES[selectedOption]}
              </Text>
              <Button onClick={handleFormSubmit}>CLASSIFY</Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HistoryItem;
