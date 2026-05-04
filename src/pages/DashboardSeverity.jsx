import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Spinner, Button } from "react-bootstrap";
import { AlertTriangle, ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import API from "../pages/API";

export default function DashboardSeverity({ hideTitle = false }) {
    const navigate = useNavigate();
    const [rawRisks, setRawRisks] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRisks = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API}/Dashboard/GetRiskDistribution`);
                if (!response.ok) throw new Error('Network response was not ok');
                const result = await response.json();
                setRawRisks(result);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRisks();
    }, []);

    const [riskPage, setRiskPage] = useState(1);
    const itemsPerPage = 10;

    let risks = [];
    if (rawRisks) {
        risks = [...rawRisks].sort((a, b) => {
            if (b.highRisk !== a.highRisk) return b.highRisk - a.highRisk;
            if (b.mediumRisk !== a.mediumRisk) return b.mediumRisk - a.mediumRisk;
            return (b.highRisk + b.mediumRisk + b.lowRisk) - (a.highRisk + a.mediumRisk + a.lowRisk);
        });
    }

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
                <p className="mt-2 text-muted">Memuat data severity...</p>
            </div>
        );
    }

    return (
        <div className={!hideTitle ? "animate__animated animate__fadeIn" : ""}>
            {!hideTitle && (
                <div className="d-flex align-items-center gap-2 mb-4">
                    <div className="bg-primary bg-opacity-10 p-2 rounded">
                        <BarChart2 size={24} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="fw-bold text-dark mb-0">Severity Chart</h3>
                        <p className="text-muted mb-0 small">Distribusi risiko di berbagai branch.</p>
                    </div>
                </div>
            )}

            <Row className="mb-4">
                <Col xs={12}>
                    <Card className="card-enterprise border-0 shadow-sm h-100">
                        <Card.Header className="bg-white py-3 border-bottom d-flex align-items-center gap-2">
                            <AlertTriangle size={18} className="text-secondary" />
                            <div>
                                <h6 className="mb-0 fw-bold text-dark">Komposisi Risiko per Branch (High/Medium/Low)</h6>
                                <small className="text-muted" style={{ fontSize: '11px' }}>
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
                                        <XAxis dataKey="branchName" tick={{ fontSize: 11, fontWeight: '500' }} stroke="#6c757d" interval={0} angle={-45} textAnchor="end" height={80} />
                                        <YAxis stroke="#6c757d" />
                                        <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Bar dataKey="highRisk" name="High Risk" stackId="a" fill="#dc3545" barSize={40} cursor="pointer" onClick={(data) => { if (data && data.branchId) navigate(`/branch/${data.branchId}`); }} />
                                        <Bar dataKey="mediumRisk" name="Medium Risk" stackId="a" fill="#ffc107" barSize={40} cursor="pointer" onClick={(data) => { if (data && data.branchId) navigate(`/branch/${data.branchId}`); }} />
                                        <Bar dataKey="lowRisk" name="Low Risk" stackId="a" fill="#0dcaf0" radius={[4, 4, 0, 0]} barSize={40} cursor="pointer" onClick={(data) => { if (data && data.branchId) navigate(`/branch/${data.branchId}`); }} />
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
        </div>
    );
}
