let teamMembers = [];

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireLogin();
  if (!user) return;

  buildNavbar("projects");
  showAdminControls(user.role === "admin");

  document.getElementById("newProjectBtn")?.addEventListener("click", () => openModal("projectModal"));
  document.getElementById("closeProjectModal")?.addEventListener("click", () => closeModal("projectModal"));
  document.getElementById("projectForm")?.addEventListener("submit", handleProjectSubmit);

  await Promise.all([loadProjects(), maybeLoadUsers(user.role)]);
});

function showAdminControls(isAdmin) {
  if (isAdmin) return;
  document.querySelectorAll("[data-admin-only]").forEach((el) => el.classList.add("hide"));
}

function openModal(id) {
  document.getElementById(id).classList.add("show");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

async function loadProjects() {
  try {
    showAlert("projectsMsg", "Fetching projects...");
    const { data } = await api.get("/projects");
    const listEl = document.getElementById("projectsList");

    if (!data.length) {
      listEl.innerHTML = '<div class="empty-state">No projects yet. Create one to get started.</div>';
      hideAlert("projectsMsg");
      return;
    }

    listEl.innerHTML = data
      .map(
        (p) => `
        <div class="project-item">
          <div class="project-top">
            <div>
              <p class="project-title">${p.title}</p>
              <div class="muted">${p.description}</div>
            </div>
            <a class="btn-secondary" href="./project-details.html?id=${p._id}">View</a>
          </div>
          <div class="meta-row">
            <span class="muted">${p.members.length} member${p.members.length !== 1 ? "s" : ""}</span>
            <span class="muted">Created by ${p.createdBy?.name || "N/A"}</span>
          </div>
        </div>
      `
      )
      .join("");

    hideAlert("projectsMsg");
  } catch (err) {
    showAlert("projectsMsg", err.response?.data?.message || "Couldn't load projects", "error");
  }
}

// only admin needs the user list (for member picker)
async function maybeLoadUsers(role) {
  if (role !== "admin") return;

  try {
    const { data } = await api.get("/users");
    teamMembers = data;

    document.getElementById("memberCheckboxes").innerHTML = data
      .map(
        (u) => `
        <label class="checkbox-item">
          <input type="checkbox" name="members" value="${u._id}" />
          <span>${u.name} (${u.role})</span>
        </label>
      `
      )
      .join("");
  } catch (err) {
    showAlert("projectsMsg", err.response?.data?.message || "Couldn't load team members", "error");
  }
}

async function handleProjectSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("submitProjectBtn");
  hideAlert("projectFormMsg");
  setBtnState(btn, true, "Create Project");

  try {
    const form = document.getElementById("projectForm");
    const fd = new FormData(form);
    const payload = {
      title: fd.get("title"),
      description: fd.get("description"),
      members: fd.getAll("members")
    };

    await api.post("/projects", payload);
    form.reset();
    closeModal("projectModal");
    showAlert("projectsMsg", "Project created!", "success");
    await loadProjects();
  } catch (err) {
    showAlert("projectFormMsg", err.response?.data?.message || "Failed to create project", "error");
  } finally {
    setBtnState(btn, false, "Create Project");
  }
}
