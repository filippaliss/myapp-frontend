import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Doc from "./pages/Doc";
import Layout from "./components/Layout";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<Doc />} />
          <Route path="/doc/:id" element={<Doc />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
