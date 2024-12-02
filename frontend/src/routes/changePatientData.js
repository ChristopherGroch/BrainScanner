import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
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
  Stack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getPatients } from "../endpoints/api";
import { refresh, changePatient } from "../endpoints/api";
import { parseErrorsFromString, formatErrorsToString } from "../utils/utils";
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
          label: `${p.first_name} ${p.last_name} PESEL: ${p.PESEL}`,
        }))
      );
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const patients = await getPatients();
          //   console.log(patients);
          setPatients(patients);
          setpatientOptions(
            patients.map((p) => ({
              value: p.id,
              label: `${p.first_name} ${p.last_name} PESEL: ${p.PESEL}`,
            }))
          );
        } catch (refresherror) {
          alert("Twoja sesja wygasła. Zaloguj się ponownie.");
          nav("/login");
        }
      } else {
        setPatients([]);
      }
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
              formatErrorsToString(
                parseErrorsFromString(refreshError.response?.data?.reason)
              ) || "Unexpected error."
            );
          }
        }
      } else {
        // alert(error.response?.data?.reason || "Wystąpił błąd.");
        toast.error(
          formatErrorsToString(
            parseErrorsFromString(error.response?.data?.reason)
          ) || "Unexpected error."
        );
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
        width={"34%"}
        height="100%"
        maxW={"100%"}
        py={5}
      >
        <Stack align={"center"}>
          <Heading fontSize={"4xl"} color="#04080F">
            Change patient data
          </Heading>
        </Stack>
        <Box
          rounded={"lg"}
          bg={"white"}
          boxShadow={"lg"}
          px={6}
          py={4}
          minH="77%"
          width={"100%"}
        >
          <Stack
            spacing={0}
            justify="space-between"
            align="stretch"
            height="100%"
          >
            <FormControl isInvalid={!!errors.patient}>
              <FormLabel>Choose a Patient</FormLabel>
              <ReactSelect
                options={patientOptions}
                onChange={handleSelectChange}
                value={
                  selectedPatient
                    ? {
                        value: selectedPatient.id,
                        label: `${selectedPatient.first_name} ${selectedPatient.last_name} PESEL: ${selectedPatient.PESEL}`,
                      }
                    : null
                }
              />
              <FormErrorMessage>{errors.patient}</FormErrorMessage>
            </FormControl>
            {["first_name", "last_name", "email", "PESEL"].map((field) => (
              <FormControl key={field} isInvalid={!!errors[field]}>
                <FormLabel>
                  {" "}
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
            <Button
              onClick={handleClick}
              isDisabled={equal}
              bg="#507DBC"
              color={"white"}
              _hover={{
                bg: "blue.700",
              }}
            >
              Edit
            </Button>
          </Stack>
        </Box>
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent bg="#DAE3E5" rounded="lg" boxShadow="xl">
            <ModalCloseButton />
            <ModalBody p={6} textAlign="center">
              <Heading size="md" color="#04080F" mb={4}>
                Patient Details
              </Heading>
              <Box bg="white" p={4} rounded="md" shadow="md" mb={4}>
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
              </Box>
              <Stack direction="row" justify="center" spacing={4}>
                <Button
                  onClick={handleEdit}
                  bg="#507DBC"
                  color="white"
                  _hover={{ bg: "blue.700" }}
                >
                  Edit
                </Button>
                <Button variant="outline" color="#507DBC" onClick={onClose}>
                  Cancel
                </Button>
              </Stack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Stack>
    </Flex>
  );
};
export default ChangePatientData;
