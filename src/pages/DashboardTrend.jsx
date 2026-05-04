import React, { useState, useEffect } from "react";
import { Card, Row, Col, Spinner, Form } from "react-bootstrap";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API from "../pages/API";

export default function DashboardTrend({ hideTitle = false }) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [trend, setTrend] = useState(null);
    const [loading, setLoading] = useState(true);

    const trendUrl = `${API}/Dashboard/GetGlobalTrend?month=${selectedMonth}&year=${selectedYear}`;

    useEffect(() => {
        const fetchTrend = async () => {
            setLoading(true);
            try {
                const response = await fetch(trendUrl);
                if (!response.ok) throw new Error('Network response was not ok');
                const result = await response.json();
                setTrend(result);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (trendUrl) {
            fetchTrend();
        }
    }, [trendUrl]);

    const areaData = trend ? trend.map(t => {
        const date = new Date(t.scanDate);
        return {
            date: date.getDate().toString(),
            count: t.totalOpenPorts
        };
    }) : [];

    return (
        <div className={!hideTitle ? "animate__animated animate__fadeIn" : ""}>
            {!hideTitle && (
                <div className="d-flex align-items-center gap-2 mb-4">
                    <div className="bg-primary bg-opacity-10 p-2 rounded">
                        <TrendingUp size={24} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="fw-bold text-dark mb-0">Trend Chart</h3>
                        <p className="text-muted mb-0 small">Tren keamanan bulanan berdasarkan total open ports.</p>
                    </div>
                </div>
            )}

            <Row className="mb-4">
                <Col xs={12}>
                    <Card className="card-enterprise border-0 shadow-sm h-100">
                        <Card.Header className="bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                                <TrendingUp size={18} className="text-secondary" />
                                <h6 className="mb-0 fw-bold text-dark">Tren Keamanan Bulanan</h6>
                            </div>
                            <div className="d-flex gap-2">
                                <Form.Select size="sm" style={{ width: '120px', fontWeight: '600' }} value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
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
                                <Form.Select size="sm" style={{ width: '90px', fontWeight: '600' }} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                </Form.Select>
                            </div>
                        </Card.Header>
                        <Card.Body style={{ height: '350px' }}>
                            {loading ? (
                                <div className="h-100 d-flex flex-column align-items-center justify-content-center">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2 text-muted">Memuat data trend...</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={areaData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#dc3545" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#dc3545" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6c757d" interval={0} />
                                        <YAxis stroke="#6c757d" />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="count" name="Vuln Hosts" stroke="#dc3545" fillOpacity={1} fill="url(#colorOpen)" connectNulls={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
