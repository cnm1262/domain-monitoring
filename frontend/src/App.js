import { useState, useEffect } from "react";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [domain, setDomain] = useState("");
  const [domains, setDomains] = useState([]);
  const [message, setMessage] = useState("");

  const fetchDomains = async () => {
    const res = await fetch("https://domain-monitoring-i1om.onrender.com/domains");
    const data = await res.json();
    setDomains(data);
  };

  useEffect(() => {
    fetchDomains();

    const interval = setInterval(() => {
      fetchDomains();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const login = async () => {
    const res = await fetch("https://domain-monitoring-i1om.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setToken(data.access_token);
      setMessage("Login successful ✅");
      fetchDomains();
    } else {
      setMessage("Login failed ❌");
    }
  };

  const logout = () => {
    setToken("");
    setEmail("");
    setPassword("");
    setMessage("Logged out");
  };

  const addDomain = async () => {
    const res = await fetch(`https://domain-monitoring-i1om.onrender.com/domains?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain_name: domain }),
    });

    if (res.ok) {
      setDomain("");
      setMessage("Domain added ✅");
      fetchDomains();
    } else {
      const data = await res.json();
      setMessage(data.detail || "Add domain failed ❌");
    }
  };

  const checkDomain = async (id) => {
    await fetch(`https://domain-monitoring-i1om.onrender.com/check/${id}`, {
      method: "POST",
    });

    fetchDomains();
  };

  const deleteDomain = async (id) => {
    await fetch(`https://domain-monitoring-i1om.onrender.com/domains/${id}`, {
      method: "DELETE",
    });

    setMessage("Domain deleted ✅");
    fetchDomains();
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🌐 Domain Monitoring</h1>
          {token && (
            <button onClick={logout} style={styles.logoutButton}>
              Logout
            </button>
          )}
        </div>

        {!token && (
          <div style={styles.card}>
            <h2>Login</h2>

            <input
              style={styles.input}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={login} style={styles.primaryButton}>
              Login
            </button>
          </div>
        )}

        {token && (
          <div style={styles.card}>
            <h2>Add Domain</h2>

            <input
              style={styles.input}
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />

            <button onClick={addDomain} style={styles.primaryButton}>
              Add Domain
            </button>
          </div>
        )}

        {message && <p style={styles.message}>{message}</p>}

        <h2 style={styles.sectionTitle}> </h2>

        <div style={styles.grid}>
          {domains.map((d) => (
            <div key={d.id} style={styles.domainCard}>
              <div>
                <h3 style={styles.domainName}>{d.domain_name}</h3>

                <span
                  style={{
                    ...styles.badge,
                    backgroundColor:
                      d.current_status === "up" ? "#d1fae5" : "#fee2e2",
                    color: d.current_status === "up" ? "#047857" : "#b91c1c",
                  }}
                >
                  {d.current_status.toUpperCase()}
                </span>
              </div>

              <div style={styles.actions}>
                <button
                  onClick={() => checkDomain(d.id)}
                  style={styles.checkButton}
                >
                  Check
                </button>

                <button
                  onClick={() => deleteDomain(d.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f7fb",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },
  title: {
    fontSize: "38px",
    margin: 0,
  },
  card: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "14px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  },
  input: {
    display: "block",
    width: "100%",
    maxWidth: "350px",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#111827",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  message: {
    fontWeight: "bold",
    color: "#2563eb",
  },
  sectionTitle: {
    marginTop: "30px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
  },
  domainCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  domainName: {
    margin: "0 0 10px 0",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "13px",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  checkButton: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default App;