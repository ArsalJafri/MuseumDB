import { NavLink } from "react-router-dom";

const categories = ["Paintings", "Sculptures", "Photographs", "Prints", "Ceramics"];

export default function NavigationTabs() {
  return (
    <nav className="flex gap-4 border-b pb-2 justify-center">
      {categories.map((category) => (
        <NavLink
          key={category}
          to={`/exhibitions/${category.toLowerCase()}`}
          className={({ isActive }) =>
            `px-4 py-2 ${isActive ? "text-blue-600 font-bold" : "text-gray-600"}`
          }
        >
          {category}
        </NavLink>
      ))}
    </nav>
  );
}
