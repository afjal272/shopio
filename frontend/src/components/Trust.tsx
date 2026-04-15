export default function Trust() {
  return (
    <section className="w-full py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 text-center">

        <h2 className="text-3xl font-bold text-black">
          Why trust Shopio?
        </h2>

        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          We don’t just list products. We analyze your needs and give you the
          best possible decision instantly.
        </p>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">

          <div>
            <h3 className="font-semibold text-black mb-2">
              No bias
            </h3>
            <p className="text-gray-600 text-sm">
              We don’t push sponsored products. Only what fits your needs.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">
              Built for decisions
            </h3>
            <p className="text-gray-600 text-sm">
              Not another comparison site. We help you decide faster.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">
              AI + logic
            </h3>
            <p className="text-gray-600 text-sm">
              Combines intelligent parsing with real product data.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}