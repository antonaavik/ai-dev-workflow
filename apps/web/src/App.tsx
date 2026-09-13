import { useEffect, useState } from "react";

interface HealthResponse {
  status: string;
  timestamp: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      );
  }, []);

  return (
    <main>
      <h1>dev-workflow</h1>
      <p>React + Vite + TypeScript web app.</p>
      <section>
        <h2>Server status</h2>
        {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
        {!error && !health && <p>Checking…</p>}
        {health && (
          <p>
            <strong>{health.status}</strong> — {health.timestamp}
          </p>
        )}
      </section>
    </main>
  );
}
