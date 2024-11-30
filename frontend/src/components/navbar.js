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
  useColorModeValue,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Link as RouterLink, NavLink } from "react-router-dom";
import { getUserName } from "../endpoints/api";
import { useEffect, useState } from "react";
import { useAuth } from "../context/auth";

const Navbar = () => {
  const { isOpen, onToggle } = useDisclosure();
  const { logoutUser, userName, admin } = useAuth();
  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <Box
      bg={useColorModeValue("blue.900", "gray.800")}
      color="white"
      position="sticky"
      top="0"
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
          fontSize="1.5rem"
          fontWeight="bold"
          textDecoration="none"
          color="white"
        >
          Website
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
              borderRadius="md"
              _hover={{ bg: "blue.700" }}
              _activeLink={{ bg: "blue.600" }}
            >
              Usage History
            </ChakraLink>
          </Box>
          <Box as="li">
            <ChakraLink
              as={NavLink}
              to="/reportHistory"
              px="3"
              py="2"
              borderRadius="md"
              _hover={{ bg: "blue.700" }}
              _activeLink={{ bg: "blue.600" }}
            >
              Report History
            </ChakraLink>
          </Box>
          <Box as="li">
            <ChakraLink
              as={NavLink}
              to="/singleImage"
              px="3"
              py="2"
              borderRadius="md"
              _hover={{ bg: "blue.700" }}
              _activeLink={{ bg: "blue.600" }}
            >
              Single Image
            </ChakraLink>
          </Box>
          <Box as="li">
            <ChakraLink
              as={NavLink}
              to="/multipleImages"
              px="3"
              py="2"
              borderRadius="md"
              _hover={{ bg: "blue.700" }}
              _activeLink={{ bg: "blue.600" }}
            >
              Multiple Images
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
                borderRadius="md"
                _hover={{ bg: "blue.700" }}
              >
                {userName}
                <ChevronDownIcon />
              </MenuButton>
              <MenuList
                bg={useColorModeValue("blue.900", "gray.700")}
                color="white"
                borderColor="gray.600"
              >
                <MenuItem
                  as={RouterLink}
                  to="/changePassword"
                  bg={"blue.900"}
                  _hover={{ bg: "blue.700" }}
                >
                  Change Password
                </MenuItem>
                <MenuItem
                  as={RouterLink}
                  to="/createUser"
                  bg={"blue.900"}
                  _hover={{ bg: "blue.700" }}
                  display={admin ? "block" : "none"}
                >
                  Create User
                </MenuItem>
                <MenuItem
                  as={RouterLink}
                  to="/changeusers"
                  bg={"blue.900"}
                  _hover={{ bg: "blue.700" }}
                  display={admin ? "block" : "none"}
                >
                  Change User
                </MenuItem>
                <MenuItem
                  as={RouterLink}
                  to="/changeImages"
                  bg={"blue.900"}
                  _hover={{ bg: "blue.700" }}
                  display={admin ? "block" : "none"}
                >
                  Change Images
                </MenuItem>
                <MenuItem
                  as={RouterLink}
                  to="/changePatient"
                  bg={"blue.900"}
                  _hover={{ bg: "blue.700" }}
                  display={admin ? "block" : "none"}
                >
                  Change Pateints
                </MenuItem>
                <MenuItem
                  onClick={handleLogout}
                  _hover={{ bg: "blue.700" }}
                  bg={"blue.900"}
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
