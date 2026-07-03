import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="d-flex bg-light" style={{ height: "100vh", overflow: "hidden" }}>
      
      <div className="flex-shrink-0 bg-white border-end">
        <Sidebar />
      </div>

      <div className="flex-grow-1 d-flex flex-column" style={{ overflowY: "auto", position: "relative" }}>
        
        <main className="p-4">
           <Container fluid="lg"> 
               <Outlet /> 
           </Container>
        </main>

        <footer className="mt-auto py-3 text-center text-muted small">
            &copy;MI23066 | External Exposure Checker 
        </footer>

      </div>

    </div>
  );
}