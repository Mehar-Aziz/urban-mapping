import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const saveLocation = async (name, geojson, projection) => {
    const response = await axios.post(`${API_URL}/save-location/`, { name, geojson, projection });
    return response.data;
};

export const getLocations = async () => {
    const response = await axios.get(`${API_URL}/get-locations/`);
    return response.data;
};
