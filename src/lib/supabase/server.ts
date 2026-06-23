// Mock Supabase server client — no external dependencies

export async function createClient() {
  return {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'admin@example.test',
          },
        },
        error: null,
      }),
      exchangeCodeForSession: async () => ({ data: {}, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
        order: () => ({ data: [], error: null }),
      }),
    }),
    storage: {
      from: () => ({
        download: async () => ({ data: null, error: 'Mock: no storage' }),
      }),
    },
    rpc: async () => ({ data: null, error: null }),
  }
}
