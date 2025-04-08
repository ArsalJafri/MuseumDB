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
    exhibition_image_data: "", // new field for Base64 image data
  });
  const [editExhibition, setEditExhibition] = useState(null);

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      const response = await fetch(
        "https://museumdb.onrender.com/manage-exhibition"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch exhibitions");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setExhibitions(data);
      } else {
        console.error("Data is not an array:", data);
        setExhibitions([]);
      }
    } catch (error) {
      console.error("Error fetching exhibitions:", error);
    }
  };

  // Generic input change handler; stateSetter can be setNewExhibition or setEditExhibition.
  const handleInputChange = (e, stateSetter) => {
    const { name, value, type, checked } = e.target;
    stateSetter((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handles file drop for image upload.
  const handleDrop = (e, stateSetter) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      convertFileToBase64(file, stateSetter);
    }
  };

  // Handles file change (manual selection) for image upload.
  const handleFileChange = (e, stateSetter) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      convertFileToBase64(file, stateSetter);
    }
  };

  // Converts a file to a Base64 data URL and stores it under 'exhibition_image_data'.
  const convertFileToBase64 = (file, stateSetter) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result is something like "data:image/jpeg;base64,..."
      // You can store the full data URL or strip the prefix if desired.
      stateSetter((prev) => ({
        ...prev,
        exhibition_image_data: reader.result.split(",")[1], // storing only the Base64 portion
      }));
    };
    reader.readAsDataURL(file);
  };

  // Add Exhibition Submission (POST)
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send newExhibition as JSON; backend will convert exhibition_image_data to a Buffer.
      const response = await fetch(
        "https://museumdb.onrender.com/manage-exhibition",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

  // Edit Exhibition Submission (PUT)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "https://museumdb.onrender.com/manage-exhibition",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
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

  // Delete Exhibition (DELETE)
  const handleDeleteExhibition = async (exhibitionId) => {
    if (!window.confirm("Are you sure you want to delete this exhibition?"))
      return;
    try {
      const response = await fetch(
        "https://museumdb.onrender.com/manage-exhibition",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Exhibition_ID: exhibitionId }),
        }
      );
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Exhibition deleted successfully!");
        fetchExhibitions();
      } else {
        alert("Error deleting exhibition.");
      }
    } catch (error) {
      console.error("Failed to delete exhibition:", error);
    }
  };

  // Open edit modal and prefill with selected exhibition data.
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
            <th>Tickets Sold</th>
            <th>Themes</th>
            <th># Artworks</th>
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
              <td>{exhibition.Num_Tickets_Sold}</td>
              <td>{exhibition.Themes}</td>
              <td>{exhibition.Num_Of_Artworks}</td>
              <td>
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
                    handleDeleteExhibition(exhibition.Exhibition_ID)
                  }
                >
                  Delete
                </button>
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
          onDrop={(e) => handleDrop(e, setNewExhibition)}
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

              <label>Exhibition Image (File Upload):</label>
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

              <label style={{ display: "block", marginBottom: "10px" }}>
                <span>Ticket Required?</span>
                <input
                  type="checkbox"
                  name="requires_ticket"
                  checked={editExhibition.requires_ticket}
                  onChange={(e) => handleInputChange(e, setEditExhibition)}
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
