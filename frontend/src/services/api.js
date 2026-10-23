
import axios from "axios";

const API_URL = "https://pixora-backend-2eai.onrender.com/api";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export default api;
