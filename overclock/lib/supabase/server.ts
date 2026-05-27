// Server-only Supabase client helpers shared by Server Components, server
// actions, and route handlers. Keep this module free of client-only imports.

import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // ignore if called from a Server Component
                    }
                },
            },
        }
    );
}

// Returns the same client instance within a single request, avoiding repeated
// cookie reads when multiple data functions call createClient() in parallel.
export const getServerClient = cache(createClient);
