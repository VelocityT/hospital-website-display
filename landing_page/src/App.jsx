import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import ReactLenis from "lenis/react";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import Modules from "./pages/Modules";
import FeaturesSection  from "./pages/Orbit";
import HospitalDemo from "./pages/Demo";

const App = () => {
  return (
    <Router>
      <ReactLenis root>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<HospitalDemo />} />
          <Route path="/modules/:moduleName" element={<Modules />} />
        </Routes>
        <Footer />
      </ReactLenis>
    </Router>
  );
};

export default App;
