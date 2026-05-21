// saves token and user info after a successful login or signup
function storeSession(data) {
  localStorage.setItem("auth_token", data.token);
  localStorage.setItem("session_user", JSON.stringify(data.user));
}

function goToDashboard() {
  window.location.href = "./dashboard.html";
}
