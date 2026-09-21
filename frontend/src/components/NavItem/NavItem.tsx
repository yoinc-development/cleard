import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import styles from './NavItem.module.css'

export function NavItem({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
    >
      <span className={styles.icon}>{icon}</span>
      {children}
    </NavLink>
  )
}
