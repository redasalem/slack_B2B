import { v } from "convex/values";
import { mutation } from "convex/server";

/**
 * Public mutation to upsert a user record from Clerk webhook data.
 * It is idempotent – the unique clerkId index guarantees a single row per user.
 * Handles plan and billing status syncing.
 */
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
    billingStatus: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, email, firstName, lastName, plan, billingStatus }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    const updates: Record<string, any> = {};
    if (email !== undefined) updates.email = email;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (plan !== undefined) updates.plan = plan;
    if (billingStatus !== undefined) updates.billingStatus = billingStatus;

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return { _id: existing._id, created: false };
    }

    const userId = await ctx.db.insert("users", {
      clerkId,
      email,
      firstName,
      lastName,
      plan: plan ?? "free",
      billingStatus,
    });
    return { _id: userId, created: true };
  },
});
