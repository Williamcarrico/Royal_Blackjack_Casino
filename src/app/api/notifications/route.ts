// app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Notification, CreateNotificationRequest } from '@/types/notifications';
import { v4 as uuidv4 } from 'uuid';

// Mock database
let notifications: Notification[] = [
    {
        id: '1',
        title: 'Daily Bonus Ready!',
        message: 'Claim your 1,000 chip daily bonus now',
        type: 'bonus',
        priority: 'medium',
        status: 'unread',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
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
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        actionUrl: '/tournaments/weekend',
        actionLabel: 'Register'
    },
    {
        id: '3',
        title: 'New Strategy Guide',
        message: 'Check out our updated blackjack strategy guide',
        type: 'system',
        priority: 'low',
        status: 'read',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        actionUrl: '/strategy-guide',
        actionLabel: 'View Guide'
    },
    {
        id: '4',
        title: 'Weekly Promotion',
        message: 'Double chips on all deposits this weekend!',
        type: 'promo',
        priority: 'medium',
        status: 'read',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        actionUrl: '/promotions/weekend',
        actionLabel: 'View Promotion'
    },
    {
        id: '5',
        title: 'Achievement Unlocked',
        message: 'Royal Flush: Win 5 blackjack hands in a row',
        type: 'achievement',
        priority: 'low',
        status: 'read',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        actionUrl: '/achievements',
        actionLabel: 'View Achievements'
    },
];

// GET - Fetch all notifications
export async function GET() {
    // Sort notifications by created date (newest first)
    const sortedNotifications = [...notifications].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(sortedNotifications);
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
    try {
        const data: CreateNotificationRequest = await request.json();

        const newNotification: Notification = {
            id: uuidv4(),
            title: data.title,
            message: data.message,
            type: data.type,
            priority: data.priority || 'medium',
            status: 'unread',
            createdAt: new Date().toISOString(),
            expiresAt: data.expiresAt,
            imageUrl: data.imageUrl,
            actionUrl: data.actionUrl,
            actionLabel: data.actionLabel,
            metadata: data.metadata
        };

        // Add to our mock database
        notifications = [newNotification, ...notifications];

        return NextResponse.json(newNotification, { status: 201 });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Error creating notification' },
            { status: 500 }
        );
    }
}
