import React from 'react'
import { makeStyles, tokens, Button, Text, Divider, ProgressBar } from '@fluentui/react-components'
import {
  DesktopRegular,
  ArrowDownloadRegular,
  ArrowUploadRegular,
  SettingsRegular,
  PhoneRegular,
  ChevronLeftRegular,
  ChevronRightRegular
} from '@fluentui/react-icons'
import { useTranslation } from '../hooks/useTranslation'
import logoIcon from '../assets/icon.svg'

export type NavItem = 'devices' | 'games' | 'downloads' | 'uploads' | 'settings'

export type ViewMode = 'grid' | 'list' | 'table'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  activeItem: NavItem
  onNavigate: (item: NavItem) => void
  deviceConnected: boolean
  downloadProgress?: number
  uploadProgress?: number
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '240px',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground4,
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    transition: 'width 0.3s ease-in-out',
    overflow: 'hidden'
  },
  collapsed: {
    width: '60px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacingHorizontalS,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    minHeight: '50px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    minWidth: '32px'
  },
  logoText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  },
  collapseBtn: {
    minWidth: '28px',
    minHeight: '28px'
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    padding: tokens.spacingVerticalS,
    gap: tokens.spacingVerticalXS
  },
  transfersSection: {
    display: 'flex',
    flexDirection: 'column',
    padding: tokens.spacingVerticalS,
    gap: tokens.spacingVerticalXS,
    marginTop: 'auto'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left',
    color: tokens.colorNeutralForeground2
  },
  navItemHover: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1
    }
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1
  },
  navIcon: {
    fontSize: '20px',
    minWidth: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navLabel: {
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  },
  divider: {
    margin: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`
  },
  statusSection: {
    padding: tokens.spacingHorizontalM,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`
  },
  statusItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalS
  },
  statusLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  connected: {
    backgroundColor: tokens.colorPaletteGreenBackground3
  },
  disconnected: {
    backgroundColor: tokens.colorPaletteRedBackground3
  },
  collapsedProgressContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: tokens.spacingVerticalXS,
    minHeight: '50px',
    maxHeight: '60px'
  },
  collapsedProgressBar: {
    width: '6px',
    height: '40px'
  }
})

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  activeItem,
  onNavigate,
  deviceConnected,
  downloadProgress,
  uploadProgress
}) => {
  const styles = useStyles()
  const { t } = useTranslation()

  const navItems: { id: NavItem; icon: React.ReactNode; label: string }[] = [
    { id: 'devices', icon: <PhoneRegular />, label: t('nav.devices') },
    { id: 'games', icon: <DesktopRegular />, label: t('nav.games') },
    { id: 'settings', icon: <SettingsRegular />, label: t('nav.settings') }
  ]

  const transferItems: { id: NavItem; icon: React.ReactNode; label: string }[] = [
    { id: 'downloads', icon: <ArrowDownloadRegular />, label: t('nav.downloads') },
    { id: 'uploads', icon: <ArrowUploadRegular />, label: t('nav.uploads') }
  ]

  const hasProgress =
    (downloadProgress !== undefined && downloadProgress > 0) ||
    (uploadProgress !== undefined && uploadProgress > 0)

  if (collapsed) {
    return (
      <div className={`${styles.root} ${styles.collapsed}`}>
        <div className={styles.header}>
          <Button
            appearance="subtle"
            icon={<ChevronRightRegular />}
            onClick={onToggleCollapse}
            className={styles.collapseBtn}
            aria-label="Expand sidebar"
          />
        </div>

        <nav className={styles.navSection}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${styles.navItemHover} ${
                activeItem === item.id ? styles.navItemActive : ''
              }`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
            >
              <span className={styles.navIcon}>{item.icon}</span>
            </button>
          ))}
        </nav>

        <nav className={styles.transfersSection}>
          {transferItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${styles.navItemHover} ${
                activeItem === item.id ? styles.navItemActive : ''
              }`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
            >
              <span className={styles.navIcon}>{item.icon}</span>
            </button>
          ))}
        </nav>

        {hasProgress && (
          <div className={styles.collapsedProgressContainer}>
            <ProgressBar
              value={(downloadProgress || uploadProgress || 0) / 100}
              className={styles.collapsedProgressBar}
              thickness="medium"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <img src={logoIcon} alt="logo" className={styles.logoIcon} />
          <Text weight="semibold" className={styles.logoText}>
            AgnosticVR
          </Text>
        </div>
        <Button
          appearance="subtle"
          icon={<ChevronLeftRegular />}
          onClick={onToggleCollapse}
          className={styles.collapseBtn}
          aria-label="Collapse sidebar"
        />
      </div>

      <nav className={styles.navSection}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${styles.navItemHover} ${
              activeItem === item.id ? styles.navItemActive : ''
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <Text className={styles.navLabel}>{item.label}</Text>
          </button>
        ))}
      </nav>

      <Divider className={styles.divider} />

      <nav className={styles.transfersSection}>
        <Text
          size={200}
          style={{ color: tokens.colorNeutralForeground3, paddingLeft: tokens.spacingHorizontalM }}
        >
          {t('nav.transfers')}
        </Text>
        {transferItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${styles.navItemHover} ${
              activeItem === item.id ? styles.navItemActive : ''
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <Text className={styles.navLabel}>{item.label}</Text>
          </button>
        ))}
      </nav>

      <div className={styles.statusSection}>
        <div className={styles.statusItem}>
          <div className={styles.statusLabel}>
            <span
              className={`${styles.statusDot} ${
                deviceConnected ? styles.connected : styles.disconnected
              }`}
            />
            <Text size={200}>{deviceConnected ? t('nav.deviceConnected') : t('nav.noDevice')}</Text>
          </div>
        </div>

        {downloadProgress !== undefined && downloadProgress > 0 && (
          <div className={styles.statusItem}>
            <Text size={200} className={styles.statusLabel}>
              <ArrowDownloadRegular /> {t('common.downloading')}
            </Text>
            <ProgressBar value={downloadProgress / 100} />
          </div>
        )}

        {uploadProgress !== undefined && uploadProgress > 0 && (
          <div className={styles.statusItem}>
            <Text size={200} className={styles.statusLabel}>
              <ArrowUploadRegular /> {t('common.uploading')}
            </Text>
            <ProgressBar value={uploadProgress / 100} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
