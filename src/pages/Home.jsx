import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

function Home() {
  return (
    <div className="space-y-24">

      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 text-transparent bg-clip-text">
          Smart Resource Allocation
        </h1>

        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
          Connecting NGOs with the right volunteers using intelligent matching.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/ngo"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow-lg transition hover:scale-105"
          >
            Post a Need
          </a>

          <a
            href="/volunteer"
            className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl backdrop-blur transition hover:scale-105"
          >
            Find Work
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
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl 
                       hover:scale-105 hover:border-blue-500 transition duration-300"
          >
            <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
            <p className="text-gray-400 text-sm">{card.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* HOW IT WORKS */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 p-10 rounded-2xl text-center"
      >
        <h2 className="text-2xl font-semibold mb-6">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-400">
          <div className="hover:text-white transition">NGOs post requirements</div>
          <div className="hover:text-white transition">Volunteers enter skills</div>
          <div className="hover:text-white transition">System matches efficiently</div>
        </div>
      </motion.section>

    </div>
  );
}

export default Home;