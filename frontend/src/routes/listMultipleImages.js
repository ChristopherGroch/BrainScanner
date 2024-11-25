import React, { useState } from "react";
import { Box, Button, VStack, Heading, IconButton,Modal,ModalContent,ModalOverlay,useDisclosure,ModalHeader,ModalCloseButton,ModalBody,ModalFooter } from "@chakra-ui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import MultipleImages from "../components/multipleImages";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getPatients } from "../endpoints/api";
import { toast } from "sonner";

const MultipleImagesList = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
  const [childData, setChildData] = useState([
    { id: 0, formData: {}, files: [], errors: {}, isDropDown: false },
  ]);
  const [patients, setPatients] = useState([]);
  const nav = useNavigate();

  const fetchPatients = async () => {
    try {
      const patients = await getPatients();
      setPatients(patients);
    } catch (error) {
      setPatients([]);
    }
  };
  useEffect(() => {
    fetchPatients();
  }, []);

  const addChildComponent = () => {
    setChildData((prevData) => [
      ...prevData,
      { id: prevData.length, formData: {}, files: [], errors: {} },
    ]);
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

  const extractData = async () => {
    const allFiles = childData.flatMap((child) => child.files);
    const allFormDataWithPhotos = childData.map((child) => ({
      ...child.formData,
      photos: child.files.map((file) => file.name),
    }));

    return { allFiles, allFormDataWithPhotos };
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
          toast.success("SUCCESS");
          console.log(await extractData());
          onOpen();
        }
      }
    }
    console.log(childData);
  };

  const generateModalContent = () => {
    return childData.map((child) => ({
      ...child.formData,
      photos: child.files.map((file) => file.name),
    }));
  };

  return (
    <>
      <VStack spacing={6} align="stretch">
        <Button size="sm" onClick={() => nav("/menu")} alignSelf="start">
          Menu
        </Button>
        <Heading size="md" textAlign="center">
          Multiple Images Components
        </Heading>

        {childData.map((child) => (
          <Box
            key={child.id}
            borderWidth="1px"
            borderRadius="md"
            p={4}
            shadow="sm"
            bg="gray.50"
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
        ))}

        <Button
          onClick={addChildComponent}
          leftIcon={<PlusIcon />}
          colorScheme="blue"
          alignSelf="center"
        >
          Add Component
        </Button>
        <Button alignSelf="center" onClick={handleSubmit}>
          Submit
        </Button>
      </VStack>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Patient Data</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {generateModalContent().map((patient, index) => (
                <Box
                  key={index}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  bg="gray.50"
                >
                  <Heading size="sm" mb={2}>
                    Patient {index + 1}
                  </Heading>
                  <Box>
                    <strong>First Name:</strong> {patient.first_name || "N/A"}
                  </Box>
                  <Box>
                    <strong>Last Name:</strong> {patient.last_name || "N/A"}
                  </Box>
                  <Box>
                    <strong>Email:</strong> {patient.email || "N/A"}
                  </Box>
                  <Box>
                    <strong>PESEL:</strong> {patient.PESEL || "N/A"}
                  </Box>
                  <Box>
                    <strong>Photos:</strong>{" "}
                    {patient.photos.length > 0
                      ? patient.photos.join(", ")
                      : "No photos uploaded"}
                  </Box>
                </Box>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MultipleImagesList;
