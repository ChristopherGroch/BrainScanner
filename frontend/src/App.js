import Login from "./routes/login";
import HistoryMenu from "./routes/history";
import Menu from "./routes/menu";
import CreateUser from "./routes/createUser";
import NotFound from "./routes/nothing";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "./context/auth";
import ProtectedRoute from "./routes/protected";
import AdminedRoute from "./routes/admined";

function App() {
  return (
    <ChakraProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route
              path="/menu"
              element={
                <ProtectedRoute>
                  <Menu />
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/createUser"
              element={
                <ProtectedRoute>
                  <AdminedRoute>
                    <CreateUser />
                  </AdminedRoute>
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryMenu />
                </ProtectedRoute>
              }
            ></Route>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
