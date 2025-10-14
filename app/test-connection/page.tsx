import { createClient } from '@/lib/supabase/server'

export default async function TestConnection() {
  const supabase = await createClient()
  
  // Test database connection
  const { data: tables, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-4">
        <h1 className="text-3xl font-bold">Supabase Connection Test</h1>
        
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Status:</h2>
          {error ? (
            <div className="text-red-600">
              ❌ Error: {error.message}
            </div>
          ) : (
            <div className="text-green-600">
              ✅ Connected successfully!
            </div>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Environment Variables:</h2>
          <ul className="space-y-1 text-sm">
            <li>
              SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
            </li>
            <li>
              SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
            </li>
          </ul>
        </div>

        <div className="text-sm text-muted-foreground">
          Visit <a href="/" className="underline">home page</a> when ready
        </div>
      </div>
    </div>
  )
}

