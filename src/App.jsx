import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';

import Dashboard from './pages/Dashboard';
import PortScan from './pages/PortScan';
import MasterGroup from './pages/MasterGroup';
import MasterPort from './pages/MasterPort';
import BranchDetail from './pages/BranchDetail';
import MasterBranch from './pages/MasterBranch';
import Setting from './pages/Setting';
import ScanHistory from './pages/ScanHistory';

import "react-toastify/dist/ReactToastify.css"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="scan" element={<PortScan />} />
          <Route path="mastergroup" element={<MasterGroup />} />
          <Route path="master/port/:id" element={<MasterPort />} />
          <Route path="branch/:id" element={<BranchDetail />} />
          <Route path="masterbranch" element={<MasterBranch />} />
          <Route path="setting" element={<Setting />} />
          <Route path="scanhistory" element={<ScanHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;