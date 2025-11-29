import axios from "axios";

// Frontend talks only to our backend proxy to avoid browser CORS issues.
// Backend then calls the external Arogya AI service.
const agents = axios.create({
  baseURL:
    import.meta.env.VITE_AGENT_PROXY_BASE ||
    import.meta.env.VITE_API_BASE ||
    "http://localhost:5000/api",
  timeout: 15000,
});

export default agents;


