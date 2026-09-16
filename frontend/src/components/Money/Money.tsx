import { formatMoney } from '../../lib/format'
import type { FormatMoneyOptions } from '../../lib/format'

interface MoneyProps extends FormatMoneyOptions {
  amount: number
  className?: string
}

/**
 * Renders a signed amount, e.g. `-48.90` / `+1'200.00`.
 */
export function Money({ amount, className, ...formatOptions }: MoneyProps) {
  return <span className={className}>{formatMoney(amount, formatOptions)}</span>
}
