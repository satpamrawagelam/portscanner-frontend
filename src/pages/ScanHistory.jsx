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
                let color = '#6c757d'; // Default (secondary)
                if (severity === 'high') color = '#dc3545'; // Merah
                else if (severity === 'medium') color = '#fd7e14'; // Oranye
                else if (severity === 'low') color = '#28a745'; // Hijau

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

    // State INPUT — hanya untuk dikontrol di form, tidak langsung trigger fetch
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");

    // State APPLIED — inilah yang masuk ke dependency useCallback & trigger fetch
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
            setCurrentPage(1); // Reset ke halaman 1 kalau pencarian berubah
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
                            toast.info(`Memfilter hasil untuk: ${data.sch_title}`);
                            toastShownRef.current = true;
                        }
                    }
                })
                .catch(err => console.error("Gagal load filter info", err));
        }
    }, [filterSchId]);

    // Bangun query param hanya dari applied state (bukan input state)
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
                // Menyesuaikan jika response API berubah (pakai result.data atau langsung result)
                const dataArray = result.data || result || [];
                setHistoryData(dataArray);
            })
            .catch((err) => toast.error("Gagal memuat history"))
            .finally(() => setLoading(false));
    // Fetch hanya bergantung pada applied state — bukan input state langsung
    }, [activeTab, currentPage, debouncedSearch, appliedDateStart, appliedDateEnd]);

    useEffect(() => {
        fetchHistoryData();
    }, [fetchHistoryData]);

    const handleTabChange = (k) => {
        setActiveTab(k);
        setCurrentPage(1);
    };

    // Terapkan filter — hanya jalan saat kedua tanggal sudah diisi
    const handleApplyDateFilter = () => {
        if (!dateStart || !dateEnd) {
            toast.warn("Harap isi Date Start dan Date End terlebih dahulu.");
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

    const exportToCsv = async () => {
        toast.info("Menyiapkan file CSV...");
        try {
            const dateParams = buildDateParams(appliedDateStart, appliedDateEnd);
            const url = `${API}/History/GetHistory?scanType=${activeTab}&page=1&pageSize=10000&search=${encodeURIComponent(debouncedSearch)}${dateParams}`;
            const res = await fetch(url);
            const result = await res.json();
            const dataToExport = result.data || result || [];

            if (!dataToExport || dataToExport.length === 0) {
                toast.warn("Tidak ada data untuk diexport");
                return;
            }

            const headers = ["No,Waktu Scan,Judul Scan,Tipe Scan,Branch Name,IP Address,Open Ports"];
            const rows = dataToExport.map((item, index) => {
                const clean = (text) => `"${String(text || "").replace(/"/g, '""')}"`;
                const dateFormatted = formatDate(item.scanDate);
                return [
                    index + 1, clean(dateFormatted), clean(item.scanTitle),
                    clean(item.scanType || "Manual Scan"), clean(item.branchName),
                    clean(item.ipAddress), clean(item.openPorts)
                ].join(",");
            });

            const csvContent = [headers, ...rows].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", `History_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Berhasil export data ke CSV`);
        } catch (error) {
            toast.error("Gagal export CSV");
        }
    };

    // ── Helper: severity color untuk PDF ──────────────────────────────────────
    const severityColor = (sev) => {
        switch ((sev || '').toLowerCase()) {
            case 'high':     return [220, 53, 69];   // red
            case 'medium':   return [253, 126, 20];  // orange
            case 'low':      return [25, 135, 84];   // green
            default:         return [108, 117, 125]; // secondary/gray
        }
    };

    const getRiskLabel = (score) => {
        if (score >= 50) return 'CRITICAL';
        if (score >= 20) return 'HIGH';
        if (score >= 5)  return 'MEDIUM';
        return 'LOW';
    };

    const exportToPdf = async () => {
        toast.info("Menyiapkan PDF Report...");
        try {
            // Periode: pakai applied filter, atau default ke bulan berjalan
            const now = new Date();
            const firstDay = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
            const lastDate = new Date(now.getFullYear(), now.getMonth()+1, 0);
            const lastDay  = `${lastDate.getFullYear()}-${String(lastDate.getMonth()+1).padStart(2,'0')}-${String(lastDate.getDate()).padStart(2,'0')}`;

            const start = appliedDateStart || firstDay;
            const end   = appliedDateEnd   || lastDay;

            const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
            const res  = await fetch(
                `${API}/History/GetReport?dateStart=${start}T00:00:00&dateEnd=${end}T23:59:59&scanType=${activeTab}${searchParam}`
            );
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Gagal fetch data report');

            const { summary, topBranches, topHosts, topPorts, detailHistory, periodeStart, periodeEnd } = data;

            const formatPortsForPdf = (portsStr) => {
                if (!portsStr || portsStr === '-') return '-';
                return portsStr.split(',')
                    .map(s => {
                        const [port] = s.split('|');
                        return port ? port.trim() : '';
                    })
                    .filter(p => p)
                    .join(', ');
            };

            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const W   = doc.internal.pageSize.getWidth();
            const M   = 14;
            let   y   = M;

            const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });

            // ── HEADER BAND ────────────────────────────────────────────────────
            const hasSearch  = !!debouncedSearch;
            const headerH    = hasSearch ? 28 : 22;
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, W, headerH, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14); doc.setFont('helvetica','bold');
            doc.text('EXTERNAL EXPOSURE CHECKER REPORT', M, 10);
            doc.setFontSize(8); doc.setFont('helvetica','normal');
            const scanTypeLabel = activeTab === 'manual' ? 'Manual Scan' : activeTab === 'scheduled' ? 'Scheduled Scan' : 'All Type';
            doc.text(`Periode: ${fmtDate(periodeStart+' 00:00')}  s/d  ${fmtDate(periodeEnd+' 00:00')}   |   Tipe: ${scanTypeLabel}`, M, 16);
            if (hasSearch) {
                doc.setFontSize(7.5); doc.setTextColor(180, 200, 255);
                doc.text(`Search Filter: "${debouncedSearch}"`, M, 22);
                doc.setTextColor(255, 255, 255);
            }
            doc.setFontSize(8);
            doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, W - M, 16, { align: 'right' });
            y = headerH + 6;

            // ── SUMMARY CARDS ──────────────────────────────────────────────────
            const cards = [
                { label: 'Total Scan',              value: summary.totalScan,              color: [15,23,42] },
                { label: 'Total Open Port Findings',value: summary.totalOpenPortFindings,  color: [220,53,69] },
                { label: 'Host with Open Port',   value: summary.totalHostWithOpenPort,  color: [253,126,20] },
                { label: 'HIGH Severity Port Exposed',      value: summary.highSeverityPortCount,  color: [180,50,10] },
                { label: 'MEDIUM Severity Port Exposed',    value: summary.mediumSeverityPortCount,color: [133,100,4] },
            ];
            const cardW = (W - 2*M - 4*4) / 5;
            cards.forEach((c, i) => {
                const cx = M + i * (cardW + 4);
                doc.setFillColor(...c.color);
                doc.roundedRect(cx, y, cardW, 18, 2, 2, 'F');
                doc.setTextColor(255,255,255);
                doc.setFontSize(18); doc.setFont('helvetica','bold');
                doc.text(String(c.value), cx + cardW/2, y + 10, { align: 'center' });
                doc.setFontSize(7);  doc.setFont('helvetica','normal');
                doc.text(c.label, cx + cardW/2, y + 16, { align: 'center' });
            });
            y += 24;

            // ── TOP BRANCHES ───────────────────────────────────────────────────
            doc.setTextColor(15,23,42);
            doc.setFontSize(9); doc.setFont('helvetica','bold');
            doc.text('Top 5 Zones with High Risk Exposure', M, y); y += 2;
            autoTable(doc, {
                startY: y,
                head: [['#','Zone Name','Open Port Findings','Risk Score','Level']],
                body: (topBranches||[]).map((b,i) => [
                    i+1, b.branchName, b.openPortCount, b.riskScore,
                    getRiskLabel(b.riskScore)
                ]),
                theme: 'grid',
                headStyles: { fillColor: [15,23,42], fontSize: 8, halign:'left'},
                bodyStyles: { fontSize: 8 },
                columnStyles: { 0:{halign:'center',cellWidth:8}, 2:{halign:'center'}, 3:{halign:'center'}, 4:{halign:'center'} },
                margin: { left: M, right: M },
                tableWidth: (W - 2*M) / 2 - 3,
                didParseCell: (d) => {
                    if (d.section==='body' && d.column.index===4) {
                        const row = topBranches[d.row.index];
                        if (row) d.cell.styles.textColor = severityColor(getRiskLabel(row.riskScore));
                    }
                }
            });
            const afterBranch = doc.lastAutoTable.finalY;

            // ── TOP HOSTS (kolom kanan, sejajar branches) ──────────────────────
            const col2X = M + (W - 2*M) / 2 + 3;
            doc.setTextColor(15,23,42);
            doc.setFontSize(9); doc.setFont('helvetica','bold');
            doc.text('Top 5 IP Address with High Risk Exposure', col2X, y); 
            autoTable(doc, {
                startY: y + 2,
                head: [['#','IP Address','Zone Name','Open Ports','Risk Score']],
                body: (topHosts||[]).map((h,i) => [
                    i+1, h.ipAddress, h.branchName, h.openPortCount, h.riskScore
                ]),
                theme: 'grid',
                headStyles: { fillColor: [44,62,80], fontSize: 8 },
                bodyStyles: { fontSize: 8 },
                columnStyles: { 0:{halign:'center',cellWidth:8}, 3:{halign:'center'}, 4:{halign:'center'} },
                margin: { left: col2X, right: M },
                tableWidth: (W - 2*M) / 2 - 3,
            });
            const afterHost = doc.lastAutoTable.finalY;

            y = Math.max(afterBranch, afterHost) + 6;

            // ── TOP PORTS ──────────────────────────────────────────────────────
            doc.setTextColor(15,23,42);
            doc.setFontSize(9); doc.setFont('helvetica','bold');
            doc.text('Top 5 Port with High Risk Exposure', M, y); y += 2;
            autoTable(doc, {
                startY: y,
                head: [['#','Port','Description','Severity','Frequency']],
                body: (topPorts||[]).map((p,i) => [
                    i+1, p.portNumber, p.portDesc, p.severity, p.openCount
                ]),
                theme: 'grid',
                headStyles: { fillColor: [220,53,69], fontSize: 8 },
                bodyStyles: { fontSize: 8 },
                columnStyles: { 0:{halign:'center',cellWidth:8}, 1:{halign:'center'}, 3:{halign:'center'}, 4:{halign:'center'} },
                margin: { left: M, right: W/2 },
                tableWidth: (W - 2*M) / 2 - 3,
                didParseCell: (d) => {
                    if (d.section === 'body') {
                        const row = topPorts[d.row.index];
                        if (row) {
                            // Warnai seluruh baris sesuai severity port tersebut
                            d.cell.styles.textColor = severityColor(row.severity);
                            // Kolom Severity → bold untuk penekanan
                            if (d.column.index === 3) {
                                d.cell.styles.fontStyle = 'bold';
                            }
                        }
                    }
                }
            });
            y = doc.lastAutoTable.finalY + 8;

            // ── DETAIL HISTORY ───────────────────────
            if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = M; }
            doc.setTextColor(15,23,42);
            doc.setFontSize(9); doc.setFont('helvetica','bold');
            doc.text('Scan History Detail', M, y); y += 2;
            autoTable(doc, {
                startY: y,
                head: [['No','Scan Date','Scan Title','Scan Type','Zone','IP Address','Status Host','Open Ports']],
                body: (detailHistory||[]).map((item, i) => [
                    i+1,
                    new Date(item.scanDate).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),
                    item.scanTitle,
                    item.scanType,
                    item.branchName,
                    item.ipAddress,
                    item.hostStatus ? 'UP' : 'DOWN',
                    formatPortsForPdf(item.openPorts || '-')
                ]),
                theme: 'striped',
                headStyles: { fillColor: [15,23,42], fontSize: 7.5 },
                bodyStyles: { fontSize: 7 },
                columnStyles: {
                    0:{halign:'center',cellWidth:8},
                    1:{cellWidth:32},
                    3:{halign:'center',cellWidth:22},
                    6:{halign:'center',cellWidth:16},
                },
                margin: { left: M, right: M },
                didParseCell: (d) => {
                    if (d.section==='body' && d.column.index===6) {
                        d.cell.styles.textColor = d.cell.raw==='UP' ? [25,135,84] : [108,117,125];
                        d.cell.styles.fontStyle = 'bold';
                    }
                    // Open Ports column — hide default text to redraw custom colors in didDrawCell
                    if (d.section==='body' && d.column.index===7 && d.cell.raw !== '-') {
                        const isStriped = d.row.index % 2 !== 0;
                        d.cell.styles.textColor = isStriped ? [248,249,250] : [255,255,255]; // Match default stripe colors
                        d.cell.styles.fontStyle = 'bold';
                    }
                },
                didDrawCell: (d) => {
                    // Custom draw Open Ports column to colorize each port number individually
                    if (d.section==='body' && d.column.index===7 && d.cell.raw !== '-') {
                        const item = detailHistory[d.row.index];
                        if (!item || !item.openPorts) return;
                        
                        // Map portNumber -> severity
                        const portSevMap = {};
                        item.openPorts.split(',').forEach(p => {
                            const [num, sev] = p.split('|');
                            if (num) portSevMap[num.trim()] = (sev || 'low').trim().toLowerCase();
                        });

                        const padL = d.cell.styles.cellPadding?.left || d.cell.styles.cellPadding || 2;
                        const padT = d.cell.styles.cellPadding?.top || d.cell.styles.cellPadding || 2;
                        
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'bold');

                        // d.cell.text contains the auto-wrapped array of strings!
                        const lines = Array.isArray(d.cell.text) ? d.cell.text : [d.cell.text];
                        let cursorY = d.cell.y + padT + 2.2; // Approximate baseline for 7pt font
                        
                        lines.forEach(line => {
                            let cursorX = d.cell.x + padL;
                            // Split line keeping the numbers isolated (e.g. "22, 80," -> ["", "22", ", ", "80", ","] )
                            const tokens = line.split(/(\d+)/); 
                            
                            tokens.forEach(token => {
                                if (!token) return;
                                if (/^\d+$/.test(token)) {
                                    const severity = portSevMap[token] || 'low';
                                    let color = [108, 117, 125];
                                    if (severity === 'high') color = [220, 53, 69];
                                    else if (severity === 'medium') color = [253, 126, 20];
                                    else if (severity === 'low') color = [25, 135, 84];
                                    
                                    doc.setTextColor(color[0], color[1], color[2]);
                                } else {
                                    // Comma / spaces
                                    doc.setTextColor(150, 150, 150);
                                }
                                doc.text(token, cursorX, cursorY);
                                cursorX += doc.getTextWidth(token);
                            });
                            
                            cursorY += (d.cell.styles.fontSize * 0.352777) + 0.5; // Approx line height increment
                        });
                    }
                },
                didDrawPage: (d) => {
                    // Footer setiap halaman
                    doc.setFontSize(7); doc.setTextColor(150,150,150);
                    doc.text(`Halaman ${d.pageNumber}`, W/2, doc.internal.pageSize.getHeight()-5, { align:'center' });
                    doc.text('External Exposure Checker — Security Report', M, doc.internal.pageSize.getHeight()-5);
                }
            });

            doc.save(`Laporan_Scan_${start}_sd_${end}.pdf`);
            toast.success('PDF berhasil diunduh!');
        } catch (err) {
            console.error(err);
            toast.error('Gagal generate PDF: ' + (err.message || ''));
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
                    // Logika Pintar: Kalau data yang didapat < 10, berarti sudah mentok di halaman terakhir
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
                {/* Row 1: Judul + tombol export */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2 fw-bold text-secondary">
                        <ShieldAlert size={18} />
                        {activeTab === 'manual' ? 'Daftar Temuan Manual Scan' : 'Daftar Temuan Scheduled Scan'}
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="danger" size="sm" className="d-flex align-items-center gap-2 fw-bold px-3 text-white" onClick={exportToPdf}>
                            <FileText size={16} /> Export PDF
                        </Button>
                        <Button variant="success" size="sm" className="d-flex align-items-center gap-2 fw-bold px-3 text-white" onClick={exportToCsv}>
                            <FileText size={16} /> Export CSV
                        </Button>
                    </div>
                </div>

                {/* Row 2: Filter periode + search */}
                <div className="d-flex align-items-center flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-1">
                        <Calendar size={15} className="text-muted" />
                        <span className="text-muted small fw-semibold">Periode:</span>
                    </div>

                    <InputGroup size="sm" style={{ maxWidth: '160px' }}>
                        <InputGroup.Text className="bg-light border-end-0 text-muted" style={{ fontSize: '12px' }}>Dari</InputGroup.Text>
                        <Form.Control
                            type="date"
                            className="border-start-0 bg-light"
                            value={dateStart}
                            max={dateEnd || undefined}
                            onChange={(e) => setDateStart(e.target.value)}
                        />
                    </InputGroup>

                    <InputGroup size="sm" style={{ maxWidth: '160px' }}>
                        <InputGroup.Text className="bg-light border-end-0 text-muted" style={{ fontSize: '12px' }}>S/d</InputGroup.Text>
                        <Form.Control
                            type="date"
                            className="border-start-0 bg-light"
                            value={dateEnd}
                            min={dateStart || undefined}
                            onChange={(e) => setDateEnd(e.target.value)}
                        />
                    </InputGroup>

                    {/* Tombol Terapkan — hanya aktif jika kedua tanggal sudah dipilih */}
                    <Button
                        variant={dateStart && dateEnd ? "primary" : "outline-secondary"}
                        size="sm"
                        className="d-flex align-items-center gap-1 px-3 fw-bold"
                        style={{ fontSize: '12px' }}
                        onClick={handleApplyDateFilter}
                        disabled={!dateStart || !dateEnd}
                        title="Terapkan filter tanggal"
                    >
                        <Search size={13} /> Terapkan
                    </Button>

                    {/* Tombol Reset — hanya muncul kalau filter periode sudah aktif */}
                    {(appliedDateStart || appliedDateEnd) && (
                        <Button
                            variant="outline-danger"
                            size="sm"
                            className="d-flex align-items-center gap-1 px-2"
                            style={{ fontSize: '12px' }}
                            onClick={handleClearDateFilter}
                            title="Reset filter tanggal"
                        >
                            &times; Reset Filter
                        </Button>
                    )}

                    <div className="ms-auto">
                        <InputGroup style={{ maxWidth: '250px' }} size="sm">
                            <InputGroup.Text className="bg-light border-end-0"><Search size={16} className="text-muted" /></InputGroup.Text>
                            <Form.Control
                                placeholder="Cari IP / Branch / Judul..."
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
                            <th style={{ width: '180px' }}>Waktu Scan</th>
                            <th>Informasi Scan</th>
                            <th>Branch & IP</th>
                            <th>Open Ports Found</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-5"><Spinner size="sm" className="me-2" /> Memuat Data...</td></tr>
                        ) : historyData.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-5 text-muted">Data tidak ditemukan.</td></tr>
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
                    Menampilkan data Halaman <strong className="text-dark">{currentPage}</strong>
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
                    <p className="text-muted mb-0 small">Riwayat temuan port terbuka (Vulnerability Report).</p>
                </div>
            </div>

            <Tabs activeKey={activeTab} onSelect={handleTabChange} className="mb-0 border-bottom-0" fill>
                <Tab eventKey="manual" title={<span className="fw-bold d-flex align-items-center justify-content-center gap-2 py-2"><Play size={16} /> Riwayat Manual Scan</span>}>
                    {historyTableContent}
                </Tab>
                <Tab eventKey="scheduled" title={<span className="fw-bold d-flex align-items-center justify-content-center gap-2 py-2"><Clock size={16} /> Riwayat Scheduled Scan</span>}>
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