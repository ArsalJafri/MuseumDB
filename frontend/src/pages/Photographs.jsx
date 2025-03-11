import ArtPageTemplate from "./ArtPageTemplate";
const photographs = [
    { title: "Mother", artist: "Kathryn Cook", image: "/Mother.jpeg"},
    { title: "Back in Business", artist: "Sarah Terry", image: "/Back_in_Business.jpeg"}
];
export default function Photographs(){
    return <ArtPageTemplate category="Photographs" artworks={photographs}/>;
}