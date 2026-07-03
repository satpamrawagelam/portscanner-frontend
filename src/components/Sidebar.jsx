import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Collapse } from "react-bootstrap";
import { 
  LayoutDashboard, 
  Radar, 
  Server, 
  Settings, 
  ShieldCheck, 
  FileText,
  ChevronDown,
  ChevronRight,
  Activity,
  AlertTriangle,
  TrendingUp,
  LogOut,
  User
} from "lucide-react";
import Swal from "sweetalert2";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: "Logout",
      text: "Are you sure you want to end your session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Logout",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        navigate("/login");
      }
    });
  };
  const [dashboardOpen, setDashboardOpen] = useState(location.pathname.startsWith('/dashboard') || location.pathname === '/');

  const isDashboardActive = location.pathname.startsWith('/dashboard') || location.pathname === '/';

  const menus = [
    {
      title: "MASTER DATA",
      items: [
        { name: "Master Branch", path: "/masterbranch", icon: <ShieldCheck size={20} /> }, 
        { name: "Master Group & Port", path: "/mastergroup", icon: <Server size={20} /> },
      ]
    },
    {
      title: "REPORT",
      items: [
        { name: "Report", path: "/report", icon: <FileText size={20} /> },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Configuration", path: "/setting", icon: <Settings size={20} /> },
        { name: "Master Account", path: "/masteraccount", icon: <User size={20} /> },
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
        <div className="mb-4">
          <div className="px-4 mb-2">
            <small className="text-muted fw-bold" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
              MAIN MENU
            </small>
          </div>
          <ul className="list-unstyled mb-0">
            <li>
              <div className={`d-flex align-items-center justify-content-between px-4 py-3 text-decoration-none transition-all border-start border-4 ${
                  isDashboardActive 
                    ? "bg-primary bg-opacity-10 text-primary border-primary fw-bold" 
                    : "text-secondary border-transparent hover-bg-light"
                }`}
                style={{ cursor: "pointer", transition: "all 0.2s" }}
              >
                <NavLink to="/dashboard" className="d-flex align-items-center gap-3 flex-grow-1 text-decoration-none text-inherit" style={{ color: 'inherit' }}>
                  <div className={isDashboardActive ? "text-primary" : "text-secondary opacity-75"}>
                    <LayoutDashboard size={20} />
                  </div>
                  <span>Dashboard</span>
                </NavLink>
                <div onClick={() => setDashboardOpen(!dashboardOpen)} className="p-1">
                  {dashboardOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </div>
              <Collapse in={dashboardOpen}>
                <div>
                  <ul className="list-unstyled mb-0 bg-light bg-opacity-50">
                    <li>
                      <NavLink
                        to="/dashboard/overview"
                        className={({isActive}) => `d-flex align-items-center gap-3 px-5 py-2 text-decoration-none transition-all ${
                          isActive ? "text-primary fw-bold" : "text-secondary hover-text-primary"
                        }`}
                      >
                        <Activity size={16} /> <span style={{fontSize: "14px"}}>Overview</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/dashboard/severity"
                        className={({isActive}) => `d-flex align-items-center gap-3 px-5 py-2 text-decoration-none transition-all ${
                          isActive ? "text-primary fw-bold" : "text-secondary hover-text-primary"
                        }`}
                      >
                        <AlertTriangle size={16} /> <span style={{fontSize: "14px"}}>Severity Bar</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/dashboard/trend"
                        className={({isActive}) => `d-flex align-items-center gap-3 px-5 py-2 text-decoration-none transition-all ${
                          isActive ? "text-primary fw-bold" : "text-secondary hover-text-primary"
                        }`}
                      >
                        <TrendingUp size={16} /> <span style={{fontSize: "14px"}}>Trend</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/dashboard/branch-health"
                        className={({isActive}) => `d-flex align-items-center gap-3 px-5 py-2 text-decoration-none transition-all ${
                          isActive ? "text-primary fw-bold" : "text-secondary hover-text-primary"
                        }`}
                      >
                        <Server size={16} /> <span style={{fontSize: "14px"}}>Branch Health</span>
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </Collapse>
            </li>
            <li>
              <NavLink
                to="/scan"
                className={({isActive}) => `d-flex align-items-center gap-3 px-4 py-3 text-decoration-none transition-all border-start border-4 ${
                  isActive 
                    ? "bg-primary bg-opacity-10 text-primary border-primary fw-bold" 
                    : "text-secondary border-transparent hover-bg-light"
                }`}
                style={{ transition: "all 0.2s" }}
              >
                <div className={location.pathname === '/scan' ? "text-primary" : "text-secondary opacity-75"}>
                  <Radar size={20} />
                </div>
                <span>Port Scanner</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/scanhistory"
                className={({isActive}) => `d-flex align-items-center gap-3 px-4 py-3 text-decoration-none transition-all border-start border-4 ${
                  isActive 
                    ? "bg-primary bg-opacity-10 text-primary border-primary fw-bold" 
                    : "text-secondary border-transparent hover-bg-light"
                }`}
                style={{ transition: "all 0.2s" }}
              >
                <div className={location.pathname === '/scanhistory' ? "text-primary" : "text-secondary opacity-75"}>
                  <FileText size={20} />
                </div>
                <span>Scan History</span>
              </NavLink>
            </li>
          </ul>
        </div>

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

      <div className="p-3 border-top bg-light d-flex flex-column gap-2">
        <button 
          onClick={handleLogout}
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-bold"
          style={{ borderRadius: '8px', fontSize: '14px' }}
        >
          <LogOut size={16} /> Logout
        </button>
        <div className="text-center">
          <small className="text-muted" style={{fontSize: '10px'}}>
              v1.0 &copy; 2026 Security Ops
          </small>
        </div>
      </div>
    </div>
  );
}