// figure out the backend URL — localhost for dev, env config for prod
const BASE_URL =
  window.APP_CONFIG?.API_URL ||
  (["127.0.0.1", "localhost"].includes(window.location.hostname)
    ? "http://localhost:5000/api"
    : "https://your-railway-backend-url.up.railway.app/api");

const api = axios.create({ baseURL: BASE_URL });

// attach auth token to every request if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// if the token expired or is invalid, kick the user back to login
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
