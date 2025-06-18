import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import axios from "axios";

const PasswordGate = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",  // for signup only
    name: "",   // new field added here
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`https://lawproject-production.up.railway.app/api/users`);
      const users = response.data;

      const user = users.find(
        u =>
          u.username.trim().toLowerCase() === formData.username.trim().toLowerCase() &&
          u.password.trim() === formData.password.trim()
      );
      if (user) {
        login();
        alert(`Welcome back, ${user.username}!`);
        navigate("/Home");
      } else {
        alert("❌ Incorrect username or password. Please try again.");
      }
    } catch (error) {
      console.error("Error during login", error);
      alert("⚠️ Error checking credentials. Please try again.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      if (!formData.username || !formData.password || !formData.email || !formData.name) {
        alert("Please fill all required fields.");
        return;
      }

      await axios.post(`https://lawproject-production.up.railway.app/api/save_users`, {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        name: formData.name,  // send the name to API
      });

      alert("🎉 Signup successful! Please login.");
      setIsLogin(true);
      setFormData({ username: "", password: "", email: "", name: "" });
    } catch (error) {
      console.error("Error during signup", error);
      alert("⚠️ Signup failed. Please try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(120deg,rgb(240, 137, 254) 0%, #66a6ff 100%)",
        fontFamily: "'Poppins', sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px 30px",
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          color: "#333",
          animation: "fadeIn 0.9s ease forwards",
        }}
      >
        <h1 style={{ fontWeight: "700", marginBottom: "10px", color: "#1a237e" }}>
          Law Firm Management System
        </h1>
        <p style={{ marginBottom: "30px", fontSize: "1.1rem", color: "#3949ab" }}>
          {isLogin ? "🔐 Login to your account" : "📝 Create a new account"}
        </p>

        <form onSubmit={isLogin ? handleLogin : handleSignup} style={{ textAlign: "left" }}>
          {!isLogin && (
            <>
              <label htmlFor="name" style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  margin: "8px 0 20px",
                  borderRadius: "12px",
                  border: "1.8px solid #90caf9",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1e88e5")}
                onBlur={(e) => (e.target.style.borderColor = "#90caf9")}
              />
            </>
          )}

          <label htmlFor="username" style={{ fontWeight: "600", fontSize: "0.9rem" }}>
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              padding: "12px 15px",
              margin: "8px 0 20px",
              borderRadius: "12px",
              border: "1.8px solid #90caf9",
              fontSize: "1rem",
              outline: "none",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1e88e5")}
            onBlur={(e) => (e.target.style.borderColor = "#90caf9")}
          />

          <label htmlFor="password" style={{ fontWeight: "600", fontSize: "0.9rem" }}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              padding: "12px 15px",
              margin: "8px 0 30px",
              borderRadius: "12px",
              border: "1.8px solid #90caf9",
              fontSize: "1rem",
              outline: "none",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1e88e5")}
            onBlur={(e) => (e.target.style.borderColor = "#90caf9")}
          />

          {!isLogin && (
            <>
              <label htmlFor="email" style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  margin: "8px 0 30px",
                  borderRadius: "12px",
                  border: "1.8px solid #90caf9",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1e88e5")}
                onBlur={(e) => (e.target.style.borderColor = "#90caf9")}
              />
            </>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "15px",
              border: "none",
              background: "linear-gradient(90deg, #1e88e5, #3949ab)",
              color: "#fff",
              fontSize: "1.1rem",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 8px 15px rgba(57, 73, 171, 0.4)",
              transition: "all 0.3s ease",
              userSelect: "none",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "linear-gradient(90deg, #3949ab, #1e88e5)";
              e.target.style.boxShadow = "0 12px 20px rgba(57, 73, 171, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "linear-gradient(90deg, #1e88e5, #3949ab)";
              e.target.style.boxShadow = "0 8px 15px rgba(57, 73, 171, 0.4)";
            }}
          >
            {isLogin ? "🔓 Unlock Access" : "📝 Create Account"}
          </button>
        </form>

        <p
          style={{ marginTop: "20px", color: "#3949ab", cursor: "pointer", userSelect: "none" }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Don't have an account? Signup here." : "Already have an account? Login here."}
        </p>
      </div>
    </div>
  );
};

export default PasswordGate;
