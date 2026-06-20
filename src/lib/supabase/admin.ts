// Mock Supabase admin client — no external dependencies

export function createAdminClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }
}
