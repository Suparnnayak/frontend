import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000/api",
  timeout: 10000,
});

export default http;
