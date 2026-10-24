import type {AccountIcon} from '../../api/types'
import {BankIcon, CardIcon, SavingsIcon, WalletIcon} from '../icons/icons'

export function AccountGlyph({icon, size = 18}: { icon: AccountIcon; size?: number }) {
    switch (icon) {
        case 'card':
            return <CardIcon width={size} height={size}/>
        case 'savings':
            return <SavingsIcon width={size} height={size}/>
        case 'wallet':
            return <WalletIcon width={size} height={size}/>
        default:
            return <BankIcon width={size} height={size}/>
    }
}
