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

// Get All Users
export const getAllUsers = async (token?: string) => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.get(`${API_URL}/users`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Delete User
export const deleteUser = async (userId: number, token?: string) => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.delete(`${API_URL}/users/${userId}`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Create Project
export const createProject = async (name: string, description: string, token?: string) => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.post(`${API_URL}/projects`, {
      name,
      description,
    }, { headers });
    
    return response.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

// Get All Projects
export const getAllProjects = async (token?: string) => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.get(`${API_URL}/projects`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

// Get Project by ID
export const getProjectById = async (projectId: number, token?: string) => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.get(`${API_URL}/projects/${projectId}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    throw error;
  }
};

// Update Project
export const updateProject = async (
  projectId: number,
  data: { name?: string; description?: string },
  token?: string
) => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.put(`${API_URL}/projects/${projectId}`, data, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error);
    throw error;
  }
};

// Delete Project
export const deleteProject = async (projectId: number, token?: string) => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.delete(`${API_URL}/projects/${projectId}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    throw error;
  }
};