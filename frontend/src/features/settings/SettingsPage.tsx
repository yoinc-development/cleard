import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate} from 'react-router'
import {useApi} from '../../api/ApiContext'
import type {VersionInfo} from '../../api/types'
import {Button} from '../../components/Button/Button'
import {Card} from '../../components/Card/Card'
import {ConfirmDialog} from '../../components/ConfirmDialog/ConfirmDialog'
import {PageHeader} from '../../components/PageHeader/PageHeader'
import {Select} from '../../components/Select/Select'
import type {SelectOption} from '../../components/Select/Select'
import {useSettings} from '../../state/SettingsContext'
import {CURRENCY_CODES} from './currencies'
import {LANGUAGE_OPTIONS, resolveLanguage} from './languages'
import styles from './SettingsPage.module.css'

type VersionState = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; info: VersionInfo }

export function SettingsPage() {
    const {t} = useTranslation()
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
    const currencyOptions: SelectOption[] = CURRENCY_CODES.map((code) => ({
        value: code,
        label: code,
        meta: t(`settings.currency.name.${code}`),
    }))
    if (!currencyOptions.some((o) => o.value === currency)) {
        currencyOptions.unshift({value: currency, label: currency})
    }

    const selectedLanguage = pendingLanguage ?? locale ?? ''
    const systemLanguageName = LANGUAGE_OPTIONS.find((o) => o.value === resolveLanguage(null))?.label
    const languageOptions = [
        {value: '', label: t('settings.language.system_default', {language: systemLanguageName})},
        ...LANGUAGE_OPTIONS,
    ]

    async function saveLanguage() {
        setLanguageError(null)
        try {
            await api.updateSettings({locale: selectedLanguage})
            await reload()
            setPendingLanguage(null)
        } catch {
            setLanguageError(t('settings.language.error'))
        }
    }

    return (
        <div className={styles.page}>
            <PageHeader left={<h1 className={styles.title}>{t('settings.title')}</h1>}/>

            <div className={styles.sections}>
                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('settings.language.title')}</h2>
                    <p className={styles.description}>{t('settings.language.description')}</p>
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
                            {t('settings.language.save')}
                        </Button>
                    </div>
                    {languageError && <p className={styles.errorText}>{languageError}</p>}
                </Card>

                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('settings.currency.title')}</h2>
                    <p className={styles.description}>{t('settings.currency.description')}</p>
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
                            {t('settings.currency.save')}
                        </Button>
                    </div>
                </Card>

                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('settings.about.title')}</h2>
                    <VersionSummary version={version}/>
                </Card>

                <Card className={`${styles.section} ${styles.danger}`}>
                    <h2 className={styles.sectionTitle}>{t('settings.danger.title')}</h2>
                    <p className={styles.description}>{t('settings.danger.description')}</p>
                    <div className={styles.row}>
                        <Button className={styles.dangerButton} onClick={() => setConfirmingClear(true)}>
                            {t('settings.danger.clear')}
                        </Button>
                    </div>
                </Card>
            </div>

            {confirmingCurrency && (
                <ConfirmDialog
                    title={t('settings.currency.confirm_title')}
                    confirmLabel={t('settings.currency.confirm_action')}
                    errorMessage={t('settings.currency.error')}
                    onCancel={() => setConfirmingCurrency(false)}
                    onConfirm={async () => {
                        await api.updateSettings({currency: selectedCurrency})
                        await reload()
                        setPendingCurrency(null)
                        setConfirmingCurrency(false)
                    }}
                >
                    {t('settings.currency.confirm_body', {currency: selectedCurrency})}
                </ConfirmDialog>
            )}

            {confirmingClear && (
                <ConfirmDialog
                    title={t('settings.danger.confirm_title')}
                    confirmLabel={t('settings.danger.confirm_action')}
                    errorMessage={t('settings.danger.error')}
                    onCancel={() => setConfirmingClear(false)}
                    onConfirm={async () => {
                        await api.clearAllData()
                        await navigate('/overview')
                    }}
                >
                    {t('settings.danger.confirm_body')}
                </ConfirmDialog>
            )}
        </div>
    )
}

function VersionSummary({version}: { version: VersionState }) {
    const {t} = useTranslation()
    if (version.status === 'loading') {
        return <p className={styles.description}>{t('settings.about.checking')}</p>
    }
    if (version.status === 'error') {
        return <p className={styles.description}>{t('settings.about.unavailable')}</p>
    }

    const {current, latest, updateAvailable, releaseUrl} = version.info
    if (current === null) {
        return <p className={styles.description}>{t('settings.about.development_build')}</p>
    }

    return (
        <>
            <p className={styles.description}>{t('settings.about.version', {version: current})}</p>
            {updateAvailable && latest ? (
                <p className={styles.description}>
                    {t('settings.about.update_available', {version: latest})}
                    {releaseUrl && (
                        <>
                            {' · '}
                            <a href={releaseUrl} target="_blank" rel="noreferrer">
                                {t('settings.about.view_release')}
                            </a>
                        </>
                    )}
                </p>
            ) : latest ? (
                <p className={styles.description}>{t('settings.about.up_to_date')}</p>
            ) : (
                <p className={styles.description}>{t('settings.about.update_check_failed')}</p>
            )}
        </>
    )
}
