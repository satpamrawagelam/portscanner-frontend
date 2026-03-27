import React, { useEffect, useState, useRef } from "react";
import { Card, Form, Button, Row, Col, ProgressBar, Badge, Dropdown, Tabs, Tab, Table, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Play, Search, Loader2, Globe, X, ChevronLeft, ChevronRight, CheckCircle, Clock, Calendar, Trash2, Plus, Eye, Edit, Layers, AlertCircle, Server, Radar, XCircle, History, Wifi, WifiOff, ShieldAlert, ShieldCheck } from "lucide-react"; 
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import API from "./API";

export default function PortScan() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("manual");
  const [branches, setBranches] = useState([]);
  const [portGroups, setPortGroups] = useState([]);

  const [scanTitle, setScanTitle] = useState("");
  const [selectedBranches, setSelectedBranches] = useState([]); 
  const [portMode, setPortMode] = useState("group");
  const [portGroupId, setPortGroupId] = useState("");
//   const [singlePort, setSinglePort] = useState("");
  const [manualPortsList, setManualPortsList] = useState([]);
  const [singlePortInput, setSinglePortInput] = useState("");

  const [branchSearch, setBranchSearch] = useState(""); 
  
  const [schedules, setSchedules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState(null);

  const [schedTitle, setSchedTitle] = useState("");
  const [schedTime, setSchedTime] = useState("00:00");
  const [schedFreq, setSchedFreq] = useState("Daily");
  const [schedSelectedBranches, setSchedSelectedBranches] = useState([]); 
  const [schedBranchSearch, setSchedBranchSearch] = useState("");
  const [schedPortMode, setSchedPortMode] = useState("group");
  const [schedPortGroupId, setSchedPortGroupId] = useState("");
//   const [schedManualPort, setSchedManualPort] = useState("");
  const [schedManualPortsList, setSchedManualPortsList] = useState([]);
  const [schedSinglePortInput, setSchedSinglePortInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]); 
  const [currentIndex, setCurrentIndex] = useState(0); 
  const progressRef = useRef(null);

  useEffect(() => {
    fetchBranches();
    fetchPortGroups();
    fetchSchedules(); 
  }, []);

  const fetchBranches = () => fetch(`${API}/Branch/getBranches`).then(res => res.json()).then(data => setBranches(data));
  const fetchPortGroups = () => fetch(`${API}/PortGroup/GetAll`).then(res => res.json()).then(data => setPortGroups(data));
  const fetchSchedules = () => fetch(`${API}/Schedule/GetAll`).then(res => res.json()).then(data => setSchedules(data));

  const fetchScheduleDetail = async (id) => {
      try {
          const res = await fetch(`${API}/Schedule/Get/${id}`);
          if (!res.ok) throw new Error("Gagal load detail");
          return await res.json();
      } catch (err) {
          toast.error(err.message);
          return null;
      }
  };

  const handleCheckHistory = (scheduleId) => {
    navigate(`/scanhistory?schId=${scheduleId}`);
  }

  const getFilteredBranches = (search, currentSelectedList = []) => {
    return branches.filter(b => {
      const isMatchSearch = (b.branch_name || "").toLowerCase().includes(search.toLowerCase()) || 
                            (b.branch_cidr || "").toLowerCase().includes(search.toLowerCase());
      
      const isAlreadySelected = currentSelectedList.some(selected => 
                            (selected.branch_id || selected.id) === (b.branch_id || b.id));
                            
      // Tampilkan HANYA JIKA cocok dengan pencarian DAN BELUM dipilih
      return isMatchSearch && !isAlreadySelected;
    });
  };

  const handleAddBranchFromDropdown = (branch) => {
    if (selectedBranches.some(b => (b.branch_id || b.id) === (branch.branch_id || branch.id))) {
        toast.info("Branch sudah dipilih.");
    } else {
        const selectedTemp = [...selectedBranches, branch];
        setSelectedBranches(selectedTemp);
    }
    setBranchSearch(""); 
  };

  const handleRemoveBranch = (id) => {
    setSelectedBranches(selectedBranches.filter(b => (b.branch_id || b.id) !== id));
  };

  const handleScan = async () => {
    if (!scanTitle) return toast.warn("Isi Judul Scan!");
    if (selectedBranches.length === 0) return toast.warn("Pilih minimal 1 Branch!");
    if (portMode === "group" && !portGroupId && portGroupId !== 0 && portGroupId !== "0") {
        return toast.warn("Pilih Group Port atau opsi All Ports!");
    }
    if (portMode === "single" && manualPortsList.length === 0) {
        return toast.warn("Port Manual wajib diisi minimal satu!");
    }

    setLoading(true); setResults([]); startFakeProgress();
    try {
        const payload = {
            Title: scanTitle,
            BranchIds: selectedBranches.map(b => Number(b.branch_id || b.id)),
            Pg_id: portMode === "group" ? parseInt(portGroupId) : null,
            Manual_ports: portMode === "single" ? manualPortsList : null,
        };
        const res = await fetch(`${API}/scan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)});
        if (!res.ok) {
            const errDetails = await res.text();
            throw new Error(errDetails || "Gagal melakukan scan");
        }
        const data = await res.json();
        
        setResults(data); 
        toast.success("Scan Selesai!");
    } catch(e) { 
        console.error(e);
        toast.error("Error Scan: " + e.message); 
    } 
    finally { setLoading(false); stopFakeProgress(); }
  };
  
  const startFakeProgress = () => { setProgress(10); progressRef.current = setInterval(() => setProgress(p => p < 90 ? p+5 : p), 500); };
  const stopFakeProgress = () => { clearInterval(progressRef.current); setProgress(100); setTimeout(() => setProgress(0), 1000); };
  const currentResult = results.length > 0 ? results[currentIndex] : null;


  const handleAddClick = () => {
      setIsEditMode(false); setEditingId(null);
      setSchedTitle(""); setSchedTime("00:00"); setSchedFreq("Daily");
      setSchedSelectedBranches([]); setSchedPortMode("group"); 
      setSchedPortGroupId(""); 
      setSchedManualPortsList([]);
      setSchedSinglePortInput("");
      setShowModal(true);
  };

  const handleEditClick = async (id) => {
      const detail = await fetchScheduleDetail(id);
      if (detail) {
          setIsEditMode(true); setEditingId(id);
          setSchedTitle(detail.sch_title);
          setSchedTime(detail.sch_time.substring(0, 5));
          setSchedFreq(detail.sch_frequency);
          setSchedPortMode(detail.sch_portMode);
          setSchedPortGroupId(detail.sch_pgId || "");
          setSchedManualPortsList(detail.sch_targetManualPort || []);
          const mappedBranches = detail.targets.map(t => ({
              branch_id: t.branchId, branch_name: t.branchName, branch_cidr: t.branchCidr
          }));
          setSchedSelectedBranches(mappedBranches);
          setShowModal(true);
      }
  };

  const handleViewDetailClick = async (id) => {
      const detail = await fetchScheduleDetail(id);
      if (detail) { setSelectedScheduleDetail(detail); setShowDetailModal(true); }
  };

  const handleSaveSchedule = async () => {
    if (!schedTitle) return toast.warn("Isi Judul!");
    if (schedSelectedBranches.length === 0) return toast.warn("Pilih min. 1 Branch!");
    
    const payload = {
        Sch_title: schedTitle, Sch_frequency: schedFreq, Sch_time: schedTime + ":00", 
        Sch_portMode: schedPortMode,
        Sch_pgId: schedPortMode === 'group' ? parseInt(schedPortGroupId) : null,
        Sch_targetManualPort: schedPortMode === 'single' ? schedManualPortsList : null,
        TargetBranchIds: schedSelectedBranches.map(b => b.branch_id) 
    };

    try {
        let url = isEditMode ? `${API}/Schedule/Update/${editingId}` : `${API}/Schedule/Create`;
        let method = isEditMode ? "POST" : "POST";
        const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error("Gagal simpan jadwal");
        
        toast.success(isEditMode ? "Jadwal Diupdate!" : "Jadwal Dibuat!");
        setShowModal(false); fetchSchedules(); 
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteSchedule = async (id) => {
      await fetch(`${API}/Schedule/Delete/${id}`, { method: 'POST' });
      fetchSchedules(); toast.success("Terhapus");
  };

  const handleAddSchedBranch = (b) => {
      if(!schedSelectedBranches.some(x => x.branch_id === b.branch_id)) setSchedSelectedBranches([...schedSelectedBranches, b]);
      setSchedBranchSearch("");
  };


  const getPortGroupName = (groupId) => {
      if (groupId === 0) return "All Ports (Full Scan)";
      
      const group = portGroups.find(pg => pg.pg_id === groupId);
      return group ? group.pg_name : `Group ID: ${groupId}`;
  };

  const handleToggleStatus = async (id) => {
      try {
          const res = await fetch(`${API}/Schedule/ToggleStatus/${id}`, { method: 'POST' });
          if (!res.ok) throw new Error("Gagal update status");
          
          fetchSchedules();
          toast.success("Status jadwal diupdate!");
      } catch (err) {
          toast.error(err.message);
      }
  };

  const handleAddAllBranches = () => {
      setSchedSelectedBranches(branches);
      setSchedBranchSearch("");
      toast.info(`Berhasil memilih ${branches.length} branch!`);
  };
  const handleAddAllBranchesManual = () => {
      setSelectedBranches(branches);
      setSchedBranchSearch("");
      toast.info(`Berhasil memilih ${branches.length} branch!`);
  };

  const handleKeyDownPort = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const portVal = parseInt(singlePortInput);
      
      if (portVal > 0 && portVal <= 65535) {
        if (!manualPortsList.includes(portVal)) {
          setManualPortsList([...manualPortsList, portVal]);
        } else {
          toast.info("Port sudah ditambahkan.");
        }
        setSinglePortInput(""); 
      } else {
        toast.warning("Masukkan port yang valid (1 - 65535).");
      }
    }
  };

  const handleRemoveManualPort = (portToRemove) => {
    setManualPortsList(manualPortsList.filter(p => p !== portToRemove));
  };

  const handleKeyDownSchedPort = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const portVal = parseInt(schedSinglePortInput);
      
      if (!isNaN(portVal) && portVal > 0 && portVal <= 65535) {
        if (!schedManualPortsList.includes(portVal)) {
          setSchedManualPortsList([...schedManualPortsList, portVal]);
        } else {
          toast.info("Port sudah ditambahkan.");
        }
        setSchedSinglePortInput(""); 
      } else {
        toast.warning("Masukkan port yang valid (1 - 65535).");
      }
    }
  };

  const handleRemoveSchedManualPort = (portToRemove) => {
    setSchedManualPortsList(schedManualPortsList.filter(p => p !== portToRemove));
  };

  const getSeverityColor = (severity) => {
      const sev = severity ? severity.toLowerCase() : 'low';
      switch(sev) {
          case 'high': return 'danger';
          case 'medium': return 'warning';
          case 'low': return 'info';
          default: return 'secondary';
      }
  };

  return (
    <div>
      <ToastContainer position="bottom-right" autoClose={3000} />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Port Scanner</h3>
          <p className="text-muted mb-0">Kelola pemindaian manual dan otomatis.</p>
        </div>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 border-bottom-0">
        
        <Tab eventKey="manual" title={<span className="fw-bold d-flex align-items-center gap-2"><Play size={16}/> Manual Scan</span>}>
            <Card className="card-enterprise mb-4 border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom py-3">
                    <div className="d-flex align-items-center gap-2 text-primary">
                        <Search size={18} />
                        <h6 className="mb-0 fw-bold">Manual Configuration</h6>
                    </div>
                </Card.Header>
                <Card.Body className="p-4">
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label className="text-muted small fw-bold text-uppercase">Scan Title</Form.Label> <span style={{ color: 'red'}}>*</span>
                            <Form.Control type="text" placeholder="Contoh: Audit Rutin" value={scanTitle} onChange={(e) => setScanTitle(e.target.value)} className="form-control-lg fs-6" />
                        </Col>
                        
                        <Col md={6}>
                            <Form.Label className="text-muted small fw-bold text-uppercase">Add Target Branch</Form.Label> <span style={{ color: 'red'}}>*</span>
                            <Dropdown className="w-100">
                                <Dropdown.Toggle variant="white" className="w-100 text-start d-flex justify-content-between align-items-center border form-control-lg fs-6" style={{ backgroundColor: '#fff' }}>
                                    <span className="text-muted">-- Pilih & Tambahkan Branch --</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="w-100 p-0 shadow-sm border-0" style={{maxHeight: '300px', overflow: 'hidden'}}>
                                    <div className="p-2 border-bottom bg-light sticky-top">
                                        <Form.Control autoFocus placeholder="Cari Nama / CIDR..." value={branchSearch} onChange={(e) => setBranchSearch(e.target.value)} size="sm"/>
                                        <div 
                                            className="d-grid mt-2 pb-1 border-bottom"
                                            onClick={handleAddAllBranchesManual}
                                            style={{cursor: 'pointer'}}
                                        >
                                            <Badge bg="primary" className="p-2 fw-bold text-uppercase d-flex justify-content-center align-items-center gap-2">
                                                <Plus size={14} strokeWidth={3}/> PILIH SEMUA BRANCH ({branches.length})
                                            </Badge>
                                        </div>
                                    </div>
                                    <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                                        {getFilteredBranches(branchSearch, selectedBranches).map((b) => (
                                            <Dropdown.Item key={b.branch_id || b.id} onClick={() => handleAddBranchFromDropdown(b)} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                <span className="fw-bold text-dark small">{b.branch_name || b.name}</span>
                                                <Badge bg="light" text="primary" className="border fw-normal">{b.branch_cidr || b.cidr}</Badge>
                                            </Dropdown.Item>
                                        ))}
                                        {getFilteredBranches(branchSearch, selectedBranches).length === 0 && (
                                            <div className="p-3 text-center text-muted small fst-italic">
                                                Semua branch telah dipilih.
                                            </div>
                                        )}
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Col>

                        <Col xs={12}>
                            <div className="p-3 bg-light rounded border border-dashed">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Form.Label className="text-muted small fw-bold text-uppercase mb-0">Target List ({selectedBranches.length})</Form.Label>
                                    {selectedBranches.length > 0 && (
                                        <Badge bg="danger" className="text-white fw-normal" style={{cursor: 'pointer'}} onClick={() => setSelectedBranches([])}>
                                            <Trash2 size={12} className="me-1"/> Hapus Semua
                                        </Badge>
                                    )}
                                </div>
                                {selectedBranches.length === 0 ? <span className="text-muted small fst-italic">Belum ada branch dipilih.</span> : (
                                    <div className="d-flex flex-wrap gap-2">
                                        {selectedBranches.map((b) => (
                                            <Badge key={b.branch_id || b.id} bg="white" className="text-dark border shadow-sm px-3 py-2 d-flex align-items-center gap-2">
                                                <Globe size={14} className="text-primary"/>
                                                <span>{b.branch_name || b.name}</span>
                                                <button onClick={() => handleRemoveBranch(b.branch_id || b.id)} className="btn btn-link p-0 ms-2 text-danger" style={{ lineHeight: 0 }}><X size={16} /></button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Col>

                        <Col xs={12}><hr className="text-muted opacity-25 my-2"/></Col>

                        <Col md={4}>
                            <Form.Label className="text-muted small fw-bold text-uppercase">Scanning Mode</Form.Label>
                            <Form.Select value={portMode} onChange={(e) => setPortMode(e.target.value)} className="form-control-lg fs-6">
                                <option value="group">Use Port Group</option>
                                <option value="single">Single Port Manual</option>
                            </Form.Select>
                        </Col>
                        <Col md={8}>
                            {portMode === "group" ? (
                                <>
                                    <Form.Label className="text-muted small fw-bold text-uppercase">Select Group</Form.Label>
                                    <Form.Select value={portGroupId} onChange={(e) => setPortGroupId(e.target.value)} className="form-control-lg fs-6">
                                        <option value="">-- Pilih Group Port --</option>
                                        <option value="0" className="fw-bold text">SCAN ALL PORTS</option>
                                        {portGroups.map((pg) => <option key={pg.pg_id} value={pg.pg_id}>{pg.pg_name}</option>)}
                                    </Form.Select>
                                </>
                            ) : (
                                <>
                                    <Form.Label className="text-muted small fw-bold text-uppercase">Manual Port</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        placeholder="Ketik port (cth: 80) lalu tekan Enter..." 
                                        value={singlePortInput} 
                                        onChange={(e) => setSinglePortInput(e.target.value)} 
                                        onKeyDown={handleKeyDownPort}
                                        className="form-control-lg fs-6 mb-3" 
                                    />
                                    
                                    <div className="p-3 bg-light rounded border border-dashed">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <Form.Label className="text-muted small fw-bold text-uppercase mb-0">Port List ({manualPortsList.length})</Form.Label>
                                            {manualPortsList.length > 0 && (
                                                <Badge bg="danger" className="text-white fw-normal" style={{cursor: 'pointer'}} onClick={() => setManualPortsList([])}>
                                                    <Trash2 size={12} className="me-1"/> Hapus Semua
                                                </Badge>
                                            )}
                                        </div>
                                        {manualPortsList.length === 0 ? (
                                            <span className="text-muted small fst-italic">Belum ada port ditambahkan.</span>
                                        ) : (
                                            <div className="d-flex flex-wrap gap-2">
                                                {manualPortsList.map((p) => (
                                                    <Badge key={p} bg="white" className="text-dark border shadow-sm px-3 py-2 d-flex align-items-center gap-2">
                                                        <Server size={14} className="text-primary"/>
                                                        <span className="fw-bold">Port {p}</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveManualPort(p)} 
                                                            className="btn btn-link p-0 ms-2 text-danger" 
                                                            style={{ lineHeight: 0 }}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </Col>

                        <Col xs={12} className="mt-4">
                            <Button variant="primary" size="lg" className="w-100 fw-bold d-flex justify-content-center align-items-center gap-2" onClick={handleScan} disabled={loading}>
                                {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><Play size={18} fill="currentColor" /> Start Batch Scan</>}
                            </Button>
                        </Col>
                        {loading && <Col xs={12} className="mt-3"><ProgressBar animated now={progress} variant="primary" style={{height: '10px'}} /></Col>}
                    </Row>
                </Card.Body>
            </Card>

            {currentResult && (
                <div className="animate__animated animate__fadeIn">
                    <Card className="border-0 shadow-sm mb-4 bg-primary text-white">
                        <Card.Body className="d-flex justify-content-between align-items-center py-3">
                            <Button variant="outline-light" className="rounded-circle p-2" disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)}><ChevronLeft size={24}/></Button>
                            <div className="text-center">
                                <h4 className="fw-bold mb-0">{currentResult.branchName}</h4>
                                <small className="fw-bold text-white font-monospace">{currentResult.branchCidr} • Result {currentIndex + 1} of {results.length}</small>
                            </div>
                            <Button variant="outline-light" className="rounded-circle p-2" disabled={currentIndex === results.length - 1} onClick={() => setCurrentIndex(prev => prev + 1)}><ChevronRight size={24}/></Button>
                        </Card.Body>
                    </Card>

                    {(() => {
                        const totalOpenPorts = currentResult.results.reduce((acc, curr) => acc + curr.ports.filter(p => p.status).length, 0);
                        const vulnHosts = currentResult.results.filter(r => r.ports.some(p => p.status)).length;
                        return (
                            <Row className="g-3 mb-4">
                                <Col md={3} xs={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Body className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary"><Server size={24}/></div>
                                            <div>
                                                <h3 className="mb-0 fw-bold">{currentResult.summary.totalAliveHosts || currentResult.results.length}</h3>
                                                <small className="text-muted fw-bold" style={{fontSize:'11px'}}>ALIVE HOSTS</small>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3} xs={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Body className="d-flex align-items-center gap-3">
                                            <div className="bg-success bg-opacity-10 p-3 rounded-circle text-success"><CheckCircle size={24}/></div>
                                            <div>
                                                <h3 className="mb-0 fw-bold">{currentResult.summary.totalScans}</h3>
                                                <small className="text-muted fw-bold" style={{fontSize:'11px'}}>TOTAL CHECKS</small>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3} xs={6}>
                                    <Card className="border-0 shadow-sm h-100 border-start border-warning border-4">
                                        <Card.Body className="d-flex align-items-center gap-3">
                                            <div className="bg-warning bg-opacity-10 p-3 rounded-circle text-warning"><Radar size={24}/></div>
                                            <div>
                                                <h3 className="mb-0 fw-bold">{vulnHosts}</h3>
                                                <small className="text-muted fw-bold" style={{fontSize:'11px'}}>VULN. HOSTS</small>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3} xs={6}>
                                    <Card className="border-0 shadow-sm h-100 border-start border-danger border-4">
                                        <Card.Body className="d-flex align-items-center gap-3">
                                            <div className="bg-danger bg-opacity-10 p-3 rounded-circle text-danger"><XCircle size={24}/></div>
                                            <div>
                                                <h3 className="mb-0 fw-bold text-danger">{totalOpenPorts}</h3>
                                                <small className="text-muted fw-bold" style={{fontSize:'11px'}}>TOTAL OPEN PORTS</small>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        );
                    })()}

                    <h5 className="fw-bold text-dark mt-2 mb-3">Detail Result: {currentResult.branchName}</h5>
                    <Row>
                        {currentResult.results
                            .sort((a, b) => {
                                const openA = a.ports.filter(p => p.status).length;
                                const openB = b.ports.filter(p => p.status).length;
                                if (openA !== openB) return openB - openA;
                                return (b.isHostAlive === true) - (a.isHostAlive === true);
                            })
                            .map((ipResult, index) => {
                                const openCount = ipResult.ports.filter(p => p.status).length;
                                const isVulnerable = openCount > 0;
                                const isAlive = ipResult.isHostAlive;

                                return (
                                    <Col xs={12} lg={6} key={index} className="mb-3">
                                        <Card className={`card-enterprise border-0 shadow-sm h-100 ${isVulnerable ? 'border-start border-danger border-4' : 'border-start border-success border-4'}`}>
                                            <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2">
                                                    <Globe size={18} className="text-secondary"/>
                                                    <span className="fw-bold fs-5 text-dark">{ipResult.ip}</span>
                                                </div>
                                                
                                                <div className="d-flex gap-2">
                                                    {/* BADGE 1: STATUS HOST */}
                                                    {isAlive ? (
                                                        <Badge bg="primary" className="d-flex align-items-center gap-1 py-2 px-3">
                                                            <Wifi size={14}/> Host Up
                                                        </Badge>
                                                    ) : (
                                                        <Badge bg="secondary" className="d-flex align-items-center gap-1 py-2 px-3 opacity-75">
                                                            <WifiOff size={14}/> Host Down
                                                        </Badge>
                                                    )}

                                                    {/* BADGE 2: STATUS PORT */}
                                                    {isVulnerable ? (
                                                        <Badge bg="danger" className="d-flex align-items-center gap-1 py-2 px-3">
                                                            <ShieldAlert size={14}/> {openCount} Open
                                                        </Badge>
                                                    ) : (
                                                        <Badge bg="success" className="d-flex align-items-center gap-1 py-2 px-3">
                                                            <ShieldCheck size={14}/> Secure
                                                        </Badge>
                                                    )}
                                                </div>
                                            </Card.Header>
                                            
                                            <Card.Body className="bg-light bg-opacity-25">
                                                {ipResult.ports && ipResult.ports.length > 0 ? (
                                                    <Row className="g-2">
                                                        {ipResult.ports.map((p) => {
                                                            const colorVariant = p.status ? getSeverityColor(p.severity) : "light";
                                                            const borderColor = p.status ? `border-${colorVariant}` : "border-secondary border-opacity-25";
                                                            const textColor = p.status ? `text-${colorVariant}` : "text-muted opacity-75";

                                                            return (
                                                                <Col xs={6} sm={4} md={3} key={p.port}>
                                                                    <div className={`p-2 rounded border text-center position-relative transition-all ${p.status ? `bg-white ${borderColor} border-2 shadow-sm` : "bg-white border-light text-muted opacity-75"}`}>
                                                                        <div className={`fw-bold fs-5 mb-0 ${textColor}`}>{p.port}</div>
                                                                        <div className={`small fw-bold text-uppercase text-truncate ${textColor}`} style={{fontSize: '0.7rem'}}>
                                                                            {p.status ? "OPEN" : "CLOSED"}
                                                                        </div>
                                                                        {p.status && (
                                                                            <div className={`position-absolute top-0 start-100 translate-middle badge rounded-pill bg-${colorVariant}`} style={{fontSize: '0.5rem', zIndex: 10}}>
                                                                                {p.severity ? p.severity[0].toUpperCase() : "L"}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </Col>
                                                            );
                                                        })}
                                                    </Row>
                                                ) : (
                                                    <div className="text-center py-4 text-muted opacity-75 d-flex flex-column align-items-center justify-content-center">
                                                        <div className="bg-secondary bg-opacity-10 p-3 rounded-circle mb-2">
                                                            <Lock size={24} className="text-secondary"/>
                                                        </div>
                                                        <small className="fw-bold">No Ports Scanned.</small>
                                                    </div>
                                                )}
                                            </Card.Body>

                                            {isVulnerable && (
                                                <Card.Footer className="bg-white border-top-0 py-2">
                                                    <div className="d-flex gap-3 justify-content-end">
                                                        <small className="d-flex align-items-center gap-1 text-muted" style={{fontSize: '10px'}}>
                                                            <span className="d-inline-block rounded-circle bg-danger" style={{width: 8, height: 8}}></span> High
                                                        </small>
                                                        <small className="d-flex align-items-center gap-1 text-muted" style={{fontSize: '10px'}}>
                                                            <span className="d-inline-block rounded-circle bg-warning" style={{width: 8, height: 8}}></span> Medium
                                                        </small>
                                                        <small className="d-flex align-items-center gap-1 text-muted" style={{fontSize: '10px'}}>
                                                            <span className="d-inline-block rounded-circle bg-info" style={{width: 8, height: 8}}></span> Low
                                                        </small>
                                                    </div>
                                                </Card.Footer>
                                            )}
                                        </Card>
                                    </Col>
                                );
                            })}
                    </Row>
                </div>
            )}
        </Tab>

        <Tab eventKey="scheduled" title={<span className="fw-bold d-flex align-items-center gap-2"><Clock size={16}/> Scheduled Task</span>}>
             <Card className="border-0 shadow-sm">
                 <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                     <div className="d-flex align-items-center gap-2 text-dark">
                         <Calendar size={18} />
                         <h6 className="mb-0 fw-bold">Daftar Jadwal Scan Otomatis</h6>
                     </div>
                     <Button variant="primary" size="sm" className="fw-bold d-flex align-items-center gap-2" onClick={handleAddClick}>
                         <Plus size={16}/> Buat Jadwal Baru
                     </Button>
                 </Card.Header>
                 <Card.Body className="p-0">
                     <Table hover responsive className="mb-0 align-middle">
                         <thead className="bg-light text-secondary small text-uppercase">
                             <tr>
                                 <th className="ps-4">Nama Jadwal</th>
                                 <th>Aturan Waktu</th>
                                 <th>Target Port</th>
                                 <th>Next Run</th>
                                 <th className="text-end pe-4">Aksi</th>
                             </tr>
                         </thead>
                         <tbody>
                             {schedules.length === 0 ? (
                                 <tr><td colSpan="5" className="text-center py-5 text-muted">Belum ada jadwal aktif. Silakan buat baru.</td></tr>
                             ) : (
                                 schedules.map((item) => (
                                     <tr key={item.sch_id}>
                                         <td className="ps-4">
                                             <div className="fw-bold text-dark">{item.sch_title}</div>
                                             <Badge bg={item.sch_isActive ? "success" : "secondary"} className="text-white bg-opacity-75 small fw-normal">
                                                {item.sch_isActive ? "Active" : "Inactive"}
                                             </Badge>
                                         </td>
                                         <td>
                                             <div className="d-flex align-items-center gap-2">
                                                 <Badge bg="light" text="dark" className="border">{item.sch_frequency}</Badge>
                                                 <span className="fw-bold font-monospace text-primary">{item.sch_time}</span>
                                             </div>
                                         </td>
                                         <td>
                                             {item.sch_portMode === 'all' ? (
                                                 <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger">ALL PORTS</Badge>
                                             ) : item.sch_portMode === 'group' ? (
                                                 <Badge bg="info" className="bg-opacity-10 text-info border border-info">Group ID: {getPortGroupName(item.sch_pgId)}</Badge>
                                             ) : (
                                                 <Badge bg="secondary" className="bg-opacity-10 text-secondary border border-secondary">Port: {item.sch_targetManualPort}</Badge>
                                             )}
                                         </td>
                                         <td className="small text-muted font-monospace">
                                             {item.sch_nextRun ? new Date(item.sch_nextRun).toLocaleString('id-ID') : '-'}
                                         </td>
                                         <td className="text-end pe-4">
                                             <div className="d-flex justify-content-end gap-2">
                                                <OverlayTrigger overlay={<Tooltip>{item.sch_isActive ? "Matikan Jadwal" : "Hidupkan Jadwal"}</Tooltip>}>
                                                    <div className="d-flex align-items-center me-2 border-end pe-3">
                                                        <Form.Check 
                                                            type="switch"
                                                            id={`switch-${item.sch_id}`}
                                                            checked={item.sch_isActive}
                                                            onChange={() => handleToggleStatus(item.sch_id)}
                                                            style={{cursor:'pointer', transform: 'scale(1.2)'}}
                                                        />
                                                    </div>
                                                </OverlayTrigger>
                                                <OverlayTrigger overlay={<Tooltip>Lihat History</Tooltip>}>
                                                     <Button variant="light" size="sm" className="border text-primary" onClick={() => handleCheckHistory(item.sch_id)}>
                                                         <History size={14}/>
                                                     </Button>
                                                 </OverlayTrigger>
                                                 <OverlayTrigger overlay={<Tooltip>Lihat Detail</Tooltip>}>
                                                     <Button variant="light" size="sm" className="border text-primary" onClick={() => handleViewDetailClick(item.sch_id)}>
                                                         <Eye size={14}/>
                                                     </Button>
                                                 </OverlayTrigger>
                                                 <OverlayTrigger overlay={<Tooltip>Edit Jadwal</Tooltip>}>
                                                     <Button variant="light" size="sm" className="border text-warning" onClick={() => handleEditClick(item.sch_id)}>
                                                         <Edit size={14}/>
                                                     </Button>
                                                 </OverlayTrigger>
                                                 <OverlayTrigger overlay={<Tooltip>Hapus</Tooltip>}>
                                                     {/* <Button variant="light" size="sm" className="border text-danger" onClick={() => handleDeleteSchedule(item.sch_id)}>
                                                         <Trash2 size={14}/>
                                                     </Button> */}

                                                     <Button 
                                                        variant="light" size="sm" className="text-danger border"
                                                        onClick={() => Swal.fire({
                                                            title: "Hapus Jadwal?",
                                                            text: "Data tidak bisa dikembalikan!",
                                                            icon: "warning",
                                                            showCancelButton: true,
                                                            confirmButtonColor: "#d33",
                                                            confirmButtonText: "Ya, Hapus!"
                                                        }).then((res) => {
                                                            if (res.isConfirmed) handleDeleteSchedule(item.sch_id);
                                                        })}
                                                     >
                                                         <Trash2 size={14}/>
                                                     </Button>
                                                 </OverlayTrigger>
                                             </div>
                                         </td>
                                     </tr>
                                 ))
                             )}
                         </tbody>
                     </Table>
                 </Card.Body>
             </Card>
        </Tab>
      </Tabs>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
          <Modal.Header closeButton>
              <Modal.Title className="fw-bold fs-5">
                  {isEditMode ? "Edit Jadwal Scan" : "Buat Jadwal Scan Baru"}
              </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
              <Form>
                  <Row className="mb-3">
                      <Col md={8}>
                          <Form.Label className="small fw-bold text-muted">Judul Jadwal</Form.Label>
                          <Form.Control placeholder="Contoh: Daily Full Scan" value={schedTitle} onChange={e => setSchedTitle(e.target.value)} />
                      </Col>
                      <Col md={4}>
                          <Form.Label className="small fw-bold text-muted">Jam Eksekusi (WIB)</Form.Label>
                          <Form.Control type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} />
                      </Col>
                  </Row>

                  <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted w-100 d-flex justify-content-between align-items-center mb-1">
                        <span>Target Branch ({schedSelectedBranches.length})</span>
                        {schedSelectedBranches.length > 0 && (
                            <Badge bg="danger" className="text-white fw-normal" style={{cursor: 'pointer'}} onClick={() => setSchedSelectedBranches([])}>
                                <Trash2 size={12} className="me-1"/> Hapus Semua
                            </Badge>
                        )}
                    </Form.Label>
                    
                    <Dropdown className="w-100 mb-2">
                        <Dropdown.Toggle variant="light" className="w-100 text-start border d-flex justify-content-between align-items-center">
                            -- Pilih Branch Target --
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100 shadow-sm" style={{maxHeight: '200px', overflowY: 'auto'}}>
                            <div className="sticky-top bg-white border-bottom">
                                <Form.Control size="sm" placeholder="Cari Branch..." value={schedBranchSearch} onChange={e => setSchedBranchSearch(e.target.value)} />
                                <div className="d-grid mt-2 pb-1 border-bottom" onClick={handleAddAllBranches} style={{cursor: 'pointer'}}>
                                    <Badge bg="primary" className="p-2 fw-bold text-uppercase d-flex justify-content-center align-items-center gap-2">
                                        <Plus size={14} strokeWidth={3}/> PILIH SEMUA BRANCH ({branches.length})
                                    </Badge>
                                </div>
                            </div>
                            {getFilteredBranches(schedBranchSearch, schedSelectedBranches).map(b => (
                                <Dropdown.Item key={b.branch_id} onClick={() => handleAddSchedBranch(b)} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                    {b.branch_name}
                                    <Badge bg="light" text="primary" className="border fw-normal">{b.branch_cidr || b.cidr}</Badge>
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                    <div className="d-flex flex-wrap gap-1 p-2 bg-light rounded border border-dashed" style={{minHeight: '50px'}}>
                        {schedSelectedBranches.length === 0 && <small className="text-muted fst-italic">Belum ada branch dipilih.</small>}
                        {schedSelectedBranches.map(b => (
                            <Badge key={b.branch_id} bg="white" text="dark" className="border shadow-sm px-2 py-1 d-flex align-items-center gap-2">
                                <Globe size={12} className="text-primary"/> {b.branch_name} 
                                <button type="button" className="btn btn-link p-0 ms-1 text-danger" onClick={() => setSchedSelectedBranches(schedSelectedBranches.filter(x => x.branch_id !== b.branch_id))} style={{lineHeight: 0}}><X size={14}/></button>
                            </Badge>
                        ))}
                    </div>
                  </Form.Group>

                  <Row className="mb-3">
                      <Col md={4}>
                        <Form.Label className="small fw-bold text-muted">Frekuensi</Form.Label>
                        <Form.Select value={schedFreq} onChange={e => setSchedFreq(e.target.value)}>
                            <option value="5 Minutes">Per 5 Menit</option>
                            <option value="Hourly">Setiap Jam</option>
                            <option value="Daily">Harian (Daily)</option>
                            <option value="Weekly">Mingguan</option>
                            <option value="Once">Sekali Saja</option>
                        </Form.Select>
                    </Col>
                    <Col md={4}>
                        <Form.Label className="small fw-bold text-muted">Mode Port</Form.Label>
                        <Form.Select value={schedPortMode} onChange={e => setSchedPortMode(e.target.value)}>
                            <option value="group">Use Port Group</option>
                            <option value="single">Single Port Manual</option>
                        </Form.Select>
                    </Col>
                    <Col md={4}>
                        <Form.Label className="small fw-bold text-muted">Detail Port</Form.Label>
                        {schedPortMode === 'group' && (
                            <Form.Select value={schedPortGroupId} onChange={e => setSchedPortGroupId(e.target.value)}>
                                <option value="">- Pilih Group -</option>
                                <option value="0" className="fw-bold text">SCAN ALL PORTS</option>
                                {portGroups.map(pg => <option key={pg.pg_id} value={pg.pg_id}>{pg.pg_name}</option>)}
                            </Form.Select>
                        )}
                        {schedPortMode === 'single' && (
                            <>
                                <Form.Control 
                                    type="number" 
                                    placeholder="Ketik & Enter..." 
                                    value={schedSinglePortInput} 
                                    onChange={e => setSchedSinglePortInput(e.target.value)} 
                                    onKeyDown={handleKeyDownSchedPort}
                                    className="mb-2"
                                />
                                <div className="p-2 bg-light rounded border border-dashed d-flex flex-column" style={{minHeight: '60px'}}>
                                    <div className="w-100 d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted small fw-bold text-uppercase" style={{fontSize: '10px'}}>List ({schedManualPortsList.length})</span>
                                        {schedManualPortsList.length > 0 && (
                                            <Badge bg="danger" className="text-white fw-normal" style={{cursor:'pointer', fontSize: '10px'}} onClick={() => setSchedManualPortsList([])}>Hapus Semua</Badge>
                                        )}
                                    </div>
                                    {schedManualPortsList.length === 0 ? <small className="text-muted fst-italic">Belum ada port.</small> : (
                                        <div className="d-flex flex-wrap gap-1">
                                            {schedManualPortsList.map(p => (
                                                <Badge key={p} bg="white" text="dark" className="border shadow-sm px-2 py-1 d-flex align-items-center gap-1">
                                                    <Server size={12} className="text-primary"/> Port {p} 
                                                    <button type="button" className="btn btn-link p-0 text-danger ms-1" onClick={() => handleRemoveSchedManualPort(p)} style={{lineHeight: 0}}><X size={14}/></button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </Col>
                  </Row>
              </Form>
          </Modal.Body>
          <Modal.Footer>
              <Button variant="light" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleSaveSchedule} className="fw-bold px-4">
                  {isEditMode ? "Simpan Perubahan" : "Buat Jadwal"}
              </Button>
          </Modal.Footer>
      </Modal>

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
          <Modal.Header closeButton>
              <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
                  <Layers size={20} className="text-primary"/> Detail Jadwal
              </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
              {selectedScheduleDetail && (
                  <div>
                      <div className="p-4 border-bottom bg-light">
                          <h5 className="fw-bold mb-1">{selectedScheduleDetail.sch_title}</h5>
                          <div className="d-flex gap-2 mt-2">
                              <Badge bg="primary">{selectedScheduleDetail.sch_frequency}</Badge>
                              <Badge bg="dark" className="font-monospace">{selectedScheduleDetail.sch_time}</Badge>
                              <Badge bg={selectedScheduleDetail.sch_isActive ? "success" : "secondary"}>
                                  {selectedScheduleDetail.sch_isActive ? "Active" : "Inactive"}
                              </Badge>
                          </div>
                      </div>
                      <div className="p-4">
                          <h6 className="small fw-bold text-muted text-uppercase mb-3">Informasi Scan</h6>
                          <Row className="g-3 mb-4">
                              <Col xs={6}>
                                  <small className="d-block text-muted">Target Port</small>
                                  <strong className="text-dark">
                                      {selectedScheduleDetail.sch_portMode === 'all' ? 'All Ports (Full Scan)' : 
                                       selectedScheduleDetail.sch_portMode === 'group' ? getPortGroupName(selectedScheduleDetail.sch_pgId) : 
                                       `Port ${selectedScheduleDetail.sch_targetManualPort}`}
                                  </strong>
                              </Col>
                              <Col xs={6}>
                                  <small className="d-block text-muted">Next Run</small>
                                  <strong className="text-primary font-monospace">
                                      {selectedScheduleDetail.sch_nextRun ? new Date(selectedScheduleDetail.sch_nextRun).toLocaleString('id-ID') : '-'}
                                  </strong>
                              </Col>
                          </Row>

                          <h6 className="small fw-bold text-muted text-uppercase mb-2 d-flex justify-content-between">
                              <span>Target Branches</span>
                          </h6>
                          <div className="bg-white rounded border" style={{maxHeight: '250px', overflowY: 'auto'}}>
                                {selectedScheduleDetail.targets && selectedScheduleDetail.targets.length > 0 ? (
                                    <Table hover size="sm" className="mb-0">
                                        <thead className="bg-light small sticky-top">
                                            <tr>
                                                <th className="ps-3 border-top-0">Nama Branch</th>
                                                <th className="border-top-0">CIDR / IP</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedScheduleDetail.targets.map((t, idx) => (
                                                <tr key={idx}>
                                                    <td className="ps-3 fw-bold text-dark small">{t.branchName}</td>
                                                    <td className="font-monospace text-muted small">{t.branchCidr}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <div className="p-4 text-center text-muted small fst-italic d-flex flex-column align-items-center gap-2">
                                        <AlertCircle size={20} className="text-secondary opacity-50"/>
                                        <span>Tidak ada branch target yang terdaftar.</span>
                                    </div>
                                )}
                          </div>
                      </div>
                  </div>
              )}
          </Modal.Body>
          <Modal.Footer className="bg-light">
              <Button variant="secondary" size="sm" onClick={() => setShowDetailModal(false)}>Tutup</Button>
          </Modal.Footer>
      </Modal>

    </div>
  );
}