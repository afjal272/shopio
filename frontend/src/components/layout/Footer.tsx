export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
        
        <p>© {new Date().getFullYear()} Shopio. All rights reserved.</p>

        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition">
            Privacy
          </a>
          <a href="#" className="hover:text-white transition">
            Terms
          </a>
          <a href="#" className="hover:text-white transition">
            Twitter
          </a>
        </div>
      </div>
    </footer>
  )
}