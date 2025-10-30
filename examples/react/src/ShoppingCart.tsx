import { useState, useCallback } from "react";

/**
 * ShoppingCart Component
 *
 * This component has a subtle but realistic bug:
 * When users click "Add to Cart" multiple times quickly, or when they
 * change quantity rapidly, the total can become incorrect due to a race
 * condition in the state update.
 *
 * The bug happens because we're reading state values directly in event handlers
 * instead of using the functional update pattern. This is a VERY common mistake
 * in React applications.
 *
 * Try to find it with property-based testing!
 */

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

const PRODUCTS: Product[] = [
  { id: "1", name: "Laptop", price: 999.99, stock: 5 },
  { id: "2", name: "Mouse", price: 29.99, stock: 10 },
  { id: "3", name: "Keyboard", price: 79.99, stock: 8 },
  { id: "4", name: "Monitor", price: 299.99, stock: 3 },
];

export function ShoppingCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate total (this is correct)
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // BUG: This handler has a race condition when called rapidly
  // It reads 'cart' directly instead of using functional update
  const addToCart = useCallback(
    (productId: string) => {
      const product = PRODUCTS.find((p) => p.id === productId);
      if (!product) return;

      const existingItem = cart.find((item) => item.id === productId);

      if (existingItem) {
        // BUG HERE: Reading 'cart' directly causes stale closure
        setCart(
          cart.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        // BUG HERE TOO: Reading 'cart' directly
        setCart([
          ...cart,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
          },
        ]);
      }
    },
    [cart]
  ); // This dependency makes it "work" most of the time, masking the bug

  // This handler has a similar bug
  const updateQuantity = (itemId: string, delta: number) => {
    // BUG: Not using functional update pattern
    const newCart = cart
      .map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    setCart(newCart);
  };

  // This one is implemented correctly for comparison
  const removeFromCart = (itemId: string) => {
    // CORRECT: Using functional update pattern
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  // Simulate checkout with artificial delay
  const checkout = async () => {
    setIsProcessing(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Clear cart after checkout
    setCart([]);
    setIsProcessing(false);
    alert("Order placed successfully!");
  };

  // Get stock remaining for a product
  const getStockRemaining = (productId: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    const inCart = cart.find((item) => item.id === productId);
    return product ? product.stock - (inCart?.quantity || 0) : 0;
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>Shopping Cart Example</h1>

      {/* Products Section */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Products</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "15px",
          }}
        >
          {PRODUCTS.map((product) => {
            const stockRemaining = getStockRemaining(product.id);
            const isOutOfStock = stockRemaining <= 0;

            return (
              <div
                key={product.id}
                style={{
                  border: "1px solid #ddd",
                  padding: "15px",
                  borderRadius: "8px",
                  opacity: isOutOfStock ? 0.6 : 1,
                }}
              >
                <h3 style={{ margin: "0 0 10px 0" }}>{product.name}</h3>
                <p style={{ margin: "5px 0", fontWeight: "bold" }}>
                  ${product.price.toFixed(2)}
                </p>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "14px",
                    color: isOutOfStock ? "red" : "green",
                  }}
                >
                  {isOutOfStock ? "Out of stock" : `${stockRemaining} in stock`}
                </p>
                <button
                  onClick={() => addToCart(product.id)}
                  disabled={isOutOfStock || isProcessing}
                  data-testid={`add-${product.id}`}
                  style={{
                    width: "100%",
                    padding: "8px",
                    backgroundColor: isOutOfStock ? "#ccc" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isOutOfStock ? "not-allowed" : "pointer",
                  }}
                >
                  Add to Cart
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Section */}
      <div style={{ borderTop: "2px solid #ddd", paddingTop: "20px" }}>
        <h2>
          Cart (
          <span data-testid="cart-quantity">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>{" "}
          items)
        </h2>

        {cart.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <>
            <div style={{ marginBottom: "20px" }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  data-testid={`cart-item-${item.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <strong>{item.name}</strong>
                    <div>${item.price.toFixed(2)} each</div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={isProcessing}
                      data-testid={`decrease-${item.id}`}
                      style={{
                        width: "30px",
                        height: "30px",
                        border: "1px solid #ddd",
                        background: "white",
                        cursor: "pointer",
                        borderRadius: "4px",
                      }}
                    >
                      -
                    </button>

                    <span
                      data-testid={`quantity-${item.id}`}
                      style={{ minWidth: "30px", textAlign: "center" }}
                    >
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={isProcessing || getStockRemaining(item.id) <= 0}
                      data-testid={`increase-${item.id}`}
                      style={{
                        width: "30px",
                        height: "30px",
                        border: "1px solid #ddd",
                        background: "white",
                        cursor: "pointer",
                        borderRadius: "4px",
                      }}
                    >
                      +
                    </button>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      disabled={isProcessing}
                      data-testid={`remove-${item.id}`}
                      style={{
                        marginLeft: "10px",
                        padding: "5px 10px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  <div
                    style={{
                      marginLeft: "20px",
                      minWidth: "80px",
                      textAlign: "right",
                    }}
                  >
                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Total and Checkout */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  Total:{" "}
                  <span data-testid="cart-total">${total.toFixed(2)}</span>
                </h3>
              </div>

              <button
                onClick={checkout}
                disabled={cart.length === 0 || isProcessing}
                data-testid="checkout"
                style={{
                  padding: "12px 30px",
                  backgroundColor: cart.length === 0 ? "#ccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: cart.length === 0 ? "not-allowed" : "pointer",
                  fontSize: "16px",
                }}
              >
                {isProcessing ? "Processing..." : "Checkout"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Debug Info (hidden in production) */}
      <details
        style={{
          marginTop: "40px",
          padding: "10px",
          backgroundColor: "#f0f0f0",
        }}
      >
        <summary>Debug Info</summary>
        <pre>{JSON.stringify(cart, null, 2)}</pre>
      </details>
    </div>
  );
}
