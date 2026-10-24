import {useTranslation} from 'react-i18next'
import {ReleaseNotesIcon} from '../icons/icons'
import styles from './TitleBar.module.css'

export interface TitleBarProps {
    onOpenReleaseNotes: () => void
}

export function TitleBar({onOpenReleaseNotes}: TitleBarProps) {
    const {t} = useTranslation()
    const shell = window.cleardShell
    if (!shell) return null
    const platformClass = shell.platform === 'win32' ? styles.windows : styles.inset
    return (
        <div className={`${styles.titleBar} ${platformClass}`}>
            <button
                type="button"
                className={styles.action}
                aria-label={t('title_bar.release_notes')}
                title={t('title_bar.release_notes')}
                onClick={onOpenReleaseNotes}
            >
                <ReleaseNotesIcon width={16} height={16}/>
            </button>
        </div>
    )
}
