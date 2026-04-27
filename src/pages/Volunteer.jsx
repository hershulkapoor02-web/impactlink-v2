import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { needs } from "../services/data";

function Volunteer() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "volunteer") {
      navigate("/login");
    }
  }, []);

  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [matches, setMatches] = useState([]);

  const findMatches = () => {
    const userSkills = skills.split(",").map(s => s.trim());

    const results = needs.map((need) => {
      let score = 0;

      const skillMatch = need.skills.filter(s => userSkills.includes(s)).length;
      score += skillMatch * 5;

      if (need.location === location) score += 3;
      if (need.urgency === "High") score += 5;
      if (need.urgency === "Medium") score += 3;

      return { ...need, score };
    });

    results.sort((a, b) => b.score - a.score);
    setMatches(results);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">

      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-3">

        <h2 className="text-xl font-bold">Find Opportunities</h2>

        <input placeholder="Skills"
          className="bg-white/10 p-2 w-full rounded"
          onChange={e => setSkills(e.target.value)}
        />

        <input placeholder="Location"
          className="bg-white/10 p-2 w-full rounded"
          onChange={e => setLocation(e.target.value)}
        />

        <button
          onClick={findMatches}
          className="bg-green-600 w-full py-2 rounded-xl hover:scale-105 transition"
        >
          Find Matches
        </button>

      </div>

      {matches.map((m, i) => (
        <div key={i}
          className="bg-white/5 border border-white/10 p-4 rounded-xl"
        >
          <div className="font-bold">{m.title}</div>
          <div className="text-sm text-gray-400">{m.location}</div>
          <div className="text-green-400">Score: {m.score}</div>
        </div>
      ))}

    </div>
  );
}

export default Volunteer;