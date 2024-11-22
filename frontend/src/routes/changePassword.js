import {
    VStack,
    FormControl,
    FormLabel,
    Input,
    Button,
  } from "@chakra-ui/react";
  import { useNavigate } from "react-router-dom";
  import { useState } from "react";
  import { changePassword } from "../endpoints/api";
  
  const ChangePasasword = () => {
    const [new_password, setNewPassword] = useState("");
    const [repeat_password, setRepeat] = useState("");
    const nav = useNavigate();
  
    const moveToMenu = () => {
      nav("/menu");
    };
  
    const handleCreateUser = async () => {
        if (repeat_password === new_password){
            try {
                await changePassword(new_password);
                nav("/login");
              } catch (error) {
                alert(error.response.data.reason);
              }
        } else {
            alert('Pola muszą się zgadzać')
        }
    };
  
    return (
      <VStack>
        <Button onClick={moveToMenu}>Menu</Button>
        <FormControl>
          <FormLabel>New password</FormLabel>
          <Input
            onChange={(e) => setNewPassword(e.target.value)}
            value={new_password}
            type="text"
          />
        </FormControl>
        <FormControl>
          <FormLabel>Repeat new password</FormLabel>
          <Input
            onChange={(e) => setRepeat(e.target.value)}
            value={repeat_password}
            type="text"
          />
        </FormControl>
        <Button onClick={handleCreateUser}>Change Password</Button>
      </VStack>
    );
  };
  export default ChangePasasword;
  