import { Routes, Route } from 'react-router-dom';
import TopBar from './components/TopBar';
import Home from './pages/Home';
import Transfer from './pages/Transfer';
import History from './pages/History';

export default function App() {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      <TopBar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transfer/:peerId" element={<Transfer />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </div>
  );
}
