// app/api/notifications/[id]/read/route.ts

import { NextRequest, NextResponse } from 'next/server';

// PUT - Mark notification as read
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    const index = notifications.findIndex(n => n.id === id);
    if (index === -1) {
        return NextResponse.json(
            { error: 'Notification not found' },
            { status: 404 }
        );
    }

    // Update status
    notifications[index] = {
        ...notifications[index],
        status: 'read'
    };

    return NextResponse.json({ success: true });
}