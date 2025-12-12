import React, { useState, useEffect } from 'react';
import { User, Calendar, Music, MapPin, Clock, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import EventFormModal from '../components/EventFormModal';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  organizer: string;
  description: string;
  category: string;
  price: string;
  image: string;
  creator_id: string;
}

interface ProfilePageProps {
  user: SupabaseUser;
}

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  return (
    <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-32 h-32 overflow-hidden">
          <img
            src={event.image || 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
              {event.category}
            </span>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">{event.title}</h3>
          <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-2 text-purple-400" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-2 text-purple-400" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-2 text-purple-400" />
              <span>{event.venue}</span>
            </div>
            {event.price && (
              <div className="flex items-center">
                <span className="w-3 h-3 mr-2 text-purple-400">₦</span>
                <div className="flex flex-col">
                  {(() => {
                    if (!event.price) return "Free";
                    
                    try {
                      const tickets = JSON.parse(event.price);
                      if (Array.isArray(tickets) && tickets.length > 0) {
                        const validTickets = tickets.filter(t => t.type && t.price);
                        if (validTickets.length === 0) return "Free";
                        
                        if (validTickets.length === 1) {
                          return `${validTickets[0].type}: ₦${validTickets[0].price}`;
                        } else {
                          const firstTicket = validTickets[0];
                          const remainingCount = validTickets.length - 1;
                          return (
                            <div>
                              <div className="text-sm">{firstTicket.type}: ₦{firstTicket.price}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-500">+{remainingCount} more type{remainingCount > 1 ? 's' : ''}</div>
                            </div>
                          );
                        }
                      }
                      return "Free";
                    } catch {
                      return event.price.replace(/\$/g, '₦');
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'created' | 'attending'>('created');
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);

  // Fetch user's created events
  const fetchCreatedEvents = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to view your events');
      }

      // Fetch only events created by the current user
      const { data, error } = await supabase
        .from('groovanna b')
        .select('*')
        .eq('creator_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      
      setCreatedEvents(data || []);
    } catch (err) {
      console.error('Error fetching created events:', err);
      setError('Failed to fetch created events');
      // If there's an auth error, set empty array to avoid showing all events
      setCreatedEvents([]);
    }
  };

  // Fetch user's attending events
  const fetchAttendingEvents = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to view your attending events');
      }

      // Fetch events the user is attending by joining attendees and events tables
      const { data, error } = await supabase
        .from('attendees')
        .select(`
          event_id,
          "groovanna b" (
            id,
            title,
            date,
            time,
            venue,
            location,
            organizer,
            description,
            category,
            price,
            image,
            creator_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match the Event interface
      const events = data?.map(item => ({
        id: item['groovanna b'].id,
        title: item['groovanna b'].title,
        date: item['groovanna b'].date,
        time: item['groovanna b'].time,
        venue: item['groovanna b'].venue,
        location: item['groovanna b'].location,
        organizer: item['groovanna b'].organizer,
        description: item['groovanna b'].description,
        category: item['groovanna b'].category,
        price: item['groovanna b'].price,
        image: item['groovanna b'].image,
        creator_id: item['groovanna b'].creator_id
      })) || [];
      
      setAttendingEvents(events);
    } catch (err) {
      console.error('Error fetching attending events:', err);
      setError('Failed to fetch attending events');
      // If there's an error, set empty array to avoid showing incorrect data
      setAttendingEvents([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchCreatedEvents(),
        fetchAttendingEvents()
      ]);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Handle event form submission
  const handleEventSubmitted = () => {
    setShowEventForm(false);
    // Refresh the created events list
    fetchCreatedEvents();
  };

  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const userEmail = user.email || '';
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentEvents = activeTab === 'created' ? createdEvents : attendingEvents;

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 pt-20 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Home Link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Link>

        {/* User Profile Header */}
        <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-8 mb-8 transition-colors duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">{userDisplayName}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-1 transition-colors duration-300">{userEmail}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">Member since {joinDate}</p>
            </div>

            {/* Stats */}
            <div className="flex space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{createdEvents.length}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">Created Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{attendingEvents.length}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">Attending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden transition-colors duration-300">
          <div className="flex border-b border-gray-200 dark:border-gray-700/50">
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-200 ${
                activeTab === 'created'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50'
              }`}
            >
              <Music className="w-5 h-5 inline mr-2" />
              Created Events ({createdEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('attending')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-200 ${
                activeTab === 'attending'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Attending Events ({attendingEvents.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mr-3" />
                <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300">Loading events...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 text-lg mb-2">Error loading events</p>
                <p className="text-gray-600 dark:text-gray-500 text-sm transition-colors duration-300">{error}</p>
              </div>
            ) : currentEvents.length > 0 ? (
              <div className="space-y-4">
                {currentEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                  {activeTab === 'created' ? (
                    <Music className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Calendar className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  {activeTab === 'created' ? 'No Events Created Yet' : 'No Events Attended Yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-300">
                  {activeTab === 'created' 
                    ? 'Start creating amazing music events for your community!'
                    : 'Discover and attend exciting music events near you!'
                  }
                </p>
                {activeTab === 'created' && (
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
                  >
                    <Music className="w-5 h-5 mr-2" />
                    Create Your First Event
                  </button>
                )}
                {activeTab === 'attending' && (
                  <Link
                    to="/"
                    className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Browse Events
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={showEventForm}
        onClose={() => setShowEventForm(false)}
        onEventSubmitted={handleEventSubmitted}
      />
    </div>
  );
};

export default ProfilePage;