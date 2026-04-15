export default function Features() {
  const features = [
    {
      title: "Smart Recommendations",
      desc: "AI analyzes your needs and gives the best product instead of endless lists.",
      icon: "🧠",
    },
    {
      title: "No More Comparison",
      desc: "Skip hours of research. Get the best choice instantly.",
      icon: "⚡",
    },
    {
      title: "Budget Aware",
      desc: "Find products that actually fit your budget and use-case.",
      icon: "💰",
    },
  ]

  return (
    <section className="w-full py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-black">
            Why Shopio?
          </h2>
          <p className="text-gray-500 mt-3">
            Stop guessing. Start deciding.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {features.map((f, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
            >
              <div className="text-3xl mb-4">{f.icon}</div>

              <h3 className="text-lg font-semibold text-black mb-2">
                {f.title}
              </h3>

              <p className="text-gray-600 text-sm">
                {f.desc}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  )
}