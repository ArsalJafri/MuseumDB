const url = require("url");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;

  res.setHeader("Access-Control-Allow-Origin", "https://museum-db-kappa.vercel.app"); // http://localhost:5173
  res.setHeader("Access-Control-Allow-Credentials", "true"); // https://museum-db-kappa.vercel.app
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (method === "GET") {
    return authMiddleware({
    roles: ["staff", "admin"],
    jobTitles: ["Curator", "Administrator"]
    })(req, res, () => {

    const { exhibition_id } = parsedUrl.query;
    if (!exhibition_id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "exhibition_id query parameter is required" }));
    }

    const sql = "SELECT * FROM artworks WHERE Exhibition_ID = ? LIMIT 5;";
    db.query(sql, [exhibition_id], (err, results) => {
      if (err) {
        console.error("[artworks.js] MySQL Query Error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Error retrieving artworks", error: err }));
      }
      // Convert artwork_image from Buffer to a Base64 data URL if needed.
      const updatedResults = results.map((row) => {
        if (row.artwork_image && Buffer.isBuffer(row.artwork_image)) {
          try {
            row.artwork_image = `data:image/jpeg;base64,${row.artwork_image.toString("base64")}`;
          } catch (conversionErr) {
            console.error("[artworks.js] Error converting artwork image for Artwork_ID", row.Artwork_ID, conversionErr);
            row.artwork_image = null;
          }
        }
        return row;
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(updatedResults));
    });
    return;
  });
  }

  console.warn("[artworks.js] No matching route for", parsedUrl.pathname);
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
};
