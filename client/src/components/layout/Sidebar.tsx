import { NavLink } from 'react-router-dom'
import { Mic, Trophy, CheckCircle, Code, PlusCircle } from 'lucide-react'

const links = [
  { to: '/interview/new', icon: Mic, label: 'Mock Interview' },
  { to: '/problems', icon: Code, label: 'Problems' },
  { to: '/contest', icon: Trophy, label: 'Contest' },
  { to: '/preparation', icon: CheckCircle, label: 'Check Preparation' },
  { to: '/contribute', icon: PlusCircle, label: 'Contribute' },
]

export default function Sidebar() {
  return (
    <div className="flex items-center gap-1">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-white/10 text-white font-medium'
                : 'text-[#888888] hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Icon size={15} />
          {label}
        </NavLink>
      ))}
    </div>
  )
}