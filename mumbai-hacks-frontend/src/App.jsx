import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard.page.jsx";
import Simulator from "./pages/Simulator.page.jsx";
import HospitalDetails from "./pages/HospitalDetails.page.jsx";

function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-logo">
          Arogya AI 
        </Link>
        <nav className="app-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              "app-nav-link" + (isActive ? " app-nav-link-active" : "")
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/simulator"
            className={({ isActive }) =>
              "app-nav-link" + (isActive ? " app-nav-link-active" : "")
            }
          >
            Simulator
          </NavLink>
        </nav>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        Backend at <code>/api</code> — handles hospitals, simulations, forecasts
        & alerts.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/hospital/:id" element={<HospitalDetails />} />
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
