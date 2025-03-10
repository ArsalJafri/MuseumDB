
import React, { useState } from "react";
import { Card, CardContent } from "../components/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/tabs";

const exhibits = {
  Paintings: [
    { title: "Butterfly Collection" , artist: "Janet Fish" , image:  "/Butterfly_Collection.jpeg"},
    { title: "Autumn Equinox Moon", artist: "Hayley Barker", image:  "/Autumn_Equinox_Moon.jpeg"},
  ],
  Sculptures: [
    { title: "Pourquoi Naître Esclave?", artist: "Jean-Baptiste Carpeaux" , image: "/Pourquoi_Naître_Esclave.jpeg"},
    { title: "La Sordidez", artist: "Antonio Berni", image: "/La_sordidez.jpeg"},
  ],
  Photographs: [
    { title: "Mother", artist: "Kathryn Cook", image: "/Mother.jpeg"},
    { title: "Back in Business", artist: "Sarah Terry", image: "/Back_in_Business.jpeg"},
  ],
  Prints: [
    {title: "The Psyche", artist: "Bernard Boutet de Monvel", image: "/The_Psyche.jpeg"},
    {title: "Tokugawa Shogun Viewing Watermelon Fight at Hama Palace", artist: "Tsukioka Yoshitoshi", image: "/Tokugawa_Shogun_Viewing_Watermelon_Fight_at_Hama_Palace.jpeg"}
  ],
  Ceramics: [
    {title: "Sainami Koki (Wave Incense Holder)", artist: "Miyashita Zenji", image: "/Sainami_Koki.jpeg"},
    {title: "Blue Vessel", artist: "Hiruma Kazuyo", image: "/Blue_Vessel.jpeg"}
  ]
};

const events = [
  { name: "Art & Wine Night", date: "March 10, 2025" },
  { name: "Sculpture Workshop", date: "March 15, 2025" },
  { name: "Photography Masterclass", date: "March 20, 2025" },
];

export default function ArtExhibits() {
  const [selectedCategory, setSelectedCategory] = useState("Paintings");

  return (
    <div className="pt-24 p-6">
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex gap-4 border-b pb-2 justify-center">
          {Object.keys(exhibits).map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(exhibits).map(([category, artworks]) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {artworks.map((art, index) => (
                <Card key={index} className="mb-6">
                  <CardContent className="p-4">
                    <img src={art.image} alt={art.title} className="w-full h-48 object-cover rounded-lg mt-6"/>
                    <h2 className="text-xl font-semibold">{art.title}</h2>
                    <p className="text-gray-600">by {art.artist}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
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
  );
}