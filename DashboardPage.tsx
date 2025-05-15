import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, Eye, MapPin, QrCode, Search, Send } from 'lucide-react';
import type { Ticket, User, Event } from '../types/index';
import { getCurrentUser, getTicketsByUserId, getEventById, getUserById, transferTicket, getUsers } from '../utils/storage';
import QRCode from 'react-qr-code';

export default function DashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showViewTicketModal, setShowViewTicketModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [transferEmail, setTransferEmail] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState('');
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      setTimeout(() => {
        const userTickets = getTicketsByUserId(currentUser.id);
        setTickets(userTickets);
        setLoading(false);
      }, 500);
    }
  }, []);

  const getEventForTicket = (ticket: any): Event | undefined => {
    return getEventById(ticket.eventId);
  };

  const getTicketType = (ticket: any) => {
    const event = getEventForTicket(ticket);
    if (!event) return null;
    return event.ticketTypes.find(type => type.id === ticket.ticketTypeId);
  };

  const handleTransferTicket = () => {
    if (!selectedTicket || !currentUser) return;
    
    // Find the user by email
    const users = getUsers();
    const recipientUser = users.find(user => user.email.toLowerCase() === transferEmail.toLowerCase());
    
    if (!recipientUser) {
      setTransferError('User not found. Please check the email and try again.');
      return;
    }
    
    // Don't allow transfer to self
    if (recipientUser.id === currentUser.id) {
      setTransferError('You cannot transfer a ticket to yourself.');
      return;
    }
    
    // Attempt to transfer the ticket
    const success = transferTicket(selectedTicket.id, currentUser.id, recipientUser.id);
    
    if (success) {
      setTransferSuccess(true);
      setTransferError('');
      
      // Update the tickets list
      const updatedTickets = tickets.filter(t => t.id !== selectedTicket.id);
      setTickets(updatedTickets);
      
      // Reset form after success
      setTimeout(() => {
        setShowTransferModal(false);
        setSelectedTicket(null);
        setTransferSuccess(false);
        setTransferEmail('');
      }, 2000);
    } else {
      setTransferError('Failed to transfer the ticket. Please try again.');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (!searchQuery) return true;
    
    const event = getEventForTicket(ticket);
    if (!event) return false;
    
    const ticketType = getTicketType(ticket);
    
    return (
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticketType?.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const getTransferHistoryUsers = (ticket: Ticket) => {
    if (!ticket.transferHistory || ticket.transferHistory.length === 0) return [];
    
    return ticket.transferHistory.map(transfer => {
      const fromUser = getUserById(transfer.fromUserId);
      const toUser = getUserById(transfer.toUserId);
      
      return {
        date: new Date(transfer.transferDate).toLocaleDateString(),
        from: fromUser?.name || 'Unknown User',
        to: toUser?.name || 'Unknown User',
      };
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">My Tickets</h1>
        <div className="animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 mb-4 flex">
              <div className="w-1/4 bg-gray-200 h-32 rounded-md"></div>
              <div className="w-3/4 pl-4">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">My Tickets</h1>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search your tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 pr-4 w-full"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 flex items-center justify-center rounded-full mb-4">
              <Ticket className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No tickets yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't purchased any tickets yet. Browse available events and get your tickets!
            </p>
            <Link to="/" className="btn btn-primary">
              Browse Events
            </Link>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">No matches found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find any tickets matching your search criteria.
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="btn btn-primary"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map(ticket => {
              const event = getEventForTicket(ticket);
              const ticketType = getTicketType(ticket);
              
              if (!event || !ticketType) return null;
              
              return (
                <div 
                  key={ticket.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row"
                >
                  <div className="md:w-1/4 h-48 md:h-auto">
                    <img 
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="p-4 md:p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">{event.title}</h3>
                      <div className={`badge ${ticket.status === 'active' ? 'badge-success' : ticket.status === 'transferred' ? 'badge-warning' : 'badge-danger'}`}>
                        {ticket.status === 'active' ? 'Active' : ticket.status === 'transferred' ? 'Transferred' : 'Used'}
                      </div>
                    </div>
                    
                    <div className="text-gray-600 mb-1">{ticketType.name}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 mt-2">
                      <div className="flex items-center text-gray-600 text-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{event.time}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    
                    {ticket.transferHistory && ticket.transferHistory.length > 0 && (
                      <div className="mb-4 text-sm">
                        <div className="flex items-center text-gray-600 mb-1">
                          <ArrowRight className="h-4 w-4 mr-1" />
                          <span>Transferred {ticket.transferHistory.length} time{ticket.transferHistory.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-auto pt-4 flex flex-wrap gap-2">
                      <button
                        className="btn btn-outline flex items-center"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowViewTicketModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Ticket
                      </button>
                      
                      {ticket.status === 'active' && (
                        <button
                          className="btn btn-outline flex items-center"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTransferModal(true);
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Transfer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {selectedTicket && showViewTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Your Ticket</h3>
                <button 
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowViewTicketModal(false)}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {(() => {
                const event = getEventForTicket(selectedTicket);
                const ticketType = getTicketType(selectedTicket);
                
                if (!event || !ticketType) return <div>Ticket information not available</div>;
                
                return (
                  <>
                    <div className="mb-6">
                      <div className="mb-1 text-gray-500">Event</div>
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="mb-1 text-gray-500">Date</div>
                        <div>{new Date(event.date).toLocaleDateString()}</div>
                      </div>
                      
                      <div>
                        <div className="mb-1 text-gray-500">Time</div>
                        <div>{event.time}</div>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="mb-1 text-gray-500">Location</div>
                        <div>{event.location}</div>
                      </div>
                      
                      <div>
                        <div className="mb-1 text-gray-500">Ticket Type</div>
                        <div>{ticketType.name}</div>
                      </div>
                      
                      <div>
                        <div className="mb-1 text-gray-500">Status</div>
                        <div className={`badge ${selectedTicket.status === 'active' ? 'badge-success' : selectedTicket.status === 'transferred' ? 'badge-warning' : 'badge-danger'}`}>
                          {selectedTicket.status === 'active' ? 'Active' : selectedTicket.status === 'transferred' ? 'Transferred' : 'Used'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center mb-6">
                      <div className="text-center mb-4">
                        <div className="font-medium">Ticket Validation Code</div>
                        <div className="text-xl tracking-wider font-mono mt-1">{selectedTicket.validationCode}</div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <QRCode
                          value={JSON.stringify({
                            ticketId: selectedTicket.id,
                            code: selectedTicket.validationCode,
                            event: event.title,
                            date: event.date
                          })}
                          size={150}
                        />
                      </div>
                      
                      <div className="text-sm text-gray-500 mt-2 text-center">
                        Show this QR code at the event entrance
                      </div>
                    </div>
                    
                    {selectedTicket.transferHistory && selectedTicket.transferHistory.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium mb-2">Transfer History</h4>
                        <div className="space-y-2">
                          {getTransferHistoryUsers(selectedTicket).map((transfer, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center">
                                <ArrowRight className="h-3 w-3 mr-1 text-gray-500" />
                                <span>
                                  <span className="font-medium">{transfer.from}</span> to <span className="font-medium">{transfer.to}</span>
                                </span>
                              </div>
                              <div className="text-gray-500 text-xs ml-4">{transfer.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      
      {selectedTicket && showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Transfer Ticket</h3>
                <button 
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => {
                    if (!transferSuccess) {
                      setShowTransferModal(false);
                      setTransferEmail('');
                      setTransferError('');
                    }
                  }}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {transferSuccess ? (
                <div className="text-center py-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Transfer Successful!</h3>
                  <p className="text-gray-500 mt-2">
                    Your ticket has been successfully transferred.
                  </p>
                </div>
              ) : (
                <>
                  <p className="mb-4">
                    Transfer your ticket to another user. Once transferred, you will no longer have access to this ticket.
                  </p>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient's Email
                    </label>
                    <input
                      type="email"
                      value={transferEmail}
                      onChange={(e) => setTransferEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="input w-full"
                    />
                    {transferError && (
                      <p className="mt-2 text-sm text-red-600">{transferError}</p>
                    )}
                  </div>
                  
                  {(() => {
                    const event = getEventForTicket(selectedTicket);
                    const ticketType = getTicketType(selectedTicket);
                    
                    if (!event || !ticketType) return null;
                    
                    return (
                      <div className="mb-6 bg-gray-50 p-4 rounded-md">
                        <div className="text-sm text-gray-500 mb-2">Ticket Details</div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm">{ticketType.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(event.date).toLocaleDateString()} · {event.time}
                        </div>
                      </div>
                    );
                  })()}
                  
                  <button
                    className="btn btn-primary w-full"
                    disabled={!transferEmail}
                    onClick={handleTransferTicket}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Transfer Ticket
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
