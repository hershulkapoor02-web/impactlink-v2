import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import NGO from "./pages/NGO";
import Volunteer from "./pages/Volunteer";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold tracking-wide">
            Smart Resource
          </h1>

          <div className="flex gap-6 text-sm">
            <Link to="/" className="hover:text-blue-400 transition">Home</Link>
            <Link to="/ngo" className="hover:text-blue-400 transition">NGO</Link>
            <Link to="/volunteer" className="hover:text-blue-400 transition">Volunteer</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ngo" element={<NGO />} />
          <Route path="/volunteer" element={<Volunteer />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;