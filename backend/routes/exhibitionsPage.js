const url = require("url");
const db = require("../db");

module.exports = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;

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

    const sql = "SELECT * FROM exhibitions WHERE is_active = TRUE";

    db.query(sql, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Failed to fetch exhibitions", details: err.message }));
      }

      const formattedResults = results.map((row) => {
        if (row.exhibition_image && Buffer.isBuffer(row.exhibition_image)) {
          try {
            row.exhibition_image = `data:image/jpeg;base64,${row.exhibition_image.toString("base64")}`;
          } catch (err) {
            row.exhibition_image = null;
          }
        }
        return row;
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(formattedResults));
    });
    return;
  }

  // Default 404 fallback
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Public exhibitions route not found" }));
};
