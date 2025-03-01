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
      BrainScanner uses a neural network based on the ResNet50 architecture, 
      which has been specially adapted for brain tumor classification. 
      The model consists of 24 million parameters. 
      On the test set, the algorithm achieved over 95% accuracy and over 94% sensitivity.
    `,
    heading: `About the algorithm`,
  },
  {
    image: doctor,
    text: `
      The application is made available exclusively to physicians specializing in 
      brain tumor classification, who are fully aware that it is designed to support 
      decision-making. Under no circumstances should the system be accessible to patients, 
      as they might misinterpret the algorithm's results. At this stage, the application 
      is primarily intended for collecting well-annotated images to facilitate future development.
    `,
    heading: `Access`,
  },
  {
    image: single,
    text: `
      The system can be used to classify a single patient's image. 
      In this case, the appropriate image should be selected, ensuring 
      it is in PNG format and does not exceed 4 MB in size. It is not possible 
      to assign the same image to multiple patients. However, a single image can be classified multiple times.
    `,
    heading: `Single image test`,
  },
  {
    image: multiple,
    text: `
      The application can also be used to generate reports for multiple patients. 
      In this case, the same rules apply as for single image classification, 
      with the exception that up to five images can be selected for each patient.
    `,
    heading: `Multiple images test`,
  },
  {
    image: images,
    text: `
      Every use of the algorithm on an image can be reviewed on the usage history page. 
      This section displays all classifications performed by a specific doctor. 
      Images can be enlarged by clicking on them and downloaded using the appropriate button. 
      Additionally, images can be labeled directly from the history page. Each image can be labeled only once.
    `,
    heading: `Usage history`,
  },
  {
    image: reports,
    text: `
      It is also possible to review the history of generated reports. 
      This section provides access to all reports along with a list of 
      patients and the number of their images analyzed. Each report can be 
      opened in the browser or downloaded.
    `,
    heading: `Report history`,
  },
  {
    image: errors,
    text: `
      In case of any errors related to patient data, image details, 
      or incorrect labeling, the system administrator should be contacted. 
      The administrator is responsible for correcting such errors directly within the application.
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
                The BrainScanner application is a cutting-edge system designed to
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
