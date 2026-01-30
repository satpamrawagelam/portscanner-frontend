import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Table, Badge, Spinner, Form, Button, InputGroup } from "react-bootstrap";
import { Activity, ShieldCheck, ShieldAlert, Server, ArrowRight, LayoutDashboard, TrendingUp, BarChart2, AlertTriangle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

import API from "./API";

export default function Dashboard() {
  const navigate = useNavigate();
  
  
  const [overview, setOverview] = useState({ total: 0, open: 0, closed: 0 });
  const [branches, setBranches] = useState([]);
  const [trend, setTrend] = useState([]);
  const [risks, setRisks] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [riskPage, setRiskPage] = useState(1);
  const [branchPage, setBranchPage] = useState(1);
  const itemsPerPage = 10;

  const [branchSearch, setBranchSearch] = useState("");


  const filteredBranches = branches.filter(b => 
      b.branch_name.toLowerCase().includes(branchSearch.toLowerCase())
  );
  const fetchData = () => {
    const trendUrl = `${API}/Dashboard/GetGlobalTrend?month=${selectedMonth}&year=${selectedYear}`;

    Promise.all([
      fetch(`${API}/Dashboard/GetOverview`).then((res) => res.json()),
      fetch(`${API}/Dashboard/GetBranchHealth`).then((res) => res.json()),
      fetch(trendUrl).then((res) => res.json()), 
      fetch(`${API}/Dashboard/GetRiskDistribution`).then((res) => res.json()), 
    ])
      .then(([overviewData, branchData, trendData, riskData]) => {
        setOverview(overviewData);
        setBranches(branchData);
        setTrend(trendData);
        
        const sortedRisks = riskData.sort((a, b) => {
            if (b.highRisk !== a.highRisk) return b.highRisk - a.highRisk;
            if (b.mediumRisk !== a.mediumRisk) return b.mediumRisk - a.mediumRisk;
            return (b.highRisk + b.mediumRisk + b.lowRisk) - (a.highRisk + a.mediumRisk + a.lowRisk);
        });
        setRisks(sortedRisks);
      })
      .catch((err) => console.error("Gagal load dashboard", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]); 

  const totalRiskPages = Math.ceil(risks.length / itemsPerPage);
  const currentRiskData = risks.slice((riskPage - 1) * itemsPerPage, riskPage * itemsPerPage);

  const renderPagination = (currentPage, setPage, totalPages) => {
      if (totalPages <= 1) return null;

      let pages = [];
      const maxButtons = 5;

      if (totalPages <= maxButtons) {
          for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
          pages.push(1);
          if (currentPage > 3) pages.push("...");
          let start = Math.max(2, currentPage - 1);
          let end = Math.min(totalPages - 1, currentPage + 1);
          if (currentPage <= 3) end = Math.min(totalPages - 1, 4);
          if (currentPage >= totalPages - 2) start = Math.max(2, totalPages - 3);
          for (let i = start; i <= end; i++) pages.push(i);
          if (currentPage < totalPages - 2) pages.push("...");
          pages.push(totalPages);
      }

      return (
          <div className="d-flex align-items-center gap-1">
              <Button variant="outline-secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2"><ChevronLeft size={16}/></Button>
              {pages.map((p, idx) => (
                  <Button key={idx} variant={p === currentPage ? "primary" : "outline-secondary"} size="sm" className="px-3 fw-bold" onClick={() => typeof p === 'number' && setPage(p)} disabled={p === "..."} style={{minWidth: '35px'}}>{p}</Button>
              ))}
              <Button variant="outline-secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2"><ChevronRight size={16}/></Button>
          </div>
      );
  };

  const totalBranchPages = Math.ceil(filteredBranches.length / itemsPerPage);
  const currentBranchData = filteredBranches.slice((branchPage - 1) * itemsPerPage, branchPage * itemsPerPage);

  useEffect(() => {
    setBranchPage(1);
  }, [branchSearch]);

  const areaData = trend.map(t => {
      const date = new Date(t.scanDate);
      return {
          date: date.getDate().toString(), 
          count: t.totalOpenPorts 
      };
  });

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex align-items-center gap-2 mb-4">
         <div className="bg-primary bg-opacity-10 p-2 rounded">
            <LayoutDashboard size={24} className="text-primary"/>
         </div>
         <div>
            <h3 className="fw-bold text-dark mb-0">Dashboard Overview</h3>
            <p className="text-muted mb-0 small">Monitoring status keamanan jaringan realtime.</p>
         </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Memuat data analitik...</p>
        </div>
      ) : (
        <>
          <Row className="g-4 mb-4">
            <Col md={4}>
              <StatusCard title="TOTAL OPEN PORTS" value={overview.open} subtitle="Potensi celah keamanan" color="danger" icon={<ShieldAlert size={32} />} />
            </Col>
            <Col md={4}>
              <StatusCard title="TOTAL CLOSED PORTS" value={overview.closed} subtitle="Port aman terkunci" color="success" icon={<ShieldCheck size={32} />} />
            </Col>
            <Col md={4}>
              <StatusCard title="TOTAL SCANNED" value={overview.total} subtitle="Total aktivitas scan" color="primary" icon={<Activity size={32} />} />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col xs={12}>
                <Card className="card-enterprise border-0 shadow-sm h-100">
                    <Card.Header className="bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                            <TrendingUp size={18} className="text-secondary"/>
                            <h6 className="mb-0 fw-bold text-dark">Tren Keamanan Bulanan</h6>
                        </div>
                        <div className="d-flex gap-2">
                            <Form.Select size="sm" style={{width: '120px', fontWeight: '600'}} value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                                <option value="1">Januari</option>
                                <option value="2">Februari</option>
                                <option value="3">Maret</option>
                                <option value="4">April</option>
                                <option value="5">Mei</option>
                                <option value="6">Juni</option>
                                <option value="7">Juli</option>
                                <option value="8">Agustus</option>
                                <option value="9">September</option>
                                <option value="10">Oktober</option>
                                <option value="11">November</option>
                                <option value="12">Desember</option>
                            </Form.Select>
                            <Form.Select size="sm" style={{width: '90px', fontWeight: '600'}} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </Form.Select>
                        </div>
                    </Card.Header>
                    <Card.Body style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#dc3545" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#dc3545" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{fontSize: 11}} stroke="#6c757d" interval={0} />
                                <YAxis stroke="#6c757d"/>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef"/>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="count" name="Open Ports" stroke="#dc3545" fillOpacity={1} fill="url(#colorOpen)" connectNulls={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card.Body>
                </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col xs={12}>
                <Card className="card-enterprise border-0 shadow-sm h-100">
                     <Card.Header className="bg-white py-3 border-bottom d-flex align-items-center gap-2">
                        <AlertTriangle size={18} className="text-secondary"/>
                        <div>
                            <h6 className="mb-0 fw-bold text-dark">Komposisi Risiko per Branch (High/Medium/Low)</h6>
                            <small className="text-muted" style={{fontSize: '11px'}}>
                                Menampilkan {risks.length > 0 ? (riskPage - 1) * itemsPerPage + 1 : 0} - {Math.min(riskPage * itemsPerPage, risks.length)} dari {risks.length} cabang
                            </small>
                        </div>
                    </Card.Header>

                    <Card.Body style={{ height: '450px' }}>
                        {risks.length === 0 ? (
                            <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                                Tidak ada data risiko
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={currentRiskData}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                                    <XAxis dataKey="branchName" tick={{fontSize: 11, fontWeight: '500'}} stroke="#6c757d" interval={0} angle={-45} textAnchor="end" height={80}/>
                                    <YAxis stroke="#6c757d" />
                                    <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="top" height={36}/>
                                    <Bar dataKey="highRisk" name="High Risk" stackId="a" fill="#dc3545" barSize={40} cursor="pointer" onClick={(data) => { if (data && data.branchId) navigate(`/branch/${data.branchId}`); }}/>
                                    <Bar dataKey="mediumRisk" name="Medium Risk" stackId="a" fill="#ffc107" barSize={40} cursor="pointer" onClick={(data) => { if (data && data.branchId) navigate(`/branch/${data.branchId}`); }}/>
                                    <Bar dataKey="lowRisk" name="Low Risk" stackId="a" fill="#0dcaf0" radius={[4, 4, 0, 0]} barSize={40} cursor="pointer" onClick={(data) => { if (data && data.branchId) navigate(`/branch/${data.branchId}`); }}/>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Card.Body>
                    <Card.Footer className="bg-white border-top-0 py-3 d-flex justify-content-end">
                        {renderPagination(riskPage, setRiskPage, totalRiskPages)}
                    </Card.Footer>
                </Card>
            </Col>
          </Row>

        <Row>
            <Col xs={12}>
                <Card className="card-enterprise border-0 shadow-sm">
                    <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2 text-secondary fw-bold">
                            <Server size={18} /> 
                            <div>
                                <div className="mb-0">Detail Data Kesehatan Cabang</div>
                                <small className="text-muted fw-normal" style={{fontSize: '11px'}}>
                                    Halaman {branchPage} dari {totalBranchPages || 1}
                                </small>
                            </div>
                        </div>

                        <div style={{ maxWidth: '250px' }}>
                            <InputGroup size="sm">
                                <InputGroup.Text className="bg-light border-end-0">
                                    <Search size={16} className="text-muted"/>
                                </InputGroup.Text>
                                <Form.Control 
                                    placeholder="Cari Nama Branch..."
                                    className="border-start-0 bg-light"
                                    value={branchSearch}
                                    onChange={(e) => setBranchSearch(e.target.value)}
                                />
                            </InputGroup>
                        </div>

                    </Card.Header>

                    <Card.Body className="p-0">
                        <Table hover responsive className="mb-0 align-middle">
                            <tbody>
                                {currentBranchData.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-4 text-muted">Data tidak ditemukan</td></tr>
                                ) : (
                                    currentBranchData.map((b) => (
                                        <tr key={b.branch_id} style={{cursor: 'pointer'}} onClick={() => navigate(`/branch/${b.branch_id}`)}>
                                            <td className="ps-4 fw-bold text-dark">{b.branch_name}</td>
                                            <td className="ps-4 fw-bold text-dark">{b.branch_cidr}</td>
                                            <td className="text-center"><Badge bg="light" text="dark" className="border px-3">{b.totalHost} IP</Badge></td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger">{b.totalPortOpen} Open</Badge>
                                                    <Badge bg="success" className="bg-opacity-10 text-success border border-success">{b.totalPortClosed} Closed</Badge>
                                                </div>
                                            </td>
                                            <td className="text-end pe-4 text-muted"><ArrowRight size={18} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                    
                    <Card.Footer className="bg-white border-top-0 py-3 d-flex justify-content-end">
                        {renderPagination(branchPage, setBranchPage, totalBranchPages)}
                    </Card.Footer>
                </Card>
            </Col>
        </Row>
        </>
      )}
    </div>
  );
}

function StatusCard({ title, value, subtitle, color, icon }) {
  const bgSoft = `bg-${color} bg-opacity-10`; 
  const textColor = `text-${color}`;
  const borderColor = `border-${color}`;
  return (
    <Card className={`border-0 shadow-sm h-100 position-relative overflow-hidden`}>
       <div className={`position-absolute top-0 start-0 bottom-0 ${borderColor}`} style={{borderLeftWidth: '5px', borderLeftStyle: 'solid'}}></div>
       <Card.Body className="d-flex align-items-center p-4">
            <div className={`p-3 rounded-circle me-4 ${bgSoft} ${textColor}`}>{icon}</div>
            <div>
                <h6 className="text-muted small fw-bold mb-1">{title}</h6>
                <h2 className={`fw-bold mb-0 ${textColor}`}>{value}</h2>
                <small className="text-muted">{subtitle}</small>
            </div>
       </Card.Body>
    </Card>
  );
}