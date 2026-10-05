import styles from './TitleBar.module.css'

export function TitleBar() {
    const shell = window.cleardShell
    if (!shell) return null
    return <div className={`${styles.titleBar} ${shell.platform === 'darwin' ? styles.mac : ''}`}/>
}
