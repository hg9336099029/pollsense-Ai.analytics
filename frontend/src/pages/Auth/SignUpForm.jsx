import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Authlayout from "../../components/layout/Authlayout";
import { axiosInstance } from "../../utils/axiosInstance";
import { API_PATH } from "../../utils/apipath";
import { UserContext } from "../../context/userContext";
import { ToastContainer } from 'react-toastify';
import { getErrorMessage } from "../../utils/errorHandler";
import 'react-toastify/dist/ReactToastify.css';

const SignUpForm = () => {
  const navigate = useNavigate();
  const { setUserDetails } = useContext(UserContext);

  const [fullname, setfullname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!fullname.trim()) {
      newErrors.fullname = "Full Name is required";
    } else if (fullname.trim().length < 2) {
      newErrors.fullname = "Full Name must be at least 2 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = "Please enter a valid email";
    }

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (username.trim().length > 20) {
      newErrors.username = "Username must be at most 20 characters";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.trim().length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors above");
      return;
    }

    setLoading(true);

    try {
      console.log("📝 Signup attempt:", {
        fullname,
        username,
        email,
        hasProfileImage: !!profileImage,
        apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000'
      });

      const formData = new FormData();
      formData.append("fullname", fullname.trim());
      formData.append("username", username.trim());
      formData.append("email", email.trim());
      formData.append("password", password.trim());

      if (profileImage) {
        formData.append("profileImage", profileImage.file);
        console.log("📸 Profile image added:", profileImage.file.name);
      }

      // Don't manually set Content-Type for FormData - let browser handle it
      const response = await axiosInstance.post(API_PATH.AUTH.REGISTER, formData);

      console.log("✅ Signup response received:", response.status);

      if (response.status === 201) {
        const { token, user } = response.data;

        // Store token and user data
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Update context
        setUserDetails(user);

        // Show success message
        toast.success("Account created successfully!");
        console.log("✅ Account created for:", user.username);

        // Redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500);
      }
    } catch (error) {
      console.error("❌ Signup error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }

      setProfileImage({
        preview: URL.createObjectURL(file),
        file: file
      });
      console.log("📸 Image selected:", file.name);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, text: '', color: '' };

    let strength = 0;
    if (password.length >= 6) strength = 4;

    const strengthMap = {
      0: { text: 'Weak', color: 'bg-red-500' },
      4: { text: 'Good', color: 'bg-green-500' }
    };

    return { strength: strength * 25, ...strengthMap[strength] || strengthMap[0] };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <Authlayout>
      <div className="w-full max-w-md mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] w-full"
        >
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Create an Account</h2>
          </div>

          <div className="flex justify-center mb-2">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                {profileImage ? (
                  <img
                    src={profileImage.preview}
                    alt="profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <svg className="w-8 h-8 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 cursor-pointer hover:bg-blue-600">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={loading}
                />
                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 3v14M3 10h14" strokeWidth="2" stroke="currentColor" />
                </svg>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => {
                  setfullname(e.target.value);
                  if (errors.fullname) setErrors({ ...errors, fullname: "" });
                }}
                className={`w-full p-2 bg-gray-50 rounded text-sm border ${errors.fullname ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                placeholder="John Doe"
                disabled={loading}
              />
              {errors.fullname && (
                <p className="text-red-500 text-xs mt-1">{errors.fullname}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                className={`w-full p-2 bg-gray-50 rounded text-sm border ${errors.email ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                placeholder="john@example.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({ ...errors, username: "" });
                }}
                className={`w-full p-2 bg-gray-50 rounded text-sm border ${errors.username ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                placeholder="john_doe"
                disabled={loading}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                className={`w-full p-2 bg-gray-50 rounded text-sm border ${errors.password ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                placeholder="Min 6 Characters"
                disabled={loading}
              />
              {password && (
                <>
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i < Math.ceil(passwordStrength.strength / 25) ? passwordStrength.color : 'bg-gray-300'}`}
                        ></div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      Strength: <span className="font-semibold">{passwordStrength.text}</span>
                    </p>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    <li className={password.length >= 6 ? 'text-green-600 font-semibold' : ''}>
                      ✓ At least 6 characters
                    </li>
                  </ul>
                </>
              )}
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition-colors mt-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-xs text-gray-600 mt-4">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 font-semibold hover:underline">
              Login
            </a>
          </p>
        </form>
      </div>
      <ToastContainer />
    </Authlayout>
  );
};

export default SignUpForm;