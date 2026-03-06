export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">North Star Postal</h1>
      <p className="text-lg text-gray-600">
        Magical personalized holiday letters - Backend rebuild in progress
      </p>
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">System Status</h2>
        <ul className="space-y-1 text-sm">
          <li>Environment: {process.env.RAILWAY_ENVIRONMENT || 'development'}</li>
          <li>Node Version: {process.version}</li>
        </ul>
      </div>
    </main>
  )
}