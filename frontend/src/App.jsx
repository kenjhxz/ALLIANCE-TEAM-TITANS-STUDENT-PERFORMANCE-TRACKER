import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import AdminHome from "./pages/AdminHome";
import StudentHome from "./pages/StudentHome"


const router = createBrowserRouter([
  { 
    path: "/login",
    element: <Login />
  },
  {
    path: "/signup",
    element: <SignUp />
  },
  {
    path: "/verify-email/:token",
    element: <VerifyEmail />
  },
  {
    path: "adminhome",
    element: <AdminHome />
  },
  {
    path: "studenthome",
    element: <StudentHome />
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;