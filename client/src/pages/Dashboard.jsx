import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import styles from "./Dashboard.module.css";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ── runs once when page loads
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login"); // not logged in → redirect
      return;
    }
    fetchProjects();
  }, []);

  // ── fetch all projects from backend
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

  // ── create a new project
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await API.post("/projects", { title: newTitle });
      // Optimistic UI update or append to state instead of full fetch
      setProjects((prev) => [...prev, res.data]);
      setNewTitle("");
    } catch (err) {
      setError("Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  // ── logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
  <div className={styles.page}>
    <Sidebar />
    <div className={styles.main}>

      <div className={styles.container}>
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
            {projects.map((project) => (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

}

export default Dashboard;