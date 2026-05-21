document.addEventListener("DOMContentLoaded", () => {
  // if the user is already logged in, skip this page
  if (getSessionUser()) {
    goToDashboard();
    return;
  }

  const form = document.getElementById("loginForm");
  const submitBtn = document.getElementById("loginSubmit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert("loginMsg");
    setBtnState(submitBtn, true, "Login");

    try {
      const fields = Object.fromEntries(new FormData(form).entries());
      const { data } = await api.post("/auth/login", fields);
      storeSession(data);
      goToDashboard();
    } catch (err) {
      showAlert("loginMsg", err.response?.data?.message || "Login failed, try again", "error");
    } finally {
      setBtnState(submitBtn, false, "Login");
    }
  });
});
