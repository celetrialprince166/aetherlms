import { Metadata } from 'next/types'

// Define metadata for the DB error page
export const metadata: Metadata = {
  title: 'Database Connection Error | AetherLMS',
  description: 'We\'re experiencing a temporary database connection issue.'
}

export default function DbErrorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      {children}
    </div>
  )
}

// Mark this layout as static
export const dynamic = 'force-static'
 