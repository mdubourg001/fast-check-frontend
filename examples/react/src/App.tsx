import { useState } from "react";
import { ShoppingCart } from "./ShoppingCart";
import { TodoList } from "./TodoList";

export function App() {
  const [activeDemo, setActiveDemo] = useState<"todo" | "cart">("todo");

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Property-Based Testing Demos
      </h1>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "30px",
        }}
      >
        <button
          onClick={() => setActiveDemo("todo")}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: activeDemo === "todo" ? "#2196F3" : "#e0e0e0",
            color: activeDemo === "todo" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Todo List
        </button>
        <button
          onClick={() => setActiveDemo("cart")}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: activeDemo === "cart" ? "#2196F3" : "#e0e0e0",
            color: activeDemo === "cart" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Shopping Cart
        </button>
      </div>

      {activeDemo === "todo" ? <TodoList /> : <ShoppingCart />}
    </div>
  );
}
