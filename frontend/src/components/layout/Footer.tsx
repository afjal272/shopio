export default function Footer() {
  return (
    <footer className="w-full bg-[#1c2725] text-white mt-24">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* BRAND */}
        <div>
          <h2 className="text-xl font-semibold tracking-widest mb-4">
            SHOPIO
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            AI-powered shopping assistant that helps you pick the best product
            instead of wasting hours comparing.
          </p>
        </div>

        {/* PRODUCT */}
        <div>
          <h3 className="text-sm font-semibold text-yellow-400 mb-4">
            PRODUCT
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="#">Search</a></li>
            <li><a href="#">Recommendations</a></li>
            <li><a href="#">AI Engine</a></li>
          </ul>
        </div>

        {/* COMPANY */}
        <div>
          <h3 className="text-sm font-semibold text-yellow-400 mb-4">
            COMPANY
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="#">About</a></li>
            <li><a href="#">Contact us</a></li>
            <li><a href="#">Careers</a></li>
          </ul>
        </div>

        {/* NEWSLETTER */}
        <div>
          <h3 className="text-sm font-semibold text-yellow-400 mb-4">
            NEWSLETTER
          </h3>
          <p className="text-sm text-gray-300 mb-3">
            Get product updates & AI insights.
          </p>

          <div className="flex">
            <input
              type="email"
              placeholder="Your email"
              className="w-full px-3 py-2 text-sm rounded-l bg-white text-black outline-none"
            />
            <button className="bg-yellow-500 px-4 py-2 text-sm text-black font-medium rounded-r">
              Join
            </button>
          </div>
        </div>

      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-300">
          <p>© {new Date().getFullYear()} Shopio. All rights reserved.</p>

          <div className="flex gap-6 mt-3 md:mt-0">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  )
}