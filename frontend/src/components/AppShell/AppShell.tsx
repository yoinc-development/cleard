import {useCallback, useState} from 'react'
import type {ReactNode} from 'react'
import {useApi} from '../../api/ApiContext'
import {entryForVersion, findEntry} from '../../features/whatsnew/changelog'
import type {ChangelogEntry} from '../../features/whatsnew/changelog'
import {WhatsNewDialog} from '../../features/whatsnew/WhatsNewDialog'
import {useSettings} from '../../state/SettingsContext'
import {TitleBar} from '../TitleBar/TitleBar'
import {Sidebar} from '../Sidebar/Sidebar'
import styles from './AppShell.module.css'

export function AppShell({children}: { children: ReactNode }) {
    const api = useApi()
    const {appVersion, changelogSeen, loaded, reload} = useSettings()
    const [releaseNotes, setReleaseNotes] = useState<ChangelogEntry | null>(null)
    const [autoOpenChecked, setAutoOpenChecked] = useState(false)

    if (loaded && !autoOpenChecked) {
        setAutoOpenChecked(true)
        const entry = entryForVersion(appVersion)
        if (entry && !changelogSeen) setReleaseNotes(entry)
    }

    const closeReleaseNotes = useCallback(() => {
        setReleaseNotes(null)
        if (!changelogSeen) {
            api.markChangelogSeen().then(reload).catch(() => {
            })
        }
    }, [api, changelogSeen, reload])

    return (
        <div className={styles.shell}>
            <TitleBar onOpenReleaseNotes={() => setReleaseNotes(findEntry(appVersion) ?? null)}/>
            <div className={styles.body}>
                <Sidebar/>
                <main className={styles.main}>{children}</main>
            </div>
            {releaseNotes && <WhatsNewDialog entry={releaseNotes} onClose={closeReleaseNotes}/>}
        </div>
    )
}
