const url = require("url");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    // Handle CORS
    res.setHeader("Access-Control-Allow-Origin", "https://museum-db-kappa.vercel.app");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    // GET /manageGiftshop - Retrieve all products
    else if (parsedUrl.pathname === "/manageGiftshop" && method === "GET") {
        return authMiddleware({ roles: ["staff", "admin"] })(req, res, () => {
            console.log("[manageGiftshop.js] Auth passed for GET /manageGiftshop");
            db.query(
                "SELECT Product_ID, Name, Category_ID, Price, Stock_Quantity, Description FROM products",
                (err, results) => {
                    console.log("[manageGiftshop.js] DB callback /manageGiftshop, err:", err);
                    if (err) {
                        res.writeHead(500, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ message: "Error retrieving products", error: err }));
                    }
                    console.log("Sending products:", results);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(results));
                }
            );
        });
    }

    // POST /manageGiftshop - Add a new product
    else if (parsedUrl.pathname === "/manageGiftshop" && method === "POST") {
        return authMiddleware({ roles: ["staff", "admin"] })(req, res, () => {
            console.log("[manageGiftshop.js] Auth passed for POST /manageGiftshop");
            let body = "";
            req.on("data", chunk => {
                body += chunk;
            });
            req.on("end", () => {
                const product = JSON.parse(body);
                const imageBuffer = product.image_data
                    ? Buffer.from(product.image_data, "base64")
                    : null;

                const sql = "INSERT INTO products (Name, Category_ID, Price, Stock_Quantity, Description, product_image) VALUES (?, ?, ?, ?, ?, ?);";
                const values = [
                    product.Name,
                    product.Category_ID,
                    product.Price,
                    product.Stock_Quantity,
                    product.Description,
                    imageBuffer,
                ];
                if (values.some(v => v === undefined || v === null || v === "")) {
                    console.error("Missing product field(s):", values);
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: "Missing required product fields", values }));
                }
                db.query(sql, values, (err, results) => {
                    console.log("[manageGiftshop.js] DB callback POST, err:", err);
                    if (err) {
                        console.error("MySQL Insert Error:", err.sqlMessage);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ message: "Error inserting products", error: err }));
                    }
                    console.log("Sending new product:", results);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(results));
                });
            });
        });
    }

    // PUT /manageGiftshop - Restock an existing product
    else if (parsedUrl.pathname === "/manageGiftshop" && method === "PUT") {
        return authMiddleware({ roles: ["staff", "admin"] })(req, res, () => {
            console.log("[manageGiftshop.js] Auth passed for PUT /manageGiftshop");
            let body = "";
            req.on("data", chunk => {
                body += chunk;
            });
            req.on("end", () => {
                const product = JSON.parse(body);
                const sql = "UPDATE products SET Stock_Quantity = Stock_Quantity + ? WHERE Product_ID = ?;";
                db.query(sql, [product.restock_Amount, product.Product_ID], (err, results) => {
                    console.log("[manageGiftshop.js] DB callback PUT, err:", err);
                    if (err) {
                        console.error("MySQL Update Error:", err.message);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ message: "Error updating product", error: err }));
                    }
                    console.log("Sending updated product:", results);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(results));
                });
            });
        });
    }
    else if (parsedUrl.pathname === "/manageGiftshop" && method === "DELETE") {
        return authMiddleware({ roles: ["staff", "admin"] })(req, res, () => {
            console.log("[manageGiftshop.js] Auth passed for DELETE /manageGiftshop");
            let body = "";
            req.on("data", chunk => {
                body += chunk;
            });
            req.on("end", () => {
                const { Product_ID } = JSON.parse(body);
                const query = "DELETE FROM products WHERE Product_ID = ?;";
                db.query(query, [Product_ID], (err, results) => {
                    console.log("[manageGiftshop.js] DB callback DELETE, err:", err);
                    if (err) {
                        res.writeHead(500, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ message: "Error deleting product", error: err }));
                    }
                    console.log("Product removed:", Product_ID);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Item deleted successfully" }));
                });
            });
        });
    }

    // No matching route
    else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Route not found" }));
    }
};
