import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Button, Spinner, InputGroup } from "react-bootstrap";
import { Lock, User, Radar } from "lucide-react";
import Swal from "sweetalert2";
import API from "./API";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please fill in all fields.",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    setLoading(true);
    fetch(`${API}/Auth/Login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Invalid credentials.");
        }
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", data.username || username);
        
        Swal.fire({
          icon: "success",
          title: "Access Granted",
          text: `Welcome back, ${data.username || username}!`,
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          navigate("/dashboard");
        });
      })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: "Authentication Failed",
          text: err.message || "Something went wrong. Please check your credentials.",
          confirmButtonColor: "#dc3545",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div 
      className="d-flex align-items-center justify-content-center" 
      style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "20px"
      }}
    >
      <Card 
        className="border-0 shadow-lg animate__animated animate__zoomIn" 
        style={{ 
          width: "100%", 
          maxWidth: "420px", 
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)"
        }}
      >
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <div className="bg-primary text-white p-3 rounded-circle d-inline-flex mb-3 shadow">
              <Radar size={32} strokeWidth={2.5} className="animate-pulse" />
            </div>
            <h3 className="fw-bold text-dark mb-1">External Exposure Checker</h3>
            <p className="text-muted small">Sign in to access your scanner console</p>
          </div>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label className="text-muted small fw-bold text-uppercase">Username</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <User size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Enter username"
                  className="border-start-0 ps-0"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formPassword">
              <Form.Label className="text-muted small fw-bold text-uppercase">Password</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <Lock size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  className="border-start-0 ps-0"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                />
              </InputGroup>
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
              disabled={loading}
              style={{ borderRadius: "8px", height: "45px" }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
