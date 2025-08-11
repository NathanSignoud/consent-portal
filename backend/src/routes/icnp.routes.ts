import express from "express";
import IcnpIntervention from "../models/IcnpIntervention";

const router = express.Router();

// GET /api/icnp?q=toilette&limit=8
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim() || "";
    const limit = parseInt(req.query.limit as string) || 8;

    let results: any[] = [];

    if (q) {
      const byText = await IcnpIntervention.find(
        { $text: { $search: q }, axis: "IC" },
        { score: { $meta: "textScore" }, icnp_id: 1, "term.fr": 1, "description.fr": 1 }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit);

      const byCode = await IcnpIntervention.find(
        { icnp_id: new RegExp("^" + q.replace(/\D/g, "")) },
        { icnp_id: 1, "term.fr": 1 }
      ).limit(limit);

      // fusion + dédoublonnage
      const seen = new Set();
      results = [...byCode, ...byText].filter(r => !seen.has(r.icnp_id) && seen.add(r.icnp_id));
    } else {
      results = await IcnpIntervention.find({ axis: "IC" }).limit(limit);
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;