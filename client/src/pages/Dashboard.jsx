import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Sidebar from "../components/Sidebar";
import styles from "./Dashboard.module.css";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // safely get current user from localStorage
  let currentUser = {};
  try {
    const stored = localStorage.getItem("user");
    if (stored && stored !== "undefined") {
      currentUser = JSON.parse(stored);
    }
  } catch (e) {
    currentUser = {};
  }

  const fetchProjects = async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data);
    } catch (err) {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProjects();
  }, [navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await API.post("/projects", { title: newTitle });
      setNewTitle("");
      fetchProjects();
    } catch (err) {
      setError("Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.page}>
      <Sidebar />

      <div className={styles.main}>
        <div className={styles.container}>

          {/* ── HEADER ── */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>My Projects</h1>
              <p className={styles.subtitle}>
                {projects.length === 0
                  ? "No projects yet — create your first one!"
                  : `You have ${projects.length} project${projects.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {/* ── CREATE PROJECT FORM ── */}
          <form className={styles.createForm} onSubmit={handleCreate}>
            <input
              className={styles.createInput}
              type="text"
              placeholder="Enter project name..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <button
              className={creating ? styles.createBtnDisabled : styles.createBtn}
              type="submit"
              disabled={creating}
            >
              {creating ? "Creating..." : "+ New Project"}
            </button>
          </form>

          {/* ── PROJECTS GRID ── */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading your projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📁</div>
              <h3>No projects yet</h3>
              <p>Create your first project above to get started</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {projects.map((project) => {
                // find current user's role in this project
                const myMember = project.members.find(
                  (m) => m.userId?.toString() === currentUser._id?.toString()
                );
                const myRole = myMember ? myMember.role : "member";

                return (
                  <div
                    key={project._id}
                    className={styles.card}
                    onClick={() => navigate(`/project/${project._id}`)}
                  >
                    <div className={styles.cardTop}>
                      <div className={styles.cardIcon}>📌</div>
                      <div className={styles.cardArrow}>→</div>
                    </div>
                    <h3 className={styles.cardTitle}>{project.title}</h3>
                    <p className={styles.cardMeta}>
                      {project.members.length} member{project.members.length !== 1 ? "s" : ""}
                    </p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardTag}>Active</span>
                      <span className={
                        myRole === "admin"
                          ? styles.cardRoleAdmin
                          : styles.cardRoleMember
                      }>
                        {myRole === "admin" ? "👑 Admin" : "👤 Member"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Dashboard;
