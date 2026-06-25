import React, { useEffect, useState } from "react";
import { Card, Form, Button, Row, Col, Spinner, InputGroup, Alert } from "react-bootstrap";
import { Save, Settings, Clock, Zap, Activity, Info, Gauge, Repeat } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

import API from "./API";

export default function Setting() {
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/Config/GetConfig`)
      .then((res) => {
          if (!res.ok) throw new Error("Network error");
          return res.json();
      })
      .then((data) => {
          setConfig(data);
      })
      .catch((err) => toast.error("Failed to load configuration"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    if (value < 0) return;
    setConfig(prev => ({ ...prev, [key]: Number(value) }));
  };

  const handleSave = async () => {
    if (config.maxConcurrency <= 0 || config.maxConcurrency > 100) return toast.warn("Max Concurrency must be between 1 and 100");
    if (config.pingTimeout <= 0 || config.pingTimeout > 10000) return toast.warn("Ping Timeout must be between 1 and 10000");
    if (config.pingRetries <= 0 || config.pingRetries > 10) return toast.warn("Ping Retries must be between 1 and 10");
    if (config.portScanTimeout <= 0 || config.portScanTimeout > 10000) return toast.warn("Port Scan Timeout must be between 1 and 10000");
    
    setSaving(true);
    try {
      const res = await fetch(`${API}/Config/UpdateConfig`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });

      if (!res.ok) throw new Error("Failed to save");
      
      toast.success("Configuration saved successfully!");
    } catch (err) {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <div className="animate__animated animate__fadeIn">
        <ToastContainer position="bottom-right" autoClose={3000} />
      <div className="d-flex align-items-center gap-3 mb-4">
         <div className="bg-primary bg-opacity-10 p-2 rounded"><Settings size={24} className="text-primary"/></div>
         <div>
            <h3 className="fw-bold text-dark mb-0">System Configuration</h3>
            <p className="text-muted mb-0 small">Manage scanning performance and global network parameters.</p>
         </div>
      </div>

      <Row className="justify-content-center">
        <Col md={8} lg={6}>
            <Card className="card-enterprise border-0 shadow-sm">
                <Card.Header className="bg-white py-3 border-bottom">
                    <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                        <Gauge size={18} className="text-secondary"/> Scanner Parameter Tuning
                    </h6>
                </Card.Header>
                <Card.Body className="p-4">
                    {/* <Alert variant="info" className="d-flex align-items-center gap-2 mb-4 border-0 bg-info bg-opacity-10 text-dark">
                        <Info size={18} className="text-info"/>
                        <small>Settingan ini disimpan dalam 1 baris global di database.</small>
                    </Alert> */}

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold small">MAX CONCURRENCY (Host Ping)</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light"><Zap size={18}/></InputGroup.Text>
                            <Form.Control type="number" value={config.maxConcurrency} onChange={(e) => handleChange("maxConcurrency", e.target.value)} />
                        </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold small">PING TIMEOUT</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light"><Clock size={18}/></InputGroup.Text>
                            <Form.Control type="number" value={config.pingTimeout} onChange={(e) => handleChange("pingTimeout", e.target.value)} />
                            <InputGroup.Text className="bg-light text-muted small">ms</InputGroup.Text>
                        </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold small d-flex justify-content-between">
                             <span>PING RETRIES</span>
                        </Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light"><Repeat size={18}/></InputGroup.Text>
                            <Form.Control type="number" value={config.pingRetries} onChange={(e) => handleChange("pingRetries", e.target.value)} />
                            <InputGroup.Text className="bg-light text-muted small">times</InputGroup.Text>
                        </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold small">PORT SCAN TIMEOUT</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light"><Clock size={18} className="text-danger"/></InputGroup.Text>
                            <Form.Control type="number" value={config.portScanTimeout} onChange={(e) => handleChange("portScanTimeout", e.target.value)} />
                            <InputGroup.Text className="bg-light text-muted small">ms</InputGroup.Text>
                        </InputGroup>
                    </Form.Group>

                    <Button variant="primary" size="lg" className="w-100 fw-bold" onClick={handleSave} disabled={saving}>
                        {saving ? <Spinner size="sm"/> : <Save size={18} className="me-2"/>} Save Configuration
                    </Button>

                </Card.Body>
            </Card>
        </Col>
      </Row>
    </div>
  );
}