import { NextResponse } from 'next/server'
import { db } from '@/db'

const enabled = !!process.env.LOG_AUTH_DEBUG;

export async function GET() {
    if (!enabled) {
        return NextResponse.json({ ok: false, message: 'disabled' }, { status: 404 });
    }

    try {
        const users = await db.user.count();
        const sessions = await db.session.count();
        return NextResponse.json({ ok: true, users, sessions });
    } catch (err: unknown) {
        console.error('DB diagnostics error', err);
        return NextResponse.json({ ok: false, error: (err as Error).message ?? String(err) }, { status: 500 });
    }
}
