import { useState, useEffect } from "react";
import "../../styles/manage.css";

const ManageArtworks = () => {
  const [artworks, setArtworks] = useState([]);
  const [exhibitionsList, setExhibitionsList] = useState([]);
  const [filterExhibitionID, setFilterExhibitionID] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [newArtwork, setNewArtwork] = useState({
    Exhibition_ID: "",
    Title: "",
    Artist_Name: "",
    Year_Created: "",
    Year_Acquired: "",
    description: "",
    artwork_image_data: "",
  });

  const [editArtwork, setEditArtwork] = useState(null);

  useEffect(() => {
    console.log("[ManageArtworks.jsx] useEffect - fetching artworks");
    fetchArtworks();
    fetchExhibitionsList();
  }, []);

  const fetchArtworks = async () => {
    console.log("[ManageArtworks.jsx] fetchArtworks called");
    try {
      const response = await fetch("https://museumdb.onrender.com/manage-artworks", {
        credentials: "include"
      }); // https://museumdb.onrender.com/manage-artworks
      console.log("[ManageArtworks.jsx] fetchArtworks response:", response); // http://localhost:5000/manage-artworks
      if (!response.ok) {
        throw new Error("Failed to fetch artworks");
      }
      const data = await response.json();
      console.log("[ManageArtworks.jsx] Received artworks data:", data);
      if (Array.isArray(data)) {
        setArtworks(data);
      } else {
        console.error("[ManageArtworks.jsx] Data is not an array:", data);
        setArtworks([]);
      }
    } catch (error) {
      console.error("[ManageArtworks.jsx] Error fetching artworks:", error);
    }
  };

  const fetchExhibitionsList = async () => {
    try {
      const response = await fetch("https://museumdb.onrender.com/manage-exhibition", {
        credentials: "include"
      }); // http://localhost:5000/manage-exhibition
      if (!response.ok) { // https://museumdb.onrender.com/manage-exhibition
        throw new Error("Failed to fetch exhibitions");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setExhibitionsList(data);
      } else {
        console.error("Exhibitions data is not an array:", data);
        setExhibitionsList([]);
      }
    } catch (error) {
      console.error("Error fetching exhibitions:", error);
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
        artwork_image_data: reader.result.split(",")[1],
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    console.log("[ManageArtworks.jsx] Add artwork submit triggered", newArtwork);
    try {
      const response = await fetch("https://museumdb.onrender.com/manage-artworks", { // http://localhost:5000/manage-artworks
        method: "POST", // https://museumdb.onrender.com/manage-artworks
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newArtwork),
      });
      console.log("[ManageArtworks.jsx] POST response:", response);
      const result = await response.json();
      console.log("[ManageArtworks.jsx] POST result:", result);
      if (response.ok) {
        alert(result.message || "Artwork added successfully!");
        fetchArtworks();
        // Reset form
        setNewArtwork({
          Exhibition_ID: "",
          Title: "",
          Artist_Name: "",
          Year_Created: "",
          Year_Acquired: "",
          description: "",
          artwork_image_data: "",
        });
        setIsAddModalOpen(false);
      } else {
        alert("Error adding artwork.");
      }
    } catch (error) {
      console.error("[ManageArtworks.jsx] Failed to add artwork:", error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    console.log("[ManageArtworks.jsx] Edit artwork submit triggered", editArtwork);
    try {
      const response = await fetch("https://museumdb.onrender.com/manage-artworks", { // http://localhost:5000/manage-artworks
        method: "PUT", // https://museumdb.onrender.com/manage-artworks
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editArtwork),
      });
      console.log("[ManageArtworks.jsx] PUT response:", response);
      const result = await response.json();
      console.log("[ManageArtworks.jsx] PUT result:", result);
      if (response.ok) {
        alert(result.message || "Artwork updated successfully!");
        fetchArtworks();
        setEditArtwork(null);
        setIsEditModalOpen(false);
      } else {
        alert("Error updating artwork.");
      }
    } catch (error) {
      console.error("[ManageArtworks.jsx] Failed to update artwork:", error);
    }
  };

  const handleDeleteArtwork = async (artworkId) => {
    if (!window.confirm("Are you sure you want to delete this artwork?")) {
      console.log("[ManageArtworks.jsx] Delete action cancelled");
      return;
    }
    console.log("[ManageArtworks.jsx] Deleting artwork with ID:", artworkId);
    try {
      const response = await fetch("https://museumdb.onrender.com", { // http://localhost:5000/manage-artworks
        method: "DELETE", // https://museumdb.onrender.com/manage-artworks
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Artwork_ID: artworkId }),
      });
      console.log("[ManageArtworks.jsx] DELETE response:", response);
      const result = await response.json();
      console.log("[ManageArtworks.jsx] DELETE result:", result);
      if (response.ok) {
        alert(result.message || "Artwork deleted successfully!");
        fetchArtworks();
      } else {
        alert("Error deleting artwork.");
      }
    } catch (error) {
      console.error("[ManageArtworks.jsx] Failed to delete artwork:", error);
    }
  };

  const handleEdit = (artwork) => {
    console.log("[ManageArtworks.jsx] Opening edit modal for artwork:", artwork);
    setEditArtwork({ ...artwork });
    setIsEditModalOpen(true);
  };

  // Filter the artworks by selected exhibition ID
  const filteredArtworks =
    filterExhibitionID === ""
      ? artworks
      : artworks.filter((artwork) =>
          artwork.Exhibition_ID.toString() === filterExhibitionID
        );

  return (
    <div className="manage-wrapper">
      {/* Keep the original manage-header just for the page title */}
      <div className="manage-header">
        <h1>Manage Artworks</h1>
      </div>

      {/* New row combining filter dropdown and Add Artwork button */}
      <div className="manage-controls-row">
        <div className="filter-container" style={{ marginBottom: 0 }}>
          <label style={{ marginRight: "10px" }}>Filter by Exhibition:</label>
          <select
            value={filterExhibitionID}
            onChange={(e) => setFilterExhibitionID(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px" }}
          >
            <option value="">All Exhibitions</option>
            {exhibitionsList.map((exh) => (
              <option key={exh.Exhibition_ID} value={exh.Exhibition_ID}>
                {exh.Name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="add-btn"
          onClick={() => {
            // Reset the form every time before opening the modal
            setNewArtwork({
              Exhibition_ID: "",
              Title: "",
              Artist_Name: "",
              Year_Created: "",
              Year_Acquired: "",
              description: "",
              artwork_image_data: "",
            });
            setIsAddModalOpen(true);
          }}
        >
          Add Artwork
        </button>
      </div>

      <table className="manage-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Exhibition</th>
            <th>Title</th>
            <th>Artist Name</th>
            <th>Year Created</th>
            <th>Year Acquired</th>
            <th>Description</th>
            <th>Picture</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredArtworks.map((artwork) => (
            <tr key={artwork.Artwork_ID}>
              <td>{artwork.Artwork_ID}</td>
              <td>{artwork.Exhibition_Name || artwork.Exhibition_ID}</td>
              <td>{artwork.Title}</td>
              <td>{artwork.Artist_Name}</td>
              <td>{artwork.Year_Created}</td>
              <td>{artwork.Year_Acquired}</td>
              <td>{artwork.description}</td>
              <td>
                {artwork.artwork_image ? (
                  <img
                    src={artwork.artwork_image}
                    alt={artwork.Title}
                    style={{ maxWidth: "100px" }}
                  />
                ) : (
                  "No Image"
                )}
              </td>
              <td>
                <button
                  className="add-btn"
                  style={{ marginRight: "5px" }}
                  onClick={() => handleEdit(artwork)}
                >
                  Edit
                </button>
                <button
                  className="add-btn"
                  style={{ backgroundColor: "#dc3545" }}
                  onClick={() => handleDeleteArtwork(artwork.Artwork_ID)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for Adding Artwork */}
      {isAddModalOpen && (
        <div
          className="modal-overlay"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, setNewArtwork)}
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
            <h2 style={{ color: "#ffcc00" }}>Add New Artwork</h2>
            <form onSubmit={handleAddSubmit}>
              <label>Exhibition:</label>
              <select
                name="Exhibition_ID"
                value={newArtwork.Exhibition_ID}
                onChange={(e) => handleInputChange(e, setNewArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              >
                <option value="">Select Exhibition</option>
                {exhibitionsList.map((exh) => (
                  <option key={exh.Exhibition_ID} value={exh.Exhibition_ID}>
                    {exh.Name}
                  </option>
                ))}
              </select>

              <label>Title:</label>
              <input
                type="text"
                name="Title"
                placeholder="Artwork Title"
                value={newArtwork.Title}
                onChange={(e) => handleInputChange(e, setNewArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />

              <label>Artist Name:</label>
              <input
                type="text"
                name="Artist_Name"
                placeholder="Artist Name"
                value={newArtwork.Artist_Name}
                onChange={(e) => handleInputChange(e, setNewArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />

              <label>Year Created:</label>
              <input
                type="number"
                name="Year_Created"
                placeholder="e.g. 2020"
                value={newArtwork.Year_Created}
                onChange={(e) => handleInputChange(e, setNewArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />

              <label>Year Acquired:</label>
              <input
                type="number"
                name="Year_Acquired"
                placeholder="e.g. 2021"
                value={newArtwork.Year_Acquired}
                onChange={(e) => handleInputChange(e, setNewArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />

              <label>Description:</label>
              <textarea
                name="description"
                placeholder="Artwork description"
                value={newArtwork.description}
                onChange={(e) => handleInputChange(e, setNewArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              ></textarea>

              <label>Artwork Image (File Upload):</label>
              <div
                className="drop-zone"
                onDragOver={(evt) => evt.preventDefault()}
                onDrop={(evt) => handleDrop(evt, setNewArtwork)}
                onClick={() => document.getElementById("artworkFileInput").click()}
                style={{
                  border: "2px dashed #555",
                  padding: "10px",
                  textAlign: "center",
                  marginBottom: "10px",
                }}
              >
                {newArtwork.artwork_image_data ? (
                  <img
                    src={`data:image/jpeg;base64,${newArtwork.artwork_image_data}`}
                    alt="Preview"
                    style={{ maxWidth: "100%", maxHeight: "200px" }}
                  />
                ) : (
                  <p style={{ color: "black" }}>Drop image here or click to select</p>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(evt) => handleFileChange(evt, setNewArtwork)}
                  style={{ display: "none" }}
                  id="artworkFileInput"
                />
              </div>
              <button
                type="button"
                onClick={() => document.getElementById("artworkFileInput").click()}
                style={{ marginBottom: "10px", padding: "10px", width: "100%", cursor: "pointer" }}
              >
                Select Image
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                <button type="submit" className="add-btn">
                  Add Artwork
                </button>
                <button
                  type="button"
                  className="add-btn"
                  onClick={() => {
                    console.log("[ManageArtworks.jsx] Add modal cancelled; resetting form");
                    setNewArtwork({
                      Exhibition_ID: "",
                      Title: "",
                      Artist_Name: "",
                      Year_Created: "",
                      Year_Acquired: "",
                      description: "",
                      artwork_image_data: "",
                    });
                    setIsAddModalOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Editing Artwork */}
      {isEditModalOpen && editArtwork && (
        <div
          className="modal-overlay"
          onDragOver={(evt) => evt.preventDefault()}
          onDrop={(evt) => handleDrop(evt, setEditArtwork)}
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
            <h2 style={{ color: "#ffcc00" }}>Edit Artwork</h2>
            <form onSubmit={handleEditSubmit}>
              <label>Exhibition:</label>
              <select
                name="Exhibition_ID"
                value={editArtwork.Exhibition_ID}
                onChange={(evt) => handleInputChange(evt, setEditArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              >
                <option value="">Select Exhibition</option>
                {exhibitionsList.map((exh) => (
                  <option key={exh.Exhibition_ID} value={exh.Exhibition_ID}>
                    {exh.Name}
                  </option>
                ))}
              </select>

              <label>Title:</label>
              <input
                type="text"
                name="Title"
                value={editArtwork.Title}
                onChange={(evt) => handleInputChange(evt, setEditArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />

              <label>Artist Name:</label>
              <input
                type="text"
                name="Artist_Name"
                value={editArtwork.Artist_Name}
                onChange={(evt) => handleInputChange(evt, setEditArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />

              <label>Year Created:</label>
              <input
                type="number"
                name="Year_Created"
                value={editArtwork.Year_Created}
                onChange={(evt) => handleInputChange(evt, setEditArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />

              <label>Year Acquired:</label>
              <input
                type="number"
                name="Year_Acquired"
                value={editArtwork.Year_Acquired}
                onChange={(evt) => handleInputChange(evt, setEditArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />

              <label>Description:</label>
              <textarea
                name="description"
                value={editArtwork.description}
                onChange={(evt) => handleInputChange(evt, setEditArtwork)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              ></textarea>

              <label>Artwork Image (File Upload):</label>
              <div
                className="drop-zone"
                onDragOver={(ev) => ev.preventDefault()}
                onDrop={(ev) => handleDrop(ev, setEditArtwork)}
                onClick={() => document.getElementById("editArtworkFileInput").click()}
                style={{
                  border: "2px dashed #555",
                  padding: "10px",
                  textAlign: "center",
                  marginBottom: "10px",
                }}
              >
                {editArtwork.artwork_image_data ? (
                  <img
                    src={`data:image/jpeg;base64,${editArtwork.artwork_image_data}`}
                    alt="Preview"
                    style={{ maxWidth: "100%", maxHeight: "200px" }}
                  />
                ) : (
                  <p style={{ color: "black" }}>Drop image here or click to select</p>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(ev) => handleFileChange(ev, setEditArtwork)}
                  style={{ display: "none" }}
                  id="editArtworkFileInput"
                />
              </div>
              <button
                type="button"
                onClick={() => document.getElementById("editArtworkFileInput").click()}
                style={{ marginBottom: "10px", padding: "10px", width: "100%", cursor: "pointer" }}
              >
                Select Image
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                <button type="submit" className="add-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="add-btn"
                  onClick={() => {
                    console.log("[ManageArtworks.jsx] Edit modal closed");
                    setIsEditModalOpen(false);
                    setEditArtwork(null);
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

export default ManageArtworks;
