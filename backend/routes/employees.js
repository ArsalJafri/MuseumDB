const url = require("url");
const db = require("../db"); // Import Database Connection
const authMiddleware = require("../middleware/authMiddleware"); // Import Authentication Middleware

module.exports = (req, res) => { 
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    const allowedOrigins = [
        "https://museum-db-kappa.vercel.app", // Vercel frontend (adjust if different)
        "http://localhost:5180", // Local frontend
        "http://localhost:5173", // gabe local frontend
    ];

    // Handle CORS (Allow frontend to communicate with backend)
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }    
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }
 
    // GET /employees - Retrieve all employees from the database (PROTECTED)
    if (parsedUrl.pathname === "/employees" && method === "GET") {
        authMiddleware({ roles: ["staff", "admin"], jobTitles: ["Manager", "Administrator"] })(req, res, () => {
            db.query("SELECT * FROM staff", (err, results) => {
                if (err) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: "Error retrieving employees", error: err }));
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(results));
            });
        });
        return;
    }

    // POST /employees - Add a new employee to the database (PROTECTED)
    else if (parsedUrl.pathname === "/employees" && method === "POST") {
        authMiddleware({ roles: ["staff", "admin"], jobTitles: ["Manager", "Administrator"] })(req, res, () => {
            let body = "";
            req.on("data", (chunk) => { body += chunk; });
            req.on("end", () => {
                try {
                    const newEmployee = JSON.parse(body);

                    // Validate required fields
                    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.position || !newEmployee.hireDate || !newEmployee.salary) {
                        res.writeHead(400, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ message: "Missing required fields." }));
                    }

                    const query = `
                        INSERT INTO Staff (
                            First_Name, Last_Name, Phone_Number, Email,
                            Department, Job_title, Hire_Date, Salary, Active_Status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    const values = [
                        newEmployee.firstName,
                        newEmployee.lastName,
                        newEmployee.phoneNumber,
                        newEmployee.email,
                        newEmployee.department,
                        newEmployee.position,
                        newEmployee.hireDate,
                        parseFloat(newEmployee.salary),
                        newEmployee.status !== undefined ? newEmployee.status : true
                    ];

                    db.query(query, values, (err, results) => {
                        if (err) {
                            res.writeHead(500, { "Content-Type": "application/json" });
                            return res.end(JSON.stringify({ message: "Error adding employee", error: err }));
                        }
                        res.writeHead(201, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "Employee added successfully!", insertedId: results.insertId }));
                    });
                } catch (error) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Invalid JSON format" }));
                }
            });
        });
        return;
    }

    //  PUT /employees/toggle - Activate/Deactivate Employee (PROTECTED)
    else if (parsedUrl.pathname.startsWith("/employees/toggle") && method === "PUT") {
        authMiddleware({ roles: ["staff", "admin"], jobTitles: ["Manager", "Administrator"] })(req, res, () => {
            const employeeId = parsedUrl.query.id;

            if (!employeeId) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Missing employee ID." }));
            }

            db.query("SELECT Active_Status FROM staff WHERE Staff_ID = ?", [employeeId], (err, results) => {
                if (err || results.length === 0) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: "Error retrieving employee status.", error: err }));
                }

                const currentStatus = results[0].Active_Status;
                const newStatus = currentStatus === 1 ? 0 : 1;

                db.query("UPDATE Staff SET Active_Status = ? WHERE Staff_ID = ?", [newStatus, employeeId], (err) => {
                    if (err) {
                        res.writeHead(500, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ message: "Error updating employee status.", error: err }));
                    }
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: `Employee status updated to ${newStatus ? "Active" : "Inactive"}.` }));
                });
            });
        });
        return;
    }

    // Handle Unknown Routes
    else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Route not found" }));
    }
};
