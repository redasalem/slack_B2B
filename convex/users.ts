import { v } from "convex/values";
import { mutation } from "convex/server";

// Create or update user from Clerk webhook (user.created / user.updated)
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string())
  },
  handler: async (ctx, { clerkId, email, firstName, lastName }) => {
    // Query existing user by clerkId using the index
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email,
        firstName,
        lastName
      });
    } else {
      // Insert new user
      await ctx.db.insert("users", {
        clerkId,
        email,
        firstName,
        lastName
      });
    }
  }
});

export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string())
  },
  handler: async (ctx, { clerkId, email, firstName, lastName }) => {
    // Query existing user by clerkId using the index
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email,
        firstName,
        lastName
      });
    } else {
      // Insert new user (in case update event arrives before create)
      await ctx.db.insert("users", {
        clerkId,
        email,
        firstName,
        lastName
      });
    }
  }
});