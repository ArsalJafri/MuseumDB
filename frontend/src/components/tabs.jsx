import React from "react";

export function Tabs({ value, onValueChange, children }) {
  return (
    <div>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { value, onValueChange })
      )}
    </div>
  );
}

export function TabsList({ children }) {
  return <div className="flex gap-2 mb-4 border-b pb-2">{children}</div>;
}

export function TabsTrigger({ value, onValueChange, children }) {
  return (
    <button
      className="px-4 pt-24 rounded-md text-lg font-medium transition-colors hover:bg-gray-200"
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }) {
  return <div>{children}</div>;
}
