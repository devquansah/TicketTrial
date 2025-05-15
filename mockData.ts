import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import { User, Event, Ticket, TicketType, Transfer, AnalyticsData } from '../types';

const USERS_COUNT = 50;
const EVENTS_COUNT = 10;
const TICKETS_PER_EVENT_MAX = 100;

export function generateMockData() {
  const users = generateUsers();
  const events = generateEvents(users);
  const tickets = generateTickets(events, users);
  const analytics = generateAnalytics(events, tickets);
  
  return { users, events, tickets, analytics };
}

function generateUsers(): User[] {
  const admin: User = {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@ticketmaster.com',
    role: 'admin',
    avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
  };

  const regularUsers = Array.from({ length: USERS_COUNT - 1 }, (_, i) => ({
    id: uuidv4(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'user' as const,
    avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
  }));

  return [admin, ...regularUsers];
}

function generateEvents(users: User[]): Event[] {
  const adminUsers = users.filter(user => user.role === 'admin');
  
  return Array.from({ length: EVENTS_COUNT }, (_, i) => {
    const eventDate = faker.date.future();
    const ticketTypes: TicketType[] = [
      {
        id: uuidv4(),
        name: 'General Admission',
        price: Number(faker.commerce.price({ min: 10, max: 50 })),
        available: faker.number.int({ min: 50, max: 200 }),
        description: 'Standard entry ticket'
      },
      {
        id: uuidv4(),
        name: 'VIP',
        price: Number(faker.commerce.price({ min: 80, max: 150 })),
        available: faker.number.int({ min: 10, max: 50 }),
        description: 'Premium experience with special perks'
      }
    ];
    
    if (Math.random() > 0.5) {
      ticketTypes.push({
        id: uuidv4(),
        name: 'Early Bird',
        price: Number(faker.commerce.price({ min: 5, max: 25 })),
        available: faker.number.int({ min: 20, max: 100 }),
        description: 'Limited early discounted tickets'
      });
    }
    
    const totalTickets = ticketTypes.reduce((sum, type) => sum + type.available, 0);
    const soldTickets = faker.number.int({ min: 0, max: Math.floor(totalTickets * 0.8) });
    
    return {
      id: uuidv4(),
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraphs(2),
      date: eventDate.toISOString().split('T')[0],
      time: `${faker.number.int({ min: 12, max: 20 })}:00`,
      location: `${faker.location.city()}, ${faker.location.country()}`,
      image: `https://picsum.photos/seed/${i + 1}/800/500`,
      organizerId: adminUsers[Math.floor(Math.random() * adminUsers.length)].id,
      ticketTypes,
      totalTickets,
      soldTickets
    };
  });
}

function generateTickets(events: Event[], users: User[]): Ticket[] {
  const tickets: Ticket[] = [];
  const regularUsers = users.filter(user => user.role === 'user');
  
  events.forEach(event => {
    const soldTicketsCount = event.soldTickets;
    const ticketDistribution = distributeTickets(event.ticketTypes, soldTicketsCount);
    
    let ticketsCreated = 0;
    
    event.ticketTypes.forEach((ticketType, typeIndex) => {
      const ticketsOfThisType = ticketDistribution[typeIndex];
      
      for (let i = 0; i < ticketsOfThisType; i++) {
        const userId = regularUsers[Math.floor(Math.random() * regularUsers.length)].id;
        const purchaseDate = faker.date.recent({ days: 30 });
        
        const ticket: Ticket = {
          id: uuidv4(),
          eventId: event.id,
          ticketTypeId: ticketType.id,
          userId,
          purchaseDate: purchaseDate.toISOString(),
          status: Math.random() > 0.9 ? 'used' : 'active',
          validationCode: generateValidationCode(),
          transferHistory: []
        };
        
        // Add transfer history for some tickets
        if (Math.random() > 0.8) {
          const transfersCount = Math.floor(Math.random() * 2) + 1;
          const transfers: Transfer[] = [];
          
          let currentOwnerId = userId;
          
          for (let j = 0; j < transfersCount; j++) {
            let newOwnerId;
            do {
              newOwnerId = regularUsers[Math.floor(Math.random() * regularUsers.length)].id;
            } while (newOwnerId === currentOwnerId);
            
            const transferDate = new Date(purchaseDate);
            transferDate.setDate(transferDate.getDate() + (j + 1) * Math.floor(Math.random() * 5) + 1);
            
            transfers.push({
              id: uuidv4(),
              ticketId: ticket.id,
              fromUserId: currentOwnerId,
              toUserId: newOwnerId,
              transferDate: transferDate.toISOString()
            });
            
            currentOwnerId = newOwnerId;
          }
          
          ticket.transferHistory = transfers;
          ticket.userId = currentOwnerId;
          if (Math.random() > 0.7) {
            ticket.status = 'transferred';
          }
        }
        
        tickets.push(ticket);
        ticketsCreated++;
      }
    });
  });
  
  return tickets;
}

function distributeTickets(ticketTypes: TicketType[], totalSold: number): number[] {
  const distribution: number[] = [];
  const totalAvailable = ticketTypes.reduce((sum, type) => sum + type.available, 0);
  
  let remaining = totalSold;
  
  for (let i = 0; i < ticketTypes.length - 1; i++) {
    const typeRatio = ticketTypes[i].available / totalAvailable;
    const allocated = Math.floor(totalSold * typeRatio);
    distribution.push(Math.min(allocated, ticketTypes[i].available));
    remaining -= distribution[i];
  }
  
  // Allocate the rest to the last type
  distribution.push(Math.min(remaining, ticketTypes[ticketTypes.length - 1].available));
  
  return distribution;
}

function generateValidationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateAnalytics(events: Event[], tickets: Ticket[]): AnalyticsData {
  const totalEvents = events.length;
  const totalTickets = tickets.length;
  
  const totalRevenue = tickets.reduce((sum, ticket) => {
    const event = events.find(e => e.id === ticket.eventId);
    if (!event) return sum;
    
    const ticketType = event.ticketTypes.find(tt => tt.id === ticket.ticketTypeId);
    return sum + (ticketType ? ticketType.price : 0);
  }, 0);
  
  // Generate tickets sold per day data (last 30 days)
  const today = new Date();
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();
  
  const ticketsByDate = dates.map(date => {
    const count = tickets.filter(t => t.purchaseDate.split('T')[0] === date).length;
    return { date, count };
  });
  
  // Calculate top events by tickets sold
  const eventTicketCounts = events.map(event => {
    const soldTickets = tickets.filter(t => t.eventId === event.id).length;
    return {
      eventId: event.id,
      title: event.title,
      soldTickets
    };
  }).sort((a, b) => b.soldTickets - a.soldTickets).slice(0, 5);
  
  // Calculate tickets by type
  const ticketTypeCounts: Record<string, number> = {};
  tickets.forEach(ticket => {
    const event = events.find(e => e.id === ticket.eventId);
    if (!event) return;
    
    const ticketType = event.ticketTypes.find(tt => tt.id === ticket.ticketTypeId);
    if (!ticketType) return;
    
    if (!ticketTypeCounts[ticketType.name]) {
      ticketTypeCounts[ticketType.name] = 0;
    }
    ticketTypeCounts[ticketType.name]++;
  });
  
  const ticketTypeData = Object.entries(ticketTypeCounts).map(([name, count]) => ({ name, count }));
  
  return {
    totalEvents,
    totalTickets,
    totalRevenue,
    ticketsSoldPerDay: ticketsByDate,
    topEvents: eventTicketCounts,
    ticketTypes: ticketTypeData
  };
}
