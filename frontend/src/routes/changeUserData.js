import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  FormErrorMessage,
  Box,
  useDisclosure,
  Modal,
  ModalBody,
  Stack,
  Heading,
  ModalOverlay,
  ModalHeader,
  ModalContent,
  ModalCloseButton,
  Flex,
  HStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getUsers, changeUser, resetPasword } from "../endpoints/api";
import { refresh } from "../endpoints/api";
import ReactSelect from "react-select";
import { toast } from "sonner";

const ChangeUserData = () => {
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isResetOpen,
    onOpen: onResetOpen,
    onClose: onResetClose,
  } = useDisclosure();
  const [equal, setEqual] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    PESEL: "",
  });
  const [showPesel, setShowPesel] = useState(false);
  const [errors, setErrors] = useState({});
  const [userOptions, setUserOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [resetPesel, setResetPesel] = useState("");
  const [resetError, setResetError] = useState("");

  const resetStates = async () => {
    setFormData({
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      PESEL: "",
    });
    setErrors({});
    setSelectedUser(null);
    setEqual(true);
    setShowPesel(false);
    await fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      const users = await getUsers();
      setUsers(users);
      setUserOptions(
        users.map((u) => ({
          value: u.id,
          label: `${u.username} (${u.email})`,
        }))
      );
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const users = await getUsers();
          setUsers(users);
          setUserOptions(
            users.map((u) => ({
              value: u.id,
              label: `${u.username} (${u.email})`,
            }))
          );
        } catch (refresherror) {
          alert("Twoja sesja wygasła. Zaloguj się ponownie.");
          nav("/login");
        }
      } else {
        setUsers([]);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectChange = (selectedOption) => {
    const user = users.find((u) => u.id === selectedOption.value);
    setSelectedUser(user);
    setFormData({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      PESEL: "",
    });
    setShowPesel(false);
    setErrors({});
  };
  const checkEqual = () => {
    if (selectedUser?.first_name !== formData.first_name) return false;
    if (selectedUser?.last_name !== formData.last_name) return false;
    if (selectedUser?.email !== formData.email) return false;
    if (selectedUser?.username !== formData.username) return false;
    return true;
  };

  useEffect(() => {
    setEqual(checkEqual);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "email" && value !== selectedUser?.email) {
      if (selectedUser) {
        setShowPesel(true);
      }
    }
    if (field === "email" && value === selectedUser?.email) {
      setShowPesel(false);
      setFormData((prev) => ({ ...prev, PESEL: "" }));
    }
    setErrors((prev) => ({ ...prev, [field]: "" }));
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
    if (
      showPesel &&
      (!formData.PESEL.trim() || !/^\d{11}$/.test(formData.PESEL))
    )
      newErrors.PESEL = "PESEL must be 11 digits";
    if (!selectedUser) newErrors.user = "Please select a user";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (equal) {
      toast.warning("Every field is the same as before");
    } else if (validate()) {
      onOpen();
    }
  };
  const handleEdit = async () => {
    setLoading(true);
    let request_form = {};
    if (selectedUser?.first_name !== formData.first_name)
      request_form["first_name"] = formData.first_name;
    if (selectedUser?.last_name !== formData.last_name)
      request_form["last_name"] = formData.last_name;
    if (selectedUser?.email !== formData.email) {
      request_form["email"] = formData.email;
      request_form["PESEL"] = formData.PESEL;
    }
    if (selectedUser?.username !== formData.username)
      request_form["username"] = formData.username;
    try {
      const response = await changeUser(request_form, selectedUser.id);
      toast.success("Data changed");
      await resetStates();
      onClose();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const response = await changeUser(request_form, selectedUser.id);
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
            if (
              refreshError.response?.data?.reason.split(" ")[0] === "duplicate"
            ) {
              toast.error("User with that username already exists");
            } else {
              toast.error(
                refreshError.response?.data?.reason || "Unexpected error"
              );
            }
          }
        }
      } else {
        // alert(error.response?.data?.reason || "Wystąpił błąd.");
        if (error.response?.data?.reason.split(" ")[0] === "duplicate") {
          toast.error("User with that username already exists");
        } else {
          toast.error(error.response?.data?.reason || "Unexpected error");
        }
      }
    }
    setLoading(false);
  };

  const handleResetPeselChange = (value) => {
    setResetPesel(value);
    setResetError("");
  };

  const validatePesel = () => {
    if (!resetPesel.trim() || !/^\d{11}$/.test(resetPesel)) {
      setResetError("PESEL must be 11 digits");
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (validatePesel()) {
      const PESEL = resetPesel;
      setLoading(true);
      try {
        const response = await resetPasword(PESEL, selectedUser.id);
        toast.success("Password reseted");
        onResetClose();
      } catch (error) {
        if (error.response && error.response.status === 401) {
          try {
            await refresh();
            const response = await resetPasword(PESEL, selectedUser.id);
            toast.success("Password reseted");
            onResetClose();
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
    }
    setLoading(false);
  };
  const customStyles = {
    control: (provided) => ({
      ...provided,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)", 
    
    }),
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
        // border="4px solid black"
      >
        <Stack align={"center"}>
          <Heading fontSize={"4xl"} color="#04080F">
            Change user data
          </Heading>
        </Stack>
        <Box
          rounded={"lg"}
          bg={"white"}
          boxShadow={"lg"}
          px={6}
          py={4}
          minH="65%"
          width={"100%"}
        >
          <Stack
            spacing={0}
            justify="space-around"
            // align="stretch"
            height="100%"
          >
            <FormControl isInvalid={!!errors.user}>
              <FormLabel>Choose a User</FormLabel>
              <ReactSelect
                options={userOptions}
                onChange={handleSelectChange}
                styles={customStyles}
                value={
                  selectedUser
                    ? {
                        value: selectedUser.id,
                        label: `${selectedUser.username} (${selectedUser.email})`,
                      }
                    : null
                }
              />
              <FormErrorMessage>{errors.user}</FormErrorMessage>
            </FormControl>

            {["username", "first_name", "last_name", "email"].map((field) => (
              <FormControl key={field} isInvalid={!!errors[field]} mt={3}>
                <FormLabel>
                  {" "}
                  {field.charAt(0).toUpperCase() +
                    field.replace("_", " ").slice(1)}
                </FormLabel>
                <Input
                boxShadow="md"
                  value={formData[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
                <FormErrorMessage>{errors[field]}</FormErrorMessage>
              </FormControl>
            ))}

            {showPesel && (
              <FormControl isInvalid={!!errors.PESEL} mt={3}>
                <FormLabel>PESEL</FormLabel>
                <Input
                  value={formData.PESEL}
                  boxShadow="md"
                  onChange={(e) => handleChange("PESEL", e.target.value)}
                />
                <FormErrorMessage>{errors.PESEL}</FormErrorMessage>
              </FormControl>
            )}
            <HStack justify="space-evenly">
              <Button
                mt={3}
                bg="#507DBC"
                color={"white"}
                _hover={{
                  bg: "blue.700",
                }}
                onClick={handleSubmit}
                // isDisabled={equal}
                boxShadow="md"
                width={selectedUser ? "50%" : "100%"}
              >
                Save Changes
              </Button>
              {selectedUser && (
                <Button
                  mt={3}
                  bg="#DB504A"
                  color={"white"}
                  _hover={{
                    bg: "red.700",
                  }}
                  onClick={onResetOpen}
                  boxShadow="md"
                  width="50%"
                >
                  Reset Password
                </Button>
              )}
            </HStack>
          </Stack>
        </Box>
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent bg="#DAE3E5" rounded="lg" boxShadow="xl">
            <ModalCloseButton />
            <ModalBody p={6} textAlign="center">
              <Heading size="md" color="#04080F" mb={4}>
                User Details
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
                  Username:{" "}
                  <Text as="span" color="#04080F" fontWeight="normal">
                    {formData.username}
                  </Text>
                </Text>
                {formData.PESEL && (
                  <Text color="#507DBC" fontWeight="semibold">
                    PESEL:{" "}
                    <Text as="span" color="#04080F" fontWeight="normal">
                      {formData.PESEL}
                    </Text>
                  </Text>
                )}
              </Box>
              <Stack direction="row" justify="center" spacing={4}>
                <Button
                  onClick={handleEdit}
                  bg="#507DBC"
                  color="white"
                  _hover={{ bg: "blue.700" }}
                  isLoading={loading}
                  boxShadow="md"
                  width={'100%'}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  bg="#DB504A"
                  color={"white"}
                  boxShadow="md"
                  _hover={{
                    bg: "red.700",
                  }}
                  onClick={onClose}
                  width={'100%'}
                >
                  Cancel
                </Button>
              </Stack>
            </ModalBody>
          </ModalContent>
        </Modal>
        <Modal isOpen={isResetOpen} onClose={onResetClose} isCentered>
          <ModalOverlay />
          <ModalContent bg="#DAE3E5" rounded="lg" boxShadow="xl">
            <ModalHeader textAlign="center" color="#04080F">
              Reset Password
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={6} textAlign="center">
              <Text mb={4} fontSize="lg" color="#04080F">
                Email with new password will be send to {selectedUser?.email},
                please provide the user's PESEL:
              </Text>
              <FormControl isInvalid={!!resetError}>
                <FormLabel color="#507DBC">PESEL</FormLabel>
                <Input
                  value={resetPesel}
                  onChange={(e) => handleResetPeselChange(e.target.value)}
                  bg="white"
                  color="#04080F"
                  shadow="md"
                  rounded="md"
                  mb={4}
                />
                <FormErrorMessage>{resetError}</FormErrorMessage>
              </FormControl>
              <Stack direction="row" justify="center" spacing={4}>
                <Button
                  onClick={handleResetPassword}
                  bg="#507DBC"
                  color="white"
                  _hover={{ bg: "blue.700" }}
                  isLoading={loading}
                  boxShadow="md"
                  width={'100%'}
                >
                  Reset Password
                </Button>
                <Button
                  variant="outline"
                  bg="#DB504A"
                  color={"white"}
                  boxShadow="md"
                  _hover={{
                    bg: "red.700",
                  }}
                  onClick={onResetClose}
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
export default ChangeUserData;
