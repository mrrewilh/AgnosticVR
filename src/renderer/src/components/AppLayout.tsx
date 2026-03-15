import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { AdbProvider } from '../context/AdbProvider'
import { GamesProvider } from '../context/GamesProvider'
import DeviceList from './DeviceList'
import GamesView from './GamesView'
import DownloadsView from './DownloadsView'
import UploadsView from './UploadsView'
import Settings from './Settings'
import { UpdateNotification } from './UpdateNotification'
import UploadGamesDialog from './UploadGamesDialog'
import Sidebar, { NavItem } from './Sidebar'
import CommandPalette, { CommandAction } from './CommandPalette'
import {
  FluentProvider,
  makeStyles,
  tokens,
  Spinner,
  Text,
  teamsDarkTheme,
  teamsLightTheme,
  Button,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody
} from '@fluentui/react-components'
import { useDependency } from '../hooks/useDependency'
import { DependencyProvider } from '../context/DependencyProvider'
import { DownloadProvider } from '../context/DownloadProvider'
import { SettingsProvider } from '../context/SettingsProvider'
import { useDownload } from '../hooks/useDownload'
import { DismissRegular as CloseIcon } from '@fluentui/react-icons'
import { UploadProvider } from '@renderer/context/UploadProvider'
import { useUpload } from '@renderer/hooks/useUpload'
import { GameDialogProvider } from '@renderer/context/GameDialogProvider'
import { useSettings } from '@renderer/hooks/useSettings'

enum AppView {
  DEVICE_LIST,
  GAMES
}

type ActiveTab = 'games' | 'settings'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    overflow: 'hidden'
  },
  sidebarCollapsed: {
    width: '60px'
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  compactHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalNone} ${tokens.spacingHorizontalL}`,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground3,
    gap: tokens.spacingHorizontalM,
    justifyContent: 'space-between',
    height: '60px',
    flexShrink: 0
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalNone} ${tokens.spacingHorizontalL}`,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground3,
    gap: tokens.spacingHorizontalM,
    justifyContent: 'space-between',
    height: '90px',
    flexShrink: 0
  },
  logo: {
    height: '32px'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM
  },
  mainContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    height: 'calc(100vh - 60px)',
    position: 'relative'
  },
  loadingOrErrorContainer: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalL
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM
  },
  tabs: {
    marginLeft: tokens.spacingHorizontalM,
    marginRight: tokens.spacingHorizontalM
  },
  searchButton: {
    minWidth: '200px',
    justifyContent: 'flex-start'
  }
})

interface MainContentProps {
  currentView: AppView
  activeTab: ActiveTab
  onDeviceConnected: () => void
  onSkipConnection: () => void
  onBackToDeviceList: () => void
}

const MainContent: React.FC<MainContentProps> = ({
  currentView,
  activeTab,
  onDeviceConnected,
  onSkipConnection,
  onBackToDeviceList
}) => {
  const styles = useStyles()
  const {
    isReady: dependenciesReady,
    error: dependencyError,
    progress: dependencyProgress,
    status: dependencyStatus
  } = useDependency()

  const renderCurrentView = (): React.ReactNode => {
    if (currentView === AppView.DEVICE_LIST) {
      return <DeviceList onConnected={onDeviceConnected} onSkip={onSkipConnection} />
    }

    // Return the appropriate content based on active tab
    if (activeTab === 'settings') {
      return <Settings />
    } else {
      return <GamesView onBackToDevices={onBackToDeviceList} />
    }
  }

  if (!dependenciesReady) {
    if (dependencyError) {
      // Check if this is a connectivity error
      if (dependencyError.startsWith('CONNECTIVITY_ERROR|')) {
        const failedUrls = dependencyError.replace('CONNECTIVITY_ERROR|', '').split('|')

        return (
          <div className={styles.loadingOrErrorContainer}>
            <Text weight="semibold" style={{ color: tokens.colorPaletteRedForeground1 }}>
              Network Connectivity Issues
            </Text>
            <Text>Cannot reach the following services:</Text>
            <ul style={{ textAlign: 'left', marginTop: tokens.spacingVerticalS }}>
              {failedUrls.map((url, index) => (
                <li key={index} style={{ marginBottom: tokens.spacingVerticalXS }}>
                  <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>{url}</Text>
                </li>
              ))}
            </ul>
            <Text style={{ marginTop: tokens.spacingVerticalM }}>
              This is likely due to DNS or firewall restrictions. Please try:
            </Text>
            <ol style={{ textAlign: 'left', marginTop: tokens.spacingVerticalS }}>
              <li style={{ marginBottom: tokens.spacingVerticalXS }}>
                <Text>Change your DNS to Cloudflare (1.1.1.1) or Google (8.8.8.8)</Text>
              </li>
              <li style={{ marginBottom: tokens.spacingVerticalXS }}>
                <Text>Use a VPN like ProtonVPN or 1.1.1.1 VPN</Text>
              </li>
              <li style={{ marginBottom: tokens.spacingVerticalXS }}>
                <Text>Check your router/firewall settings</Text>
              </li>
            </ol>
            <Text style={{ marginTop: tokens.spacingVerticalM }}>
              For detailed troubleshooting, see:{' '}
              <a
                href="https://github.com/slax81/mythicquestvr#troubleshooting-guide"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: tokens.colorBrandForeground1 }}
              >
                Troubleshooting Guide
              </a>
            </Text>
          </div>
        )
      }

      // Handle other dependency errors
      const errorDetails: string[] = []
      if (!dependencyStatus?.sevenZip.ready) errorDetails.push('7zip')
      if (!dependencyStatus?.rclone.ready) errorDetails.push('rclone')
      if (!dependencyStatus?.adb.ready) errorDetails.push('adb')

      const failedDeps = errorDetails.length > 0 ? ` (${errorDetails.join(', ')})` : ''

      return (
        <div className={styles.loadingOrErrorContainer}>
          <Text weight="semibold" style={{ color: tokens.colorPaletteRedForeground1 }}>
            Dependency Error {failedDeps}
          </Text>
          <Text>{dependencyError}</Text>
        </div>
      )
    }
    let progressText = 'Checking requirements...'
    console.log('dependencyStatus', dependencyStatus)
    console.log('dependencyProgress', dependencyProgress)

    if (dependencyProgress?.name === 'connectivity-check') {
      progressText = `Checking network connectivity... ${dependencyProgress.percentage}%`
    } else if (dependencyStatus?.rclone.downloading && dependencyProgress) {
      progressText = `Setting up ${dependencyProgress.name}... ${dependencyProgress.percentage}%`
      if (dependencyProgress.name === 'rclone-extract') {
        progressText = `Extracting ${dependencyProgress.name.replace('-extract', '')}...`
      }
    } else if (dependencyStatus?.adb.downloading && dependencyProgress) {
      progressText = `Setting up ${dependencyProgress.name}... ${dependencyProgress.percentage}%`
      if (dependencyProgress.name === 'adb-extract') {
        progressText = `Extracting ${dependencyProgress.name.replace('-extract', '')}...`
      }
    } else if (
      dependencyStatus &&
      (!dependencyStatus.sevenZip.ready ||
        !dependencyStatus.rclone.ready ||
        !dependencyStatus.adb.ready)
    ) {
      progressText = 'Setting up requirements...'
    }

    return (
      <div className={styles.loadingOrErrorContainer}>
        <Spinner size="huge" />
        <Text>{progressText}</Text>
      </div>
    )
  }

  return (
    <>
      <UploadGamesDialog />
      {renderCurrentView()}
    </>
  )
}

const AppLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DEVICE_LIST)
  const [activeTab, setActiveTab] = useState<ActiveTab>('games')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { colorScheme, setColorScheme } = useSettings()
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false)
  const [isUploadsOpen, setIsUploadsOpen] = useState(false)
  const mountNodeRef = useRef<HTMLDivElement>(null)
  const styles = useStyles()
  const { queue: downloadQueue } = useDownload()
  const { queue: uploadQueue } = useUpload()

  const activeNavItem = useMemo((): NavItem => {
    if (currentView === AppView.DEVICE_LIST) return 'devices'
    if (activeTab === 'settings') return 'settings'
    return 'games'
  }, [currentView, activeTab])

  const handleNavClick = useCallback((item: NavItem) => {
    if (item === 'devices') {
      setCurrentView(AppView.DEVICE_LIST)
    } else if (item === 'settings') {
      setCurrentView(AppView.GAMES)
      setActiveTab('settings')
    } else if (item === 'games') {
      setCurrentView(AppView.GAMES)
      setActiveTab('games')
    } else if (item === 'downloads') {
      setIsDownloadsOpen(true)
    } else if (item === 'uploads') {
      setIsUploadsOpen(true)
    }
  }, [])

  const handleCommandExecute = useCallback(
    (command: CommandAction) => {
      switch (command) {
        case 'navigate-games':
          setCurrentView(AppView.GAMES)
          setActiveTab('games')
          break
        case 'navigate-devices':
          setCurrentView(AppView.DEVICE_LIST)
          break
        case 'navigate-downloads':
          setIsDownloadsOpen(true)
          break
        case 'navigate-uploads':
          setIsUploadsOpen(true)
          break
        case 'navigate-settings':
          setCurrentView(AppView.GAMES)
          setActiveTab('settings')
          break
        case 'toggle-dark-mode':
          setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
          break
        case 'toggle-sidebar':
          setSidebarCollapsed(!sidebarCollapsed)
          break
      }
    },
    [colorScheme, sidebarCollapsed, setColorScheme]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarCollapsed(!sidebarCollapsed)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarCollapsed])

  const handleDeviceConnected = (): void => {
    setCurrentView(AppView.GAMES)
  }

  const handleSkipConnection = (): void => {
    setCurrentView(AppView.GAMES)
  }

  const handleBackToDeviceList = (): void => {
    setCurrentView(AppView.DEVICE_LIST)
  }

  const downloadProgress = useMemo(() => {
    const activeDownloads = downloadQueue.filter((item) => item.status === 'Downloading')
    if (activeDownloads.length > 0) {
      return activeDownloads[0].progress
    }
    return 0
  }, [downloadQueue])

  const uploadProgress = useMemo(() => {
    const activeUploads = uploadQueue.filter((item) => item.status === 'Uploading')
    if (activeUploads.length > 0) {
      return activeUploads[0].progress
    }
    return 0
  }, [uploadQueue])

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent): void => {
      setColorScheme(e.matches ? 'dark' : 'light')
    }

    darkModeMediaQuery.addEventListener('change', handleChange)

    return () => {
      darkModeMediaQuery.removeEventListener('change', handleChange)
    }
  }, [setColorScheme])

  useEffect(() => {
    document.body.setAttribute('data-theme', colorScheme)
  }, [colorScheme])

  const currentTheme = colorScheme === 'dark' ? teamsDarkTheme : teamsLightTheme

  return (
    <FluentProvider theme={currentTheme}>
      <AdbProvider>
        <GamesProvider>
          <GameDialogProvider>
            <div className={styles.root}>
              <Sidebar
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                activeItem={activeNavItem}
                onNavigate={handleNavClick}
                deviceConnected={currentView === AppView.GAMES}
                downloadProgress={downloadProgress}
                uploadProgress={uploadProgress}
              />

              <div className={styles.mainArea}>
                <div className={styles.mainContent} id="mainContent">
                  <MainContent
                    currentView={currentView}
                    activeTab={activeTab}
                    onDeviceConnected={handleDeviceConnected}
                    onSkipConnection={handleSkipConnection}
                    onBackToDeviceList={handleBackToDeviceList}
                  />
                </div>
              </div>

              <CommandPalette
                open={commandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
                onExecute={handleCommandExecute}
                darkMode={colorScheme === 'dark'}
              />

              {/* Add UpdateNotification component here - it manages its own visibility */}
              <UpdateNotification />

              <Drawer
                type="overlay"
                separator
                open={isDownloadsOpen}
                onOpenChange={(_, { open }) => setIsDownloadsOpen(open)}
                position="end"
                style={{ width: '700px' }}
                mountNode={mountNodeRef.current}
              >
                <DrawerHeader>
                  <DrawerHeaderTitle
                    action={
                      <Button
                        appearance="subtle"
                        aria-label="Close"
                        icon={<CloseIcon />}
                        onClick={() => setIsDownloadsOpen(false)}
                      />
                    }
                  >
                    Downloads
                  </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody>
                  <div>
                    <DownloadsView onClose={() => setIsDownloadsOpen(false)} />
                  </div>
                </DrawerBody>
              </Drawer>

              <Drawer
                type="overlay"
                separator
                open={isUploadsOpen}
                onOpenChange={(_, { open }) => setIsUploadsOpen(open)}
                position="end"
                style={{ width: '700px' }}
                mountNode={mountNodeRef.current}
              >
                <DrawerHeader>
                  <DrawerHeaderTitle
                    action={
                      <Button
                        appearance="subtle"
                        aria-label="Close"
                        icon={<CloseIcon />}
                        onClick={() => setIsUploadsOpen(false)}
                      />
                    }
                  >
                    Uploads
                  </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody>
                  <div>
                    <UploadsView />
                  </div>
                </DrawerBody>
              </Drawer>
            </div>
            <div
              id="portal-parent"
              style={{
                zIndex: 1000,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none'
              }}
            >
              <div ref={mountNodeRef} id="portal" style={{ pointerEvents: 'auto' }}></div>
            </div>
          </GameDialogProvider>
        </GamesProvider>
      </AdbProvider>
    </FluentProvider>
  )
}

const AppLayoutWithProviders: React.FC = () => {
  return (
    <SettingsProvider>
      <DependencyProvider>
        <DownloadProvider>
          <UploadProvider>
            <AppLayout />
          </UploadProvider>
        </DownloadProvider>
      </DependencyProvider>
    </SettingsProvider>
  )
}

export default AppLayoutWithProviders
