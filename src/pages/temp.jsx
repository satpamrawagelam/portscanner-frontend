import React, { useEffect, useState, useRef } from "react";
import { Card, Form, Button, Row, Col, ProgressBar, Badge, Dropdown, Tabs, Tab, Table } from "react-bootstrap";
import { Play, Radar, Search, Loader2, FileText, Globe, X, ChevronLeft, ChevronRight, Server, CheckCircle, XCircle, Clock, Calendar, Trash2, Plus } from "lucide-react"; 
import { toast, ToastContainer } from "react-toastify";

const API = "http://localhost:7155";

export default function PortScan() {
  // --- STATE GLOBAL ---
  const [activeTab, setActiveTab] = useState("manual");
  const [branches, setBranches] = useState([]);
  const [portGroups, setPortGroups] = useState([]);

  // --- STATE MANUAL SCAN ---
  const [scanTitle, setScanTitle] = useState("");
  const [selectedBranches, setSelectedBranches] = useState([]); 
  const [portMode, setPortMode] = useState("group");
  const [portGroupId, setPortGroupId] = useState("");
  const [singlePort, setSinglePort] = useState("");
  
  // --- STATE SCHEDULED SCAN ---
  const [schedules, setSchedules] = useState([]);
  const [schedTitle, setSchedTitle] = useState("");
  const [schedTime, setSchedTime] = useState("00:00");
  const [schedFreq, setSchedFreq] = useState("Daily");
  const [schedSelectedBranches, setSchedSelectedBranches] = useState([]); // Multi-Branch for Schedule
  const [schedBranchSearch, setSchedBranchSearch] = useState("");
  // Port Config for Schedule
  const [schedPortMode, setSchedPortMode] = useState("group");
  const [schedPortGroupId, setSchedPortGroupId] = useState("");
  const [schedManualPort, setSchedManualPort] = useState("");

  // --- STATE UI & LOADING ---
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]); 
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [branchSearch, setBranchSearch] = useState(""); 
  
  const progressRef = useRef(null);

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchBranches();
    fetchPortGroups();
    fetchSchedules(); 
  }, []);

  const fetchBranches = () => {
    fetch(`${API}/api/Branch/getBranches`)
      .then((res) => res.json())
      .then((data) => setBranches(data))
      .catch(() => toast.error("Gagal load Branch"));
  };

  const fetchPortGroups = () => {
    fetch(`${API}/api/PortGroup/GetAll`)
      .then((res) => res.json())
      .then((data) => setPortGroups(data))
      .catch(() => toast.error("Gagal load Port Group"));
  };

  const fetchSchedules = () => {
    fetch(`${API}/api/Schedule/GetAll`)
        .then(res => res.json())
        .then(data => setSchedules(data))
        .catch(err => console.error(err));
  };

  // --- LOGIC MANUAL SCAN ---
  const filteredBranches = branches.filter(b => {
      const term = branchSearch.toLowerCase();
      return (b.branch_name || b.name).toLowerCase().includes(term) || (b.branch_cidr || b.cidr || "").toLowerCase().includes(term);
  });

  const handleAddBranchFromDropdown = (branch) => {
    if (selectedBranches.some(b => (b.branch_id || b.id) === (branch.branch_id || branch.id))) {
        toast.info("Branch sudah dipilih.");
    } else {
        setSelectedBranches([...selectedBranches, branch]);
    }
    setBranchSearch(""); 
  };

  const handleRemoveBranch = (id) => {
    setSelectedBranches(selectedBranches.filter(b => (b.branch_id || b.id) !== id));
  };

  const startFakeProgress = () => {
    setProgress(10);
    progressRef.current = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + (Math.random() * 5) : prev));
    }, 800);
  };

  const handleScan = async () => {
    if (!scanTitle.trim()) return toast.warn("Isi Judul Scan");
    if (selectedBranches.length === 0) return toast.warn("Pilih minimal satu branch");
    if (portMode === "group" && !portGroupId) return toast.warn("Pilih Port Group");
    if (portMode === "single" && !singlePort) return toast.warn("Isi Port Manual");
    
    setLoading(true);
    setResults([]); 
    setCurrentIndex(0); 
    startFakeProgress();

    try {
        let tempResults = [];
        for (let i = 0; i < selectedBranches.length; i++) {
            const branch = selectedBranches[i];
            const payload = {
                Title: scanTitle,
                Branch_id: Number(branch.branch_id || branch.id),
                Pg_id: portMode === "group" ? Number(portGroupId) : null,
                Manual_port: portMode === "single" ? Number(singlePort) : null,
            };

            const res = await fetch(`${API}/api/scan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Gagal scan");
            const data = await res.json();
            data.branchName = branch.branch_name || branch.name;
            data.branchCidr = branch.branch_cidr || branch.cidr;
            tempResults.push(data);
        }
        setResults(tempResults);
        toast.success("Scan Selesai!");
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      clearInterval(progressRef.current);
      setProgress(100);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const currentResult = results.length > 0 ? results[currentIndex] : null;

  // --- LOGIC SCHEDULED SCAN ---
  const handleAddSchedBranch = (branch) => {
    if (!schedSelectedBranches.some(b => b.branch_id === branch.branch_id)) {
        setSchedSelectedBranches([...schedSelectedBranches, branch]);
    }
    setSchedBranchSearch("");
  };

  const handleRemoveSchedBranch = (id) => {
    setSchedSelectedBranches(schedSelectedBranches.filter(b => b.branch_id !== id));
  };

  const handleSaveSchedule = async () => {
    if (!schedTitle) return toast.warn("Isi Judul Jadwal!");
    if (schedSelectedBranches.length === 0) return toast.warn("Pilih minimal 1 Branch!");
    if (!schedTime) return toast.warn("Tentukan Jam Eksekusi!");
    if (schedPortMode === "group" && !schedPortGroupId) return toast.warn("Pilih Port Group Jadwal");
    if (schedPortMode === "single" && !schedManualPort) return toast.warn("Isi Port Manual Jadwal");

    const payload = {
        Sch_title: schedTitle,
        Sch_frequency: schedFreq,
        Sch_time: schedTime + ":00", 
        Sch_portMode: schedPortMode,
        Sch_targetPortGroupId: schedPortMode === 'group' ? parseInt(schedPortGroupId) : null,
        Sch_targetManualPort: schedPortMode === 'single' ? parseInt(schedManualPort) : null,
        TargetBranchIds: schedSelectedBranches.map(b => b.branch_id) 
    };

    try {
        const res = await fetch(`${API}/api/Schedule/Create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Gagal menyimpan jadwal");

        toast.success("Jadwal Berhasil Disimpan & Aktif!");
        setSchedTitle("");
        setSchedSelectedBranches([]);
        fetchSchedules(); 
    } catch (err) {
        toast.error(err.message);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if(!window.confirm("Hapus jadwal ini?")) return;
    await fetch(`${API}/api/Schedule/Delete/${id}`, { method: 'POST' });
    fetchSchedules();
    toast.success("Jadwal dihapus");
  };


  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Port Scanner</h3>
          <p className="text-muted mb-0">Kelola pemindaian manual dan terjadwal (otomatis).</p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 border-bottom-0"
      >
        <Tab eventKey="manual" title={<span className="fw-bold d-flex align-items-center gap-2"><Play size={16}/> Manual Scan</span>}>
            {/* --- CONTENT TAB 1: MANUAL SCAN --- */}
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
                            <Form.Label className="text-muted small fw-bold text-uppercase">Scan Title</Form.Label>
                            <Form.Control type="text" placeholder="Contoh: Audit Rutin" value={scanTitle} onChange={(e) => setScanTitle(e.target.value)} className="form-control-lg fs-6" />
                        </Col>
                        
                        {/* DROPDOWN BRANCH MANUAL */}
                        <Col md={6}>
                            <Form.Label className="text-muted small fw-bold text-uppercase">Add Target Branch</Form.Label>
                            <Dropdown className="w-100">
                                <Dropdown.Toggle variant="white" className="w-100 text-start d-flex justify-content-between align-items-center border form-control-lg fs-6" style={{ backgroundColor: '#fff' }}>
                                    <span className="text-muted">-- Pilih & Tambahkan Branch --</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="w-100 p-0 shadow-sm border-0" style={{maxHeight: '300px', overflow: 'hidden'}}>
                                    <div className="p-2 border-bottom bg-light sticky-top">
                                        <Form.Control autoFocus placeholder="Cari Nama / CIDR..." value={branchSearch} onChange={(e) => setBranchSearch(e.target.value)} size="sm"/>
                                    </div>
                                    <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                                        {filteredBranches.map((b) => (
                                            <Dropdown.Item key={b.branch_id || b.id} onClick={() => handleAddBranchFromDropdown(b)} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                <span className="fw-bold text-dark small">{b.branch_name || b.name}</span>
                                                <Badge bg="light" text="primary" className="border fw-normal">{b.branch_cidr || b.cidr}</Badge>
                                            </Dropdown.Item>
                                        ))}
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Col>

                        {/* LIST BUBBLES MANUAL */}
                        <Col xs={12}>
                            <div className="p-3 bg-light rounded border border-dashed">
                                <Form.Label className="text-muted small fw-bold text-uppercase d-block mb-2">Target List ({selectedBranches.length})</Form.Label>
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

                        {/* PORT CONFIG MANUAL */}
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
                                        {portGroups.map((pg) => <option key={pg.pg_id} value={pg.pg_id}>{pg.pg_name}</option>)}
                                    </Form.Select>
                                </>
                            ) : (
                                <>
                                    <Form.Label className="text-muted small fw-bold text-uppercase">Manual Port</Form.Label>
                                    <Form.Control type="number" placeholder="8080" value={singlePort} onChange={(e) => setSinglePort(e.target.value)} className="form-control-lg fs-6" />
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

            {/* RESULT SECTION (MANUAL) - TAMPILKAN HASIL JIKA ADA */}
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

                    {/* SUMMARY & DETAIL CARDS SAMA SEPERTI YANG MAS SUDAH BUAT */}
                    {/* ... (Copy bagian summary card dan detail card dari kode sebelumnya disini jika perlu, atau biarkan kosong jika ingin fokus ke struktur) ... */}
                    <div className="alert alert-success border-0 shadow-sm d-flex align-items-center gap-3">
                        <CheckCircle size={24}/>
                        <div>
                            <strong>Scan Berhasil!</strong> Data telah disimpan. Silakan cek detail di menu <u>History</u> atau <u>Dashboard</u>.
                        </div>
                    </div>
                </div>
            )}
        </Tab>

        {/* --- CONTENT TAB 2: SCHEDULED TASK --- */}
        <Tab eventKey="scheduled" title={<span className="fw-bold d-flex align-items-center gap-2"><Clock size={16}/> Scheduled Task</span>}>
             <Row>
                 {/* FORM INPUT JADWAL */}
                 <Col md={5}>
                     <Card className="border-0 shadow-sm mb-4">
                         <Card.Header className="bg-white border-bottom py-3">
                             <div className="d-flex align-items-center gap-2 text-success">
                                 <Plus size={18} />
                                 <h6 className="mb-0 fw-bold">Buat Jadwal Baru</h6>
                             </div>
                         </Card.Header>
                         <Card.Body className="p-4">
                             <Form>
                                 <Form.Group className="mb-3">
                                     <Form.Label className="small fw-bold text-muted">Judul Jadwal</Form.Label>
                                     <Form.Control placeholder="Misal: Daily Night Scan" value={schedTitle} onChange={(e) => setSchedTitle(e.target.value)} />
                                 </Form.Group>

                                 {/* MULTI SELECT BRANCH (BUBBLE) FOR SCHEDULE */}
                                 <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">Target Branch ({schedSelectedBranches.length})</Form.Label>
                                    <Dropdown className="w-100 mb-2">
                                        <Dropdown.Toggle variant="light" className="w-100 text-start border d-flex justify-content-between align-items-center">
                                            Pilih Branch...
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu className="w-100 shadow-sm" style={{maxHeight: '200px', overflowY: 'auto'}}>
                                            <div className="p-2 sticky-top bg-white border-bottom">
                                                <Form.Control size="sm" placeholder="Cari..." value={schedBranchSearch} onChange={e => setSchedBranchSearch(e.target.value)} />
                                            </div>
                                            {branches.filter(b => b.branch_name.toLowerCase().includes(schedBranchSearch.toLowerCase())).map(b => (
                                                <Dropdown.Item key={b.branch_id} onClick={() => handleAddSchedBranch(b)}>
                                                    {b.branch_name}
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                    
                                    {/* BUBBLE LIST SCHEDULE */}
                                    <div className="d-flex flex-wrap gap-1">
                                        {schedSelectedBranches.map(b => (
                                            <Badge key={b.branch_id} bg="light" text="dark" className="border">
                                                {b.branch_name} <span style={{cursor:'pointer'}} className="text-danger ms-1" onClick={() => handleRemoveSchedBranch(b.branch_id)}>×</span>
                                            </Badge>
                                        ))}
                                    </div>
                                 </Form.Group>

                                 {/* PORT SELECTION SCHEDULE */}
                                 <Row className="mb-3">
                                    <Col xs={6}>
                                        <Form.Label className="small fw-bold text-muted">Mode Port</Form.Label>
                                        <Form.Select size="sm" value={schedPortMode} onChange={e => setSchedPortMode(e.target.value)}>
                                            <option value="group">Use Port Group</option>
                                            <option value="single">Single Port</option>
                                        </Form.Select>
                                    </Col>
                                    <Col xs={6}>
                                        <Form.Label className="small fw-bold text-muted">Detail Port</Form.Label>
                                        {schedPortMode === 'group' ? (
                                            <Form.Select size="sm" value={schedPortGroupId} onChange={e => setSchedPortGroupId(e.target.value)}>
                                                <option value="">- Pilih Group -</option>
                                                {portGroups.map(pg => <option key={pg.pg_id} value={pg.pg_id}>{pg.pg_name}</option>)}
                                            </Form.Select>
                                        ) : (
                                            <Form.Control size="sm" type="number" placeholder="80" value={schedManualPort} onChange={e => setSchedManualPort(e.target.value)} />
                                        )}
                                    </Col>
                                 </Row>

                                 <Row className="mb-4">
                                     <Col xs={6}>
                                         <Form.Label className="small fw-bold text-muted">Frekuensi</Form.Label>
                                         <Form.Select value={schedFreq} onChange={(e) => setSchedFreq(e.target.value)}>
                                             <option value="Hourly">Setiap Jam</option>
                                             <option value="Daily">Harian (Daily)</option>
                                             <option value="Weekly">Mingguan</option>
                                             <option value="Once">Sekali Jalan</option>
                                         </Form.Select>
                                     </Col>
                                     <Col xs={6}>
                                         <Form.Label className="small fw-bold text-muted">Jam (WIB)</Form.Label>
                                         <Form.Control type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)}/>
                                     </Col>
                                 </Row>

                                 <Button variant="success" className="w-100 fw-bold" onClick={handleSaveSchedule}>
                                     <Clock size={16} className="me-2"/> Simpan & Aktifkan
                                 </Button>
                             </Form>
                         </Card.Body>
                     </Card>
                 </Col>

                 {/* TABEL LIST JADWAL */}
                 <Col md={7}>
                     <Card className="border-0 shadow-sm">
                         <Card.Header className="bg-white border-bottom py-3">
                             <div className="d-flex align-items-center gap-2 text-dark">
                                 <Calendar size={18} />
                                 <h6 className="mb-0 fw-bold">Daftar Jadwal Aktif</h6>
                             </div>
                         </Card.Header>
                         <Card.Body className="p-0">
                             <Table hover responsive className="mb-0 align-middle">
                                 <thead className="bg-light text-secondary small text-uppercase">
                                     <tr>
                                         <th className="ps-4">Nama Jadwal</th>
                                         <th>Aturan</th>
                                         <th>Next Run</th>
                                         <th className="text-end pe-4">Aksi</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {schedules.map((item) => (
                                         <tr key={item.sch_id}>
                                             <td className="ps-4">
                                                 <div className="fw-bold text-dark">{item.sch_title}</div>
                                                 <Badge bg={item.sch_isActive ? "success" : "secondary"} className="text-white small">
                                                    {item.sch_isActive ? "Active" : "Paused"}
                                                 </Badge>
                                             </td>
                                             <td>
                                                 <div className="small text-muted">{item.sch_frequency}</div>
                                                 <div className="fw-bold font-monospace text-primary">{item.sch_time}</div>
                                             </td>
                                             <td className="small">
                                                 {item.sch_nextRun ? new Date(item.sch_nextRun).toLocaleString('id-ID') : '-'}
                                             </td>
                                             <td className="text-end pe-4">
                                                 <Button variant="light" size="sm" className="text-danger border" onClick={() => handleDeleteSchedule(item.sch_id)}>
                                                    <Trash2 size={14}/>
                                                 </Button>
                                             </td>
                                         </tr>
                                     ))}
                                     {schedules.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-muted">Belum ada jadwal.</td></tr>}
                                 </tbody>
                             </Table>
                         </Card.Body>
                     </Card>
                 </Col>
             </Row>
        </Tab>
      </Tabs>
    </div>
  );
}