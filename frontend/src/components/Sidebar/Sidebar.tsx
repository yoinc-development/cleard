import {useRef, useState} from 'react'
import type {PointerEvent} from 'react'
import {useTranslation} from 'react-i18next'
import {GaugeIcon, GearIcon, GridIcon, SwapIcon, TagIcon} from '../icons/icons'
import {AccountSwitcher} from '../AccountSwitcher/AccountSwitcher'
import {NavItem} from '../NavItem/NavItem'
import {clampSidebarWidth, readStoredSidebarWidth, storeSidebarWidth} from './sidebarWidth'
import styles from './Sidebar.module.css'

const RESIZING_CLASS = 'resizing'

export function Sidebar() {
    const {t} = useTranslation()
    const [width, setWidth] = useState(readStoredSidebarWidth)
    const drag = useRef<{ startX: number, startWidth: number, width: number } | null>(null)

    function startResize(event: PointerEvent<HTMLDivElement>) {
        event.currentTarget.setPointerCapture?.(event.pointerId)
        drag.current = {startX: event.clientX, startWidth: width, width}
        document.body.classList.add(RESIZING_CLASS)
    }

    function resize(event: PointerEvent<HTMLDivElement>) {
        const current = drag.current
        if (!current) return
        current.width = clampSidebarWidth(current.startWidth + event.clientX - current.startX)
        setWidth(current.width)
    }

    function endResize(event: PointerEvent<HTMLDivElement>) {
        const current = drag.current
        if (!current) return
        drag.current = null
        event.currentTarget.releasePointerCapture?.(event.pointerId)
        document.body.classList.remove(RESIZING_CLASS)
        storeSidebarWidth(current.width)
    }

    return (
        <div className={styles.root} style={{width}}>
            <nav className={styles.sidebar}>
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
                    <AccountSwitcher/>
                    <NavItem to="/settings" icon={<GearIcon/>}>
                        {t('nav.settings')}
                    </NavItem>
                </div>
            </nav>
            <div
                className={styles.handle}
                role="separator"
                aria-orientation="vertical"
                aria-label={t('nav.resize')}
                onPointerDown={startResize}
                onPointerMove={resize}
                onPointerUp={endResize}
                onPointerCancel={endResize}
            />
        </div>
    )
}
