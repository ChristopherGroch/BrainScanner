import {
  Image,
  Text,
  Box,
  HStack,
  IconButton,
  Stack,
  Button,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

const DropzoneMultiple = ({ onFileChange, onFileRemove, errorFile }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      let error = "";
      setError('')
      const duplicateFiles = acceptedFiles.filter((newFile) =>
        files.some((existingFile) => existingFile.name === newFile.name)
      );

      if (duplicateFiles.length > 0) {
        // toast.error(
        //   "Some files are already added. Please select different files"
        // );
        setError( "Some files are already added. Please select different files")
        return;
      }

      if (acceptedFiles.length + files.length > 5) {
        // toast.error("You can only send five files");
        setError("You can only send five files")
        return;
      }

      if (acceptedFiles?.length) {
        error = "";
        setFiles((previousFiles) => [
          ...previousFiles,
          ...acceptedFiles.map((file) =>
            Object.assign(file, { preview: URL.createObjectURL(file) })
          ),
        ]);
        onFileChange(acceptedFiles);
      }
      if (rejectedFiles.length > 0) {
        error = "The file is too large or isn't an image file. Maximum file size is 5MB";
      }
      if (rejectedFiles.length > 5) {
        error = "You can only send five files";
      }
      if (error) {
        toast.error(error);
        setError(error)
      }
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/png": [],
    },
    maxFiles: 5,
    maxSize: 1024 * 5000,
    onDrop,
  });

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  const removeFile = (name) => {
    setError('')
    onFileRemove(name);
    setFiles((files) => files.filter((file) => file.name !== name));
  };

  return (
    <Stack>
      <HStack wrap="wrap" justify="center" align="center">
        {files.map((file) => (
          <Box
            key={file.name}
            position="relative"
            width="90px"
            height="90px"
            borderRadius="md"
            overflow="hidden"
            boxShadow="md"
          >
            <Image src={file.preview} alt={file.name} width={90} height={90} />
            <IconButton
              aria-label="Remove file"
              icon={<XMarkIcon />}
              size="xs"
              colorScheme="red"
              position="absolute"
              top="2px"
              right="2px"
              borderRadius="full"
              variant="ghost"
              onClick={() => removeFile(file.name)}
            />
          </Box>
        ))}
      </HStack>
      {files.length < 5 && (
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
              <Text>Drop the files here...</Text>
            ) : (
              <Text>Drag & drop files, or click to select</Text>
            )}
          </VStack>
        </Box>
      )}
    </Stack>
  );
};

export default DropzoneMultiple;
