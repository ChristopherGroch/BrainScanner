import React, { useState } from "react";
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  Flex,
  IconButton,
  Stack,
  Modal,
  ModalContent,
  ModalOverlay,
  useDisclosure,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  HStack,
} from "@chakra-ui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import MultipleImages from "../components/multipleImages";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getPatients } from "../endpoints/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
  multipleImagesCLassification,
  refresh,
  downloadReport,
} from "../endpoints/api";
import {
  containsBraces,
  parseErrorsFromString,
  formatErrorsToString,
} from "../utils/utils";

const MultipleImagesList = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [childData, setChildData] = useState([
    { id: 0, formData: {}, files: [], errors: {}, isDropDown: false },
  ]);
  const [patients, setPatients] = useState([]);
  const nav = useNavigate();
  const [classificationResult, setClassificationResult] = useState(null);
  const [ids, setIds] = useState(1);
  const [loading,setLoading] = useState(false);
  const fetchPatients = async () => {
    try {
      const patients = await getPatients();
      setPatients(patients);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const patients = await getPatients();
          setPatients(patients);
        } catch (error) {
          setPatients([]);
        }
      } else {
        setPatients([]);
      }
    }
  };
  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDownloadFile = async () => {
    await downloadReport(classificationResult.reportID, "Report.txt");
  };

  const addChildComponent = () => {
    setChildData((prevData) => [
      ...prevData,
      { id: ids, formData: {}, files: [], errors: {} },
    ]);
    setIds(ids + 1);
  };

  const validate = async () => {
    let count = 0;
    const updatedData = childData.map((item) => {
      const errors = {};
      let skip = false;
      if (item.isDropDown && !item.formData) {
        errors.patient = "Select patient";
        count++;
        skip = true;
      }
      if (!skip) {
        if (!item.formData.first_name.trim()) {
          errors.first_name = "First name is required";
          count++;
        }
        if (!item.formData.last_name.trim()) {
          errors.last_name = "Last name is required";
          count++;
        }
        if (
          !item.formData.email.trim() ||
          !/\S+@\S+\.\S+/.test(item.formData.email)
        ) {
          errors.email = "Valid email is required";
          count++;
        }
        if (
          !item.formData.PESEL.trim() ||
          !/^\d{11}$/.test(item.formData.PESEL)
        ) {
          errors.PESEL = "PESEL must be 11 digits";
          count++;
        }
        if (item.files.length === 0) {
          errors.file = "File is required";
          count++;
        }
      }
      return {
        ...item,
        errors,
      };
    });
    setChildData(updatedData);
    return count === 0;
  };

  const updateChildData = (id, formData, files, isDropDown) => {
    setChildData((prevData) =>
      prevData.map((child) =>
        child.id === id ? { ...child, formData, files, isDropDown } : child
      )
    );
  };
  const clearFieldError = (id, field) => {
    setChildData((prevData) =>
      prevData.map((child) =>
        child.id === id
          ? {
              ...child,
              errors: {
                ...child.errors,
                [field]: undefined,
              },
            }
          : child
      )
    );
  };

  const removeChildData = (id) => {
    setChildData((prevChildData) =>
      prevChildData.filter((child) => child.id !== id)
    );
  };
  const handleCloseModal = async () => {
    if (classificationResult) {
      nav(0);
    }
    onClose();
  };

  const extractData = async () => {
    const photos = childData.flatMap((child) => child.files);
    const patients = childData.map((child) => ({
      ...child.formData,
      images: child.files.map((file) => file.name),
    }));

    return { photos, patients };
  };

  const validatePeselUniqueness = async () => {
    const peselOccurrences = {};
    let foundDuplicate = false;

    childData.forEach((item) => {
      if (foundDuplicate) return;

      const pesel = item.formData.PESEL?.trim();
      if (pesel) {
        if (peselOccurrences[pesel]) {
          toast.error("Duplicate PESEL Detected", {
            description: `The PESEL "${pesel}" is used by: 
              ${peselOccurrences[pesel].formData.first_name} ${peselOccurrences[pesel].formData.last_name} 
              and ${item.formData.first_name} ${item.formData.last_name}.`,
          });
          foundDuplicate = true;
        } else {
          peselOccurrences[pesel] = item;
        }
      }
    });
    return !foundDuplicate;
  };

  const validateFileUniqueness = async () => {
    const fileOccurrences = {};
    let foundDuplicate = false;

    childData.forEach((item) => {
      if (foundDuplicate) return;

      item.files.forEach((file) => {
        if (foundDuplicate) return;
        const fileName = file.name;

        if (fileName) {
          if (fileOccurrences[fileName]) {
            toast.error("Duplicate File Name Detected", {
              description: `The file "${fileName}" is uploaded by: 
                ${fileOccurrences[fileName].formData.first_name} ${fileOccurrences[fileName].formData.last_name} 
                and ${item.formData.first_name} ${item.formData.last_name}.`,
            });

            foundDuplicate = true;
          } else {
            fileOccurrences[fileName] = item;
          }
        }
      });
    });
    return !foundDuplicate;
  };

  const handleSubmit = async () => {
    const validation_result = await validate();
    if (validation_result) {
      const validation_result = await validatePeselUniqueness();
      if (validation_result) {
        const validation_result = await validateFileUniqueness();
        if (validation_result) {
          onOpen();
        }
      }
    }
  };

  const generateModalContent = () => {
    return childData.map((child) => ({
      ...child.formData,
      photos: child.files.map((file) => file.name),
    }));
  };

  const handleClassify = async () => {
    setLoading(true)
    const requestData = await extractData();

    try {
      const response = await multipleImagesCLassification(requestData);
      console.log(response);
      setClassificationResult(response.data);
      setLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const response = await multipleImagesCLassification(requestData);
          console.log(response);
          setClassificationResult(response.data);
          setLoading(false);
        } catch (refreshError) {
          if (refreshError.response && refreshError.response.status === 401) {
            console.error("Nie udało się odświeżyć tokena", refreshError);
            alert("Twoja sesja wygasła. Zaloguj się ponownie.");
            setLoading(false);
            nav("/login");
          } else {
            // alert(refreshError.response?.data?.reason || "Wystąpił błąd.");
            if (containsBraces(refreshError.response?.data?.reason)) {
              setLoading(false);
              toast.error(
                formatErrorsToString(
                  parseErrorsFromString(refreshError.response?.data?.reason)
                ) || "Unexpoected error"
              );
            } else {
              setLoading(false);
              toast.error(
                refreshError.response?.data?.reason || "Unexpoected error"
              );
            }
          }
        }
      } else {
        // alert(error.response?.data?.reason || "Wystąpił błąd.");
        console.log(error);
        if (containsBraces(error.response?.data?.reason)) {
          setLoading(false);
          toast.error(
            formatErrorsToString(
              parseErrorsFromString(error.response?.data?.reason)
            ) || "Unexpoected error"
          );
        } else {
          setLoading(false);
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
        spacing={2}
        display={"flex"}
        align={"center"}
        justify={"center"}
        width={"650px"}
        height="100%"
        maxW={"100%"}
        py={5}
        // border="4px solid black"
      >
        {/* <Stack align={"center"}>
          <Heading fontSize={"4xl"} color="#04080F">
            Multiple images
          </Heading>
        </Stack> */}
        <Stack width={"100%"}>
          <AnimatePresence initial={false}>
            {childData.map((child) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  key={child.id}
                  rounded={"lg"}
                  bg={"white"}
                  boxShadow={"lg"}
                  px={6}
                  py={4}
                  minH={"500"}
                  width={"100%"}
                  spacing={5}
                  // border="4px solid black"
                  position="relative"
                >
                  <IconButton
                    aria-label="Remove component"
                    icon={<TrashIcon />}
                    size="sm"
                    colorScheme="red"
                    position="absolute"
                    top="4px"
                    right="4px"
                    onClick={() => removeChildData(child.id)}
                  />
                  <MultipleImages
                    patients={patients}
                    errors={child.errors}
                    id={child.id}
                    onChange={updateChildData}
                    clearError={clearFieldError}
                  />
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Stack>
        <VStack width={"95%"}>
          <Button
            onClick={addChildComponent}
            bg="#4CAF50"
            color={"white"}
            boxShadow="md"
            _hover={{
              bg: "green.700",
            }}
            alignSelf="center"
            width={"100%"}
            leftIcon={
              <PlusIcon
                style={{ color: "white", width: "20px", height: "20px" }}
              />
            }
          >
            Add Patient
          </Button>
          <Button
            alignSelf="center"
            onClick={handleSubmit}
            width={"100%"}
            bg="#507DBC"
            color="white"
            boxShadow="md"
            _hover={{ bg: "blue.700" }}
            display={childData.length === 0 ? "none" : "inline-block"}
          >
            Submit
          </Button>
        </VStack>
        <Modal isOpen={isOpen} onClose={handleCloseModal} isCentered>
          <ModalOverlay />
          <ModalContent bg="#DAE3E5" rounded="lg" boxShadow="xl">
            <ModalHeader textAlign="center" color="#04080F">
              {classificationResult ? "Report created" : "Patient Data"}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={6} width={"100%"}>
              {classificationResult ? (
                <VStack spacing={4} w={"100%"}>
                  <VStack spacing={4} w="100%">
                    <a
                      href={`http://127.0.0.1:8000${classificationResult.report}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ width: "100%" }}
                    >
                      <Button
                        bg="#507DBC"
                        color="white"
                        _hover={{ bg: "blue.700" }}
                        size="sm"
                        boxShadow="md"
                        w="100%"
                      >
                        View Report
                      </Button>
                    </a>
                    <Button
                      bg="#00A676"
                      color="white"
                      _hover={{ bg: "#007A55" }}
                      boxShadow="md"
                      size="sm"
                      w="100%"
                      onClick={handleDownloadFile}
                    >
                      Download Report
                    </Button>
                  </VStack>
                </VStack>
              ) : (
                <VStack spacing={6} align="stretch">
                  {generateModalContent().map((patient, index) => (
                    <Box
                      key={index}
                      bg="white"
                      p={4}
                      rounded="md"
                      shadow="md"
                      borderWidth="1px"
                    >
                      <Heading size="sm" mb={2} color="#507DBC">
                        Patient {index + 1}
                      </Heading>
                      <Box color="#04080F">
                        <strong>First Name:</strong>{" "}
                        {patient.first_name || "N/A"}
                      </Box>
                      <Box color="#04080F">
                        <strong>Last Name:</strong> {patient.last_name || "N/A"}
                      </Box>
                      <Box color="#04080F">
                        <strong>Email:</strong> {patient.email || "N/A"}
                      </Box>
                      <Box color="#04080F">
                        <strong>PESEL:</strong> {patient.PESEL || "N/A"}
                      </Box>
                      <Box color="#04080F">
                        <strong>Photos:</strong>{" "}
                        {patient.photos.length > 0
                          ? patient.photos.join(", ")
                          : "No photos uploaded"}
                      </Box>
                    </Box>
                  ))}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter justifyContent="center">
              <HStack width="100%" justifyContent="center">
                <Button
                  bg="#507DBC"
                  color="white"
                  _hover={{ bg: "blue.700" }}
                  onClick={handleClassify}
                  width={"50%"}
                  isLoading={loading}
                  display={classificationResult ? "none" : "inline-block"}
                  boxShadow="md"
                >
                  Classify
                </Button>
                <Button
                  bg="#DB504A"
                  color={"white"}
                  _hover={{
                    bg: "red.700",
                  }}
                  onClick={onClose}
                  width={"50%"}
                  display={classificationResult ? "none" : "inline-block"}
                  boxShadow="md"
                >
                  Cancel
                </Button>
                <Button
                  bg="#507DBC"
                  color="white"
                  _hover={{ bg: "blue.700" }}
                  onClick={handleCloseModal}
                  boxShadow="md"
                  display={classificationResult ? "inline-block" : "none"}
                >
                  Close
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Stack>
    </Flex>
  );
};

export default MultipleImagesList;
