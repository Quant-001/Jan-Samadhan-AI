import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import MaterialDetail from "./pages/MaterialDetail";

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/materials/:id" element={<MaterialDetail />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-slate-400 py-6">
        Built with React, Tailwind, Django REST Framework & Docker.
      </footer>
    </div>
  );
}
