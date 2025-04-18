# Royal Blackjack Casino - Supabase Auth Setup

This guide explains how to set up the Supabase authentication system with age verification (21+) and country validation for the Royal Blackjack Casino application.

## Prerequisites

1. A Supabase account and project
2. Access to the Supabase dashboard for your project
3. Basic knowledge of SQL and Supabase

## Schema Setup Instructions

### 1. Run SQL Migration

1. Log in to your Supabase dashboard
2. Go to the "SQL Editor" section
3. Click "New Query"
4. Copy and paste the contents of the `supabase-schema.sql` file from this repository
5. Click "Run" to execute the SQL

This script will:
- Create the `countries` table with country codes and age restrictions
- Create the `user_profiles` table with age verification (21+ requirement)
- Create the `user_preferences` table for user settings
- Set up appropriate relationships between tables
- Configure Row Level Security (RLS) policies

### 2. Configure Supabase Auth

1. In your Supabase dashboard, go to "Authentication" → "Settings"
2. Under "Email Auth", make sure "Enable Email Signup" is checked
3. If you want to require email verification (recommended):
   - Check "Enable email confirmations"
   - Set "Mailer" to your preferred email service

### 3. Update Environment Variables

Ensure your application's environment variables are properly configured to connect to Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Age Verification Implementation

The schema includes several levels of age verification:

1. **Frontend validation**:
   - The sign-up form validates that users are at least 21 years old
   - Uses client-side JavaScript to check date of birth

2. **Database constraints**:
   - The `user_profiles` table has a check constraint to ensure date_of_birth is at least 21 years ago
   - This adds server-side validation as a second layer of security

3. **Country-based age restrictions**:
   - The `countries` table includes a `min_age` field to support different age restrictions by country
   - This allows for region-specific compliance

## Country Validation

Countries are stored in a dedicated table with:
- ISO country codes
- Country names
- An `allowed` flag to control which countries can access the platform
- Country-specific minimum age requirements

## Testing the Setup

After running the migration:

1. Try to create a new user through your application's sign-up form
2. Verify that users under 21 cannot sign up
3. Check that the country selection is working properly
4. Confirm that the user's profile data is properly saved in the `user_profiles` table

## Troubleshooting

If you encounter issues:

1. **SQL Migration Errors**:
   - Check for syntax errors in the SQL
   - Make sure the tables don't already exist

2. **Auth Signup Problems**:
   - Verify your Supabase project's auth settings
   - Check that email sending is properly configured

3. **Profile Creation Failures**:
   - Look for constraint violations (e.g., duplicate usernames)
   - Check that the age validation is working properly

## Security Considerations

- The schema enforces Row Level Security (RLS) so users can only access their own data
- Age verification is enforced both client-side and server-side
- Country restrictions allow compliance with regional gambling laws

## Advanced Supabase Integration

This project has been optimized with several additional Supabase features:

### Middleware Protection

A Next.js middleware has been added to protect routes that require authentication. The middleware automatically:

- Checks for valid Supabase sessions
- Redirects unauthenticated users to the login page
- Preserves the originally requested URL for post-login redirection

### Optimized Client Architecture

The Supabase client implementation follows best practices:
- Server-side client with cookie handling for SSR
- Browser-side client for client components
- Type-safe database operations with TypeScript interfaces

### Utility Hooks and Functions

Several custom utilities have been added to make working with Supabase easier:

1. **useSupabase hook**: Easy access to the Supabase client in React components
2. **supabaseUtils**: Functions for standardized error handling and data fetching
3. **RealtimeService**: Singleton service for managing realtime subscriptions

### Best Practices Implemented

- Consistent error handling
- Proper type definitions
- Separation of concerns with dedicated services
- Environment variable management

## Usage Examples

### Fetching Data

```typescript
import { withErrorHandling } from '@/lib/utils/supabaseUtils'
import { createServerClient } from '@/lib/supabase'

async function getUserProfile(userId: string) {
  const supabase = createServerClient()
  return withErrorHandling(
    () => supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    'Failed to load user profile'
  )
}
```

### Using Realtime Subscriptions

```typescript
import { RealtimeService } from '@/services/supabase/realtime-service'

// In a React component
useEffect(() => {
  const realtimeService = RealtimeService.getInstance()
  const subscriptionId = realtimeService.subscribeToRow(
    'user_profiles',
    userId,
    'UPDATE',
    (payload) => {
      console.log('Profile updated:', payload)
      // Update UI state
    }
  )

  return () => {
    realtimeService.unsubscribe(subscriptionId)
  }
}, [userId])
```

### Client Components

```typescript
import { useSupabase } from '@/lib/hooks/useSupabase'

function ProfileComponent() {
  const supabase = useSupabase()

  useEffect(() => {
    if (!supabase) return

    // Fetch data or set up subscriptions
  }, [supabase])

  // Component rendering
}
```

## Next Steps

To further enhance the Supabase implementation:

1. Consider implementing RLS (Row Level Security) policies for improved data security
2. Add database migrations for schema versioning
3. Implement edge functions for server-side business logic
4. Set up Supabase Storage for file uploads
5. Configure webhook integrations if needed