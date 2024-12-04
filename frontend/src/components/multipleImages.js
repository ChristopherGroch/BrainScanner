import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Switch,
  FormErrorMessage,
  Stack,
  HStack,
  Flex,
  Text,
  Box,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import ReactSelect from "react-select";
import DropzoneMultiple from "../components/dropzoneMultipleImages";

const MultipleImages = ({ patients, id, errors, onChange, clearError }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    PESEL: "",
  });
  const [isDropdown, setIsDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [files, setFiles] = useState([]);

  const patientOptions = Array.isArray(patients)
    ? patients.map((p) => ({
        value: p.id,
        label: `${p.first_name} ${p.last_name} PESEL: ${p.PESEL}`,
      }))
    : [];

  useEffect(() => {
    if (isDropdown) {
      onChange(id, selectedPatient, files, true);
    } else {
      onChange(id, formData, files, false);
    }
  }, [formData, files, selectedPatient, isDropdown]);

  const handleFileChange = (files) => {
    setFiles((previousFiles) => [...previousFiles, ...files]);
    clearError(id, "file");
    // setErrors((prev) => ({ ...prev, file: "" }));
  };
  const handleFileRemove = (name) => {
    setFiles((files) => files.filter((file) => file.name !== name));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(id, field);
    // setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  const handleSelectChange = (selectedOption) => {
    setSelectedPatient(patients.find((p) => p.id === selectedOption.value));
    clearError(id, "patient");
    // setErrors((prev) => ({ ...prev, patient: "" }));
  };

  const handleSwitchClick = (option) => {
    setIsDropdown(!isDropdown);
  };
  const customStyles = {
    control: (provided) => ({
      ...provided,
      height: "40px",
    }),
  };

  return (
    <>
      <VStack spacing={2} justify="space-between" align="stretch" height="100%">
        <FormControl display="flex" alignItems="center">
          <Flex
            bg="#DAE3E5"
            p="0"
            borderRadius="full"
            align="center"
            justify="space-between"
            w="350px"
            h="40px"
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
          <Stack spacing={2}>
            <FormControl isInvalid={!!errors.patient}>
              <FormLabel>Choose a Patient</FormLabel>
              <ReactSelect
                options={patientOptions}
                onChange={handleSelectChange}
                styles={customStyles}
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
            <HStack>
              <FormControl>
                <FormLabel>First name</FormLabel>
                <Input
                  value={selectedPatient?.first_name || ""}
                  isDisabled={true}
                  _disabled={{
                    cursor: "not-allowed",
                    opacity: "1",
                  }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Last name</FormLabel>
                <Input
                  value={selectedPatient?.last_name || ""}
                  isDisabled={true}
                  _disabled={{
                    cursor: "not-allowed",
                    opacity: "1",
                  }}
                />
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                value={selectedPatient?.email || ""}
                isDisabled={true}
                _disabled={{
                  cursor: "not-allowed",
                  opacity: "1",
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>PESEL</FormLabel>
              <Input
                value={selectedPatient?.PESEL || ""}
                isDisabled={true}
                _disabled={{
                  cursor: "not-allowed",
                  opacity: "1",
                }}
              />
            </FormControl>
          </Stack>
        ) : (
          <Stack spacing={2}>
            {["first_name", "last_name", "email", "PESEL"].map((field) => (
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
            ))}
          </Stack>
        )}

        <DropzoneMultiple
          onFileChange={handleFileChange}
          onFileRemove={handleFileRemove}
          errorFile={errors.file}
        />
      </VStack>
    </>
  );
};
export default MultipleImages;
