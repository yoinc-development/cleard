import type {ParseKeys} from 'i18next'
import type {ReactElement} from 'react'
import {Trans} from 'react-i18next'

export interface SafeTransProps {
    i18nKey: ParseKeys
    values: Record<string, string | number>
    components: Record<string, ReactElement>
}

export function SafeTrans({i18nKey, values, components}: SafeTransProps) {
    return (
        <Trans
            i18nKey={i18nKey}
            values={values}
            components={components}
            tOptions={{interpolation: {escapeValue: true}}}
            shouldUnescape
        />
    )
}
