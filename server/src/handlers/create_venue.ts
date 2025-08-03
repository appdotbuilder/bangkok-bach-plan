
import { db } from '../db';
import { venuesTable, usersTable } from '../db/schema';
import { type CreateVenueInput, type Venue } from '../schema';
import { eq } from 'drizzle-orm';

export const createVenue = async (input: CreateVenueInput): Promise<Venue> => {
  try {
    // Verify that the owner exists and has venue_owner or admin role
    const owner = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.owner_id))
      .execute();

    if (owner.length === 0) {
      throw new Error('Owner not found');
    }

    if (owner[0].role !== 'venue_owner' && owner[0].role !== 'admin') {
      throw new Error('User does not have permission to create venues');
    }

    // Insert venue record
    const result = await db.insert(venuesTable)
      .values({
        name: input.name,
        description: input.description,
        category: input.category,
        address: input.address,
        latitude: input.latitude || null,
        longitude: input.longitude || null,
        phone: input.phone || null,
        email: input.email || null,
        website_url: input.website_url || null,
        price_range_min: input.price_range_min.toString(),
        price_range_max: input.price_range_max.toString(),
        owner_id: input.owner_id
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const venue = result[0];
    return {
      ...venue,
      price_range_min: parseFloat(venue.price_range_min),
      price_range_max: parseFloat(venue.price_range_max)
    };
  } catch (error) {
    console.error('Venue creation failed:', error);
    throw error;
  }
};
