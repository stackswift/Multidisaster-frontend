import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const room = searchParams.get('room') || 'swarm-command-room';
    const identity = searchParams.get('identity') || `operator_${Math.floor(Math.random() * 10000)}`;

    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: '1h',
    });

    at.addGrant({
      roomJoin: true,
      room,
      canPublish: false,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token, identity, room });
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate LiveKit token' },
      { status: 500 }
    );
  }
}
