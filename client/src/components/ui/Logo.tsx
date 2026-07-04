interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  dark?: boolean
}

export default function Logo({ size = 'md', dark = true }: LogoProps) {
  const ringSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'
  const textSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-base' : 'text-xs'
  const nameSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'
  const color = dark ? 'border-white text-white' : 'border-gray-900 text-gray-900'
  const nameColor = dark ? 'text-white' : 'text-gray-900'

  return (
    <div className="flex items-center gap-2">
      <div className={`${ringSize} bg-transparent border-2 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
        <span className={`font-black font-mono ${textSize}`}>!=</span>
      </div>
      <span className={`font-bold tracking-tight ${nameSize} ${nameColor}`}>PrepAI</span>
    </div>
  )
}