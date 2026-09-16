import type { ReactNode } from 'react'
import { Sidebar } from '../Sidebar/Sidebar'
import type { SidebarProps } from '../Sidebar/Sidebar'
import styles from './AppShell.module.css'

export function AppShell({ children, ...sidebarProps }: { children: ReactNode } & SidebarProps) {
  return (
    <div className={styles.shell}>
      <Sidebar {...sidebarProps} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
