// Mock Supabase browser client — no external dependencies

const PLACEHOLDER_URL = '/placeholder.svg'

export function createClient() {
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
      signInWithPassword: async () => ({ data: {}, error: null }),
      signUp: async () => ({ data: {}, error: null }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      onAuthStateChange: (
        _callback: (event: string, session: unknown) => void
      ) => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          then: async () => ({ data: [], error: null }),
        }),
        order: () => ({ data: [], error: null }),
      }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({
          data: { publicUrl: PLACEHOLDER_URL },
        }),
      }),
    },
  }
}
