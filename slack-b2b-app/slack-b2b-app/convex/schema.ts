import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    creatorClerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    memberIds: v.array(v.string()),
  }),
  teams: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    memberIds: v.array(v.string()),
  }),
  channels: defineTable({
    teamId: v.id("teams"),
    name: v.string(),
    type: v.union(v.literal("public"), v.literal("private")),
  }),
  messages: defineTable({
    channelId: v.id("channels"),
    authorClerkId: v.string(),
    body: v.string(),
  }),
  subscriptions: defineTable({
    clerkOrgId: v.string(),
    plan: v.string(),
    stripeSubscriptionId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
  }),
});
