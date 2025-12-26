import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Users, DollarSign, TrendingUp, Loader2 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalUsers: 0, // Note: We might not get this easily with RLS
        loading: true
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch events count
                const { count: eventsCount, error: eventsError } = await supabase
                    .from('groovanna b')
                    .select('*', { count: 'exact', head: true });

                if (eventsError) throw eventsError;

                // Fetch attendees/users count (using attendees table as proxy for active users if we can't access auth.users)
                // Or if we have a public profiles table.
                // For now, let's just count unique attendees as "Active Users" visible to us.
                // But better yet, let's try to count rows in 'attendees' for "Total Bookings"
                const { count: bookingsCount, error: bookingsError } = await supabase
                    .from('attendees')
                    .select('*', { count: 'exact', head: true });

                if (bookingsError) throw bookingsError;

                setStats({
                    totalEvents: eventsCount || 0,
                    totalUsers: bookingsCount || 0, // Labeling this as "Total Bookings" in UI for accuracy
                    loading: false
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchStats();
    }, []);

    if (stats.loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Events */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Events</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalEvents}</p>
                </div>

                {/* Total Bookings */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Bookings</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalUsers}</p>
                </div>

                {/* Placeholder: Revenue */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Revenue</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₦0.00</p>
                    <span className="text-xs text-gray-500 mt-2 block">(Coming Soon)</span>
                </div>

                {/* Placeholder: Growth */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Growth</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">+0%</p>
                    <span className="text-xs text-gray-500 mt-2 block">Since last month</span>
                </div>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                    No recent activity to display.
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
