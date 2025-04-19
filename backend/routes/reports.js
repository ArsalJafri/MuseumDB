const url = require("url");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

function sendSummary(query, results, res, errorMessage) {
    db.query(query, (summaryErr, summaryResult) => {
        if (summaryErr) {
            console.error(errorMessage, summaryErr);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: errorMessage, error: summaryErr }));
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            sales: results,
            summary: summaryResult[0] || {}
        }));
    });
}

module.exports = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    

    // GET /total-report
    if (parsedUrl.pathname === "/total-report" && method === "GET") {
        return authMiddleware({
            roles: ["admin"],
            jobTitles: ["Administrator"]
        })(req, res, () => {
        const saleType = parsedUrl.query.type || "all";
        const dateRange = parsedUrl.query.dateRange || "all-dates";

    

        // range check for startDate and endDate to ensure they are in YYYY-MM-DD format if provided
        let ticketDateFilter = "";
        let giftshopDateFilter = "";
        let membershipDateFilter  = "";
        
        const { startDate, endDate } = parsedUrl.query;
        

        

        if (dateRange === "last-week") {
            ticketDateFilter = "WHERE p.Date_Purchased >= CURDATE() - INTERVAL 7 DAY";
            giftshopDateFilter = "WHERE Date >= CURDATE() - INTERVAL 7 DAY";
            // membershipDateFilter  = "WHERE Date >= CURDATE() - INTERVAL 7 DAY"; not sure if is this or not
             membershipDateFilter = "WHERE start_date >= CURDATE() - INTERVAL 7 DAY";

        } else if (dateRange === "last-month") {
            ticketDateFilter = "WHERE p.Date_Purchased >= CURDATE() - INTERVAL 1 MONTH";
            giftshopDateFilter = "WHERE Date >= CURDATE() - INTERVAL 1 MONTH";
            //membershipDateFilter  = "WHERE Date >= CURDATE() - INTERVAL 1 MONTH";
            membershipDateFilter  = "WHERE start_date >= CURDATE() - INTERVAL 1 MONTH";

        } else if (dateRange === "last-year") {
            ticketDateFilter = "WHERE p.Date_Purchased >= CURDATE() - INTERVAL 1 YEAR";
            giftshopDateFilter = "WHERE Date >= CURDATE() - INTERVAL 1 YEAR";
            //membershipDateFilter  = "WHERE Date >= CURDATE() - INTERVAL 1 YEAR";
            membershipDateFilter  = "WHERE start_date  >= CURDATE() - INTERVAL 1 YEAR";
        }


// If specific start and end dates are provided, override predefined dateRange filters
        if (startDate && endDate) {
            ticketDateFilter = `WHERE p.Date_Purchased BETWEEN '${startDate}' AND '${endDate}'`;
            giftshopDateFilter = `WHERE Date BETWEEN '${startDate}' AND '${endDate}'`;
            //membershipDateFilter = `WHERE Date BETWEEN '${startDate}' AND '${endDate}'`;
            membershipDateFilter = `WHERE start_date BETWEEN '${startDate}' AND '${endDate}'`;
        }

        // Queries
        const ticketQuery = `
        SELECT 
            CONCAT(pt.Purchase_ID, '-', pt.Ticket_ID) AS Sale_ID,
            CONCAT(c.First_Name, ' ', c.Last_Name) AS Customer_Name,
            'Ticket' AS Sale_Type,
            pt.Quantity * pt.Price AS Amount,
            pt.Quantity AS Quantity,
            p.Date_Purchased AS Sale_Date,
            NULL AS Product_Names
        FROM purchase_tickets pt
        JOIN purchases p ON pt.Purchase_ID = p.Purchase_ID
        JOIN customers c ON p.Customer_ID = c.Customer_ID
        ${ticketDateFilter}

    `;
    
    

        const giftShopQuery = `
        SELECT 
            gst.Transaction_ID AS Sale_ID,
            CONCAT(c.First_Name, ' ', c.Last_Name) AS Customer_Name,
            'Gift Shop' AS Sale_Type,
            gst.Total_Amount AS Amount,
            SUM(gsi.Quantity) AS Quantity,
            gst.Date AS Sale_Date,
            GROUP_CONCAT(DISTINCT p.Name SEPARATOR ', ') AS Product_Names
        FROM gift_shop_transactions gst
        LEFT JOIN customers c ON gst.Customer_ID = c.Customer_ID
        LEFT JOIN gift_shop_items gsi ON gst.Transaction_ID = gsi.Transaction_ID
        LEFT JOIN products p ON gsi.Product_ID = p.Product_ID
        ${giftshopDateFilter}
        GROUP BY gst.Transaction_ID


        `;

        const membershipQuery = `
        SELECT 
            m.membership_id AS Sale_ID,
            CONCAT(c.First_Name, ' ', c.Last_Name) AS Customer_Name,
            'Membership' AS Sale_Type,
            m.payment_amount AS Amount,
            NULL AS Quantity,
            m.start_date AS Sale_Date,
            NULL AS Product_Names
        FROM memberships m
        LEFT JOIN customers c ON m.customer_id = c.Customer_ID
        ${membershipDateFilter}
    `;
    

        let query = "";

        if (saleType === "tickets") { 
            query = `${ticketQuery} ORDER BY Sale_Date DESC`;
        } else if (saleType === "giftshop") {
            query = `${giftShopQuery} ORDER BY Sale_Date DESC`;
        } else if (saleType === "memberships") {
            query = `${membershipQuery} ORDER BY Sale_Date DESC`;
        } else {
            query = `
                ${ticketQuery}
                UNION ALL
                ${giftShopQuery}
                UNION ALL
                ${membershipQuery}
                ORDER BY Sale_Date DESC
            `;
        }
    

        // Main query
        db.query(query, (err, results) => {
            if (err) {
                console.error("Error retrieving total report:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Error retrieving total report", error: err }));
            }

            if (saleType === "tickets") {
                // Add summary query for tickets
                const summaryQuery = `
                SELECT
                    COUNT(*) AS total_transactions,
                    SUM(pt.Quantity) AS total_tickets_sold,
                    SUM(pt.Quantity * pt.Price) AS total_revenue,
                    (
                        SELECT CONCAT(c.First_Name, ' ', c.Last_Name)
                        FROM purchase_tickets pt2
                        JOIN purchases p ON pt2.Purchase_ID = p.Purchase_ID
                        JOIN customers c ON p.Customer_ID = c.Customer_ID
                        GROUP BY p.Customer_ID
                        ORDER BY SUM(pt2.Quantity) DESC
                        LIMIT 1
                    ) AS most_active_customer
                FROM purchase_tickets pt
                JOIN purchases p ON pt.Purchase_ID = p.Purchase_ID
                ${ticketDateFilter}
            `;
            sendSummary(summaryQuery, results, res, "Error retrieving ticket summary");

            



            }  else if (saleType === "all") {
                const fullSummaryQuery = `
                SELECT
                    (
                        (SELECT COUNT(*) FROM purchase_tickets pt JOIN purchases p ON pt.Purchase_ID = p.Purchase_ID ${ticketDateFilter}) +
                        (SELECT COUNT(*) FROM gift_shop_transactions ${giftshopDateFilter}) +
                        (SELECT COUNT(*) FROM memberships ${membershipDateFilter})
                    ) AS total_transactions,
            
                    (
                        (SELECT IFNULL(SUM(pt.Quantity * pt.Price), 0) FROM purchase_tickets pt JOIN purchases p ON pt.Purchase_ID = p.Purchase_ID ${ticketDateFilter}) +
                        (SELECT IFNULL(SUM(Total_Amount), 0) FROM gift_shop_transactions ${giftshopDateFilter}) +
                        (SELECT IFNULL(SUM(payment_amount), 0) FROM memberships ${membershipDateFilter})
                    ) AS total_revenue,
            
                    (
                        SELECT source FROM (
                            SELECT 'Tickets' AS source, SUM(pt.Quantity * pt.Price) AS revenue
                            FROM purchase_tickets pt
                            JOIN purchases p ON pt.Purchase_ID = p.Purchase_ID
                            ${ticketDateFilter}
                            
                            UNION ALL
                            
                            SELECT 'Gift Shop', SUM(Total_Amount)
                            FROM gift_shop_transactions
                            ${giftshopDateFilter}
                            
                            UNION ALL
            
                            SELECT 'Memberships', SUM(payment_amount)
                            FROM memberships
                            ${membershipDateFilter}
                        ) AS revenue_sources
                        ORDER BY revenue DESC
                        LIMIT 1
                    ) AS top_revenue_source,
            
                    (
                        SELECT COUNT(*)
                        FROM memberships
                        WHERE status = 'active'
                        ${membershipDateFilter ? `AND (${membershipDateFilter.replace(/^WHERE\s+/i, '')})` : ''}
                    ) AS active_memberships,
            
                    (
                        SELECT Customer_Name FROM (
                            SELECT CONCAT(c.First_Name, ' ', c.Last_Name) AS Customer_Name, COUNT(*) AS activity
                            FROM purchases p
                            JOIN customers c ON p.Customer_ID = c.Customer_ID
                            ${ticketDateFilter}
                            GROUP BY c.Customer_ID
            
                            UNION ALL
            
                            SELECT CONCAT(c.First_Name, ' ', c.Last_Name) AS Customer_Name, COUNT(*) AS activity
                            FROM gift_shop_transactions gst
                            JOIN customers c ON gst.Customer_ID = c.Customer_ID
                            ${giftshopDateFilter}
                            GROUP BY gst.Customer_ID
            
                            UNION ALL
            
                            SELECT CONCAT(c.First_Name, ' ', c.Last_Name) AS Customer_Name, COUNT(*) AS activity
                            FROM memberships m
                            JOIN customers c ON m.customer_id = c.Customer_ID
                            ${membershipDateFilter}
                            GROUP BY m.customer_id
                        ) AS combined
                        GROUP BY Customer_Name
                        ORDER BY SUM(activity) DESC
                        LIMIT 1
                    ) AS most_active_customer
            `;
            

                sendSummary(fullSummaryQuery, results, res, "Error retrieving full summary");

            }
            else if (saleType === "giftshop") {
                const summaryQuery = `
                    SELECT
                        COUNT(*) AS total_transactions,
                        SUM(gsi.Quantity * gsi.Price_Per_Unit) AS total_revenue,
                        SUM(gsi.Quantity) AS total_items_sold,
                        (
                            SELECT p.Name
                            FROM gift_shop_items gsi2
                            JOIN products p ON gsi2.Product_ID = p.Product_ID
                            GROUP BY gsi2.Product_ID
                            ORDER BY SUM(gsi2.Quantity) DESC
                            LIMIT 1
                        ) AS most_sold_product,
                        (
                            SELECT p.Name
                            FROM gift_shop_items gsi3
                            JOIN products p ON gsi3.Product_ID = p.Product_ID
                            GROUP BY gsi3.Product_ID
                            ORDER BY SUM(gsi3.Quantity * gsi3.Price_Per_Unit) DESC
                            LIMIT 1
                        ) AS top_revenue_product
                    FROM gift_shop_items gsi
                    JOIN gift_shop_transactions gst ON gsi.Transaction_ID = gst.Transaction_ID
                    ${giftshopDateFilter}
                `;

                sendSummary(summaryQuery, results, res, "Error retrieving gift shop summary");
            

            }
            else if (saleType === "memberships") {
            const summaryQuery = `
                SELECT
                    COUNT(*) AS total_transactions,
                    SUM(payment_amount) AS total_revenue,
                    (
                        SELECT CONCAT(c.First_Name, ' ', c.Last_Name)
                        FROM memberships m
                        JOIN customers c ON m.customer_id = c.Customer_ID
                        GROUP BY m.customer_id
                        ORDER BY SUM(m.payment_amount) DESC
                        LIMIT 1
                    ) AS top_member,
                    (
                        SELECT membership_type
                        FROM memberships
                        ${membershipDateFilter}
                        GROUP BY membership_type
                        ORDER BY COUNT(*) DESC
                        LIMIT 1
                    ) AS most_popular_membership,
                    (
                        SELECT COUNT(*)
                        FROM memberships
                        WHERE status = 'active'
                    ) AS active_memberships
                FROM memberships m
                JOIN customers c ON m.customer_id = c.Customer_ID
                ${membershipDateFilter}
            `;

                sendSummary(summaryQuery, results, res, "Error retrieving membership summary");
            }
            
            
            
            
            
            
            else {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ sales: results }));
            }

        });

        return;
    });
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
};
