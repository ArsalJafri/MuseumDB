import React from "react";

export function ArtworkCard({ title, artist, image }) {
    return (
        <div className="mb-6 border rounded-lg overflow-hidden shadow-lg">
            <img src={image} alt={title} className="w-full h-48 object-cover" />
            <div className="p-4">
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-gray-600">by {artist}</p>
            </div>
        </div>
    );
}
