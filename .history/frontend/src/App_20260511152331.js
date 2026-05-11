import { useState, useEffect } from "react";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState("");
  const [domain, setDomain] = useState("");
  const [domains, setDomains] = useState([]);
  const [message, setMessage] = useState("");

  const fetchDomains = async () => {
    const res = await fetch("http://127.0.0.1:8000/domains");
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
    const res = await fetch("http://127.0.0.1:8000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

  const addDomain = async () => {
    const res = await fetch(
      `http://127.0.0.1:8000/domains?token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain_name: domain }),
      }
    );

    if (res.ok) {
      setDomain("");
      setMessage("Domain added ✅");
      fetchDomains();
    } else {
      setMessage("Add domain failed ❌");
    }
  };

  const checkDomain = async (id) => {
    await fetch(`http://127.0.0.1:8000/check/${id}`, {
      method: "POST",
    });

    fetchDomains();
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🌐 Domain Monitoring</h1>

      {!token && (
        <div>
          <h2>Login</h2>

          <input
            style={{ padding: 8, marginRight: 10 }}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <br /><br />

          <input
            style={{ padding: 8, marginRight: 10 }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <br /><br />

          <button onClick={login}>Login</button>
        </div>
      )}

      {token && (
        <div>
          <h2>Add Domain</h2>

          <input
            style={{ padding: 8, marginRight: 10 }}
            placeholder="Enter domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />

          <button onClick={addDomain}>Add</button>
        </div>
      )}

      <p>{message}</p>

      <h2>Domains</h2>

      <ul>
        {domains.map((d, i) => (
          <li
            key={i}
            style={{
              color: d.current_status === "up" ? "green" : "red",
              fontWeight: "bold",
              marginBottom: 10,
            }}
          >
            {d.domain_name} - {d.current_status}

            <button
              onClick={() => checkDomain(d.id)}
              style={{ marginLeft: 10 }}
            >
              Check
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;