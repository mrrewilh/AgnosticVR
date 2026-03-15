import React, { useEffect, useState } from 'react'
import {
  Button,
  Text,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Spinner,
  makeStyles,
  tokens,
  TabList,
  Tab,
  TabValue
} from '@fluentui/react-components'
import { UpdateInfo } from '@shared/types'
import { ArrowDownloadRegular, CodeRegular, DocumentTextRegular } from '@fluentui/react-icons'
import { useTranslation } from '../hooks/useTranslation'

const useStyles = makeStyles({
  updateContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  releaseInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalM
  },
  highlightVersion: {
    fontWeight: 'bold',
    color: tokens.colorBrandForeground1
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalM
  },
  spinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  contentWithIcon: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM
  },
  icon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1
  },
  tabContent: {
    marginTop: tokens.spacingVerticalM,
    height: '300px',
    overflowY: 'auto'
  },
  commitList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  commitItem: {
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  commitHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXS
  },
  commitSha: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '2px 6px',
    borderRadius: tokens.borderRadiusSmall
  },
  commitMessage: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalXS
  },
  commitMeta: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  commitLink: {
    color: tokens.colorBrandForeground1,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  releaseNotes: {
    maxHeight: '300px',
    overflowY: 'auto'
  }
})

export function UpdateNotification(): React.ReactElement | null {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null)
  const [updateError, setUpdateError] = useState<Error | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<TabValue>('release-notes')
  const styles = useStyles()
  const { t } = useTranslation()

  useEffect(() => {
    // Set up update listeners
    const removeCheckingListener = window.api.updates?.onCheckingForUpdate?.(() => {
      console.log('Checking for updates...')
      setIsChecking(true)
      setUpdateError(null)
    })

    const removeAvailableListener = window.api.updates?.onUpdateAvailable?.((info) => {
      console.log('Update available:', info)
      setUpdateAvailable(info)
      setIsChecking(false)
      // Automatically open dialog when update is available
      setIsDialogOpen(true)
      // Default to commits tab if available, otherwise release notes
      setSelectedTab(info.commits && info.commits.length > 0 ? 'commits' : 'release-notes')
    })

    const removeErrorListener = window.api.updates?.onUpdateError?.((error) => {
      console.error('Update error:', error)
      setUpdateError(error)
      setIsChecking(false)
    })

    return () => {
      // Clean up listeners on component unmount
      removeCheckingListener?.()
      removeAvailableListener?.()
      removeErrorListener?.()
    }
  }, [])

  const handleCheckForUpdates = async (): Promise<void> => {
    try {
      setIsChecking(true)
      await window.api.updates?.checkForUpdates?.()
    } catch (error) {
      console.error('Failed to check for updates:', error)
      setIsChecking(false)
    }
  }

  const handleDownload = (): void => {
    if (updateAvailable?.downloadUrl) {
      window.api.updates?.openDownloadPage?.(updateAvailable.downloadUrl)
      setIsDialogOpen(false)
    }
  }

  const handleViewReleases = (): void => {
    window.api.updates?.openReleasesPage?.()
  }

  const handleDismiss = (): void => {
    setIsDialogOpen(false)
  }

  const formatCommitDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Don't render if there's nothing to show
  if (!updateAvailable && !isChecking && !updateError) {
    return null
  }

  let dialogTitle = t('update.checking')
  let dialogIcon: React.ReactNode = null
  let dialogContent: React.ReactNode = null

  if (isChecking) {
    dialogTitle = t('update.checking')
    dialogContent = (
      <div className={styles.spinnerContainer}>
        <Spinner size="tiny" />
        <Text>{t('update.checkingForVersion')}</Text>
      </div>
    )
  } else if (updateError) {
    dialogTitle = t('update.error')
    dialogIcon = (
      <Badge appearance="filled" color="danger">
        {t('common.error')}
      </Badge>
    )
    dialogContent = (
      <div className={styles.updateContent}>
        <Text>
          {t('update.failedCheck')} {updateError.message}
        </Text>
      </div>
    )
  } else if (updateAvailable) {
    dialogTitle = t('update.available')
    dialogIcon = <ArrowDownloadRegular className={styles.icon} />

    const hasCommits = updateAvailable.commits && updateAvailable.commits.length > 0
    const hasReleaseNotes =
      updateAvailable.releaseNotes && updateAvailable.releaseNotes.trim().length > 0

    dialogContent = (
      <div className={styles.updateContent}>
        <div className={styles.contentWithIcon}>
          <div className={styles.releaseInfo}>
            <Text size="large">
              {t('update.newVersionAvailable', { version: updateAvailable.version })}
            </Text>

            {updateAvailable.releaseDate && (
              <Text size="small">
                {t('update.released')} {new Date(updateAvailable.releaseDate).toLocaleDateString()}
              </Text>
            )}

            {(hasReleaseNotes || hasCommits) && (
              <>
                <TabList
                  selectedValue={selectedTab}
                  onTabSelect={(_, data) => setSelectedTab(data.value)}
                  style={{ marginTop: tokens.spacingVerticalM }}
                >
                  {hasReleaseNotes && (
                    <Tab value="release-notes" icon={<DocumentTextRegular />}>
                      {t('update.releaseNotes')}
                    </Tab>
                  )}
                  {hasCommits && (
                    <Tab value="commits" icon={<CodeRegular />}>
                      {t('update.changelog')} ({updateAvailable.commits?.length || 0}{' '}
                      {t('update.commits')})
                    </Tab>
                  )}
                </TabList>

                <div className={styles.tabContent}>
                  {selectedTab === 'release-notes' && hasReleaseNotes && (
                    <div className={styles.releaseNotes}>
                      <div
                        dangerouslySetInnerHTML={{ __html: updateAvailable.releaseNotes || '' }}
                      />
                    </div>
                  )}

                  {selectedTab === 'commits' && hasCommits && (
                    <div className={styles.commitList}>
                      {updateAvailable.commits?.map((commit) => (
                        <div key={commit.sha} className={styles.commitItem}>
                          <div className={styles.commitHeader}>
                            <span className={styles.commitSha}>{commit.sha}</span>
                          </div>
                          <div className={styles.commitMessage}>{commit.message}</div>
                          <div className={styles.commitMeta}>
                            <span>
                              {t('update.by')} {commit.author}
                            </span>
                            <span>
                              {formatCommitDate(commit.date)} •{' '}
                              <a
                                href="#"
                                className={styles.commitLink}
                                onClick={(e) => {
                                  e.preventDefault()
                                  window.api.updates?.openDownloadPage?.(commit.url)
                                }}
                              >
                                {t('update.viewCommit')}
                              </a>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e0e0e0' }}>
              <Text size="small" style={{ color: '#666' }}>
                {t('update.viewReleases')}{' '}
                <Button
                  appearance="transparent"
                  size="small"
                  onClick={() => window.api.updates?.openRepositoryPage?.()}
                  style={{ padding: '0', height: 'auto', minHeight: 'auto' }}
                >
                  {t('update.githubRepo')} (https://github.com/slax81/agnosticvr)
                </Button>{' '}
              </Text>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={(_, { open }) => setIsDialogOpen(open)}>
      <DialogSurface style={{ minWidth: '600px', maxWidth: '800px' }}>
        <DialogBody>
          <DialogTitle>
            {dialogIcon && <span style={{ marginRight: '8px' }}>{dialogIcon}</span>}
            {dialogTitle}
          </DialogTitle>

          <DialogContent>{dialogContent}</DialogContent>

          <DialogActions>
            {updateError ? (
              <>
                <Button appearance="secondary" onClick={handleDismiss}>
                  {t('update.dismiss')}
                </Button>
                <Button appearance="primary" onClick={handleCheckForUpdates}>
                  {t('update.tryAgain')}
                </Button>
              </>
            ) : updateAvailable ? (
              <>
                <Button appearance="secondary" onClick={handleDismiss}>
                  {t('update.remindLater')}
                </Button>
                <Button appearance="secondary" onClick={handleViewReleases}>
                  {t('update.viewReleases')}
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleDownload}
                  disabled={!updateAvailable.downloadUrl}
                  icon={<ArrowDownloadRegular />}
                >
                  {t('update.downloadUpdate')}
                </Button>
              </>
            ) : (
              <Button appearance="secondary" onClick={handleDismiss}>
                {t('update.close')}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
