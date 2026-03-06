export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mb-6">
        <img
          src="/images/logo.png"
          alt="North Star Postal"
          className="h-12 w-auto"
        />
      </div>
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