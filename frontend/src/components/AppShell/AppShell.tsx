import type {ReactNode} from 'react'
import {Sidebar} from '../Sidebar/Sidebar'
import styles from './AppShell.module.css'

export function AppShell({children}: { children: ReactNode }) {
    return (
        <div className={styles.shell}>
            <Sidebar/>
            <main className={styles.main}>{children}</main>
        </div>
    )
}
