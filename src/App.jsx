import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Budgets from "./pages/Budgets";
import Settings from "./pages/Settings";
import Transaction from "./pages/Transaction";
import InsightsDashboard from "./pages/InsightsDashboard"; // Updated path to pages folder
import Layout from "./components/layout/Layout";
import {AppContext} from "./context/AppContext";
export default function App() {
  return (
    <>
    <AppContext>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="settings" element={<Settings />} />
            <Route path="transaction" element={<Transaction />} />
            <Route path="insights" element={<InsightsDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </AppContext>
    </>
  );
}
