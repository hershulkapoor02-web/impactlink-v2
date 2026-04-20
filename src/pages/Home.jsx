import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0, y: 25 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function Home() {

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  return (
    <div className="space-y-28">

      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 text-transparent bg-clip-text leading-tight">
          Smart Resource Allocation
        </h1>

        <p className="text-gray-400 mt-5 max-w-2xl mx-auto text-base">
          Connecting NGOs with the right volunteers using intelligent matching.
        </p>

        {user && (
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
            Logged in as {user.name || "User"}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 flex justify-center gap-4">

          {/* PRIMARY BUTTON */}
          <a
            href="/login"
            className="group relative px-7 py-3 rounded-xl bg-blue-600 text-white font-medium 
                       shadow-lg shadow-blue-600/20 transition-all duration-300
                       hover:scale-[1.04] hover:shadow-blue-500/40"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition bg-white/10"></div>
          </a>

          {/* SECONDARY BUTTON */}
          <a
            href="/login"
            className="px-7 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80
                       backdrop-blur-md transition-all duration-300
                       hover:scale-[1.04] hover:bg-white/10 hover:border-white/20"
          >
            Continue as Volunteer
          </a>

        </div>
      </motion.section>

      {/* FEATURES */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid md:grid-cols-3 gap-6"
      >
        {[
          { title: "Smart Matching", desc: "AI-style scoring connects the right people." },
          { title: "Urgency Priority", desc: "Critical needs get served first." },
          { title: "Location Based", desc: "Find opportunities near you instantly." },
        ].map((card, i) => (
          <motion.div
            key={i}
            variants={item}
            className="group relative p-6 rounded-2xl 
                       bg-white/5 border border-white/10 backdrop-blur-lg
                       transition-all duration-300
                       hover:scale-[1.03] hover:border-blue-400/50 hover:bg-white/10
                       hover:shadow-lg hover:shadow-blue-500/10"
          >
            {/* glow effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>

            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
              <p className="text-gray-400 text-sm">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* HOW IT WORKS */}
      <motion.section
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 
                   p-10 rounded-2xl text-center
                   hover:border-white/20 transition"
      >
        <h2 className="text-2xl font-semibold mb-8">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 text-sm text-gray-400">
          {[
            "NGOs post requirements",
            "Volunteers enter skills",
            "System matches efficiently",
          ].map((t, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white/5 border border-white/10
                         transition hover:bg-white/10 hover:text-white hover:scale-[1.03]"
            >
              {t}
            </div>
          ))}
        </div>
      </motion.section>

    </div>
  );
}

export default Home;