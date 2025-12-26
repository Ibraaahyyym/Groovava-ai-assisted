import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Calendar, MapPin, Clock, Loader2, Search, Eye, CreditCard } from 'lucide-react';
import AuthModal from './components/AuthModal';
import EventModal from './components/EventModal';
import EventFormModal from './components/EventFormModal';
import ProfilePage from './pages/ProfilePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import BottomNavBar from './components/BottomNavBar';
import ThemeToggle from './components/ThemeToggle';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminUsers from './pages/admin/AdminUsers';

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  venue: string;
  date: string;
  time: string;
  organizer?: string;
  category: string;
  price?: string;
  image: string;
}

interface SelectedEventState {
  event: Event;
  mode: 'details' | 'buyTickets';
}
function HomePage({
  user,
  events,
  loading,
  searchQuery,
  setSearchQuery,
  selectedEvent,
  setSelectedEvent,
  showAuthModal,
  setShowAuthModal,
  showEventForm,
  setShowEventForm,
  authMode,
  setAuthMode,
  fetchEvents
}: {
  user: SupabaseUser | null;
  events: Event[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedEvent: SelectedEventState | null;
  setSelectedEvent: (eventState: SelectedEventState | null) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showEventForm: boolean;
  setShowEventForm: (show: boolean) => void;
  authMode: 'signin' | 'signup';
  setAuthMode: (mode: 'signin' | 'signup') => void;
  fetchEvents: () => void;
}) {
  // Filter events based on search query
  const filteredEvents = events.filter(event => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query) ||
      (event.organizer && event.organizer.toLowerCase().includes(query)) ||
      event.category.toLowerCase().includes(query) ||
      (event.location && event.location.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                Ticketsef
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <ThemeToggle />
                <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Events
                </Link>
                {user && (
                  <>
                    <button
                      onClick={() => setShowEventForm(true)}
                      className="text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Create Events
                    </button>
                    <Link to="/profile" className="text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      Profile
                    </Link>
                  </>
                )}
                {!user ? (
                  <>
                    <button
                      onClick={() => {
                        setAuthMode('signin');
                        setShowAuthModal(true);
                      }}
                      className="text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('signup');
                        setShowAuthModal(true);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-500 hover:to-purple-400 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0]}!
                    </span>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              Discover Amazing{' '}
              <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                Events
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto transition-colors duration-300">
              Connect with your community through unforgettable experiences. Find events that match your interests and create memories that last a lifetime.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events by title, location, venue, organizer..."
                  className="w-full px-5 py-3 pl-12 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {!user && (
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-500 hover:to-purple-400 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Join the Movement
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
            {searchQuery ? 'Search Results' : 'Upcoming Events'}
          </h2>
          {searchQuery && (
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
              Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden animate-pulse transition-colors duration-300">
                <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 && searchQuery ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
              <Search className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">No Events Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 transition-colors duration-300">
              No events match your search for "{searchQuery}". Try different keywords or browse all events.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                onClick={() => setSelectedEvent({ event, mode: 'details' })}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.image || 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800'}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-purple-600 text-white text-sm font-semibold rounded-full">
                      {event.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">{event.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 transition-colors duration-300">{event.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                      <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    {event.time && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                        <Clock className="w-4 h-4 mr-2 text-purple-400" />
                        {event.time}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                      <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                      {event.venue}
                    </div>
                    {event.price && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                        <span className="w-4 h-4 mr-2 text-purple-400">₦</span>
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
                                      <div>{firstTicket.type}: ₦{firstTicket.price}</div>
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

                {/* Action Buttons */}
                <div className="px-6 pb-6">
                  <div className="flex space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent({ event, mode: 'details' });
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent({ event, mode: 'buyTickets' });
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Buy Tickets
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {selectedEvent && (
        <EventModal
          event={selectedEvent.event}
          displayMode={selectedEvent.mode}
          isOpen={!!selectedEvent}
          user={user}
          onClose={() => setSelectedEvent(null)}
          onEventUpdated={fetchEvents}
        />
      )}

      {showEventForm && (
        <EventFormModal
          isOpen={showEventForm}
          onClose={() => setShowEventForm(false)}
          onEventSubmitted={() => {
            setShowEventForm(false);
            fetchEvents();
          }}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavBar
        user={user}
        setShowEventForm={setShowEventForm}
        setAuthMode={setAuthMode}
        setShowAuthModal={setShowAuthModal}
      />
    </div>
  );
}

function App() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<SelectedEventState | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('groovanna b')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-gray-900 dark:text-white text-lg transition-colors duration-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              user={user}
              events={events}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
              showAuthModal={showAuthModal}
              setShowAuthModal={setShowAuthModal}
              showEventForm={showEventForm}
              setShowEventForm={setShowEventForm}
              authMode={authMode}
              setAuthMode={setAuthMode}
              fetchEvents={fetchEvents}
            />
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <ProfilePage user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/payment-success"
          element={<PaymentSuccessPage />}
        />

        {/* Admin Routes */}
        <Route element={<AdminRoute user={user} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;