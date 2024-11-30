import Login from "./routes/login";
import HistoryMenu from "./routes/history";
import Menu from "./routes/menu";
import CreateUser from "./routes/createUser";
import NotFound from "./routes/nothing";
import ChangePasasword from "./routes/changePassword";
import ReportHistory from "./routes/reportsHistory";
import SingleImage from "./routes/singleImage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "./context/auth";
import ProtectedRoute from "./routes/protected";
import AdminedRoute from "./routes/admined";
import { Toaster } from "sonner";
import MultipleImagesList from "./routes/listMultipleImages";
import ChangePatientData from "./routes/changePatientData";
import ChangeImagesData from "./routes/changeImage";
import ChangeUserData from "./routes/changeUserData";
import Navbar from "./components/navbar";
import { Outlet } from "react-router-dom";

function App() {
  return (
    <ChakraProvider>
      <Toaster richColors closeButton position="top-center" />
      <Router>
        <AuthProvider>
          <Routes>
            <Route
              element={
                <>
                  <Navbar />
                  <Outlet />
                </>
              }
            >
              <Route
                path="/menu"
                element={
                  <ProtectedRoute>
                    <Menu />
                  </ProtectedRoute>
                }
              ></Route>
              <Route
                path="/multipleImages"
                element={
                  <ProtectedRoute>
                    <MultipleImagesList />
                  </ProtectedRoute>
                }
              ></Route>
              <Route
                path="/singleImage"
                element={
                  <ProtectedRoute>
                    <SingleImage />
                  </ProtectedRoute>
                }
              ></Route>
              <Route
                path="/reportHistory"
                element={
                  <ProtectedRoute>
                    <ReportHistory />
                  </ProtectedRoute>
                }
              ></Route>
              <Route
                path="/changePassword"
                element={
                  <ProtectedRoute>
                    <ChangePasasword />
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
                path="/changePatient"
                element={
                  <ProtectedRoute>
                    <AdminedRoute>
                      <ChangePatientData />
                    </AdminedRoute>
                  </ProtectedRoute>
                }
              ></Route>
              <Route
                path="/changeImages"
                element={
                  <ProtectedRoute>
                    <AdminedRoute>
                      <ChangeImagesData />
                    </AdminedRoute>
                  </ProtectedRoute>
                }
              ></Route>
              <Route
                path="/changeUsers"
                element={
                  <ProtectedRoute>
                    <AdminedRoute>
                      <ChangeUserData />
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
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
