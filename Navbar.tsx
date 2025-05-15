import { Link, useNavigate } from 'react-router-dom';
import { ChartBar, House, LogOut, Ticket, User } from 'lucide-react';
import { getCurrentUser, getUsers, setCurrentUser } from '../utils/storage';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  // Keep the current user in state
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUserState(user);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserState(null);
    setShowUserMenu(false);
    navigate('/');
  };

  const handleLogin = (userId: string) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setCurrentUserState(user);
      setShowUserMenu(false);
    }
  };

  const switchToAdmin = () => {
    const users = getUsers();
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser) {
      handleLogin(adminUser.id);
      navigate('/admin');
    }
  };

  const switchToUser = () => {
    const users = getUsers();
    const regularUser = users.find(u => u.role === 'user');
    if (regularUser) {
      handleLogin(regularUser.id);
      navigate('/');
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center">
              <Ticket className="h-6 w-6 text-blue-500" />
              <span className="ml-2 text-xl font-bold">TicketMaster</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-4 ml-6">
              <Link to="/" className="flex items-center text-gray-600 hover:text-blue-600">
                <House className="h-4 w-4 mr-1" />
                <span>Events</span>
              </Link>
              
              {currentUser && (
                <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-blue-600">
                  <User className="h-4 w-4 mr-1" />
                  <span>My Tickets</span>
                </Link>
              )}
              
              {currentUser?.role === 'admin' && (
                <Link to="/admin" className="flex items-center text-gray-600 hover:text-blue-600">
                  <ChartBar className="h-4 w-4 mr-1" />
                  <span>Analytics</span>
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            {currentUser ? (
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                  <span className="text-sm font-medium text-gray-700 hidden md:block">
                    {currentUser.name}
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      Signed in as <span className="font-medium">{currentUser.email}</span>
                    </div>
                    
                    <Link 
                      to="/dashboard" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Tickets
                    </Link>
                    
                    {currentUser.role === 'admin' ? (
                      <button 
                        onClick={switchToUser}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Switch to User View
                      </button>
                    ) : (
                      <button 
                        onClick={switchToAdmin}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Switch to Admin View
                      </button>
                    )}
                    
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t"
                    >
                      <div className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => {
                  const users = getUsers();
                  const user = users.find(u => u.role === 'user');
                  if (user) handleLogin(user.id);
                }}
                className="btn btn-primary"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
