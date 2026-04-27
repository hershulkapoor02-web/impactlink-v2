import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [mode, setMode] = useState("volunteer"); // or ngo

  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    skills: "",
    orgName: ""
  });

  const navigate = useNavigate();

  const handleSubmit = () => {
    const user = {
      type: mode,
      ...form,
      skills: form.skills
        ? form.skills.split(",").map(s => s.trim())
        : []
    };

    localStorage.setItem("user", JSON.stringify(user));

    navigate("/");
  };

  return (
    <div className="flex justify-center">

      <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

        {/* Toggle Header */}
        <div className="flex relative bg-white/10">

          <div
            className={`absolute top-0 bottom-0 w-1/2 bg-blue-600 transition-transform duration-300 ${
              mode === "ngo" ? "translate-x-full" : "translate-x-0"
            }`}
          />

          <button
            onClick={() => setMode("volunteer")}
            className="w-1/2 py-3 z-10"
          >
            Volunteer
          </button>

          <button
            onClick={() => setMode("ngo")}
            className="w-1/2 py-3 z-10"
          >
            NGO
          </button>

        </div>

        {/* Form */}
        <div className="p-6 space-y-4">

          <h2 className="text-xl font-bold">
            {mode === "ngo" ? "NGO Setup" : "Volunteer Setup"}
          </h2>

          <input
            className="bg-white/10 p-2 w-full rounded"
            placeholder="Name"
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="bg-white/10 p-2 w-full rounded"
            placeholder="Email"
            onChange={e => setForm({ ...form, email: e.target.value })}
          />

          <input
            className="bg-white/10 p-2 w-full rounded"
            placeholder="Location"
            onChange={e => setForm({ ...form, location: e.target.value })}
          />

          {/* Conditional field */}
          {mode === "volunteer" ? (
            <input
              className="bg-white/10 p-2 w-full rounded"
              placeholder="Skills (comma separated)"
              onChange={e => setForm({ ...form, skills: e.target.value })}
            />
          ) : (
            <input
              className="bg-white/10 p-2 w-full rounded"
              placeholder="Organization Name"
              onChange={e => setForm({ ...form, orgName: e.target.value })}
            />
          )}

          <button
            onClick={handleSubmit}
            className="bg-blue-600 w-full py-2 rounded-xl hover:scale-105 transition"
          >
            Continue
          </button>

        </div>
      </div>

    </div>
  );
}

export default Login;