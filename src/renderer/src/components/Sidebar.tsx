import React from 'react'
import { makeStyles, tokens, Button, Text, Divider, ProgressBar } from '@fluentui/react-components'
import {
  DesktopRegular,
  ArrowDownloadRegular,
  ArrowUploadRegular,
  SettingsRegular,
  PhoneRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  ArrowUploadFilled
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
    transition: 'width 0.2s ease-in-out',
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
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: tokens.spacingVerticalS,
    gap: tokens.spacingVerticalXS,
    flex: 1
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
  quickActions: {
    padding: tokens.spacingHorizontalM
  },
  quickActionsTitle: {
    marginBottom: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground3
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
    { id: 'downloads', icon: <ArrowDownloadRegular />, label: t('nav.downloads') },
    { id: 'uploads', icon: <ArrowUploadRegular />, label: t('nav.uploads') },
    { id: 'settings', icon: <SettingsRegular />, label: t('nav.settings') }
  ]

  const quickActions = [{ id: 'upload', icon: <ArrowUploadFilled />, label: t('nav.uploadGames') }]

  return (
    <div className={`${styles.root} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        {!collapsed && (
          <div className={styles.logo}>
            <img src={logoIcon} alt="logo" className={styles.logoIcon} />
            <Text weight="semibold" className={styles.logoText}>
              MythicQuest
            </Text>
          </div>
        )}
        <Button
          appearance="subtle"
          icon={collapsed ? <ChevronRightRegular /> : <ChevronLeftRegular />}
          onClick={onToggleCollapse}
          className={styles.collapseBtn}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        />
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${styles.navItemHover} ${
              activeItem === item.id ? styles.navItemActive : ''
            }`}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && <Text className={styles.navLabel}>{item.label}</Text>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <>
          <Divider className={styles.divider} />
          <div className={styles.quickActions}>
            <Text size={200} className={styles.quickActionsTitle}>
              {t('nav.quickActions')}
            </Text>
            {quickActions.map((action) => (
              <button
                key={action.id}
                className={`${styles.navItem} ${styles.navItemHover}`}
                onClick={() => {
                  if (action.id === 'upload') {
                    onNavigate('uploads')
                  }
                }}
              >
                <span className={styles.navIcon}>{action.icon}</span>
                <Text className={styles.navLabel}>{action.label}</Text>
              </button>
            ))}
          </div>

          <div className={styles.statusSection}>
            <div className={styles.statusItem}>
              <div className={styles.statusLabel}>
                <span
                  className={`${styles.statusDot} ${
                    deviceConnected ? styles.connected : styles.disconnected
                  }`}
                />
                <Text size={200}>
                  {deviceConnected ? t('nav.deviceConnected') : t('nav.noDevice')}
                </Text>
              </div>
            </div>

            {downloadProgress !== undefined && downloadProgress > 0 && (
              <div className={styles.statusItem}>
                <Text size={200} className={styles.statusLabel}>
                  <ArrowDownloadRegular /> {t('common.downloading')}
                </Text>
                <ProgressBar value={downloadProgress} />
              </div>
            )}

            {uploadProgress !== undefined && uploadProgress > 0 && (
              <div className={styles.statusItem}>
                <Text size={200} className={styles.statusLabel}>
                  <ArrowUploadRegular /> {t('common.uploading')}
                </Text>
                <ProgressBar value={uploadProgress} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Sidebar
