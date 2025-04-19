import "../../styles/totalreport.css";
import { useState, useEffect } from "react";
import "../../styles/reports.css";

const TotalReport = () => {
    // Dummy Sales Data 
    const [reportType, setReportType] = useState("total-tickets-sales");
    const [ticketSales, setTicketSales] = useState([]);

    const [dateRange, setDateRange] = useState("all-dates"); // Default: Show all dates
    const [reportSummary, setReportSummary] = useState(null);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");



 const fetchReportData = async () => {
    try {
        const typeMap = {
            "total-ticket-sales": "tickets",
            "total-giftshop-sales": "giftshop",
            "total-memberships": "memberships"
        };

        let url = "https://museumdb.onrender.com/total-report?";

        if (reportType !== "total-sales") {
            url += `type=${typeMap[reportType]}&`;
        }

        if (startDate && endDate) {
            url += `startDate=${startDate}&endDate=${endDate}`;
        } else {
            url += `dateRange=${dateRange}`;
        }

        console.log("Fetching from:", url);

        const response = await fetch(url, { credentials: "include" });
        const data = await response.json();

        if (data.sales) {
            setTicketSales(data.sales);
            setReportSummary(data.summary || null);
        } else if (Array.isArray(data)) {
            setTicketSales(data);
            setReportSummary(null);
        } else {
            setTicketSales([]);
            setReportSummary(null);
            console.error("Unexpected data format:", data);
        }

    } catch (error) {
        console.error("Error fetching sales report:", error);
        setTicketSales([]);
    }
};


    // const fetchReportData = async () => {
    //     try {
    //         const typeMap = {
    //             "total-ticket-sales": "tickets",
    //             "total-giftshop-sales": "giftshop",
    //             "total-memberships": "memberships"
    //         };
    
    //         let url = "https://museumdb.onrender.com/total-report?";
            
    //         if (reportType !== "total-sales") {
    //             url += `type=${typeMap[reportType]}&`;
    //         }
    
    //         if (startDate && endDate) {
    //             url += `startDate=${startDate}&endDate=${endDate}`;
    //         } else {
    //             url += `dateRange=${dateRange}`;
    //         }
    
    //         console.log("Fetching from:", url);
    
    //         const response = await fetch(url);
    //         const data = await response.json();
    
    //         if (data.sales) {
    //             setTicketSales(data.sales);
    //             setReportSummary(data.summary || null);
    //         } else if (Array.isArray(data)) {
    //             setTicketSales(data);
    //             setReportSummary(null);
    //         } else {
    //             setTicketSales([]);
    //             setReportSummary(null);
    //             console.error("Unexpected data format:", data);
    //         }
    
    //     } catch (error) {
    //         console.error("Error fetching sales report:", error);
    //         setTicketSales([]);
    //     }
    // };
    
    
    
    useEffect(() => {
        fetchReportData();
    }, [reportType, dateRange, startDate, endDate]);
    
    
        

    return (
        // <main className="total-report-container">
           <main className = "exh-report-container">
          {/* <h1 className="report-title">Sales Report</h1> */}
          <h1 className="exh-report-header">Sales Report</h1>
    
          {/* Filters */}
          <div className="filters">
            <select
              className="report-dropdown"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="total-sales">All Sales</option>
              <option value="total-ticket-sales">Ticket Sales Only</option>
              <option value="total-giftshop-sales">Gift Shop Sales Only</option>
              <option value="total-memberships">Memberships Only</option> {/* ← updated */}

            </select>
    
            <input
                type="date"
                className="report-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
            />
            <input
                type="date"
                className="report-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
            />

    
            <select
              className="report-dropdown"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all-dates">All Dates</option>
              <option value="last-week">Last Week</option>
              <option value="last-month">Last Month</option>
              <option value="last-year">Last Year</option>
            </select>
          </div>
          <button
            className="reset-button"
            onClick={() => {
                setStartDate("");
                setEndDate("");
                setDateRange("all-dates");
            }}
            >
            Reset Dates
         </button>


    
          {/* Summary & Table Container */}


            <div className="report-content-wrapper">

                <div className="summary-wrapper">
                    {reportSummary && (
                    <div className="report-summary-grid">
                        <div className="summary-card">
                            <h3>Total Revenue</h3>
                            <p>${Number(reportSummary.total_revenue).toFixed(2)}</p>
                        </div>
                        <div className="summary-card">
                            <h3>Total Transactions</h3>
                            <p>{reportSummary.total_transactions}</p>
                        </div>
                        {reportType === "total-sales" && (
                        <>
                            <div className="summary-card">
                            <h3>Top Revenue Source</h3>
                            <p>{reportSummary.top_revenue_source || "N/A"}</p>
                            </div>
                            <div className="summary-card">
                            <h3>Active Memberships</h3>
                            <p>{reportSummary.active_memberships || 0}</p>
                            </div>
                        </>
                        )}


                        {/* Tickets */}
                        {reportType === "total-ticket-sales" && (
                        <>
                            <div className="summary-card">
                                <h3>Total Tickets Sold</h3>
                                <p>{reportSummary.total_tickets_sold}</p>
                            </div>
                            <div className="summary-card">
                                <h3>Most Active Customer</h3>
                                <p>{reportSummary.most_active_customer}</p>
                            </div>
                        </>
                    )}
                        {/* Gifshop-sales */}
                        {reportType === "total-giftshop-sales" && (
                        <>
                            <div className="summary-card">
                                <h3>Total Items Sold</h3>
                                <p>{reportSummary.total_items_sold}</p>
                            </div>
                            <div className="summary-card">
                                <h3>Most Sold Product</h3>
                                <p>{reportSummary.most_sold_product}</p>
                            </div>
                            <div className="summary-card">
                                <h3>Top Revenue Product</h3>
                                <p>{reportSummary.top_revenue_product}</p>
                            </div>
                        </>
                        )}
                            
                            {/* memberships */}
                            {reportType === "total-memberships" && (
                            <>
                                <div className="summary-card">
                                    <h3>Top Member</h3>
                                    <p>{reportSummary.top_member || "N/A"}</p>
                                </div>
                                <div className="summary-card">
                                    <h3>Most Popular Type</h3>
                                    <p>{reportSummary.most_popular_membership || "N/A"}</p>
                                </div>
                                <div className="summary-card">
                                    <h3>Active Memberships</h3>
                                    <p>{reportSummary.active_memberships || 0}</p>
                                </div>
                            </>
                        )}



                </div>
                )}
            </div>
         {/* End of Summary Wrapper */}
    
            {/* Report Table */}
            <div className="report-table-scroll">
            <table className="exh-report-table">
            <thead>
            <tr>
                <th>#</th>
                <th>Customer Name</th>
                {reportType === "total-sales" && <th>Type</th>}
                {reportType === "total-giftshop-sales" && <th>Products</th>}
                {reportType !== "total-memberships" && <th>Quantity</th>}
                <th>Amount</th>
                <th>Date</th>
            </tr>
            </thead>


            <tbody>
            {ticketSales.map((sale, index) => (
                <tr key={sale.Sale_ID || sale.Ticket_ID}>
                <td>{index + 1}</td>
                <td>{sale.Customer_Name || "N/A"}</td>
                {reportType === "total-sales" && <td>{sale.Sale_Type}</td>}
                {reportType === "total-giftshop-sales" && (
                    <td>{sale.Product_Names || "N/A"}</td>
                )}
                {reportType !== "total-memberships" && (
                    <td>{sale.Quantity || "N/A"}</td>
                )}
                <td>${Number(sale.Amount || sale.Price).toFixed(2)}</td>
                <td>
                    {new Date(
                    sale.Sale_Date || sale.Date_Purchased
                    ).toLocaleDateString()}
                </td>
                </tr>
            ))}
            </tbody>


            </table>
          </div>
          </div>
        </main>
      );
    };
    
    export default TotalReport;