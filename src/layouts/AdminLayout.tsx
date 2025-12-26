import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, LogOut, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AdminLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const isActive = (path: string) => {
        return location.pathname === path ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed h-full transition-colors duration-300">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                            Groovava Admin
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        to="/admin"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin')}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </Link>

                    <Link
                        to="/admin/events"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/events')}`}
                    >
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">Events</span>
                    </Link>

                    <Link
                        to="/admin/users"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/users')}`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Users</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <Link
                        to="/"
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Back to Home</span>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
