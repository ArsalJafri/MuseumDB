const http = require("http");
const employeesRoutes = require("./routes/employees"); //  Import Employees Routes
const reportsRoutes = require("./routes/reports"); //

// Start HTTP Server
const server = http.createServer((req, res) => {

    // check if employeesRoutes should handle the request
    if (req.url.startsWith("/employees")) {
        employeesRoutes(req, res);
        return; // Prevent further execution
    }

  // or reportsRoutes should handle it
  else if (req.url.startsWith("/total-report")) {  // Ensure it calls reportsRoutes correctly
    reportsRoutes(req, res);
} else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
}

});


server.listen(3000, () => {
    console.log(" Server is running on http://localhost:3000");
});
