import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  HStack,
  Image,
} from "@chakra-ui/react";
import nn from "../assets/nn.jpg";
import doctor from "../assets/who.jpg"
import single from "../assets/single.jpg"
import multiple from "../assets/multiple.jpg"
import images from "../assets/images.jpeg"
import reports from "../assets/reports.png"
import errors from "../assets/errors.jpg"

const data = [
  {
    image: nn,
    text: `
      The BrainScanner application is a cutting-edge system designed to support 
      the classification of brain tumors. It simplifies the use of a pre-trained 
      network for this task and enables the annotation of confirmed cases, which 
      can contribute to improving the classification algorithm in the future.
    `,
    heading: `About the algorithm`,
  },
  {
    image: doctor,
    text: `
      The BrainScanner application is a cutting-edge system designed to support 
      the classification of brain tumors. It simplifies the use of a pre-trained 
      network for this task and enables the annotation of confirmed cases, which 
      can contribute to improving the classification algorithm in the future.
    `,
    heading: `Access`,
  },
  {
    image: single,
    text: `
      The BrainScanner application is a cutting-edge system designed to support 
      the classification of brain tumors. It simplifies the use of a pre-trained 
      network for this task and enables the annotation of confirmed cases, which 
      can contribute to improving the classification algorithm in the future.
    `,
    heading: `Single image test`,
  },
  {
    image: multiple,
    text: `
      The BrainScanner application is a cutting-edge system designed to support 
      the classification of brain tumors. It simplifies the use of a pre-trained 
      network for this task and enables the annotation of confirmed cases, which 
      can contribute to improving the classification algorithm in the future.
    `,
    heading: `Multiple images test`,
  },
  {
    image: images,
    text: `
      The BrainScanner application is a cutting-edge system designed to support 
      the classification of brain tumors. It simplifies the use of a pre-trained 
      network for this task and enables the annotation of confirmed cases, which 
      can contribute to improving the classification algorithm in the future.
    `,
    heading: `Usage history`,
  },
  {
    image: reports,
    text: `
      The BrainScanner application is a cutting-edge system designed to support 
      the classification of brain tumors. It simplifies the use of a pre-trained 
      network for this task and enables the annotation of confirmed cases, which 
      can contribute to improving the classification algorithm in the future.
    `,
    heading: `Report history`,
  },
  {
    image: errors,
    text: `
      The BrainScanner application is a cutting-edge system designed to support 
      the classification of brain tumors. It simplifies the use of a pre-trained 
      network for this task and enables the annotation of confirmed cases, which 
      can contribute to improving the classification algorithm in the future.
    `,
    heading: `Errors`,
  },
];

const ContentBlock = ({ image, text, reverse, heading }) => {
  return (
    <Box p={4} rounded={"lg"} bg={"white"} boxShadow={"lg"} width={"60%"}>
      <Container maxW={"3xl"}>
        <HStack
          spacing={8}
          py={{ base: 4, md: 8 }}
          align="center"
          flexDirection={reverse ? "row-reverse" : "row"}
        >
          <Box
            width="40%"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Image
              src={image}
              alt="Brain Scanner Image"
              width="100%"
              height="100%"
              objectFit="cover"
              borderRadius="md"
            //   border="1px"
            />
          </Box>
          <Box
            width="60%"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            // border="1px"
          >
            <Heading mb={8}>{heading}</Heading>
            <Text color={"gray.800"} textAlign="center">
              {text}
            </Text>
          </Box>
        </HStack>
      </Container>
    </Box>
  );
};

const Info = () => {
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
        <Box p={4} rounded={"lg"} bg={"white"} boxShadow={"lg"} width={"60%"}>
          <Container maxW={"3xl"}>
            <Stack
              as={Box}
              textAlign={"center"}
              spacing={{ base: 8, md: 8 }}
              py={{ base: 0, md: 8 }}
            >
              <Heading
                fontWeight={600}
                fontSize={{ base: "2xl", sm: "4xl", md: "5xl" }}
                lineHeight={"110%"}
              >
                Purpose of the application
              </Heading>
              <Text color={"gray.800"}>
                {" "}
                he BrainScanner application is a cutting-edge system designed to
                support the classification of brain tumors. It simplifies the
                use of a pre-trained network for this task and enables the
                annotation of confirmed cases, which can contribute to improving
                the classification algorithm in the future.
              </Text>
            </Stack>
          </Container>
        </Box>
        <Stack spacing={4} width="100%" align="center">
          {data.map((item, index) => (
            <ContentBlock
              key={index}
              image={item.image}
              text={item.text}
              heading={item.heading}
              reverse={index % 2 !== 0}
            />
          ))}
        </Stack>
      </Stack>
    </Flex>
  );
};
export default Info;
