// app/api/notifications/preferences/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { NotificationPreferences } from '@/types/notifications';

// Mock user preferences
let userPreferences: NotificationPreferences = {
    enabled: true,
    pushEnabled: true,
    emailEnabled: true,
    soundEnabled: true,
    showPreview: true,
    typePreferences: {
        bonus: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'low' },
        tournament: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'low' },
        promo: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'medium' },
        system: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'medium' },
        achievement: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'low' },
        game: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'medium' },
        account: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'medium' },
        vip: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'low' },
        reward: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'low' },
    },
};

// GET - Fetch user preferences
export async function GET() {
    return NextResponse.json(userPreferences);
}

// PUT - Update user preferences
export async function PUT(request: NextRequest) {
    try {
        const data: Partial<NotificationPreferences> = await request.json();

        // Merge with existing preferences
        userPreferences = {
            ...userPreferences,
            ...data,
            // If typePreferences exist in request, merge with existing
            typePreferences: data.typePreferences
                ? { ...userPreferences.typePreferences, ...data.typePreferences }
                : userPreferences.typePreferences
        };

        return NextResponse.json(userPreferences);
    } catch (error) {
        console.error('Error updating preferences:', error);
        return NextResponse.json(
            { error: 'Error updating preferences' },
            { status: 500 }
        );
    }
}