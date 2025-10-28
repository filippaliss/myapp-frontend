import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Doc from "./pages/Doc";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  return (
    <HashRouter basename="/myapp-frontend">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/new" element={<Doc />} />
          <Route path="/doc/:id" element={<Doc />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
