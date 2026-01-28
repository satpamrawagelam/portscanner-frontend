import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Row, Col, Badge, Button, Spinner } from "react-bootstrap";
import { ArrowLeft, Server, ShieldAlert, ShieldCheck, Globe, Activity } from "lucide-react";

const API = "http://localhost:7155/api";

export default function BranchDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!id) return;
    
    setLoading(true);
    fetch(`${API}/Dashboard/GetBranchDetail/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal mengambil data");
        return res.json();
      })
      .then((fetchedData) => {
        if (fetchedData && fetchedData.results) {
            fetchedData.results.sort((a, b) => {
                const openA = a.ports.filter(p => p.status).length;
                const openB = b.ports.filter(p => p.status).length;
                return openB - openA; 
            });
        }
        setData(fetchedData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const getSeverityColor = (severity) => {
      const sev = severity?.toLowerCase() || 'low';
      switch(sev) {
          case 'high': return 'danger';   
          case 'medium': return 'warning'; 
          default: return 'info';         
      }
  };

  if (loading) {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{minHeight: '60vh'}}>
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-3">Memuat detail branch...</p>
        </div>
    );
  }

  if (!data) {
    return (
        <div className="text-center py-5">
            <h4 className="text-muted">Data tidak ditemukan.</h4>
            <Button variant="secondary" onClick={() => navigate("/")}>Kembali</Button>
        </div>
    );
  }

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
             <Button variant="light" className="border shadow-sm" onClick={() => navigate("/")}>
                <ArrowLeft size={18}/>
             </Button>
             <div>
                <h3 className="fw-bold text-dark mb-0">{data.branchName}</h3>
                <div className="text-muted small d-flex align-items-center gap-2">
                    <Activity size={14}/> Monitoring Status
                    <Badge bg="secondary" className="rounded-pill ms-1">{data.totalHost} Host Terdaftar</Badge>
                </div>
                
             </div>
             
        </div>
        <h3 className="d-flex align-items-center fw-bold">{data.branchCidr}</h3>
      </div>

      <div className="row g-4">
        {data.results.map((ipResult) => {
            const openCount = ipResult.ports.filter(p => p.status).length;
            const isVulnerable = openCount > 0;

            return (
                <div key={ipResult.ip} className="col-lg-6 col-xl-6">
                    <Card className={`card-enterprise border-0 shadow-sm h-100 ${isVulnerable ? 'border-start border-danger border-4' : 'border-start border-success border-4'}`}>
                        <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                                <Globe size={18} className="text-secondary"/>
                                <span className="fw-bold fs-5 text-dark">{ipResult.ip}</span>
                            </div>
                            <div>
                                {isVulnerable ? (
                                    <Badge bg="danger" className="d-flex align-items-center gap-1 py-2 px-3">
                                        <ShieldAlert size={14}/> {openCount} Open Ports
                                    </Badge>
                                ) : (
                                    <Badge bg="success" className="d-flex align-items-center gap-1 py-2 px-3">
                                        <ShieldCheck size={14}/> All Secure
                                    </Badge>
                                )}
                            </div>
                        </Card.Header>
                        
                        <Card.Body className="bg-light bg-opacity-25">
                            <Row className="g-2">
                                {ipResult.ports.map((p) => {
                                    const colorVariant = p.status ? getSeverityColor(p.severity) : "light";
                                    const borderColor = p.status ? `border-${colorVariant}` : "border-secondary border-opacity-25";
                                    const textColor = p.status ? `text-${colorVariant}` : "text-muted opacity-75";
                                    
                                    return (
                                        <Col xs={6} sm={4} md={3} key={p.port}>
                                            <div 
                                                className={`p-2 rounded border text-center position-relative transition-all ${
                                                    p.status 
                                                    ? `bg-white ${borderColor} border-2 shadow-sm` 
                                                    : `bg-white ${borderColor}`
                                                }`}
                                                title={p.service}
                                            >
                                                <div className={`fw-bold fs-5 mb-0 ${textColor}`}>
                                                    {p.port}
                                                </div>

                                                <div style={{fontSize: '0.70rem'}} className={`fw-bold text-uppercase text-truncate ${textColor}`}>
                                                    {p.status ? p.service || "UNKNOWN" : "CLOSED"}
                                                </div>
                                                
                                                {p.status && (
                                                    <div className={`position-absolute top-0 start-100 translate-middle badge rounded-pill bg-${colorVariant}`} style={{fontSize: '0.5rem', zIndex: 10}}>
                                                        {p.severity?.toUpperCase()[0] || "L"}
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </Card.Body>
                        
                        <Card.Footer className="bg-white border-top-0 py-2">
                            <div className="d-flex gap-3 justify-content-end">
                                <small className="d-flex align-items-center gap-1 text-muted" style={{fontSize: '10px'}}>
                                    <span className="d-inline-block rounded-circle bg-danger" style={{width: 8, height: 8}}></span> High
                                </small>
                                <small className="d-flex align-items-center gap-1 text-muted" style={{fontSize: '10px'}}>
                                    <span className="d-inline-block rounded-circle bg-warning" style={{width: 8, height: 8}}></span> Medium
                                </small>
                                <small className="d-flex align-items-center gap-1 text-muted" style={{fontSize: '10px'}}>
                                    <span className="d-inline-block rounded-circle bg-info" style={{width: 8, height: 8}}></span> Low
                                </small>
                            </div>
                        </Card.Footer>
                    </Card>
                </div>
            );
        })}
      </div>
    </div>
  );
}