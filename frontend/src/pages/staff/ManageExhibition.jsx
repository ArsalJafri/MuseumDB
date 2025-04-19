import { useState, useEffect } from "react";
import "../../styles/manage.css";

const ManageExhibitions = () => {
  const [exhibitions, setExhibitions] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newExhibition, setNewExhibition] = useState({
    Name: "",
    Start_Date: "",
    End_Date: "",
    Budget: "",
    Location: "",
    Num_Tickets_Sold: "",
    Themes: "",
    Num_Of_Artworks: "",
    description: "",
    requires_ticket: false,
    exhibition_image_data: "", // Base64 image data
  });
  const [editExhibition, setEditExhibition] = useState(null);

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      const response = await fetch("https://museumdb.onrender.com/manage-exhibition/manage", {
        method: "GET",
        credentials: "include",
      });
      
      console.log("[ManageExhibitions] Response status:", response.status);
      console.log("[ManageExhibitions] Response headers:", Array.from(response.headers.entries()));
      if (!response.ok) {
        throw new Error("Failed to fetch exhibitions");
      }
      const data = await response.json();
      setExhibitions(Array.isArray(data) ? data : []);
    } catch (error) {
    }
  };

  const handleInputChange = (e, stateSetter) => {
    const { name, value, type, checked } = e.target;
    stateSetter((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDrop = (e, stateSetter) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      convertFileToBase64(file, stateSetter);
    }
  };

  const handleFileChange = (e, stateSetter) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      convertFileToBase64(file, stateSetter);
    }
  };

  const convertFileToBase64 = (file, stateSetter) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      stateSetter((prev) => ({
        ...prev,
        exhibition_image_data: reader.result.split(",")[1],
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "https://museumdb.onrender.com/manage-exhibition",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(newExhibition),
        }
      );
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Exhibition added successfully!");
        fetchExhibitions();
        setNewExhibition({
          Name: "",
          Start_Date: "",
          End_Date: "",
          Budget: "",
          Location: "",
          Num_Tickets_Sold: "",
          Themes: "",
          Num_Of_Artworks: "",
          description: "",
          requires_ticket: false,
          exhibition_image_data: "",
        });
        setIsAddModalOpen(false);
      } else {
        alert("Error adding exhibition.");
      }
    } catch (error) {
      console.error("Failed to add exhibition:", error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "https://museumdb.onrender.com/manage-exhibition",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(editExhibition),
        }
      );
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Exhibition updated successfully!");
        fetchExhibitions();
        setEditExhibition(null);
        setIsEditModalOpen(false);
      } else {
        alert("Error updating exhibition.");
      }
    } catch (error) {
      console.error("Failed to update exhibition:", error);
    }
  };

  const handleDeactivateExhibition = async (exhibitionId) => {
    if (!window.confirm("Are you sure you want to deactivate this exhibition?")) return;
    try {
      const response = await fetch(
        "https://museumdb.onrender.com/manage-exhibition/deactivate",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ Exhibition_ID: exhibitionId }),
        }
      );
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Exhibition deactivated successfully!");
        fetchExhibitions();
      } else {
        alert("Error deactivating exhibition.");
      }
    } catch (error) {
      console.error("Failed to deactivate exhibition:", error);
    }
  };

  const handleReactivateExhibition = async (exhibitionId) => {
    if (!window.confirm("Are you sure you want to reactivate this exhibition?")) return;
    try {
      const response = await fetch(
        "https://museumdb.onrender.com/manage-exhibition/reactivate",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ Exhibition_ID: exhibitionId }),
        }
      );
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Exhibition reactivated successfully!");
        fetchExhibitions();
      } else {
        alert("Error reactivating exhibition.");
      }
    } catch (error) {
      console.error("Failed to reactivate exhibition:", error);
    }
  };

  const handleEdit = (exhibition) => {
    setEditExhibition({ ...exhibition });
    setIsEditModalOpen(true);
  };

  return (
    <div className="manage-wrapper">
      <div className="manage-header">
        <h1>Manage Exhibitions</h1>
        <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
          Add Exhibition
        </button>
      </div>
      <table className="manage-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Budget ($)</th>
            <th>Location</th>
            <th>Ticket Required</th>
            <th>Themes</th>
            <th># Artworks</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {exhibitions.map((exhibition) => (
            <tr key={exhibition.Exhibition_ID}>
              <td>{exhibition.Exhibition_ID}</td>
              <td>{exhibition.Name}</td>
              <td>{new Date(exhibition.Start_Date).toLocaleDateString()}</td>
              <td>{new Date(exhibition.End_Date).toLocaleDateString()}</td>
              <td>${parseFloat(exhibition.Budget).toLocaleString()}</td>
              <td>{exhibition.Location}</td>
              <td>{exhibition.requires_ticket ? "Yes" : "No"}</td>
              <td>{exhibition.Themes}</td>
              <td>{exhibition.Num_Of_Artworks}</td>
              <td>{exhibition.is_active ? "Active" : "Inactive"}</td>
              <td>
                {exhibition.is_active ? (
                  <>
                    <button
                      className="add-btn"
                      style={{ marginRight: "5px" }}
                      onClick={() => handleEdit(exhibition)}
                    >
                      Edit
                    </button>
                    <button
                      className="add-btn"
                      style={{ backgroundColor: "#dc3545" }}
                      onClick={() =>
                        handleDeactivateExhibition(exhibition.Exhibition_ID)
                      }
                    >
                      Deactivate
                    </button>
                  </>
                ) : (
                  <button
                    className="add-btn"
                    style={{ backgroundColor: "#28a745" }}
                    onClick={() =>
                      handleReactivateExhibition(exhibition.Exhibition_ID)
                    }
                  >
                    Reactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for Adding Exhibition */}
      {isAddModalOpen && (
        <div
          className="modal-overlay"
          onDragOver={(e) => e.preventDefault()}
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
            style={{
              backgroundColor: "#2c2a2a",
              padding: "20px",
              borderRadius: "5px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ color: "#ffcc00" }}>Add New Exhibition</h2>
            <form onSubmit={handleAddSubmit}>
              <label>Exhibition Name:</label>
              <input
                type="text"
                name="Name"
                placeholder="Exhibition Name"
                value={newExhibition.Name}
                onChange={(e) => handleInputChange(e, setNewExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Start Date:</label>
              <input
                type="date"
                name="Start_Date"
                value={newExhibition.Start_Date}
                onChange={(e) => handleInputChange(e, setNewExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>End Date:</label>
              <input
                type="date"
                name="End_Date"
                value={newExhibition.End_Date}
                onChange={(e) => handleInputChange(e, setNewExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Budget ($):</label>
              <input
                type="number"
                step="0.01"
                name="Budget"
                placeholder="Budget"
                value={newExhibition.Budget}
                onChange={(e) => handleInputChange(e, setNewExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Location:</label>
              <input
                type="text"
                name="Location"
                placeholder="Location"
                value={newExhibition.Location}
                onChange={(e) => handleInputChange(e, setNewExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Theme:</label>
              <input
                type="text"
                name="Themes"
                placeholder="Theme"
                value={newExhibition.Themes}
                onChange={(e) => handleInputChange(e, setNewExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Number of Artworks:</label>
              <input
                type="number"
                name="Num_Of_Artworks"
                placeholder="Number of Artworks"
                value={newExhibition.Num_Of_Artworks}
                onChange={(e) => handleInputChange(e, setNewExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Description:</label>
              <textarea
                name="description"
                placeholder="Description"
                value={newExhibition.description}
                onChange={(e) => handleInputChange(e, setNewExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              ></textarea>
              <label>Exhibition Image (File Upload):</label>
              <div
                className="drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, setNewExhibition)}
                style={{
                  border: "2px dashed #555",
                  padding: "10px",
                  textAlign: "center",
                  marginBottom: "10px",
                }}
              >
                {newExhibition.exhibition_image ? (
                  <img
                    src={newExhibition.exhibition_image}
                    alt="Preview"
                    style={{ maxWidth: "100%", maxHeight: "200px" }}
                  />
                ) : (
                  <p style={{ color: "black" }}>
                    Drop image here or click to select
                  </p>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setNewExhibition)}
                  style={{ display: "none" }}
                  id="fileInput"
                />
              </div>
              <button
                type="button"
                onClick={() => document.getElementById("fileInput").click()}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                Select Image
              </button>
              <label style={{ display: "block", marginBottom: "10px" }}>
                <span>Ticket Required?</span>
                <input
                  type="checkbox"
                  name="requires_ticket"
                  checked={newExhibition.requires_ticket}
                  onChange={(e) => handleInputChange(e, setNewExhibition)}
                  style={{ marginLeft: "10px" }}
                />
              </label>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                }}
              >
                <button type="submit" className="add-btn">
                  Add Exhibition
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

      {/* Modal for Editing Exhibition */}
      {isEditModalOpen && editExhibition && (
        <div
          className="modal-overlay"
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
            style={{
              backgroundColor: "#2c2a2a",
              padding: "20px",
              borderRadius: "5px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ color: "#ffcc00" }}>Edit Exhibition</h2>
            <form onSubmit={handleEditSubmit}>
              <label>Exhibition Name:</label>
              <input
                type="text"
                name="Name"
                placeholder="Exhibition Name"
                value={editExhibition.Name}
                onChange={(e) => handleInputChange(e, setEditExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Start Date:</label>
              <input
                type="date"
                name="Start_Date"
                value={editExhibition.Start_Date}
                onChange={(e) => handleInputChange(e, setEditExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>End Date:</label>
              <input
                type="date"
                name="End_Date"
                value={editExhibition.End_Date}
                onChange={(e) => handleInputChange(e, setEditExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Budget ($):</label>
              <input
                type="number"
                step="0.01"
                name="Budget"
                placeholder="Budget"
                value={editExhibition.Budget}
                onChange={(e) => handleInputChange(e, setEditExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Location:</label>
              <input
                type="text"
                name="Location"
                placeholder="Location"
                value={editExhibition.Location}
                onChange={(e) => handleInputChange(e, setEditExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Theme:</label>
              <input
                type="text"
                name="Themes"
                placeholder="Theme"
                value={editExhibition.Themes}
                onChange={(e) => handleInputChange(e, setEditExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Number of Artworks:</label>
              <input
                type="number"
                name="Num_Of_Artworks"
                placeholder="Number of Artworks"
                value={editExhibition.Num_Of_Artworks}
                onChange={(e) => handleInputChange(e, setEditExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
              <label>Description:</label>
              <textarea
                name="description"
                placeholder="Description"
                value={editExhibition.description}
                onChange={(e) => handleInputChange(e, setEditExhibition)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              ></textarea>
              <label>Requires Ticket:</label>
              <input
                type="checkbox"
                name="requires_ticket"
                checked={editExhibition.requires_ticket}
                onChange={(e) => handleInputChange(e, setEditExhibition)}
                style={{ marginBottom: "10px" }}
              />
              <label>Exhibition Image:</label>
              <div
                className="drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, setEditExhibition)}
                style={{
                  border: "2px dashed #555",
                  padding: "10px",
                  textAlign: "center",
                  marginBottom: "10px",
                }}
              >
                {editExhibition.exhibition_image_data ? (
                  <img
                    src={`data:image/jpeg;base64,${editExhibition.exhibition_image_data}`}
                    alt="Preview"
                    style={{ maxWidth: "100%", maxHeight: "200px" }}
                  />
                ) : (
                  <p style={{ color: "black" }}>
                    Drop image here or click to select
                  </p>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setEditExhibition)}
                  style={{ display: "none" }}
                  id="editFileInput"
                />
              </div>

              <button
                type="button"
                onClick={() => document.getElementById("editFileInput").click()}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                Select Image
              </button>
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
                    setEditExhibition(null);
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

export default ManageExhibitions;
