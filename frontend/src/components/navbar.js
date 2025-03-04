import {
  Box,
  Flex,
  Link as ChakraLink,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Link as RouterLink, NavLink } from "react-router-dom";
import { useAuth } from "../context/auth";

const Navbar = () => {
  const { isOpen, onToggle } = useDisclosure();
  const { logoutUser, userName, admin } = useAuth();
  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <Box
      bg="#507DBC"
      color="white"
      position="sticky"
      top="0"
      boxShadow="md"
      zIndex="1000"
    >
      <Flex
        as="nav"
        maxW="100%"
        mx="auto"
        px="4"
        py="2"
        align="center"
        justify="space-between"
      >
        <ChakraLink
          as={RouterLink}
          to="/"
          fontSize="1.7rem"
          fontWeight="bold"
          textDecoration="none"
          color="white"
          ml={5}
        >
          BrainScanner
        </ChakraLink>

        <IconButton
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label="Toggle Navigation"
          display={{ base: "block", md: "none" }}
          onClick={onToggle}
          bg="transparent"
          _hover={{ bg: "gray.700" }}
          color="white"
        />

        <Flex
          as="ul"
          listStyleType="none"
          display={{ base: isOpen ? "flex" : "none", md: "flex" }}
          flexDirection={{ base: "column", md: "row" }}
          alignItems={{ base: "center", md: "center" }}
          gap="4"
        >
          <Box as="li">
            <ChakraLink
              as={NavLink}
              to="/history"
              px="3"
              py="2"
              fontSize="1.2rem"
              borderRadius="md"
              _hover={{ bg: "blue.700" }}
              _activeLink={{ bg: "blue.700"}}
            >
              Usage history
            </ChakraLink>
          </Box>
          <Box as="li">
            <ChakraLink
              as={NavLink}
              to="/reportHistory"
              px="3"
              py="2"
              fontSize="1.2rem"
              borderRadius="md"
              _hover={{ bg: "blue.700" }}
              _activeLink={{ bg: "blue.700" }}
            >
              Report history
            </ChakraLink>
          </Box>
          <Box as="li">
            <ChakraLink
              as={NavLink}
              to="/singleImage"
              px="3"
              py="2"
              fontSize="1.2rem"
              borderRadius="md"
              _hover={{ bg: "blue.700" }}
              _activeLink={{ bg: "blue.700" }}
            >
              Single image
            </ChakraLink>
          </Box>
          <Box as="li">
            <ChakraLink
              as={NavLink}
              to="/multipleImages"
              px="3"
              py="2"
              fontSize="1.2rem"
              borderRadius="md"
              _hover={{ bg: "blue.700" }}
              _activeLink={{ bg: "blue.700" }}
            >
              Multiple images
            </ChakraLink>
          </Box>
          <Box as="li">
            <Menu>
              <MenuButton
                display="flex"
                alignItems="center"
                gap="2"
                px="3"
                py="2"
                fontSize="1.2rem"
                borderRadius="md"
                _hover={{ bg: "blue.700" }}
                mr={5}
              >
                {userName}
                <ChevronDownIcon />
              </MenuButton>
              <MenuList
                bg="#507DBC"
                color="white"
                borderColor="gray.700"
              >
                <MenuItem
                  as={RouterLink}
                  to="/changePassword"
                  fontSize="1.2rem"
                  bg="#507DBC"
                  _hover={{ bg: "blue.700" }}
                >
                  Password change
                </MenuItem>
                <MenuItem
                  as={RouterLink}
                  to="/createUser"
                  bg="#507DBC"
                  fontSize="1.2rem"
                  _hover={{ bg: "blue.700" }}
                  display={admin ? "block" : "none"}
                >
                  User creation
                </MenuItem>
                <MenuItem
                  as={RouterLink}
                  to="/changeusers"
                  fontSize="1.2rem"
                  bg="#507DBC"
                  _hover={{ bg: "blue.700" }}
                  display={admin ? "block" : "none"}
                >
                  User edit
                </MenuItem>
                <MenuItem
                  as={RouterLink}
                  to="/changeImages"
                  fontSize="1.2rem"
                  bg="#507DBC"
                  _hover={{ bg: "blue.700" }}
                  display={admin ? "block" : "none"}
                >
                  Image edit
                </MenuItem>
                <MenuItem
                  as={RouterLink}
                  to="/changePatient"
                  fontSize="1.2rem"
                  bg="#507DBC"
                  _hover={{ bg: "blue.700" }}
                  display={admin ? "block" : "none"}
                >
                  Patient edit
                </MenuItem>
                <MenuItem
                  as={RouterLink}
                  to="/info"
                  fontSize="1.2rem"
                  bg="#507DBC"
                  _hover={{ bg: "blue.700" }}
                >
                  More information
                </MenuItem>
                <MenuItem
                  onClick={handleLogout}
                  _hover= {{ bg: "blue.700" }}
                  fontSize="1.2rem"
                  bg="#507DBC"
                >
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;
