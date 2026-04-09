import React, { useEffect, useState } from "react";

export default function Navbar({ onSelect, selectedGymId, gyms = [] }) {

  useEffect(() => {
    // auto-select first gym when none selected and id exists
    if ((selectedGymId === null || selectedGymId === undefined) && gyms && gyms.length && gyms[0] && gyms[0].id != null) {
      onSelect(gyms[0].id);
    }
  }, [gyms, selectedGymId, onSelect]);

  return (
    <nav className="topbar">
      <div className="topbar-left">
        <div className="brand">WTF LivePulse</div>
      </div>

      <div className="topbar-center">
        {gyms.length > 8 ? (
          <select
            className="gym-select"
            value={selectedGymId ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              // prevent empty / invalid
              if (value === '' || value == null) return;
              onSelect(value);
            }}
          >
            {gyms.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        ) : (
          gyms.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                if (g == null || g.id == null) return;
                onSelect(g.id);
              }}
              className={`gym-btn ${g.id === selectedGymId ? "active" : ""}`}
            >
              {g.name}
            </button>
          ))
        )}
      </div>

      <div className="topbar-right">
        {selectedGymId && <div style={{ fontSize: 12, color: "var(--muted)" }}>Live Dashboard</div>}
      </div>
    </nav>
  );
}
