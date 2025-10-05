import React from "react";

export default function MyButton({ children, onClick, variant = "primary", style, ...rest }) {
  const baseStyle = {
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
  };
  const variants = {
    primary: { backgroundColor: "#0ea5a4", color: "white" },
    secondary: { backgroundColor: "#e5e7eb", color: "#111827" },
  };

  return (
    <button
      onClick={onClick}
      style={{ ...baseStyle, ...(variants[variant] || variants.primary), ...(style || {}) }}
      {...rest}
    >
      {children}
    </button>
  );
}
