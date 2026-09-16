import type { ReactNode } from 'react'
import { GaugeIcon, GearIcon, GridIcon, SwapIcon, TagIcon } from '../icons/icons'
import { NavItem } from '../NavItem/NavItem'
import styles from './Sidebar.module.css'

export interface SidebarProps {
  footer?: ReactNode
  savedViews?: ReactNode
}

export function Sidebar({ footer, savedViews }: SidebarProps) {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.mark} />
        <span className={styles.brandName}>cleard</span>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Month</span>
        <NavItem to="/overview" icon={<GridIcon />}>
          Overview
        </NavItem>
        <NavItem to="/transactions" icon={<SwapIcon />}>
          Transactions
        </NavItem>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Test</span>
        <NavItem to="/categories" icon={<TagIcon />}>
          Categories
        </NavItem>
        <NavItem to="/thresholds" icon={<GaugeIcon />}>
          Thresholds
        </NavItem>
        <NavItem to="/settings" icon={<GearIcon />}>
          Settings
        </NavItem>
      </div>

      {savedViews}

      <div className={styles.spacer} />

      {footer && <div className={styles.footer}>{footer}</div>}
    </nav>
  )
}
