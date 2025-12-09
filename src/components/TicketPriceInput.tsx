import React, { useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';

export interface TicketType {
  type: string;
  price: string;
}

interface TicketPriceInputProps {
  value: TicketType[];
  onChange: (ticketTypes: TicketType[]) => void;
  onClose: () => void;
}

const TicketPriceInput: React.FC<TicketPriceInputProps> = ({ value, onChange, onClose }) => {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>(
    value.length > 0 ? value : [{ type: '', price: '' }]
  );

  // Handle input changes
  const handleInputChange = (index: number, field: 'type' | 'price', newValue: string) => {
    const updatedTicketTypes = ticketTypes.map((ticket, i) => 
      i === index ? { ...ticket, [field]: newValue } : ticket
    );
    setTicketTypes(updatedTicketTypes);
    onChange(updatedTicketTypes);
  };

  // Add new ticket type row
  const addTicketType = () => {
    const newTicketTypes = [...ticketTypes, { type: '', price: '' }];
    setTicketTypes(newTicketTypes);
    onChange(newTicketTypes);
  };

  // Remove ticket type row
  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      const newTicketTypes = ticketTypes.filter((_, i) => i !== index);
      setTicketTypes(newTicketTypes);
      onChange(newTicketTypes);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 transition-colors duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Tag className="w-6 h-6 mr-3" />
            Ticket Types & Pricing
          </h3>
          <p className="text-purple-100 mt-1">
            Add different ticket types and their corresponding prices
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 mb-4 text-sm font-semibold text-gray-600 dark:text-gray-300 transition-colors duration-300">
            <div className="col-span-5">Ticket Type</div>
            <div className="col-span-5">Price (₦)</div>
            <div className="col-span-2">Action</div>
          </div>

          {/* Ticket Type Rows */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {ticketTypes.map((ticket, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center">
                {/* Ticket Type Input */}
                <div className="col-span-5">
                  <input
                    type="text"
                    value={ticket.type}
                    onChange={(e) => handleInputChange(index, 'type', e.target.value)}
                    placeholder={index === 0 ? "e.g., Regular" : index === 1 ? "e.g., VIP" : "e.g., VVIP"}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>

                {/* Price Input */}
                <div className="col-span-5">
                  <input
                    type="text"
                    value={ticket.price}
                    onChange={(e) => handleInputChange(index, 'price', e.target.value)}
                    placeholder={index === 0 ? "25" : index === 1 ? "50" : "100"}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>

                {/* Remove Button */}
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={() => removeTicketType(index)}
                    disabled={ticketTypes.length === 1}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove ticket type"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Row Button */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <button
              type="button"
              onClick={addTicketType}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-100 dark:bg-purple-600/20 hover:bg-purple-200 dark:hover:bg-purple-600/30 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg transition-all duration-200 border border-purple-300 dark:border-purple-600/30 hover:border-purple-400 dark:hover:border-purple-500/50"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Ticket Type</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-400 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-500 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPriceInput;