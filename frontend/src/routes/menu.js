import {
  Box,
  Heading,
  Container,
  Text,
  Button,
  Stack,
  Icon,
  useColorModeValue,
  createIcon,
  Flex,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import {
  FcAbout,
  FcDatabase,
  FcAddImage,
  FcDonate,
  FcApproval,
  FcManager,
} from "react-icons/fc";
import { MdImage } from "react-icons/md";

const Menu = () => {
  const nav = useNavigate();
  const { logoutUser, admin } = useAuth();

  const moveToHistory = () => {
    nav("/history");
  };

  const moveToCreateUser = () => {
    nav("/createUser");
  };

  const moveToChangepassword = () => {
    nav("/changePassword");
  };

  const moveToReportHistory = () => {
    nav("/reportHistory");
  };

  const moveToSingleImage = () => {
    nav("/singleImage");
  };

  const moveToMultipleImages = () => {
    nav("/multipleImages");
  };

  const moveToChangeData = () => {
    nav("/changePatient");
  };
  const moveToChangeImage = () => {
    nav("/changeImages");
  };

  const moveToChangeUser = () => {
    nav("/changeUsers");
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const Card = ({ heading, description, icon, href }) => {
    return (
      <Box
        maxW={{ base: "full", md: "275px" }}
        w={"full"}
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg='gray.50'
        p={5}
      >
        <Stack align={"start"} spacing={2}>
          <Flex
            w={16}
            h={16}
            align={"center"}
            justify={"center"}
            color={"white"}
            rounded={"full"}
            bg={useColorModeValue("gray.100", "gray.700")}
          >
            {icon}
          </Flex>
          <Box mt={2}>
            <Heading size="md">{heading}</Heading>
            <Text mt={1} fontSize={"sm"}>
              {description}
            </Text>
          </Box>
          <Button variant={"link"} color={"#507DBC"} size={"sm"} onClick={href}>
            Go there
          </Button>
        </Stack>
      </Box>
    );
  };

  return (
    <Flex minH={"100%"} maxW={"100%"} align={"center"} bg="#DAE3E5" flex="1">
      <Stack
        spacing={3}
        mx={"auto"}
        // maxW={"100%"}
        minH="100%"
        display={"flex"}
        align={"center"}
        width={"100%"}
        height="100%"
        // border="4px solid black"
        py={2}
      >
        <Box
          p={4}
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.700")}
          boxShadow={"lg"}
          width={"50%"}
        >
          <Container maxW={"3xl"}>
            <Stack
              as={Box}
              textAlign={"center"}
              spacing={{ base: 8, md: 14 }}
              py={{ base: 0, md: 20 }}
            >
              <Heading
                fontWeight={600}
                fontSize={{ base: "2xl", sm: "4xl", md: "6xl" }}
                lineHeight={"110%"}
              >
                Better diagnoses, <br />
                <Text as={"span"}>stronger AI</Text>
              </Heading>
              <Text color={"gray.800"}>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Reiciendis obcaecati ut cupiditate pariatur, dignissimos, placeat amet officiis.
              </Text>
              <Stack
                direction={"column"}
                spacing={3}
                align={"center"}
                alignSelf={"center"}
                position={"relative"}
              >
                <Button
                  rounded={"full"}
                  px={6}
                  bg="#507DBC"
                  color="white"
                  _hover={{ bg: "blue.700" }}
                  onClick={moveToSingleImage}
                >
                  Evaluate an image
                </Button>
                <Button variant={"link"} colorScheme={"blue"} size={"sm"}>
                  Learn more
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>
        <Box
          p={4}
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.700")}
          boxShadow={"lg"}
          width={"50%"}
        >
          <Stack spacing={4} as={Container} maxW={"3xl"} textAlign={"center"}>
            <Heading fontSize={{ base: "2xl", sm: "4xl" }} fontWeight={"bold"}>
              Available features
            </Heading>
            <Text color={"gray.800"} fontSize={{ base: "sm", sm: "lg" }}>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Reiciendis obcaecati ut cupiditate pariatur, dignissimos, placeat
              amet officiis.
            </Text>
          </Stack>

          <Container maxW={"5xl"} mt={12}>
            <Flex flexWrap="wrap" gridGap={6} justify="center">
              <Card
                heading={"Single image evaluation"}
                icon={<Icon as={FcAddImage} w={10} h={10} color="#507DBC"/>}
                description={
                  "Upload the patient's MRI image along with their data and check the diagnosis made by the neural network."
                }
                href={moveToSingleImage}
              />
              <Card
                heading={"Multiple image evaluation"}
                icon={<Icon as={FcAddImage} w={10} h={10} />}
                description={
                  "Upload multiple MRI images and patient data, and receive the diagnosis from the neural network in the form of a report."
                }
                href={moveToMultipleImages}
              />
              <Card
                heading={"Checking history of usages"}
                icon={<Icon as={FcDatabase} w={10} h={10} />}
                description={
                  "Check your algorithm usage history."
                }
                href={moveToHistory}
              />
              <Card
                heading={"Checking history of reports"}
                icon={<Icon as={FcDatabase} w={10} h={10} />}
                description={
                  "Check the history of your generated reports."
                }
                href={moveToReportHistory}
              />
              <Card
                heading={"Classifying an image"}
                icon={<Icon as={FcApproval} w={10} h={10} />}
                description={
                  "Classify the previously uploaded image and add it to the dataset that will be used to train a new algorithm in the future."
                }
                href={moveToHistory}
              />
              <Card
                heading={"Change your password"}
                icon={<Icon as={FcAbout} w={10} h={10} />}
                description={
                  "Change your password to ensure account security and protect your personal data."
                }
                href={moveToChangepassword}
              />
            </Flex>
          </Container>
        </Box>
      </Stack>
    </Flex>
  );
};
export default Menu;
