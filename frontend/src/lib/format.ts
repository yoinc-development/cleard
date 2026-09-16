//TODO maybe this can be resolved better. Gotta think about localization at one point...
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

function swissThousands(value: string): string {
  return value.replace(/’/g, "'")
}

export interface FormatMoneyOptions {
  /** + / - prefix. */
  sign?: boolean
}

/** `4'186.35`, `-48.90`, `+1'200.00` */
export function formatMoney(amount: number, options: FormatMoneyOptions = {}): string {
  const { sign = true } = options
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
  currency = 'CHF',
  options: FormatMoneyOptions = {},
): string {
  return `${currency} ${formatMoney(amount, { sign: options.sign ?? false })}`
}

/** `25.09` */
export function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${day}.${month}`
}

/** `FRIDAY 25 SEPTEMBER` */
export function formatDayHeading(isoDate: string): string {
  const date = parseIsoDate(isoDate)
  const dayName = DAY_NAMES[date.getDay()]
  const monthName = MONTH_NAMES[date.getMonth()]
  return `${dayName.toUpperCase()} ${date.getDate()} ${monthName.toUpperCase()}`
}

/** `September 2026` */
export function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

/** `Sep 2026` */
export function formatMonthLabelShort(year: number, month: number): string {
  return `${MONTH_NAMES_SHORT[month - 1]} ${year}`
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
