export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      
      {/* Hero Section */}
      <section className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4 font-mono">
          Steez
        </h1>

        <p className="text-lg text-gray-600 mb-6">
          Created by Sebastian Phillips, Jasmine Hurt, Chisomo Mwansa, Alex Deng
        </p>

        <div className="flex gap-4 justify-center">
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded">
            CRUD Operations
          </button>

          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded">
            Retrieval Queries
          </button>
        </div>
      </section>
    </main>
  )
}