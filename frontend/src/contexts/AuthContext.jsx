import axios from "axios";
import httpStatus from "http-status";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext(null);

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await client.get("/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUserData(res.data);
        } catch (error) {
          console.error("Failed to fetch user", error);
          // Token might be invalid, so clear it
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);
  
  // ✅ REGISTER
  const handleRegister = async (name, username, password) => {
    try {
      const res = await client.post("/register", {
        name,
        username,
        password,
      });

      if (res.status === httpStatus.CREATED) {
        return res.data.message;
      }
    } catch (err) {
      console.error("Register error:", err.response?.data || err.message);
      throw err;
    }
  };

  // ✅ LOGIN
  const handleLogin = async (username, password) => {
    try {
      const res = await client.post("/login", {
        username,
        password,
      });

      if (res.status === httpStatus.OK) {
        localStorage.setItem("token", res.data.token);
        setUserData(res.data.user);
        navigate("/home");
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      throw err;
    }
  };

  // ✅ GET HISTORY
  const getHistoryOfUser = async () => {
    try {
      const res = await client.get("/get_all_activity", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return res.data;
    } catch (err) {
      console.error("History error:", err.response?.data || err.message);
      throw err;
    }
  };

  // ✅ ADD HISTORY
  const addToUserHistory = async (meetingCode) => {
    try {
      const res = await client.post(
        "/add_to_activity",
        { meeting_code: meetingCode },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return res.data;
    } catch (err) {
      console.error("Add history error:", err.response?.data || err.message);
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserData(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{
        userData,
        loading,
        setUserData,
        token: localStorage.getItem("token"),
        handleRegister,
        handleLogin,
        getHistoryOfUser,
        addToUserHistory,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
