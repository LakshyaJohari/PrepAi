interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  forceDark?: boolean
}

export default function Logo({ size = 'md', forceDark = false }: LogoProps) {
  const ringSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'
  const textSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-base' : 'text-xs'
  const nameSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'
  const color = forceDark ? 'border-white text-white' : 'border-[var(--text-primary)] text-[var(--text-primary)]'
  const nameColor = forceDark ? 'text-white' : 'text-[var(--text-primary)]'

  return (
    <div className="flex items-center gap-2">
      <div className={`${ringSize} bg-transparent border-2 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
        <span className={`font-bold font-mono ${textSize}`}>!=</span>
      </div>
      <span className={`font-semibold tracking-tight ${nameSize} ${nameColor}`}>PrepAI</span>
    </div>
  )
}
