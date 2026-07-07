import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Importar from "./pages/Importar.jsx";
import Ordenes from "./pages/Ordenes.jsx";
import Nesting from "./pages/Nesting.jsx";

export default function App() {
  return (
    <div className="app">
      <nav className="sidebar">
        <h1 className="logo">COLECTORES</h1>
        <NavLink to="/" end>Panel</NavLink>
        <NavLink to="/importar">Importar OTs</NavLink>
        <NavLink to="/ordenes">Órdenes y celdas</NavLink>
        <NavLink to="/nesting">Nesting</NavLink>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/importar" element={<Importar />} />
          <Route path="/ordenes" element={<Ordenes />} />
          <Route path="/nesting" element={<Nesting />} />
        </Routes>
      </main>
    </div>
  );
}
