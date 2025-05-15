export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: string;
  organizerId: string;
  ticketTypes: TicketType[];
  totalTickets: number;
  soldTickets: number;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  available: number;
  description?: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  ticketTypeId: string;
  userId: string;
  purchaseDate: string;
  status: 'active' | 'used' | 'transferred' | 'cancelled';
  validationCode: string;
  transferHistory?: Transfer[];
}

export interface Transfer {
  id: string;
  ticketId: string;
  fromUserId: string;
  toUserId: string;
  transferDate: string;
}

export interface AnalyticsData {
  totalEvents: number;
  totalTickets: number;
  totalRevenue: number;
  ticketsSoldPerDay: {
    date: string;
    count: number;
  }[];
  topEvents: {
    eventId: string;
    title: string;
    soldTickets: number;
  }[];
  ticketTypes: {
    name: string;
    count: number;
  }[];
}
