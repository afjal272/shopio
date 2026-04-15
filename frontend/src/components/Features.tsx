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
    <section className="w-full py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-black">
            Why Shopio?
          </h2>
          <p className="text-gray-500 mt-2">
            Stop guessing. Start deciding.
          </p>
        </div>

        {/* OUTER BOX */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition border border-transparent hover:border-gray-200"
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

      </div>
    </section>
  )
}