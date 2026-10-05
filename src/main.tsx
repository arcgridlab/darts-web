// src/main.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HitRatePage from "./pages/hitRate/HitRatePage";

<BrowserRouter>
  <Routes>
    <Route path="/hit-rate" element={<HitRatePage />} />
  </Routes>
</BrowserRouter>