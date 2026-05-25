import React, { useState, useContext } from "react";
import Authlayout from "../../components/layout/Authlayout";
import { axiosInstance } from "../../utils/axiosInstance";
import { API_PATH } from "../../utils/apipath";
import { UserContext } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../utils/errorHandler";
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUserDetails } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      setError("Please enter email");
      toast.error("Please enter email");
      return;
    }
    if (!password.trim()) {
      setError("Please enter password");
      toast.error("Please enter password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      console.log("🔐 Login attempt:", {
        email: email.trim(),
        apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000'
      });

      const response = await axiosInstance.post(API_PATH.AUTH.LOGIN, {
        email: email.trim(),
        password: password.trim()
      });

      console.log("✅ Login response received:", response.status);

      const { token, user } = response.data;

      if (token && user) {
        // Store token and user data
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Update context
        setUserDetails(user);

        // Show success message
        toast.success("Login successful!");
        console.log("✅ User logged in:", user.username);

        // Redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500);
      } else {
        setError("Invalid response from server");
        toast.error("Invalid response from server");
      }
    } catch (error) {
      console.error("❌ Login error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Authlayout>
      <div className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] w-full">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-1">Welcome Back</h2>
            <p className="text-gray-600 text-xs">Please enter your details to login</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full p-2 bg-gray-50 rounded text-sm border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="john@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full p-2 bg-gray-50 rounded text-sm border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Min 8 Characters"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs whitespace-pre-wrap">
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors mt-6 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-center text-xs text-gray-600 mt-4">
            Not registered?{" "}
            <a href="/signup" className="text-blue-600 font-semibold hover:underline">
              Sign up
            </a>
          </p>
        </form>
      </div>
    </Authlayout>
  );
};

export default Login;