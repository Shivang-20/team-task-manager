
const BASE_URL =
  window.APP_CONFIG?.API_URL ||
  (["127.0.0.1", "localhost"].includes(window.location.hostname)
    ? "http://localhost:5000/api"
    : "https://team-task-manager-production-f9b0.up.railway.app/api");

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("session_user");

      const onAuthPage =
        window.location.pathname.includes("login.html") ||
        window.location.pathname.includes("signup.html");

      if (!onAuthPage) {
        window.location.href = "./login.html";
      }
    }
    return Promise.reject(err);
  }
);
