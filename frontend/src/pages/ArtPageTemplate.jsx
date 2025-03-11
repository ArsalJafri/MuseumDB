import NavigationTabs from "../components/NavigationTabs";
import { ArtworkCard } from "../components/ArtworkCard";
import React from "react";

export default function ArtPageTemplate({category, artworks}){
    return(
        <div className="pt-24 p-6">
            <NavigationTabs />
            <h1 className="text-2xl font-bold my-4">{category}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artworks && artworks.length > 0 ? (
    artworks.map((art, index) => (
        <ArtworkCard key={index} {...art} />
    ))
) : (
    <p className="text-gray-500">No artworks available.</p>
)}
            </div>
        </div>
    );
}