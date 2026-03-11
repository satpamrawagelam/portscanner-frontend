import React, { useEffect, useState, useRef, useCallback } from "react";
import { Card, Table, Badge, Form, InputGroup, Spinner, Button, Tabs, Tab, Modal } from "react-bootstrap";
import { FileText, Search, Calendar, Server, Globe, ShieldAlert, CheckCircle, ChevronLeft, ChevronRight, Clock, Play, Download, Wifi, WifiOff } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useSearchParams } from "react-router-dom";

import API from "./API";

export default function ScanHistory() {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState("manual");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [showPortsModal, setShowPortsModal] = useState(false);
    const [selectedPorts, setSelectedPorts] = useState("");
    const [selectedIpTitle, setSelectedIpTitle] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const itemsPerPage = 10;

    const [searchParams] = useSearchParams();
    const filterSchId = searchParams.get("schId");
    const toastShownRef = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        toastShownRef.current = false;
        if (filterSchId) {
            setActiveTab("scheduled");
            fetch(`${API}/Schedule/Get/${filterSchId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.sch_title) {
                        setSearchTerm(data.sch_title);
                        if (!toastShownRef.current) {
                            toast.info(`Memfilter hasil untuk: ${data.sch_title}`);
                            toastShownRef.current = true;
                        }
                    }
                })
                .catch(err => console.error("Gagal load filter info", err));
        }
    }, [filterSchId]);

    const fetchHistoryData = useCallback(() => {
        setLoading(true);
        const url = `${API}/History/GetHistory?scanType=${activeTab}&page=${currentPage}&pageSize=${itemsPerPage}&search=${encodeURIComponent(debouncedSearch)}`;

        fetch(url)
            .then((res) => res.json())
            .then((result) => {
                setHistoryData(result.data);
                setTotalPages(result.totalPages);
                setTotalRecords(result.totalRecords);
            })
            .catch((err) => toast.error("Gagal memuat history"))
            .finally(() => setLoading(false));
    }, [activeTab, currentPage, debouncedSearch]);

    useEffect(() => {
        fetchHistoryData();
    }, [fetchHistoryData]);

    const handleTabChange = (k) => {
        setActiveTab(k);
        setCurrentPage(1);
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const exportToCsv = async () => {
        toast.info("Menyiapkan file CSV...");
        try {
            const url = `${API}/History/GetHistory?scanType=${activeTab}&page=1&pageSize=10000&search=${encodeURIComponent(debouncedSearch)}`;
            const res = await fetch(url);
            const result = await res.json();

            if (!result.data || result.data.length === 0) {
                toast.warn("Tidak ada data untuk diexport");
                return;
            }

            const headers = ["No,Waktu Scan,Judul Scan,Tipe Scan,Branch Name,IP Address,Open Ports"];
            const rows = result.data.map((item, index) => {
                const clean = (text) => `"${String(text || "").replace(/"/g, '""')}"`;
                const dateFormatted = formatDate(item.scanDate);
                return [
                    index + 1, clean(dateFormatted), clean(item.scanTitle),
                    clean(item.scanType || "Manual Scan"), clean(item.branchName),
                    clean(item.ipAddress), clean(item.openPorts)
                ].join(",");
            });

            const csvContent = [headers, ...rows].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", `History_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Berhasil export data ke CSV`);
        } catch (error) {
            toast.error("Gagal export CSV");
        }
    };

    const renderPagination = () => {
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
                <Button variant="outline-secondary" size="sm" className="px-2" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={16} /></Button>
                {pages.map((p, idx) => (
                    <Button key={idx} variant={p === currentPage ? "primary" : "outline-secondary"} size="sm" className="px-3 fw-bold" onClick={() => typeof p === 'number' && setCurrentPage(p)} disabled={p === "..."} style={{ minWidth: '35px' }}>{p}</Button>
                ))}
                <Button variant="outline-secondary" size="sm" className="px-2" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={16} /></Button>
            </div>
        );
    };

    const historyTableContent = (
        <Card className="card-enterprise border-0 shadow-sm mt-3">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2 fw-bold text-secondary">
                    <ShieldAlert size={18} />
                    {activeTab === 'manual' ? 'Daftar Temuan Manual Scan' : 'Daftar Temuan Scheduled Scan'}
                </div>
                <div className="d-flex gap-2">
                    <Button variant="success" size="sm" className="d-flex align-items-center gap-2 fw-bold px-3 text-white" onClick={exportToCsv}>
                        <Download size={16} /> Export CSV
                    </Button>

                    <InputGroup style={{ maxWidth: '250px' }} size="sm">
                        <InputGroup.Text className="bg-light border-end-0"><Search size={16} className="text-muted" /></InputGroup.Text>
                        <Form.Control
                            placeholder="Cari Waktu / IP / Judul..."
                            className="border-start-0 bg-light ps-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </div>
            </Card.Header>

            <Card.Body className="p-0">
                <Table hover responsive className="mb-0 align-middle">
                    <thead className="bg-light text-secondary small text-uppercase">
                        <tr>
                            <th className="ps-4 text-center" style={{ width: '50px' }}>No</th>
                            <th style={{ width: '180px' }}>Waktu Scan</th>
                            <th>Informasi Scan</th>
                            <th>Branch & IP</th>
                            <th>Open Ports Found</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-5"><Spinner size="sm" className="me-2" /> Memuat Data...</td></tr>
                        ) : historyData.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-5 text-muted">Data tidak ditemukan.</td></tr>
                        ) : (
                            historyData.map((item, index) => (
                                <tr key={index}>
                                    <td className="text-center text-muted small">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>
                                                {formatDate(item.scanDate).split(' pukul ')[0]}
                                            </span>
                                            <small className="text-muted d-flex align-items-center gap-1">
                                                <Calendar size={12} /> {new Date(item.scanDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </small>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="fw-bold text-dark">{item.scanTitle}</div>
                                        <Badge bg={item.scanType === 'Scheduled Scan' ? 'info' : 'secondary'} className="fw-normal mt-1 bg-opacity-75">
                                            {item.scanType || 'Manual Scan'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <Server size={14} className="text-secondary" />
                                                <span className="fw-bold text-dark">{item.branchName}</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <Globe size={14} className="text-secondary" />
                                                <span className="font-monospace text-muted small me-2">{item.ipAddress}</span>
                                                {item.hostStatus === true ? (
                                                    <Badge bg="success" className="d-flex align-items-center gap-1" style={{ fontSize: '9px', padding: '4px 6px' }}><Wifi size={10} /> UP</Badge>
                                                ) : (
                                                    <Badge bg="secondary" className="d-flex align-items-center gap-1 opacity-75" style={{ fontSize: '9px', padding: '4px 6px' }}><WifiOff size={10} /> DOWN</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-start gap-2">
                                            {item.openPorts === '-' || item.openPorts === '0' || item.openPorts === '' || item.openPorts === null ? (
                                                <>
                                                    <CheckCircle size={16} className="text-success mt-1 flex-shrink-0" />
                                                    <span className="text-success fw-bold font-monospace">All Closed</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldAlert size={16} className="text-danger mt-1 flex-shrink-0" />
                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                        <span className="text-danger fw-bold font-monospace text-wrap" style={{ maxWidth: '300px' }}>
                                                            {(() => {
                                                                const portsArr = item.openPorts.split(',').map(p => p.trim()).filter(p => p);
                                                                if (portsArr.length > 3) {
                                                                    return portsArr.slice(0, 3).join(', ') + ' ...';
                                                                }
                                                                return item.openPorts;
                                                            })()}
                                                        </span>
                                                        {item.openPorts && item.openPorts.split(',').filter(p => p.trim()).length > 3 && (
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                className="py-0 px-2 fw-bold"
                                                                style={{ fontSize: '11px', borderRadius: '12px' }}
                                                                onClick={() => {
                                                                    setSelectedPorts(item.openPorts);
                                                                    setSelectedIpTitle(item.ipAddress);
                                                                    setShowPortsModal(true);
                                                                }}
                                                            >
                                                                Detail
                                                            </Button>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card.Body>

            <Card.Footer className="bg-white py-3 d-flex justify-content-between align-items-center">
                <div className="text-muted small">
                    Total: <strong className="text-dark">{totalRecords}</strong> data.
                </div>
                {renderPagination()}
            </Card.Footer>
        </Card>
    );

    return (
        <div className="animate__animated animate__fadeIn">
            <ToastContainer position="bottom-right" autoClose={3000} />
            <div className="d-flex align-items-center gap-3 mb-4">
                <div className="bg-primary bg-opacity-10 p-2 rounded">
                    <FileText size={24} className="text-primary" />
                </div>
                <div>
                    <h3 className="fw-bold text-dark mb-0">Scan History Log</h3>
                    <p className="text-muted mb-0 small">Riwayat temuan port terbuka (Vulnerability Report).</p>
                </div>
            </div>

            <Tabs activeKey={activeTab} onSelect={handleTabChange} className="mb-0 border-bottom-0" fill>
                <Tab eventKey="manual" title={<span className="fw-bold d-flex align-items-center justify-content-center gap-2 py-2"><Play size={16} /> Riwayat Manual Scan</span>}>
                    {historyTableContent}
                </Tab>
                <Tab eventKey="scheduled" title={<span className="fw-bold d-flex align-items-center justify-content-center gap-2 py-2"><Clock size={16} /> Riwayat Scheduled Scan</span>}>
                    {historyTableContent}
                </Tab>
            </Tabs>

            <Modal show={showPortsModal} onHide={() => setShowPortsModal(false)} centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2 text-danger">
                        <ShieldAlert size={20} /> Detail Open Ports
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <div className="mb-3 d-flex flex-column">
                        <span className="text-muted small fw-bold text-uppercase">Target IP Address</span>
                        <span className="font-monospace fs-5 fw-bold text-dark">{selectedIpTitle}</span>
                    </div>
                    <hr />
                    <div className="d-flex flex-wrap gap-2 mt-3">
                        {selectedPorts.split(',').map(p => p.trim()).filter(p => p).map((p, idx) => (
                            <Badge key={idx} bg="danger" className="px-3 py-2 font-monospace shadow-sm" style={{ fontSize: '14px', borderRadius: '8px' }}>
                                Port {p}
                            </Badge>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}