import { useState, useEffect } from "react";
import "../../styles/manage.css";

const ManageTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Ticket form state for adding a new ticket
  const [newTicket, setNewTicket] = useState({
    Ticket_Type: "",
    Price: "",
  });
  // Ticket form state for editing an existing ticket, including an optional Exhibition_ID field.
  const [editTicket, setEditTicket] = useState(null);

  useEffect(() => {
    fetchTickets();
    fetchExhibitions();
  }, []);

  const fetchTickets = async () => {
    try {
      // Fetch all tickets (both Available and Sold) for management
      const response = await fetch("https://museumdb.onrender.com/tickets", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const fetchExhibitions = async () => {
    try {
      const response = await fetch("https://museumdb.onrender.com/manage-exhibition", {
        method: "GET",
        credentials: "include",
      });
            if (!response.ok) {
        throw new Error("Failed to fetch exhibitions");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setExhibitions(data);
      } else {
        setExhibitions([]);
      }
    } catch (error) {
      console.error("Error fetching exhibitions:", error);
    }
  };

  const handleInputChange = (e, setter) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  // Submit the add ticket form
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const ticketData = {
        Ticket_Type: newTicket.Ticket_Type,
        Price: newTicket.Price,
      };
      const response = await fetch("https://museumdb.onrender.com/tickets", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketData),
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Ticket added successfully!");
        fetchTickets();
        setNewTicket({ Ticket_Type: "", Price: "" });
        setIsAddModalOpen(false);
      } else {
        alert("Error adding ticket.");
      }
    } catch (error) {
      console.error("Failed to add ticket:", error);
    }
  };

  // Submit the edit ticket form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("https://museumdb.onrender.com/tickets", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editTicket),
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Ticket updated successfully!");
        fetchTickets();
        setEditTicket(null);
        setIsEditModalOpen(false);
      } else {
        alert("Error updating ticket.");
      }
    } catch (error) {
      console.error("Failed to update ticket:", error);
    }
  };

  // Deactivate ticket: update Status to "Sold"
  const handleDeactivate = async (ticketID) => {
    if (!window.confirm("Are you sure you want to deactivate this ticket?")) return;
    try {
      const response = await fetch("https://museumdb.onrender.com/tickets/deactivate", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Ticket_ID: ticketID }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Ticket deactivated successfully!");
        fetchTickets();
      } else {
        alert("Error deactivating ticket.");
      }
    } catch (error) {
      console.error("Failed to deactivate ticket:", error);
    }
  };

  // Reactivate ticket: update Status back to "Available"
  const handleReactivate = async (ticketID) => {
    if (!window.confirm("Are you sure you want to reactivate this ticket?")) return;
    try {
      const response = await fetch("https://museumdb.onrender.com/tickets/reactivate", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Ticket_ID: ticketID }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Ticket reactivated successfully!");
        fetchTickets();
      } else {
        alert("Error reactivating ticket.");
      }
    } catch (error) {
      console.error("Failed to reactivate ticket:", error);
    }
  };

  // Helper: Get exhibition title for a ticket. If no Exhibition_ID, return "Regular".
  const getExhibitionTitle = (ticket) => {
    if (!ticket.Exhibition_ID) return "Regular";
    const exhibition = exhibitions.find((ex) => ex.Exhibition_ID === ticket.Exhibition_ID);
    return exhibition ? exhibition.Name : "Regular";
  };

  return (
    <div className="manage-wrapper">
      <div className="manage-header">
        <h1>Manage Tickets</h1>
        <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
          Add Ticket
        </button>
      </div>

      <table className="manage-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ticket Type</th>
            <th>Price ($)</th>
            <th>Exhibition</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.Ticket_ID}>
              <td>{ticket.Ticket_ID}</td>
              <td>{ticket.Ticket_Type}</td>
              <td>${parseFloat(ticket.Price).toFixed(2)}</td>
              <td>{getExhibitionTitle(ticket)}</td>
              <td>{ticket.Status === "Sold" ? "Unavailable" : "Available"}</td>
              <td>
                {ticket.Status === "Available" ? (
                  <>
                    <button
                      className="add-btn"
                      style={{ marginRight: "5px" }}
                      onClick={() => {
                        setEditTicket(ticket);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="add-btn"
                      style={{ backgroundColor: "#dc3545" }}
                      onClick={() => handleDeactivate(ticket.Ticket_ID)}
                    >
                      Deactivate
                    </button>
                  </>
                ) : (
                  <button
                    className="add-btn"
                    style={{ backgroundColor: "#28a745" }}
                    onClick={() => handleReactivate(ticket.Ticket_ID)}
                  >
                    Reactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for Adding a New Ticket */}
      {isAddModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsAddModalOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#2c2a2a",
              padding: "20px",
              borderRadius: "5px",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h2 style={{ color: "#ffcc00" }}>Add New Ticket</h2>
            <form onSubmit={handleAddSubmit}>
              <label>Ticket Type:</label>
              <input
                type="text"
                name="Ticket_Type"
                placeholder="Ticket Type"
                value={newTicket.Ticket_Type}
                onChange={(e) => handleInputChange(e, setNewTicket)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Price ($):</label>
              <input
                type="number"
                step="0.01"
                name="Price"
                placeholder="Price"
                value={newTicket.Price}
                onChange={(e) => handleInputChange(e, setNewTicket)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                }}
              >
                <button type="submit" className="add-btn">
                  Add Ticket
                </button>
                <button
                  type="button"
                  className="add-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Editing a Ticket */}
      {isEditModalOpen && editTicket && (
        <div
          className="modal-overlay"
          onClick={() => setIsEditModalOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#2c2a2a",
              padding: "20px",
              borderRadius: "5px",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h2 style={{ color: "#ffcc00" }}>Edit Ticket</h2>
            <form onSubmit={handleEditSubmit}>
              <label>Ticket Type:</label>
              <input
                type="text"
                name="Ticket_Type"
                placeholder="Ticket Type"
                value={editTicket.Ticket_Type}
                onChange={(e) => handleInputChange(e, setEditTicket)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Price ($):</label>
              <input
                type="number"
                step="0.01"
                name="Price"
                placeholder="Price"
                value={editTicket.Price}
                onChange={(e) => handleInputChange(e, setEditTicket)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Exhibition ID (optional):</label>
              <input
                type="number"
                name="Exhibition_ID"
                placeholder="Exhibition ID"
                value={editTicket.Exhibition_ID || ""}
                onChange={(e) => handleInputChange(e, setEditTicket)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                }}
              >
                <button type="submit" className="add-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="add-btn"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditTicket(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTickets;
