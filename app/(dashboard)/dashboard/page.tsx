import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user?.email}
            </p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign Out
            </Button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Your saved notes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
              <CardDescription>Uploaded files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
              <CardDescription>Active reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🎉 Welcome to Cortex!</CardTitle>
            <CardDescription>Your AI-powered learning assistant is ready</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You've successfully set up your Cortex account. Here's what you can do next:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Create your first note</li>
              <li>Upload files and documents</li>
              <li>Set up reminders</li>
              <li>Chat with AI about your content</li>
            </ul>
            <div className="pt-4">
              <Button className="mr-2">Create Note</Button>
              <Button variant="outline">Upload File</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


