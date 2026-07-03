import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Row, Col, Badge, Button, Spinner, Modal, Form, Dropdown } from "react-bootstrap";
import { ArrowLeft, Server, ShieldAlert, ShieldCheck, Globe, Activity, Lock, Wifi, WifiOff, Shield, X, Save, Plus } from "lucide-react"; 
import { toast, ToastContainer } from "react-toastify";

import API from "./API";

export default function BranchDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
   
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedIp, setSelectedIp] = useState("");
  const [whitelistPortsList, setWhitelistPortsList] = useState([]); 
  
  const [portSearch, setPortSearch] = useState("");
  const [availablePorts, setAvailablePorts] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [ipSearch, setIpSearch] = useState("");

  useEffect(() => {
    fetchBranchDetail();
  }, [id]);

  const fetchBranchDetail = () => {
    if(!id) return;
    setLoading(true);
    fetch(`${API}/Dashboard/GetBranchDetail/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to retrieve data");
        return res.json();
      })
      .then((fetchedData) => {
        if (fetchedData && fetchedData.results) {
            fetchedData.results.sort((a, b) => {
                const openA = a.ports.filter(p => p.status && p.port !== 0).length;
                const openB = b.ports.filter(p => p.status && p.port !== 0).length;
                return openB - openA; 
            });
        }
        setData(fetchedData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const getSeverityColor = (severity) => {
      const sev = severity?.toLowerCase() || 'low';
      switch(sev) {
          case 'high': return 'danger';   
          case 'medium': return 'warning'; 
          default: return 'info';          
      }
  };

  const handleOpenWhitelistModal = (ipResult, clickedPort = null) => {
      setSelectedIp(ipResult.ip);

      const allPortsData = ipResult.ports.filter(p => p.port !== 0 && p.port !== null);
      setAvailablePorts(allPortsData);
      
      const existingWhitelists = ipResult.ports
            .filter(p => p.isWhitelisted)
            .map(p => p.port);
            
      let initialList = [...existingWhitelists];
      if (clickedPort && clickedPort.status && !initialList.includes(clickedPort.port)) {
          initialList.push(clickedPort.port);
      }

      setWhitelistPortsList(initialList);
      setPortSearch(""); 
      setShowModal(true);
  };

  const handleAddPort = (portVal) => {
      const parsedPort = parseInt(portVal);
      if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
          if (!whitelistPortsList.includes(parsedPort)) {
              setWhitelistPortsList([...whitelistPortsList, parsedPort]);
          } else {
              toast.info(`Port ${parsedPort} already exists in the Whitelist.`);
          }
          setPortSearch("");
      }
  };

  const handleRemovePort = (portToRemove) => {
      setWhitelistPortsList(whitelistPortsList.filter(p => p !== portToRemove));
  };

  const handleSaveWhitelist = () => {
      setIsSubmitting(true);
      
      const payload = {
          ipAddress: selectedIp,
          whitelistedPorts: whitelistPortsList 
      };

      fetch(`${API}/Whitelist/UpdateList`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(response => {
          toast.success(`Whitelist list for IP ${selectedIp} successfully saved!`);
          setShowModal(false);
          fetchBranchDetail(); 
      })
      .catch(err => toast.error("Failed to save whitelist!"))
      .finally(() => setIsSubmitting(false));
  };

  const filteredAvailablePorts = availablePorts.filter(p => 
      p.port.toString().includes(portSearch) || 
      (p.service && p.service.toLowerCase().includes(portSearch.toLowerCase()))
  );

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
  if (!data) return <div className="text-center py-5"><h4 className="text-muted">Data not found.</h4></div>;

  const filteredResults = (data.results || []).filter((ipResult) => {
      const matchesIp = ipResult.ip.toLowerCase().includes(ipSearch.toLowerCase());
      if (severityFilter === "all") {
          return matchesIp;
      } else {
          const hasMatchingOpenPort = ipResult.ports.some(p => 
              p.status && p.severity?.toLowerCase() === severityFilter.toLowerCase()
          );
          return matchesIp && hasMatchingOpenPort;
      }
  });

  return (
    <div className="animate__animated animate__fadeIn">
      <ToastContainer position="bottom-right" autoClose={3000} />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
             <Button variant="light" className="border shadow-sm" onClick={() => navigate("/")}>
                <ArrowLeft size={18}/>
             </Button>
             <div>
                <h3 className="fw-bold text-dark mb-0">{data.branchName}</h3>
                <div className="text-muted small d-flex align-items-center gap-2">
                    <Activity size={14}/> Monitoring Status
                    <Badge bg="secondary" className="rounded-pill ms-1">{data.totalHost} Hosts Registered</Badge>
                    {severityFilter !== "all" && (
                        <Badge bg="danger" className="rounded-pill ms-1">{filteredResults.length} Matching Hosts</Badge>
                    )}
                </div>
             </div>
        </div>
        <h3 className="d-flex align-items-center fw-bold text-secondary font-monospace bg-white px-3 py-1 rounded border">
            {data.branchCidr}
        </h3>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={8}>
              <Form.Control
                type="text"
                placeholder="Search IP Address..."
                value={ipSearch}
                onChange={(e) => setIpSearch(e.target.value)}
                style={{ borderRadius: '8px' }}
              />
            </Col>
            <Col md={4}>
              <Form.Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{ borderRadius: '8px' }}
              >
                <option value="all">All Hosts</option>
                <option value="high">Open High Severity</option>
                <option value="medium">Open Medium Severity</option>
                <option value="low">Open Low Severity</option>
                <option value="info">Open Info Severity</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="row g-4">
        {filteredResults.length === 0 ? (
            <div className="col-12 text-center py-5 text-muted">
                <ShieldCheck size={48} className="text-success mb-3" />
                <h5 className="fw-bold">No Hosts Match Your Filters</h5>
                <p className="small mb-0">Try adjusting your search query or severity filter.</p>
            </div>
        ) : (
            filteredResults.map((ipResult) => {
                const validPorts = ipResult.ports.filter(p => p.port !== 0 && p.port !== null);
                const openCount = validPorts.filter(p => p.status).length;
                const isVulnerable = openCount > 0;
                const isAlive = ipResult.hostStatus;
                const displayedPorts = validPorts.filter(p => {
                    if (severityFilter === "all") return true;
                    return p.status && p.severity?.toLowerCase() === severityFilter.toLowerCase();
                });

                return (
                    <div key={ipResult.ip} className="col-lg-6 col-xl-6">
                        <Card className={`card-enterprise border-0 shadow-sm h-100 ${isVulnerable ? 'border-start border-danger border-4' : 'border-start border-success border-4'}`}>
                            <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <Globe size={18} className="text-secondary"/>
                                    <span className="fw-bold fs-5 text-dark">{ipResult.ip}</span>
                                    
                                    <Button 
                                        variant="outline-secondary" 
                                        size="sm" 
                                        className="ms-2 py-0 px-2 d-flex align-items-center gap-1 border-dashed"
                                        onClick={() => handleOpenWhitelistModal(ipResult)}
                                        title="Manage Whitelist for this IP"
                                    >
                                        <Shield size={12}/> <span style={{fontSize: '10px'}} className="fw-bold">WHITELIST</span>
                                    </Button>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                    {isAlive ? (
                                        <Badge bg="primary" className="d-flex align-items-center gap-1 py-2 px-3"><Wifi size={14}/> Host Up</Badge>
                                    ) : (
                                        <Badge bg="secondary" className="d-flex align-items-center gap-1 py-2 px-3 opacity-75"><WifiOff size={14}/> Host Down</Badge>
                                    )}
                                </div>
                            </Card.Header>
                            
                            <Card.Body className="bg-light bg-opacity-25">
                                {displayedPorts.length > 0 ? (
                                    <Row className="g-2">
                                        {displayedPorts.map((p, idx) => {
                                            const isWhitelisted = p.isWhitelisted === true; 
                                            const colorVariant = p.status ? (isWhitelisted ? "secondary" : getSeverityColor(p.severity)) : "light";
                                            const borderColor = p.status ? `border-${colorVariant}` : "border-secondary border-opacity-25";
                                            const textColor = p.status ? `text-${colorVariant}` : "text-muted opacity-75";
                                            
                                            return (
                                                <Col xs={6} sm={4} md={3} key={`${p.port}-${idx}`}>
                                                    <div 
                                                        onClick={() => p.status && handleOpenWhitelistModal(ipResult, p)}
                                                        style={{ cursor: p.status ? 'pointer' : 'default' }}
                                                        className={`p-2 rounded border text-center position-relative transition-all ${
                                                            p.status ? `bg-white ${borderColor} border-2 shadow-sm hover-shadow` : `bg-white ${borderColor}`
                                                        }`}
                                                    >
                                                        <div className={`fw-bold fs-5 mb-0 ${textColor}`}>{p.port}</div>
                                                        <div style={{fontSize: '0.70rem'}} className={`fw-bold text-uppercase text-truncate ${textColor}`}>
                                                            {p.status ? p.service || "UNKNOWN" : "CLOSED"}
                                                        </div>
                                                        
                                                        {p.status && !isWhitelisted && (
                                                            <div className={`position-absolute top-0 start-100 translate-middle badge rounded-pill bg-${colorVariant}`} style={{fontSize: '0.5rem', zIndex: 10}}>
                                                                {p.severity?.toUpperCase()[0] || "L"}
                                                            </div>
                                                        )}

                                                        {isWhitelisted && (
                                                            <div className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary border border-white" style={{fontSize: '0.5rem', zIndex: 10}}>
                                                                <Shield size={10} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                ) : (
                                    <div className="text-center py-4 text-muted opacity-75">
                                        <Lock size={24} className="text-success mb-2"/>
                                        <small className="fw-bold d-block">No Open Ports.</small>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                );
            })
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="bg-light border-bottom">
            <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center gap-2">
                <Shield size={20} className="text-primary" /> 
                Manage Host Whitelist
            </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
            <div className="mb-4">
                <span className="text-muted small fw-bold text-uppercase">Target IP Address</span>
                <h4 className="fw-bold font-monospace text-dark mt-1 mb-0">{selectedIp}</h4>
            </div>

            <Form.Group className="mb-3">
                <Form.Label className="text-muted small fw-bold text-uppercase">Pilih / Ketik Port</Form.Label>
                
                <Dropdown className="w-100">
                    <Dropdown.Toggle variant="white" className="w-100 text-start d-flex justify-content-between align-items-center border form-control-lg fs-6" style={{ backgroundColor: '#fff' }}>
                        <span className="text-muted">-- Type or Select Port --</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100 p-0 shadow-sm border-0" style={{maxHeight: '300px', overflow: 'hidden'}}>
                        <div className="p-2 border-bottom bg-light sticky-top">
                            <Form.Control 
                                autoFocus 
                                placeholder="Search service (e.g. HTTP) / Type port number..." 
                                value={portSearch} 
                                onChange={(e) => setPortSearch(e.target.value)} 
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddPort(portSearch);
                                    }
                                }}
                            />
                        </div>
                        
                        <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                            {filteredAvailablePorts.map((p, idx) => {
                                if (whitelistPortsList.includes(p.port)) return null;
                                
                                return (
                                    <Dropdown.Item key={`${p.port}-${idx}`} onClick={() => handleAddPort(p.port)} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                        <span className="fw-bold text-dark small">Port {p.port}</span>
                                        <Badge bg="light" text="dark" className="border fw-normal">{p.service || 'UNKNOWN'}</Badge>
                                    </Dropdown.Item>
                                );
                            })}
                            


                            {filteredAvailablePorts.length === 0 && !portSearch && (
                                <div className="p-3 text-center text-muted small fst-italic">
                                    All open ports are already whitelisted.
                                </div>
                            )}
                        </div>
                    </Dropdown.Menu>
                </Dropdown>
                <Form.Text className="text-muted small">
                    Select from the list of open ports, or type the number manually.
                </Form.Text>
            </Form.Group>

            <div className="p-3 bg-light rounded border border-dashed">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="text-muted small fw-bold text-uppercase mb-0">
                        Whitelist List ({whitelistPortsList.length})
                    </Form.Label>
                    {whitelistPortsList.length > 0 && (
                        <Badge bg="danger" className="text-white fw-normal" style={{cursor: 'pointer'}} onClick={() => setWhitelistPortsList([])}>
                            Clear All
                        </Badge>
                    )}
                </div>
                
                {whitelistPortsList.length === 0 ? (
                    <span className="text-muted small fst-italic">No ports added yet.</span>
                ) : (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                        {whitelistPortsList.map((p) => (
                            <Badge key={p} bg="white" className="text-dark border shadow-sm px-3 py-2 d-flex align-items-center gap-2">
                                <ShieldCheck size={14} className="text-success"/>
                                <span className="fw-bold font-monospace">Port {p}</span>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemovePort(p)} 
                                    className="btn btn-link p-0 ms-2 text-danger" 
                                    style={{ lineHeight: 0 }}
                                >
                                    <X size={16} />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </Modal.Body>
        <Modal.Footer className="bg-light border-top-0">
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveWhitelist} className="fw-bold d-flex align-items-center gap-2" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : <Save size={16} />}
                Save Configuration
            </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}