document.addEventListener("DOMContentLoaded", async () => {
  const user = requireLogin();
  if (!user) return;

  buildNavbar("dashboard");

  const msgBox = "dashMsg";

  try {
    showAlert(msgBox, "Loading your dashboard...");
    const { data } = await api.get("/tasks/dashboard/stats");

    document.getElementById("totalCount").textContent = data.totalTasks;
    document.getElementById("doneCount").textContent = data.completedTasks;
    document.getElementById("waitingCount").textContent = data.pendingTasks;
    document.getElementById("overdueCount").textContent = data.overdueTasks;

    const recentEl = document.getElementById("recentTasksList");
    recentEl.innerHTML = data.recentTasks.length
      ? data.recentTasks.map((t) => buildTaskCard(t, user.role)).join("")
      : '<div class="empty-state">No tasks yet — check back after some work is assigned.</div>';

    hookStatusButtons();
    hideAlert(msgBox);
  } catch (err) {
    showAlert(msgBox, err.response?.data?.message || "Couldn't load dashboard right now", "error");
  }
});

function hookStatusButtons() {
  document.querySelectorAll("[data-save-status]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.saveStatus;
      const select = document.querySelector(`[data-task-status="${id}"]`);

      try {
        btn.disabled = true;
        await api.put(`/tasks/${id}`, { status: select.value });
        showAlert("dashMsg", "Status updated!", "success");
      } catch (err) {
        showAlert("dashMsg", err.response?.data?.message || "Couldn't update status", "error");
      } finally {
        btn.disabled = false;
      }
    });
  });
}
