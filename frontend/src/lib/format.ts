import i18n from '../i18n'

const MONTH_KEYS = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
] as const

const MONTH_SHORT_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

function swissThousands(value: string): string {
    return value.replace(/’/g, "'")
}

export interface FormatMoneyOptions {
    /** + / - prefix. */
    sign?: boolean
}

/** `4'186.35`, `-48.90`, `+1'200.00` */
export function formatMoney(amount: number, options: FormatMoneyOptions = {}): string {
    const {sign = true} = options
    const abs = Math.abs(amount)
    const formatted = swissThousands(
        new Intl.NumberFormat('de-CH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(abs),
    )
    if (amount < 0) return `-${formatted}`
    if (sign && amount > 0) return `+${formatted}`
    return formatted
}

/** `CHF 4'186.35` */
export function formatMoneyWithCurrency(
    amount: number,
    currency: string,
    options: FormatMoneyOptions = {},
): string {
    return `${currency} ${formatMoney(amount, {sign: options.sign ?? false})}`
}

/** `25.09` */
export function formatShortDate(isoDate: string): string {
    const [, month, day] = isoDate.split('-')
    return `${day}.${month}`
}

/** `FRIDAY 25 SEPTEMBER` */
export function formatDayHeading(isoDate: string): string {
    const date = parseIsoDate(isoDate)
    return i18n
        .t('date.day_heading', {
            day: i18n.t(`date.day.${DAY_KEYS[date.getDay()]}`),
            date: date.getDate(),
            month: i18n.t(`date.month.${MONTH_KEYS[date.getMonth()]}`),
        })
        .toUpperCase()
}

/** `September` */
export function formatMonthName(month: number): string {
    return i18n.t(`date.month.${MONTH_KEYS[month - 1]}`)
}

/** `September 2026` */
export function formatMonthLabel(year: number, month: number): string {
    return i18n.t('date.month_label', {month: formatMonthName(month), year})
}

/** `Sep 2026` */
export function formatMonthLabelShort(year: number, month: number): string {
    return i18n.t('date.month_label_short', {month: i18n.t(`date.month_short.${MONTH_SHORT_KEYS[month - 1]}`), year})
}

function parseIsoDate(isoDate: string): Date {
    const [year, month, day] = isoDate.split('-').map(Number)
    return new Date(year, month - 1, day)
}

export function todayIso(): string {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
}
