import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';

import Dashboard from './pages/Dashboard';
import DashboardOverview from './pages/DashboardOverview';
import DashboardSeverity from './pages/DashboardSeverity';
import DashboardTrend from './pages/DashboardTrend';
import DashboardBranchHealth from './pages/DashboardBranchHealth';
import PortScan from './pages/PortScan';
import MasterGroup from './pages/MasterGroup';
import MasterPort from './pages/MasterPort';
import BranchDetail from './pages/BranchDetail';
import MasterBranch from './pages/MasterBranch';
import Setting from './pages/Setting';
import ScanHistory from './pages/ScanHistory';
import Report from './pages/Report';
import VulnerableHosts from './pages/VulnerableHosts';
import Login from './pages/Login';
import MasterAccount from './pages/MasterAccount';

import "react-toastify/dist/ReactToastify.css"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/overview" element={<DashboardOverview />} />
          <Route path="dashboard/severity" element={<DashboardSeverity />} />
          <Route path="dashboard/trend" element={<DashboardTrend />} />
          <Route path="dashboard/branch-health" element={<DashboardBranchHealth />} />
          <Route path="scan" element={<PortScan />} />
          <Route path="mastergroup" element={<MasterGroup />} />
          <Route path="master/port/:id" element={<MasterPort />} />
          <Route path="branch/:id" element={<BranchDetail />} />
          <Route path="vulnerable-hosts" element={<VulnerableHosts />} />
          <Route path="masterbranch" element={<MasterBranch />} />
          <Route path="masteraccount" element={<MasterAccount />} />
          <Route path="setting" element={<Setting />} />
          <Route path="scanhistory" element={<ScanHistory />} />
          <Route path="report" element={<Report />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;