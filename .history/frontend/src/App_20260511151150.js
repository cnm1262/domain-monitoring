import { useState, useEffect } from "react";

function App() {
  const [domain, setDomain] = useState("");
  const [domains, setDomains] = useState([]);
  const [token, setToken] = useState("");

  // 📥 جلب domains من backend
  const fetchDomains = async () => {
    const res = await fetch("http://127.0.0.1:8000/domains");
    const data = await res.json();
    setDomains(data);
  };

  // 🔄 ملي يتحل الموقع
  useEffect(() => {
    fetchDomains();
  }, []);

  // ➕ إضافة domain
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

    const data = await res.json();

    // نعاودو نجيبو لائحة جديدة
    fetchDomains();
    setDomain("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🌐 Domain Monitoring</h1>

      <input
        placeholder="Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        style={{ width: "300px" }}
      />

      <br /><br />

      <input
        placeholder="Enter domain"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      />

      <button onClick={addDomain}>Add</button>

      <h2>Domains</h2>

      <ul>
        {domains.map((d, i) => (
          <li
            key={i}
            style={{
              color: d.current_status === "up" ? "green" : "red",
              fontWeight: "bold",
            }}
          >
            {d.domain_name} - {d.current_status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;