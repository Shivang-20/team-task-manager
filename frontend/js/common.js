function getSessionUser() {
  const raw = localStorage.getItem("session_user");
  return raw ? JSON.parse(raw) : null;
}

// redirect to login if there's no active session
function requireLogin() {
  const token = localStorage.getItem("auth_token");
  const user = getSessionUser();

  if (!token || !user) {
    window.location.href = "./login.html";
    return null;
  }

  return user;
}

function signOut() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("session_user");
  window.location.href = "./login.html";
}

// formats a date like "15 Jun 2026"
function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function isPastDue(task) {
  return new Date(task.dueDate) < new Date() && task.status !== "completed";
}

function showAlert(elementId, text, type = "") {
  const box = document.getElementById(elementId);
  if (!box) return;
  box.className = ("message " + type).trim();
  box.textContent = text;
  box.classList.remove("hide");
}

function hideAlert(elementId) {
  const box = document.getElementById(elementId);
  if (!box) return;
  box.textContent = "";
  box.className = "message hide";
}

function setBtnState(btn, busy, label = "Submit") {
  if (!btn) return;
  btn.disabled = busy;
  btn.textContent = busy ? "Please wait..." : label;
}

function buildNavbar(activePage) {
  const user = requireLogin();
  if (!user) return;

  const nav = document.getElementById("navbar");
  if (!nav) return;

  nav.innerHTML = `
    <div class="nav-links">
      <a class="brand" href="./dashboard.html">
        <span class="brand-badge">TT</span>
        <div>
          <strong>Task Manager</strong>
        </div>
      </a>
      <a class="nav-link ${activePage === "dashboard" ? "active" : ""}" href="./dashboard.html">Dashboard</a>
      <a class="nav-link ${activePage === "projects" ? "active" : ""}" href="./projects.html">Projects</a>
    </div>
    <div class="nav-actions">
      <span class="muted">${user.name} &mdash; ${user.role}</span>
      <button id="logoutBtn" class="btn-secondary">Logout</button>
    </div>
  `;

  document.getElementById("logoutBtn").addEventListener("click", signOut);
}

function buildTaskCard(task, userRole) {
  const isMember = userRole === "member";

  return `
    <div class="task-item">
      <div class="task-top">
        <div>
          <p class="task-title">${task.title}</p>
          <div class="muted">${task.description}</div>
        </div>
        <span class="badge ${task.status}">${task.status}</span>
      </div>
      <div class="meta-row">
        <span class="badge ${task.priority}">${task.priority} priority</span>
        <span class="muted">Project: ${task.projectId?.title || "N/A"}</span>
        <span class="muted">Assigned to: ${task.assignedTo?.name || "Unassigned"}</span>
        <span class="muted">Due: ${fmtDate(task.dueDate)}</span>
        ${isPastDue(task) ? '<span class="badge high">overdue</span>' : ""}
      </div>
      ${
        isMember
          ? `
        <div class="actions-row">
          <select data-task-status="${task._id}">
            <option value="pending" ${task.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In Progress</option>
            <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
          </select>
          <button class="btn-primary" data-save-status="${task._id}">Update Status</button>
        </div>
      `
          : ""
      }
    </div>
  `;
}
