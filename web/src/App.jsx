import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import BooksPage from "./pages/BooksPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MyBorrowingsPage from "./pages/MyBorrowingsPage";
import AdminNovbar from "./components/AdminNovbar";
import AdminUsers from "./pages/AdminUsers";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



function App() {


const [role, setRole] = useState(
  localStorage.getItem("role")
);
const isAdmin = role === "ADMIN";


  return (



    
    <div className="app">
      <Navbar />
{isAdmin && (
  <>
   <AdminNovbar />
  </>)}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/myborrowing" element={<MyBorrowingsPage />} />
        <Route path="/adminusers" element={<AdminUsers />} />
      </Routes>
<ToastContainer
  position="top-right"
  autoClose={3000}
/>

    </div>



  );
}

export default App;