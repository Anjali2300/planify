import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import styles from "./Register.module.css";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await API.post("/register", form);
      navigate("/login");
    } catch (err) {
  // err.response.data.message contains the exact message from your backend
  if (err.response && err.response.data && err.response.data.message) {
    setError(err.response.data.message);
  } else {
    setError("Something went wrong. Please try again.");
  }
}finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>

      {/* ── LEFT PANEL ── */}
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>📋</div>
          <span className={styles.brandName}>Planify</span>
        </div>

        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Plan smarter,<br />
            <span>ship faster.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Planify helps teams organise projects, track tasks,
            and collaborate — all in one place.
          </p>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureDot}></div>
            <span>Create and manage projects with your team</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureDot}></div>
            <span>Track tasks with todo, in-progress, done statuses</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureDot}></div>
            <span>Invite team members and collaborate in real time</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={styles.right}>
        <div className={styles.formCard}>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Create account</h2>
            <p className={styles.formSubtitle}>
              Already have an account?{" "}
              <span onClick={() => navigate("/login")}>Sign in</span>
            </p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Full Name</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>👤</span>
                <input
                  className={styles.input}
                  type="text"
                  name="name"
                  placeholder="Anjali Singh"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>✉️</span>
                <input
                  className={styles.input}
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  className={styles.input}
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              className={loading ? styles.buttonDisabled : styles.button}
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating your account..." : "Create Account →"}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}

export default Register;
