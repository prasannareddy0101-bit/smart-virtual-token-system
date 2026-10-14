import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { playNotificationSound } from "./utils/notificationSound";

const API_URL = "http://192.168.0.5:5000";

export default function LiveTokenDisplay() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadQueue = async () => {
    try {
      const response = await fetch(`${API_URL}/queue`);

      if (!response.ok) {
        throw new Error("Unable to fetch queue");
      }

      const data = await response.json();

      // Accept either a direct array or an object containing tokens.
      const queue = Array.isArray(data)
        ? data
        : Array.isArray(data.tokens)
        ? data.tokens
        : Array.isArray(data.queue)
        ? data.queue
        : [];

      setTokens(queue);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Queue loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();

    const socket = io(API_URL);

    // Refresh automatically whenever the backend broadcasts queue changes.
    socket.on("queueUpdated", loadQueue);

    // Backup refresh in case a socket event is missed.
    const refreshInterval = setInterval(loadQueue, 10000);

    return () => {
      socket.off("queueUpdated", loadQueue);
      socket.disconnect();
      clearInterval(refreshInterval);
    };
  }, []);

  const waitingTokens = tokens
    .filter((token) => token.status?.toLowerCase() === "waiting")
    .sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();

      if (aTime && bTime && aTime !== bTime) {
        return aTime - bTime;
      }

      return Number(a.id || 0) - Number(b.id || 0);
    });

  const servingTokens = tokens.filter(
    (token) => token.status?.toLowerCase() === "called"
  );

  const completedCount = tokens.filter(
    (token) => token.status?.toLowerCase() === "completed"
  ).length;

  const formatToken = (token) =>
    token?.token_number || token?.token || "--";

  const formatCounter = (token) =>
    token?.counterNumber ??
    token?.counter_number ??
    token?.counter ??
    "--";

  return (
    <div className="live-display">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #101827;
        }

        .live-display {
          min-height: 100vh;
          background: linear-gradient(135deg, #101827, #172554);
          color: white;
          padding: 24px;
        }

        .display-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .display-header h1 {
          font-size: clamp(28px, 4vw, 48px);
          margin: 0 0 10px;
          letter-spacing: 1px;
        }

        .display-header p {
          color: #cbd5e1;
          font-size: 16px;
          margin: 0;
        }

        .live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          color: #86efac;
          font-size: 14px;
          font-weight: bold;
        }

        .live-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 12px #22c55e;
        }

        .serving-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }

        .serving-card {
          background: #ffffff;
          color: #111827;
          border-radius: 20px;
          padding: 28px 20px;
          text-align: center;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
          border-top: 6px solid #22c55e;
        }

        .serving-label {
          font-size: 17px;
          color: #475569;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .serving-number {
          font-size: clamp(44px, 7vw, 76px);
          font-weight: 900;
          color: #16a34a;
          margin: 18px 0;
          overflow-wrap: anywhere;
        }

        .serving-service {
          font-size: 17px;
          color: #475569;
          overflow-wrap: anywhere;
        }

        .counter-label {
          display: inline-block;
          background: #dcfce7;
          color: #166534;
          padding: 9px 18px;
          border-radius: 30px;
          margin-top: 15px;
          font-weight: bold;
        }

        .section-card {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 24px;
        }

        .section-card h2 {
          margin: 0 0 18px;
          font-size: 24px;
        }

        .waiting-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
          gap: 14px;
        }

        .waiting-token {
          background: #f8fafc;
          color: #0f172a;
          padding: 18px 10px;
          border-radius: 12px;
          text-align: center;
          border-bottom: 4px solid #f59e0b;
        }

        .waiting-number {
          font-size: 27px;
          font-weight: 900;
          overflow-wrap: anywhere;
        }

        .waiting-service {
          margin-top: 7px;
          font-size: 12px;
          color: #475569;
          overflow-wrap: anywhere;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 20px;
          text-align: center;
        }

        .summary-number {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .summary-label {
          color: #cbd5e1;
          font-size: 14px;
        }

        .empty-message {
          text-align: center;
          padding: 24px 10px;
          color: #cbd5e1;
          font-size: 17px;
        }

        .display-footer {
          text-align: center;
          padding: 16px 0 4px;
          color: #94a3b8;
          font-size: 13px;
        }

        @media (max-width: 600px) {
          .live-display {
            padding: 15px;
          }

          .section-card {
            padding: 16px;
          }

          .serving-card {
            padding: 22px 14px;
          }
        }
      `}</style>

      <header className="display-header">
        <h1>SMART VIRTUAL TOKEN SYSTEM</h1>
        <p>Please watch the screen for your token number.</p>

        <div className="live-indicator">
          <span className="live-dot"></span>
          LIVE QUEUE UPDATES
        </div>
      </header>

      {loading ? (
        <div className="empty-message">Loading live queue...</div>
      ) : (
        <>
          <section className="serving-grid">
            {servingTokens.length > 0 ? (
              servingTokens.map((token) => (
                <div
                  className="serving-card"
                  key={token.id || token.token_number || token.token}
                >
                  <div className="serving-label">Now Serving</div>

                  <div className="serving-number">
                    {formatToken(token)}
                  </div>

                  <div className="serving-service">
                    {token.service || "General Service"}
                  </div>

                  <div className="counter-label">
                    Counter {formatCounter(token)}
                  </div>
                </div>
              ))
            ) : (
              <div className="serving-card">
                <div className="serving-label">Now Serving</div>
                <div className="serving-number">---</div>
                <div className="serving-service">
                  No token is currently being served.
                </div>
              </div>
            )}
          </section>

          <section className="summary-grid">
            <div className="summary-card">
              <div className="summary-number">{waitingTokens.length}</div>
              <div className="summary-label">Tokens Waiting</div>
            </div>

            <div className="summary-card">
              <div className="summary-number">{servingTokens.length}</div>
              <div className="summary-label">Currently Serving</div>
            </div>

            <div className="summary-card">
              <div className="summary-number">{completedCount}</div>
              <div className="summary-label">Completed Tokens</div>
            </div>
          </section>

          <section className="section-card">
            <h2>Next Tokens in Queue</h2>

            {waitingTokens.length === 0 ? (
              <div className="empty-message">
                No tokens are currently waiting.
              </div>
            ) : (
              <div className="waiting-grid">
                {waitingTokens.slice(0, 12).map((token) => (
                  <div
                    className="waiting-token"
                    key={token.id || token.token_number || token.token}
                  >
                    <div className="waiting-number">
                      {formatToken(token)}
                    </div>

                    <div className="waiting-service">
                      {token.service || "General Service"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <footer className="display-footer">
        Last updated: {lastUpdated.toLocaleTimeString()} ·
        Please wait until your token is called.
      </footer>
    </div>
  );
}