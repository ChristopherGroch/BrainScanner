import {
  Image,
  Text,
  Box,
  HStack,
  IconButton,
  Button,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/solid";

const Dropzone = ({onFileChange}) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (acceptedFiles?.length) {
      setError("");
      setFiles((previousFiles) => [
        ...previousFiles,
        ...acceptedFiles.map((file) =>
          Object.assign(file, { preview: URL.createObjectURL(file) })
        ),
      ]);
      onFileChange(acceptedFiles[0])
    }
    if (rejectedFiles.length > 0) {
      setError("The file is too large. Maximum file size is 5MB.");
    }
    if (rejectedFiles.length > 1) {
        setError("You can only send one file.");
      }

  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    maxFiles: 1,
    maxSize: 1024 * 5000,
    onDrop,
  });

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  const removeFile = (name) => {
    onFileChange(null)
    setFiles((files) => files.filter((file) => file.name !== name));
  };

  const removeAll = () => {
    console.log(files);
    // setFiles([]);
  };

  const handleSubmit = async (e) => {
    console.log("SUB");
  };

  return (
    <>
      {error && (
        <Box
          p={4}
          mb={4}
          color="white"
          bg="red.500"
          borderRadius="md"
          textAlign="center"
          fontWeight="bold"
        >
          {error}
        </Box>
      )}
      {files.length === 0 && (
        <Box
          {...getRootProps()}
          border="2px dashed"
          borderColor="gray.300"
          p={8}
          textAlign="center"
          borderRadius="md"
          cursor="pointer"
          _hover={{ borderColor: "blue.500" }}
        >
          <input {...getInputProps()} />
          <VStack spacing={4} align="center">
            <ArrowUpTrayIcon className="w-5 h-5 fill-current" />
            {isDragActive ? (
              <Text>Drop the files here ...</Text>
            ) : (
              <Text>Drag & drop files here, or click to select files</Text>
            )}
          </VStack>
        </Box>
       )} 

      {/* Preview Section */}
      <Box mt={10}>
        <HStack spacing={4} justify="space-between" align="center">
          <Text fontSize="3xl" fontWeight="semibold">
            Preview
          </Text>
          {/* <Button
            onClick={removeAll}
            size="sm"
            colorScheme="red"
            variant="outline"
          >
            Remove all files
          </Button> */}
        </HStack>
        <HStack
          spacing={4}
          wrap="wrap"
          justify="start"
          align="start"
          gap={10}
          mt={4}
        >
          {files.map((file) => (
            <Box
              key={file.name}
              position="relative"
              width="100px"
              height="100px"
              borderRadius="md"
              overflow="hidden"
              boxShadow="md"
            >
              <Image
                src={file.preview}
                alt={file.name}
                width={100}
                height={100}
                // onLoad={() => {
                //   URL.revokeObjectURL(file.preview);
                // }}
                className="object-contain"
              />
              <IconButton
                aria-label="Remove file"
                icon={<XMarkIcon />}
                onClick={() => removeFile(file.name)}
                size="sm"
                colorScheme="red"
                position="absolute"
                top="-5px"
                right="-5px"
                borderRadius="full"
                variant="ghost"
              />
              <Text fontSize="sm" textAlign="center" mt={2} color="gray.500">
                {file.name}
              </Text>
            </Box>
          ))}
        </HStack>
      </Box>
    </>
  );
};

export default Dropzone;
