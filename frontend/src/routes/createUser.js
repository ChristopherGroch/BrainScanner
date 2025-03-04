import {
  FormControl,
  FormLabel,
  Input,
  Button,
  useDisclosure,
  FormErrorMessage,
  Text,
  Flex,
  Stack,
  Modal,
  Heading,
  Box,
  ModalOverlay,
  ModalBody,
  ModalContent,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createUser, refresh } from "../endpoints/api";
import { toast } from "sonner";
import { parseErrorsFromString, formatErrorsToString } from "../utils/utils";

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
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const reset = () => {
    setFormData({
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      PESEL: "",
    });
    setLoading(false);
    toast.success("User has benn successfully craeted.");
    onClose();
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
      setLoading(true);
      await createUser(
        formData.username,
        formData.first_name,
        formData.last_name,
        formData.email,
        formData.PESEL
      );
      reset();
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
          reset();
        } catch (refreshError) {
          if (refreshError.response && refreshError.response.status === 401) {
            console.error("Nie udało się odświeżyć tokena", refreshError);
            alert("Twoja sesja wygasła. Zaloguj się ponownie.");
            nav("/login");
          } else {
            // alert(refreshError.response?.data?.reason || "Wystąpił błąd.");
            setLoading(false);
            toast.error(
              formatErrorsToString(
                parseErrorsFromString(refreshError.response?.data?.reason)
              ) || "Unexpected error."
            );
          }
        }
      } else {
        // alert(error.response?.data?.reason || "Wystąpił błąd.");
        setLoading(false);
        toast.error(
          formatErrorsToString(
            parseErrorsFromString(error.response?.data?.reason)
          ) || "Unexpected error."
        );
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
        width={"600px"}
        height="100%"
        maxW={"100%"}
        py={5}
        //  border="4px solid black"
      >
        {/* <Stack align={"center"}>
          <Heading fontSize={"4xl"} color="#04080F">
            Create user
          </Heading>
        </Stack> */}
        <Box
          rounded={"lg"}
          bg={"white"}
          boxShadow={"lg"}
          px={6}
          py={4}
          minH="65%"
          width={"100%"}
        >
          <Stack spacing={4}>
            {["username", "first_name", "last_name", "email", "PESEL"].map(
              (field) => (
                <FormControl key={field} isInvalid={!!errors[field]}>
                  <FormLabel color="#04080F">
                    {field.charAt(0).toUpperCase() +
                      field.replace("_", " ").slice(1)}
                  </FormLabel>
                  <Input
                    color="#04080F"
                    boxShadow="md"
                    value={formData[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                  />
                  <FormErrorMessage>{errors[field]}</FormErrorMessage>
                </FormControl>
              )
            )}
            <Button
              bg="#507DBC"
              // mt={3}
              color={"white"}
              _hover={{
                bg: "blue.700",
              }}
              onClick={handleSubmit}
              boxShadow="md"
            >
              Create user
            </Button>
          </Stack>
        </Box>
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent bg="#DAE3E5" rounded="lg" boxShadow="xl">
            <ModalCloseButton />
            <ModalBody p={6}>
              <Heading size="md" color="#04080F" mb={4} textAlign="center">
                Confirm user creation
              </Heading>
              <Text fontSize="lg" color="#04080F" mb={2} textAlign="center">
                Are you sure you want to create a user with the following
                details?
              </Text>
              <Box bg="white" p={4} rounded="md" shadow="md" mb={4}>
                <Text color="#04080F" fontWeight="semibold" ml={3}>
                  Username:{" "}
                  <Text as="span" color="#04080F" fontWeight="normal">
                    {formData.username}
                  </Text>
                </Text>
                <Text color="#04080F" fontWeight="semibold" ml={3}>
                  First name:{" "}
                  <Text as="span" color="#04080F" fontWeight="normal">
                    {formData.first_name}
                  </Text>
                </Text>
                <Text color="#04080F" fontWeight="semibold" ml={3}>
                  Last name:{" "}
                  <Text as="span" color="#04080F" fontWeight="normal">
                    {formData.last_name}
                  </Text>
                </Text>
                <Text color="#04080F" fontWeight="semibold" ml={3}>
                  Email:{" "}
                  <Text as="span" color="#04080F" fontWeight="normal">
                    {formData.email}
                  </Text>
                </Text>
                <Text color="#04080F" fontWeight="semibold" ml={3}>
                  PESEL:{" "}
                  <Text as="span" color="#04080F" fontWeight="normal">
                    {formData.PESEL}
                  </Text>
                </Text>
              </Box>
              <Stack direction="row" justify="center" spacing={4}>
                <Button
                  bg="#507DBC"
                  color="white"
                  _hover={{ bg: "blue.700" }}
                  onClick={handleCreateUser}
                  isLoading={loading}
                  boxShadow="md"
                  width={'100%'}
                >
                  Confirm
                </Button>
                <Button
                  // variant="outline"
                  bg="#DB504A"
                  color={"white"}
                  _hover={{
                    bg: "red.700",
                  }}
                  onClick={onClose}
                  boxShadow="md"
                  width={'100%'}
                >
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
export default CreateUser;
