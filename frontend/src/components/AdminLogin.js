import React, { useState } from "react";
import axios from "axios";
import { Lock } from "@heroui/shared-icons";

const AdminLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/login", credentials);
      onLogin(response.data.token, response.data.username);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="admin-login">
        <h2 className="flex items-center gap-2">
          <Lock className="w-6 h-6" fill="currentColor" />
          Admin Login
        </h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "rgba(102, 126, 234, 0.1)",
            borderRadius: "8px",
            fontSize: "0.9rem",
            color: "#666",
          }}
        >
          <strong>Default Credentials:</strong>
          <br />
          Username: admin
          <br />
          Password: admin123
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
