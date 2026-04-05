import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from './components/login.js';
import AdminDashboard from './admin-ui/admin-dashboard.js'
import DegreeProgram from "./admin-ui/programs.js";
import College from "./admin-ui/colleges.js";
import Discipline from "./admin-ui/disciplines.js";
import Teacher from "./admin-ui/teachers.js";
import TeacherDashboard from "./teacher-ui/teacher-dashboard.js";
import TeacherGrades from "./teacher-ui/teacher-grades.js";
import StudentDashboard from "./student-ui/student-dashboard.js";
import GradeReport from "./student-ui/grade-report.js";


function App(){

  return(
    <BrowserRouter>
    
    <Routes>
      <Route path ="/" element={<Login/>} />
       <Route path="/admin-dashboard" element={<AdminDashboard />}>
          <Route path='programs' element={<DegreeProgram />} />
          <Route path='colleges' element={<College />} />
          <Route path='disciplines' element={<Discipline />} />
          <Route path='teachers' element={<Teacher />} />
          </Route>
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher-grades" element={<TeacherGrades />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/student-report" element={<GradeReport />} />
    </Routes>
    
    
    </BrowserRouter>
  )
}


export default App;

