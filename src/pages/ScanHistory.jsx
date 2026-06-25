import React, { useEffect, useState, useRef, useCallback } from "react";
import { Card, Table, Badge, Form, InputGroup, Spinner, Button, Tabs, Tab, Modal } from "react-bootstrap";
import { FileText, Search, Calendar, Server, Globe, ShieldAlert, CheckCircle, ChevronLeft, ChevronRight, Clock, Play, Download, Wifi, WifiOff } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import API from "./API";

// Komponen render badge port & severity
const OpenPortsCell = ({ openPortsString, compact = false }) => {
    if (!openPortsString || openPortsString === '-') {
        return (
            <>
                <CheckCircle size={16} className="text-success mt-1 flex-shrink-0" />
                <span className="text-success fw-bold font-monospace">All Closed</span>
            </>
        );
    }

    const portsArr = openPortsString.split(',').map(s => s.trim()).filter(s => s);
    const displayArr = compact && portsArr.length > 3 ? portsArr.slice(0, 3) : portsArr;

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {displayArr.map((item, index) => {
                const parts = item.split('|');
                const portNumber = parts[0];
                const severity = (parts[1] || 'Low').trim().toLowerCase();
                console.log(severity);
                // #dc3545
                // #fd7e14
                // #28a745
                let color = '#6c757d';
                if (severity === 'high') color = '#dc3545';
                else if (severity === 'medium') color = '#fd7e14';
                else if (severity === 'low') color = '#28a745';

                return (
                    <span 
                        key={index} 
                        style={{ 
                            backgroundColor: color, 
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {portNumber}
                    </span>
                );
            })}
            {compact && portsArr.length > 3 && (
                <span className="text-muted ms-1 fw-bold" style={{ fontSize: '12px', alignSelf: 'center' }}>...</span>
            )}
        </div>
    );
};

export default function ScanHistory() {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState("manual");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");

    const [appliedDateStart, setAppliedDateStart] = useState("");
    const [appliedDateEnd, setAppliedDateEnd] = useState("");

    const [showPortsModal, setShowPortsModal] = useState(false);
    const [selectedPorts, setSelectedPorts] = useState("");
    const [selectedIpTitle, setSelectedIpTitle] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
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
                            toast.info(`Filtering results for: ${data.sch_title}`);
                            toastShownRef.current = true;
                        }
                    }
                })
                .catch(err => console.error("Failed to load filter info", err));
        }
    }, [filterSchId]);

    const buildDateParams = (start, end) => {
        let params = "";
        if (start) params += `&dateStart=${start}T00:00:00`;
        if (end)   params += `&dateEnd=${end}T23:59:59`;
        return params;
    };

    const fetchHistoryData = useCallback(() => {
        setLoading(true);
        const dateParams = buildDateParams(appliedDateStart, appliedDateEnd);
        const url = `${API}/History/GetHistory?scanType=${activeTab}&page=${currentPage}&pageSize=${itemsPerPage}&search=${encodeURIComponent(debouncedSearch)}${dateParams}`;

        fetch(url)
            .then((res) => res.json())
            .then((result) => {
                const dataArray = result.data || result || [];
                setHistoryData(dataArray);
            })
            .catch((err) => toast.error("Failed to load scan history"))
            .finally(() => setLoading(false));
    }, [activeTab, currentPage, debouncedSearch, appliedDateStart, appliedDateEnd]);

    useEffect(() => {
        fetchHistoryData();
    }, [fetchHistoryData]);

    const handleTabChange = (k) => {
        setActiveTab(k);
        setCurrentPage(1);
    };

    const handleApplyDateFilter = () => {
        if (!dateStart || !dateEnd) {
            toast.warn("Please fill in Date Start and Date End first.");
            return;
        }
        setAppliedDateStart(dateStart);
        setAppliedDateEnd(dateEnd);
        setCurrentPage(1);
    };

    const handleClearDateFilter = () => {
        setDateStart("");
        setDateEnd("");
        setAppliedDateStart("");
        setAppliedDateEnd("");
        setCurrentPage(1);
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const severityColor = (sev) => {
        switch ((sev || '').toLowerCase()) {
            case 'high':     return [220, 53, 69];
            case 'medium':   return [253, 126, 20];
            case 'low':      return [25, 135, 84];
            default:         return [108, 117, 125];
        }
    };

    const getRiskLabel = (score) => {
        if (score >= 50) return 'CRITICAL';
        if (score >= 20) return 'HIGH';
        if (score >= 5)  return 'MEDIUM';
        return 'LOW';
    };

    const exportToPdf = async () => {
        toast.info("Starting PDF Report generation in background...");
        try {
            const now = new Date();
            const firstDay = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
            const lastDate = new Date(now.getFullYear(), now.getMonth()+1, 0);
            const lastDay  = `${lastDate.getFullYear()}-${String(lastDate.getMonth()+1).padStart(2,'0')}-${String(lastDate.getDate()).padStart(2,'0')}`;

            const start = appliedDateStart || firstDay;
            const end   = appliedDateEnd   || lastDay;

            const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
            
            const res = await fetch(
                `${API}/Report/GenerateFilteredReport?dateStart=${start}T00:00:00&dateEnd=${end}T23:59:59&scanType=${activeTab}${searchParam}&type=Custom`,
                { method: 'POST' }
            );
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success("Report is being generated in the background! Please check the 'Report' menu in a moment.");
            } else {
                toast.error("Failed to process report: " + (data.message || ''));
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to process PDF export: ' + (err.message || ''));
        }
    };

    const renderPagination = () => {
        return (
            <div className="d-flex align-items-center gap-2">
                <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="px-3 d-flex align-items-center gap-1 fw-bold" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1 || loading}
                >
                    <ChevronLeft size={16} /> Prev
                </Button>
                
                <span className="text-muted small fw-bold mx-2">
                    Page {currentPage}
                </span>

                <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="px-3 d-flex align-items-center gap-1 fw-bold" 
                    onClick={() => setCurrentPage(p => p + 1)} 
                    disabled={historyData.length < itemsPerPage || loading}
                >
                    Next <ChevronRight size={16} />
                </Button>
            </div>
        );
    };

    const historyTableContent = (
        <Card className="card-enterprise border-0 shadow-sm mt-3">
            <Card.Header className="bg-white py-3">
                {/* Judul & tombol export */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2 fw-bold text-secondary">
                        <ShieldAlert size={18} />
                        {activeTab === 'manual' ? 'Manual Scan Findings List' : 'Scheduled Scan Findings List'}
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="danger" size="sm" className="d-flex align-items-center gap-2 fw-bold px-3 text-white" onClick={exportToPdf}>
                            <FileText size={16} /> Generate PDF
                        </Button>
                    </div>
                </div>

                {/* Filter periode & search */}
                <div className="d-flex align-items-center flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-1">
                        <Calendar size={15} className="text-muted" />
                        <span className="text-muted small fw-semibold">Period:</span>
                    </div>

                    <InputGroup size="sm" style={{ maxWidth: '160px' }}>
                        <InputGroup.Text className="bg-light border-end-0 text-muted" style={{ fontSize: '12px' }}>From</InputGroup.Text>
                        <Form.Control
                            type="date"
                            className="border-start-0 bg-light"
                            value={dateStart}
                            max={dateEnd || undefined}
                            onChange={(e) => setDateStart(e.target.value)}
                        />
                    </InputGroup>

                    <InputGroup size="sm" style={{ maxWidth: '160px' }}>
                        <InputGroup.Text className="bg-light border-end-0 text-muted" style={{ fontSize: '12px' }}>To</InputGroup.Text>
                        <Form.Control
                            type="date"
                            className="border-start-0 bg-light"
                            value={dateEnd}
                            min={dateStart || undefined}
                            onChange={(e) => setDateEnd(e.target.value)}
                        />
                    </InputGroup>

                    {/* Tombol Terapkan */}
                    <Button
                        variant={dateStart && dateEnd ? "primary" : "outline-secondary"}
                        size="sm"
                        className="d-flex align-items-center gap-1 px-3 fw-bold"
                        style={{ fontSize: '12px' }}
                        onClick={handleApplyDateFilter}
                        disabled={!dateStart || !dateEnd}
                        title="Apply date filter"
                    >
                        <Search size={13} /> Apply
                    </Button>

                    {/* Tombol Reset */}
                    {(appliedDateStart || appliedDateEnd) && (
                        <Button
                            variant="outline-danger"
                            size="sm"
                            className="d-flex align-items-center gap-1 px-2"
                            style={{ fontSize: '12px' }}
                            onClick={handleClearDateFilter}
                            title="Reset date filter"
                        >
                            &times; Reset Filter
                        </Button>
                    )}

                    <div className="ms-auto">
                        <InputGroup style={{ maxWidth: '250px' }} size="sm">
                            <InputGroup.Text className="bg-light border-end-0"><Search size={16} className="text-muted"/></InputGroup.Text>
                            <Form.Control
                                placeholder="Search IP / Branch / Title..."
                                className="border-start-0 bg-light ps-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                </div>
            </Card.Header>

            <Card.Body className="p-0">
                <Table hover responsive className="mb-0 align-middle">
                    <thead className="bg-light text-secondary small text-uppercase">
                        <tr>
                            <th className="ps-4 text-center" style={{ width: '50px' }}>No</th>
                            <th style={{ width: '180px' }}>Scan Time</th>
                            <th>Scan Info</th>
                            <th>Branch & IP</th>
                            <th>Open Ports Found</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-5"><Spinner size="sm" className="me-2" /> Loading Data...</td></tr>
                        ) : historyData.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-5 text-muted">No data found.</td></tr>
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
                                                <OpenPortsCell openPortsString="-" />
                                            ) : (
                                                <>
                                                    <ShieldAlert size={16} className="text-danger mt-1 flex-shrink-0" />
                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                        <OpenPortsCell openPortsString={item.openPorts} compact={true} />
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
                    Showing Page <strong className="text-dark">{currentPage}</strong>
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
                    <p className="text-muted mb-0 small">Vulnerability Report History (Open Ports Findings).</p>
                </div>
            </div>

            <Tabs activeKey={activeTab} onSelect={handleTabChange} className="mb-0 border-bottom-0" fill>
                <Tab eventKey="manual" title={<span className="fw-bold d-flex align-items-center justify-content-center gap-2 py-2"><Play size={16} /> Manual Scan History</span>}>
                    {historyTableContent}
                </Tab>
                <Tab eventKey="scheduled" title={<span className="fw-bold d-flex align-items-center justify-content-center gap-2 py-2"><Clock size={16} /> Scheduled Scan History</span>}>
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
                        <OpenPortsCell openPortsString={selectedPorts} />
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}