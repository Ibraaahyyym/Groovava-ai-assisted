import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Mail, Calendar, Search, AlertCircle, Loader2 } from 'lucide-react';

// Since we can't easily list all users due to Supabase auth security,
// we will display users who have interacted with the system (e.g. creators or attendees)
// or just show a message about limitations if the user data isn't public.

interface UserProfile {
    id: string; // This might be creator_id or user_id
    email?: string;
    full_name?: string;
    role?: string;
    last_seen?: string;
}

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Strategy: Fetch unique creator_ids from events table
                // This gives us at least the organizers.
                // Sadly, we can't get their emails unless we have a 'profiles' table.
                // We'll check if we can query the 'users' table (usually not allowed).

                // Try to see if there is a way to get some user info.
                // For this demo, we'll try to fetch unique organizers from the events table
                // and unique attendees from attendees table.

                const { data: events } = await supabase
                    .from('groovanna b')
                    .select('organizer, creator_id, created_at');

                const { data: attendees } = await supabase
                    .from('attendees')
                    .select('user_id, created_at'); // user_id might be linked to a profile?

                // Since we don't have a public profiles table in the snippet provided, 
                // we will construct a "Detected Users" list based on activity.
                // Real user management would require a backend function or a public profiles table.

                const uniqueUsers = new Map<string, UserProfile>();

                if (events) {
                    events.forEach(e => {
                        if (e.creator_id && !uniqueUsers.has(e.creator_id)) {
                            uniqueUsers.set(e.creator_id, {
                                id: e.creator_id,
                                full_name: e.organizer || 'Unknown Organizer',
                                role: 'Organizer',
                                last_seen: e.created_at
                            });
                        }
                    });
                }

                if (attendees) {
                    attendees.forEach(a => {
                        if (a.user_id && !uniqueUsers.has(a.user_id)) {
                            uniqueUsers.set(a.user_id, {
                                id: a.user_id,
                                full_name: 'Attendee', // We don't have their name
                                role: 'User',
                                last_seen: a.created_at
                            });
                        }
                    });
                }

                setUsers(Array.from(uniqueUsers.values()));

            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Displaying active users based on events and bookings.
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none w-full md:w-64"
                    />
                </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">Privacy Notice</h4>
                        <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                            Due to privacy settings, only users who have participated in events (created or attended) are listed here.
                            Full user database access requires super-admin privileges.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Active</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No active users found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-medium text-sm mr-3">
                                                        {user.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{user.id.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'Organizer'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {user.last_seen ? new Date(user.last_seen).toLocaleDateString() : 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center">
                                                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                                                    Active
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
