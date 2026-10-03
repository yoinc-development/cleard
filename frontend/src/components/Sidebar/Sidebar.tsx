import {useTranslation} from 'react-i18next'
import {GaugeIcon, GearIcon, GridIcon, SwapIcon, TagIcon} from '../icons/icons'
import {NavItem} from '../NavItem/NavItem'
import styles from './Sidebar.module.css'

export function Sidebar() {
    const {t} = useTranslation()

    return (
        <nav className={styles.sidebar}>
            <div className={styles.brand}>
                <span className={styles.mark}/>
                <span className={styles.brandName}>cleard</span>
            </div>

            <div className={styles.section}>
                <NavItem to="/overview" icon={<GridIcon/>}>
                    {t('nav.overview')}
                </NavItem>
                <NavItem to="/transactions" icon={<SwapIcon/>}>
                    {t('nav.transactions')}
                </NavItem>
                <NavItem to="/categories" icon={<TagIcon/>}>
                    {t('nav.categories')}
                </NavItem>
                <NavItem to="/thresholds" icon={<GaugeIcon/>}>
                    {t('nav.thresholds')}
                </NavItem>
            </div>

            <div className={styles.spacer}/>

            <div className={styles.section}>
                <NavItem to="/settings" icon={<GearIcon/>}>
                    {t('nav.settings')}
                </NavItem>
            </div>
        </nav>
    )
}
