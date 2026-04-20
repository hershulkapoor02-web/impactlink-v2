import { useState } from "react";
import { needs } from "../services/data";
import { motion } from "framer-motion";

function Volunteer() {
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [matches, setMatches] = useState([]);

  const findMatches = () => {
    const userSkills = skills.split(",").map(s => s.trim());

    const results = needs.map((need) => {
      let score = 0;

      const skillMatch = need.skills.filter(skill =>
        userSkills.includes(skill)
      ).length;
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

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl"
      >
        <h2 className="text-xl font-bold mb-4">Find Opportunities</h2>

        <input
          className="bg-white/10 border border-white/20 p-2 w-full mb-3 rounded text-white placeholder-gray-400"
          placeholder="Your Skills"
          onChange={e => setSkills(e.target.value)}
        />

        <input
          className="bg-white/10 border border-white/20 p-2 w-full mb-3 rounded text-white placeholder-gray-400"
          placeholder="Your Location"
          onChange={e => setLocation(e.target.value)}
        />

        <button
          onClick={findMatches}
          className="bg-green-600 hover:bg-green-700 w-full py-2 rounded-xl shadow-md transition hover:scale-105"
        >
          Find Matches
        </button>
      </motion.div>

      <div className="space-y-3">
        {matches.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-2xl hover:scale-105 hover:border-green-400 transition"
          >
            <div className="font-bold text-lg">{m.title}</div>
            <div className="text-sm text-gray-400">{m.location}</div>
            <div className="text-green-400 font-semibold mt-1">
              Score: {m.score}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Volunteer;