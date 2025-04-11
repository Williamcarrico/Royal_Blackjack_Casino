// app/api/notifications/[id]/archive/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/types/notifications';

// Placeholder for external notifications storage
// In a real app, this would be imported from a shared data layer
declare let notifications: Notification[];

// PUT - Archive a notification
export async function PUT(
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

    // Update status
    notification.status = 'archived';

    return NextResponse.json({ success: true });
}