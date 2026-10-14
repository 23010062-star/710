import { useState } from 'react';
import Header from './components/Header.jsx';
import Banner from './components/Banner.jsx';
import Content from './components/Content.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('books');

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <Banner />
      <Content activeTab={activeTab} />
      <Footer />
    </div>
  );
}
