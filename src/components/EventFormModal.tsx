import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, Music, Tag, DollarSign, FileText, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TicketPriceInput, { TicketType } from './TicketPriceInput';
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
}

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSubmitted?: () => void;
  initialEvent?: Event | null;
}

const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, onEventSubmitted, initialEvent = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    venue: '',
    location: '',
    description: '',
    category: 'General',
  });
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [showTicketPricing, setShowTicketPricing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form data when initialEvent changes
  useEffect(() => {
    if (initialEvent) {
      setFormData({
        title: initialEvent.title || '',
        date: initialEvent.date || '',
        time: initialEvent.time || '',
        venue: initialEvent.venue || '',
        location: initialEvent.location || '',
        description: initialEvent.description || '',
        category: initialEvent.category || 'General'
      });
      setImagePreview(initialEvent.image || null);

      // Parse existing price data
      if (initialEvent.price) {
        try {
          const parsedTickets = JSON.parse(initialEvent.price);
          if (Array.isArray(parsedTickets)) {
            setTicketTypes(parsedTickets);
          } else {
            // If it's a simple string, convert to single ticket type
            setTicketTypes([{ type: 'General', price: initialEvent.price }]);
          }
        } catch {
          // If parsing fails, treat as simple string
          setTicketTypes([{ type: 'General', price: initialEvent.price }]);
        }
      } else {
        setTicketTypes([]);
      }
    }
  }, [initialEvent]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get current user for creator_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to create or edit events');
      }

      let imageUrl = initialEvent?.image || null;

      // Handle image upload if an image is selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `event-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, selectedImage);

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Prepare event data for insertion/update
      // Serialize ticket types to JSON string for storage
      let priceData = '';
      if (ticketTypes.length > 0) {
        const validTickets = ticketTypes.filter(ticket => ticket.type.trim() && ticket.price.trim());
        if (validTickets.length > 0) {
          priceData = JSON.stringify(validTickets);
        }
      }

      const eventData = {
        title: formData.title,
        date: formData.date,
        time: formData.time || null,
        venue: formData.venue,
        location: formData.location || null,
        organizer: user.user_metadata?.full_name || user.email || 'Unknown Organizer',
        description: formData.description || null,
        category: formData.category,
        price: priceData || null,
        image: imageUrl,
        // Only set creator_id for new events, not updates
        ...(initialEvent ? {} : { creator_id: user.id })
      };

      let error;

      if (initialEvent) {
        // Update existing event
        const { error: updateError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', initialEvent.id);
        error = updateError;
      } else {
        // Insert new event
        const { error: insertError } = await supabase
          .from('events')
          .insert([eventData]);
        error = insertError;
      }

      if (error) {
        throw new Error(`Failed to ${initialEvent ? 'update' : 'create'} event: ${error.message}`);
      }

      // Success - close modal and reset form
      onClose();

      // Trigger event list refresh
      if (onEventSubmitted) {
        onEventSubmitted();
      }
    } catch (error) {
      console.error(`Error ${initialEvent ? 'updating' : 'creating'} event:`, error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (!initialEvent) {
        setFormData({
          title: '',
          date: '',
          time: '',
          venue: '',
          location: '',
          description: '',
          category: 'General'
        });
        setTicketTypes([]);
        setImagePreview(null);
      }
      setSelectedImage(null);
      setSubmitError(null);
      setIsSubmitting(false);
      setShowTicketPricing(false);
    }
  }, [isOpen, initialEvent]);

  if (!isOpen) return null;

  const categories = ['General', 'Rock', 'Electronic', 'Jazz', 'Indie', 'Classical', 'Hip-Hop', 'R&B', 'Alternative', 'Pop'];
  const isEditing = !!initialEvent;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-form-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 transition-colors duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-200/80 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full transition-all duration-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-6">
          <h2 id="event-form-title" className="text-3xl font-bold text-white flex items-center">
            <Music className="w-8 h-8 mr-3" />
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h2>
          <p className="text-purple-100 mt-2">
            {isEditing ? 'Update the details of your music event' : 'Fill in the details to create your music event'}
          </p>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter event title"
                />
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Time */}
              <div>
                <label htmlFor="time" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Venue */}
              <div>
                <label htmlFor="venue" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Venue *
                </label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter venue name"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="City, State"
                />
              </div>


              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                >
                  {categories.map((category) => (
                    <option key={category} value={category} className="bg-gray-100 dark:bg-gray-800">
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Ticket Pricing
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowTicketPricing(true)}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-left hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    {ticketTypes.length > 0 ? (
                      <div className="text-gray-900 dark:text-white transition-colors duration-300">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-300">
                          {ticketTypes.length} ticket type{ticketTypes.length > 1 ? 's' : ''} configured
                        </div>
                        <div className="space-y-1">
                          {ticketTypes.slice(0, 2).map((ticket, index) => (
                            <div key={index} className="text-sm">
                              {ticket.type}: ₦{ticket.price}
                            </div>
                          ))}
                          {ticketTypes.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{ticketTypes.length - 2} more...
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
                        Click to configure ticket types and pricing
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label htmlFor="image" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Event Image
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(initialEvent?.image || null);
                          // Reset file input
                          const fileInput = document.getElementById('image') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        className="absolute top-2 right-2 p-1 bg-gray-900/80 hover:bg-gray-800 dark:bg-gray-900/80 dark:hover:bg-gray-800 text-white rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                <FileText className="w-4 h-4 inline mr-2" />
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-vertical"
                placeholder="Describe your event..."
              />
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">{submitError}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-500 dark:hover:border-gray-500 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 flex items-center justify-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isEditing ? 'Updating Event...' : 'Creating Event...'}
                  </>
                ) : (
                  isEditing ? 'Update Event' : 'Create Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Ticket Pricing Modal */}
      {showTicketPricing && (
        <TicketPriceInput
          value={ticketTypes}
          onChange={setTicketTypes}
          onClose={() => setShowTicketPricing(false)}
        />
      )}
    </div>
  );
};

export default EventFormModal;