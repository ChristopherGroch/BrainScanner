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
import { toast } from "sonner";

const DropzoneMultiple = ({ onFileChange, onFileRemove }) => {
  const [files, setFiles] = useState([]);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      let error = "";

      const duplicateFiles = acceptedFiles.filter((newFile) =>
        files.some((existingFile) => existingFile.name === newFile.name)
      );

      if (duplicateFiles.length > 0) {
        toast.error(
          "Some files are already added. Please select different files"
        );
        return;
      }

      if (acceptedFiles.length + files.length > 5) {
        toast.error("You can only send five files");
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
        error = "The file is too large. Maximum file size is 5MB";
      }
      if (rejectedFiles.length > 5) {
        error = "You can only send five files";
      }
      if (error) {
        toast.error(error);
      }
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    maxFiles: 5,
    maxSize: 1024 * 5000,
    onDrop,
  });

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  const removeFile = (name) => {
    onFileRemove(name);
    setFiles((files) => files.filter((file) => file.name !== name));
  };

  const removeAll = () => {
    console.log(files);
    // setFiles([]);
  };

  const handleSubmit = async (e) => {
    console.log(files);
  };

  return (
    <VStack align="stretch" spacing={3}>
      {/* Dropzone Box */}
      {files.length < 5 && (
        <Box
          {...getRootProps()}
          border="1px dashed"
          borderColor="gray.300"
          p={4}
          textAlign="center"
          borderRadius="md"
          cursor="pointer"
          _hover={{ borderColor: "blue.500" }}
          fontSize="sm"
        >
          <input {...getInputProps()} />
          <VStack spacing={1}>
            <ArrowUpTrayIcon
              style={{ width: "20px", height: "20px", color: "gray" }}
            />

            {isDragActive ? (
              <Text>Drop the files here...</Text>
            ) : (
              <Text>Drag & drop files, or click to select</Text>
            )}
          </VStack>
        </Box>
      )}

      {/* Files Preview */}
      <HStack
        spacing={3}
        wrap="wrap"
        justify="start"
        align="start"
        gap={3}
        mt={2}
      >
        {files.map((file) => (
          <Box
            key={file.name}
            position="relative"
            width="80px"
            height="80px"
            borderRadius="md"
            overflow="hidden"
            boxShadow="md"
          >
            <Image
              src={file.preview}
              alt={file.name}
              boxSize="80px"
              objectFit="cover"
            />
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
    </VStack>
  );
};

export default DropzoneMultiple;
