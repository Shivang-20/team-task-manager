let me;
let thisProjectId;
let projectMembersList = [];

document.addEventListener("DOMContentLoaded", async () => {
  me = requireLogin();
  if (!me) return;

  buildNavbar("projects");

  const params = new URLSearchParams(window.location.search);
  thisProjectId = params.get("id");

  if (!thisProjectId) {
    showAlert("pageMsg", "No project ID in the URL", "error");
    return;
  }

  document.getElementById("addTaskBtn")?.addEventListener("click", () => openTaskModal());
  document.getElementById("closeTaskModal")?.addEventListener("click", () => closeTaskModal());
  document.getElementById("taskForm")?.addEventListener("submit", handleTaskSubmit);

  if (me.role !== "admin") {
    document.querySelectorAll("[data-admin-only]").forEach((el) => el.classList.add("hide"));
  }

  await loadPage();
});

function openTaskModal() {
  document.getElementById("taskModal").classList.add("show");
}

function closeTaskModal() {
  document.getElementById("taskModal").classList.remove("show");
}

async function loadPage() {
  try {
    showAlert("pageMsg", "Loading project...");

    const [projRes, tasksRes] = await Promise.all([
      api.get(`/projects/${thisProjectId}`),
      api.get(`/tasks/project/${thisProjectId}`)
    ]);

    const proj = projRes.data;
    projectMembersList = proj.members || [];

    document.getElementById("projTitle").textContent = proj.title;
    document.getElementById("projDesc").textContent = proj.description;
    document.getElementById("memberCount").textContent = proj.members.length;
    document.getElementById("taskCount").textContent = proj.taskCount;

    document.getElementById("memberList").innerHTML = proj.members
      .map((m) => `<div class="project-item">${m.name} <span class="muted">(${m.role})</span></div>`)
      .join("");

    // populate the assignee dropdown in the task creation form
    const assignSelect = document.getElementById("assigneeSelect");
    assignSelect.innerHTML = projectMembersList
      .map((m) => `<option value="${m._id}">${m.name} (${m.role})</option>`)
      .join("");

    renderTaskList(tasksRes.data);
    hideAlert("pageMsg");
  } catch (err) {
    showAlert("pageMsg", err.response?.data?.message || "Couldn't load project", "error");
  }
}

function renderTaskList(tasks) {
  const container = document.getElementById("tasksList");

  if (!tasks.length) {
    container.innerHTML = '<div class="empty-state">No tasks for this project yet.</div>';
    return;
  }

  container.innerHTML = tasks
    .map(
      (t) => `
      <div class="task-item">
        <div class="task-top">
          <div>
            <p class="task-title">${t.title}</p>
            <div class="muted">${t.description}</div>
          </div>
          <span class="badge ${t.status}">${t.status}</span>
        </div>
        <div class="meta-row">
          <span class="badge ${t.priority}">${t.priority} priority</span>
          <span class="muted">Assigned to: ${t.assignedTo?.name || "N/A"}</span>
          <span class="muted">Due: ${fmtDate(t.dueDate)}</span>
          ${isPastDue(t) ? '<span class="badge high">overdue</span>' : ""}
        </div>
        ${
          me.role === "admin"
            ? `
          <div class="actions-row">
            <button class="btn-danger" data-del-task="${t._id}">Delete</button>
          </div>
        `
            : `
          <div class="actions-row">
            <select data-task-status="${t._id}">
              <option value="pending" ${t.status === "pending" ? "selected" : ""}>Pending</option>
              <option value="in-progress" ${t.status === "in-progress" ? "selected" : ""}>In Progress</option>
              <option value="completed" ${t.status === "completed" ? "selected" : ""}>Completed</option>
            </select>
            <button class="btn-primary" data-update-task="${t._id}">Save</button>
          </div>
        `
        }
      </div>
    `
    )
    .join("");

  attachTaskHandlers();
}

function attachTaskHandlers() {
  document.querySelectorAll("[data-del-task]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!window.confirm("Delete this task?")) return;

      try {
        await api.delete(`/tasks/${btn.dataset.delTask}`);
        showAlert("pageMsg", "Task deleted", "success");
        await loadPage();
      } catch (err) {
        showAlert("pageMsg", err.response?.data?.message || "Delete failed", "error");
      }
    });
  });

  document.querySelectorAll("[data-update-task]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.updateTask;
      const newStatus = document.querySelector(`[data-task-status="${id}"]`).value;

      try {
        await api.put(`/tasks/${id}`, { status: newStatus });
        showAlert("pageMsg", "Status saved", "success");
        await loadPage();
      } catch (err) {
        showAlert("pageMsg", err.response?.data?.message || "Couldn't update status", "error");
      }
    });
  });
}

async function handleTaskSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("submitTaskBtn");
  hideAlert("taskFormMsg");
  setBtnState(btn, true, "Create Task");

  try {
    const form = document.getElementById("taskForm");
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.projectId = thisProjectId;

    await api.post("/tasks", payload);
    form.reset();
    closeTaskModal();
    showAlert("pageMsg", "Task created!", "success");
    await loadPage();
  } catch (err) {
    showAlert("taskFormMsg", err.response?.data?.message || "Failed to create task", "error");
  } finally {
    setBtnState(btn, false, "Create Task");
  }
}
