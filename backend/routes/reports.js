const url = require("url");
const db = require("../db");

module.exports = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    // Always set CORS headers immediately
    res.setHeader("Access-Control-Allow-Origin", "https://museum-db-kappa.vercel.app");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    // GET /total-report
    if (parsedUrl.pathname === "/total-report" && method === "GET") {
        const saleType = parsedUrl.query.type || "all";
        const dateRange = parsedUrl.query.dateRange || "all-dates";

        // Prepare date filters for each table
        let ticketDateFilter = "";
        let giftshopDateFilter = "";
        let donationDateFilter = "";

        if (dateRange === "last-week") {
            ticketDateFilter = "WHERE p.Date_Purchased >= CURDATE() - INTERVAL 7 DAY";
            giftshopDateFilter = "WHERE Date >= CURDATE() - INTERVAL 7 DAY";
            donationDateFilter = "WHERE Date >= CURDATE() - INTERVAL 7 DAY";
        } else if (dateRange === "last-month") {
            ticketDateFilter = "WHERE p.Date_Purchased >= CURDATE() - INTERVAL 1 MONTH";
            giftshopDateFilter = "WHERE Date >= CURDATE() - INTERVAL 1 MONTH";
            donationDateFilter = "WHERE Date >= CURDATE() - INTERVAL 1 MONTH";
        } else if (dateRange === "last-year") {
            ticketDateFilter = "WHERE p.Date_Purchased >= CURDATE() - INTERVAL 1 YEAR";
            giftshopDateFilter = "WHERE Date >= CURDATE() - INTERVAL 1 YEAR";
            donationDateFilter = "WHERE Date >= CURDATE() - INTERVAL 1 YEAR";
        }

        // Ticket sales from purchase_tickets + purchases
        const ticketQuery = `
            SELECT 
                CONCAT(pt.Purchase_ID, '-', pt.Ticket_ID) AS Sale_ID,
                p.Customer_ID,
                'Ticket' AS Sale_Type,
                pt.Quantity * pt.Price AS Amount,
                p.Date_Purchased AS Sale_Date,
                p.Payment_Method
            FROM purchase_tickets pt
            JOIN purchases p ON pt.Purchase_ID = p.Purchase_ID
            ${ticketDateFilter}
        `;

        const giftShopQuery = `
            SELECT 
                Transaction_ID AS Sale_ID,
                Customer_ID,
                'Gift Shop' AS Sale_Type,
                Total_Amount AS Amount,
                Date AS Sale_Date,
                Payment_Method
            FROM gift_shop_transactions
            ${giftshopDateFilter}
        `;

        const donationQuery = `
            SELECT 
                Donation_ID AS Sale_ID,
                user_ID AS Customer_ID,
                'Donation' AS Sale_Type,
                Amount,
                Date AS Sale_Date,
                Payment_Method
            FROM donations
            ${donationDateFilter}
        `;

        let query = "";

        if (saleType === "tickets") {
            query = `${ticketQuery} ORDER BY Sale_Date DESC`;
        } else if (saleType === "giftshop") {
            query = `${giftShopQuery} ORDER BY Sale_Date DESC`;
        } else if (saleType === "donations") {
            query = `${donationQuery} ORDER BY Sale_Date DESC`;
        } else {
            // Full report
            query = `
                ${ticketQuery}
                UNION ALL
                ${giftShopQuery}
                UNION ALL
                ${donationQuery}
                ORDER BY Sale_Date DESC
            `;
        }

        // Execute the query
        db.query(query, (err, results) => {
            if (err) {
                console.error("Error retrieving total report:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Error retrieving total report", error: err }));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(results));
        });

        return;
    }

    // Handle unknown route
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
};
