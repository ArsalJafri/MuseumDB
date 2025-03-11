import ArtPageTemplate from "./ArtPageTemplate";
const sculptures = [
    { title: "Pourquoi Naître Esclave?", artist: "Jean-Baptiste Carpeaux", image: "/Pourquoi_Naître_Esclave.jpeg"},
    { title: "La Sordidez", artist: "Antonio Berni", image: "/La_sordidez.jpeg"}
];
export default function Sculptures(){
    return <ArtPageTemplate category="Sculptures" artworks={sculptures}/>;
}