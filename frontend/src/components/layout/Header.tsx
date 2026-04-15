export default function Header() {
  return (
    <header className="w-full bg-white backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <h1 className="text-xl font-bold tracking-tight text-black">
          Shopio
        </h1>

        {/* Nav */}
        <nav className="flex items-center gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-black transition">
            Features
          </a>
          <a href="#" className="hover:text-black transition">
            How it works
          </a>
          <a href="#" className="hover:text-black transition">
            Contact
          </a>
        </nav>

        {/* CTA */}
        <button className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-800 transition">
          Try Now
        </button>
      </div>
    </header>
  )
}