import React, { useState } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import SchemesPage from './pages/SchemesPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const [activePage, setActivePage] = useState('home');

  const pages = {
    home: <HomePage />,
    search: <SearchPage />,
    schemes: <SchemesPage />,
    profile: <ProfilePage />,
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-cream relative">
      <Header />
      <main>
        {pages[activePage]}
      </main>
      <BottomNav active={activePage} onChange={setActivePage} />
    </div>
  );
}
