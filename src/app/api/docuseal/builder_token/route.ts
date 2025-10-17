import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { template_id } = body;

    const payload: { user_email: string; template_id?: number } = {
      user_email: process.env.DOCUSEAL_USER_EMAIL || '',
    };

    if (template_id) {
      payload.template_id = template_id;
    }

    const token = jwt.sign(payload, process.env.DOCUSEAL_API_KEY || '', { expiresIn: '1h' });

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
