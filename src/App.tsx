import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import Loading from './components/Loading';
import Room from './components/Room';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/loading/:roomId" element={<Loading />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;