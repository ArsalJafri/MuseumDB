const url = require("url");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

/**
 * handles incoming auth-related requests (register & login)
 */
module.exports = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname } = parsedUrl;
    const { method } = req;
 
    if (pathname === "/auth/register" && method === "POST") {
        handleRegister(req, res);
    } 
    else if (pathname === "/auth/login" && method === "POST") {
        handleLogin(req, res);
    }
    else if (pathname === "/auth/logout" && method === "POST") {
        handleLogout(req, res);
    }
    else if (pathname === "/auth/change-password" && method === "POST") {
        authMiddleware([])(req, res, () => { handleChangePassword(req,res); });
    }
    else if (pathname === "/auth/forgot-password" && method === "POST"){
        handleForgotPassword(req,res);
    }
    else if (pathname === "/auth/reset-password" && method === "POST"){
        handleResetPassword(req,res);
    }
    else if (pathname === "/auth/profile" && method === "GET") {
        authMiddleware([])(req, res, () => { handleProfile(req,res); });
    }
    else if (pathname === "/auth/update-profile" && method === "PUT") {
        authMiddleware([])(req, res, () => { handleUpdateProfile(req, res); });
    }
};

/**
 * handles user registration
 */
function handleRegister(req, res) {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
        try {
            const { email, password, role, firstName, lastName, phoneNumber } = JSON.parse(body);
            if (!email || !password || !role || !firstName || !lastName || !phoneNumber) {
                return sendResponse(res, 400, { message: "All fields are required." });
            }
            db.query("SELECT user_ID FROM users WHERE email = ?", [email], (err, results) => {
                if (err) return sendResponse(res, 500, { message: "Database error.", error: err });
                if (results.length > 0) return sendResponse(res, 409, { message: "Email already in use." });

                bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
                    if (hashErr) return sendResponse(res, 500, { message: "Error hashing password.", error: hashErr });
                    const userInsertQuery = "INSERT INTO users (email, password, role, created_at) VALUES (?, ?, ?, NOW())";
                    db.query(userInsertQuery, [email, hashedPassword, role], (insertErr, result) => {
                        if (insertErr) return sendResponse(res, 500, { message: "Error creating user.", error: insertErr });
                        const userId = result.insertId;
                        if (role === "customer") {
                            const customerInsert = `
                                INSERT INTO customers (customer_ID, Customer_Type, First_Name, Last_Name, Email, Phone_Number, Birthdate)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                            `;
                            const values = [userId, "Regular", firstName, lastName, email, phoneNumber, "2000-01-01"];
                            db.query(customerInsert, values, custErr => {
                                if (custErr) return sendResponse(res, 500, { message: "Error creating customer record.", error: custErr });
                                return sendResponse(res, 201, { message: "Customer registered successfully!", user_ID: userId });
                            });
                        } else {
                            const staffInsert = `
                                INSERT INTO staff (
                                    Staff_ID, First_Name, Last_Name, Job_title, Supervisor_ID,
                                    Department, Hire_Date, Email, Phone_Number,
                                    End_Date, Salary, Employee_ID, Active_Status
                                )
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `;
                            const values = [
                                userId, firstName, lastName,
                                role === "admin" ? "Administrator" : "New Hire",
                                null, "Unassigned", new Date(),
                                email, phoneNumber, null, 0.0, null, 1
                            ];
                            db.query(staffInsert, values, staffErr => {
                                if (staffErr) return sendResponse(res, 500, { message: "Error creating staff record.", error: staffErr });
                                return sendResponse(res, 201, { message: "Staff registered successfully!", user_ID: userId });
                            });
                        }
                    });
                });
            });
        } catch (error) {
            sendResponse(res, 400, { message: "Invalid JSON format.", error });
        }
    });
}

/**
 * handles user login
 */
function handleLogin(req, res) {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
        try {
            const { email, password } = JSON.parse(body);
            if (!email || !password) {
                return sendResponse(res, 400, { message: "Email and password are required." });
            }
            db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
                if (err) return sendResponse(res, 500, { message: "Database error.", error: err });
                if (results.length === 0) return sendResponse(res, 401, { message: "Invalid email or password." });
                const user = results[0];
                bcrypt.compare(password, user.password, (bcryptErr, isMatch) => {
                    if (bcryptErr || !isMatch) {
                        return sendResponse(res, 401, { message: "Invalid email or password." });
                    }
                    // customer: sign id & role only
                    if (user.role === "customer") {
                        const token = jwt.sign(
                            { id: user.user_ID, role: user.role },
                            process.env.JWT_SECRET,
                            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
                        );
                        const headers = {
                            "Set-Cookie": `jwt=${token}; HttpOnly; SameSite=None; Secure; Path=/; Max-Age=3600`
                        };
                        return sendResponse(res, 200, {
                            message: "Login successful",
                            user: { id: user.user_ID, email: user.email, role: user.role }
                        }, headers);
                    }
                    // staff/admin: fetch jobTitle then sign
                    db.query("SELECT Job_title FROM staff WHERE Staff_ID = ?", [user.user_ID], (jobErr, jobRows) => {
                        if (jobErr) {
                            return sendResponse(res, 500, { message: "Error fetching job title.", error: jobErr });
                        }
                        const jobTitle = jobRows[0]?.Job_title;
                        const token = jwt.sign(
                            { id: user.user_ID, role: user.role, jobTitle },
                            process.env.JWT_SECRET,
                            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
                        );
                        const headers = {
                            "Set-Cookie": `jwt=${token}; HttpOnly; SameSite=None; Secure; Path=/; Max-Age=3600`
                        };
                        return sendResponse(res, 200, {
                            message: "Login successful",
                            user: { id: user.user_ID, email: user.email, role: user.role, jobTitle }
                        }, headers);
                    });
                });
            });
        } catch (error) {
            sendResponse(res, 400, { message: "Invalid JSON format.", error });
        }
    });
}

/**
 * logout the user by clearing the JWT cookie
 */
function handleLogout(req, res) {
    // overwrite the existing 'jwt' cookie with an empty value and an immediate expiration date
    const headers = {
        "Set-Cookie": "jwt=; HttpOnly; SameSite=None; Secure; Path=/; Max-Age=0"
    };

    // NOW BAM the client now has no valid JWT cookie hee hee
    sendResponse(res, 200, { message: "Logout successful" }, headers);
}

function handleUpdateProfile(req, res) {
    let body = "";

    req.on("data", (chunk) => (body += chunk));

    req.on("end", () => {
        try {
            const { first_name, last_name, phone, address } = JSON.parse(body);
            const userId = req.user.id;
            const role = req.user.role;

            if (!first_name || !last_name || !phone) {
                return sendResponse(res, 400, { message: "First name, last name, and phone are required." });
            }

            if (role === "customer") {
                const query = `
                    UPDATE customers 
                    SET First_Name = ?, Last_Name = ?, Phone_Number = ?
                    WHERE Customer_ID = ?
                `;
                const values = [first_name, last_name, phone, userId];

                db.query(query, values, (err, result) => {
                    if (err) {
                        console.error("Error updating customer:", err);
                        return sendResponse(res, 500, { message: "Failed to update customer profile.", error: err });
                    }
                    sendResponse(res, 200, { message: "Customer profile updated." });
                });
            } else {
                const query = `
                    UPDATE staff 
                    SET First_Name = ?, Last_Name = ?, Phone_Number = ?
                    WHERE Staff_ID = ?
                `;
                const values = [first_name, last_name, phone, userId];

                db.query(query, values, (err, result) => {
                    if (err) {
                        console.error("Error updating staff:", err);
                        return sendResponse(res, 500, { message: "Failed to update staff profile.", error: err });
                    }
                    sendResponse(res, 200, { message: "Staff profile updated." });
                });
            }
        } catch (error) {
            console.error("Invalid JSON format in update-profile:", error);
            sendResponse(res, 400, { message: "Invalid JSON format.", error });
        }
    });
}

/**
 * handles password change for authenticated users
 */
function handleChangePassword(req, res) {
    let body = "";

    req.on("data", (chunk) => (body += chunk));

    req.on("end", () => {
        try {
            const { oldPassword, newPassword } = JSON.parse(body);
            const userId = req.user.id; // extract user ID from JWT

            if (!oldPassword || !newPassword) {
                return sendResponse(res, 400, { message: "Both old and new passwords are required." });
            }

            // fetch the user's stored password hash
            db.query("SELECT password FROM users WHERE user_ID = ?", [userId], (err, results) => {
                if (err) return sendResponse(res, 500, { message: "Database error.", error: err });
                if (results.length === 0) return sendResponse(res, 404, { message: "User not found." });

                const storedHash = results[0].password;

                // compare old password with the stored hash
                bcrypt.compare(oldPassword, storedHash, (bcryptErr, isMatch) => {
                    if (bcryptErr || !isMatch) {
                        return sendResponse(res, 401, { message: "Incorrect old password." });
                    }

                    // hash new password
                    bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
                        if (hashErr) return sendResponse(res, 500, { message: "Error hashing new password.", error: hashErr });

                        // update the password in the database
                        db.query("UPDATE users SET password = ? WHERE user_ID = ?", [hashedPassword, userId], (updateErr) => {
                            if (updateErr) return sendResponse(res, 500, { message: "Error updating password.", error: updateErr });

                            sendResponse(res, 200, { message: "Password changed successfully!" });
                        });
                    });
                });
            });
        } catch (error) {
            sendResponse(res, 400, { message: "Invalid JSON format.", error });
        }
    });
}

/**
 * handles password reset requests
 */
function handleForgotPassword(req, res) {
    let body = "";

    req.on("data", (chunk) => (body += chunk));

    req.on("end", () => {
        try {
            const { email } = JSON.parse(body);

            if (!email) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Email is required." }));
            }


            // check if user exists
            db.query("SELECT user_ID FROM users WHERE email = ?", [email], (err, results) => {
                if (err) {
                    console.error("Database error during user lookup:", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: "Database error." }));
                }
                if (results.length === 0) {
                    console.warn("Password reset requested for non-existent email:", email);
                    res.writeHead(404, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: "User not found." }));
                }

                const userId = results[0].user_ID;

                // generate a secure reset token
                const resetToken = crypto.randomBytes(32).toString("hex");
                const hashedToken = bcrypt.hashSync(resetToken, 10); // store hashed version in DB
                const expiryTime = new Date(Date.now() + 60 * 60 * 1000); // token valid for 1 hour

                // remove old reset tokens before inserting a new one
                db.query("UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE user_ID = ?", [userId], (clearErr) => {
                    if (clearErr) {
                        console.error("Error clearing old reset token:", clearErr);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ message: "Error processing request." }));
                    }

                    // store the new reset token in DB
                    db.query(
                        "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE user_ID = ?",
                        [hashedToken, expiryTime, userId],
                        (updateErr) => {
                            if (updateErr) {
                                console.error("Error storing reset token:", updateErr);
                                res.writeHead(500, { "Content-Type": "application/json" });
                                return res.end(JSON.stringify({ message: "Error storing reset token." }));
                            }

                            // send password reset email
                            sendPasswordResetEmail(email, resetToken);

                            res.writeHead(200, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ message: "A password reset link has been sent to your email!" }));
                        }
                    );
                });
            });

        } catch (error) {
            console.error("Invalid JSON format in request:", error);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Invalid JSON format." }));
        }
    });
}

/**
 * handles password reset using a token
 */
function handleResetPassword(req, res) {
    let body = "";

    req.on("data", (chunk) => (body += chunk));

    req.on("end", () => {
        try {
            const { resetToken, newPassword } = JSON.parse(body);

            if (!resetToken || !newPassword) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Reset token and new password are required." }));
            }

            // Find the user by reset token and check expiration
            db.query("SELECT user_ID, reset_token, reset_token_expiry FROM users WHERE reset_token IS NOT NULL", [], (err, results) => {
                if (err) {
                    console.error("Database error during token lookup:", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: "Database error." }));
                }

                // Check if token matches any stored hash
                let user = null;
                for (let i = 0; i < results.length; i++) {
                    if (bcrypt.compareSync(resetToken, results[i].reset_token)) {
                        user = results[i];
                        break;
                    }
                }

                if (!user) {
                    console.warn("Invalid or expired reset token attempt.");
                    res.writeHead(401, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: "Invalid or expired reset token." }));
                }

                const { user_ID, reset_token_expiry } = user;

                // Check if reset token is expired
                if (new Date(reset_token_expiry) < new Date()) {
                    console.warn(`Reset token expired for user ${user_ID}`);
                    res.writeHead(401, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: "Reset token has expired. Request a new one." }));
                }

                // Hash the new password
                bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
                    if (hashErr) {
                        console.error("Error hashing new password:", hashErr);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ message: "Error hashing password." }));
                    }

                    // Update password and clear reset token
                    db.query("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE user_ID = ?", 
                        [hashedPassword, user_ID], 
                        (updateErr) => {
                            if (updateErr) {
                                console.error("Error updating password:", updateErr);
                                res.writeHead(500, { "Content-Type": "application/json" });
                                return res.end(JSON.stringify({ message: "Error updating password." }));
                            }
                            res.writeHead(200, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ message: "Password reset successfully!" }));
                        }
                    );
                });
            });

        } catch (error) {
            console.error("Invalid JSON format in request:", error);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Invalid JSON format." }));
        }
    });
}


/**
 * sends a password reset email with a reset token
 */
function sendPasswordResetEmail(userEmail, resetToken) {

    // edge cases 
    if (!userEmail || !resetToken) {
        console.error("Error: Missing email or reset token.");
        return;
    }
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("Error: Missing email credentials in environment variables.");
        return;
    }

    // creates a transporter object to send emails with `nodemailer.createTransport()` initializes an SMTP transporter
    const transporter = nodemailer.createTransport({
        service: "gmail", // gmail is service provider
        auth: {
            user: process.env.EMAIL_USER, // email address used to send the email
            pass: process.env.EMAIL_PASS, // app-specific password for authentication
        },
    });
    
    // generates the password reset link with the token as a parameter.
    const resetLink = `https://museum-db-kappa.vercel.app/reset-password?token=${resetToken}`; // `http://localhost:5173/reset-password?token=${resetToken}`
    // const resetLink = `https://museum-db-kappa.vercel.app/reset-password?token=${resetToken}`; // Uncomment for production

    // email content
    const mailOptions = {
        from: process.env.EMAIL_USER, // The sender's email address.
        to: userEmail, // The recipient's email address.
        subject: "Museum Database Team 13 - Password Reset!", // Email subject line.
        text: `Click the link below to reset your password:\n${resetLink}`, // Plain text version of the email.
        html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`, // HTML version for better formatting.
    };

    // sends the email using the transporter object and mailOptions parameter
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error("Email Sending Error:", err); // Logs the error if the email fails to send.
        } else {
            console.log(`Password reset email sent to ${userEmail}:`, info.response); // Logs success message.
        }
    });

}

/**
 *  retrieves the currently logged-in user's info from the DB for display
 */
function handleProfile(req, res) {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === "customer") {
        db.query(
            `SELECT 
                u.user_ID AS customer_id,     
                u.email, 
                u.role, 
                c.First_Name AS first_name, 
                c.Last_Name AS last_name, 
                c.Phone_Number AS phone, 
                c.Customer_Type AS membership_level,
                "" AS address
             FROM users u
             JOIN customers c ON u.user_ID = c.Customer_ID
             WHERE u.user_ID = ?`,
            [userId],
            (err, results) => {
                if (err) {
                    console.error("DB error fetching customer:", err);
                    return sendResponse(res, 500, { message: "Error retrieving profile", error: err });
                }
                if (results.length === 0) {
                    console.warn("No customer profile found.");
                    return sendResponse(res, 404, { message: "Profile not found." });
                }
                return sendResponse(res, 200, results[0]);
            }
        );
    } else {
        db.query(
            `SELECT 
                u.user_ID AS staff_id,            -- optional, for consistency
                u.email, 
                u.role, 
                s.First_Name AS first_name, 
                s.Last_Name AS last_name, 
                s.Phone_Number AS phone, 
                s.Job_title AS job_title, 
                s.Hire_Date AS hire_date, 
                s.Salary AS salary,
                "" AS address
             FROM users u
             JOIN staff s ON u.user_ID = s.Staff_ID
             WHERE u.user_ID = ?`,
            [userId],
            (err, results) => {
                if (err) {
                    console.error("DB error fetching staff:", err);
                    return sendResponse(res, 500, { message: "Error retrieving profile", error: err });
                }
                if (results.length === 0) {
                    console.warn("No staff profile found.");
                    return sendResponse(res, 404, { message: "Profile not found." });
                }
                return sendResponse(res, 200, results[0]);
            }
        );
    }
}

/**
 * sends a structured JSON response.
 */
function sendResponse(res, statusCode, payload, headers = {}) {
    res.writeHead(statusCode, { ...headers, "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
}
