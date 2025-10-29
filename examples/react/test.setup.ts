const originalError = console.error;
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation((...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("An update to %s inside a test was not wrapped in act")
    ) {
      return;
    }
    return originalError.call(console, args);
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});
