// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AnimatedLink from "../components/AnimatedLink";
import image1 from '/src/assets/image1.jpg';
import image2 from '/src/assets/image2.jpg';
import image3 from '/src/assets/image3.jpg';
import image4 from '/src/assets/image4.jpg';
import "../styles/home.css";

const images = [image1, image2, image3, image4];

const Home = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkLogin = async () => {
      console.log("🔍 Home checking login...");
      try { // https://museumdb.onrender.com/auth/profile
        const res = await fetch("https://museumdb.onrender.com/auth/profile", { // http://localhost:5000/auth/profile
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();
        console.log("📡 /auth/profile response:", res.status, data);

        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("❌ Error checking login status in Home:", error);
        setIsLoggedIn(false);
      }
    };

    checkLogin();
  }, []);

  return (
    <div className="home-background"> {/* Apply background only to Home.jsx */}
    <div className="page-container">
      <div className="sidebar">
        <h1 className="museum-name">Houston Museum of Fine Arts</h1>
        <nav className="nav-links">
          <ul>
            {!isLoggedIn && <li><AnimatedLink to="/auth">Login</AnimatedLink></li>}
            {isLoggedIn && <li><AnimatedLink to="/profile">Profile</AnimatedLink></li>}
            <li><AnimatedLink to="/exhibitions">Exhibitions</AnimatedLink></li>
            <li><AnimatedLink to="/tickets">Tickets</AnimatedLink></li>
            <li><AnimatedLink to="/memberships">Memberships</AnimatedLink></li>
            <li><AnimatedLink to="/giftshop">Gift Shop</AnimatedLink></li>
            <li><AnimatedLink to="/contact">Contact</AnimatedLink></li>
          </ul>
        </nav>
      </div>
      <div className="main-content">
        <motion.div
          className="text-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="main-title">The Art of the 21st Century</h2>
          <p className="subtitle">
            Explore the evolution of artistic expression through contemporary exhibitions and timeless masterpieces.
          </p>
          <AnimatedLink to="/exhibitions" className="cta-button">Discover More</AnimatedLink>
        </motion.div>
        <motion.div
          className="image-frame"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
            <img src={images[currentImage]} alt="Featured Artwork" className="featured-image" />
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Home;
