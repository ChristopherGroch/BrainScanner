import { VStack, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";

const Menu = () => {
  const nav = useNavigate();
  const { logoutUser,admin } = useAuth();

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

  const moveToSingleImage= () => {
    nav("/singleImage");
  };

  const moveToMultipleImages= () => {
    nav("/multipleImages");
  };

  const moveToChangeData= () => {
    nav("/changePatient");
  };
  const moveToChangeImage= () => {
    nav("/changeImages");
  };

  const moveToChangeUser= () => {
    nav("/changeUsers");
  };

  const handleLogout = async () => {
    await logoutUser();
  };
  return (
    <VStack alignItems="start">
      {/* <Button onClick={moveToHistory} colorScheme="blue">
        Classification History
      </Button>
      <Button onClick={moveToSingleImage} colorScheme="pink">
        Single Image Classification
      </Button>
      <Button onClick={moveToMultipleImages} colorScheme="gray">
        Multiple Images Classification
      </Button>
      <Button onClick={moveToChangepassword} colorScheme="yellow">
        Change Password
      </Button>
      <Button onClick={moveToReportHistory} colorScheme="orange">
        Report History
      </Button>
      <Button onClick={handleLogout} colorScheme="red">
        Logout
      </Button>
      <Button onClick={moveToCreateUser} colorScheme="green" display={admin ? "inline-flex" : "none"} >
        Create User
      </Button>
      <Button onClick={moveToChangeData} colorScheme="green" display={admin ? "inline-flex" : "none"} >
        Move to Change Patient
      </Button>
      <Button onClick={moveToChangeImage} colorScheme="green" display={admin ? "inline-flex" : "none"} >
        Move to Change Images
      </Button>
      <Button onClick={moveToChangeUser} colorScheme="green" display={admin ? "inline-flex" : "none"} >
        Move to Change Users
      </Button> */}
    </VStack>
  );
};
export default Menu;
