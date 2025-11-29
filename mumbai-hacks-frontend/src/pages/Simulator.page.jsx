import { useEffect, useState } from "react";
import http from "../api/http.api.js";

export default function Simulator() {
  const [events, setEvents] = useState(null);
  const [eventsSaving, setEventsSaving] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  const [simAllResult, setSimAllResult] = useState(null);
  const [simAllLoading, setSimAllLoading] = useState(false);
  const [simAllError, setSimAllError] = useState(null);

  const [aggAll, setAggAll] = useState(null);
  const [aggCity, setAggCity] = useState(null);
  const [aggState, setAggState] = useState(null);
  const [aggLoading, setAggLoading] = useState(false);
  const [aggError, setAggError] = useState(null);

  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    http
      .get("/events")
      .then((r) => {
        if (!cancelled) setEvents(r.data || null);
      })
      .catch((e) => {
        if (!cancelled) {
          console.warn("Failed to load events", e);
          setEventsError(e.message || "Failed to load event state");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateEventsField = (field, value) => {
    setEvents((prev) => ({
      ...(prev || {}),
      [field]: value,
    }));
  };

  const saveEvents = () => {
    if (!events) return;
    setEventsSaving(true);
    setEventsError(null);

    http
      .post("/events", events)
      .then((r) => {
        setEvents(r.data?.state || events);
      })
      .catch((e) => {
        setEventsError(e.message || "Failed to update events");
      })
      .finally(() => setEventsSaving(false));
  };

  const runSimAll = () => {
    setSimAllLoading(true);
    setSimAllError(null);
    setSimAllResult(null);

    http
      .get("/simulate")
      .then((r) => setSimAllResult(r.data))
      .catch((e) =>
        setSimAllError(e?.response?.data?.error || e.message || "Simulation failed")
      )
      .finally(() => setSimAllLoading(false));
  };

  const runAggregation = () => {
    setAggLoading(true);
    setAggError(null);
    setAggAll(null);
    setAggCity(null);
    setAggState(null);

    const reqs = [
      http.get("/simulate/aggregate?by=all"),
      cityInput
        ? http.get(`/simulate/aggregate/city/${encodeURIComponent(cityInput)}`)
        : Promise.resolve(null),
      stateInput
        ? http.get(`/simulate/aggregate/state/${encodeURIComponent(stateInput)}`)
        : Promise.resolve(null),
    ];

    Promise.all(reqs)
      .then(([allRes, cityRes, stateRes]) => {
        setAggAll(allRes?.data || null);
        setAggCity(cityRes?.data || null);
        setAggState(stateRes?.data || null);
      })
      .catch((e) => {
        setAggError(e?.response?.data?.error || e.message || "Aggregation failed");
      })
      .finally(() => setAggLoading(false));
  };

  return (
    <div className="stack-v">
      <div className="page-heading">
        <div>
          <div className="page-title">Scenario simulator</div>
          <div className="page-subtitle">
            Adjust events, then run simulations and aggregations across the
            network.
          </div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">City‑wide events</div>
            <span className="card-badge">Inputs</span>
          </div>
          <div className="card-body stack-v">
            {eventsError && <div className="error-text">{eventsError}</div>}
            {!events && !eventsError && (
              <div className="muted">Loading current event intensities…</div>
            )}
            {events && (
              <>
                <div className="stack-h-wrap">
                  <label className="chip">
                    <span>Pollution</span>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={events.pollution ?? 0}
                      onChange={(e) =>
                        updateEventsField(
                          "pollution",
                          Number(e.target.value || 0)
                        )
                      }
                      style={{ width: 80 }}
                    />
                  </label>
                  <label className="chip">
                    <span>Festival</span>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={events.festival ?? 0}
                      onChange={(e) =>
                        updateEventsField(
                          "festival",
                          Number(e.target.value || 0)
                        )
                      }
                      style={{ width: 80 }}
                    />
                  </label>
                  <label className="chip">
                    <span>Weather</span>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={events.weather ?? 0}
                      onChange={(e) =>
                        updateEventsField(
                          "weather",
                          Number(e.target.value || 0)
                        )
                      }
                      style={{ width: 80 }}
                    />
                  </label>
                </div>
                <div className="stack-h">
                  <button
                    type="button"
                    onClick={saveEvents}
                    disabled={eventsSaving}
                  >
                    {eventsSaving ? "Saving…" : "Apply events"}
                  </button>
                  <div className="muted">
                    Values are normalized 0–1 and applied in future simulations.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Run network simulation</div>
            <span className="card-badge">All hospitals</span>
          </div>
          <div className="card-body stack-v">
            <button
              type="button"
              onClick={runSimAll}
              disabled={simAllLoading}
            >
              {simAllLoading ? "Running…" : "Simulate all hospitals"}
            </button>
            {simAllError && <div className="error-text">{simAllError}</div>}
            {simAllResult && (
              <div className="muted">
                Simulated {simAllResult.count ?? simAllResult.results?.length}{" "}
                hospitals.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Aggregations</div>
          <span className="card-badge">After simulation</span>
        </div>
        <div className="card-body stack-v">
          <div className="stack-h-wrap" style={{ marginBottom: "0.5rem" }}>
            <input
              className="input"
              placeholder="City (e.g. Mumbai)"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
            <input
              className="input"
              placeholder="State (e.g. Maharashtra)"
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value)}
            />
            <button
              type="button"
              onClick={runAggregation}
              disabled={aggLoading}
            >
              {aggLoading ? "Aggregating…" : "Fetch aggregation"}
            </button>
          </div>
          {aggError && <div className="error-text">{aggError}</div>}
          {aggAll && (
            <div className="stack-v">
              <div className="stack-h-wrap">
                <span className="chip">
                  Hospitals: {aggAll.overall?.count ?? aggAll.count ?? "—"}
                </span>
                {aggAll.overall?.alerts && (
                  <span className="chip">
                    Alerts CRIT: {aggAll.overall.alerts.CRITICAL}
                  </span>
                )}
              </div>
            </div>
          )}
          {aggCity && (
            <div className="muted">
              City aggregation for <strong>{cityInput}</strong> loaded.
            </div>
          )}
          {aggState && (
            <div className="muted">
              State aggregation for <strong>{stateInput}</strong> loaded.
            </div>
          )}
          {(aggAll || aggCity || aggState) && (
            <pre
              className="mono"
              style={{ maxHeight: 260, overflow: "auto", marginTop: "0.5rem" }}
            >
              {JSON.stringify(
                { all: aggAll, city: aggCity, state: aggState },
                null,
                2
              )}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
