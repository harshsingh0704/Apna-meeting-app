import axios from "axios";
import httpStatus from "http-status";
import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext(null);

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

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

  return (
    <AuthContext.Provider
      value={{
        userData,
        setUserData,
        handleRegister,
        handleLogin,
        getHistoryOfUser,
        addToUserHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
