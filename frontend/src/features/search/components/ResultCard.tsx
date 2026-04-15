type Props = {
  item: any
  index?: number
  highlight?: boolean
}

export default function ResultCard({ item, index, highlight }: Props) {
  return (
    <div
      className={`border border-zinc-700 p-4 rounded ${
        highlight ? "bg-zinc-900" : "bg-zinc-800"
      }`}
    >
      <div className="flex justify-between items-center">
        <p className="font-semibold">
          {index !== undefined && `#${index + 1} `}
          {item.title}
        </p>

        <p className="text-sm text-gray-400">
          {item.score}/100
        </p>
      </div>

      {/* Score bar */}
      <div className="w-full bg-zinc-700 h-2 rounded mt-2">
        <div
          className="bg-green-500 h-2 rounded"
          style={{ width: `${item.score}%` }}
        />
      </div>

      {highlight && (
        <p className="mt-3 text-sm text-gray-300">
          {item.explanation}
        </p>
      )}
    </div>
  )
}