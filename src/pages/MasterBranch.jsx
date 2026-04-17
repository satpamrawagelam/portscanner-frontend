import React, { useEffect, useState } from "react";
import { Card, Table, Button, Modal, Form, Badge, Spinner, InputGroup } from "react-bootstrap";
import { Network, Plus, Search, Edit2, Trash2, Save, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";

import API from "./API";

export default function MasterBranch() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); 

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formName, setFormName] = useState("");
  const [formCidr, setFormCidr] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/Branch/GetAll`);
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      toast.error("Gagal memuat data branch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormName("");
    setFormCidr("");
    setShowModal(true);
  };

  const handleOpenEdit = (branch) => {
    setIsEditing(true);
    setCurrentId(branch.branch_id);
    setFormName(branch.branch_name);
    setFormCidr(branch.branch_cidr || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName) return toast.warning("Nama Branch wajib diisi");
    if(formName.trim() == "") return toast.warning("Nama Branch tidak boleh kosong")
    if (formCidr.trim() == "") return toast.warning("CIDR tidak valid");

    if (formCidr && formCidr.trim() !== "") {
        // Regex untuk format CIDR IPv4 (x.x.x.x/xx)
        // ^(\d{1,3}\.){3}      -> 3 blok angka diikuti titik (misal 192.168.1.)
        // \d{1,3}              -> 1 blok angka terakhir (misal 0)
        // \/                   -> Garis miring
        // (3[0-2]|[1-2]?[0-9]) -> Angka subnet 0-32
        const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/(3[0-2]|[1-2]?[0-9])$/;

        if (!cidrRegex.test(formCidr)) {
            return toast.warn("Format CIDR salah! Contoh: 192.168.1.0/24");
        }

        // Validasi tambahan: Pastikan setiap blok IP (octet) <= 255
        const ipPart = formCidr.split('/')[0];
        const octets = ipPart.split('.');
        if (octets.some(octet => parseInt(octet) > 255)) {
            return toast.warn("IP Address tidak valid (Angka melebihi 255)!");
        }
    }

    setSaving(true);
    const payload = { Branch_name: formName, Branch_cidr: formCidr };
    
    try {
      let url = isEditing ? `${API}/Branch/Update/${currentId}` : `${API}/Branch/Create`;
      let method = "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error();

      toast.success(isEditing ? "Branch berhasil diupdate" : "Branch berhasil ditambahkan");
      setShowModal(false);
      loadData();
    } catch {
      toast.error("Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
        const res = await fetch(`${API}/Branch/Delete/${id}`, { method: 'POST' });
        if(!res.ok) throw new Error();
        toast.success("Branch dihapus");
        loadData();
    } catch {
        toast.error("Gagal menghapus branch");
    }
  };

  const ipToLong = (ip) => {
      return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  };

  const isIpInCidr = (ip, cidr) => {
      if (!ip || !cidr || !cidr.includes('/')) return false;
      
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipv4Regex.test(ip)) return false;
      if (ip.split('.').some(octet => parseInt(octet) > 255)) return false;

      const [subnet, maskLength] = cidr.split('/');
      const mask = parseInt(maskLength, 10);
      
      if(isNaN(mask) || mask < 0 || mask > 32) return false;
      if (!ipv4Regex.test(subnet)) return false;

      const ipLong = ipToLong(ip);
      const subnetLong = ipToLong(subnet);
      
      const maskLong = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
      
      return (ipLong & maskLong) === (subnetLong & maskLong);
  };

  const filteredData = branches.filter(b => {
      const searchLower = searchTerm.trim().toLowerCase();
      
      const matchNameOrCidr = 
          b.branch_name.toLowerCase().includes(searchLower) ||
          (b.branch_cidr && b.branch_cidr.toLowerCase().includes(searchLower));

      let matchIpInCidr = false;
      if (b.branch_cidr && searchLower) {
          matchIpInCidr = isIpInCidr(searchLower, b.branch_cidr);
      }
      
      return matchNameOrCidr || matchIpInCidr;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const renderPagination = (currPage, setPage, totalPages) => {
    if (totalPages <= 1) return null;

    let pages = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currPage > 3) pages.push("...");
        
        let start = Math.max(2, currPage - 1);
        let end = Math.min(totalPages - 1, currPage + 1);

        if (currPage <= 3) end = Math.min(totalPages - 1, 4);
        if (currPage >= totalPages - 2) start = Math.max(2, totalPages - 3);

        for (let i = start; i <= end; i++) pages.push(i);
        
        if (currPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);
    }

    return (
        <div className="d-flex align-items-center gap-1">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={currPage === 1} 
              className="px-2"
            >
              <ChevronLeft size={16}/>
            </Button>

            {pages.map((p, idx) => (
                <Button 
                  key={idx} 
                  variant={p === currPage ? "primary" : "outline-secondary"} 
                  size="sm" 
                  className="px-3 fw-bold" 
                  onClick={() => typeof p === 'number' && setPage(p)} 
                  disabled={p === "..."} 
                  style={{minWidth: '35px'}}
                >
                  {p}
                </Button>
            ))}

            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={currPage === totalPages} 
              className="px-2"
            >
              <ChevronRight size={16}/>
            </Button>
        </div>
    );
  };

  return (
    <div className="animate__animated animate__fadeIn">
      <ToastContainer position="bottom-right" autoClose={3000} />
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
           <h3 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <Network className="text-primary"/> Master Branch
           </h3>
           <p className="text-muted mb-0 small">Kelola data cabang dan segmentasi IP.</p>
        </div>
        <Button onClick={handleOpenAdd} className="d-flex align-items-center gap-2 shadow-sm fw-bold">
            <Plus size={18}/> Tambah Branch
        </Button>
      </div>

      {/* CONTENT CARD */}
      <Card className="card-enterprise border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
                <InputGroup style={{ maxWidth: '300px' }}>
                    <InputGroup.Text className="bg-light border-end-0"><Search size={16} className="text-muted"/></InputGroup.Text>
                    <Form.Control 
                        placeholder="Cari branch atau CIDR..." 
                        className="border-start-0 bg-light ps-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </InputGroup>
                
                {/* Dropdown Limit per Page */}
                <Form.Select 
                    size="sm" 
                    style={{width: 'auto'}} 
                    value={itemsPerPage} 
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                >
                    <option value="5">5 Data</option>
                    <option value="10">10 Data</option>
                    <option value="20">20 Data</option>
                </Form.Select>
            </div>
        </Card.Header>
        
        <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
                <thead className="bg-light text-secondary small text-uppercase">
                    <tr>
                        <th className="ps-4" style={{width: '50px'}}>No</th>
                        <th>Nama Branch</th>
                        <th>CIDR Network</th>
                        <th className="text-end pe-4" style={{width: '150px'}}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="4" className="text-center py-5"><Spinner size="sm"/> Loading...</td></tr>
                    ) : currentItems.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-5 text-muted">Data tidak ditemukan.</td></tr>
                    ) : (
                        currentItems.map((b, i) => (
                            <tr key={b.branch_id}>
                                {/* Rumus No: Index Awal + Index Loop + 1 */}
                                <td className="ps-4 text-muted small">{indexOfFirstItem + i + 1}</td>
                                <td className="fw-bold text-dark">{b.branch_name}</td>
                                <td>
                                    {b.branch_cidr ? (
                                        <Badge bg="info" className="bg-opacity-10 text-info border border-info px-2 py-1">
                                            <Globe size={12} className="me-1"/> {b.branch_cidr}
                                        </Badge>
                                    ) : <span className="text-muted small">-</span>}
                                </td>
                                <td className="text-end pe-4">
                                    <div className="d-flex justify-content-end gap-1">
                                        <Button size="sm" variant="light" className="text-warning border" onClick={() => handleOpenEdit(b)}>
                                            <Edit2 size={14}/>
                                        </Button>
                                        <Button size="sm" variant="light" className="text-danger border" 
                                        onClick={() => Swal.fire({
                                            title: "Hapus Branch?",
                                            text: "Data tidak bisa dikembalikan!",
                                            icon: "warning",
                                            showCancelButton: true,
                                            confirmButtonColor: "#d33",
                                            confirmButtonText: "Ya, Hapus!"
                                        }).then((res) => {
                                            if (res.isConfirmed) handleDelete(b.branch_id);
                                        })}>
                                            <Trash2 size={14}/>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </div>

        {/* FOOTER & PAGINATION (UPDATED) */}
        <Card.Footer className="bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="text-muted small">
                Menampilkan <strong>{filteredData.length > 0 ? indexOfFirstItem + 1 : 0}</strong> - <strong>{Math.min(indexOfLastItem, filteredData.length)}</strong> dari <strong>{filteredData.length}</strong> data
            </div>
            
            {/* Logic Tombol Pagination Baru */}
            {renderPagination(currentPage, setCurrentPage, totalPages)}
        </Card.Footer>
      </Card>

      {/* MODAL ADD/EDIT */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                {isEditing ? <Edit2 size={20} className="text-warning"/> : <Plus size={20} className="text-primary"/>}
                {isEditing ? "Edit Branch" : "Tambah Branch Baru"}
            </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Nama Cabang <span className="text-danger">*</span></Form.Label>
                    <InputGroup>
                        <InputGroup.Text className="bg-light"><Network size={16}/></InputGroup.Text>
                        <Form.Control 
                            placeholder="Contoh: Kantor Pusat, Cabang Surabaya"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            autoFocus
                        />
                    </InputGroup>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">CIDR / IP Range</Form.Label>
                    <InputGroup>
                        <InputGroup.Text className="bg-light"><Globe size={16}/></InputGroup.Text>
                        <Form.Control 
                            placeholder="Contoh: 192.168.1.0/24"
                            value={formCidr}
                            onChange={(e) => setFormCidr(e.target.value)}
                        />
                    </InputGroup>
                    <Form.Text className="text-muted small">
                        Opsional. Digunakan untuk referensi segmentasi jaringan.
                    </Form.Text>
                </Form.Group>
            </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving} className="fw-bold px-4">
                {saving ? <Spinner size="sm" animation="border"/> : <><Save size={16} className="me-2"/> Simpan</>}
            </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}