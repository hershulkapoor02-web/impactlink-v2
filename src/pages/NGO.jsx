import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { needs } from "../services/data";

function NGO() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "ngo") {
      navigate("/login");
    }
  }, []);

  const [form, setForm] = useState({
    title: "",
    location: "",
    urgency: "Low",
    skills: ""
  });

  const handleSubmit = () => {
    needs.push({
      ...form,
      skills: form.skills.split(",").map(s => s.trim())
    });

    alert("Need posted!");
  };

  return (
    <div className="max-w-lg mx-auto bg-white/5 border border-white/10 p-6 rounded-2xl space-y-3">

      <h2 className="text-xl font-bold">Post a Need</h2>

      <input placeholder="Title"
        className="bg-white/10 p-2 w-full rounded"
        onChange={e => setForm({ ...form, title: e.target.value })}
      />

      <input placeholder="Location"
        className="bg-white/10 p-2 w-full rounded"
        onChange={e => setForm({ ...form, location: e.target.value })}
      />

      <select
        className="bg-white/10 p-2 w-full rounded"
        onChange={e => setForm({ ...form, urgency: e.target.value })}
      >
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>

      <input placeholder="Skills"
        className="bg-white/10 p-2 w-full rounded"
        onChange={e => setForm({ ...form, skills: e.target.value })}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 w-full py-2 rounded-xl hover:scale-105 transition"
      >
        Submit
      </button>

    </div>
  );
}

export default NGO;