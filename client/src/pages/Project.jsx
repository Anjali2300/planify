import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";
import Sidebar from "../components/Sidebar";
import styles from "./Project.module.css";

function Project() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [projectData, setProjectData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [inviteSearch, setInviteSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

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

  const fetchProject = useCallback(async () => {
    try {
      const res = await API.get(`/projects/${id}`);
      setProjectData(res.data);
    } catch (err) {
      console.log(err);
    }
  }, [id]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await API.get(`/tasks/${id}`);
      setTasks(res.data);
    } catch (err) {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // check if current user is admin of this project
  const isCurrentUserAdmin = projectData?.members?.some(
    (m) => m._id?.toString() === currentUser._id?.toString() && m.role === "admin"
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchProject();
    fetchTasks();
  }, [navigate, fetchProject, fetchTasks]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!projectData || !isCurrentUserAdmin) return;

      try {
        setLoadingUsers(true);
        const res = await API.get("/users");
        setAllUsers(res.data || []);
      } catch (err) {
        setError("Failed to load active users.");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [projectData, isCurrentUserAdmin]);

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

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await API.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      setError("Failed to update task.");
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await API.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      setError("Failed to delete task.");
    }
  };

  const handleTaskDrop = async (status) => {
    if (!draggedTaskId) return;
    setDragOverColumn(null);
    await handleStatusChange(draggedTaskId, status);
    setDraggedTaskId(null);
  };

  const handleInvite = async (email) => {
    setInviting(true);
    setInviteMsg("");
    try {
      await API.post("/projects/invite", { projectId: id, email });
      setInviteMsg("User invited successfully! ✅");
      setInviteEmail("");
      setInviteSearch("");
      fetchProject();
      const res = await API.get("/users");
      setAllUsers(res.data || []);
    } catch (err) {
      setInviteMsg(err.response?.data?.message || "Failed to invite user.");
    } finally {
      setInviting(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    await handleInvite(inviteEmail.trim());
  };

  const inviteableUsers = (allUsers || [])
    .filter((user) => user._id?.toString() !== currentUser._id?.toString())
    .filter((user) => !projectData?.members?.some((member) => member._id?.toString() === user._id?.toString()))
    .filter((user) => {
      const search = inviteSearch.trim().toLowerCase();
      if (!search) return true;
      return (
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search)
      );
    });

  // filter tasks by status
  const todo = tasks.filter((t) => t.status === "todo");
  const inProgress = tasks.filter((t) => t.status === "inprogress");
  const done = tasks.filter((t) => t.status === "done");

  const TaskCard = ({ task }) => (
    <div
      className={`${styles.taskCard} ${draggedTaskId === task._id ? styles.taskCardDragging : ""}`}
      draggable
      onDragStart={() => setDraggedTaskId(task._id)}
      onDragEnd={() => {
        setDraggedTaskId(null);
        setDragOverColumn(null);
      }}
    >
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
        <button className={styles.deleteBtn} onClick={() => handleDelete(task._id)}>
          🗑
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <Sidebar />

      <div className={styles.main}>
        <div className={styles.container}>

          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>
                {projectData ? projectData.title : "Loading..."}
              </h1>
              <p className={styles.subtitle}>
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
              </p>
            </div>

            <div className={styles.headerActions}>
              {projectData && (
                <span className={isCurrentUserAdmin ? styles.roleAdmin : styles.roleMember}>
                  {isCurrentUserAdmin ? "👑 Admin" : "👤 Member"}
                </span>
              )}

              {projectData && (
                <button
                  className={styles.membersToggleBtn}
                  type="button"
                  onClick={() => setShowMembersDropdown((prev) => !prev)}
                >
                  Team ({projectData.members.length})
                  <span className={styles.dropdownArrow}>{showMembersDropdown ? "▲" : "▼"}</span>
                </button>
              )}

              {isCurrentUserAdmin && (
                <button
                  className={styles.invitePeopleBtn}
                  type="button"
                  onClick={() => setShowInvitePanel(true)}
                >
                  Invite People
                </button>
              )}
            </div>
            {projectData && showMembersDropdown && (
              <div className={styles.membersDropdownPanel}>
                {projectData.members.map((member) => (
                  <div key={member._id} className={styles.memberDropdownItem}>
                    <div className={styles.memberAvatar}>
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name || "Avatar"} />
                      ) : (
                        <span>{member.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className={styles.memberInfo}>
                      <span className={styles.memberName}>{member.name}</span>
                      <span className={styles.memberEmail}>{member.email}</span>
                    </div>
                    <span className={
                      member.role === "admin"
                        ? styles.roleAdminBadge
                        : styles.roleMemberBadge
                    }>
                      {member.role === "admin" ? "👑 Admin" : "👤 Member"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {/* MEMBERS LIST */}

          {showInvitePanel && isCurrentUserAdmin && (
            <div className={styles.inviteOverlay} onClick={() => setShowInvitePanel(false)}>
              <div className={styles.invitePanel} onClick={(e) => e.stopPropagation()}>
                <div className={styles.invitePanelHeader}>
                  <h3 className={styles.inviteTitle}>Invite Members</h3>
                  <button
                    type="button"
                    className={styles.inviteClose}
                    onClick={() => setShowInvitePanel(false)}
                  >
                    ✕
                  </button>
                </div>

                <form className={styles.inviteEmailForm} onSubmit={handleInviteSubmit}>
                  <input
                    className={styles.createInput}
                    type="email"
                    placeholder="Invite by email..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <button
                    className={inviting ? styles.createBtnDisabled : styles.createBtn}
                    type="submit"
                    disabled={inviting}
                  >
                    {inviting ? "Inviting..." : "Invite"}
                  </button>
                </form>

                <input
                  className={styles.inviteSearch}
                  type="text"
                  placeholder="Search active users..."
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                />

                {loadingUsers ? (
                  <div className={styles.loadingState}>Loading active users...</div>
                ) : inviteableUsers.length === 0 ? (
                  <p className={styles.inviteEmpty}>No active users to invite right now.</p>
                ) : (
                  <div className={styles.inviteUserList}>
                    {inviteableUsers.map((user) => (
                      <div key={user._id} className={styles.inviteUserItem}>
                        <div className={styles.inviteUserAvatar}>
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name || "User avatar"} />
                          ) : (
                            <span>{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
                          )}
                        </div>
                        <div className={styles.inviteUserInfo}>
                          <span className={styles.inviteUserName}>{user.name}</span>
                          <span className={styles.inviteUserEmail}>{user.email}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.inviteUserBtn}
                          onClick={() => handleInvite(user.email)}
                        >
                          Invite
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {inviteMsg && (
                  <p className={inviteMsg.includes("✅") ? styles.successMsg : styles.error}>
                    {inviteMsg}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CREATE TASK FORM */}
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

          {/* KANBAN BOARD */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading tasks...</p>
            </div>
          ) : (
            <div className={styles.board}>

              <div className={styles.column}>
                <div className={styles.columnHeader}>
                  <span className={`${styles.columnDot} ${styles.columnDotTodo}`}></span>
                  <h3 className={styles.columnTitle}>Todo</h3>
                  <span className={styles.columnCount}>{todo.length}</span>
                </div>
                <div className={styles.taskList}>
                  {todo.length === 0
                    ? <p className={styles.emptyCol}>No tasks here</p>
                    : todo.map((task) => <TaskCard key={task._id} task={task} />)
                  }
                </div>
              </div>

              <div
                className={`${styles.column} ${dragOverColumn === "inprogress" ? styles.columnActive : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColumn("inprogress");
                }}
                onDrop={() => handleTaskDrop("inprogress")}
              >
                <div className={styles.columnHeader}>
                  <span className={`${styles.columnDot} ${styles.columnDotInProgress}`}></span>
                  <h3 className={styles.columnTitle}>In Progress</h3>
                  <span className={styles.columnCount}>{inProgress.length}</span>
                </div>
                <div className={styles.taskList}>
                  {inProgress.length === 0
                    ? <p className={styles.emptyCol}>No tasks here</p>
                    : inProgress.map((task) => <TaskCard key={task._id} task={task} />)
                  }
                </div>
              </div>

              <div
                className={`${styles.column} ${dragOverColumn === "done" ? styles.columnActive : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColumn("done");
                }}
                onDrop={() => handleTaskDrop("done")}
              >
                <div className={styles.columnHeader}>
                  <span className={`${styles.columnDot} ${styles.columnDotDone}`}></span>
                  <h3 className={styles.columnTitle}>Done</h3>
                  <span className={styles.columnCount}>{done.length}</span>
                </div>
                <div className={styles.taskList}>
                  {done.length === 0
                    ? <p className={styles.emptyCol}>No tasks here</p>
                    : done.map((task) => <TaskCard key={task._id} task={task} />)
                  }
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Project;
