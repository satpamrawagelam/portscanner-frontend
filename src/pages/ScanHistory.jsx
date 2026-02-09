import React, { useEffect, useState, useRef } from "react";
import { Card, Table, Badge, Form, InputGroup, Spinner, Button, Tabs, Tab } from "react-bootstrap";
import { FileText, Search, Calendar, Server, Globe, ShieldAlert, CheckCircle, ChevronLeft, ChevronRight, Clock, Play, Download } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useSearchParams } from "react-router-dom"; 

import API from "./API";

export default function ScanHistory() {
    const [rawData, setRawData] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState("manual"); 
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    const [searchParams] = useSearchParams();
    const filterSchId = searchParams.get("schId"); 
    const toastShownRef = useRef(false);

    useEffect(() => {
        toastShownRef.current = false;
    }, [filterSchId]);

    useEffect(() => {
        fetch(`${API}/History/GetHistory`) 
            .then((res) => res.json())
            .then((result) => setRawData(result))
            .catch((err) => toast.error("Gagal memuat history"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (filterSchId) {
            setActiveTab("scheduled");
            
            fetch(`${API}/Schedule/Get/${filterSchId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.sch_title) {
                        setSearchTerm(data.sch_title);
                        if(!toastShownRef.current){
                            toast.info(`Memfilter hasil untuk: ${data.sch_title}`);
                            toastShownRef.current = true;
                        }
                    }
                })
                .catch(err => console.error("Gagal load filter info", err))
                .finally(() => setLoading(false));
        }
    }, [filterSchId]);

    useEffect(() => {
        setCurrentPage(1);
        if (!filterSchId) {
            //  setSearchTerm("");
        }
    }, [activeTab, filterSchId]);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const getFilteredData = () => {
        let tabData = rawData;
        
        if (activeTab === "manual") {
            tabData = rawData.filter(item => item.scanType !== 'Scheduled Scan');
        } else {
            tabData = rawData.filter(item => item.scanType === 'Scheduled Scan');
        }

        if (!searchTerm) return tabData;

        const term = searchTerm.toLowerCase();
        return tabData.filter(item => {
            const dateStr = formatDate(item.scanDate).toLowerCase();
            return (
                (item.branchName || "").toLowerCase().includes(term) ||
                (item.ipAddress || "").includes(term) ||
                (item.scanTitle || "").toLowerCase().includes(term) || 
                dateStr.includes(term) 
            );
        });
    };

    const filteredData = getFilteredData();

    const exportToCsv = () => {
        if (filteredData.length === 0) {
            toast.warn("Tidak ada data untuk diexport");
            return;
        }

        const headers = ["No,Waktu Scan,Judul Scan,Tipe Scan,Branch Name,IP Address,Open Ports"];
        const rows = filteredData.map((item, index) => {
            const clean = (text) => `"${String(text || "").replace(/"/g, '""')}"`;
            const dateFormatted = formatDate(item.scanDate);

            return [
                index + 1,
                clean(dateFormatted),
                clean(item.scanTitle),
                clean(item.scanType || "Manual Scan"),
                clean(item.branchName),
                clean(item.ipAddress),
                clean(item.openPorts)
            ].join(",");
        });

        const csvContent = [headers, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `History_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Berhasil export ${filteredData.length} data ke CSV`);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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
                <Button variant="outline-secondary" size="sm" className="px-2" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={16}/></Button>
                {pages.map((p, idx) => (
                    <Button key={idx} variant={p === currentPage ? "primary" : "outline-secondary"} size="sm" className="px-3 fw-bold" onClick={() => typeof p === 'number' && setCurrentPage(p)} disabled={p === "..."} style={{minWidth: '35px'}}>{p}</Button>
                ))}
                <Button variant="outline-secondary" size="sm" className="px-2" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={16}/></Button>
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
                    <Button 
                        variant="success" 
                        size="sm" 
                        className="d-flex align-items-center gap-2 fw-bold px-3 text-white"
                        onClick={exportToCsv}
                        title="Export data yang tampil ke Excel/CSV"
                    >
                        <Download size={16} /> Export CSV
                    </Button>

                    <InputGroup style={{ maxWidth: '250px' }} size="sm">
                        <InputGroup.Text className="bg-light border-end-0"><Search size={16} className="text-muted"/></InputGroup.Text>
                        <Form.Control 
                            placeholder="Cari Waktu / IP..." 
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
                            <th className="ps-4 text-center" style={{width: '50px'}}>No</th>
                            <th style={{width: '180px'}}>Waktu Scan</th>
                            <th>Informasi Scan</th>
                            <th>Branch & IP</th>
                            <th>Open Ports Found</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-5"><Spinner size="sm"/> Memuat Data...</td></tr>
                        ) : currentItems.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-5 text-muted">Data tidak ditemukan.</td></tr>
                        ) : (
                            currentItems.map((item, index) => (
                                <tr key={index}>
                                    <td className="text-center text-muted small">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold text-dark" style={{fontSize: '14px'}}>
                                                {formatDate(item.scanDate).split(' pukul ')[0]}
                                            </span>
                                            <small className="text-muted d-flex align-items-center gap-1">
                                                <Calendar size={12}/> {new Date(item.scanDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
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
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <Server size={14} className="text-secondary"/>
                                            <span className="fw-bold text-dark">{item.branchName}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <Globe size={14} className="text-muted"/>
                                            <span className="text-muted font-monospace">{item.ipAddress}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-start gap-2">
                                            {item.openPorts === '-' || item.openPorts === '0' ? (
                                                <>
                                                    <CheckCircle size={16} className="text-success mt-1 flex-shrink-0"/>
                                                    <span className="text-success fw-bold font-monospace">All Closed</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldAlert size={16} className="text-danger mt-1 flex-shrink-0"/>
                                                    <span className="text-danger fw-bold font-monospace text-wrap" style={{maxWidth: '300px'}}>
                                                        {item.openPorts}
                                                    </span>
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
                    Menampilkan {filteredData.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredData.length)} dari {filteredData.length} data.
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
                    <FileText size={24} className="text-primary"/>
                </div>
                <div>
                    <h3 className="fw-bold text-dark mb-0">Scan History Log</h3>
                    <p className="text-muted mb-0 small">Riwayat temuan port terbuka (Vulnerability Report).</p>
                </div>
            </div>

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-0 border-bottom-0" fill>
                <Tab eventKey="manual" title={<span className="fw-bold d-flex align-items-center justify-content-center gap-2 py-2"><Play size={16}/> Riwayat Manual Scan</span>}>
                    {historyTableContent}
                </Tab>
                <Tab eventKey="scheduled" title={<span className="fw-bold d-flex align-items-center justify-content-center gap-2 py-2"><Clock size={16}/> Riwayat Scheduled Scan</span>}>
                    {historyTableContent}
                </Tab>
            </Tabs>
        </div>
    );
}