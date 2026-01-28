import React from "react";
import { Outlet } from "react-router-dom";
import { Container } from "react-bootstrap";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  return (
    // KUNCI 1: Wrapper terluar harus fix setinggi layar (100vh) & tidak boleh scroll (overflow: hidden)
    <div className="d-flex bg-light" style={{ height: "100vh", overflow: "hidden" }}>
      
      {/* BAGIAN KIRI: Sidebar */}
      {/* Sidebar diam di tempat, tidak perlu position:fixed karena wrapper luarnya sudah lock */}
      <div className="flex-shrink-0 bg-white border-end">
        <Sidebar />
      </div>

      {/* BAGIAN KANAN: Konten */}
      {/* KUNCI 2: overflow-y: "auto". Artinya cuma area kanan ini yang punya scrollbar sendiri */}
      <div className="flex-grow-1 d-flex flex-column" style={{ overflowY: "auto", position: "relative" }}>
        
        {/* Area Konten Utama */}
        <main className="p-4">
           <Container fluid="lg"> 
               <Outlet /> 
           </Container>
        </main>

        <footer className="mt-auto py-3 text-center text-muted small">
            &copy; 2026 PortScanner 
        </footer>

      </div>

    </div>
  );
}