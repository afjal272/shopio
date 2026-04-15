export default function Header() {
  return (
    <header className="w-full border-b border-zinc-800 bg-black/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <h1 className="text-xl font-bold tracking-tight">
          Shopio
        </h1>

        {/* Nav */}
        <nav className="flex items-center gap-6 text-sm text-gray-400">
          <a href="#" className="hover:text-white transition">
            Features
          </a>
          <a href="#" className="hover:text-white transition">
            How it works
          </a>
          <a href="#" className="hover:text-white transition">
            Contact
          </a>
        </nav>

        {/* CTA */}
        <button className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg font-medium transition">
          Try Now
        </button>
      </div>
    </header>
  )
}