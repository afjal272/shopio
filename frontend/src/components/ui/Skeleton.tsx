type Props = {
  className?: string
}

export default function Skeleton({ className = "" }: Props) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-20 bg-gray-200 rounded-xl" />
      <div className="h-20 bg-gray-200 rounded-xl" />
      <div className="h-20 bg-gray-200 rounded-xl" />
    </div>
  )
}