import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Radar, 
  Server, 
  Settings, 
  ShieldCheck, 
  Menu,
  FileText
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const menus = [
    { 
      title: "MAIN MENU",
      items: [
        { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
        { name: "Port Scanner", path: "/scan", icon: <Radar size={20} /> },
        { name: "Scan History", path: "/scanhistory", icon: <FileText size={20} /> },
      ]
    },
    {
      title: "MASTER DATA",
      items: [
        { name: "Master Branch", path: "/masterbranch", icon: <ShieldCheck size={20} /> }, // Sesuaikan path jika beda
        { name: "Master Group & Port", path: "/mastergroup", icon: <Server size={20} /> },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Configuration", path: "/setting", icon: <Settings size={20} /> },
      ]
    }
  ];

  return (
    <div className="bg-white border-end h-100 d-flex flex-column" style={{ width: "260px", minHeight: "100vh" }}>
      <div className="p-4 d-flex align-items-center gap-2 border-bottom" style={{ height: "70px" }}>
        <div className="bg-primary text-white p-1 rounded">
            <Radar size={24} strokeWidth={3} />
        </div>
        <div>
            <h5 className="mb-0 fw-bold text-primary tracking-tight">EEC</h5>
            <small className="text-muted" style={{ fontSize: '10px', letterSpacing: '1px' }}>External Exposure Checker</small>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto py-3">
        {menus.map((section, index) => (
          <div key={index} className="mb-4">
            <div className="px-4 mb-2">
              <small className="text-muted fw-bold" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                {section.title}
              </small>
            </div>
            
            <ul className="list-unstyled mb-0">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={`d-flex align-items-center gap-3 px-4 py-3 text-decoration-none transition-all border-start border-4 ${
                        isActive 
                          ? "bg-primary bg-opacity-10 text-primary border-primary fw-bold" 
                          : "text-secondary border-transparent hover-bg-light"
                      }`}
                      style={{ transition: "all 0.2s" }}
                    >
                      <div className={isActive ? "text-primary" : "text-secondary opacity-75"}>
                        {item.icon}
                      </div>
                      
                      <span>{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-3 border-top bg-light text-center">
        <small className="text-muted" style={{fontSize: '10px'}}>
            v1.0 &copy; 2026 Security Ops
        </small>
      </div>
    </div>
  );
}