import React, { useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, Music, Tag, Loader2, UserPlus, ShoppingCart, Sparkles, CreditCard, AlertCircle } from 'lucide-react';
import EventFormModal from './EventFormModal';
import { supabase } from '../lib/supabase';
// import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  venue: string;
  date: string;
  time: string;
  category: string;
  image: string;
  organizer?: string;
  price?: string;
  creator_id?: string;
}

interface EventModalProps {
  event: Event | null;
  displayMode: 'details' | 'buyTickets';
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated?: () => void;
  user: SupabaseUser | null;
}

const EventModal: React.FC<EventModalProps> = ({ event, displayMode, isOpen, onClose, onEventUpdated, user }) => {
  const [isEditFormOpen, setIsEditFormOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isAttending, setIsAttending] = React.useState(false);
  const [checkingAttendance, setCheckingAttendance] = React.useState(false);
  const [userIsAttending, setUserIsAttending] = React.useState(false);
  const [buyingTickets, setBuyingTickets] = React.useState<{ [key: string]: boolean }>({});
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  // Check if user is attending this event
  const checkUserAttendance = async () => {
    if (!user || !event) return;

    setCheckingAttendance(true);
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', event.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking attendance:', error);
        setUserIsAttending(false);
        return;
      }

      setUserIsAttending(!!data);
    } catch (error) {
      console.error('Error checking attendance:', error);
      setUserIsAttending(false);
    } finally {
      setCheckingAttendance(false);
    }
  };

  // Check attendance when modal opens or user/event changes
  useEffect(() => {
    if (isOpen && user && event) {
      checkUserAttendance();
    } else {
      setUserIsAttending(false);
      setCheckingAttendance(false);
    }
  }, [isOpen, user, event]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle edit form submission
  const handleEditSubmitted = () => {
    setIsEditFormOpen(false);
    onClose();
    if (onEventUpdated) {
      onEventUpdated();
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!event) return;

    console.log('Delete button clicked for event:', event);
    console.log('Event ID to delete:', event.id);
    console.log('Event title:', event.title);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"? This action cannot be undone.`
    );

    if (!confirmed) {
      console.log('User cancelled deletion');
      return;
    }

    console.log('User confirmed deletion, proceeding...');

    setIsDeleting(true);

    try {
      console.log('Attempting to delete event from Supabase...');
      console.log('Table: events');
      console.log('Filter: id =', event.id);

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      console.log('Supabase delete response:', { error });

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete event: ${error.message}`);
      }

      console.log('Event deleted successfully from Supabase');

      // Success - close modal and refresh event list
      console.log('Closing modal and refreshing event list...');
      onClose();
      if (onEventUpdated) {
        console.log('Calling onEventUpdated callback');
        onEventUpdated();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      console.error('Full error object:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete event');
    } finally {
      console.log('Setting isDeleting to false');
      setIsDeleting(false);
    }
  };

  // Handle attend event
  const handleAttendEvent = async () => {
    if (!event || !user) return;

    setIsAttending(true);

    try {
      if (userIsAttending) {
        // Remove attendance
        const { error } = await supabase
          .from('attendees')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', event.id);

        if (error) throw error;

        setUserIsAttending(false);
      } else {
        // Add attendance
        const { error } = await supabase
          .from('attendees')
          .insert([{
            user_id: user.id,
            event_id: event.id
          }]);

        if (error) throw error;

        setUserIsAttending(true);
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      if (error.code === 'PGRST205') {
        alert('Attendees feature is not yet available. Please contact support.');
        return;
      }

      alert(`Failed to ${userIsAttending ? 'cancel attendance for' : 'register for'} event. Please try again.`);
    } finally {
      setIsAttending(false);
    }
  };

  // Handle buy ticket action
  const handleBuyTicket = async (ticketType: string, price: string) => {
    if (!user) {
      alert('Please sign in to purchase tickets');
      return;
    }

    if (!event) return;

    const ticketKey = `${ticketType}-${price}`;
    setBuyingTickets(prev => ({ ...prev, [ticketKey]: true }));
    setPaymentError(null);

    try {
      // Convert price to kobo (Paystack uses kobo as the smallest unit)
      const amountInKobo = parseInt(price) * 100;

      // Generate unique reference for this transaction
      const reference = `groovava-${event.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Prepare payment data
      const paymentData = {
        amount: amountInKobo,
        email: user.email,
        reference: reference,
        callback_url: `${window.location.origin}/payment-success`,
        metadata: {
          event_id: event.id,
          ticket_type: ticketType,
          user_id: user.id,
          event_title: event.title,
          event_date: event.date
        }
      };

      console.log('Initiating payment for:', {
        ticketType,
        price: `₦${price}`,
        amountInKobo,
        reference
      });

      // Call Supabase Edge Function to initialize payment
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-initiate-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment initialization failed');
      }

      if (result.success && result.authorization_url) {
        console.log('Payment initialized successfully, redirecting to:', result.authorization_url);
        // Redirect user to Paystack payment page
        window.location.href = result.authorization_url;
      } else {
        throw new Error('Invalid response from payment service');
      }

    } catch (error) {
      console.error('Payment initialization error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment initialization failed');
    } finally {
      setBuyingTickets(prev => ({ ...prev, [ticketKey]: false }));
    }
  };

  // Parse ticket types from price string
  const getTicketTypes = () => {
    if (!event?.price) return [];

    try {
      const tickets = JSON.parse(event.price);
      if (Array.isArray(tickets)) {
        return tickets.filter(ticket => ticket.type && ticket.price);
      }
      return [];
    } catch {
      // If parsing fails, treat as simple string
      return [{ type: 'General', price: event.price.replace(/[₦$]/g, '') }];
    }
  };

  if (!isOpen || !event) return null;

  const ticketTypes = getTicketTypes();

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 flex flex-col transition-colors duration-300">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-gray-200/80 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full transition-all duration-200"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>

          {displayMode === 'buyTickets' ? (
            /* Buy Tickets View */
            <div className="flex flex-col flex-1 overflow-y-auto">
              {/* Event Image with Overlay */}
              <div className="relative w-full h-80">
                <img
                  src={event.image || 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    <span className="px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded-full">
                      {event.category}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2 animate-in slide-in-from-bottom-4 duration-500">
                    {event.title}
                  </h2>
                  <p className="text-gray-100 dark:text-gray-200 text-lg leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-200 transition-colors duration-300">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Ticket Selection */}
              <div className="flex-1 p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center animate-in fade-in duration-500 delay-300">
                    <ShoppingCart className="w-7 h-7 mr-3 text-purple-400" />
                    Choose Your Ticket
                  </h3>
                  <p className="text-gray-300 dark:text-gray-400 animate-in fade-in duration-700 delay-500 transition-colors duration-300">
                    Select the perfect ticket type for your experience
                  </p>
                </div>

                {ticketTypes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ticketTypes.map((ticket, index) => {
                      const ticketKey = `${ticket.type}-${ticket.price}`;
                      const isLoading = buyingTickets[ticketKey] || false;

                      return (
                        <div
                          key={index}
                          className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 transform hover:scale-105 animate-in fade-in-up duration-500"
                          style={{ animationDelay: `${(index + 1) * 150}ms` }}
                        >
                          <div className="text-center">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                              {ticket.type}
                            </h4>
                            <div className="mb-6">
                              <span className="text-3xl font-bold text-purple-400">₦{ticket.price}</span>
                            </div>
                            <button
                              onClick={() => handleBuyTicket(ticket.type, ticket.price)}
                              disabled={isLoading}
                              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-5 h-5 mr-2" />
                                  Buy Now
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 animate-in fade-in duration-500 delay-300">
                    <div className="w-16 h-16 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Free Event!</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-300">This event is completely free to attend</p>
                    <button
                      onClick={() => handleAttendEvent()}
                      className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-400 dark:from-green-600 dark:to-green-500 hover:from-green-400 hover:to-green-300 dark:hover:from-green-500 dark:hover:to-green-400 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center mx-auto"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      {isAttending ? 'Registering...' : 'Register for Free'}
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Error Message */}
              {paymentError && (
                <div className="mx-8 mb-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg animate-in fade-in duration-300 transition-colors duration-300">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-800 dark:text-red-300 font-semibold mb-1 transition-colors duration-300">Payment Error</h4>
                      <p className="text-red-700 dark:text-red-200 text-sm transition-colors duration-300">{paymentError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Details View */
            <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto">
              {/* Event Image */}
              <div className="relative w-full lg:w-1/2 h-64 lg:h-auto">
                <img
                  src={event.image || 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-purple-600 text-white text-sm font-semibold rounded-full">
                    {event.category}
                  </span>
                </div>
              </div>

              {/* Event Details */}
              <div className="flex-1 p-6 lg:p-8">
                <div className="space-y-6">
                  {/* Title and Description */}
                  <div>
                    <h2 id="modal-title" className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
                      {event.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed transition-colors duration-300">
                      {event.description}
                    </p>
                  </div>

                  {/* Event Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date & Time */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-semibold mb-1 transition-colors duration-300">Date</h3>
                          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">{event.date}</p>
                        </div>
                      </div>

                      {event.time && (
                        <div className="flex items-start space-x-3">
                          <Clock className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                          <div>
                            <h3 className="text-gray-900 dark:text-white font-semibold mb-1 transition-colors duration-300">Time</h3>
                            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">{event.time}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Location & Venue */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-semibold mb-1 transition-colors duration-300">Location</h3>
                          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">{event.location}</p>
                          {event.venue && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors duration-300">{event.venue}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    {event.organizer && (
                      <div className="flex items-start space-x-3">
                        <Music className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-semibold mb-1 transition-colors duration-300">Organizer</h3>
                          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">{event.organizer}</p>
                        </div>
                      </div>
                    )}

                    {event.price && (
                      <div className="flex items-start space-x-3">
                        <Tag className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-semibold mb-1 transition-colors duration-300">Price</h3>
                          <div className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                            {(() => {
                              try {
                                const tickets = JSON.parse(event.price);
                                if (Array.isArray(tickets) && tickets.length > 0) {
                                  return (
                                    <div className="space-y-1">
                                      {tickets.map((ticket, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                          <span className="text-sm">{ticket.type}:</span>
                                          <span className="font-medium">₦{ticket.price}</span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                return <p>{event.price.replace(/\$/g, '₦')}</p>;
                              } catch {
                                return <p>{event.price.replace(/\$/g, '₦')}</p>;
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Fixed Footer */}
          {user && displayMode === 'details' && (
            <div className="sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-6 border-t border-gray-200 dark:border-gray-700/50 transition-colors duration-300">
              {/* Creator Actions (Edit/Delete) */}
              {event.creator_id && user.id === event.creator_id ? (
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    <button
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 flex items-center space-x-2"
                      onClick={handleDeleteEvent}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <span>Delete</span>
                      )}
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 flex items-center space-x-2"
                      onClick={() => setIsEditFormOpen(true)}
                      disabled={isDeleting}
                    >
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Attend Button for other users' events */
                <div className="flex justify-center">
                  {checkingAttendance ? (
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 transition-colors duration-300">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Checking attendance...</span>
                    </div>
                  ) : (
                    <button
                      className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 ${userIsAttending
                          ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white hover:shadow-red-500/25'
                          : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white hover:shadow-purple-500/25'
                        }`}
                      onClick={handleAttendEvent}
                      disabled={isAttending}
                    >
                      {isAttending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{userIsAttending ? 'Canceling...' : 'Registering...'}</span>
                        </>
                      ) : userIsAttending ? (
                        <>
                          <X className="w-5 h-5" />
                          <span>Cancel Attendance</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          <span>Attend Event</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Event Form Modal */}
      <EventFormModal
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        onEventSubmitted={handleEditSubmitted}
        initialEvent={event}
      />
    </>
  );
};

export default EventModal;