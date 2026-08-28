const { researchTopic } = require("../lib/research");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { topic } = req.body || {};
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  try {
    const research = await researchTopic(topic);
    res.json(research);
  } catch (err) {
    res.status(500).json({ error: "Research failed: " + err.message });
  }
};
