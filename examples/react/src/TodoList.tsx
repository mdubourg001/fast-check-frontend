import { useState } from "react";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

type FilterType = "all" | "active" | "completed";

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const addTodo = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        text: trimmed,
        completed: false,
      };
      setTodos([...todos, newTodo]);
      setInputValue("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter((todo) => !todo.completed));
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const activeCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.filter((todo) => todo.completed).length;

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "system-ui, sans-serif",
      }}
      data-testid="todo-container"
    >
      <h1>Todo List</h1>

      {/* Add Todo Section */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "8px" }}>
        <input
          type="text"
          data-testid="todo-input"
          aria-label="New todo"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTodo();
            }
          }}
          placeholder="What needs to be done?"
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "16px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        />
        <button
          data-testid="add-todo-button"
          onClick={addTodo}
          style={{
            padding: "8px 16px",
            fontSize: "16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{ marginBottom: "20px", display: "flex", gap: "8px" }}
        role="tablist"
        aria-label="Todo filters"
      >
        <button
          data-testid="filter-all"
          role="tab"
          aria-selected={filter === "all"}
          onClick={() => setFilter("all")}
          style={{
            padding: "6px 12px",
            border: "1px solid #ddd",
            backgroundColor: filter === "all" ? "#2196F3" : "white",
            color: filter === "all" ? "white" : "black",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          All
        </button>
        <button
          data-testid="filter-active"
          role="tab"
          aria-selected={filter === "active"}
          onClick={() => setFilter("active")}
          style={{
            padding: "6px 12px",
            border: "1px solid #ddd",
            backgroundColor: filter === "active" ? "#2196F3" : "white",
            color: filter === "active" ? "white" : "black",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Active
        </button>
        <button
          data-testid="filter-completed"
          role="tab"
          aria-selected={filter === "completed"}
          onClick={() => setFilter("completed")}
          style={{
            padding: "6px 12px",
            border: "1px solid #ddd",
            backgroundColor: filter === "completed" ? "#2196F3" : "white",
            color: filter === "completed" ? "white" : "black",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Completed
        </button>
      </div>

      {/* Counter */}
      <div
        data-testid="todo-counter"
        data-total={todos.length}
        data-active={activeCount}
        data-completed={completedCount}
        style={{
          marginBottom: "20px",
          padding: "12px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <strong>Total:</strong> {todos.length} | <strong>Active:</strong>{" "}
        {activeCount} | <strong>Completed:</strong> {completedCount}
      </div>

      {/* Todo List */}
      {filteredTodos.length === 0 ? (
        <div
          data-testid="empty-state"
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#999",
            fontStyle: "italic",
          }}
        >
          {todos.length === 0
            ? "No todos yet. Add one above!"
            : filter === "active"
              ? "No active todos"
              : "No completed todos"}
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
          data-testid="todo-list"
        >
          {filteredTodos.map((todo) => (
            <li
              key={todo.id}
              data-testid={`todo-item-${todo.id}`}
              data-completed={todo.completed}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                marginBottom: "8px",
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <input
                type="checkbox"
                data-testid={`todo-checkbox-${todo.id}`}
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                aria-label={`Mark "${todo.text}" as ${todo.completed ? "incomplete" : "complete"}`}
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  flex: 1,
                  textDecoration: todo.completed ? "line-through" : "none",
                  color: todo.completed ? "#999" : "black",
                }}
              >
                {todo.text}
              </span>
              <button
                data-testid={`todo-delete-${todo.id}`}
                onClick={() => deleteTodo(todo.id)}
                aria-label={`Delete "${todo.text}"`}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Clear Completed Button */}
      {completedCount > 0 && (
        <button
          data-testid="clear-completed"
          onClick={clearCompleted}
          style={{
            marginTop: "20px",
            padding: "8px 16px",
            backgroundColor: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Clear Completed ({completedCount})
        </button>
      )}
    </div>
  );
}
