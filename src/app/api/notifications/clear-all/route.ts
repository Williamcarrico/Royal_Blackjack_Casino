// app/api/notifications/clear-all/route.ts

import { NextResponse } from 'next/server';
import { Notification } from '@/types/notifications';

// Mock database reference - in a real app this would be a database connection
// This should match the data structure in the main route.ts file
let notifications: Notification[] = [];

// DELETE - Clear all notifications
export async function DELETE() {
    // Clear all notifications
    notifications = [];

    return NextResponse.json({ success: true });
}