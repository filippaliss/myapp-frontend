const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : process.env.DATABASE_URL;

export default API_BASE;
