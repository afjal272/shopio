export default function HowItWorks() {
  const steps = [
    {
      title: "Tell your need",
      desc: "Describe what you are looking for in simple language.",
    },
    {
      title: "AI analyzes",
      desc: "Our engine understands your budget, use-case and preferences.",
    },
    {
      title: "Get best choice",
      desc: "Receive the most suitable product instantly with explanation.",
    },
  ]

  return (
    <section className="w-full py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-black">
            How it works
          </h2>
          <p className="text-gray-500 mt-2">
            Simple. Fast. Smart.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {steps.map((step, i) => (
            <div key={i} className="text-center">

              {/* Step number */}
              <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-black text-white font-semibold mb-4">
                {i + 1}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-black mb-2">
                {step.title}
              </h3>

              {/* Desc */}
              <p className="text-gray-600 text-sm max-w-xs mx-auto">
                {step.desc}
              </p>

            </div>
          ))}

        </div>
      </div>
    </section>
  )
}