import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createUser,refresh } from "../endpoints/api";

const CreateUser = () => {
  const [username, setUsername] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [PESEL, setPESEL] = useState("");
  const nav = useNavigate();

  const moveToMenu = () => {
    nav("/menu");
  };

  const handleCreateUser = async () => {
    // try {
    //   // console.log(username);
    //   // console.log(first_name);
    //   // console.log(last_name);
    //   // console.log(email);
    //   // console.log(PESEL);
    //   await createUser(username, first_name, last_name, email, PESEL);
    // } catch (error) {
    //   alert(error.response.data.reason);
    // }

    try {
      await createUser(username, first_name, last_name, email, PESEL);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          await refresh();
          await createUser(username, first_name, last_name, email, PESEL);
        } catch (refreshError) {
          console.error("Nie udało się odświeżyć tokena", refreshError);
          alert("Twoja sesja wygasła. Zaloguj się ponownie.");
          nav("/login");
        }
      } else {
        alert(error.response?.data?.reason || "Wystąpił błąd.");
      }
    }

  };

  return (
    <VStack>
      <Button onClick={moveToMenu}>Menu</Button>
      <FormControl>
        <FormLabel>Username</FormLabel>
        <Input
          onChange={(e) => setUsername(e.target.value)}
          value={username}
          type="text"
        />
      </FormControl>
      <FormControl>
        <FormLabel>First Name</FormLabel>
        <Input
          onChange={(e) => setFirstName(e.target.value)}
          value={first_name}
          type="text"
        />
      </FormControl>
      <FormControl>
        <FormLabel>Last Name</FormLabel>
        <Input
          onChange={(e) => setLastName(e.target.value)}
          value={last_name}
          type="text"
        />
      </FormControl>
      <FormControl>
        <FormLabel>Email</FormLabel>
        <Input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
        />
      </FormControl>
      <FormControl>
        <FormLabel>PESEL</FormLabel>
        <Input
          onChange={(e) => setPESEL(e.target.value)}
          value={PESEL}
          type="text"
        />
      </FormControl>
      <Button onClick={handleCreateUser}>Create User</Button>
    </VStack>
  );
};
export default CreateUser;
