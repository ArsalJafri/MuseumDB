const url = require("url");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = (req, res) => { 
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    // Handle CORS (Allow frontend to communicate with backend)
    res.setHeader("Access-Control-Allow-Origin", "https://museum-db-kappa.vercel.app"); // Adjust to your frontend URL if needed
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }
    
    // GET /exhibition-report - Retrieve all exhibitions as a report (only active ones)
if (parsedUrl.pathname === "/exhibition-report" && method === "GET") {
    return authMiddleware({
        roles: ["staff", "admin"],
        jobTitles: ["Curator", "Administrator"],
      })(req, res, () => {
        const sql = `
          SELECT e.*, 
                 COUNT(c.Complaint_ID) AS complaintCount, 
                 AVG(c.Complaint_Rating) AS averageReview 
          FROM exhibitions e 
          LEFT JOIN complaints c ON c.Complaint_Type = e.Name 
          WHERE e.is_active = TRUE 
          GROUP BY e.Exhibition_ID
        `;
        db.query(sql, (err, results) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Error retrieving exhibitions", error: err }));
            }
            console.log("for exhibit report: ", results);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(results));
        });
    });
}


    // Handle Unknown Routes
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
};
