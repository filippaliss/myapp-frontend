const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : "jsramverk-editor-lisd22.azurewebsites.net";

export default API_BASE;
