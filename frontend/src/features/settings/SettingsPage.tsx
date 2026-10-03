import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router'
import {useApi} from '../../api/ApiContext'
import type {VersionInfo} from '../../api/types'
import {Button} from '../../components/Button/Button'
import {Card} from '../../components/Card/Card'
import {ConfirmDialog} from '../../components/ConfirmDialog/ConfirmDialog'
import {PageHeader} from '../../components/PageHeader/PageHeader'
import {Select} from '../../components/Select/Select'
import {useSettings} from '../../state/SettingsContext'
import {CURRENCY_OPTIONS} from './currencies'
import {LANGUAGE_OPTIONS, resolveLanguage} from './languages'
import styles from './SettingsPage.module.css'

type VersionState = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; info: VersionInfo }

export function SettingsPage() {
    const api = useApi()
    const navigate = useNavigate()
    const {currency, locale, reload} = useSettings()

    const [pendingLanguage, setPendingLanguage] = useState<string | null>(null)
    const [languageError, setLanguageError] = useState<string | null>(null)

    const [pendingCurrency, setPendingCurrency] = useState<string | null>(null)
    const [confirmingCurrency, setConfirmingCurrency] = useState(false)

    const [confirmingClear, setConfirmingClear] = useState(false)

    const [version, setVersion] = useState<VersionState>({status: 'loading'})

    useEffect(() => {
        let ignore = false
        api.getVersionInfo().then(
            (info) => {
                if (!ignore) setVersion({status: 'loaded', info})
            },
            () => {
                if (!ignore) setVersion({status: 'error'})
            },
        )
        return () => {
            ignore = true
        }
    }, [api])

    const selectedCurrency = pendingCurrency ?? currency
    const currencyOptions = CURRENCY_OPTIONS.some((o) => o.value === currency)
        ? CURRENCY_OPTIONS
        : [{value: currency, label: currency}, ...CURRENCY_OPTIONS]

    const selectedLanguage = pendingLanguage ?? locale ?? ''
    const systemLanguageName = LANGUAGE_OPTIONS.find((o) => o.value === resolveLanguage(null))?.label
    const languageOptions = [
        {value: '', label: `System default (${systemLanguageName})`},
        ...LANGUAGE_OPTIONS,
    ]

    async function saveLanguage() {
        setLanguageError(null)
        try {
            await api.updateSettings({locale: selectedLanguage})
            await reload()
            setPendingLanguage(null)
        } catch {
            setLanguageError('Could not change the language. Please try again.')
        }
    }

    return (
        <div className={styles.page}>
            <PageHeader left={<h1 className={styles.title}>Settings</h1>}/>

            <div className={styles.sections}>
                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>Language</h2>
                    <p className={styles.description}>
                        By default the app follows your system language.
                    </p>
                    <div className={styles.row}>
                        <div className={styles.currencySelect}>
                            <Select
                                id="language-select"
                                options={languageOptions}
                                value={selectedLanguage}
                                onChange={setPendingLanguage}
                            />
                        </div>
                        <Button
                            variant="primary"
                            disabled={selectedLanguage === (locale ?? '')}
                            onClick={saveLanguage}
                        >
                            Save language
                        </Button>
                    </div>
                    {languageError && <p className={styles.errorText}>{languageError}</p>}
                </Card>

                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>Currency</h2>
                    <p className={styles.description}>
                        Used everywhere in the app, including for new transactions. Changing it relabels all existing
                        transactions without converting any amounts.
                    </p>
                    <div className={styles.row}>
                        <div className={styles.currencySelect}>
                            <Select
                                id="currency-select"
                                options={currencyOptions}
                                value={selectedCurrency}
                                onChange={setPendingCurrency}
                            />
                        </div>
                        <Button
                            variant="primary"
                            disabled={selectedCurrency === currency}
                            onClick={() => setConfirmingCurrency(true)}
                        >
                            Save currency
                        </Button>
                    </div>
                </Card>

                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>About</h2>
                    <VersionSummary version={version}/>
                </Card>

                <Card className={`${styles.section} ${styles.danger}`}>
                    <h2 className={styles.sectionTitle}>Danger zone</h2>
                    <p className={styles.description}>
                        Permanently deletes all transactions and categories. Your currency setting is kept.
                    </p>
                    <div className={styles.row}>
                        <Button className={styles.dangerButton} onClick={() => setConfirmingClear(true)}>
                            Clear all data
                        </Button>
                    </div>
                </Card>
            </div>

            {confirmingCurrency && (
                <ConfirmDialog
                    title="Change currency?"
                    confirmLabel="Change currency"
                    errorMessage="Could not change the currency. Please try again."
                    onCancel={() => setConfirmingCurrency(false)}
                    onConfirm={async () => {
                        await api.updateSettings({currency: selectedCurrency})
                        await reload()
                        setPendingCurrency(null)
                        setConfirmingCurrency(false)
                    }}
                >
                    All existing transactions will be relabelled as {selectedCurrency}. Amounts are not converted.
                </ConfirmDialog>
            )}

            {confirmingClear && (
                <ConfirmDialog
                    title="Delete all data?"
                    confirmLabel="Delete all data"
                    errorMessage="Could not delete the data. Please try again."
                    onCancel={() => setConfirmingClear(false)}
                    onConfirm={async () => {
                        await api.clearAllData()
                        await navigate('/overview')
                    }}
                >
                    This permanently deletes all transactions and categories. This cannot be undone.
                </ConfirmDialog>
            )}
        </div>
    )
}

function VersionSummary({version}: { version: VersionState }) {
    if (version.status === 'loading') {
        return <p className={styles.description}>Checking version…</p>
    }
    if (version.status === 'error') {
        return <p className={styles.description}>Version information is unavailable.</p>
    }

    const {current, latest, updateAvailable, releaseUrl} = version.info
    if (current === null) {
        return <p className={styles.description}>Development build</p>
    }

    return (
        <>
            <p className={styles.description}>Version {current}</p>
            {updateAvailable && latest ? (
                <p className={styles.description}>
                    Update available: {latest}
                    {releaseUrl && (
                        <>
                            {' · '}
                            <a href={releaseUrl} target="_blank" rel="noreferrer">
                                View release
                            </a>
                        </>
                    )}
                </p>
            ) : latest ? (
                <p className={styles.description}>You are up to date.</p>
            ) : (
                <p className={styles.description}>Could not check for updates.</p>
            )}
        </>
    )
}
