const http = require("http"); // Import Node.js HTTP module to create a server
const url = require("url"); // Import URL module for parsing request URLs
const employeesRoutes = require("./routes/employees"); // Import employees routes
const reportsRoutes = require("./routes/reports"); // Import reports routes
const authRoutes = require("./routes/auth"); // Import authentication routes
const authMiddleware = require("./middleware/authMiddleware"); // Import authentication middleware
const giftshopRoutes = require("./routes/giftshop"); // Import giftshop routes
const shopCartRoutes = require("./routes/shopcart"); // Import shop cart routes
const complaintsRoutes = require("./routes/complaints");
const exhibitionReportRoutes = require("./routes/exhibitionReport");
const ticketsRoutes = require("./routes/tickets"); // Import tickets routes
const membershipRoutes = require("./routes/membership"); // Import membership routes
const contactRoutes = require("./routes/contact");
const notificationRoutes = require("./routes/adminnotification");
const manageGiftshopRoutes = require("./routes/manageGiftshop");
const exhibitionRoutes = require("./routes/exhibitions");
const manageArtworksRoutes = require("./routes/manageArtworks");
const artworksRoutes = require("./routes/artworks");
const customerPurchasesRoute = require("./routes/customerpurchases");
const exhibitionsPage = require("./routes/exhibitionsPage");


const allowedOrigins = [
    "https://museum-db-kappa.vercel.app", // Vercel frontend (adjust if different)
    "http://localhost:5183", // Local frontend
    "http://localhost:5173", // gabe local frontend
];
 
// Start HTTP Server
const server = http.createServer((req, res) => { 
    // CORS Headers below
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);      
 
    if (parsedUrl.pathname === "/") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Welcome to the Museum Database API" }));
        return;
    }
    else if (parsedUrl.pathname.startsWith("/auth")) {
        authRoutes(req, res);
        return;
    }
    else if (parsedUrl.pathname.startsWith("/employees")) {
        authMiddleware({
            roles: ["staff", "admin"],
            jobTitles: ["Manager", "Administrator"]
        })(req, res, () => {
            employeesRoutes(req, res);
        });
        return;
    }
    else if (parsedUrl.pathname.startsWith("/total-report")) {
            reportsRoutes(req, res);
        return;
    }
    else if (parsedUrl.pathname.startsWith("/manage-exhibition")) {
        authMiddleware({
            roles: ["staff", "admin"],
            jobTitles: ["Curator", "Administrator"]
        })(req, res, () => {
            exhibitionRoutes(req, res);
        });
        return;
    }
    else if (parsedUrl.pathname.startsWith("/exhibition-report")) {
        authMiddleware({
            roles: ["staff", "admin"],
            jobTitles: ["Curator", "Administrator"]
        })(req, res, () => {
            exhibitionReportRoutes(req, res);
        });
        return;
    }
    else if (req.url.startsWith("/exhibition")) {
        return exhibitionsPage(req, res);
    }
    else if (parsedUrl.pathname.startsWith("/manage-artworks")) {
            manageArtworksRoutes(req, res);
        return;
    }
    else if (parsedUrl.pathname.startsWith("/artworks")) {
        artworksRoutes(req, res);
        return;
    }    
    else if (parsedUrl.pathname.startsWith("/exhibition-purchases")) {
        exhibitionRoutes(req, res);
        return;
    }
    else if (parsedUrl.pathname.startsWith("/manageGiftshop")) {
        authMiddleware({
            roles: ["staff", "admin"],
            jobTitles: ["Manager", "Administrator"]
        })(req, res, () => {
            manageGiftshopRoutes(req,res);
        });
        return;
    }
    else if (req.url.startsWith("/complaints")) {
        // authMiddleware(["staff", "admin"])(req, res, () => {
            complaintsRoutes(req, res);
        // });
        return;
    }
    else if (parsedUrl.pathname.startsWith("/cart")) {
        shopCartRoutes(req, res);
        return;
    }
    else if (parsedUrl.pathname.startsWith("/giftshop")) {
        giftshopRoutes(req, res);
        return;
    }
    else if (parsedUrl.pathname.startsWith("/contact")) {
        contactRoutes(req, res);
        return;
    }
    else if (parsedUrl.pathname.startsWith("/tickets")) {
        ticketsRoutes(req, res);
        return;
    }
    else if (parsedUrl.pathname.startsWith("/purchase")) {
        ticketsRoutes(req, res);
        return;
    }
    else if (parsedUrl.pathname.startsWith("/membership")) {
        membershipRoutes(req, res, parsedUrl);
        return;
    }
    else if (parsedUrl.pathname.startsWith("/notifications")) {
        notificationRoutes(req, res, parsedUrl); 
        return;
    } 
    else if (parsedUrl.pathname.startsWith("/customer/purchases")) {
        customerPurchasesRoute(req, res, parsedUrl);
        return;
    }
    else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Route not found" }));
    }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
