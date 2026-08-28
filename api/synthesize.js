const Synthesizer = require("../lib/synthesizer");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { topic, research } = req.body || {};
  if (!topic || !research) return res.status(400).json({ error: "Topic and research data required" });

  try {
    const synthesized = Synthesizer.synthesize(topic, research);
    res.json(synthesized);
  } catch (err) {
    res.status(500).json({ error: "Synthesis failed: " + err.message });
  }
};
