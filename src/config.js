const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://jsramverk-editor-lisd22.azurewebsites.net";

export default API_BASE;
