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
  ModalHeader,
  ModalFooter,
  ModalContent,
  ModalCloseButton,
  Image,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getPatients,
  getUsers,
  changeUser,
  resetPasword,
} from "../endpoints/api";
import { refresh, changePatient } from "../endpoints/api";
import Dropzone from "../components/dropzone";
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
      toast.error("Failed to load users");
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
      setShowPesel(true);
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
    if (validate()) {
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
        const PESEL = resetPesel
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

  return (
    <>
      <Box p={4}>
        <FormControl isInvalid={!!errors.user}>
          <FormLabel>Choose a User</FormLabel>
          <ReactSelect
            options={userOptions}
            onChange={handleSelectChange}
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
          <FormControl key={field} isInvalid={!!errors[field]} mt={4}>
            <FormLabel>{field.replace("_", " ").toUpperCase()}</FormLabel>
            <Input
              value={formData[field]}
              onChange={(e) => handleChange(field, e.target.value)}
            />
            <FormErrorMessage>{errors[field]}</FormErrorMessage>
          </FormControl>
        ))}

        {showPesel && (
          <FormControl isInvalid={!!errors.PESEL} mt={4}>
            <FormLabel>PESEL</FormLabel>
            <Input
              value={formData.PESEL}
              onChange={(e) => handleChange("PESEL", e.target.value)}
            />
            <FormErrorMessage>{errors.PESEL}</FormErrorMessage>
          </FormControl>
        )}

        <Button
          mt={4}
          colorScheme="blue"
          onClick={handleSubmit}
          isDisabled={equal}
        >
          Save Changes
        </Button>
        {selectedUser && (
          <Button mt={4} colorScheme="red" onClick={onResetOpen}>
            Reset Password
          </Button>
        )}
      </Box>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={4} textAlign="center">
            <Text>{formData.first_name}</Text>
            <Text>{formData.last_name}</Text>
            <Text>{formData.email}</Text>
            <Text>{formData.username}</Text>
            {formData.PESEL !== "" && <Text>{formData.PESEL}</Text>}
          </ModalBody>
          <Button onClick={handleEdit} isLoading={loading}>
            EDIT
          </Button>
        </ModalContent>
      </Modal>
      <Modal isOpen={isResetOpen} onClose={onResetClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reset Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              To reset the password, please provide the user's PESEL:
            </Text>
            <FormControl isInvalid={!!resetError}>
              <FormLabel>PESEL</FormLabel>
              <Input
                value={resetPesel}
                onChange={(e) => handleResetPeselChange(e.target.value)}
              />
              <FormErrorMessage>{resetError}</FormErrorMessage>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleResetPassword} isLoading={loading}>
              Reset Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
export default ChangeUserData;
