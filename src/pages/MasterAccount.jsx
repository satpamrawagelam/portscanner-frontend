import React, { useEffect, useState } from "react";
import { Card, Table, Button, Modal, Form, Spinner, InputGroup } from "react-bootstrap";
import { User, Plus, Search, Edit2, Trash2, Save, ChevronLeft, ChevronRight, Key } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";

import API from "./API";

export default function MasterAccount() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); 

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/Auth/GetUsers`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      toast.error("Failed to load account data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormUsername("");
    setFormPassword("");
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setCurrentId(user.id);
    setFormUsername(user.username);
    setFormPassword(user.password || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formUsername.trim()) return toast.warning("Username is required");
    if (!formPassword.trim()) return toast.warning("Password is required");

    setSaving(true);
    const payload = { Username: formUsername, Password: formPassword };
    
    try {
      let url = isEditing ? `${API}/Auth/UpdateUser/${currentId}` : `${API}/Auth/Register`;
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resData.message || "Failed to save user data.");
      }

      toast.success(isEditing ? "Account successfully updated" : "Account successfully added");
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to save data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, username) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete user account "${username}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API}/Auth/DeleteUser/${id}`, { method: 'POST' });
          if (!res.ok) throw new Error();
          toast.success("Account deleted successfully");
          loadData();
        } catch {
          toast.error("Failed to delete account");
        }
      }
    });
  };

  // Filter data based on search term
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="animate__animated animate__fadeIn">
      <ToastContainer position="bottom-right" autoClose={3000} />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
             <div className="bg-primary bg-opacity-10 p-2 rounded">
                 <User size={24} className="text-primary"/>
             </div>
             <div>
                <h3 className="fw-bold text-dark mb-0">Master Account</h3>
                <p className="text-muted mb-0 small">Manage users and console access credentials.</p>
             </div>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 shadow-sm" onClick={handleOpenAdd}>
            <Plus size={16}/> Add Account
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={18} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by username..."
              className="border-start-0 ps-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: '0 8px 8px 0' }}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="bg-light table-light border-bottom text-muted fw-bold">
                <tr>
                  <th className="px-4 py-3" style={{ width: '80px' }}>#</th>
                  <th className="py-3">USERNAME</th>
                  <th className="py-3">PASSWORD</th>
                  <th className="px-4 py-3 text-end" style={{ width: '150px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">
                      <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                      Loading accounts...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((u, index) => (
                    <tr key={u.id}>
                      <td className="px-4 font-monospace text-muted">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="fw-semibold text-dark">{u.username}</td>
                      <td className="font-monospace text-muted">{u.password}</td>
                      <td className="px-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <Button variant="outline-primary" size="sm" onClick={() => handleOpenEdit(u)}>
                            <Edit2 size={14}/>
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(u.id, u.username)}>
                            <Trash2 size={14}/>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <Card.Footer className="bg-white border-top d-flex justify-content-between align-items-center px-4 py-3">
            <span className="text-muted small">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} entries
            </span>
            <div className="d-flex gap-2">
              <Button 
                variant="light" 
                size="sm" 
                className="border" 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16}/>
              </Button>
              <Button 
                variant="light" 
                size="sm" 
                className="border" 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16}/>
              </Button>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center gap-2">
            <Key size={20} className="text-primary" />
            {isEditing ? "Edit Account" : "Add New Account"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <Form.Group className="mb-3" controlId="formUserUsername">
              <Form.Label className="text-muted small fw-bold text-uppercase">Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                disabled={saving}
                style={{ borderRadius: '8px' }}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formUserPassword">
              <Form.Label className="text-muted small fw-bold text-uppercase">Password</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                disabled={saving}
                style={{ borderRadius: '8px' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light border-top-0">
          <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} className="fw-bold d-flex align-items-center gap-2" disabled={saving}>
            {saving ? <Spinner size="sm" /> : <Save size={16} />}
            Save Account
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
