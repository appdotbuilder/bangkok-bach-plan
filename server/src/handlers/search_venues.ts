
import { db } from '../db';
import { venuesTable } from '../db/schema';
import { type SearchVenuesInput, type Venue } from '../schema';
import { and, or, ilike, gte, lte, eq, desc, asc, SQL } from 'drizzle-orm';

export async function searchVenues(input: SearchVenuesInput): Promise<Venue[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Always filter for active venues
    conditions.push(eq(venuesTable.is_active, true));

    // Keyword search (name or description)
    if (input.keyword) {
      const keywordCondition = or(
        ilike(venuesTable.name, `%${input.keyword}%`),
        ilike(venuesTable.description, `%${input.keyword}%`)
      );
      if (keywordCondition) {
        conditions.push(keywordCondition);
      }
    }

    // Category filter
    if (input.category) {
      conditions.push(eq(venuesTable.category, input.category));
    }

    // Price range filters - check for overlap with user's budget
    if (input.min_price !== undefined) {
      // User wants venues where the maximum price is at least their minimum budget
      conditions.push(gte(venuesTable.price_range_max, input.min_price.toString()));
    }

    if (input.max_price !== undefined) {
      // User wants venues where the minimum price is at most their maximum budget
      conditions.push(lte(venuesTable.price_range_min, input.max_price.toString()));
    }

    // Location-based filtering (simple bounding box for now)
    if (input.latitude !== undefined && input.longitude !== undefined && input.radius_km !== undefined) {
      // Simple bounding box calculation (approximate)
      const latRange = input.radius_km / 111; // ~111 km per degree latitude
      const lonRange = input.radius_km / (111 * Math.cos(input.latitude * Math.PI / 180));

      conditions.push(
        and(
          gte(venuesTable.latitude, input.latitude - latRange),
          lte(venuesTable.latitude, input.latitude + latRange),
          gte(venuesTable.longitude, input.longitude - lonRange),
          lte(venuesTable.longitude, input.longitude + lonRange)
        )!
      );
    }

    // Determine sort order
    let orderBy;
    if (input.sort_by) {
      switch (input.sort_by) {
        case 'rating':
          orderBy = desc(venuesTable.rating);
          break;
        case 'price_low':
          orderBy = asc(venuesTable.price_range_min);
          break;
        case 'price_high':
          orderBy = desc(venuesTable.price_range_max);
          break;
        case 'distance':
          // For distance sorting, we'd need to calculate actual distance
          // For now, just order by id as a placeholder
          orderBy = asc(venuesTable.id);
          break;
        default:
          orderBy = desc(venuesTable.rating);
          break;
      }
    } else {
      // Default sorting by rating
      orderBy = desc(venuesTable.rating);
    }

    // Build the complete query
    const results = await db
      .select()
      .from(venuesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(orderBy)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(venue => ({
      ...venue,
      price_range_min: parseFloat(venue.price_range_min),
      price_range_max: parseFloat(venue.price_range_max)
    }));
  } catch (error) {
    console.error('Venue search failed:', error);
    throw error;
  }
}
