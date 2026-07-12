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
            `flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-sm transition-colors duration-150 ${
              isActive
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
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