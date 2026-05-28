import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";
import styles from "./Project.module.css";

function Project() {
  const { id } = useParams(); // gets the project ID from the URL
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // ── runs once when page loads
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTasks();
  }, []);

  // ── fetch all tasks for this project
  const fetchTasks = async () => {
    try {
      const res = await API.get(`/tasks/${id}`);
      setTasks(res.data);
    } catch (err) {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  // ── create a new task
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setCreating(true);
    try {
      await API.post("/tasks", { title: newTask, projectId: id });
      setNewTask("");
      fetchTasks();
    } catch (err) {
      setError("Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  // ── update task status
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await API.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks(); // refresh
    } catch (err) {
      setError("Failed to update task.");
    }
  };

  // ── delete a task
  const handleDelete = async (taskId) => {
    try {
      await API.delete(`/tasks/${taskId}`);
      fetchTasks(); // refresh
    } catch (err) {
      setError("Failed to delete task.");
    }
  };

  // ── filter tasks by status
  const todo = tasks.filter((t) => t.status === "todo");
  const inProgress = tasks.filter((t) => t.status === "inprogress");
  const done = tasks.filter((t) => t.status === "done");

  // ── reusable task card
  const TaskCard = ({ task }) => (
    <div className={styles.taskCard}>
      <p className={styles.taskTitle}>{task.title}</p>
      <div className={styles.taskActions}>
        <select
          className={styles.select}
          value={task.status}
          onChange={(e) => handleStatusChange(task._id, e.target.value)}
        >
          <option value="todo">Todo</option>
          <option value="inprogress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <button
          className={styles.deleteBtn}
          onClick={() => handleDelete(task._id)}
        >
          🗑
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>

      {/* ── NAVBAR ── */}
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <button className={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>📋</div>
            <span className={styles.brandName}>Planify</span>
          </div>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        >
          Logout →
        </button>
      </nav>

      <div className={styles.container}>

        {/* ── HEADER ── */}
        <div className={styles.header}>
          <h1 className={styles.title}>Project Tasks</h1>
          <p className={styles.subtitle}>
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* ── CREATE TASK FORM ── */}
        <form className={styles.createForm} onSubmit={handleCreate}>
          <input
            className={styles.createInput}
            type="text"
            placeholder="Enter task name..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            required
          />
          <button
            className={creating ? styles.createBtnDisabled : styles.createBtn}
            type="submit"
            disabled={creating}
          >
            {creating ? "Adding..." : "+ Add Task"}
          </button>
        </form>

        {/* ── KANBAN BOARD ── */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading tasks...</p>
          </div>
        ) : (
          <div className={styles.board}>

            {/* TODO COLUMN */}
            <div className={styles.column}>
              <div className={styles.columnHeader}>
                <span className={styles.columnDot} style={{ background: "#6b7280" }}></span>
                <h3 className={styles.columnTitle}>Todo</h3>
                <span className={styles.columnCount}>{todo.length}</span>
              </div>
              <div className={styles.taskList}>
                {todo.length === 0 ? (
                  <p className={styles.emptyCol}>No tasks here</p>
                ) : (
                  todo.map((task) => <TaskCard key={task._id} task={task} />)
                )}
              </div>
            </div>

            {/* IN PROGRESS COLUMN */}
            <div className={styles.column}>
              <div className={styles.columnHeader}>
                <span className={styles.columnDot} style={{ background: "#f59e0b" }}></span>
                <h3 className={styles.columnTitle}>In Progress</h3>
                <span className={styles.columnCount}>{inProgress.length}</span>
              </div>
              <div className={styles.taskList}>
                {inProgress.length === 0 ? (
                  <p className={styles.emptyCol}>No tasks here</p>
                ) : (
                  inProgress.map((task) => <TaskCard key={task._id} task={task} />)
                )}
              </div>
            </div>

            {/* DONE COLUMN */}
            <div className={styles.column}>
              <div className={styles.columnHeader}>
                <span className={styles.columnDot} style={{ background: "#10b981" }}></span>
                <h3 className={styles.columnTitle}>Done</h3>
                <span className={styles.columnCount}>{done.length}</span>
              </div>
              <div className={styles.taskList}>
                {done.length === 0 ? (
                  <p className={styles.emptyCol}>No tasks here</p>
                ) : (
                  done.map((task) => <TaskCard key={task._id} task={task} />)
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default Project;