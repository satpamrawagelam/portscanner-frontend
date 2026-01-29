import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Table, Button, Form, Badge, Spinner, InputGroup } from "react-bootstrap";
import { ArrowLeft, Save, Trash2, Edit2, X, Plus, Server, Tag, AlertTriangle, Search, Upload } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";

const API = "http://localhost:7155/api"; 

export default function MasterPort() {
  const { id } = useParams(); 
  const groupId = id; 
  const navigate = useNavigate();
  
  const fileInputRef = useRef(null);

  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
   
  const [isAdding, setIsAdding] = useState(false);
  const [newPort, setNewPort] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSeverity, setNewSeverity] = useState("Low"); 
  const [isProcessing, setIsProcessing] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editPort, setEditPort] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSeverity, setEditSeverity] = useState("Low");

  const loadData = () => {
    setLoading(true);
    fetch(`${API}/Port/GetByGroup/${groupId}`)
      .then(res => res.json())
      .then(data => setPorts(data))
      .catch(() => toast.error("Gagal memuat data port"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if(groupId) loadData();
  }, [groupId]);

  const handleAdd = async () => {
    if (!newPort) return toast.warn("Nomor Port wajib diisi");
    if (newDesc.trim() == "") return toast.warn("Deskripsi tidak valid") 
    
    const isExist = ports.some(p => p.pm_portNumber === Number(newPort));
    if (isExist) return toast.error(`Port ${newPort} sudah ada di group ini!`);

    setIsProcessing(true);
    try {
        await createPortAPI(Number(newPort), newDesc, newSeverity);
        toast.success("Port berhasil ditambahkan");
        
        setNewPort("");
        setNewDesc("");
        setNewSeverity("Low");
        setIsAdding(false);
        loadData(); 
    } catch (e) {
        toast.error("Gagal menyimpan port");
    } finally {
        setIsProcessing(false);
    }
  };

  const createPortAPI = async (portNum, desc, severity) => {
    const res = await fetch(`${API}/Port/Create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            Pm_portGroup: Number(groupId),
            Pm_portNumber: portNum,
            Pm_desc: desc || "",
            Pm_severity: severity || "Medium" // Default Medium jika null
        })
    });
    if (!res.ok) throw new Error("API Error");
    return res;
  };

  // --- MODIFIED FILE UPLOAD LOGIC ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    event.target.value = null;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/);
        
        let successCount = 0;
        let failCount = 0;

        setIsProcessing(true);
        const loadingToast = toast.loading("Sedang mengimport data...");

        for (const line of lines) {
            if (!line.trim()) continue;

            const parts = line.split(',');

            if (parts.length >= 1) {
                // 1. Ambil Port
                const pPort = Number(parts[0].trim());
                
                // 2. Ambil Deskripsi (jika ada)
                const pDesc = parts[1] ? parts[1].trim() : "";
                
                // 3. Ambil Severity (LOGIC BARU)
                // Jika kolom ke-3 ada dan tidak kosong, pakai itu. Jika tidak, otomatis "Medium".
                let inputSeverity = (parts[2] && parts[2].trim() !== "") ? parts[2].trim() : "Medium";
                
                const validSeverities = ["Low", "Medium", "High"];
                
                // Cari kecocokan (case insensitive), kalau typo/salah ketik balikin ke Medium
                let pSeverity = validSeverities.find(s => s.toLowerCase() === inputSeverity.toLowerCase()) || "Medium";

                if (!isNaN(pPort) && pPort > 0) {
                    const isExist = ports.some(p => p.pm_portNumber === pPort);
                    
                    if (!isExist) {
                        try {
                            await createPortAPI(pPort, pDesc, pSeverity);
                            successCount++;
                        } catch (err) {
                            failCount++;
                        }
                    } else {
                        failCount++; // Duplicate
                    }
                } else {
                    failCount++; // Invalid Port
                }
            }
        }

        toast.dismiss(loadingToast);
        setIsProcessing(false);

        if (successCount > 0) {
            Swal.fire({
                icon: 'success',
                title: 'Import Selesai',
                text: `Berhasil import: ${successCount}, Gagal/Duplikat: ${failCount}`
            });
            loadData();
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Import Gagal',
                text: `Tidak ada data yang berhasil diimport. Pastikan format: Port,Deskripsi,(Opsional:Severity)`
            });
        }
    };
    reader.readAsText(file);
  };

  const handleUpdate = async () => {
     if(!editPort) return toast.warn("Port tidak boleh kosong");
     
     try {
        const res = await fetch(`${API}/Port/Update/${editId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Pm_portNumber: Number(editPort),
                Pm_desc: editDesc,
                Pm_severity: editSeverity 
            })
        });
        if(!res.ok) throw new Error();
        
        toast.success("Update berhasil");
        setEditId(null);
        loadData();
     } catch {
        toast.error("Gagal update");
     }
  };

  const handleDelete = async (pid) => {
    try {
        await fetch(`${API}/Port/Delete/${pid}`, { method: "POST" });
        toast.success("Port dihapus");
        loadData();
    } catch {
        toast.error("Gagal hapus");
    }
  };

  const getSeverityBadge = (sev) => {
      switch(sev) {
          case 'High': return 'danger';
          case 'Medium': return 'warning';
          default: return 'info';
      }
  };

  const filteredPorts = ports.filter(p => 
    p.pm_portNumber.toString().includes(searchTerm) || 
    (p.pm_desc && p.pm_desc.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate__animated animate__fadeIn">
        <ToastContainer position="top-right" autoClose={3000} />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
            <Button variant="light" className="border shadow-sm" onClick={() => navigate("/mastergroup")}> 
                <ArrowLeft size={18}/>
            </Button>
            <div>
                <h3 className="fw-bold text-dark mb-0">Detail Port</h3>
                <p className="text-muted mb-0 small">Manage port untuk Group ID: <strong>{groupId}</strong></p>
            </div>
        </div>
        
        <div className="d-flex gap-2">
            <input 
                type="file" 
                accept=".txt" 
                ref={fileInputRef} 
                style={{display: 'none'}} 
                onChange={handleFileUpload}
            />
            <Button 
                variant="success" 
                className="d-flex align-items-center gap-2 fw-bold shadow-sm text-white"
                onClick={() => fileInputRef.current.click()}
                disabled={isProcessing}
            >
                <Upload size={18}/> Import TXT
            </Button>
            <Button 
                variant={isAdding ? "danger" : "primary"}
                className="d-flex align-items-center gap-2 fw-bold shadow-sm"
                onClick={() => setIsAdding(!isAdding)}
                disabled={isProcessing}
            >
                {isAdding ? <X size={18}/> : <Plus size={18}/>}
                {isAdding ? "Batal" : "Tambah Port"}
            </Button>
        </div>
      </div>

      {isAdding && (
        <Card className="card-enterprise mb-4 border-primary border-2 shadow-sm bg-white">
            <Card.Header className="bg-primary bg-opacity-10 border-bottom-0 py-3">
                <h6 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                    <Server size={18}/> Input Data Port Baru
                </h6>
            </Card.Header>
            <Card.Body>
                <div className="row g-3 align-items-end">
                    <div className="col-md-2">
                        <Form.Label className="small fw-bold text-muted">No. Port <span className="text-danger">*</span></Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light"><Server size={16}/></InputGroup.Text>
                            <Form.Control 
                                type="number" 
                                placeholder="80" 
                                value={newPort}
                                onChange={(e) => setNewPort(e.target.value)}
                                className="fw-bold"
                                autoFocus
                            />
                        </InputGroup>
                    </div>
                    <div className="col-md-3">
                        <Form.Label className="small fw-bold text-muted">Risk Level</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light"><AlertTriangle size={16}/></InputGroup.Text>
                            <Form.Select 
                                value={newSeverity} 
                                onChange={(e) => setNewSeverity(e.target.value)}
                                className="fw-semibold"
                            >
                                <option value="Low">Low (Aman)</option>
                                <option value="Medium">Medium (Waspada)</option>
                                <option value="High">High (Bahaya)</option>
                            </Form.Select>
                        </InputGroup>
                    </div>
                    <div className="col-md-4">
                        <Form.Label className="small fw-bold text-muted">Deskripsi</Form.Label>
                        <InputGroup>
                             <InputGroup.Text className="bg-light"><Tag size={16}/></InputGroup.Text>
                             <Form.Control 
                                type="text" 
                                placeholder="Contoh: Web Server HTTP" 
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                    <div className="col-md-3">
                         <Button 
                            variant="primary" 
                            className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                            onClick={handleAdd}
                            disabled={!newPort || isProcessing}
                        >
                            {isProcessing ? <Spinner size="sm"/> : <Save size={18}/>}
                            Simpan
                        </Button>
                    </div>
                </div>
            </Card.Body>
        </Card>
      )}

      <Card className="card-enterprise border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
            <InputGroup style={{ maxWidth: '300px' }}>
                <InputGroup.Text className="bg-light border-end-0"><Search size={16} className="text-muted"/></InputGroup.Text>
                <Form.Control 
                    placeholder="Cari port atau deskripsi..." 
                    className="border-start-0 bg-light ps-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>
        </Card.Header>
        
        <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
                <thead className="bg-light text-secondary small text-uppercase">
                    <tr>
                        <th className="ps-4 text-center" style={{width: '60px'}}>No</th>
                        <th style={{width: '120px'}} className="text-center">Port</th>
                        <th style={{width: '150px'}} className="text-center">Severity</th>
                        <th>Description</th>
                        <th className="text-end pe-4" style={{width: '150px'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="5" className="text-center py-4"><Spinner size="sm" className="me-2"/> Loading data...</td></tr>
                    ) : filteredPorts.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-5 text-muted">Data tidak ditemukan.</td></tr>
                    ) : (
                        filteredPorts.map((p, i) => (
                            <tr key={p.pm_id}>
                                <td className="text-center text-muted small">{i + 1}</td>
                                
                                <td className="text-center">
                                    {editId === p.pm_id ? (
                                        <Form.Control 
                                            type="number" size="sm" className="text-center fw-bold"
                                            value={editPort} onChange={(e) => setEditPort(e.target.value)}
                                        />
                                    ) : (
                                        <Badge bg="light" text="dark" className="border px-3 py-2 fs-6">
                                            {p.pm_portNumber}
                                        </Badge>
                                    )}
                                </td>

                                <td className="text-center">
                                    {editId === p.pm_id ? (
                                        <Form.Select 
                                            size="sm"
                                            value={editSeverity}
                                            onChange={(e) => setEditSeverity(e.target.value)}
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </Form.Select>
                                    ) : (
                                        <Badge bg={getSeverityBadge(p.pm_severity)} className="px-3">
                                            {p.pm_severity || "Low"}
                                        </Badge>
                                    )}
                                </td>

                                <td>
                                    {editId === p.pm_id ? (
                                        <Form.Control 
                                            size="sm" value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                                        />
                                    ) : (
                                        <span className={p.pm_desc ? "text-dark" : "text-muted fst-italic"}>
                                            {p.pm_desc || "-"}
                                        </span>
                                    )}
                                </td>

                                <td className="text-end pe-4">
                                    {editId === p.pm_id ? (
                                        <div className="d-flex gap-1 justify-content-end">
                                            <Button size="sm" variant="success" onClick={handleUpdate}><Save size={14}/></Button>
                                            <Button size="sm" variant="secondary" onClick={() => setEditId(null)}><X size={14}/></Button>
                                        </div>
                                    ) : (
                                        <div className="d-flex gap-1 justify-content-end">
                                            <Button 
                                                size="sm" variant="light" className="text-warning border"
                                                onClick={() => {
                                                    setEditId(p.pm_id);
                                                    setEditPort(p.pm_portNumber);
                                                    setEditDesc(p.pm_desc);
                                                    setEditSeverity(p.pm_severity || "Low");
                                                }}
                                            >
                                                <Edit2 size={14}/>
                                            </Button>
                                            <Button 
                                                size="sm" variant="light" className="text-danger border"
                                                onClick={() => Swal.fire({
                                                    title: "Hapus Port?",
                                                    text: "Data tidak bisa dikembalikan!",
                                                    icon: "warning",
                                                    showCancelButton: true,
                                                    confirmButtonColor: "#d33",
                                                    confirmButtonText: "Ya, Hapus!"
                                                }).then((res) => {
                                                    if (res.isConfirmed) handleDelete(p.pm_id);
                                                })}
                                            >
                                                <Trash2 size={14}/>
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </div>

        <Card.Footer className="bg-white text-muted small py-3">
            Total: <strong>{filteredPorts.length}</strong> port terdaftar.
        </Card.Footer>
      </Card>
    </div>
  );
}