// app/api/notifications/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/types/notifications';

// Placeholder for external notifications storage
// In a real app, this would be imported from a shared data layer
// This is a mock implementation for this example
declare let notifications: Notification[];

// GET - Fetch a specific notification
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    const notification = notifications.find(n => n.id === id);

    if (!notification) {
        return NextResponse.json(
            { error: 'Notification not found' },
            { status: 404 }
        );
    }

    return NextResponse.json(notification);
}

// DELETE - Delete a notification
export async function DELETE(
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

    // Remove notification
    notifications.splice(index, 1);

    return NextResponse.json({ success: true });
}
