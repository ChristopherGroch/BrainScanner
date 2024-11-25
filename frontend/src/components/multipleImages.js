import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Switch,
  FormErrorMessage,
  Box,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import ReactSelect from "react-select";
import DropzoneMultiple from "../components/dropzoneMultipleImages";

const MultipleImages = ({ patients, id, errors, onChange,clearError }) => {
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
        label: `${p.first_name} ${p.last_name} (${p.PESEL})`,
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
    clearError(id,'file');
    // setErrors((prev) => ({ ...prev, file: "" }));
  };
  const handleFileRemove = (name) => {
    setFiles((files) => files.filter((file) => file.name !== name));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(id,field);
    // setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  const handleSelectChange = (selectedOption) => {
    setSelectedPatient(patients.find((p) => p.id === selectedOption.value));
    clearError(id,'patient');
    // setErrors((prev) => ({ ...prev, patient: "" }));
  };

  return (
    <>
      <VStack spacing={2} align="stretch">
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0" fontSize="sm">
            Use Dropdown
          </FormLabel>
          <Switch
            size="sm"
            isChecked={isDropdown}
            onChange={(e) => setIsDropdown(e.target.checked)}
          />
        </FormControl>

        {isDropdown ? (
          <FormControl isInvalid={!!errors.patient}>
            <FormLabel fontSize="sm">Choose a Patient</FormLabel>
            <ReactSelect
              options={patientOptions}
              onChange={handleSelectChange}
              value={
                selectedPatient
                  ? {
                      value: selectedPatient.id,
                      label: `${selectedPatient.first_name} ${selectedPatient.last_name} (${selectedPatient.PESEL})`,
                    }
                  : null
              }
              styles={{
                control: (base) => ({
                  ...base,
                  fontSize: "0.85rem",
                  height: "30px",
                }),
              }}
            />
            <FormErrorMessage>{errors.patient}</FormErrorMessage>
          </FormControl>
        ) : (
          ["first_name", "last_name", "email", "PESEL"].map((field) => (
            <FormControl key={field} isInvalid={!!errors[field]}>
              <FormLabel fontSize="sm">
                {field.replace("_", " ").toUpperCase()}
              </FormLabel>
              <Input
                size="sm"
                value={formData[field]}
                onChange={(e) => handleChange(field, e.target.value)}
              />
              <FormErrorMessage>{errors[field]}</FormErrorMessage>
            </FormControl>
          ))
        )}

        {errors.file && (
          <Box color="white" bg="red.500" p={1} borderRadius="md" fontSize="sm">
            {errors.file}
          </Box>
        )}

        <DropzoneMultiple
          onFileChange={handleFileChange}
          onFileRemove={handleFileRemove}
        />
      </VStack>
    </>
  );
};
export default MultipleImages;
