import { NextRequest, NextResponse } from 'next/server';
import { SdkResponse } from '@svix/core';
import { webhookMiddleware } from '@svix/nestjs'; // or your preferred verifier
import { convex } from '../../../lib/convex';
import { upsertFromClerk } from '../../../convex/users';
import { upsertFromClerk as orgUpsert } from '../../../convex/orgs';

export async function POST(req: NextRequest) {
  // 1️⃣ Verify Svix signature (official method)
  const payload = await req.text();
  let event: any;
  try {
    // Use svix-native for verification
    const signature = req.headers.get('svix-signature')!;
    const timestamp = req.headers.get('svix-timestamp')!;
    const svixWebhook = new (await import('@svix/core')).Webhook(
      process.env.CLERK_WEBHOOK_SECRET!
    );
    event = svixWebhook.verify(payload, {
      'svix-id': req.headers.get('svix-id')!,
      'svix-signature': signature,
      'svix-timestamp': timestamp
    }) as any;
  } catch (err: any) {
    console.error('Webhook verification failed:', err.message);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  // 2️⃣ Dispatch based on event type
  const { type, data } = event;
  try {
    if (type === 'user.created' || type === 'user.updated') {
      await upsertFromClerk.run({
        clerkId: data.id,
        email: data.email_addresses?.[0]?.email_address,
        firstName: data.first_name,
        lastName: data.last_name
      });
    } else if (type === 'organization.created' || type === 'organization.updated') {
      await orgUpsert.run({
        clerkId: data.id,
        name: data.name,
        slug: data.slug
      });
    }
  } catch (err) {
    console.error('Mutation execution failed:', err);
    return new NextResponse('Server error', { status: 500 });
  }

  return new NextResponse('Webhook processed', { status: 200 });
}