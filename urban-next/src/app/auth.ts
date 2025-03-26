import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

// Login User
export const loginUser = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/token`, {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Register User
export const registerUser = async (username: string, email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};
