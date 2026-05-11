import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthLanding from "./pages/AuthLanding";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import AdminHome from "./pages/AdminHome";
import StudentHome from "./pages/StudentHome";
import TeacherHome from "./pages/TeacherHome"
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";


const router = createBrowserRouter([
  { 
    path: "/",
    element: <AuthLanding />
  },
  { 
    path: "/login",
    element: <Login />
  },
  {
    path: "/login/student",
    element: <Login preferredRole="STUDENT" />
  },
  {
    path: "/login/teacher",
    element: <Login preferredRole="PROFESSOR" />
  },
  {
    path: "/login/admin",
    element: <Login preferredRole="ADMIN" />
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
    path: "/forgot-password",
    element: <ForgotPassword />
  },
  {
    path: "/reset-password/:token",
    element: <ResetPassword />
  },
  {
    path: "/adminhome",
    element: <AdminHome />
  },
  {
    path: "/studenthome",
    element: <StudentHome />
  },
  {
    path: "/teacherhome",
    element: <TeacherHome />
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;