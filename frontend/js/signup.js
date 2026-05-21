document.addEventListener("DOMContentLoaded", () => {
  if (getSessionUser()) {
    goToDashboard();
    return;
  }

  const form = document.getElementById("signupForm");
  const submitBtn = document.getElementById("signupSubmit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert("signupMsg");
    setBtnState(submitBtn, true, "Create Account");

    try {
      const fields = Object.fromEntries(new FormData(form).entries());
      const { data } = await api.post("/auth/signup", fields);
      storeSession(data);
      goToDashboard();
    } catch (err) {
      showAlert("signupMsg", err.response?.data?.message || "Signup failed, please try again", "error");
    } finally {
      setBtnState(submitBtn, false, "Create Account");
    }
  });
});
