import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from '@svix/js';
import { convex } from '../../../lib/convex';

// Import Convex internal mutations (these are the *internal* functions defined in convex/*.ts)
import { internal } from '../../../convex/_generated/api';

/**
 * Verify the Svix signature. Throws if verification fails.
 */
function verifySvix(req: NextRequest): any {
  const payload = req.body?.toString(); // NextRequest doesn't expose raw text directly; we use async read below.
  // We'll read the body asynchronously below because NextRequest's .text() returns a promise.
  // This function is just a placeholder for type clarity.
  return null;
}

export async function POST(req: NextRequest) {
  // 1️⃣ Read raw payload for verification (must be exact bytes)
  const rawBody = await req.text();

  // 2️⃣ Verify Svix signature using secret from env
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('Missing Svix headers');
    return new NextResponse('Missing signature headers', { status: 400 });
  }

  let event: any;
  try {
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    event = webhook.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as any;
  } catch (err: any) {
    console.error('Svix verification failed:', err);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  const { type, data } = event;

  try {
    // Dispatch based on event type. All mutations are internal (no auth needed) and are idempotent.
    switch (type) {
      case 'user.created':
        await convex.mutation(internal.users.syncUserCreated, {
          clerkId: data.id,
          email: data.email_addresses?.[0]?.email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          publicMetadata: data.public_metadata,
          privateMetadata: data.private_metadata,
        });
        break;
      case 'user.updated':
        await convex.mutation(internal.users.syncUserUpdated, {
          clerkId: data.id,
          email: data.email_addresses?.[0]?.email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          publicMetadata: data.public_metadata,
          privateMetadata: data.private_metadata,
        });
        break;
      case 'organization.created':
        await convex.mutation(internal.orgs.syncOrgCreated, {
          clerkId: data.id,
          name: data.name,
          slug: data.slug,
          publicMetadata: data.public_metadata,
          privateMetadata: data.private_metadata,
          features: data.features,
        });
        break;
      case 'organization.updated':
        await convex.mutation(internal.orgs.syncOrgUpdated, {
          clerkId: data.id,
          name: data.name,
          slug: data.slug,
          publicMetadata: data.public_metadata,
          privateMetadata: data.private_metadata,
          features: data.features,
        });
        break;
      default:
        // Ignoring other events is fine – respond 200 so Clerk doesn't retry.
        console.info('Ignored Clerk webhook event type:', type);
    }
  } catch (err) {
    console.error('Error processing Clerk webhook:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }

  return new NextResponse('OK', { status: 200 });
}

export const runtime = 'nodejs'; // Ensure we run in the Node.js runtime for svix
