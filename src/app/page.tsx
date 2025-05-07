import Link from 'next/link';

export const metadata = {
  title: 'AetherLMS - Learning Management System',
  description: 'A modern learning management system for the next generation',
};

// Force this page to be rendered on the server
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AetherLMS</h1>
          <nav className="space-x-4">
            <Link href="/courses" className="hover:underline">
              Courses
            </Link>
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Welcome to AetherLMS</h2>
          <p className="text-xl mb-8">
            A next-generation learning management system for creating and consuming educational content.
          </p>
          <div className="space-x-4">
            <Link 
              href="/courses" 
              className="px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Browse Courses
            </Link>
            <Link 
              href="/dashboard" 
              className="px-6 py-3 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              My Dashboard
            </Link>
          </div>
        </section>

        <section className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border border-border">
            <h3 className="text-xl font-bold mb-2">Course Management</h3>
            <p>Create, organize, and manage your educational content with ease.</p>
          </div>
          <div className="p-6 rounded-lg border border-border">
            <h3 className="text-xl font-bold mb-2">Interactive Learning</h3>
            <p>Engage with interactive lessons, quizzes, and assignments.</p>
          </div>
          <div className="p-6 rounded-lg border border-border">
            <h3 className="text-xl font-bold mb-2">Analytics</h3>
            <p>Track progress and performance with detailed analytics.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} AetherLMS. All rights reserved.</p>
          <div className="mt-2">
            <Link href="/api/debug" className="text-sm text-muted-foreground hover:text-foreground mr-4">
              System Status
            </Link>
            <Link href="/api/healthcheck" className="text-sm text-muted-foreground hover:text-foreground">
              Health Check
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 