import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Spinner, Table, Badge, Form, InputGroup, Button } from "react-bootstrap";
import { Server, ArrowRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import API from "../pages/API";

export default function DashboardBranchHealth({ hideTitle = false }) {
    const navigate = useNavigate();
    const [branches, setBranches] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranches = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API}/Dashboard/GetBranchHealth`);
                if (!response.ok) throw new Error('Network response was not ok');
                const result = await response.json();
                setBranches(result);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBranches();
    }, []);

    const [branchPage, setBranchPage] = useState(1);
    const [branchSearch, setBranchSearch] = useState("");
    const itemsPerPage = 10;

    useEffect(() => {
        setBranchPage(1);
    }, [branchSearch]);

    const filteredBranches = branches ? branches.filter(b =>
        b.branch_name.toLowerCase().includes(branchSearch.toLowerCase())
    ) : [];

    const totalBranchPages = Math.ceil(filteredBranches.length / itemsPerPage);
    const currentBranchData = filteredBranches.slice((branchPage - 1) * itemsPerPage, branchPage * itemsPerPage);

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
                <Button variant="outline-secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2"><ChevronLeft size={16} /></Button>
                {pages.map((p, idx) => (
                    <Button key={idx} variant={p === currentPage ? "primary" : "outline-secondary"} size="sm" className="px-3 fw-bold" onClick={() => typeof p === 'number' && setPage(p)} disabled={p === "..."} style={{ minWidth: '35px' }}>{p}</Button>
                ))}
                <Button variant="outline-secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2"><ChevronRight size={16} /></Button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading branch health data...</p>
            </div>
        );
    }

    return (
        <div className={!hideTitle ? "animate__animated animate__fadeIn" : ""}>
            {!hideTitle && (
                <div className="d-flex align-items-center gap-2 mb-4">
                    <div className="bg-primary bg-opacity-10 p-2 rounded">
                        <Server size={24} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="fw-bold text-dark mb-0">Branch Health</h3>
                        <p className="text-muted mb-0 small">Detailed health status of each branch.</p>
                    </div>
                </div>
            )}

            <Row>
                <Col xs={12}>
                    <Card className="card-enterprise border-0 shadow-sm">
                        <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2 text-secondary fw-bold">
                                <Server size={18} />
                                <div>
                                    <div className="mb-0">Branch Health Details</div>
                                    <small className="text-muted fw-normal" style={{ fontSize: '11px' }}>
                                        Page {branchPage} of {totalBranchPages || 1}
                                    </small>
                                </div>
                            </div>

                            <div style={{ maxWidth: '250px' }}>
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-light border-end-0">
                                        <Search size={16} className="text-muted" />
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search Branch Name..."
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
                                        <tr><td colSpan="6" className="text-center py-4 text-muted">No data found</td></tr>
                                    ) : (
                                        currentBranchData.map((b) => (
                                            <tr key={b.branch_id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/branch/${b.branch_id}`)}>
                                                <td className="ps-4 fw-bold text-dark">{b.branch_name}</td>
                                                <td className="ps-4 fw-bold text-dark">{b.branch_cidr}</td>
                                                <td className="text-center"><Badge bg="light" text="dark" className="border px-3">{b.totalHost} IP</Badge></td>
                                                <td className="text-center">
                                                    <div className="d-flex flex-column align-items-center gap-1">
                                                        <Badge bg="warning" className="bg-opacity-10 text-warning border border-warning px-2" style={{ minWidth: '60px' }}>{b.hostWithOpenPorts} Vuln</Badge>
                                                        <Badge bg="info" className="bg-opacity-10 text-info border border-info px-2" style={{ minWidth: '60px' }}>{b.hostWithNoOpenPorts} Safe</Badge>
                                                    </div>
                                                </td>
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
        </div>
    );
}
