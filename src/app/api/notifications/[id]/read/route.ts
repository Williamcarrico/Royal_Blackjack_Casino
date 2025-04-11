// app/api/notifications/[id]/read/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/types/notifications';

// Mock database - in a real application, this would be a database connection
// For this example, we're creating a simplified version that matches the main route
const notifications: Notification[] = [
    {
        id: '1',
        title: 'Daily Bonus Ready!',
        message: 'Claim your 1,000 chip daily bonus now',
        type: 'bonus',
        priority: 'medium',
        status: 'unread',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        actionUrl: '/bonuses/daily',
        actionLabel: 'Claim Now'
    },
    {
        id: '2',
        title: 'Weekend Tournament',
        message: 'Join our high-stakes tournament this weekend',
        type: 'tournament',
        priority: 'medium',
        status: 'unread',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actionUrl: '/tournaments/weekend',
        actionLabel: 'Register'
    },
    // Additional notifications would be here in the real implementation
];

// PUT - Mark notification as read
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    const index = notifications.findIndex((n: Notification) => n.id === id);
    if (index === -1) {
        return NextResponse.json(
            { error: 'Notification not found' },
            { status: 404 }
        );
    }

    // Update status - in a real app, this would update a database
    // For this mock, we're treating the const array as mutable for demonstration
    if (notifications[index]) {
        notifications[index].status = 'read';
    }

    return NextResponse.json({ success: true });
}