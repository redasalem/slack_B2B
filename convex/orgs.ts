import { v } from "convex/values";
import { mutation } from "convex/server";

export const upsertFromClerk = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    slug: v.optional(v.string())
  },
  handler: async (ctx, { clerkId, name, slug }) => {
    // Check if organization already exists
    const existingOrg = await ctx.db
      .query('organizations')
      .withFilter('clerkId', clerkId)
      .fetch();

    if (existingOrg.length > 0) {
      // Update existing organization
      await ctx.db.update(existingOrg[0]._id, {
        name,
        slug
      });
    } else {
      // Insert new organization
      await ctx.db.insert('organizations', {
        clerkId,
        name,
        slug
      });
    }
  }
});