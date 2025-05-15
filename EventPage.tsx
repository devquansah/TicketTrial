import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ticket as TicketIcon, CalendarDays, Clock, CreditCard, MapPin, Users } from 'lucide-react';
import { Event, TicketType, Ticket } from '../types/index';
import { getEventById, getCurrentUser, getTicketsByEventId, saveTicket } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicketType, setSelectedTicketType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (id) {
      setTimeout(() => {
        const eventData = getEventById(id);
        if (eventData) {
          setEvent(eventData);
        }
        setLoading(false);
      }, 300);
    }
  }, [id]);

  const handlePurchase = () => {
    if (!currentUser) {
      alert("Please sign in to purchase tickets");
      return;
    }

    if (!event || !selectedTicketType) return;

    const ticketType = event.ticketTypes.find(t => t.id === selectedTicketType);
    if (!ticketType) return;

    // Generate tickets
    const newTickets: Ticket[] = Array.from({ length: quantity }, () => ({
      id: uuidv4(),
      eventId: event.id,
      ticketTypeId: ticketType.id,
      userId: currentUser.id,
      purchaseDate: new Date().toISOString(),
      status: 'active',
      validationCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      transferHistory: []
    }));

    // Save tickets
    newTickets.forEach(ticket => saveTicket(ticket));

    // Show success message
    setPurchaseSuccess(true);
    
    // Update event data in UI to reflect the purchase
    if (event) {
      const updatedEvent = {
        ...event,
        soldTickets: event.soldTickets + quantity
      };
      setEvent(updatedEvent);
    }

    // Reset form
    setTimeout(() => {
      setShowPurchaseModal(false);
      setPurchaseSuccess(false);
    }, 2000);
  };

  const getSelectedTicketType = (): TicketType | undefined => {
    if (!event || !selectedTicketType) return undefined;
    return event.ticketTypes.find(t => t.id === selectedTicketType);
  };

  const calculateTotalPrice = (): number => {
    const ticketType = getSelectedTicketType();
    return ticketType ? ticketType.price * quantity : 0;
  };

  const renderTicketsSold = () => {
    if (!event) return null;
    
    const soldPercentage = Math.floor((event.soldTickets / event.totalTickets) * 100);
    let status = 'badge-primary';
    
    if (soldPercentage > 80) {
      status = 'badge-danger';
    } else if (soldPercentage > 50) {
      status = 'badge-warning';
    }
    
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Tickets sold</span>
          <span className={`badge ${status}`}>{soldPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${status === 'badge-danger' ? 'bg-red-500' : status === 'badge-warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
            style={{ width: `${soldPercentage}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {event.soldTickets} of {event.totalTickets} tickets sold
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <img 
              src={event.image} 
              alt={event.title} 
              className="w-full h-64 md:h-[400px] object-cover rounded-lg shadow-md"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <CalendarDays className="h-5 w-5 mr-2" />
                  <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{event.location}</span>
                </div>
              </div>
              
              <div className="prose prose-lg mb-8">
                <h3 className="text-xl font-semibold mb-2">About This Event</h3>
                <p>{event.description}</p>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Available Tickets</h3>
                
                <div className="space-y-4">
                  {event.ticketTypes.map(ticketType => {
                    const isAvailable = ticketType.available > 0;
                    
                    return (
                      <div 
                        key={ticketType.id}
                        className={`border rounded-lg p-4 transition ${
                          isAvailable 
                            ? 'border-gray-200 hover:border-blue-500 cursor-pointer' 
                            : 'border-gray-200 bg-gray-50 opacity-75'
                        }`}
                        onClick={() => isAvailable && setSelectedTicketType(ticketType.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-lg">{ticketType.name}</h4>
                            <p className="text-gray-600 text-sm">{ticketType.description}</p>
                          </div>
                          <div className="text-xl font-bold">${ticketType.price.toFixed(2)}</div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            {isAvailable ? (
                              `${ticketType.available} tickets available`
                            ) : (
                              <span className="text-red-500">Sold out</span>
                            )}
                          </div>
                          {isAvailable && (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicketType(ticketType.id);
                                setShowPurchaseModal(true);
                              }}
                            >
                              Buy Tickets
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 sticky top-6">
                <h3 className="text-xl font-semibold mb-4">Event Summary</h3>
                
                {renderTicketsSold()}
                
                <div className="border-t border-gray-200 py-4">
                  <h4 className="font-medium mb-2">Ticket information</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-start">
                      <TicketIcon className="h-4 w-4 mr-2 mt-1 text-gray-500" />
                      <span>All tickets are digital</span>
                    </li>
                    <li className="flex items-start">
                      <Users className="h-4 w-4 mr-2 mt-1 text-gray-500" />
                      <span>Tickets can be transferred to others</span>
                    </li>
                    <li className="flex items-start">
                      <CreditCard className="h-4 w-4 mr-2 mt-1 text-gray-500" />
                      <span>Payment secure and encrypted</span>
                    </li>
                  </ul>
                </div>
                
                <button
                  className="btn btn-primary w-full mt-4"
                  onClick={() => setShowPurchaseModal(true)}
                >
                  Buy Tickets
                </button>
                
                <div className="text-xs text-center text-gray-500 mt-4">
                  By purchasing tickets, you agree to our Terms of Service and Privacy Policy.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Purchase Tickets</h3>
                <button 
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => {
                    if (!purchaseSuccess) {
                      setShowPurchaseModal(false);
                    }
                  }}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {purchaseSuccess ? (
                <div className="text-center py-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Purchase Successful!</h3>
                  <p className="text-gray-500 mt-2">
                    Your tickets have been added to your account. You can view them in your dashboard.
                  </p>
                  <button
                    className="btn btn-primary mt-4"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to My Tickets
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">{event.title}</h4>
                    <div className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {event.time}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticket Type
                    </label>
                    <select
                      value={selectedTicketType || ''}
                      onChange={(e) => setSelectedTicketType(e.target.value)}
                      className="input w-full"
                    >
                      <option value="" disabled>Select ticket type</option>
                      {event.ticketTypes.map(type => (
                        <option 
                          key={type.id} 
                          value={type.id}
                          disabled={type.available <= 0}
                        >
                          {type.name} - ${type.price.toFixed(2)} {type.available <= 0 ? '(Sold out)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedTicketType && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="input w-full"
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {selectedTicketType && (
                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <div className="flex justify-between mb-2">
                        <span>Subtotal</span>
                        <span>${(calculateTotalPrice()).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Service Fee</span>
                        <span>${(calculateTotalPrice() * 0.1).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${(calculateTotalPrice() * 1.1).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    className="btn btn-primary w-full"
                    disabled={!selectedTicketType}
                    onClick={handlePurchase}
                  >
                    Complete Purchase
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
