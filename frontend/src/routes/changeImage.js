import {
  FormControl,
  FormLabel,
  Button,
  Text,
  Select,
  Flex,
  Heading,
  FormErrorMessage,
  Box,
  useDisclosure,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Image,
  Stack,
  HStack,
} from "@chakra-ui/react";
import { getImages, getPatients, refresh, getUsers } from "../endpoints/api";
import { useEffect, useState } from "react";
import ReactSelect from "react-select";
import { toast } from "sonner";
import { changeImage } from "../endpoints/api";
import { useNavigate } from "react-router-dom";
import emptyImage from "../assets/empty.png";

const ChangeImagesData = () => {
  const nav = useNavigate();
  const TUMOR_TYPES = {
    0: "unknown",
    1: "glioma",
    2: "meningioma",
    3: "pituitary",
    4: "no_tumor",
  };
  const [patientOptions, setpatientOptions] = useState({});
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [images, setImages] = useState([]);
  const [imageOptions, setImageOptions] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTumor, setSelectedTumor] = useState("");
  const [selectError, setSelectError] = useState("");
  const [equal, setEqual] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tumorChange, setTumorChange] = useState(false);
  const [patientChange, setPatientChange] = useState(false);
  const [user, setUser] = useState(null);

  const customStyles = {
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    control: (provided) => ({
      ...provided,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)",
    }),
  };
  const resetStates = async () => {
    setSelectedPatient(null);
    setSelectedImage(null);
    setSelectedTumor("");
    setEqual(true);
    setTumorChange(false);
    setPatientChange(false);
    await fetchData();
  };

  const fetchData = async () => {
    try {
      const images = await getImages();
      const patients = await getPatients();
      const users = await getUsers();
      setImages(images);
      setPatients(patients);
      setUsers(users);
      setpatientOptions(
        patients.map((p) => ({
          value: p.id,
          label: `${p.first_name} ${p.last_name} PESEL:${p.PESEL}`,
        }))
      );
      setImageOptions(
        images.map((p) => ({
          value: p.id,
          label: `${p.photo.split("/").pop()} (${p.patient?.first_name} ${
            p.patient?.last_name
          })`,
        }))
      );
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const images = await getImages();
          const patients = await getPatients();
          const users = await getUsers();
          setImages(images);
          setPatients(patients);
          setUsers(users);
          setpatientOptions(
            patients.map((p) => ({
              value: p.id,
              label: `${p.first_name} ${p.last_name} PESEL:${p.PESEL}`,
            }))
          );
          setImageOptions(
            images.map((p) => ({
              value: p.id,
              label: `${p.photo.split("/").pop()} (${p.patient?.first_name} ${
                p.patient?.last_name
              })`,
            }))
          );
        } catch (refresherror) {
          alert("Twoja sesja wygasła. Zaloguj się ponownie.");
          nav("/login");
        }
      } else {
        setPatients([]);
        setImages([]);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const checkEqual = () => {
    if (selectedPatient?.id !== selectedImage?.patient.id) return false;
    if (!selectedImage?.tumor_type) {
      if (selectedTumor !== "0") return false;
    } else {
      if (selectedTumor !== selectedImage?.tumor_type) return false;
    }
    return true;
  };
  const checkChange = () => {
    if (selectedPatient?.id !== selectedImage?.patient.id) {
      setPatientChange(true);
    } else {
      setPatientChange(false);
    }
    if (!selectedImage?.tumor_type) {
      if (selectedTumor !== "0") {
        setTumorChange(true);
      } else {
        setTumorChange(false);
      }
    } else {
      if (selectedTumor !== selectedImage?.tumor_type) {
        setTumorChange(true);
      } else {
        setTumorChange(false);
      }
    }
  };

  useEffect(() => {
    setEqual(checkEqual);
  }, [selectedPatient, selectedTumor]);

  const handleSelectImageChange = (selectedOption) => {
    const im = images.find((p) => p.id === selectedOption.value);
    setSelectedImage(im);
    setUser(users.find((u) => u.id === im.classified_by));
    const pat = patients.find((p) => p.id === im.patient.id);
    setSelectedPatient(pat);
    if (!im.tumor_type) {
      setSelectedTumor("0");
    } else {
      setSelectedTumor(im.tumor_type);
    }
    setSelectError("");
    console.log(im);
    console.log(pat);
  };

  const handleSelectPatientChange = (selectedOption) => {
    const pat = patients.find((p) => p.id === selectedOption.value);
    setSelectedPatient(pat);
  };

  const handleEdit = async () => {
    let request_form = {};
    if (tumorChange) request_form["tumor_type"] = selectedTumor;
    if (patientChange) request_form["patient"] = selectedPatient.id;

    try {
      const response = await changeImage(request_form, selectedImage.id);
      toast.success("Data changed");
      onClose();
      await resetStates();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const response = await changeImage(request_form, selectedImage.id);
          toast.success("Data changed");
          onClose();
          await resetStates();
        } catch (refreshError) {
          if (refreshError.response && refreshError.response.status === 401) {
            console.error("Nie udało się odświeżyć tokena", refreshError);
            alert("Twoja sesja wygasła. Zaloguj się ponownie.");
            nav("/login");
          } else {
            // alert(refreshError.response?.data?.reason || "Wystąpił błąd.");
            toast.error(
              refreshError.response?.data?.reason || "Wystąpił błąd."
            );
          }
        }
      } else {
        // alert(error.response?.data?.reason || "Wystąpił błąd.");
        toast.error(error.response?.data?.reason || "Wystąpił błąd.");
      }
    }
  };

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
            Change image data
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
            <FormControl isInvalid={!!selectError}>
              <FormLabel>Choose an image</FormLabel>
              <ReactSelect
                options={imageOptions}
                onChange={handleSelectImageChange}
                value={
                  selectedImage
                    ? {
                        value: selectedImage.id,
                        label: `${selectedImage.photo.split("/").pop()} (${
                          selectedImage.patient.first_name
                        } ${selectedImage.patient.last_name})`,
                      }
                    : null
                }
                styles={customStyles}
                menuPlacement="auto"
                menuPortalTarget={document.body}
              />
              <FormErrorMessage>{selectError}</FormErrorMessage>
            </FormControl>
            {selectedImage ? (
              <Flex
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                align={"center"}
                justify={"center"}
                py={4}
                px={0}
                gap={4}
                width="100%"
                // border="4px solid black"
                direction={{ base: "column", md: "row" }}
              >
                <HStack justify="space-between" width={"95%"}>
                  <Image
                    src={`${selectedImage.photo}`}
                    alt={selectedImage.patient.first_name}
                    boxSize={{ base: "100%", md: "224px" }}
                    objectFit="cover"
                    borderRadius="md"
                  />
                  <Stack
                    spacing={3}
                    // flex="1"
                    maxH="224px"
                    width={"50%"}
                    // border="4px solid black"
                  >
                    <Heading
                      as="h2"
                      size="md"
                      color="gray.800"
                      textAlign="center"
                    >
                      Patient: {selectedImage.patient.first_name}{" "}
                      {selectedImage.patient.last_name}
                      <br />
                      Tumor type:{" "}
                      {TUMOR_TYPES[selectedImage.tumor_type] || "unknown"}
                    </Heading>
                    {/* <Text fontSize="sm" color="gray.600" textAlign="center">
                      Tumor type:{" "}
                      {TUMOR_TYPES[selectedImage.tumor_type] || "Unknown"}
                      {""}
                        {selectedImage.classified_by
                          ? `, classified by ${user?.first_name} ${user?.last_name}`
                          : ""}
                    </Text> */}
                    <FormControl width={"100%"}>
                      <FormLabel textAlign="center">
                        Select new tumor type
                      </FormLabel>
                      <Select
                        value={selectedTumor}
                        boxShadow={"md"}
                        onChange={(e) => setSelectedTumor(e.target.value)}
                      >
                        <option value="0">unknown</option>
                        <option value="1">glioma</option>
                        <option value="2">meningioma</option>
                        <option value="3">pituitary</option>
                        <option value="4">no tumor</option>
                      </Select>
                    </FormControl>
                    <FormControl width={"100%"}>
                      <FormLabel textAlign="center">
                        Select new patient
                      </FormLabel>
                      <ReactSelect
                        options={patientOptions}
                        onChange={handleSelectPatientChange}
                        value={
                          selectedPatient
                            ? {
                                value: selectedPatient.id,
                                label: `${selectedPatient.first_name} ${selectedPatient.last_name} PESEL:${selectedPatient.PESEL}`,
                              }
                            : null
                        }
                        styles={customStyles}
                        menuPlacement="auto"
                        menuPortalTarget={document.body}
                      />
                    </FormControl>
                  </Stack>
                </HStack>
              </Flex>
            ) : (
              <Flex
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                align={"center"}
                justify={"center"}
                py={4}
                px={0}
                gap={4}
                width="100%"
                // border="4px solid black"
                direction={{ base: "column", md: "row" }}
              >
                <HStack justify="space-between" width={"95%"}>
                  <Box
                    boxSize="224px"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Image
                      src={emptyImage}
                      // alt={selectedImage.patient.first_name}
                      boxSize="100px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  </Box>
                  <Stack
                    spacing={3}
                    width={"50%"}
                    maxH="224px"
                    // border="4px solid black"
                  >
                    <Heading
                      as="h2"
                      size="md"
                      color="gray.800"
                      textAlign="center"
                    >
                      Patient:
                      <br />
                      Tumor type:
                    </Heading>
                    {/* <Text fontSize="sm" color="gray.600" textAlign="center">
                      Tumor type: {}
                    </Text> */}
                    <FormControl width={"100%"}>
                      <FormLabel textAlign="center">
                        Select new tumor type
                      </FormLabel>
                      <Select value={"0"} boxShadow={"md"} onChange={()=>{}} >
                        <option value="0">unknown</option>
                        <option value="1">glioma</option>
                        <option value="2">meningioma</option>
                        <option value="3">pituitary</option>
                        <option value="4">no tumor</option>
                      </Select>
                    </FormControl>
                    <FormControl width={"100%"}>
                      <FormLabel textAlign="center">
                        Select new patient
                      </FormLabel>
                      <ReactSelect
                        options={patientOptions}
                        value={null}
                        styles={customStyles}
                        readOnly
                        menuPlacement="auto"
                        menuPortalTarget={document.body}
                      />
                    </FormControl>
                  </Stack>
                </HStack>
              </Flex>
            )}
            <Button
              bg="#507DBC"
              color={"white"}
              _hover={{
                bg: "blue.700",
              }}
              size="md"
              // isDisabled={equal}
              boxShadow={"md"}
              // leftIcon={<EditIcon />}
              onClick={() => {
                if (selectedPatient) {
                  if (!equal) {
                    checkChange();
                    onOpen();
                  } else {
                    toast.warning("Every field is the same as before");
                  }
                } else {
                  setSelectError("You must select image");
                }
              }}
            >
              Save changes
            </Button>
          </Stack>
        </Box>
      </Stack>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="#DAE3E5" rounded="lg" boxShadow="xl">
          <ModalCloseButton />
          <ModalBody p={6}>
            <Heading size="md" color="#04080F" textAlign="center" mb={4}>
              Confirm changes
            </Heading>
            <Box bg="white" p={4} rounded="md" shadow="md" mb={4}>
              {patientChange && tumorChange ? (
                <>
                  <Text color="#04080F" fontWeight="semibold" mb={2}>
                    Current patient:{" "}
                    <Text as="span" color="#04080F" fontWeight="normal">
                      {selectedImage.patient.first_name}{" "}
                      {selectedImage.patient.last_name} (
                      {selectedImage.patient.PESEL})
                    </Text>
                  </Text>
                  <Text color="#04080F" fontWeight="semibold" mb={2}>
                    New patient:{" "}
                    <Text as="span" color="#04080F" fontWeight="normal">
                      {selectedPatient.first_name} {selectedPatient.last_name} (
                      {selectedPatient.PESEL})
                    </Text>
                  </Text>
                  <Text color="#04080F" fontWeight="semibold" mb={2}>
                    Tumor type change:{" "}
                    <Text as="span" color="#04080F" fontWeight="normal">
                      from {TUMOR_TYPES[selectedImage.tumor_type] || "unknown"}{" "}
                      to {TUMOR_TYPES[selectedTumor] || "unknown"}
                    </Text>
                  </Text>
                </>
              ) : patientChange ? (
                <>
                  {" "}
                  <Text color="#04080F" fontWeight="semibold" mb={2}>
                    Current patient:{" "}
                    <Text as="span" color="#04080F" fontWeight="normal">
                      {selectedImage.patient.first_name}{" "}
                      {selectedImage.patient.last_name} (
                      {selectedImage.patient.PESEL})
                    </Text>
                  </Text>
                  <Text color="#04080F" fontWeight="semibold" mb={2}>
                    New patient:{" "}
                    <Text as="span" color="#04080F" fontWeight="normal">
                      {selectedPatient.first_name} {selectedPatient.last_name} (
                      {selectedPatient.PESEL})
                    </Text>
                  </Text>
                </>
              ) : (
                <>
                  {" "}
                  <Text color="#04080F" fontWeight="semibold" mb={2}>
                    Tumor type change:{" "}
                    <Text as="span" color="#04080F" fontWeight="normal">
                      from {TUMOR_TYPES[selectedImage?.tumor_type] || "unknown"}{" "}
                      to {TUMOR_TYPES[selectedTumor] || "unknown"}
                    </Text>
                  </Text>
                </>
              )}
            </Box>
            <Stack direction="row" justify="center" spacing={4}>
              <Button
                onClick={handleEdit}
                bg="#507DBC"
                color="white"
                _hover={{ bg: "blue.700" }}
                width={"100%"}
                boxShadow={"md"}
              >
                Confirm
              </Button>
              <Button
                // variant="outline"
                bg="#DB504A"
                color={"white"}
                _hover={{
                  bg: "red.700",
                }}
                onClick={onClose}
                width={"100%"}
                boxShadow={"md"}
              >
                Cancel
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};
export default ChangeImagesData;
