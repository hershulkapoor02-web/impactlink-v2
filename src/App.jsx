import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NGO from "./pages/NGO";
import Volunteer from "./pages/Volunteer";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ngo" element={<NGO />} />
      <Route path="/volunteer" element={<Volunteer />} />
    </Routes>
  );
}

export default App;