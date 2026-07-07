import { Home as HomeIcon, Users, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNearbyClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy-950/90 backdrop-blur-md border-t border-cyan-500/20 pb-safe-bottom">
      <div className="flex items-center justify-around h-16">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center min-w-touch min-h-touch flex-1 relative ${
            location.pathname === '/' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {location.pathname === '/' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-cyan-400 rounded-b-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          )}
          <HomeIcon className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Home</span>
        </button>

        <button
          onClick={handleNearbyClick}
          className={`flex flex-col items-center justify-center min-w-touch min-h-touch flex-1 relative text-slate-500 hover:text-slate-300`}
        >
          <Users className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Nearby</span>
        </button>

        <button
          onClick={() => navigate('/history')}
          className={`flex flex-col items-center justify-center min-w-touch min-h-touch flex-1 relative ${
            location.pathname === '/history' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {location.pathname === '/history' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-cyan-400 rounded-b-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          )}
          <Clock className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">History</span>
        </button>
      </div>
    </nav>
  );
}
