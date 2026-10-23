import {useTranslation} from 'react-i18next'
import {CloseIcon} from '../../components/icons/icons'
import {Modal} from '../../components/Modal/Modal'
import {formatMonthName} from '../../lib/format'
import {useSettings} from '../../state/SettingsContext'
import {sectionItems} from './changelog'
import type {ChangelogEntry} from './changelog'
import styles from './WhatsNewDialog.module.css'

const TITLE_ID = 'whats-new-title'

export interface WhatsNewDialogProps {
    entry: ChangelogEntry
    onClose: () => void
}

export function WhatsNewDialog({entry, onClose}: WhatsNewDialogProps) {
    const {t} = useTranslation()
    const {language} = useSettings()
    const [year, month, day] = entry.date.split('-').map(Number)

    return (
        <Modal onClose={onClose} labelledBy={TITLE_ID} size="sm">
            <div className={styles.root}>
                <header className={styles.header}>
                    <div>
                        <h2 className={styles.title} id={TITLE_ID}>
                            {t('whats_new.title')}
                        </h2>
                        <p className={styles.meta}>
                            {t('whats_new.version', {version: entry.version})}
                            {' · '}
                            {t('whats_new.date', {day, month: formatMonthName(month), year})}
                        </p>
                    </div>
                    <button type="button" className={styles.close} aria-label={t('whats_new.close')} onClick={onClose}>
                        <CloseIcon/>
                    </button>
                </header>

                <div className={styles.body}>
                    {entry.sections.map((section) => (
                        <section key={section.type} className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                {t(`whats_new.section.${section.type}`)}
                                <span className={styles.rule}/>
                            </h3>
                            <ul className={styles.items}>
                                {sectionItems(section, language).map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </div>
        </Modal>
    )
}
