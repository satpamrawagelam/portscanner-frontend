import React, { useState, useEffect } from "react";
import { Row, Col, Spinner, Card } from "react-bootstrap";
import { Activity, ShieldCheck, ShieldAlert, LayoutDashboard, Server, CheckCircle, AlertTriangle } from "lucide-react";
import API from "../pages/API";

export default function DashboardOverview({ hideTitle = false }) {
    const [overviewPort, setOverviewPort] = useState(null);
    const [overviewHost, setOverviewHost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`${API}/Dashboard/GetOverview`).then(res => res.json()),
            fetch(`${API}/Dashboard/GetOverviewHost`).then(res => res.json())
        ])
        .then(([portData, hostData]) => {
            setOverviewPort(portData);
            setOverviewHost(hostData);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Memuat data overview...</p>
            </div>
        );
    }

    return (
        <div className={!hideTitle ? "animate__animated animate__fadeIn" : ""}>
            {!hideTitle && (
                <div className="d-flex align-items-center gap-2 mb-4">
                    <div className="bg-primary bg-opacity-10 p-2 rounded">
                        <LayoutDashboard size={24} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="fw-bold text-dark mb-0">Dashboard Overview</h3>
                        <p className="text-muted mb-0 small">Monitoring status keamanan jaringan realtime.</p>
                    </div>
                </div>
            )}

            <h5 className="fw-bold text-dark mb-3">Host Status Overview</h5>
            <Row className="g-4 mb-4">
                <Col md={4}>
                    <StatusCard title="VULNERABLE HOSTS" value={overviewHost?.vulnHost || 0} subtitle="Host dengan open ports" color="danger" icon={<AlertTriangle size={32} />} />
                </Col>
                <Col md={4}>
                    <StatusCard title="SAFE HOSTS" value={overviewHost?.safeHost || 0} subtitle="Host tanpa open ports" color="success" icon={<CheckCircle size={32} />} />
                </Col>
                <Col md={4}>
                    <StatusCard title="TOTAL HOSTS SCANNED" value={overviewHost?.total || 0} subtitle="Total host terdeteksi aktif" color="primary" icon={<Server size={32} />} />
                </Col>
            </Row>

            <h5 className="fw-bold text-dark mb-3">Port Status Overview</h5>
            <Row className="g-4 mb-4">
                <Col md={4}>
                    <StatusCard title="TOTAL OPEN PORTS" value={overviewPort?.open || 0} subtitle="Potensi celah keamanan" color="danger" icon={<ShieldAlert size={32} />} />
                </Col>
                <Col md={4}>
                    <StatusCard title="TOTAL CLOSED PORTS" value={overviewPort?.closed || 0} subtitle="Port aman terkunci" color="success" icon={<ShieldCheck size={32} />} />
                </Col>
                <Col md={4}>
                    <StatusCard title="TOTAL PORT SCANNED" value={overviewPort?.total || 0} subtitle="Total aktivitas scan port" color="primary" icon={<Activity size={32} />} />
                </Col>
            </Row>
        </div>
    );
}

function StatusCard({ title, value, subtitle, color, icon }) {
    const bgSoft = `bg-${color} bg-opacity-10`;
    const textColor = `text-${color}`;
    const borderColor = `border-${color}`;
    return (
        <Card className={`border-0 shadow-sm h-100 position-relative overflow-hidden`}>
            <div className={`position-absolute top-0 start-0 bottom-0 ${borderColor}`} style={{ borderLeftWidth: '5px', borderLeftStyle: 'solid' }}></div>
            <Card.Body className="d-flex align-items-center p-4">
                <div className={`p-3 rounded-circle me-4 ${bgSoft} ${textColor}`}>{icon}</div>
                <div>
                    <h6 className="text-muted small fw-bold mb-1">{title}</h6>
                    <h2 className={`fw-bold mb-0 ${textColor}`}>{value}</h2>
                    <small className="text-muted">{subtitle}</small>
                </div>
            </Card.Body>
        </Card>
    );
}
