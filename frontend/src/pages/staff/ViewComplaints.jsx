import { useState, useEffect } from "react";
// imported the same CSS file as ExhibitionReport.jsx for unified styling lol make my life easier
import "../../styles/reports.css";

const ViewComplaints = () => {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editingComplaintId, setEditingComplaintId] = useState(null);
  const [notesInput, setNotesInput] = useState("");
  const [exhibitions, setExhibitions] = useState([]);

  // Filters
  const [filterType, setFilterType] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Calculate unique exhibit names based on Complaint_Type (which now holds exhibit names)
  const uniqueComplaintTypes = Array.from(
    new Set(complaints.map((c) => c.Complaint_Type))
  ).filter(Boolean).sort();

  useEffect(() => {
    fetch("https://museumdb.onrender.com/manage-exhibition", {
      credentials: "include"
      })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setExhibitions(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("https://museumdb.onrender.com/auth/profile", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => setUser(null));

    fetchComplaints();
    fetchComplaintSummary();
  }, [filterType, startDate, endDate]);

  const fetchComplaints = async () => {
    try {
      let url = "https://museumdb.onrender.com/complaints?";
      if (filterType !== "All") url += `type=${encodeURIComponent(filterType)}&`;
      if (startDate) url += `start=${startDate}&`;
      if (endDate) url += `end=${endDate}&`;

      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      setComplaints(data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const fetchComplaintSummary = async () => {
    try {
      let url = "https://museumdb.onrender.com/complaints/summary?";
      if (filterType !== "All") url += `type=${encodeURIComponent(filterType)}&`;
      if (startDate) url += `start=${startDate}&`;
      if (endDate) url += `end=${endDate}&`;

      const res = await fetch(url, {
        credentials: "include",
      });
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch complaint summary:", err);
    }
  };

  const handleEditNotes = (complaint) => {
    setEditingComplaintId(complaint.Complaint_ID);
    setNotesInput(complaint.Resolution_Notes || "");
  };

  const handleCancelEdit = () => {
    setEditingComplaintId(null);
    setNotesInput("");
  };

  const handleSaveNotes = async (complaint) => {
    try {
      let formattedDate = null;
      if (complaint.Resolution_Date) {
        const rawDate = new Date(complaint.Resolution_Date);
        formattedDate = rawDate.toISOString().split("T")[0];
      }

      const updated = {
        Status: complaint.Status,
        Resolution_Date: formattedDate,
        Resolution_Time: complaint.Resolution_Time || null,
        Resolution_Notes: notesInput,
      };

      const res = await fetch(
        `https://museumdb.onrender.com/complaints/${complaint.Complaint_ID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
          credentials: "include",
        }
      );

      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.Complaint_ID === complaint.Complaint_ID
              ? { ...c, Resolution_Notes: notesInput }
              : c
          )
        );
        handleCancelEdit();
      } else {
        const result = await res.json();
        console.error("Update failed:", result);
      }
    } catch (err) {
      console.error("PUT error:", err);
    }
  };

  const handleToggleStatus = async (complaint) => {
    try {
      const newStatus = complaint.Status === "Pending" ? "Resolved" : "Pending";
      let newResolutionDate = null;
      let newResolutionTime = null;

      if (newStatus === "Resolved") {
        const nowHouston = new Date(
          new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
        );
        const pad = (n) => (n < 10 ? "0" + n : n);
        const year = nowHouston.getFullYear();
        const month = pad(nowHouston.getMonth() + 1);
        const day = pad(nowHouston.getDate());
        const hours = pad(nowHouston.getHours());
        const minutes = pad(nowHouston.getMinutes());
        const seconds = pad(nowHouston.getSeconds());
        newResolutionDate = `${year}-${month}-${day}`;
        newResolutionTime = `${hours}:${minutes}:${seconds}`;
      }

      const response = await fetch(
        `https://museumdb.onrender.com/complaints/${complaint.Complaint_ID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Status: newStatus,
            Resolution_Date: newResolutionDate,
            Resolution_Time: newResolutionTime,
            Resolution_Notes: complaint.Resolution_Notes || null,
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.Complaint_ID === complaint.Complaint_ID
              ? {
                  ...c,
                  Status: newStatus,
                  Resolution_Date:
                    newStatus === "Resolved" ? newResolutionDate : null,
                  Resolution_Time:
                    newStatus === "Resolved" ? newResolutionTime : null,
                }
              : c
          )
        );
        fetchComplaintSummary();
      } else {
        const result = await response.json();
        console.error("Failed to toggle status:", result);
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return (
      <main className="exh-report-container">
        <h1>You do not have permission to view this page.</h1>
      </main>
    );
  }

  return (
    <main className="exh-report-container">
      {/* Header */}
      <div className="exh-report-header">
        <h1>View Complaints</h1>
      </div>

      {/* Filters - now filtering by Complaint_Type (i.e., exhibit name) */}
      <div className="exh-report-controls">
        <select
          className="exh-report-dropdown"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All Exhibits</option>
          {uniqueComplaintTypes.map((type, index) => (
            <option key={index} value={type}>
              {type}
            </option>
          ))}
        </select>

        <div className="exh-report-date-controls">
          <div className="exh-report-manual-dates">
            <label htmlFor="startDate">From:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              className="report-date"
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="exh-report-manual-dates">
            <label htmlFor="endDate">To:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              className="report-date"
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <button
          className="reset-button"
          onClick={() => {
            setFilterType("All");
            setStartDate("");
            setEndDate("");
          }}
        >
          Reset Filters
        </button>
      </div>

      {/* Summary Section */}
      {summary && (
        <div className="exh-report-summary">
          <div>Open Complaints: {summary.open_complaints}</div>
          <div>Resolved Complaints: {summary.resolved_complaints}</div>
          <div>Top Exhibit: {summary.top_complaint_type || "N/A"}</div>
          <div>Busiest Day: {summary.busiest_day || "N/A"}</div>
          <div>
            Average Rating:{" "}
            {summary.avg_rating !== null && summary.avg_rating !== undefined
              ? Number(summary.avg_rating).toFixed(1)
              : "N/A"}
          </div>
        </div>
      )}

      {/* Complaints Table */}
      <div className="exh-report-table-container">
        <table className="exh-report-table">
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Customer ID</th>
              <th>Date</th>
              <th>Time (CST)</th>
              <th>Exhibit</th>
              <th>Description</th>
              <th>Status</th>
              <th>Resolution Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => {
              const isEditing = editingComplaintId === complaint.Complaint_ID;
              const statusClass =
                complaint.Status === "Resolved"
                  ? "status-resolved"
                  : "status-pending";
              return (
                <tr key={complaint.Complaint_ID}>
                  <td>{complaint.Complaint_ID}</td>
                  <td>{complaint.customer_ID}</td>
                  <td>
                    {new Date(complaint.Complaint_Date).toLocaleDateString()}
                  </td>
                  <td>{complaint.Complaint_Time || "N/A"}</td>
                  <td>{complaint.Complaint_Type}</td>
                  <td>{complaint.Description}</td>
                  <td>
                    <div className="status-wrapper">
                      <span className={statusClass}>{complaint.Status}</span>
                      <button
                        className="btn-status-toggle"
                        onClick={() => handleToggleStatus(complaint)}
                      >
                        {complaint.Status === "Pending"
                          ? "Mark Resolved"
                          : "Mark Pending"}
                      </button>
                    </div>
                  </td>
                  <td>
                    {complaint.Resolution_Date
                      ? `${new Date(
                          complaint.Resolution_Date
                        ).toLocaleDateString()} ${complaint.Resolution_Time || ""}`
                      : "N/A"}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="notes-edit-container">
                        <textarea
                          className="notes-textarea"
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                        />
                        <div className="notes-button-group">
                          <button
                            className="btn-notes save"
                            onClick={() => handleSaveNotes(complaint)}
                          >
                            Save
                          </button>
                          <button
                            className="btn-notes cancel"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="notes-display">
                        <div>{complaint.Resolution_Notes || "N/A"}</div>
                        <button
                          className="btn-notes edit"
                          onClick={() => handleEditNotes(complaint)}
                        >
                          {complaint.Resolution_Notes ? "Edit" : "Add"} Notes
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default ViewComplaints;
