import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "../styles/exhibition.css";

// Helper function to truncate a string if it exceeds maxLength.
const truncateText = (str, maxLength) => {
  if (!str) return "";
  return str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
};

const Exhibitions = () => {
  const [exhibitions, setExhibitions] = useState([]);
  const [hoveredColor, setHoveredColor] = useState(null);

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      // Fetch data from your backend endpoint.
      const response = await fetch(
        "http://localhost:5000/exhibitions"
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

  // Framer Motion container variants for staggered entrance.
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  // Framer Motion card variants for fade in + slide upward.
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  return (
    <div className="exhibitions-page">
      {/* Background overlay with animated dot color */}
      <motion.div
        className="background-overlay"
        animate={{
          backgroundColor: "rgba(0,0,0,0)", // remains transparent
          "--dot-color": hoveredColor || "rgba(255,255,255,0.1)",
        }}
        transition={{ duration: 0.5 }}
      />
      <div className="exhibitions-container">
        {/* Header Section */}
        <div className="exhibitions-header">
          <h1>Welcome to Exhibitions!</h1>
          <p>Explore our special exhibitions and discover pivotal moments in history!</p>
        </div>
        {/* Exhibitions Grid with staggered entrance */}
        <motion.div
          className="exhibitions-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {exhibitions.map((exhibition, index) => {
            const dotColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"]; // red, blue, green, orange
            const themeColor = dotColors[index % dotColors.length]; // cycle through colors

            return (
              <motion.div
                key={exhibition.Exhibition_ID}
                className="exhibition-card"
                variants={cardVariants}
                whileHover={{
                  scale: 1.03,
                  backgroundColor: "#2a2a2a",
                }}
                onHoverStart={() => setHoveredColor(themeColor)}
                onHoverEnd={() => setHoveredColor(null)}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
              >
                <Link to={`/artworks/${exhibition.Exhibition_ID}`} className="card-link">
                  <img
                    src={exhibition.exhibition_image}
                    alt={exhibition.Name}
                    loading="lazy"
                    width="600"
                    height="400"
                    srcSet={`
            ${exhibition.exhibition_image} 600w,
            ${exhibition.exhibition_image} 300w
          `}
                    sizes="(max-width: 600px) 300px, 600px"
                  />
                  <div className="card-content">
                    <h2>{truncateText(exhibition.Name, 30)}</h2>
                    <p>{truncateText(exhibition.description, 100)}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default Exhibitions;
