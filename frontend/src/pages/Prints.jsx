import ArtPageTemplate from "./ArtPageTemplate";
const prints = [
    { title: "The Psyche", artist: "Bernard Boutet de Monvel", image: "/The_Psyche.jpeg"},
    { title: "Tokugawa Shogun Viewing Watermelon Fight at Hama Palace", artist: "Tsukioka Yoshitoshi", image: "/Tokugawa_Shogun_Viewing_Watermelon_Fight_at_Hama_Palace.jpeg"}
];
export default function Prints(){
    return <ArtPageTempalte category="Prints" artworks={prints}/>
}