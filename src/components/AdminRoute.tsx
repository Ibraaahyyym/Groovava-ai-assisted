import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
    user: User | null;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ user }) => {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            // Check for 'admin' role in user_metadata
            const isRoleAdmin = user.user_metadata?.role === 'admin';

            // Fallback: Check whitelist of emails (for MVP/Development)
            const adminEmails = ['admin@groovava.com', 'ibrahim@groovava.com'];
            const isEmailAdmin = user.email && adminEmails.includes(user.email);

            setIsAdmin(isRoleAdmin || !!isEmailAdmin);
            setLoading(false);
        };

        checkAdminStatus();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
