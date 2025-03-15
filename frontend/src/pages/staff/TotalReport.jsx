import "../../styles/totalreport.css";
import { useState, useEffect } from "react";

const TotalReport = () => {
    // Dummy Sales Data 
    const [reportType, setReportType] = useState("total-tickets-sales");
    const [ticketSales, setTicketSales] = useState([]);

     useEffect(() => {
            fetchReportData();
        }, []);
    const fetchReportData = async () => {
        try {
            const response = await fetch("http://localhost:3000/total-report");
            const data = await response.json();
            setTicketSales(data); // Update state with actual database employees
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    }


    return (
        <main className="total-report-container">
            <h1 className="report-title">Sales Report</h1>

            {/* Filters (Dropdowns & Search Bars) */}
            <div className="filters">
                <select className="report-dropdown"  value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    <option value="total-sales">Total Sales Report</option>
                    <option value="total-ticket-sales">Total Tickets Sales </option>
                </select>

                <input type="text" className="report-search" placeholder="Search by Customer Name" />
                <select className="report-dropdown">
                    <option value="all-dates">All Dates</option>
                    <option value="last-month">Last Month</option>
                    <option value="last-year">Last Year</option>
                </select>
            </div>

            {/* Report Table */}
            <table className="report-table">
                <thead>
                    <tr>
                        <th>Ticket ID</th>
                        <th>Customer ID</th>
                        <th>Ticket Type</th>
                        <th>Cost</th>
                        <th>Date</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                {ticketSales.map((ticket) => (
                        <tr key={ticket.Ticket_ID}>
                            <td>{ticket.Ticket_ID}</td>
                            <td>{ticket.Customer_ID || "N/A"}</td>
                            <td>{ticket.Ticket_Type}</td>
                            <td>${Number(ticket.Price || 0).toFixed(2)}</td>
                            <td>{new Date(ticket.Date_Purchased).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
};

export default TotalReport;
