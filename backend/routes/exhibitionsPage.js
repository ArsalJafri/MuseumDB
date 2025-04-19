const url = require("url");
const db = require("../db");

module.exports = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;

  console.log(`[exhibitionsPublic.js] 🌐 ${method} ${req.url} | cookies:`, req.headers.cookie);

  // CORS headers for public access
  res.setHeader("Access-Control-Allow-Origin", "https://museum-db-kappa.vercel.app");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // GET /exhibitions-public - Public-facing exhibitions list
  if (parsedUrl.pathname === "/exhibitions" && method === "GET") {
    console.log("[exhibitionsPublic.js] 🔓 Public exhibitions fetch initiated...");

    const sql = "SELECT * FROM exhibitions WHERE is_active = TRUE";

    db.query(sql, (err, results) => {
      if (err) {
        console.error("[exhibitionsPublic.js] ❌ Database error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Failed to fetch exhibitions", details: err.message }));
      }

      const formattedResults = results.map((row) => {
        if (row.exhibition_image && Buffer.isBuffer(row.exhibition_image)) {
          try {
            row.exhibition_image = `data:image/jpeg;base64,${row.exhibition_image.toString("base64")}`;
          } catch (err) {
            console.error("[exhibitionsPublic.js] ⚠️ Image conversion failed:", err);
            row.exhibition_image = null;
          }
        }
        return row;
      });

      console.log("[exhibitionsPublic.js] ✅ Returning exhibition data:", formattedResults.length);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(formattedResults));
    });
    return;
  }

  // Default 404 fallback
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Public exhibitions route not found" }));
};
