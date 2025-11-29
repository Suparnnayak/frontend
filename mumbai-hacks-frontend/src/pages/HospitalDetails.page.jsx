import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import http from "../api/http.api.js";

export default function HospitalDetails() {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [sim, setSim] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simLoading, setSimLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simError, setSimError] = useState(null);
  const [forecastError, setForecastError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    http
      .get(`/hospitals/${id}`)
      .then((r) => {
        if (cancelled) return;
        setHospital(r.data?.data || null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.message || e.message || "Failed to fetch");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const hospitalCode = hospital?.id;

  const latestPastWeek = useMemo(() => {
    if (!hospital?.pastWeekData?.length) return null;
    return hospital.pastWeekData[hospital.pastWeekData.length - 1];
  }, [hospital]);

  const runSimulation = (withML) => {
    if (!hospitalCode) return;
    setSimLoading(true);
    setSimError(null);
    setSim(null);

    const path = withML
      ? `/simulate-ml/${encodeURIComponent(hospitalCode)}`
      : `/simulate/${encodeURIComponent(hospitalCode)}`;

    http
      .get(path)
      .then((r) => {
        setSim(r.data);
      })
      .catch((e) => {
        setSimError(e?.response?.data?.error || e.message || "Simulation failed");
      })
      .finally(() => setSimLoading(false));
  };

  const runForecast = () => {
    if (!hospitalCode) return;
    setForecastLoading(true);
    setForecastError(null);
    setForecast(null);

    http
      .get(`/forecast-ml/${encodeURIComponent(hospitalCode)}?days=7`)
      .then((r) => {
        setForecast(r.data);
      })
      .catch((e) => {
        setForecastError(
          e?.response?.data?.error || e.message || "Forecast failed"
        );
      })
      .finally(() => setForecastLoading(false));
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">Loading hospital details…</div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Unable to load hospital</div>
        </div>
        <div className="card-body error-text">
          {error || "Hospital not found"}
          <div style={{ marginTop: "0.5rem" }}>
            <Link to="/" className="table-row-link">
              <button type="button">Back to dashboard</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-v">
      <div className="page-heading">
        <div>
          <div className="page-title">{hospital.name || "Hospital"}</div>
          <div className="page-subtitle">
            ID <span className="mono">{hospitalCode}</span> in{" "}
            {hospital.location?.city}, {hospital.location?.state}
          </div>
        </div>
        <div className="page-actions">
          <Link to="/">
            <button type="button">Back to dashboard</button>
          </Link>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Capacity</div>
            <span className="card-badge">Resources</span>
          </div>
          <div className="card-body stack-v">
            <div className="stack-h-wrap">
              <span className="chip">
                Beds: {hospital.resources?.beds ?? "—"}
              </span>
              <span className="chip">
                Ventilators: {hospital.resources?.ventilators ?? "—"}
              </span>
              <span className="chip">
                Oxygen units: {hospital.resources?.oxygen ?? "—"}
              </span>
              <span className="chip">
                Ambulances: {hospital.resources?.ambulances ?? "—"}
              </span>
            </div>
            {latestPastWeek && (
              <div className="muted">
                Last day load: {latestPastWeek.patients} patients,{" "}
                {latestPastWeek.emergencies} emergencies.
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Sensitivity</div>
            <span className="card-badge">Events</span>
          </div>
          <div className="card-body stack-v">
            <div className="stack-h-wrap">
              <span className="chip">
                Pollution: {hospital.pollutionSensitivity ?? "—"}
              </span>
              <span className="chip">
                Festival: {hospital.festivalSensitivity ?? "—"}
              </span>
              <span className="chip">
                Weather: {hospital.weatherSensitivity ?? "—"}
              </span>
            </div>
            <div className="muted">
              Higher sensitivity means events have stronger impact on patient
              inflow.
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Run simulation</div>
            <span className="card-badge">Per-hospital</span>
          </div>
          <div className="card-body stack-v">
            <div className="stack-h">
              <button
                type="button"
                onClick={() => runSimulation(true)}
                disabled={!hospitalCode || simLoading}
              >
                {simLoading ? "Running…" : "Simulate with ML"}
              </button>
              <button
                type="button"
                onClick={() => runSimulation(false)}
                disabled={!hospitalCode || simLoading}
              >
                Deterministic only
              </button>
            </div>
            {!hospitalCode && (
              <div className="muted">
                This hospital record is missing its <code>id</code> field;
                simulation/ML needs that identifier.
              </div>
            )}
            {simError && <div className="error-text">{simError}</div>}
            {sim && (
              <pre className="mono" style={{ maxHeight: 220, overflow: "auto" }}>
                {JSON.stringify(sim, null, 2)}
              </pre>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">7‑day forecast</div>
            <span className="card-badge">ML</span>
          </div>
          <div className="card-body stack-v">
            <button
              type="button"
              onClick={runForecast}
              disabled={!hospitalCode || forecastLoading}
            >
              {forecastLoading ? "Forecasting…" : "Generate forecast"}
            </button>
            {!hospitalCode && (
              <div className="muted">
                Forecasts also require the external hospital <code>id</code>.
              </div>
            )}
            {forecastError && (
              <div className="error-text">{forecastError}</div>
            )}
            {forecast && (
              <pre
                className="mono"
                style={{ maxHeight: 220, overflow: "auto" }}
              >
                {JSON.stringify(forecast, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Raw document</div>
          <span className="card-badge">Mongo</span>
        </div>
        <div className="card-body">
          <pre className="mono" style={{ maxHeight: 260, overflow: "auto" }}>
            {JSON.stringify(hospital, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
