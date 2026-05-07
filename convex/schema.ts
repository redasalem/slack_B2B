import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  }).index("by_clerkId", ["clerkId"]),

  organizations: defineTable({
    clerkId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
  }).index("by_clerkId", ["clerkId"]),
});