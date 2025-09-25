const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : `mongodb+srv://${process.env.ATLAS_USERNAME}:${process.env.ATLAS_PASSWORD}@jsramverk.ax6ksux.mongodb.net/${process.env.ATLAS_DB}?retryWrites=true&w=majority`;;

export default API_BASE;
