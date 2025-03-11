
import React from "react";
import { Card, CardContent } from "../components/card";
import NavigationTabs from "../components/NavigationTabs";
import { useNavigate, useLocation } from "react-router-dom";
import Paintings from "./Paintings";
import Sculptures from "./Sculptures";
import Photographs from "./Photographs";
import Prints from "./Prints";
import Ceramics from "./Ceramics";

const events = [
  { name: "Art & Wine Night", date: "March 10, 2025" },
  { name: "Sculpture Workshop", date: "March 15, 2025" },
  { name: "Photography Masterclass", date: "March 20, 2025" },
];

export default function ArtExhibits() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get current category from URL path (default to "paintings")
  const currentCategory = location.pathname.split("/").pop() || "paintings";

  // Function to switch category
  const handleCategoryChange = (category) => {
    navigate(`/exhibitions/${category.toLowerCase()}`);
  };

  // Mapping categories to components
  const categoryComponents = {
    paintings: <Paintings />,
    sculptures: <Sculptures />,
    photographs: <Photographs />,
    prints: <Prints />,
    ceramics: <Ceramics />,
  };

  return (
    <div className="pt-24 p-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold my-4 text-center">Current Art Exhibitions</h1>
      <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
        Explore our curated selection of paintings, sculptures, photographs, prints, and ceramics.
        Click on a category below to discover beautiful artworks.
      </p> 

      {/* Navigation Tabs */}
      <NavigationTabs onCategoryChange={handleCategoryChange} />

      {/* Upcoming Events Section */}
      <div>
        <h2 className="text-2xl font-bold mt-6">Upcoming Events</h2>
        <div className="mt-4">
          {events.map((event, index) => (
            <Card key={index} className="mb-2">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">{event.name}</h3>
                <p className="text-gray-500">{event.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

