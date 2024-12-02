import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Switch,
  Text,
  Select,
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
  Image,
} from "@chakra-ui/react";
import { getImages, getPatients, refresh } from "../endpoints/api";
import { useEffect, useState } from "react";
import ReactSelect from "react-select";
import { toast } from "sonner";
import { changeImage } from "../endpoints/api";
import { useNavigate } from "react-router-dom";

const ChangeImagesData = () => {
  const nav = useNavigate();
  const BASE_URL = "http://127.0.0.1:8000";
  const TUMOR_TYPES = {
    0: "not_classified",
    1: "glioma",
    2: "meningioma",
    3: "pituitary",
    4: "no_tumor",
  };
  const [patientOptions, setpatientOptions] = useState({});
  const [patients, setPatients] = useState([]);
  const [images, setImages] = useState([]);
  const [imageOptions, setImageOptions] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTumor, setSelectedTumor] = useState("");
  const [equal, setEqual] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tumorChange, setTumorChange] = useState(false);
  const [patientChange, setPatientChange] = useState(false);

  const customStyles = {
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };
  const resetStates = async () => {
    setSelectedPatient(null);
    setSelectedImage(null);
    setSelectedTumor("");
    setEqual(true);
    setTumorChange(false);
    setPatientChange(false);
    await fetchData();
  };

  const fetchData = async () => {
    try {
      const images = await getImages();
      const patients = await getPatients();
      setImages(images);
      setPatients(patients);
      setpatientOptions(
        patients.map((p) => ({
          value: p.id,
          label: `${p.first_name} ${p.last_name} (${p.PESEL})`,
        }))
      );
      setImageOptions(
        images.map((p) => ({
          value: p.id,
          label: `${p.patient?.first_name} ${p.patient?.last_name} (${p.photo})`,
        }))
      );
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const images = await getImages();
          const patients = await getPatients();
          setImages(images);
          setPatients(patients);
          setpatientOptions(
            patients.map((p) => ({
              value: p.id,
              label: `${p.first_name} ${p.last_name} (${p.PESEL})`,
            }))
          );
          setImageOptions(
            images.map((p) => ({
              value: p.id,
              label: `${p.patient?.first_name} ${p.patient?.last_name} (${p.photo})`,
            }))
          );
        } catch (refresherror) {
          alert("Twoja sesja wygasła. Zaloguj się ponownie.");
          nav("/login");
        }
      } else {
        setPatients([]);
        setImages([]);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const checkEqual = () => {
    if (selectedPatient?.id !== selectedImage?.patient.id) return false;
    if (!selectedImage?.tumor_type) {
      if (selectedTumor !== "0") return false;
    } else {
      if (selectedTumor !== selectedImage?.tumor_type) return false;
    }
    return true;
  };
  const checkChange = () => {
    if (selectedPatient?.id !== selectedImage?.patient.id) {
      setPatientChange(true);
    } else {
      setPatientChange(false);
    }
    if (!selectedImage?.tumor_type) {
      if (selectedTumor !== "0") {
        setTumorChange(true);
      } else {
        setTumorChange(false);
      }
    } else {
      if (selectedTumor !== selectedImage?.tumor_type) {
        setTumorChange(true);
      } else {
        setTumorChange(false);
      }
    }
  };

  useEffect(() => {
    setEqual(checkEqual);
  }, [selectedPatient, selectedTumor]);

  const handleSelectImageChange = (selectedOption) => {
    const im = images.find((p) => p.id === selectedOption.value);
    setSelectedImage(im);
    const pat = patients.find((p) => p.id === im.patient.id);
    setSelectedPatient(pat);
    if (!im.tumor_type) {
      setSelectedTumor("0");
    } else {
      setSelectedTumor(im.tumor_type);
    }
  };

  const handleSelectPatientChange = (selectedOption) => {
    const pat = patients.find((p) => p.id === selectedOption.value);
    setSelectedPatient(pat);
  };

  const handleEdit = async () => {
    let request_form = {};
    if (tumorChange) request_form["tumor_type"] = selectedTumor;
    if (patientChange) request_form["patient"] = selectedPatient.id;

    try {
      const response = await changeImage(request_form, selectedImage.id);
      toast.success("Data changed");
      await resetStates();
      onClose();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          const response = await changeImage(request_form, selectedImage.id);
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

  return (
    <>
      <FormLabel>Choose an Image</FormLabel>
      <ReactSelect
        options={imageOptions}
        onChange={handleSelectImageChange}
        value={
          selectedImage
            ? {
                value: selectedImage.id,
                label: `${selectedImage.patient.first_name} ${selectedImage.patient.last_name} (${selectedImage.photo})`,
              }
            : null
        }
        styles={customStyles}
        menuPlacement="auto"
        menuPortalTarget={document.body}
      />

      {selectedImage && (
        <>
          <Flex
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            p={4}
            alignItems="center"
            gap={4}
          >
            <Image
              src={`${BASE_URL}${selectedImage.photo}`}
              alt={selectedImage.patient.first_name}
              boxSize="100px"
              objectFit="cover"
              borderRadius="md"
              cursor="pointer"
            />
            <Box>
              <Heading as="h2" size="md" mb={2}>
                {selectedImage.patient.first_name}
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Tumor type: {TUMOR_TYPES[selectedImage.tumor_type] || "Unknown"}
              </Text>
              <FormControl>
                <FormLabel>Tumor type</FormLabel>
                <Select
                  value={selectedTumor}
                  onChange={(e) => setSelectedTumor(e.target.value)}
                >
                  <option value="0">Unknown</option>
                  <option value="1">Glioma</option>
                  <option value="2">Meningioma</option>
                  <option value="3">Pituitary</option>
                  <option value="4">No Tumor</option>
                </Select>
              </FormControl>
              <FormLabel>Choose a Patient</FormLabel>
              <ReactSelect
                options={patientOptions}
                onChange={handleSelectPatientChange}
                value={
                  selectedPatient
                    ? {
                        value: selectedPatient.id,
                        label: `${selectedPatient.first_name} ${selectedPatient.last_name} (${selectedPatient.PESEL})`,
                      }
                    : null
                }
                styles={customStyles}
                menuPlacement="auto"
                menuPortalTarget={document.body}
              />
              <Button
                colorScheme="blue"
                size="sm"
                isDisabled={equal}
                onClick={() => {
                  checkChange();
                  onOpen();
                }}
              >
                Classify
              </Button>
            </Box>
          </Flex>
          <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalCloseButton />
              <ModalBody p={4} textAlign="center">
                {patientChange && tumorChange ? (
                  <Text>
                    Are you sure to change {selectedImage.photo}'s patient from
                    {selectedImage.patient.first_name}{" "}
                    {selectedImage.patient.last_name}(
                    {selectedImage.patient.PESEL}) to{" "}
                    {selectedPatient.first_name} {selectedPatient.last_name} (
                    {selectedPatient.PESEL}) and tumor type from{" "}
                    {TUMOR_TYPES[selectedImage.tumor_type] || "Unknown"} to{" "}
                    {TUMOR_TYPES[selectedTumor] || "Unknown"}?
                  </Text>
                ) : patientChange ? (
                  <Text>Are you sure to change the patient only?</Text>
                ) : tumorChange ? (
                  <Text>Are you sure to change the tumor type only?</Text>
                ) : (
                  <Text>No changes detected.</Text>
                )}
              </ModalBody>
              <Button onClick={handleEdit}>EDIT</Button>
            </ModalContent>
          </Modal>
        </>
      )}
    </>
  );
};
export default ChangeImagesData;
