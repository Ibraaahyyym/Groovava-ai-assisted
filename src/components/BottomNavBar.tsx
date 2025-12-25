import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, User, LogIn, UserPlus } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface BottomNavBarProps {
  user: SupabaseUser | null;
  setShowEventForm: (show: boolean) => void;
  setAuthMode: (mode: 'signin' | 'signup') => void;
  setShowAuthModal: (show: boolean) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  user,
  setShowEventForm,
  setAuthMode,
  setShowAuthModal
}) => {
  const location = useLocation();

  const NavItem: React.FC<{
    children: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
  }> = ({ children, isActive = false, onClick }) => (
    <div
      className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer ${
        isActive
          ? 'bg-purple-600/20 text-purple-400 scale-105'
          : 'text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-300 hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:scale-105'
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  );

  const IconWithLabel: React.FC<{
    icon: React.ReactNode;
    label: string;
  }> = ({ icon, label }) => (
    <>
      <div className="mb-1 transform transition-transform duration-200">
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700/50 shadow-2xl transition-colors duration-300">
      <div className="flex justify-around items-center h-20 px-4 max-w-md mx-auto">
        {/* Events */}
        <Link to="/" className="flex-1 flex justify-center">
          <NavItem isActive={location.pathname === '/'}>
            <IconWithLabel
              icon={<Home className="w-6 h-6" />}
              label="Events"
            />
          </NavItem>
        </Link>

        {user ? (
          <>
            {/* Create Events */}
            <div className="flex-1 flex justify-center">
              <NavItem
                onClick={() => setShowEventForm(true)}
              >
                <IconWithLabel
                  icon={<PlusCircle className="w-6 h-6" />}
                  label="Create"
                />
              </NavItem>
            </div>

            {/* Profile */}
            <Link to="/profile" className="flex-1 flex justify-center">
              <NavItem isActive={location.pathname === '/profile'}>
                <IconWithLabel
                  icon={<User className="w-6 h-6" />}
                  label="Profile"
                />
              </NavItem>
            </Link>
          </>
        ) : (
          <>
            {/* Sign In */}
            <div className="flex-1 flex justify-center">
              <NavItem
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
              >
                <IconWithLabel
                  icon={<LogIn className="w-5 h-5" />}
                  label="Sign In"
                />
              </NavItem>
            </div>

            {/* Sign Up */}
            <div className="flex-1 flex justify-center">
              <NavItem
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
              >
                <IconWithLabel
                  icon={<UserPlus className="w-5 h-5" />}
                  label="Sign Up"
                />
              </NavItem>
            </div>
          </>
        )}
      </div>

      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 dark:via-purple-500/50 to-transparent"></div>
    </div>
  );
};

export default BottomNavBar;