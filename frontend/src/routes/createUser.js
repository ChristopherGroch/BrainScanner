import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useDisclosure,
  FormErrorMessage,
  Text,
  Modal,
  ModalOverlay,
  ModalBody,
  ModalContent,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createUser, refresh } from "../endpoints/api";

const CreateUser = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    PESEL: "",
  });
  const [errors, setErrors] = useState({});
  const nav = useNavigate();

  const moveToMenu = () => {
    nav("/menu");
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Valid email is required";
    if (!formData.PESEL.trim() || !/^\d{11}$/.test(formData.PESEL))
      newErrors.PESEL = "PESEL must be 11 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onOpen();
    }
  };
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleCreateUser = async () => {
    try {
      await createUser(
        formData.username,
        formData.first_name,
        formData.last_name,
        formData.email,
        formData.PESEL
      );
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          await createUser(
            formData.username,
            formData.first_name,
            formData.last_name,
            formData.email,
            formData.PESEL
          );
        } catch (refreshError) {
          if (refreshError.response && refreshError.response.status === 401) {
            console.error("Nie udało się odświeżyć tokena", refreshError);
            alert("Twoja sesja wygasła. Zaloguj się ponownie.");
            nav("/login");
          } else {
            alert(refreshError.response?.data?.reason || "Wystąpił błąd.");
          }
        }
      } else {
        alert(error.response?.data?.reason || "Wystąpił błąd.");
      }
    }
  };

  return (
    <>
      <VStack>
        <Button onClick={moveToMenu}>Menu</Button>
        {["username", "first_name", "last_name", "email", "PESEL"].map(
          (field) => (
            <FormControl key={field} isInvalid={!!errors[field]}>
              <FormLabel>{field.replace("_", " ").toUpperCase()}</FormLabel>
              <Input
                value={formData[field]}
                onChange={(e) => handleChange(field, e.target.value)}
              />
              <FormErrorMessage>{errors[field]}</FormErrorMessage>
            </FormControl>
          )
        )}
        <Button onClick={handleSubmit}>Create User</Button>
      </VStack>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={4} textAlign="center">
            <Text>{formData.username}</Text>
            <Text>{formData.first_name}</Text>
            <Text>{formData.last_name}</Text>
            <Text>{formData.email}</Text>
            <Text>{formData.PESEL}</Text>
          </ModalBody>
          <Button onClick={handleCreateUser}>Classify</Button>
        </ModalContent>
      </Modal>
    </>
  );
};
export default CreateUser;
