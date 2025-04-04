// app/api/notifications/read-all/route.ts

import { NextResponse } from 'next/server';
import { Notification } from '@/types/notifications';

// Mock database - in a real app this would be imported from a database
// This is just a simplified example for demonstration
let notifications: Notification[] = [];

// PUT - Mark all notifications as read
export async function PUT() {
    try {
        // In a real application, this would update a database
        // For this mock API, we mark all notifications as read
        notifications = notifications.map(notification => ({
            ...notification,
            status: 'read'
        }));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json({
            error: 'Failed to mark notifications as read'
        }, { status: 500 });
    }
}