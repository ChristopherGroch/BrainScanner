import {
  Image,
  Text,
  Box,
  HStack,
  IconButton,
  Flex,
  Stack,
  Button,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/solid";

const Dropzone = ({ onFileChange, errorFile }) => {
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
      onFileChange(acceptedFiles[0]);
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
    onFileChange(null);
    setFiles((files) => files.filter((file) => file.name !== name));
  };

  return (
    <Stack>
      {files.length === 0 && (
        <Box
          {...getRootProps()}
          border="2px dashed"
          borderColor={error ? "red" : errorFile ? "red" : "gray.300"}
          p={5}
          textAlign="center"
          borderRadius="md"
          cursor="pointer"
          _hover={{ borderColor: "blue.700" }}
        >
          <input {...getInputProps()} />
          <VStack spacing={2} align="center">
            {errorFile && (
              <Text color="red" fontWeight="bold">
                {errorFile}
              </Text>
            )}
            {error && (
              <Text color="red" fontWeight="bold">
                {error}
              </Text>
            )}
            <ArrowUpTrayIcon style={{ width: "30px", height: "30px" }} />
            {isDragActive ? (
              <Text>Drop the files here ...</Text>
            ) : (
              <Text>Drag & drop files here, or click to select files</Text>
            )}
          </VStack>
        </Box>
      )}
      {files.length !== 0 && (
        <Stack
          wrap="wrap"
          justify="center"
          align="center"
          // border="4px solid blue"
        >
          <Box
            key={files[0].name}
            position="relative"
            width="100px"
            height="100px"
            borderRadius="md"
            overflow="hidden"
            boxShadow="md"
          >
            <Image
              src={files[0].preview}
              alt={files[0].name}
              width={100}
              height={100}
            />
            <IconButton
              icon={<XMarkIcon />}
              onClick={() => removeFile(files[0].name)}
              size="sm"
              colorScheme="red"
              position="absolute"
              top="-5px"
              right="-5px"
              borderRadius="full"
              variant="ghost"
            />
          </Box>
        </Stack>
      )}
    </Stack>
  );
};

export default Dropzone;
