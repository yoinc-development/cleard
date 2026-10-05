import type {ReactNode} from 'react'
import {TitleBar} from '../TitleBar/TitleBar'
import {Sidebar} from '../Sidebar/Sidebar'
import styles from './AppShell.module.css'

export function AppShell({children}: { children: ReactNode }) {
    return (
        <div className={styles.shell}>
            <TitleBar/>
            <div className={styles.body}>
                <Sidebar/>
                <main className={styles.main}>{children}</main>
            </div>
        </div>
    )
}
