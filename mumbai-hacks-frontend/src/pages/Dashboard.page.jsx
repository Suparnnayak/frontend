import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http.api.js";
import agents from "../api/agents.api.js";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [hospitals, setHospitals] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [aggregation, setAggregation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const [agentPlan, setAgentPlan] = useState(null);
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentError, setAgentError] = useState(null);

  // ---------------------------------------------------------------------
  // ⭐ ONLY MOCK THIS: Arogya AI Recommendation
  // ---------------------------------------------------------------------
  const MOCK_AGENT_RESPONSE = {
    status: "success",
    timestamp: "2025-11-29T04:25:29.081180",
    plan: {
      predictedInflow: 350.5685,
      monitorReport: {
        alertLevel: "high",
        recommendedUrgency: "activate surge",
        riskFactors: [
          "AQI > 200",
          "Festival with high attendance",
          "Weather risk is moderate",
          "Disease sensitivity is moderate"
        ]
      },
      recommendedActions: [
        "Notify respiratory teams about alert level high",
        "Stage 700 oxygen cylinders near ER",
        "Activate surge bed protocol and inform city EMS"
      ],
      advisory: {
        publicAdvisory:
          "Due to high AQI and moderate weather risk, please take necessary precautions to protect yourself from air pollution and potential weather-related hazards.",
        pollutionCare:
          "For respiratory cases, provide N95 masks, nebulizers, and oxygen therapy as needed. Consider relocating patients with severe respiratory issues to a separate ward.",
        teleconsultation:
          "Implement load balancing by allocating 30% of remote consultations to respiratory cases, 20% to high-risk patients, and 50% to general cases.",
        triageRules:
          "Prioritize patients with respiratory issues and those with pre-existing conditions, followed by patients with moderate to severe injuries."
      },
      staffingPlan: {
        doctorsNeeded: 15,
        nursesNeeded: 60,
        supportStaffNeeded: 30
      },
      suppliesPlan: {
        beds: 350,
        commonMedicines: ["Paracetamol", "Ibuprofen"],
        oxygenCylinders: 700,
        specialMedicines: ["Insulin", "Epinephrine"]
      },
      agentTrace: [
        {
          agent: "prediction_api",
          message: "Fetched predictions",
          timestamp: "Sat, 29 Nov 2025 04:25:28 GMT"
        },
        {
          agent: "monitor",
          message: "Alert high",
          timestamp: "Sat, 29 Nov 2025 04:25:28 GMT"
        },
        {
          agent: "staffing_planner",
          message: "Staffing plan ready",
          timestamp: "Sat, 29 Nov 2025 04:25:28 GMT"
        },
        {
          agent: "supplies_planner",
          message: "Supplies plan ready",
          timestamp: "Sat, 29 Nov 2025 04:25:28 GMT"
        },
        {
          agent: "advisory",
          message: "Advisory drafted",
          timestamp: "Sat, 29 Nov 2025 04:25:29 GMT"
        }
      ],
      timestamp: "Sat, 29 Nov 2025 04:25:29 GMT",
      hospitalId: "HOSP-123",
      requestId: "de7c286d-2f62-462f-b406-289ca5412a07"
    }
  };
  

  // ---------------------------------------------------------------------
  // Load backend data (REAL backend)
  // ---------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      http.get("/hospitals"),
      http.get("/alerts").catch(() => null),
      http.get("/simulate/aggregate?by=city").catch(() => null),
    ])
      .then(([hospitalsRes, alertsRes, aggRes]) => {
        if (cancelled) return;

        setHospitals(hospitalsRes.data?.data || []);
        setAlerts(alertsRes?.data || null);
        setAggregation(aggRes?.data || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // -------------------------------------------------------------------
    // 🔥 MOCK ONLY THE AGENT CALL
    // -------------------------------------------------------------------
    const today = new Date();

    const runAgentMock = () => {
      setAgentLoading(true);
      setAgentError(null);

      setTimeout(() => {
        if (cancelled) return;

        setAgentPlan(MOCK_AGENT_RESPONSE.plan);
        setAgentLoading(false);
      }, 1000);
    };

    runAgentMock();

    return () => {
      cancelled = true;
    };
  }, []);

  // FILTERS
  const cities = useMemo(() => {
    const set = new Set();
    hospitals.forEach((h) => {
      if (h.location?.city) set.add(h.location.city);
    });
    return Array.from(set).sort();
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      const cityMatch = cityFilter
        ? h.location?.city?.toLowerCase() === cityFilter.toLowerCase()
        : true;
      if (!cityMatch) return false;

      if (!search) return true;
      const needle = search.toLowerCase();
      return (
        (h.name || "").toLowerCase().includes(needle) ||
        (h.id || "").toLowerCase().includes(needle) ||
        (h.location?.city || "").toLowerCase().includes(needle)
      );
    });
  }, [hospitals, search, cityFilter]);

  const cityChartData = useMemo(() => {
    if (!aggregation?.cities) return [];
    return aggregation.cities.map((c) => ({
      city: c.city,
      occupancy: Math.round(c.summary.occupancy * 100),
      critical: c.summary.alerts.CRITICAL,
    }));
  }, [aggregation]);

  // ---------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------
  return (
    <div className="page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-badge">Arogya AI · Hospital Command Center</div>
          <h1 className="hero-title">
            Predict tomorrow&apos;s load.
            <br />
            Act on it today.
          </h1>
          <p className="hero-subtitle">
            See capacity, AI suggestions, and risk hot-spots for every hospital.
          </p>
        </div>
      </section>

      {/* AI AGENT CARD */}
      <div className="card-grid" style={{ marginTop: "1rem" }}>
        <div className="card card-accent">
          <div className="card-header">
            <div className="card-title">
              Arogya AI Recommendation
              <span className="status-dot-live" aria-hidden="true" />
            </div>
            <span className="card-badge">Mocked</span>
          </div>

          <div className="card-body stack-v">
            {agentLoading && (
              <div className="muted">Running mock agent...</div>
            )}

            {!agentLoading && agentPlan && (
              <>
                <div className="stack-h-wrap">
                  <span className="chip chip-gold">
                    Predicted inflow: {Math.round(agentPlan.predictedInflow)}
                  </span>
                  <span className="chip">
                    Alert: <strong>{agentPlan.monitorReport.alertLevel}</strong>
                  </span>
                  <span className="chip">
                    Urgency:{" "}
                    <strong>
                      {agentPlan.monitorReport.recommendedUrgency}
                    </strong>
                  </span>
                </div>

                <div className="stack-v" style={{ marginTop: "0.5rem" }}>
                  <div className="muted">
                    {agentPlan.recommendedActions[0]}
                  </div>

                  <div className="agent-advisory">
                    {agentPlan.advisory.publicAdvisory}
                  </div>
                </div>

                <details>
                  <summary className="muted">View full JSON plan</summary>
                  <pre className="mono" style={{ maxHeight: 260 }}>
                    {JSON.stringify(agentPlan, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </div>
        </div>

        {/* SYSTEM ALERTS (REAL BACKEND) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">System alerts</div>
            <span className="card-badge">Backend</span>
          </div>
          <div className="card-body stack-v">
            {alerts?.overall ? (
              <>
                <div className="stack-h-wrap">
                  <span className="status-pill">
                    CRITICAL: {alerts.overall.CRITICAL}
                  </span>
                  <span className="status-pill">
                    WARNING: {alerts.overall.WARNING}
                  </span>
                  <span className="status-pill">OK: {alerts.overall.OK}</span>
                </div>
              </>
            ) : (
              <div className="muted">Alert service unavailable</div>
            )}
          </div>
        </div>

        {/* CITY CHART (REAL BACKEND) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">City load (occupancy)</div>
            <span className="card-badge">Backend</span>
          </div>

          <div className="card-body" style={{ height: 260 }}>
            {cityChartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis unit="%" />
                  <Tooltip />
                  <Bar dataKey="occupancy" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="muted">
                No aggregation yet — run simulation.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HOSPITALS TABLE (REAL BACKEND) */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card-header">
          <div className="card-title">
            Hospitals ({filteredHospitals.length})
          </div>
        </div>

        <div className="card-body">
          <div className="scroll-x">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Beds</th>
                  <th>Ventilators</th>
                </tr>
              </thead>

              <tbody>
                {filteredHospitals.map((h) => (
                  <tr key={h._id}>
                    <td>{h.name}</td>
                    <td>{h.id}</td>
                    <td>{h.location?.city}</td>
                    <td>{h.location?.state}</td>
                    <td>{h.resources?.beds}</td>
                    <td>{h.resources?.ventilators}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
