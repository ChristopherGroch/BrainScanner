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
import { refresh, changePatient } from "../endpoints/api";
import Dropzone from "../components/dropzone";
import ReactSelect from "react-select";
import { toast } from "sonner";

const ChangePatientData = () => {
  const nav = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [patients, setPatients] = useState([]);
  const [equal, setEqual] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    PESEL: "",
  });
  const [errors, setErrors] = useState({});
  const [patientOptions, setpatientOptions] = useState({});

  const resetStates = async () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      PESEL: "",
    });
    setErrors({});
    setSelectedPatient(null);
    await fetchPatients();
  };

  const fetchPatients = async () => {
    try {
      const patients = await getPatients();
      //   console.log(patients);
      setPatients(patients);
      setpatientOptions(
        patients.map((p) => ({
          value: p.id,
          label: `${p.first_name} ${p.last_name} (${p.PESEL})`,
        }))
      );
    } catch (error) {
      setPatients([]);
    }
  };
  const checkEqual = () => {
    if (selectedPatient?.first_name !== formData.first_name) return false;
    if (selectedPatient?.last_name !== formData.last_name) return false;
    if (selectedPatient?.email !== formData.email) return false;
    if (selectedPatient?.PESEL !== formData.PESEL) return false;
    return true;
  };
  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    setEqual(checkEqual);
  }, [formData]);

  const handleEdit = async () => {
    let request_form = {};
    if (selectedPatient?.first_name !== formData.first_name)
      request_form["first_name"] = formData.first_name;
    if (selectedPatient?.last_name !== formData.last_name)
      request_form["last_name"] = formData.last_name;
    if (selectedPatient?.email !== formData.email)
      request_form["email"] = formData.email;
    if (selectedPatient?.PESEL !== formData.PESEL)
      request_form["PESEL"] = formData.PESEL;

    try {
      const response = await changePatient(request_form, selectedPatient.id);
      toast.success("Data changed");
      await resetStates();
      onClose();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const response = await changePatient(
            request_form,
            selectedPatient.id
          );
          toast.success("Data changed");
          await resetStates();
          onClose();
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
  const handleClick = () => {
    if (validate()) {
      onOpen();
    }
  };

  const handleSelectChange = (selectedOption) => {
    const pat = patients.find((p) => p.id === selectedOption.value);
    setSelectedPatient(pat);
    setFormData({
      first_name: pat.first_name,
      last_name: pat.last_name,
      email: pat.email,
      PESEL: pat.PESEL,
    });
    setErrors({});
  };
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  //   const patientOptions = patients.map((p) => ({
  //     value: p.id,
  //     label: `${p.first_name} ${p.last_name} (${p.PESEL})`,
  //   }));

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Valid email is required";
    if (!formData.PESEL.trim() || !/^\d{11}$/.test(formData.PESEL))
      newErrors.PESEL = "PESEL must be 11 digits";
    if (!selectedPatient) newErrors.patient = "Please select a patient";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <>
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
      {["first_name", "last_name", "email", "PESEL"].map((field) => (
        <FormControl key={field} isInvalid={!!errors[field]}>
          <FormLabel>{field.replace("_", " ").toUpperCase()}</FormLabel>
          <Input
            value={formData[field]}
            onChange={(e) => handleChange(field, e.target.value)}
          />
          <FormErrorMessage>{errors[field]}</FormErrorMessage>
        </FormControl>
      ))}
      <Button onClick={handleClick} isDisabled={equal}>
        EDIT
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={4} textAlign="center">
            <Text>{formData.first_name}</Text>
            <Text>{formData.last_name}</Text>
            <Text>{formData.email}</Text>
            <Text>{formData.PESEL}</Text>
          </ModalBody>
          <Button onClick={handleEdit}>EDIT</Button>
        </ModalContent>
      </Modal>
    </>
  );
};
export default ChangePatientData;
