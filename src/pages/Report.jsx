
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { FileText, Download, Trash2, RefreshCw, FilePlus } from 'lucide-react';
import API from './API';

export default function Report() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/Report/List`);
            const data = await res.json();
            if (data.success) {
                setReports(data.data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError(err.message || 'Gagal memuat daftar report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus report ini beserta filenya?')) return;
        try {
            const res = await fetch(`${API}/Report/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setReports(reports.filter(r => r.id !== id));
            } else {
                alert('Gagal menghapus: ' + data.message);
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleGenerateManual = async (type) => {
        setGenerating(true);
        try {
            const res = await fetch(`${API}/Report/GenerateManual?type=${type}`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`${type} Report berhasil di-generate di background!`);
                fetchReports();
            } else {
                alert('Gagal generate: ' + data.message);
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setGenerating(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 text-slate-800" style={{ fontWeight: 600 }}>Scheduled Reports</h2>
                    <p className="text-muted mb-0">Daftar laporan mingguan dan bulanan yang di-generate otomatis oleh sistem.</p>
                </div>
                <div className="d-flex gap-2">
                    <Button 
                        variant="outline-primary" 
                        onClick={() => handleGenerateManual('Weekly')}
                        disabled={generating}
                        className="d-flex align-items-center gap-2"
                    >
                        {generating ? <Spinner size="sm" /> : <FilePlus size={18} />}
                        Test Generate Weekly
                    </Button>
                    <Button 
                        variant="outline-success" 
                        onClick={() => handleGenerateManual('Monthly')}
                        disabled={generating}
                        className="d-flex align-items-center gap-2"
                    >
                        {generating ? <Spinner size="sm" /> : <FilePlus size={18} />}
                        Test Generate Monthly
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-sm rounded-4">
                <Card.Header className="bg-white border-bottom-0 pt-4 pb-3 px-4 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <FileText size={20} className="text-primary" />
                        </div>
                        <h5 className="mb-0 text-slate-700" style={{ fontWeight: 600 }}>Generated Files</h5>
                    </div>
                    <Button variant="light" size="sm" onClick={fetchReports} disabled={loading}>
                        <RefreshCw size={16} className={loading ? "spin" : ""} />
                    </Button>
                </Card.Header>
                <Card.Body className="p-0">
                    {error && <div className="px-4 py-3"><Alert variant="danger">{error}</Alert></div>}
                    
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-slate-500 font-medium" style={{ fontSize: '0.85rem' }}>TITLE</th>
                                <th className="py-3 text-slate-500 font-medium" style={{ fontSize: '0.85rem' }}>TYPE</th>
                                <th className="py-3 text-slate-500 font-medium" style={{ fontSize: '0.85rem' }}>PERIOD</th>
                                <th className="py-3 text-slate-500 font-medium" style={{ fontSize: '0.85rem' }}>CREATED AT</th>
                                <th className="px-4 py-3 text-slate-500 font-medium text-end" style={{ fontSize: '0.85rem' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-5 text-muted">
                                        <Spinner animation="border" variant="primary" size="sm" className="me-2" /> 
                                        Loading reports...
                                    </td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-5 text-muted">
                                        Belum ada laporan yang ter-generate.
                                    </td>
                                </tr>
                            ) : (
                                reports.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-red-50 p-2 rounded">
                                                    <FileText size={20} className="text-danger" />
                                                </div>
                                                <span className="fw-medium text-slate-700">{r.title}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <Badge bg={r.type.toLowerCase() === 'weekly' ? 'info' : 'success'} className="px-2 py-1">
                                                {r.type}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-slate-600" style={{ fontSize: '0.9rem' }}>
                                            {formatDate(r.dateStart)} <br/>
                                            <span className="text-muted" style={{fontSize: '0.8rem'}}>s/d {formatDate(r.dateEnd)}</span>
                                        </td>
                                        <td className="py-3 text-slate-600" style={{ fontSize: '0.9rem' }}>
                                            {formatDate(r.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                <a 
                                                    href={`${API.replace('/api', '')}${r.filePath}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                                >
                                                    <Download size={14} /> Download
                                                </a>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    onClick={() => handleDelete(r.id)}
                                                    className="d-flex align-items-center"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </div>
    );
}