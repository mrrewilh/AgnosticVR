import React from 'react'
import { useDownload } from '../hooks/useDownload'
import { useAdb } from '../hooks/useAdb'
import { DownloadItem } from '@shared/types'
import {
  makeStyles,
  tokens,
  Title2,
  Text,
  Button,
  ProgressBar,
  Image,
  Badge
} from '@fluentui/react-components'
import {
  DeleteRegular,
  DismissRegular as CloseIcon,
  ArrowCounterclockwiseRegular as RetryIcon,
  ArrowDownloadRegular as DownloadInstallIcon,
  BroomRegular as UninstallIcon
} from '@fluentui/react-icons'
import { formatDistanceToNow } from 'date-fns'
import placeholderImage from '../assets/images/game-placeholder.png'
import { useGames } from '@renderer/hooks/useGames'
import { useGameDialog } from '@renderer/hooks/useGameDialog'
import { useTranslation } from '../hooks/useTranslation'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    padding: tokens.spacingHorizontalXXL,
    gap: tokens.spacingVerticalL
  },
  itemRow: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr auto auto', // Thumbnail, Info, Progress/Status, Actions
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`
  },
  thumbnail: {
    width: '60px',
    height: '60px',
    objectFit: 'cover'
  },
  gameInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    cursor: 'pointer'
  },
  gameNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  installedBadge: {
    fontSize: tokens.fontSizeBase100
  },
  progressStatus: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: tokens.spacingVerticalXS,
    width: '150px' // Fixed width for progress/status text
  },
  progressBar: {
    width: '100%'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalXS,
    alignItems: 'flex-end'
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200
  },
  statusText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  }
})

interface DownloadsViewProps {
  onClose: () => void
}

const DownloadsView: React.FC<DownloadsViewProps> = ({ onClose }) => {
  const styles = useStyles()
  const { t } = useTranslation()
  const { queue, isLoading, error, removeFromQueue, cancelDownload, retryDownload } = useDownload()
  const { selectedDevice, isConnected, loadPackages } = useAdb()
  const { games } = useGames()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setDialogGame] = useGameDialog()

  const formatAddedTime = (timestamp: number): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (e: unknown) {
      console.error('Error formatting date:', e)
      return 'Invalid date'
    }
  }

  const handleInstallFromCompleted = (releaseName: string): void => {
    if (!releaseName || !selectedDevice) {
      console.error('Missing releaseName or selectedDevice for install from completed action')
      window.alert('Cannot start installation: Missing required information.')
      return
    }
    console.log(`Requesting install from completed for ${releaseName} on ${selectedDevice}`)
    window.api.downloads.installFromCompleted(releaseName, selectedDevice).catch((err) => {
      console.error('Error triggering install from completed:', err)
      window.alert('Failed to start installation. Please check the main process logs.')
    })
  }

  const handleUninstall = async (item: DownloadItem): Promise<void> => {
    const game = games.find((g) => g.releaseName === item.releaseName)
    if (!game || !game.packageName || !selectedDevice) {
      console.error('Cannot uninstall: Missing game data, package name, or selected device')
      window.alert('Cannot uninstall: Missing required information.')
      return
    }

    const confirmUninstall = window.confirm(
      `Are you sure you want to uninstall ${game.name} (${game.packageName})? This will remove the app and its data from the device.`
    )

    if (confirmUninstall) {
      console.log(`Uninstalling ${game.packageName} from ${selectedDevice}`)
      try {
        const success = await window.api.adb.uninstallPackage(selectedDevice, game.packageName)
        if (success) {
          console.log('Uninstall successful')
          await loadPackages()
        } else {
          console.error('Uninstall failed')
          window.alert('Failed to uninstall the game.')
        }
      } catch (err) {
        console.error('Error during uninstall:', err)
        window.alert('An error occurred during uninstallation.')
      }
    }
  }

  const isInstalled = (releaseName: string): boolean => {
    return games.some((game) => game.releaseName === releaseName && game.isInstalled)
  }

  if (isLoading) {
    return <div className={styles.root}>{t('downloads.loading')}</div>
  }

  if (error) {
    return (
      <div className={styles.root}>
        <Title2>{t('downloads.title')}</Title2>
        <Text style={{ color: tokens.colorPaletteRedForeground1 }}>
          {t('downloads.errorLoading')} {error}
        </Text>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {queue.length === 0 ? (
        <Text>{t('downloads.empty')}</Text>
      ) : (
        <div>
          <Title2>{t('downloads.title')}</Title2>
          {queue
            .sort((a, b) => b.addedDate - a.addedDate)
            .map((item) => (
              <div key={item.releaseName} className={styles.itemRow}>
                {/* Thumbnail */}
                <Image
                  src={item.thumbnailPath ? `file://${item.thumbnailPath}` : placeholderImage}
                  alt={`${item.gameName} thumbnail`}
                  className={styles.thumbnail}
                  shape="rounded"
                  fit="cover"
                />
                {/* Game Info */}
                <div
                  className={styles.gameInfo}
                  onClick={() => {
                    let gameToOpen = games.find((g) => g.releaseName === item.releaseName)
                    if (!gameToOpen) {
                      console.log('Game not found by release name, trying by package name')
                      gameToOpen = games.find((g) => g.packageName === item.packageName)
                    }
                    if (gameToOpen) {
                      setDialogGame(gameToOpen)
                    }
                    onClose()
                  }}
                >
                  <div className={styles.gameNameRow}>
                    <Text weight="semibold">{item.gameName}</Text>
                    {isInstalled(item.releaseName) && (
                      <Badge
                        appearance="filled"
                        color="success"
                        size="small"
                        className={styles.installedBadge}
                      >
                        {t('gameDetails.installed')}
                      </Badge>
                    )}
                  </div>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                    {item.releaseName}
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {t('downloads.added')} {formatAddedTime(item.addedDate)}
                  </Text>
                </div>
                {/* Progress / Status */}
                <div className={styles.progressStatus}>
                  {item.status === 'Downloading' && (
                    <>
                      <ProgressBar value={item.progress / 100} className={styles.progressBar} />
                      <Text className={styles.statusText}>{item.progress}%</Text>
                      {item.speed && (
                        <Text size={200} className={styles.statusText}>
                          {t('downloads.speed')} {item.speed}
                        </Text>
                      )}
                      {item.eta &&
                        item.eta !== '-' && ( // Don't show ETA if it's just '-'
                          <Text size={200} className={styles.statusText}>
                            {t('downloads.eta')} {item.eta}
                          </Text>
                        )}
                    </>
                  )}
                  {/* Added Extraction Progress Display */}
                  {item.status === 'Extracting' && (
                    <>
                      <ProgressBar
                        value={(item.extractProgress || 0) / 100}
                        className={styles.progressBar}
                      />
                      <Text className={styles.statusText}>
                        {t('downloads.extracting')} {item.extractProgress || 0}%
                      </Text>
                    </>
                  )}
                  {item.status === 'Installing' && (
                    <Text className={styles.statusText}>{t('downloads.installing')}</Text>
                  )}
                  {item.status === 'Queued' && (
                    <Text className={styles.statusText}>{t('games.queued')}</Text>
                  )}
                  {item.status === 'Completed' && (
                    <Text style={{ color: tokens.colorPaletteGreenForeground1 }}>
                      {t('downloads.completed')}
                    </Text>
                  )}
                  {item.status === 'Cancelled' && (
                    <Text className={styles.statusText}>{t('downloads.cancelled')}</Text>
                  )}
                  {item.status === 'Error' && (
                    <>
                      <Text className={styles.errorText}>{t('common.error')}</Text>
                      {item.error && (
                        <Text size={200} className={styles.errorText} title={item.error}>
                          {item.error.substring(0, 30)}...
                        </Text>
                      )}
                    </>
                  )}
                  {item.status === 'InstallError' && (
                    <>
                      <Text className={styles.errorText}>{t('downloads.installError')}</Text>
                      {item.error && (
                        <Text size={200} className={styles.errorText} title={item.error}>
                          {item.error.substring(0, 30)}...
                        </Text>
                      )}
                    </>
                  )}

                  {/* Install/Uninstall Buttons */}
                  {item.status === 'Completed' && !isInstalled(item.releaseName) && (
                    <Button
                      icon={<DownloadInstallIcon />}
                      aria-label={t('downloads.installGame')}
                      size="small"
                      appearance="primary"
                      onClick={() => handleInstallFromCompleted(item.releaseName)}
                      disabled={!isConnected || !selectedDevice}
                      title={
                        !isConnected || !selectedDevice
                          ? t('downloads.connectToInstall')
                          : t('common.install')
                      }
                    >
                      {t('common.install')}
                    </Button>
                  )}

                  {item.status === 'Completed' && isInstalled(item.releaseName) && (
                    <Button
                      icon={<UninstallIcon />}
                      aria-label={t('downloads.uninstallGame')}
                      size="small"
                      appearance="outline"
                      onClick={() => handleUninstall(item)}
                      disabled={!isConnected || !selectedDevice}
                      title={
                        !isConnected || !selectedDevice
                          ? t('downloads.connectToUninstall')
                          : t('common.uninstall')
                      }
                    >
                      {t('common.uninstall')}
                    </Button>
                  )}
                </div>
                {/* Actions */}
                <div className={styles.actions}>
                  {/* Cancel Button */}
                  {(item.status === 'Queued' ||
                    item.status === 'Downloading' ||
                    item.status === 'Extracting' ||
                    item.status === 'Installing') && (
                    <Button
                      icon={<CloseIcon />}
                      aria-label={t('common.cancel')}
                      size="small"
                      appearance="subtle"
                      onClick={() => cancelDownload(item.releaseName)}
                      title={t('common.cancel')}
                    />
                  )}

                  {/* Retry Button */}
                  {(item.status === 'Cancelled' ||
                    item.status === 'Error' ||
                    item.status === 'InstallError') && (
                    <Button
                      icon={<RetryIcon />}
                      aria-label={t('downloads.retryDownload')}
                      size="small"
                      appearance="subtle"
                      onClick={() => retryDownload(item.releaseName)}
                      title={t('common.retry')}
                    />
                  )}

                  {/* Remove Button (appears when not actively downloading/extracting/installing) */}
                  {(item.status === 'Completed' ||
                    item.status === 'Cancelled' ||
                    item.status === 'Error' ||
                    item.status === 'InstallError' ||
                    item.status === 'Queued') && (
                    <Button
                      icon={<DeleteRegular />}
                      aria-label={t('downloads.removeFromList')}
                      size="small"
                      appearance="subtle"
                      onClick={async () => await removeFromQueue(item.releaseName)}
                      title={t('downloads.removeFromList')}
                    />
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default DownloadsView
