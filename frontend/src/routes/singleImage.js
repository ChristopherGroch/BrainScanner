import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Switch,
  Text,
  Select,
  FormErrorMessage,
  Box,
  useDisclosure,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Image,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getPatients } from "../endpoints/api";
import Dropzone from "../components/dropzone";
import ReactSelect from "react-select";

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

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patients = await getPatients();
        console.log(patients);
        setPatients(patients);
      } catch (error) {
        setPatients([]);
      }
    };
    fetchPatients();
  }, []);

  const patientOptions = patients.map((p) => ({
    value: p.id,
    label: `${p.first_name} ${p.last_name} (${p.PESEL})`,
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

  return (
    <>
      <VStack spacing={4}>
        <Button onClick={() => nav("/menu")}>Menu</Button>

        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Use Dropdown</FormLabel>
          <Switch
            isChecked={isDropdown}
            onChange={(e) => setIsDropdown(e.target.checked)}
          />
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
                      label: `${selectedPatient.first_name} ${selectedPatient.last_name} (${selectedPatient.PESEL})`,
                    }
                  : null
              }
            />
            <FormErrorMessage>{errors.patient}</FormErrorMessage>
          </FormControl>
        ) : (
          ["first_name", "last_name", "email", "PESEL"].map((field) => (
            <FormControl key={field} isInvalid={!!errors[field]}>
              <FormLabel>{field.replace("_", " ").toUpperCase()}</FormLabel>
              <Input
                value={formData[field]}
                onChange={(e) => handleChange(field, e.target.value)}
              />
              <FormErrorMessage>{errors[field]}</FormErrorMessage>
            </FormControl>
          ))
        )}

        {errors.file && (
          <Box color="white" bg="red.500" p={2} borderRadius="md">
            {errors.file}
          </Box>
        )}

        <Dropzone onFileChange={handleFileChange} />
        <Button onClick={handleSubmit}>Classify</Button>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={4} textAlign="center">
            {file && <Image src={file.preview} alt={file.name} />}
            {isDropdown && selectedPatient ? (
              <>
                <Text>{selectedPatient.first_name}</Text>
                <Text>{selectedPatient.last_name}</Text>
                <Text>{selectedPatient.email}</Text>
                <Text>{selectedPatient.PESEL}</Text>
              </>
            ) : (
              <>
                <Text>{formData.first_name}</Text>
                <Text>{formData.last_name}</Text>
                <Text>{formData.email}</Text>
                <Text>{formData.PESEL}</Text>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SingleImage;
