import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Убрали Router из импорта
import Home from './pages/Home/Home';
import Catalog from './pages/Catalog/Catalog';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Auth/Profile'; 
import './App.css';
import CarDetails from './pages/Catalog/CarDetails';
import AddCar from './pages/Catalog/AddCar';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="profile" element={<Profile />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/car/:id" element={<CarDetails />} />
        <Route path="/add-car" element={<AddCar />} />
      </Routes>
    </div>
  );
}

export default App;