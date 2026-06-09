import App from "./App";

const C = {
  bg: "#0a0e27",
  border: "#1a2332",
  gold: "#d4af37",
  green: "#4ade80",
  text: "#e8eaed",
  muted: "#8b92a9",
};

export default function Router() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      {/* Content */}
      <div style={{ padding: "20px" }}>
        <App />
      </div>
    </div>
  );
}
