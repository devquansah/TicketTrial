import type { User, Event, Ticket, AnalyticsData } from '../types/index';
import { generateMockData } from './mockData';

// Initialize the data store
const initializeStore = () => {
  if (!localStorage.getItem('ticketmaster_initialized')) {
    const { users, events, tickets, analytics } = generateMockData();
    
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('tickets', JSON.stringify(tickets));
    localStorage.setItem('analytics', JSON.stringify(analytics));
    localStorage.setItem('currentUser', JSON.stringify(users[0]));
    localStorage.setItem('ticketmaster_initialized', 'true');
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  initializeStore();
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

// Set current user
export const setCurrentUser = (user: User): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

// Get all users
export const getUsers = (): User[] => {
  initializeStore();
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
};

// Get user by ID
export const getUserById = (id: string): User | undefined => {
  const users = getUsers();
  return users.find(user => user.id === id);
};

// Get all events
export const getEvents = (): Event[] => {
  initializeStore();
  const events = localStorage.getItem('events');
  return events ? JSON.parse(events) : [];
};

// Get event by ID
export const getEventById = (id: string): Event | undefined => {
  const events = getEvents();
  return events.find(event => event.id === id);
};

// Get all tickets
export const getTickets = (): Ticket[] => {
  initializeStore();
  const tickets = localStorage.getItem('tickets');
  return tickets ? JSON.parse(tickets) : [];
};

// Get tickets by user ID
export const getTicketsByUserId = (userId: string): Ticket[] => {
  const tickets = getTickets();
  return tickets.filter(ticket => ticket.userId === userId);
};

// Get tickets by event ID
export const getTicketsByEventId = (eventId: string): Ticket[] => {
  const tickets = getTickets();
  return tickets.filter(ticket => ticket.eventId === eventId);
};

// Get ticket by ID
export const getTicketById = (id: string): Ticket | undefined => {
  const tickets = getTickets();
  return tickets.find(ticket => ticket.id === id);
};

// Save ticket (create or update)
export const saveTicket = (ticket: Ticket): void => {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.id === ticket.id);
  
  if (index >= 0) {
    tickets[index] = ticket;
  } else {
    tickets.push(ticket);
  }
  
  localStorage.setItem('tickets', JSON.stringify(tickets));
};

// Transfer ticket
export const transferTicket = (ticketId: string, fromUserId: string, toUserId: string): boolean => {
  const tickets = getTickets();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  
  if (ticketIndex < 0 || tickets[ticketIndex].userId !== fromUserId) {
    return false;
  }
  
  // Update the ticket
  const ticket = tickets[ticketIndex];
  const transfer = {
    id: Math.random().toString(36).substring(2, 9),
    ticketId,
    fromUserId,
    toUserId,
    transferDate: new Date().toISOString()
  };
  
  ticket.userId = toUserId;
  ticket.transferHistory = [...(ticket.transferHistory || []), transfer];
  
  tickets[ticketIndex] = ticket;
  localStorage.setItem('tickets', JSON.stringify(tickets));
  
  return true;
};

// Get analytics data
export const getAnalytics = (): AnalyticsData => {
  initializeStore();
  const analytics = localStorage.getItem('analytics');
  return analytics ? JSON.parse(analytics) : null;
};

// Validate a ticket
export const validateTicket = (ticketId: string, validationCode: string): boolean => {
  const tickets = getTickets();
  const ticketIndex = tickets.findIndex(t => 
    t.id === ticketId && 
    t.validationCode === validationCode && 
    t.status === 'active'
  );
  
  if (ticketIndex < 0) {
    return false;
  }
  
  // Mark the ticket as used
  tickets[ticketIndex].status = 'used';
  localStorage.setItem('tickets', JSON.stringify(tickets));
  
  return true;
};
