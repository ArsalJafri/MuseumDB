const url = require("url");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = (req, res) => {
  authMiddleware({
    roles: ["staff", "admin"],
    jobTitles: ["Manager", "Administrator"]
  })(req, res, () => {  
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;

  res.setHeader("Access-Control-Allow-Origin", "https://museum-db-kappa.vercel.app"); // http://localhost:5173
  res.setHeader("Access-Control-Allow-Credentials", "true"); // https://museum-db-kappa.vercel.app
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // GET /complaints
  if (parsedUrl.pathname === "/complaints" && method === "GET") {
    const { type, start, end } = parsedUrl.query;
    let queryStr = "SELECT * FROM complaints";
    let queryParams = [];
    let conditions = [];

    if (type && type !== "All") {
      conditions.push("Complaint_Type = ?");
      queryParams.push(type);
    }
    if (start) {
      conditions.push("DATE(Complaint_Date) >= ?");
      queryParams.push(start);
    }
    if (end) {
      conditions.push("DATE(Complaint_Date) <= ?");
      queryParams.push(end);
    }
    if (conditions.length > 0) {
      queryStr += " WHERE " + conditions.join(" AND ");
    }

    db.query(queryStr, queryParams, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ message: "Error retrieving complaints", error: err })
        );
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(results));
    });
  }

  // GET /complaints/summary (filtered)
  else if (parsedUrl.pathname === "/complaints/summary" && method === "GET") {
    const { type, start, end } = parsedUrl.query;

    // Build filter condition string using db.escape for safety.
    let filterCondition = "";
    if (type && type !== "All") {
      filterCondition += `Complaint_Type = ${db.escape(type)}`;
    }
    if (start) {
      if (filterCondition) filterCondition += " AND ";
      filterCondition += `DATE(Complaint_Date) >= ${db.escape(start)}`;
    }
    if (end) {
      if (filterCondition) filterCondition += " AND ";
      filterCondition += `DATE(Complaint_Date) <= ${db.escape(end)}`;
    }
    const baseWhere = filterCondition ? "WHERE " + filterCondition : "";

    // For each subquery, add extra conditions as needed.
    const openCondition = baseWhere ? `${baseWhere} AND Status = 'Pending'` : "WHERE Status = 'Pending'";
    const resolvedCondition = baseWhere ? `${baseWhere} AND Status = 'Resolved'` : "WHERE Status = 'Resolved'";
    const avgCondition = baseWhere ? `${baseWhere} AND Complaint_Rating IS NOT NULL` : "WHERE Complaint_Rating IS NOT NULL";
    const topTypeCondition = baseWhere
      ? `${baseWhere} AND Complaint_Type IS NOT NULL AND Complaint_Type != ''`
      : "WHERE Complaint_Type IS NOT NULL AND Complaint_Type != ''";
    const busiestCondition = baseWhere; // May be empty

    const summaryQuery = `
      SELECT
        (SELECT COUNT(*) FROM complaints ${openCondition}) AS open_complaints,
        (SELECT COUNT(*) FROM complaints ${resolvedCondition}) AS resolved_complaints,
        (SELECT Complaint_Type FROM complaints ${topTypeCondition} GROUP BY Complaint_Type ORDER BY COUNT(*) DESC LIMIT 1) AS top_complaint_type,
        (SELECT DATE(Complaint_Date) FROM complaints ${busiestCondition} GROUP BY DATE(Complaint_Date) ORDER BY COUNT(*) DESC LIMIT 1) AS busiest_day,
        (SELECT AVG(CAST(Complaint_Rating AS DECIMAL(10,2))) FROM complaints ${avgCondition}) AS avg_rating
    `;

    db.query(summaryQuery, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Error fetching summary", error: err }));
      }
      const summary = results[0] || {};
      if (summary.busiest_day) {
        summary.busiest_day = new Date(summary.busiest_day)
          .toISOString()
          .split("T")[0];
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(summary));
    });
  }

  // POST /complaints
  else if (parsedUrl.pathname === "/complaints" && method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const newComplaint = JSON.parse(body);
        const {
          customer_ID,
          Complaint_Date,
          Complaint_Time,
          Complaint_Type,
          Complaint_Title,
          Complaint_Rating,
          Description,
          Status,
          Ticket_ID,
          Staff_ID,
          Events_ID,
          Special_Exhibition_ID,
        } = newComplaint;

        if (!customer_ID || !Complaint_Date || !Complaint_Type || !Description || !Status) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Missing required fields.", complaintReceived: newComplaint }));
        }

        const query = `
          INSERT INTO complaints (
            customer_ID,
            Complaint_Date,
            Complaint_Time,
            Complaint_Type,
            Complaint_Title,
            Complaint_Rating,
            Description,
            Status,
            Ticket_ID,
            Staff_ID,
            Events_ID,
            Special_Exhibition_ID
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          customer_ID,
          Complaint_Date,
          Complaint_Time || null,
          Complaint_Type,
          Complaint_Title || null,
          Complaint_Rating || null,
          Description,
          Status,
          Ticket_ID || null,
          Staff_ID || null,
          Events_ID || null,
          Special_Exhibition_ID || null,
        ];
        db.query(query, values, (err, results) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Error adding complaint", error: err }));
          }
          res.writeHead(201, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Complaint added successfully!", insertedId: results.insertId }));
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid JSON format" }));
      }
    });
  }

  // PUT /complaints/:id
  else if (parsedUrl.pathname.startsWith("/complaints/") && method === "PUT") {
    const segments = parsedUrl.pathname.split("/");
    const complaintId = segments[2];
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { Status, Resolution_Date, Resolution_Time, Resolution_Notes } = JSON.parse(body);
        const query = `
          UPDATE complaints
          SET
            Status = ?,
            Resolution_Date = ?,
            Resolution_Time = ?,
            Resolution_Notes = ?
          WHERE Complaint_ID = ?
        `;
        const values = [
          Status || "Pending",
          Resolution_Date || null,
          Resolution_Time || null,
          Resolution_Notes || null,
          complaintId,
        ];
        db.query(query, values, (err, results) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Error updating complaint", error: err }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Complaint updated successfully" }));
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid JSON format" }));
      }
    });
  }

  // DELETE /complaints/:id
  else if (parsedUrl.pathname.startsWith("/complaints/") && method === "DELETE") {
    const segments = parsedUrl.pathname.split("/");
    const complaintId = segments[2];
    db.query("DELETE FROM complaints WHERE Complaint_ID = ?", [complaintId], (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Error deleting complaint", error: err }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Complaint deleted successfully" }));
    });
  }

  // Fallback
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ message: "Route not found" }));
  }
});
};
