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
import { getPatients, singleImageCLassification } from "../endpoints/api";
import { refresh } from "../endpoints/api";
import Dropzone from "../components/dropzone";
import ReactSelect from "react-select";
import { toast } from "sonner";

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
      setPatients([]);
    }
  };

  useEffect(() => {
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
        console.log(classificationResult)
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
      if (!isDropdown){
        toast.success('Patient created')
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const response = await singleImageCLassification(requestData, file);
          console.log(response);
          setClassificationResult(response.data);
          if (!isDropdown){
            toast.success('Patient created')
          }
        } catch (refreshError) {
          if (refreshError.response && refreshError.response.status === 401) {
            console.error("Nie udało się odświeżyć tokena", refreshError);
            alert("Twoja sesja wygasła. Zaloguj się ponownie.");
            nav("/login");
          } else {
            // alert(refreshError.response?.data?.reason || "Wystąpił błąd.");
            toast.error(refreshError.response?.data?.reason || "Wystąpił błąd.")
          }
        }
      } else {
        // alert(error.response?.data?.reason || "Wystąpił błąd.");
        toast.error(error.response?.data?.reason || "Wystąpił błąd.")
      }
    }
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

        <Dropzone key={dropzoneKey} onFileChange={handleFileChange} />
        <Button onClick={handleSubmit}>Classify</Button>
      </VStack>

      <Modal isOpen={isOpen} onClose={handleCloseModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={4} textAlign="center">
            {classificationResult ? (
              <>
                <Image
                  src={`http://127.0.0.1:8000${classificationResult.image.photo}`}
                  alt="Patient's Scan"
                  mb={4}
                />
                <Text fontSize="lg" fontWeight="bold">
                  Classification Results
                </Text>
                <Box mt={2}>
                  <Text>
                    No Tumor Probability: {classificationResult.no_tumor_prob}
                  </Text>
                  <Text>
                    Pituitary Tumor Probability:{" "}
                    {classificationResult.pituitary_prob}
                  </Text>
                  <Text>
                    Meningioma Probability:{" "}
                    {classificationResult.meningioma_prob}
                  </Text>
                  <Text>
                    Glioma Probability: {classificationResult.glioma_prob}
                  </Text>
                </Box>
              </>
            ) : (
              <>
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
              </>
            )}
          </ModalBody>
          <Button
            onClick={handleClassify}
            display={!classificationResult ? "inline-flex" : "none"}
          >
            Classify
          </Button>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SingleImage;
