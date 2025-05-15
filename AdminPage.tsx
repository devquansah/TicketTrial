import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics, getEvents, getTickets, getUsers } from '../utils/storage';
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, Calendar, ChevronRight, DollarSign, Ticket, TrendingUp, Users } from 'lucide-react';

export default function AdminPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setTimeout(() => {
      // Get fresh data instead of using cached analytics
      const events = getEvents();
      const tickets = getTickets();
      const users = getUsers();
      
      const analyticsData = {
        totalEvents: events.length,
        totalTickets: tickets.length,
        totalUsers: users.length,
        totalRevenue: tickets.reduce((sum, ticket) => {
          const event = events.find(e => e.id === ticket.eventId);
          if (!event) return sum;
          
          const ticketType = event.ticketTypes.find(tt => tt.id === ticket.ticketTypeId);
          return sum + (ticketType ? ticketType.price : 0);
        }, 0),
        ticketsSoldPerDay: calculateTicketsSoldPerDay(tickets),
        topEvents: calculateTopEvents(events, tickets),
        ticketTypeDistribution: calculateTicketTypeDistribution(events, tickets),
        ticketStatusDistribution: calculateTicketStatusDistribution(tickets)
      };
      
      setAnalyticsData(analyticsData);
      setLoading(false);
    }, 600);
  }, []);

  const calculateTicketsSoldPerDay = (tickets) => {
    // Group tickets by purchase date
    const ticketsByDate = {};
    
    tickets.forEach(ticket => {
      const date = ticket.purchaseDate.split('T')[0];
      if (!ticketsByDate[date]) {
        ticketsByDate[date] = 0;
      }
      ticketsByDate[date]++;
    });
    
    // Convert to array and sort by date
    return Object.entries(ticketsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days
  };

  const calculateTopEvents = (events, tickets) => {
    // Count tickets by event
    const ticketsByEvent = {};
    
    tickets.forEach(ticket => {
      if (!ticketsByEvent[ticket.eventId]) {
        ticketsByEvent[ticket.eventId] = 0;
      }
      ticketsByEvent[ticket.eventId]++;
    });
    
    // Map to event objects and sort
    return Object.entries(ticketsByEvent)
      .map(([eventId, count]) => {
        const event = events.find(e => e.id === eventId);
        return {
          id: eventId,
          name: event ? event.title : 'Unknown Event',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 events
  };

  const calculateTicketTypeDistribution = (events, tickets) => {
    // Count tickets by type
    const distribution = {};
    
    tickets.forEach(ticket => {
      const event = events.find(e => e.id === ticket.eventId);
      if (!event) return;
      
      const ticketType = event.ticketTypes.find(tt => tt.id === ticket.ticketTypeId);
      if (!ticketType) return;
      
      if (!distribution[ticketType.name]) {
        distribution[ticketType.name] = 0;
      }
      distribution[ticketType.name]++;
    });
    
    // Convert to array for charts
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value
    }));
  };

  const calculateTicketStatusDistribution = (tickets) => {
    // Count tickets by status
    const distribution = {
      active: 0,
      used: 0,
      transferred: 0,
      cancelled: 0
    };
    
    tickets.forEach(ticket => {
      distribution[ticket.status]++;
    });
    
    // Convert to array for charts
    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderOverviewTab = () => {
    if (!analyticsData) return null;
    
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total Events</h3>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold">{analyticsData.totalEvents}</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total Tickets</h3>
              <div className="bg-green-100 p-3 rounded-full">
                <Ticket className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold">{analyticsData.totalTickets}</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold">{analyticsData.totalUsers}</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
              <div className="bg-yellow-100 p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold">${analyticsData.totalRevenue.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-medium mb-4">Tickets Sold (Last 14 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.ticketsSoldPerDay}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [value, 'Tickets']}
                    labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                  />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-medium mb-4">Top 5 Events</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.topEvents}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [value, 'Tickets']}
                    labelFormatter={(label) => `Event: ${label}`}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-medium mb-4">Ticket Types Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.ticketTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.ticketTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Tickets']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-medium mb-4">Ticket Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.ticketStatusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.ticketStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Tickets']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEventsTab = () => {
    const events = getEvents();
    
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">Events</h2>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map((event) => {
                  const soldPercentage = Math.floor((event.soldTickets / event.totalTickets) * 100);
                  
                  // Calculate revenue
                  const tickets = getTickets().filter(t => t.eventId === event.id);
                  const revenue = tickets.reduce((sum, ticket) => {
                    const ticketType = event.ticketTypes.find(tt => tt.id === ticket.ticketTypeId);
                    return sum + (ticketType ? ticketType.price : 0);
                  }, 0);
                  
                  return (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-md object-cover" src={event.image} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(event.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">{event.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.soldTickets} / {event.totalTickets}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${soldPercentage > 80 ? 'bg-green-500' : soldPercentage > 40 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{ width: `${soldPercentage}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${revenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/event/${event.id}`} className="text-blue-600 hover:text-blue-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderValidationTab = () => {
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">Ticket Validation</h2>
        
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
          <div className="bg-blue-100 p-4 rounded-full inline-flex mx-auto mb-4">
            <QRCode className="h-10 w-10 text-blue-600" />
          </div>
          
          <h3 className="text-lg font-medium mb-2">Validate Event Tickets</h3>
          <p className="text-gray-600 mb-6">
            Use the ticket validation tool to scan QR codes or manually validate tickets at your event.
          </p>
          
          <Link to="/validate" className="btn btn-primary">
            Go to Ticket Validation
          </Link>
        </div>
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'events':
        return renderEventsTab();
      case 'validation':
        return renderValidationTab();
      case 'overview':
      default:
        return renderOverviewTab();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md h-32">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        
        <Link to="/validate" className="btn btn-primary">
          Validate Tickets
        </Link>
      </div>
      
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'events'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'validation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('validation')}
          >
            Validation
          </button>
        </nav>
      </div>
      
      {renderActiveTab()}
    </div>
  );
}

function QRCode(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  );
}
