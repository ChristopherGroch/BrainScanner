import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Flex,
  FormErrorMessage,
  Box,
  useDisclosure,
  Stack,
  Heading,
  useColorModeValue,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Image,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getPatients, singleImageCLassification } from "../endpoints/api";
import { refresh } from "../endpoints/api";
import Dropzone from "../components/dropzone";
import ReactSelect from "react-select";
import { toast } from "sonner";
import {
  containsBraces,
  parseErrorsFromString,
  formatErrorsToString,
} from "../utils/utils";

const SingleImage = () => {
  const nav = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    PESEL: "",
  });
  const [errors, setErrors] = useState({});
  const [isDropdown, setIsDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [file, setFile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [classificationResult, setClassificationResult] = useState(null);
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const handleSwitchClick = (option) => {
    setIsDropdown(!isDropdown);
  };

  const resetStates = async () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      PESEL: "",
    });
    setErrors({});
    setIsDropdown(false);
    setSelectedPatient(null);
    setFile(null);
    setClassificationResult(null);
    setDropzoneKey((prevKey) => prevKey + 1);
    await fetchPatients();
  };

  const fetchPatients = async () => {
    try {
      const patients = await getPatients();
      console.log(patients);
      setPatients(patients);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const patients = await getPatients();
          console.log(patients);
          setPatients(patients);
        } catch (refresherror) {
          alert("Twoja sesja wygasła. Zaloguj się ponownie.");
          nav("/login");
        }
      } else {
        setPatients([]);
      }
      setPatients([]);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const patientOptions = patients.map((p) => ({
    value: p.id,
    label: `${p.first_name} ${p.last_name} - PESEL: ${p.PESEL}`,
  }));

  const validate = () => {
    const newErrors = {};
    if (!isDropdown && !formData.first_name.trim())
      newErrors.first_name = "First name is required";
    if (!isDropdown && !formData.last_name.trim())
      newErrors.last_name = "Last name is required";
    if (
      !isDropdown &&
      (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
    )
      newErrors.email = "Valid email is required";
    if (
      !isDropdown &&
      (!formData.PESEL.trim() || !/^\d{11}$/.test(formData.PESEL))
    )
      newErrors.PESEL = "PESEL must be 11 digits";
    if (isDropdown && !selectedPatient)
      newErrors.patient = "Please select a patient";
    if (!file) newErrors.file = "File is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      console.log(classificationResult);
      onOpen();
    }
  };

  const handleFileChange = (file) => {
    setFile(file);
    setErrors((prev) => ({ ...prev, file: "" }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  const handleSelectChange = (selectedOption) => {
    setSelectedPatient(patients.find((p) => p.id === selectedOption.value));
    setErrors((prev) => ({ ...prev, patient: "" }));
  };

  const handleCloseModal = async () => {
    if (classificationResult) {
      console.log("asdasdasd");
      await resetStates();
    }
    onClose();
  };

  const handleClassify = async () => {
    let requestData = {};
    if (isDropdown) {
      requestData = selectedPatient;
    } else {
      requestData = formData;
    }

    try {
      const response = await singleImageCLassification(requestData, file);
      console.log(response);
      setClassificationResult(response.data);
      if (!isDropdown) {
        toast.success("Patient created");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const response = await singleImageCLassification(requestData, file);
          console.log(response);
          setClassificationResult(response.data);
          if (!isDropdown) {
            toast.success("Patient created");
          }
        } catch (refreshError) {
          if (refreshError.response && refreshError.response.status === 401) {
            console.error("Nie udało się odświeżyć tokena", refreshError);
            alert("Twoja sesja wygasła. Zaloguj się ponownie.");
            nav("/login");
          } else {
            // alert(refreshError.response?.data?.reason || "Wystąpił błąd.");
            if (containsBraces(refreshError.response?.data?.reason)) {
              toast.error(
                formatErrorsToString(
                  parseErrorsFromString(refreshError.response?.data?.reason)
                ) || "Unexpoected error"
              );
            } else {
              toast.error(
                refreshError.response?.data?.reason || "Unexpoected error"
              );
            }
          }
        }
      } else {
        // alert(error.response?.data?.reason || "Wystąpił błąd.");
        if (containsBraces(error.response?.data?.reason)) {
          toast.error(
            formatErrorsToString(
              parseErrorsFromString(error.response?.data?.reason)
            ) || "Unexpoected error"
          );
        } else {
          toast.error(error.response?.data?.reason || "Unexpoected error");
        }
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
        spacing={3}
        mx={"auto"}
        maxW={"100%"}
        width={"34%"}
        py={5}
        px={6}
        //  border="4px solid black"
      >
        <Stack align={"center"}>
          <Heading fontSize={"4xl"} color="#04080F">
            Classify image
          </Heading>
        </Stack>
        <Box
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.700")}
          boxShadow={"lg"}
          p={6}
        >
          <Stack spacing={2}>
            <FormControl display="flex" alignItems="center">
              <Flex
                bg="#DAE3E5"
                p="0"
                borderRadius="full"
                align="center"
                justify="space-between"
                w="350px"
                h='40px'
                mx="auto"
                my="0"
                boxShadow="md"
              >
                <Box
                  flex="1"
                  textAlign="center"
                  py="2"
                  px="4"
                  cursor="pointer"
                  borderRadius="full"
                  bg={!isDropdown ? "#507DBC" : "transparent"}
                  color={!isDropdown ? "white" : "#04080F"}
                  fontWeight={!isDropdown ? "bold" : "normal"}
                  boxShadow={!isDropdown ? "md" : "none"}
                  transition="background-color 0.3s, color 0.3s"
                  onClick={() => handleSwitchClick()}
                  width="50%"
                  height="40px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="md">Create patient</Text>
                </Box>
                <Box
                  flex="1"
                  textAlign="center"
                  py="2"
                  px="4"
                  cursor="pointer"
                  borderRadius="full"
                  bg={isDropdown ? "#507DBC" : "transparent"}
                  color={isDropdown ? "white" : "#04080F"}
                  fontWeight={isDropdown ? "bold" : "normal"}
                  boxShadow={isDropdown ? "md" : "none"}
                  transition="background-color 0.3s, color 0.3s"
                  onClick={() => handleSwitchClick()}
                  width="50%"
                  height="40px" 
                  display="flex"
                  alignItems="center"
                  justifyContent="center" 
                >
                  <Text fontSize="md">Select patient</Text>
                </Box>
              </Flex>
            </FormControl>

            {isDropdown ? (
              <FormControl isInvalid={!!errors.patient}>
                <FormLabel>Choose a Patient</FormLabel>
                <ReactSelect
                  options={patientOptions}
                  onChange={handleSelectChange}
                  value={
                    selectedPatient
                      ? {
                          value: selectedPatient.id,
                          label: `${selectedPatient.first_name} ${selectedPatient.last_name} - PESEL: ${selectedPatient.PESEL}`,
                        }
                      : null
                  }
                />
                <FormErrorMessage>{errors.patient}</FormErrorMessage>
              </FormControl>
            ) : (
              ["first_name", "last_name", "email", "PESEL"].map((field) => (
                <FormControl key={field} isInvalid={!!errors[field]}>
                  <FormLabel>
                    {field.charAt(0).toUpperCase() +
                      field.replace("_", " ").slice(1)}
                  </FormLabel>
                  <Input
                    value={formData[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                  />
                  <FormErrorMessage>{errors[field]}</FormErrorMessage>
                </FormControl>
              ))
            )}
            <Dropzone
              key={dropzoneKey}
              onFileChange={handleFileChange}
              errorFile={errors.file}
            />
            <Button
              onClick={handleSubmit}
              bg="#507DBC"
              color={"white"}
              _hover={{
                bg: "blue.700",
              }}
            >
              Classify
            </Button>
          </Stack>

          <Modal isOpen={isOpen} onClose={handleCloseModal} isCentered>
            <ModalOverlay />
            <ModalContent bg="#DAE3E5" rounded="lg" boxShadow="xl">
              <ModalCloseButton />
              <ModalBody p={6} textAlign="center">
                {!classificationResult ? (
                  <>
                    <Heading size="md" color="#04080F" mb={4}>
                      Confirm Patient Data
                    </Heading>
                    <Text fontSize="lg" color="#04080F" mb={2}>
                      Are you sure the following details are correct?
                    </Text>
                    <Box bg="white" p={4} rounded="md" shadow="md" mb={4}>
                      {isDropdown && selectedPatient ? (
                        <>
                          <Text color="#507DBC" fontWeight="semibold">
                            First Name:{" "}
                            <Text as="span" color="#04080F" fontWeight="normal">
                              {selectedPatient.first_name}
                            </Text>
                          </Text>
                          <Text color="#507DBC" fontWeight="semibold">
                            Last Name:{" "}
                            <Text as="span" color="#04080F" fontWeight="normal">
                              {selectedPatient.last_name}
                            </Text>
                          </Text>
                          <Text color="#507DBC" fontWeight="semibold">
                            Email:{" "}
                            <Text as="span" color="#04080F" fontWeight="normal">
                              {selectedPatient.email}
                            </Text>
                          </Text>
                          <Text color="#507DBC" fontWeight="semibold">
                            PESEL:{" "}
                            <Text as="span" color="#04080F" fontWeight="normal">
                              {selectedPatient.PESEL}
                            </Text>
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text color="#507DBC" fontWeight="semibold">
                            First Name:{" "}
                            <Text as="span" color="#04080F" fontWeight="normal">
                              {formData.first_name}
                            </Text>
                          </Text>
                          <Text color="#507DBC" fontWeight="semibold">
                            Last Name:{" "}
                            <Text as="span" color="#04080F" fontWeight="normal">
                              {formData.last_name}
                            </Text>
                          </Text>
                          <Text color="#507DBC" fontWeight="semibold">
                            Email:{" "}
                            <Text as="span" color="#04080F" fontWeight="normal">
                              {formData.email}
                            </Text>
                          </Text>
                          <Text color="#507DBC" fontWeight="semibold">
                            PESEL:{" "}
                            <Text as="span" color="#04080F" fontWeight="normal">
                              {formData.PESEL}
                            </Text>
                          </Text>
                        </>
                      )}
                    </Box>
                    <Stack direction="row" justify="center" spacing={4}>
                      <Button
                        bg="#507DBC"
                        color="white"
                        _hover={{ bg: "blue.700" }}
                        onClick={handleClassify}
                      >
                        Confirm and Classify
                      </Button>
                      <Button
                        variant="outline"
                        color="#507DBC"
                        onClick={handleCloseModal}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <>
                    <Heading size="md" color="#04080F" mb={4}>
                      Classification Results
                    </Heading>
                    {classificationResult.image && (
                      <Box
                        mb={4}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Image
                          src={`http://127.0.0.1:8000${classificationResult.image.photo}`}
                          alt="Patient's Scan"
                          width="224px"
                          height="224px"
                          objectFit="cover"
                          borderRadius="md"
                          boxShadow="md"
                        />
                      </Box>
                    )}
                    <Box
                      bg="white"
                      p={4}
                      rounded="md"
                      shadow="md"
                      textAlign="left"
                      mb={4}
                    >
                      <Text color="#507DBC" fontWeight="semibold">
                        No Tumor Probability:{" "}
                        <Text as="span" color="#04080F" fontWeight="normal">
                          {classificationResult.no_tumor_prob}
                        </Text>
                      </Text>
                      <Text color="#507DBC" fontWeight="semibold">
                        Pituitary Tumor Probability:{" "}
                        <Text as="span" color="#04080F" fontWeight="normal">
                          {classificationResult.pituitary_prob}
                        </Text>
                      </Text>
                      <Text color="#507DBC" fontWeight="semibold">
                        Meningioma Probability:{" "}
                        <Text as="span" color="#04080F" fontWeight="normal">
                          {classificationResult.meningioma_prob}
                        </Text>
                      </Text>
                      <Text color="#507DBC" fontWeight="semibold">
                        Glioma Probability:{" "}
                        <Text as="span" color="#04080F" fontWeight="normal">
                          {classificationResult.glioma_prob}
                        </Text>
                      </Text>
                    </Box>
                    <Button
                      bg="#507DBC"
                      color="white"
                      _hover={{ bg: "blue.700" }}
                      onClick={handleCloseModal}
                    >
                      Close
                    </Button>
                  </>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
        </Box>
      </Stack>
    </Flex>
  );
};

export default SingleImage;
