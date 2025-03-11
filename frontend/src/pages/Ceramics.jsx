import React from "react";
import ArtPageTemplate from "./ArtPageTemplate";
const ceramics = [
    { title: "Sainami Koki (Wave Incense Holder)", artist: "Miyashita Zenji", image: "/Sainami_Koki.jpeg"},
    { title: "Blue Vessel", artist: "Hiruma Kazuyo", image: "/Blue_Vessel.jpeg"}
];

export default function Ceramics(){
    return (
        <ArtPageTemplate category="Ceramics" artoworks={ceramics}/>
    );
}