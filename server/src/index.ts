
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema,
  loginInputSchema,
  searchVenuesInputSchema,
  createVenueInputSchema,
  createReviewInputSchema,
  createGroupInputSchema,
  createBookingInputSchema,
  createGroupMessageInputSchema,
  createExpenseInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { searchVenues } from './handlers/search_venues';
import { getVenueById } from './handlers/get_venue_by_id';
import { createVenue } from './handlers/create_venue';
import { createReview } from './handlers/create_review';
import { getVenueReviews } from './handlers/get_venue_reviews';
import { createGroup } from './handlers/create_group';
import { addGroupMember } from './handlers/add_group_member';
import { getUserGroups } from './handlers/get_user_groups';
import { createBooking } from './handlers/create_booking';
import { getUserBookings } from './handlers/get_user_bookings';
import { cancelBooking } from './handlers/cancel_booking';
import { addFavorite } from './handlers/add_favorite';
import { removeFavorite } from './handlers/remove_favorite';
import { getUserFavorites } from './handlers/get_user_favorites';
import { createGroupMessage } from './handlers/create_group_message';
import { getGroupMessages } from './handlers/get_group_messages';
import { createExpense } from './handlers/create_expense';
import { getGroupExpenses } from './handlers/get_group_expenses';
import { getUserNotifications } from './handlers/get_user_notifications';
import { markNotificationRead } from './handlers/mark_notification_read';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User authentication
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Venue management
  searchVenues: publicProcedure
    .input(searchVenuesInputSchema)
    .query(({ input }) => searchVenues(input)),

  getVenueById: publicProcedure
    .input(z.object({ venueId: z.number() }))
    .query(({ input }) => getVenueById(input.venueId)),

  createVenue: publicProcedure
    .input(createVenueInputSchema)
    .mutation(({ input }) => createVenue(input)),

  // Reviews
  createReview: publicProcedure
    .input(createReviewInputSchema.extend({ userId: z.number() }))
    .mutation(({ input }) => createReview(input, input.userId)),

  getVenueReviews: publicProcedure
    .input(z.object({ venueId: z.number() }))
    .query(({ input }) => getVenueReviews(input.venueId)),

  // Group management
  createGroup: publicProcedure
    .input(createGroupInputSchema.extend({ organizerId: z.number() }))
    .mutation(({ input }) => createGroup(input, input.organizerId)),

  addGroupMember: publicProcedure
    .input(z.object({ groupId: z.number(), userId: z.number() }))
    .mutation(({ input }) => addGroupMember(input.groupId, input.userId)),

  getUserGroups: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserGroups(input.userId)),

  // Bookings
  createBooking: publicProcedure
    .input(createBookingInputSchema.extend({ userId: z.number() }))
    .mutation(({ input }) => createBooking(input, input.userId)),

  getUserBookings: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserBookings(input.userId)),

  cancelBooking: publicProcedure
    .input(z.object({ bookingId: z.number(), userId: z.number() }))
    .mutation(({ input }) => cancelBooking(input.bookingId, input.userId)),

  // Favorites
  addFavorite: publicProcedure
    .input(z.object({ userId: z.number(), venueId: z.number() }))
    .mutation(({ input }) => addFavorite(input.userId, input.venueId)),

  removeFavorite: publicProcedure
    .input(z.object({ userId: z.number(), venueId: z.number() }))
    .mutation(({ input }) => removeFavorite(input.userId, input.venueId)),

  getUserFavorites: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserFavorites(input.userId)),

  // Group messaging
  createGroupMessage: publicProcedure
    .input(createGroupMessageInputSchema.extend({ userId: z.number() }))
    .mutation(({ input }) => createGroupMessage(input, input.userId)),

  getGroupMessages: publicProcedure
    .input(z.object({ groupId: z.number() }))
    .query(({ input }) => getGroupMessages(input.groupId)),

  // Expense tracking
  createExpense: publicProcedure
    .input(createExpenseInputSchema.extend({ payerId: z.number() }))
    .mutation(({ input }) => createExpense(input, input.payerId)),

  getGroupExpenses: publicProcedure
    .input(z.object({ groupId: z.number() }))
    .query(({ input }) => getGroupExpenses(input.groupId)),

  // Notifications
  getUserNotifications: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserNotifications(input.userId)),

  markNotificationRead: publicProcedure
    .input(z.object({ notificationId: z.number(), userId: z.number() }))
    .mutation(({ input }) => markNotificationRead(input.notificationId, input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`BB Bachelor Party App TRPC server listening at port: ${port}`);
}

start();
