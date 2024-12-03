import {
  Flex,
  Box,
  Image,
  VStack,
  Heading,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tooltip,
  Button,
  Select,
  FormControl,
  FormLabel,
  Stack,
  HStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { downloadFile } from "../endpoints/api";
import { classify, refresh } from "../endpoints/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
    try {
      console.log("EW");
      await classify(parseInt(selectedOption), image_id);
      setShowForm(false);
      classifyFunction(image_id, parseInt(selectedOption));
      onCloseModal2();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          await classify(parseInt(selectedOption), image_id);
          setShowForm(false);
          classifyFunction(image_id, parseInt(selectedOption));
          onCloseModal2();
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

  const handleDownloadFile = async () => {
    try {
      await downloadFile(image_id, `${patient}-image.jpg`);
    } catch (error) {
      console.log('w')
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          await downloadFile(image_id, `${patient}-image.jpg`);
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

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenModal2,
    onOpen: onOpenModal2,
    onClose: onCloseModal2,
  } = useDisclosure();

  return (
    <>
      <Flex
        borderRadius="lg"
        overflow="hidden"
        align={"center"}
        // bg="#BBD1EA"
        justify={"center"}
        px={0}
        width="100%"
        height={"310px"}
        border="1px solid black"
      >
        <HStack justify="space-between" width={"100%"} height={"100%"}>
          <Box
            height={"100%"}
            aspectRatio={1}
            display="flex"
            justifyContent="center"
            alignItems="center"
            // border="4px solid red"
          >
            <Tooltip label={image.split("/").pop()} aria-label="Image name">
              <Image
                src={image}
                alt={patient}
                boxSize="100%"
                objectFit="cover"
                borderRadius="lg"
                cursor="pointer"
                onClick={onOpen}
              />
            </Tooltip>
          </Box>
          <Stack
            height={"100%"}
            aspectRatio={1}
            // display="flex"
            justifyContent="center"
            ml="auto"
            mr="auto"
            // border="4px solid red"
          >
            {showForm ? (
              <>
                {/* <Heading as="h1" size="lg" mb={2}>
                  {patient}
                </Heading> */}
                <Text fontSize="md" color="#04080F" mt={3} fontWeight={"bold"}>
                  No tumor probability:{" "}
                  {`${parseFloat(no_tumor_prob).toFixed(2)}%`}
                </Text>
                <Text fontSize="md" color="#04080F" fontWeight={"bold"}>
                  Pituitary probability:{" "}
                  {`${parseFloat(pituitary_prob).toFixed(2)}%`}
                </Text>
                <Text fontSize="md" color="#04080F" fontWeight={"bold"}>
                  Glioma probability: {`${parseFloat(glioma_prob).toFixed(2)}%`}
                </Text>
                <Text fontSize="md" color="#04080F" mb={3} fontWeight={"bold"}>
                  Meningioma probability:{" "}
                  {`${parseFloat(meningioma_prob).toFixed(2)}%`}
                </Text>
                <FormControl mt={3}>
                  <FormLabel>Select tumor type</FormLabel>
                  <Select
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    placeholder="Unknown"
                    // height={'30px'}
                  >
                    <option value="1">Glioma</option>
                    <option value="2">Meningioma</option>
                    <option value="3">Pituitary</option>
                    <option value="4">No Tumor</option>
                  </Select>
                </FormControl>
                <HStack>
                  <Button
                    bg="#507DBC"
                    color={"white"}
                    _hover={{
                      bg: "blue.700",
                    }}
                    size="md"
                    width={"50%"}
                    onClick={onOpenModal2}
                    isDisabled={!selectedOption}
                  >
                    Submit
                  </Button>
                  <Button
                    width={"50%"}
                    bg="#DB504A"
                    color={"white"}
                    _hover={{
                      bg: "red.700",
                    }}
                    onClick={handleClassifyClick}
                  >
                    Cancel
                  </Button>
                </HStack>
              </>
            ) : (
              <>
                <Heading as="h1" size="lg" mb={1}>
                  {patient}
                </Heading>
                <Text fontSize="md" color="#04080F">
                  Date: {new Date(date).toLocaleString()}
                </Text>
                <Text fontSize="md" color="#04080F">
                  Class: {tumorName}
                </Text>
                <Text fontSize="md" color="#04080F">
                  No tumor probability:{" "}
                  {`${parseFloat(no_tumor_prob).toFixed(2)}%`}
                </Text>
                <Text fontSize="md" color="#04080F">
                  Pituitary probability:{" "}
                  {`${parseFloat(pituitary_prob).toFixed(2)}%`}
                </Text>
                <Text fontSize="md" color="#04080F">
                  Glioma probability: {`${parseFloat(glioma_prob).toFixed(2)}%`}
                </Text>
                <Text fontSize="md" color="#04080F">
                  Meningioma probability:{" "}
                  {`${parseFloat(meningioma_prob).toFixed(2)}%`}
                </Text>
                <HStack justify="space-evenly">
                  <Button
                    bg="#507DBC"
                    color={"white"}
                    _hover={{
                      bg: "blue.700",
                    }}
                    size="md"
                    width="50%"
                    // height={"35px"}
                    display={
                      tumor_type === null
                        ? "inline-flex"
                        : tumor_type === "0"
                        ? "inline-flex"
                        : " none"
                    }
                    onClick={handleClassifyClick}
                  >
                    Classify
                  </Button>
                  <Button
                    bg="#4CAF50"
                    color={"white"}
                    _hover={{
                      bg: "green.700",
                    }}
                    size="md"
                    width={tumor_type ? "100%" : "50%"}
                    // height={"35px"}
                    onClick={handleDownloadFile}
                  >
                    Download
                  </Button>
                </HStack>
              </>
            )}
          </Stack>
        </HStack>
      </Flex>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalCloseButton />
          <ModalBody
            p={4}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Image
              src={image}
              alt={patient}
              objectFit="contain"
              maxW="100%"
              h="800px"
              borderRadius="md"
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpenModal2} onClose={onCloseModal2} isCentered>
        <ModalOverlay />
        <ModalContent bg="#DAE3E5" rounded="lg" boxShadow="xl">
          <ModalCloseButton />
          <ModalBody
            p={6}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={6}
            textAlign="center"
          >
            <Image
              src={image}
              alt={patient}
              objectFit="contain"
              w="100%"
              maxH="400px"
              borderRadius="md"
              shadow="md"
            />

            <Box>
              <Heading size="md" color="#04080F" mb={4}>
                Confirm Action
              </Heading>
              <Text color="#507DBC" fontWeight="semibold" mb={6}>
                Are you sure you want to classify the tumor as{" "}
                <Text as="span" fontWeight="bold" color="#04080F">
                  {TUMOR_TYPES[selectedOption]}?
                </Text>
              </Text>
            </Box>

            <Stack direction="row" justify="center" spacing={4}>
              <Button
                onClick={handleFormSubmit}
                bg="#507DBC"
                color="white"
                _hover={{ bg: "blue.700" }}
              >
                Classify
              </Button>
              <Button variant="outline" color="#507DBC" onClick={onCloseModal2}>
                Cancel
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HistoryItem;
