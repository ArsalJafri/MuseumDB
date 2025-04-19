const url = require("url");
const db = require("../db");

module.exports = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;

  res.setHeader("Access-Control-Allow-Origin", "https://museum-db-kappa.vercel.app"); // https://museum-db-kappa.vercel.app
  res.setHeader("Access-Control-Allow-Credentials", "true"); // http://localhost:5173
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // GET /manage-artworks - Retrieve all artworks with exhibition name
  if (parsedUrl.pathname === "/manage-artworks" && method === "GET") {
    // JOIN the exhibitions table to retrieve the exhibition name.
    const sql = `SELECT a.*, e.Name AS Exhibition_Name 
                 FROM artworks a 
                 LEFT JOIN exhibitions e ON a.Exhibition_ID = e.Exhibition_ID`;
    db.query(sql, (err, results) => {
      if (err) {
        console.error("[manageArtworks.js] Error retrieving artworks:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Error retrieving artworks", error: err }));
      }

      const updatedResults = results.map((row) => {
        if (row.artwork_image && Buffer.isBuffer(row.artwork_image)) {
          try {
            row.artwork_image = `data:image/jpeg;base64,${row.artwork_image.toString("base64")}`;
          } catch (conversionErr) {
            console.error("[manageArtworks.js] Error converting artwork image for Artwork_ID", row.Artwork_ID, conversionErr);
            row.artwork_image = null;
          }
        }
        return row;
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(updatedResults));
    });
    return;
  }

  // POST /manage-artworks - Add a new artwork
  if (parsedUrl.pathname === "/manage-artworks" && method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const artwork = JSON.parse(body);
        const imageBuffer = artwork.artwork_image_data
          ? Buffer.from(artwork.artwork_image_data, "base64")
          : null;
        // INSERT query including Exhibition_ID
        const sql = `
          INSERT INTO artworks
          (Artwork_ID, Exhibition_ID, Title, Artist_Name, Year_Created, Year_Acquired, description, artwork_image)
          VALUES (DEFAULT, ?, ?, ?, ?, ?, ?, ?);
        `;
        const values = [
          artwork.Exhibition_ID,
          artwork.Title,
          artwork.Artist_Name,
          artwork.Year_Created,
          artwork.Year_Acquired,
          artwork.description,
          imageBuffer
        ];

        if (values.some((v) => v === undefined)) {
          console.error("[manageArtworks.js] Missing artwork field(s):", values);
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Missing required artwork fields", values }));
        }

        db.query(sql, values, (err, result) => {
          if (err) {
            console.error("[manageArtworks.js] MySQL Insert Error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Error adding artwork", error: err }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Artwork added successfully", Artwork_ID: result.insertId }));
        });
      } catch (err) {
        console.error("[manageArtworks.js] Error parsing POST data:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid JSON", error: err.message }));
      }
    });
    return;
  }

  // PUT /manage-artworks - Update an existing artwork
  if (parsedUrl.pathname === "/manage-artworks" && method === "PUT") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const artwork = JSON.parse(body);
        if (!artwork.Artwork_ID) {
          console.error("[manageArtworks.js] Missing Artwork_ID for update");
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Artwork_ID is required for update" }));
        }
        const imageBuffer = artwork.artwork_image_data
          ? Buffer.from(artwork.artwork_image_data, "base64")
          : null;
        // UPDATE query including Exhibition_ID
        const sql = `
          UPDATE artworks
          SET Exhibition_ID = ?, Title = ?, Artist_Name = ?, Year_Created = ?, Year_Acquired = ?, description = ?, artwork_image = ?
          WHERE Artwork_ID = ?;
        `;
        const values = [
          artwork.Exhibition_ID,
          artwork.Title,
          artwork.Artist_Name,
          artwork.Year_Created,
          artwork.Year_Acquired,
          artwork.description,
          imageBuffer,
          artwork.Artwork_ID
        ];

        db.query(sql, values, (err, result) => {
          if (err) {
            console.error("[manageArtworks.js] MySQL Update Error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Error updating artwork", error: err }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Artwork updated successfully" }));
        });
      } catch (err) {
        console.error("[manageArtworks.js] Error parsing PUT data:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid JSON", error: err.message }));
      }
    });
    return;
  }

  // DELETE /manage-artworks - Delete an artwork
  if (parsedUrl.pathname === "/manage-artworks" && method === "DELETE") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      console.log("[manageArtworks.js] Finished receiving DELETE data, body:", body);
      try {
        const artwork = JSON.parse(body);
        if (!artwork.Artwork_ID) {
          console.error("[manageArtworks.js] Missing Artwork_ID for deletion");
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Artwork_ID is required for deletion" }));
        }
        const sql = "DELETE FROM artworks WHERE Artwork_ID = ?;";
        db.query(sql, [artwork.Artwork_ID], (err, result) => {
          if (err) {
            console.error("[manageArtworks.js] MySQL Delete Error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Error deleting artwork", error: err }));
          }
          console.log("[manageArtworks.js] Artwork deleted successfully, result:", result);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Artwork deleted successfully" }));
        });
      } catch (err) {
        console.error("[manageArtworks.js] Error parsing DELETE data:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid JSON", error: err.message }));
      }
    });
    return;
  }

  console.warn("[manageArtworks.js] No matching route for", parsedUrl.pathname);
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
};
