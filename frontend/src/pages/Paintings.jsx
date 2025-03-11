import React from "react";
import ArtPageTemplate from "./ArtPageTemplate";

const paintings = [
    { title: "Butterfly Collection", artist: "Janet Fish", image: "/Butterfly_Collection.jpeg" },
    { title: "Autumn Equinox Moon", artist: "Hayley Barker", image: "/Autumn_Equinox_Moon.jpeg" },
];

export default function Paintings() {
    return <ArtPageTemplate category="Paintings" artworks={paintings} />;
}
