
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean, 
  pgEnum,
  real,
  jsonb,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const categoryEnum = pgEnum('category', [
  'nightlife',
  'hotels', 
  'daytime_activities',
  'evening_activities',
  'transport',
  'restaurants'
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed', 
  'cancelled',
  'completed'
]);

export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'venue_owner']);

export const notificationTypeEnum = pgEnum('notification_type', [
  'booking_update',
  'group_message',
  'price_alert',
  'payment_reminder'
]);

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'refunded']);

export const groupRoleEnum = pgEnum('group_role', ['organizer', 'member']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone: text('phone'),
  profile_image_url: text('profile_image_url'),
  role: userRoleEnum('role').notNull().default('user'),
  is_verified: boolean('is_verified').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Venues table
export const venuesTable = pgTable('venues', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: categoryEnum('category').notNull(),
  address: text('address').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  phone: text('phone'),
  email: text('email'),
  website_url: text('website_url'),
  price_range_min: numeric('price_range_min', { precision: 10, scale: 2 }).notNull(),
  price_range_max: numeric('price_range_max', { precision: 10, scale: 2 }).notNull(),
  rating: real('rating').notNull().default(0),
  review_count: integer('review_count').notNull().default(0),
  is_active: boolean('is_active').notNull().default(true),
  thumbnail_image_url: text('thumbnail_image_url'),
  owner_id: integer('owner_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Venue images table
export const venueImagesTable = pgTable('venue_images', {
  id: serial('id').primaryKey(),
  venue_id: integer('venue_id').notNull(),
  image_url: text('image_url').notNull(),
  caption: text('caption'),
  display_order: integer('display_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Reviews table
export const reviewsTable = pgTable('reviews', {
  id: serial('id').primaryKey(),
  venue_id: integer('venue_id').notNull(),
  user_id: integer('user_id').notNull(),
  rating: integer('rating').notNull(),
  title: text('title'),
  content: text('content').notNull(),
  image_urls: jsonb('image_urls').notNull().default([]),
  is_verified: boolean('is_verified').notNull().default(false),
  helpful_count: integer('helpful_count').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserVenueReview: unique().on(table.user_id, table.venue_id),
}));

// Groups table
export const groupsTable = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  organizer_id: integer('organizer_id').notNull(),
  event_date: timestamp('event_date'),
  total_budget: numeric('total_budget', { precision: 10, scale: 2 }),
  member_count: integer('member_count').notNull().default(1),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Group members table
export const groupMembersTable = pgTable('group_members', {
  id: serial('id').primaryKey(),
  group_id: integer('group_id').notNull(),
  user_id: integer('user_id').notNull(),
  role: groupRoleEnum('role').notNull().default('member'),
  joined_at: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  uniqueGroupUser: unique().on(table.group_id, table.user_id),
}));

// Bookings table
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  venue_id: integer('venue_id').notNull(),
  user_id: integer('user_id').notNull(),
  group_id: integer('group_id'),
  booking_date: timestamp('booking_date').notNull(),
  start_time: text('start_time').notNull(),
  end_time: text('end_time'),
  guest_count: integer('guest_count').notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum('status').notNull().default('pending'),
  special_requests: text('special_requests'),
  confirmation_code: text('confirmation_code').notNull().unique(),
  payment_status: paymentStatusEnum('payment_status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Favorites table
export const favoritesTable = pgTable('favorites', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  venue_id: integer('venue_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserVenueFavorite: unique().on(table.user_id, table.venue_id),
}));

// Notifications table
export const notificationsTable = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  is_read: boolean('is_read').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Group messages table
export const groupMessagesTable = pgTable('group_messages', {
  id: serial('id').primaryKey(),
  group_id: integer('group_id').notNull(),
  user_id: integer('user_id').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Expenses table
export const expensesTable = pgTable('expenses', {
  id: serial('id').primaryKey(),
  group_id: integer('group_id').notNull(),
  payer_id: integer('payer_id').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  receipt_url: text('receipt_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  venues: many(venuesTable),
  reviews: many(reviewsTable),
  bookings: many(bookingsTable),
  favorites: many(favoritesTable),
  notifications: many(notificationsTable),
  groups: many(groupsTable),
  groupMemberships: many(groupMembersTable),
  groupMessages: many(groupMessagesTable),
  expenses: many(expensesTable),
}));

export const venuesRelations = relations(venuesTable, ({ one, many }) => ({
  owner: one(usersTable, {
    fields: [venuesTable.owner_id],
    references: [usersTable.id],
  }),
  images: many(venueImagesTable),
  reviews: many(reviewsTable),
  bookings: many(bookingsTable),
  favorites: many(favoritesTable),
}));

export const venueImagesRelations = relations(venueImagesTable, ({ one }) => ({
  venue: one(venuesTable, {
    fields: [venueImagesTable.venue_id],
    references: [venuesTable.id],
  }),
}));

export const reviewsRelations = relations(reviewsTable, ({ one }) => ({
  venue: one(venuesTable, {
    fields: [reviewsTable.venue_id],
    references: [venuesTable.id],
  }),
  user: one(usersTable, {
    fields: [reviewsTable.user_id],
    references: [usersTable.id],
  }),
}));

export const groupsRelations = relations(groupsTable, ({ one, many }) => ({
  organizer: one(usersTable, {
    fields: [groupsTable.organizer_id],
    references: [usersTable.id],
  }),
  members: many(groupMembersTable),
  bookings: many(bookingsTable),
  messages: many(groupMessagesTable),
  expenses: many(expensesTable),
}));

export const groupMembersRelations = relations(groupMembersTable, ({ one }) => ({
  group: one(groupsTable, {
    fields: [groupMembersTable.group_id],
    references: [groupsTable.id],
  }),
  user: one(usersTable, {
    fields: [groupMembersTable.user_id],
    references: [usersTable.id],
  }),
}));

export const bookingsRelations = relations(bookingsTable, ({ one }) => ({
  venue: one(venuesTable, {
    fields: [bookingsTable.venue_id],
    references: [venuesTable.id],
  }),
  user: one(usersTable, {
    fields: [bookingsTable.user_id],
    references: [usersTable.id],
  }),
  group: one(groupsTable, {
    fields: [bookingsTable.group_id],
    references: [groupsTable.id],
  }),
}));

export const favoritesRelations = relations(favoritesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [favoritesTable.user_id],
    references: [usersTable.id],
  }),
  venue: one(venuesTable, {
    fields: [favoritesTable.venue_id],
    references: [venuesTable.id],
  }),
}));

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.user_id],
    references: [usersTable.id],
  }),
}));

export const groupMessagesRelations = relations(groupMessagesTable, ({ one }) => ({
  group: one(groupsTable, {
    fields: [groupMessagesTable.group_id],
    references: [groupsTable.id],
  }),
  user: one(usersTable, {
    fields: [groupMessagesTable.user_id],
    references: [usersTable.id],
  }),
}));

export const expensesRelations = relations(expensesTable, ({ one }) => ({
  group: one(groupsTable, {
    fields: [expensesTable.group_id],
    references: [groupsTable.id],
  }),
  payer: one(usersTable, {
    fields: [expensesTable.payer_id],
    references: [usersTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  venues: venuesTable,
  venueImages: venueImagesTable,
  reviews: reviewsTable,
  groups: groupsTable,
  groupMembers: groupMembersTable,
  bookings: bookingsTable,
  favorites: favoritesTable,
  notifications: notificationsTable,
  groupMessages: groupMessagesTable,
  expenses: expensesTable,
};
