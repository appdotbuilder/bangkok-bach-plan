
import { z } from 'zod';

// Enums
export const categoryEnum = z.enum([
  'nightlife',
  'hotels', 
  'daytime_activities',
  'evening_activities',
  'transport',
  'restaurants'
]);

export const bookingStatusEnum = z.enum([
  'pending',
  'confirmed', 
  'cancelled',
  'completed'
]);

export const userRoleEnum = z.enum(['user', 'admin', 'venue_owner']);

export const notificationTypeEnum = z.enum([
  'booking_update',
  'group_message',
  'price_alert',
  'payment_reminder'
]);

// User schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  profile_image_url: z.string().nullable(),
  role: userRoleEnum,
  is_verified: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Venue schemas
export const venueSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  category: categoryEnum,
  address: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  website_url: z.string().nullable(),
  price_range_min: z.number(),
  price_range_max: z.number(),
  rating: z.number(),
  review_count: z.number().int(),
  is_active: z.boolean(),
  thumbnail_image_url: z.string().nullable(),
  owner_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Venue = z.infer<typeof venueSchema>;

export const createVenueInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: categoryEnum,
  address: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  website_url: z.string().nullable().optional(),
  price_range_min: z.number().positive(),
  price_range_max: z.number().positive(),
  owner_id: z.number()
});

export type CreateVenueInput = z.infer<typeof createVenueInputSchema>;

export const searchVenuesInputSchema = z.object({
  keyword: z.string().optional(),
  category: categoryEnum.optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius_km: z.number().optional(),
  sort_by: z.enum(['rating', 'price_low', 'price_high', 'distance']).optional()
});

export type SearchVenuesInput = z.infer<typeof searchVenuesInputSchema>;

// Venue image schemas
export const venueImageSchema = z.object({
  id: z.number(),
  venue_id: z.number(),
  image_url: z.string(),
  caption: z.string().nullable(),
  display_order: z.number().int(),
  created_at: z.coerce.date()
});

export type VenueImage = z.infer<typeof venueImageSchema>;

// Review schemas
export const reviewSchema = z.object({
  id: z.number(),
  venue_id: z.number(),
  user_id: z.number(),
  rating: z.number().int().min(1).max(5),
  title: z.string().nullable(),
  content: z.string(),
  image_urls: z.array(z.string()),
  is_verified: z.boolean(),
  helpful_count: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Review = z.infer<typeof reviewSchema>;

export const createReviewInputSchema = z.object({
  venue_id: z.number(),
  rating: z.number().int().min(1).max(5),
  title: z.string().nullable().optional(),
  content: z.string().min(1),
  image_urls: z.array(z.string()).optional()
});

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

// Group schemas
export const groupSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  organizer_id: z.number(),
  event_date: z.coerce.date().nullable(),
  total_budget: z.number().nullable(),
  member_count: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Group = z.infer<typeof groupSchema>;

export const createGroupInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  event_date: z.coerce.date().nullable().optional(),
  total_budget: z.number().positive().nullable().optional()
});

export type CreateGroupInput = z.infer<typeof createGroupInputSchema>;

// Group member schemas
export const groupMemberSchema = z.object({
  id: z.number(),
  group_id: z.number(),
  user_id: z.number(),
  role: z.enum(['organizer', 'member']),
  joined_at: z.coerce.date()
});

export type GroupMember = z.infer<typeof groupMemberSchema>;

// Booking schemas
export const bookingSchema = z.object({
  id: z.number(),
  venue_id: z.number(),
  user_id: z.number(),
  group_id: z.number().nullable(),
  booking_date: z.coerce.date(),
  start_time: z.string(),
  end_time: z.string().nullable(),
  guest_count: z.number().int(),
  total_amount: z.number(),
  status: bookingStatusEnum,
  special_requests: z.string().nullable(),
  confirmation_code: z.string(),
  payment_status: z.enum(['pending', 'paid', 'refunded']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Booking = z.infer<typeof bookingSchema>;

export const createBookingInputSchema = z.object({
  venue_id: z.number(),
  group_id: z.number().nullable().optional(),
  booking_date: z.coerce.date(),
  start_time: z.string(),
  end_time: z.string().nullable().optional(),
  guest_count: z.number().int().positive(),
  special_requests: z.string().nullable().optional()
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

// Favorite schemas
export const favoriteSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  venue_id: z.number(),
  created_at: z.coerce.date()
});

export type Favorite = z.infer<typeof favoriteSchema>;

// Notification schemas
export const notificationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  type: notificationTypeEnum,
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).nullable(),
  is_read: z.boolean(),
  created_at: z.coerce.date()
});

export type Notification = z.infer<typeof notificationSchema>;

// Group message schemas
export const groupMessageSchema = z.object({
  id: z.number(),
  group_id: z.number(),
  user_id: z.number(),
  message: z.string(),
  created_at: z.coerce.date()
});

export type GroupMessage = z.infer<typeof groupMessageSchema>;

export const createGroupMessageInputSchema = z.object({
  group_id: z.number(),
  message: z.string().min(1)
});

export type CreateGroupMessageInput = z.infer<typeof createGroupMessageInputSchema>;

// Expense schemas
export const expenseSchema = z.object({
  id: z.number(),
  group_id: z.number(),
  payer_id: z.number(),
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  receipt_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Expense = z.infer<typeof expenseSchema>;

export const createExpenseInputSchema = z.object({
  group_id: z.number(),
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string(),
  receipt_url: z.string().nullable().optional()
});

export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;
