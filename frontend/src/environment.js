// Vite build ke hisaab se env choose karega
const IS_PROD = import.meta.env.PROD;

// Optional: VITE_BACKEND_URL set ho to use karo, warna default domains
const server = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL
  : IS_PROD
    ? "https://apnacollegebackend.onrender.com"
    : "http://localhost:8000";

export default server;
