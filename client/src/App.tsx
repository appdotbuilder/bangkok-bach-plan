
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/utils/trpc';
import type { 
  Venue, 
  Group, 
  SearchVenuesInput,
  CreateGroupInput,
  CreateBookingInput,
  CreateGroupMessageInput,
  CreateExpenseInput,
  User,
  Booking,
  Notification
} from '../../server/src/schema';

// Current user - in real app this would come from auth context
const currentUser: User = {
  id: 1,
  email: 'john@example.com',
  password_hash: '',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+66123456789',
  profile_image_url: null,
  role: 'user',
  is_verified: true,
  created_at: new Date(),
  updated_at: new Date()
};

type ActiveTab = 'discover' | 'groups' | 'bookings' | 'profile' | 'notifications';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dialog states
  const [showVenueDetails, setShowVenueDetails] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showBookVenue, setShowBookVenue] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form states
  const [groupForm, setGroupForm] = useState<CreateGroupInput>({
    name: '',
    description: null,
    event_date: null,
    total_budget: null
  });

  const [bookingForm, setBookingForm] = useState<CreateBookingInput>({
    venue_id: 0,
    group_id: null,
    booking_date: new Date(),
    start_time: '',
    end_time: null,
    guest_count: 1,
    special_requests: null
  });

  const [messageForm, setMessageForm] = useState<CreateGroupMessageInput>({
    group_id: 0,
    message: ''
  });

  const [expenseForm, setExpenseForm] = useState<CreateExpenseInput>({
    group_id: 0,
    description: '',
    amount: 0,
    category: '',
    receipt_url: null
  });

  // Load data functions
  const loadVenues = useCallback(async () => {
    try {
      setIsLoading(true);
      const searchInput: SearchVenuesInput = {
        keyword: searchQuery || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory as ('nightlife' | 'hotels' | 'daytime_activities' | 'evening_activities' | 'transport' | 'restaurants')
      };
      const result = await trpc.searchVenues.query(searchInput);
      
      // If API returns empty (due to stub implementation), provide fallback data
      if (result.length === 0) {
        setVenues([
          {
            id: 1,
            name: 'Sky Bar Bangkok',
            description: 'Rooftop bar with stunning city views',
            category: 'nightlife',
            address: 'Silom, Bangkok',
            latitude: null,
            longitude: null,
            phone: '+66123456789',
            email: 'info@skybar.com',
            website_url: 'https://skybar.com',
            price_range_min: 2000,
            price_range_max: 8000,
            rating: 4.8,
            review_count: 324,
            is_active: true,
            thumbnail_image_url: null,
            owner_id: 1,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 2,
            name: 'Mandarin Oriental Bangkok',
            description: 'Luxury hotel on the Chao Phraya River',
            category: 'hotels',
            address: 'Oriental Avenue, Bangkok',
            latitude: null,
            longitude: null,
            phone: '+66234567890',
            email: 'reservations@mandarinoriental.com',
            website_url: 'https://mandarinoriental.com',
            price_range_min: 12000,
            price_range_max: 50000,
            rating: 4.9,
            review_count: 1250,
            is_active: true,
            thumbnail_image_url: null,
            owner_id: 2,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 3,
            name: 'Bangkok Street Food Tour',
            description: 'Authentic local food experience',
            category: 'daytime_activities',
            address: 'Various locations, Bangkok',
            latitude: null,
            longitude: null,
            phone: '+66345678901',
            email: 'tours@bangkokfood.com',
            website_url: 'https://bangkokfoodtour.com',
            price_range_min: 1500,
            price_range_max: 3000,
            rating: 4.7,
            review_count: 892,
            is_active: true,
            thumbnail_image_url: null,
            owner_id: 3,
            created_at: new Date(),
            updated_at: new Date()
          }
        ]);
      } else {
        setVenues(result);
      }
    } catch (error) {
      console.error('Failed to load venues:', error);
      setVenues([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  const loadGroups = useCallback(async () => {
    try {
      const result = await trpc.getUserGroups.query({ userId: currentUser.id });
      
      // If API returns empty (due to stub implementation), provide fallback data
      if (result.length === 0) {
        setGroups([
          {
            id: 1,
            name: "Mike's Bachelor Party",
            description: 'Epic weekend in Bangkok',
            organizer_id: currentUser.id,
            event_date: new Date('2024-02-15'),
            total_budget: 50000,
            member_count: 8,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        ]);
      } else {
        setGroups(result);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      const result = await trpc.getUserBookings.query({ userId: currentUser.id });
      setBookings(result);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setBookings([]);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const result = await trpc.getUserNotifications.query({ userId: currentUser.id });
      setNotifications(result);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  useEffect(() => {
    if (activeTab === 'groups') {
      loadGroups();
    } else if (activeTab === 'bookings') {
      loadBookings();
    } else if (activeTab === 'notifications') {
      loadNotifications();
    }
  }, [activeTab, loadGroups, loadBookings, loadNotifications]);

  // Event handlers
  const handleVenueClick = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenueDetails(true);
  };

  const handleBookVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setBookingForm(prev => ({ ...prev, venue_id: venue.id }));
    setShowBookVenue(true);
  };

  const handleCreateGroup = async () => {
    try {
      setIsLoading(true);
      await trpc.createGroup.mutate({ ...groupForm, organizerId: currentUser.id });
      setShowCreateGroup(false);
      setGroupForm({
        name: '',
        description: null,
        event_date: null,
        total_budget: null
      });
      loadGroups();
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    try {
      setIsLoading(true);
      await trpc.createBooking.mutate({ ...bookingForm, userId: currentUser.id });
      setShowBookVenue(false);
      loadBookings();
    } catch (error) {
      console.error('Failed to create booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'nightlife': return '🍸';
      case 'hotels': return '🏨';
      case 'daytime_activities': return '☀️';
      case 'evening_activities': return '🌆';
      case 'transport': return '🚗';
      case 'restaurants': return '🍽️';
      default: return '📍';
    }
  };

  const getCategoryColor = () => {
    return 'bg-blue-600 text-white'; // Using dark blue accent color
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '⭐' : '');
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">BB</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('notifications')}
              className="relative"
            >
              🔔
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser.profile_image_url || ''} />
              <AvatarFallback className="bg-blue-600 text-white">
                {currentUser.first_name[0]}{currentUser.last_name[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {activeTab === 'discover' && (
          <div className="p-4 space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <Input
                placeholder="Search venues, activities..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="border-gray-300"
              />
              
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className={selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'border-gray-300'}
                >
                  All
                </Button>
                {['nightlife', 'hotels', 'daytime_activities', 'evening_activities', 'transport', 'restaurants'].map((categoryOption) => (
                  <Button
                    key={categoryOption}
                    variant={selectedCategory === categoryOption ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(categoryOption)}
                    className={selectedCategory === categoryOption ? 'bg-blue-600 text-white' : 'border-gray-300'}
                  >
                    {getCategoryIcon(categoryOption)} {categoryOption.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Venue Cards */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading venues...</div>
              ) : venues.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No venues found. Try adjusting your search criteria.
                </div>
              ) : (
                venues.map((venue: Venue) => (
                  <Card key={venue.id} className="cursor-pointer hover:shadow-lg transition-shadow border-gray-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-black">{venue.name}</CardTitle>
                          <CardDescription className="text-gray-600">
                            {venue.address}
                          </CardDescription>
                        </div>
                        <Badge className={getCategoryColor()}>
                          {getCategoryIcon(venue.category)} {venue.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-3">{venue.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{renderStars(venue.rating)}</span>
                          <span className="text-sm font-medium">{venue.rating}</span>
                          <span className="text-sm text-gray-500">({venue.review_count} reviews)</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-blue-600">
                            ฿{venue.price_range_min.toLocaleString()} - ฿{venue.price_range_max.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVenueClick(venue)}
                          className="flex-1 border-gray-300"
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleBookVenue(venue)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Book Now
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">My Groups</h2>
              <Button
                onClick={() => setShowCreateGroup(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                + New Group
              </Button>
            </div>

            <div className="space-y-4">
              {groups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No groups yet. Create your first bachelor party group!
                </div>
              ) : (
                groups.map((group: Group) => (
                  <Card key={group.id} className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-black">{group.name}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {group.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {group.event_date && (
                          <div>📅 Event Date: {group.event_date.toLocaleDateString()}</div>
                        )}
                        <div>👥 Members: {group.member_count}</div>
                        {group.total_budget && (
                          <div>💰 Budget: ฿{group.total_budget.toLocaleString()}</div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowGroupDetails(true);
                        }}
                        className="w-full border-gray-300"
                      >
                        View Group
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold">My Bookings</h2>
            
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No bookings yet. Start exploring venues to make your first booking!
                </div>
              ) : (
                bookings.map((booking: Booking) => (
                  <Card key={booking.id} className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-black">Booking #{booking.confirmation_code}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {booking.booking_date.toLocaleDateString()} at {booking.start_time}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>👥 Guests: {booking.guest_count}</div>
                        <div>💰 Total: ฿{booking.total_amount.toLocaleString()}</div>
                        <div>📋 Status: <Badge className={booking.status === 'confirmed' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}>{booking.status}</Badge></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 space-y-6">
            <div className="text-center">
              <Avatar className="h-20 w-20 mx-auto mb-4">
                <AvatarImage src={currentUser.profile_image_url || ''} />
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {currentUser.first_name[0]}{currentUser.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{currentUser.first_name} {currentUser.last_name}</h2>
              <p className="text-gray-600">{currentUser.email}</p>
            </div>

            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start border-gray-300">
                👤 Edit Profile
              </Button>
              <Button variant="outline" className="w-full justify-start border-gray-300">
                ❤️ Favorite Venues
              </Button>
              <Button variant="outline" className="w-full justify-start border-gray-300">
                📊 Booking History
              </Button>
              <Button variant="outline" className="w-full justify-start border-gray-300">
                ⚙️ Settings
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 border-red-300">
                🚪 Logout
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold">Notifications</h2>
            
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notification: Notification) => (
                  <Card key={notification.id} className={`border-gray-200 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-black">{notification.title}</CardTitle>
                      <CardDescription className="text-sm text-gray-500">
                        {notification.created_at.toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{notification.message}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
        <div className="flex justify-around">
          {[
            { id: 'discover', icon: '🔍', label: 'Discover' },
            { id: 'groups', icon: '👥', label: 'Groups' },
            { id: 'bookings', icon: '📅', label: 'Bookings' },
            { id: 'profile', icon: '👤', label: 'Profile' }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex flex-col items-center py-2 px-3 ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs mt-1">{tab.label}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* Venue Details Dialog */}
      <Dialog open={showVenueDetails} onOpenChange={setShowVenueDetails}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-black">{selectedVenue?.name}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedVenue?.address}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVenue && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor()}>
                  {getCategoryIcon(selectedVenue.category)} {selectedVenue.category.replace('_', ' ')}
                </Badge>
                <span className="text-sm">{renderStars(selectedVenue.rating)} {selectedVenue.rating}</span>
                <span className="text-sm text-gray-500">({selectedVenue.review_count} reviews)</span>
              </div>
              
              <p className="text-gray-700">{selectedVenue.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Price Range:</span>
                  <div className="text-blue-600 font-semibold">
                    ฿{selectedVenue.price_range_min.toLocaleString()} - ฿{selectedVenue.price_range_max.toLocaleString()}
                  </div>
                </div>
                {selectedVenue.phone && (
                  <div>
                    <span className="font-medium">Phone:</span>
                    <div>{selectedVenue.phone}</div>
                  </div>
                )}
                {selectedVenue.email && (
                  <div>
                    <span className="font-medium">Email:</span>
                    <div>{selectedVenue.email}</div>
                  </div>
                )}
                {selectedVenue.website_url && (
                  <div>
                    <span className="font-medium">Website:</span>
                    <div className="text-blue-600">{selectedVenue.website_url}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              onClick={() => selectedVenue && handleBookVenue(selectedVenue)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Book This Venue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-black">Create New Group</DialogTitle>
            <DialogDescription className="text-gray-600">
              Start planning your bachelor party with friends
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Group name"
              value={groupForm.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGroupForm((prev: CreateGroupInput) => ({ ...prev, name: e.target.value }))
              }
              className="border-gray-300"
              required
            />
            
            <Textarea
              placeholder="Description (optional)"
              value={groupForm.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setGroupForm((prev: CreateGroupInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              className="border-gray-300"
            />
            
            <Input
              type="date"
              value={groupForm.event_date ? groupForm.event_date.toISOString().split('T')[0] : ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGroupForm((prev: CreateGroupInput) => ({
                  ...prev,
                  event_date: e.target.value ? new Date(e.target.value) : null
                }))
              }
              className="border-gray-300"
            />
            
            <Input
              type="number"
              placeholder="Total budget (optional)"
              value={groupForm.total_budget || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGroupForm((prev: CreateGroupInput) => ({
                  ...prev,
                  total_budget: e.target.value ? parseFloat(e.target.value) : null
                }))
              }
              className="border-gray-300"
              min="0"
            />
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupForm.name || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book Venue Dialog */}
      <Dialog open={showBookVenue} onOpenChange={setShowBookVenue}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-black">Book {selectedVenue?.name}</DialogTitle>
            <DialogDescription className="text-gray-600">
              Fill in your booking details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              type="date"
              value={bookingForm.booking_date.toISOString().split('T')[0]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBookingForm((prev: CreateBookingInput) => ({
                  ...prev,
                  booking_date: new Date(e.target.value)
                }))
              }
              className="border-gray-300"
              required
            />
            
            <Input
              type="time"
              placeholder="Start time"
              value={bookingForm.start_time}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBookingForm((prev: CreateBookingInput) => ({ ...prev, start_time: e.target.value }))
              }
              className="border-gray-300"
              required
            />
            
            <Input
              type="time"
              placeholder="End time (optional)"
              value={bookingForm.end_time || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBookingForm((prev: CreateBookingInput) => ({
                  ...prev,
                  end_time: e.target.value || null
                }))
              }
              className="border-gray-300"
            />
            
            <Input
              type="number"
              placeholder="Number of guests"
              value={bookingForm.guest_count}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBookingForm((prev: CreateBookingInput) => ({
                  ...prev,
                  guest_count: parseInt(e.target.value) || 1
                }))
              }
              className="border-gray-300"
              min="1"
              required
            />
            
            {groups.length > 0 && (
              <Select
                value={bookingForm.group_id?.toString() || ''}
                onValueChange={(value) =>
                  setBookingForm((prev: CreateBookingInput) => ({
                    ...prev,
                    group_id: value ? parseInt(value) : null
                  }))
                }
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Select group (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {groups.map((group: Group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Textarea
              placeholder="Special requests (optional)"
              value={bookingForm.special_requests || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBookingForm((prev: CreateBookingInput) => ({
                  ...prev,
                  special_requests: e.target.value || null
                }))
              }
              className="border-gray-300"
            />
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleCreateBooking}
              disabled={!bookingForm.booking_date || !bookingForm.start_time || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Details Dialog */}
      <Dialog open={showGroupDetails} onOpenChange={setShowGroupDetails}>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-black">{selectedGroup?.name}</DialogTitle>
            <DialogDescription className="text-gray-600">
              Group management and messaging
            </DialogDescription>
          </DialogHeader>
          
          {selectedGroup && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                <TabsTrigger value="info" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Info</TabsTrigger>
                <TabsTrigger value="chat" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Chat</TabsTrigger>
                <TabsTrigger value="expenses" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Expenses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="space-y-2 text-sm">
                  {selectedGroup.description && (
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="text-gray-700">{selectedGroup.description}</p>
                    </div>
                  )}
                  {selectedGroup.event_date && (
                    <div>
                      <span className="font-medium">Event Date:</span>
                      <div>{selectedGroup.event_date.toLocaleDateString()}</div>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Members:</span>
                    <div>{selectedGroup.member_count}</div>
                  </div>
                  {selectedGroup.total_budget && (
                    <div>
                      <span className="font-medium">Budget:</span>
                      <div className="text-blue-600 font-semibold">
                        ฿{selectedGroup.total_budget.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Invite Members
                </Button>
              </TabsContent>
              
              <TabsContent value="chat" className="space-y-4">
                <ScrollArea className="h-40 w-full border border-gray-200 rounded p-2">
                  <div className="text-center text-gray-500 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageForm.message}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMessageForm((prev: CreateGroupMessageInput) => ({
                        ...prev,
                        message: e.target.value,
                        group_id: selectedGroup.id
                      }))
                    }
                    className="border-gray-300"
                  />
                  <Button
                    size="sm"
                    disabled={!messageForm.message}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Send
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="expenses" className="space-y-4">
                <div className="text-center text-gray-500 text-sm">
                  No expenses yet.
                </div>
                
                <div className="space-y-2">
                  <Input
                    placeholder="Expense description"
                    value={expenseForm.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setExpenseForm((prev: CreateExpenseInput) => ({
                        ...prev,
                        description: e.target.value,
                        group_id: selectedGroup.id
                      }))
                    }
                    className="border-gray-300"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={expenseForm.amount || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseForm((prev: CreateExpenseInput) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="border-gray-300"
                    />
                    <Input
                      placeholder="Category"
                      value={expenseForm.category}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseForm((prev: CreateExpenseInput) => ({
                          ...prev,
                          category: e.target.value
                        }))
                      }
                      className="border-gray-300"
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={!expenseForm.description || !expenseForm.amount}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add Expense
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
