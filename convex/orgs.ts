import { v } from "convex/values";
import { mutation } from "convex/server";

/**
 * Public mutation to upsert an organization record from Clerk webhook data.
 * Idempotent via clerkId index.
 * Syncs plan, billing, and Stripe IDs.
 */
export const upsertOrg = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
    billingStatus: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, name, slug, plan, billingStatus, stripeCustomerId, stripeSubscriptionId }) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (plan !== undefined) updates.plan = plan;
    if (billingStatus !== undefined) updates.billingStatus = billingStatus;
    if (stripeCustomerId !== undefined) updates.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId !== undefined) updates.stripeSubscriptionId = stripeSubscriptionId;

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return { _id: existing._id, created: false };
    }

    const orgId = await ctx.db.insert("organizations", {
      clerkId,
      name,
      slug,
      plan: plan ?? "free",
      billingStatus,
      stripeCustomerId,
      stripeSubscriptionId,
    });
    return { _id: orgId, created: true };
  },
});
