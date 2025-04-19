const jwt = require("jsonwebtoken");
const cookie = require("cookie"); // Use 'cookie' module for better parsing
const db = require("../db");
const { env } = require("process");

// Middleware to verify JWT and enforce both role-based and job-title–based access
module.exports = ({ roles = [], jobTitles = [] } = {}) => {
    return (req, res, next) => {
        const token = extractToken(req);
        if (!token) {
            return respondWithError(res, 401, "Access denied. No token provided.");
        }

        return jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return respondWithError(res, 403, "Invalid or expired token.");
            }
            req.user = decoded; // decoded contains id, role, and jobTitle (when embedded)

            // 1) Role check
            if (roles.length && !roles.includes(req.user.role)) {
                return respondWithError(res, 403, "Access denied. Insufficient role.");
            }

            // 2) Job title check (only for staff/admin)
            if (jobTitles.length) {
                const userJobTitle = req.user.jobTitle;
                if (!userJobTitle) {
                    // fallback: look up in DB if not embedded
                    return db.query(
                        "SELECT Job_title FROM staff WHERE Staff_ID = ?",
                        [req.user.id],
                        (dbErr, results) => {
                            if (dbErr || !results.length) {
                                return respondWithError(res, 500, "Unable to verify job title.");
                            }
                            if (!jobTitles.includes(results[0].Job_title)) {
                                return respondWithError(res, 403, "Access denied. Insufficient job title.");
                            }
                            next();
                        }
                    );
                }
                if (!jobTitles.includes(userJobTitle)) {
                    return respondWithError(res, 403, "Access denied. Insufficient job title.");
                }
            }
            next();
        });
    };
};

// helper to extract JWT from cookies
function extractToken(req) {
    if (!req.headers.cookie) return null;
    const cookies = cookie.parse(req.headers.cookie);
    return cookies.jwt || null;
}

// generic error response helper
function respondWithError(res, statusCode, message) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
}
 