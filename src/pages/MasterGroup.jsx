import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Badge from "react-bootstrap/Badge";
import InputGroup from "react-bootstrap/InputGroup";
import Spinner from "react-bootstrap/Spinner";
import Swal from 'sweetalert2';

import { Database, Plus, Save, X, Edit2, Trash2, Search, FolderOpen } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";

import API from "./API";

export default function MasterGroup() {
  const navigate = useNavigate();
   
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [newGroupName, setNewGroupName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const loadData = () => {
    setLoading(true);
    fetch(`${API}/PortGroup/GetAllPortGroup`)
      .then((res) => res.json())
      .then((data) => setGroups(data))
      .catch(() => toast.error("Failed to connect to server"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    if (!newGroupName.trim()) return toast.warn("Group name cannot be empty");

    try {
      const res = await fetch(`${API}/PortGroup/Add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Pg_name: newGroupName }),
      });
      if (!res.ok) throw new Error();
      
      toast.success('Group successfully added');
      setNewGroupName("");
      setIsAdding(false);
      loadData();
    } catch {
      toast.error("Failed to add group");
    }
  };

  const handleUpdate = async () => {
    if (!editName.trim()) return toast.warn("Group name cannot be empty");

    try {
      const res = await fetch(`${API}/PortGroup/Update/${editId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Pg_name: editName }),
      });
      if (!res.ok) throw new Error();

      toast.success("Group successfully updated!");
      setEditId(null);
      setEditName("");
      loadData();
    } catch {
      toast.error("Failed to update group");
    }
  };

  const handleDelete = async (id, count) => {
    if (count > 0) return toast.error("Failed to delete: This group still contains ports!");

    try {
      const res = await fetch(`${API}/PortGroup/Delete/${id}`, { method: "POST" });
      if (!res.ok) {
         const msg = await res.text();
         throw new Error(msg);
      }
      toast.success("Group deleted");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete group");
    }
  };

  const filteredGroups = groups.filter(g => 
    g.pg_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate__animated animate__fadeIn">
      <ToastContainer position="bottom-right" autoClose={3000} />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
             <FolderOpen className="text-primary"/> Master Port Group
          </h3>
          <p className="text-muted mb-0 small">Manage port scanning categories (Web, DB, etc.).</p>
        </div>
        <Button 
            variant="primary" 
            className="d-flex align-items-center gap-2 fw-bold shadow-sm"
            onClick={() => setIsAdding(!isAdding)}
        >
            {isAdding ? <X size={18}/> : <Plus size={18}/>}
            {isAdding ? "Cancel Add" : "Add Group"}
        </Button>
      </div>

      {isAdding && (
         <Card className="card-enterprise mb-4 border-primary border-2 shadow-sm">
            <Card.Body className="d-flex align-items-center gap-3 p-3 bg-primary bg-opacity-10">
                <FolderOpen size={24} className="text-primary"/>
                <Form.Control 
                    type="text" 
                    placeholder="Enter New Group Name (Example: Gaming Ports)..." 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    autoFocus
                    className="border-primary fw-bold"
                />
                <Button variant="primary" onClick={handleAdd} className="fw-bold text-nowrap">
                    <Save size={18} className="me-1"/> Save
                </Button>
            </Card.Body>
         </Card>
      )}

      <Card className="card-enterprise border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
            <InputGroup style={{ maxWidth: '300px' }}>
                <InputGroup.Text className="bg-light border-end-0"><Search size={16} className="text-muted"/></InputGroup.Text>
                <Form.Control 
                    placeholder="Search group name..." 
                    className="border-start-0 bg-light ps-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>
        </Card.Header>

        <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-4" style={{width: '50px'}}>No</th>
                  <th>Group Name</th>
                  <th className="text-center" style={{width: '150px'}}>Total Ports</th>
                  <th className="text-end pe-4" style={{width: '250px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">
                        <Spinner animation="border" size="sm" className="me-2"/> Loading data...
                    </td>
                  </tr>
                ) : filteredGroups.length === 0 ? (
                    <tr>
                        <td colSpan="4" className="text-center py-5 text-muted">
                            No data found.
                        </td>
                    </tr>
                ) : (
                    filteredGroups.map((g, i) => (
                    <tr key={g.pg_id}>
                        <td className="ps-4 text-muted small">{i + 1}</td>
                        
                        <td>
                        {editId === g.pg_id ? (
                            <div className="d-flex gap-2" style={{maxWidth: '300px'}}>
                                <Form.Control 
                                    size="sm" 
                                    value={editName} 
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="fw-bold"
                                />
                                 <Button size="sm" variant="success" onClick={handleUpdate} title="Save"><Save size={14}/></Button>
                                <Button size="sm" variant="secondary" onClick={() => setEditId(null)} title="Cancel"><X size={14}/></Button>
                            </div>
                        ) : (
                            <span className="fw-bold text-dark">{g.pg_name}</span>
                        )}
                        </td>

                        <td className="text-center">
                            <Badge bg={g.totalPorts > 0 ? "info" : "light"} className={`px-3 rounded-pill border ${g.totalPorts > 0 ? "bg-opacity-10 text-info border-info" : "text-muted"}`}>
                                {g.totalPorts || 0} Port
                            </Badge>
                        </td>

                        <td className="text-end pe-4">
                            {editId !== g.pg_id && (
                                <div className="d-flex justify-content-end gap-1">
                                    <Button 
                                        variant="light" size="sm" className="text-primary border"
                                        onClick={() => navigate(`/master/port/${g.pg_id}`)}
                                    >
                                        <FolderOpen size={14} className="me-1"/> Detail
                                    </Button>
                                    <Button 
                                        variant="light" size="sm" className="text-warning border"
                                        onClick={() => {
                                            setEditId(g.pg_id);
                                            setEditName(g.pg_name);
                                        }}
                                    >
                                        <Edit2 size={14}/>
                                    </Button>
                                     <Button 
                                        variant="light" size="sm" className="text-danger border"
                                        onClick={() => Swal.fire({
                                            title: "Delete Group?",
                                            text: "This action cannot be undone!",
                                            icon: "warning",
                                            showCancelButton: true,
                                            confirmButtonColor: "#d33",
                                            confirmButtonText: "Yes, Delete!"
                                        }).then((res) => {
                                            if (res.isConfirmed) handleDelete(g.pg_id, g.totalPorts || 0);
                                        })}
                                    >
                                        <Trash2 size={14}/>
                                    </Button>
                                </div>
                            )}
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </Table>
        </div>
        
        <Card.Footer className="bg-white text-muted small py-3">
            Total: <strong>{filteredGroups.length}</strong> registered groups.
        </Card.Footer>
      </Card>
    </div>
  );
}