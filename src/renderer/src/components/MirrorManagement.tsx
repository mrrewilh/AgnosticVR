import React, { useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  Textarea,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  MessageBar,
  MessageBarBody,
  Spinner,
  tokens,
  makeStyles,
  shorthands
} from '@fluentui/react-components'
import {
  AddRegular,
  DeleteRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ClockRegular,
  PlayRegular,
  RadioButtonRegular,
  RecordRegular,
  DocumentRegular
} from '@fluentui/react-icons'
import { useMirrors } from '../hooks/useMirrors'
import { Mirror } from '@shared/types'
import { useTranslation } from '../hooks/useTranslation'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM
  },
  mirrorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: tokens.spacingVerticalM
  },
  mirrorCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8
    }
  },
  activeMirrorCard: {
    ...shorthands.border('2px', 'solid', tokens.colorBrandBackground)
  },
  mirrorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  mirrorInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS
  },
  addMirrorSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  }
})

const MirrorManagement: React.FC = () => {
  const styles = useStyles()
  const { t } = useTranslation()
  const {
    mirrors,
    isLoading,
    error,
    testingMirrors,
    addMirror,
    removeMirror,
    setActiveMirror,
    testMirror,
    testAllMirrors,
    importMirrorFromFile,
    clearError
  } = useMirrors()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [configContent, setConfigContent] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleAddMirror = async (): Promise<void> => {
    if (!configContent.trim()) return

    setIsAdding(true)
    try {
      const success = await addMirror(configContent.trim())
      if (success) {
        setConfigContent('')
        setShowAddDialog(false)
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleImportFromFile = async (): Promise<void> => {
    setIsImporting(true)
    try {
      await importMirrorFromFile()
    } finally {
      setIsImporting(false)
    }
  }

  const handleRemoveMirror = async (id: string): Promise<void> => {
    if (window.confirm(t('mirrorManagement.confirmRemove'))) {
      await removeMirror(id)
    }
  }

  const handleSetActive = async (id: string): Promise<void> => {
    await setActiveMirror(id)
  }

  const handleTestMirror = async (id: string): Promise<void> => {
    await testMirror(id)
  }

  const handleTestAll = async (): Promise<void> => {
    await testAllMirrors()
  }

  const getStatusIcon = (mirror: Mirror): React.JSX.Element => {
    if (testingMirrors.has(mirror.id)) {
      return <Spinner size="tiny" />
    }

    switch (mirror.testStatus) {
      case 'success':
        return <CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground1 }} />
      case 'failed':
        return <DismissCircleRegular style={{ color: tokens.colorPaletteRedForeground1 }} />
      case 'testing':
        return <Spinner size="tiny" />
      default:
        return <ClockRegular style={{ color: tokens.colorNeutralForeground3 }} />
    }
  }

  const getStatusText = (mirror: Mirror): string => {
    if (testingMirrors.has(mirror.id)) {
      return t('mirrorManagement.testing')
    }

    switch (mirror.testStatus) {
      case 'success':
        return t('mirrorManagement.online')
      case 'failed':
        return t('mirrorManagement.failed')
      case 'testing':
        return t('mirrorManagement.testing')
      default:
        return t('mirrorManagement.untested')
    }
  }

  const formatLastTested = (date?: Date): string => {
    if (!date) return t('mirrorManagement.never')
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    )
  }

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          <Button
            appearance="secondary"
            icon={<PlayRegular />}
            onClick={handleTestAll}
            disabled={mirrors.length === 0}
          >
            {t('mirrorManagement.testAll')}
          </Button>
          <Button
            appearance="secondary"
            icon={<DocumentRegular />}
            onClick={handleImportFromFile}
            disabled={isImporting}
          >
            {isImporting ? <Spinner size="tiny" /> : t('mirrorManagement.importFromFile')}
          </Button>
          <Dialog open={showAddDialog} onOpenChange={(_, data) => setShowAddDialog(data.open)}>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary" icon={<AddRegular />}>
                {t('mirrorManagement.addMirror')}
              </Button>
            </DialogTrigger>
            <DialogSurface>
              <DialogTitle>{t('mirrorManagement.addNewMirror')}</DialogTitle>
              <DialogContent className={styles.dialogContent}>
                <DialogBody>
                  <Text>{t('mirrorManagement.mirrorConfigHint')}</Text>
                  <Textarea
                    placeholder={`${t('mirrorManagement.mirrorConfigPlaceholder')}`}
                    value={configContent}
                    onChange={(_, data) => setConfigContent(data.value)}
                    rows={8}
                    resize="vertical"
                  />
                </DialogBody>
                <DialogActions>
                  <Button
                    appearance="secondary"
                    onClick={() => setShowAddDialog(false)}
                    disabled={isAdding}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    appearance="primary"
                    onClick={handleAddMirror}
                    disabled={!configContent.trim() || isAdding}
                  >
                    {isAdding ? <Spinner size="tiny" /> : t('mirrorManagement.addMirror')}
                  </Button>
                </DialogActions>
              </DialogContent>
            </DialogSurface>
          </Dialog>
        </div>
      </div>

      {error && (
        <MessageBar intent="error" onDismiss={clearError}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {isLoading ? (
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXL }}
        >
          <Spinner size="medium" label={t('common.loading')} />
        </div>
      ) : mirrors.length === 0 ? (
        <Card>
          <CardPreview>
            <div style={{ padding: tokens.spacingVerticalXL, textAlign: 'center' }}>
              <Text>{t('mirrorManagement.noMirrors')}</Text>
            </div>
          </CardPreview>
        </Card>
      ) : (
        <div className={styles.mirrorGrid}>
          {mirrors.map((mirror) => (
            <Card
              key={mirror.id}
              className={`${styles.mirrorCard} ${mirror.isActive ? styles.activeMirrorCard : ''}`}
              onClick={() => !mirror.isActive && handleSetActive(mirror.id)}
            >
              <CardHeader
                header={
                  <div className={styles.mirrorHeader}>
                    <div className={styles.mirrorInfo}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: tokens.spacingHorizontalXS
                        }}
                      >
                        {mirror.isActive ? (
                          <RecordRegular color={tokens.colorPaletteGreenForeground1} />
                        ) : (
                          <RadioButtonRegular />
                        )}
                        <Text weight="semibold">{mirror.name}</Text>
                      </div>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {mirror.config.type}://{mirror.config.host}
                        {mirror.config.port && `:${mirror.config.port}`}
                      </Text>
                    </div>
                    <div className={styles.statusBadge}>
                      {getStatusIcon(mirror)}
                      <Badge
                        appearance="outline"
                        color={
                          mirror.testStatus === 'success'
                            ? 'success'
                            : mirror.testStatus === 'failed'
                              ? 'danger'
                              : 'informative'
                        }
                      >
                        {getStatusText(mirror)}
                      </Badge>
                    </div>
                  </div>
                }
              />
              <CardPreview>
                <div style={{ padding: tokens.spacingVerticalS }}>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                    {t('mirrorManagement.lastTested')} {formatLastTested(mirror.lastTested)}
                  </Text>
                  {mirror.testError && (
                    <Text size={100} style={{ color: tokens.colorPaletteRedForeground1 }}>
                      {t('common.error')}: {mirror.testError}
                    </Text>
                  )}
                  <div className={styles.actions}>
                    <Button
                      size="small"
                      appearance="secondary"
                      icon={<PlayRegular />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTestMirror(mirror.id)
                      }}
                      disabled={testingMirrors.has(mirror.id)}
                    >
                      {t('mirrorManagement.test')}
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      icon={<DeleteRegular />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveMirror(mirror.id)
                      }}
                    >
                      {t('mirrorManagement.remove')}
                    </Button>
                  </div>
                </div>
              </CardPreview>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MirrorManagement
