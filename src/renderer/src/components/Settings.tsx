import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardHeader,
  Text,
  Button,
  Input,
  makeStyles,
  tokens,
  Spinner,
  Title2,
  Subtitle1,
  Dropdown,
  Option,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout
} from '@fluentui/react-components'
import {
  FolderOpenRegular,
  CheckmarkCircleRegular,
  InfoRegular,
  DeleteRegular,
  ShareRegular
} from '@fluentui/react-icons'
import { useSettings } from '../hooks/useSettings'
import { useGames } from '../hooks/useGames'
import { useLogs } from '../hooks/useLogs'
import { useTranslation } from '../hooks/useTranslation'

// Supported speed units with conversion factors to KB/s
const SPEED_UNITS = [
  { label: 'KB/s', value: 'kbps', factor: 1 },
  { label: 'MB/s', value: 'mbps', factor: 1024 }
]

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    position: 'relative',
    height: 'calc(100vh - 90px)', // Account for header height
    overflowY: 'auto',
    padding: tokens.spacingVerticalXL,
    backgroundColor: tokens.colorNeutralBackground1
  },
  contentContainer: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  headerTitle: {
    marginBottom: tokens.spacingVerticalXS
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
    marginBottom: tokens.spacingVerticalL
  },
  card: {
    width: '100%',
    boxShadow: tokens.shadow4,
    borderRadius: tokens.borderRadiusMedium
  },
  cardContent: {
    padding: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalXL
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    marginTop: tokens.spacingVerticalM,
    gap: tokens.spacingHorizontalM,
    width: '100%',
    maxWidth: '800px'
  },
  input: {
    flexGrow: 1
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    marginTop: tokens.spacingVerticalXS
  },
  success: {
    color: tokens.colorPaletteGreenForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS
  },
  hint: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground2
  },
  speedLimitSection: {
    marginTop: tokens.spacingVerticalL
  },
  speedFormRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
    width: '100%',
    maxWidth: '800px'
  },
  speedControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  speedInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  speedInput: {
    width: '140px',
    flexGrow: 1
  },
  unitDropdown: {
    width: '80px',
    minWidth: '80px'
  },
  blacklistTable: {
    marginTop: tokens.spacingVerticalM,
    width: '100%',
    maxWidth: '800px'
  },
  emptyState: {
    marginTop: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
    padding: tokens.spacingVerticalL
  },
  actionButton: {
    minWidth: 'auto'
  }
})

const BlacklistSettings: React.FC = () => {
  const styles = useStyles()
  const { t } = useTranslation()
  const { getBlacklistGames, removeGameFromBlacklist } = useGames()
  const [blacklistGames, setBlacklistGames] = useState<
    { packageName: string; version: number | 'any' }[]
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removeSuccess, setRemoveSuccess] = useState(false)

  const loadBlacklistGames = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const games = await getBlacklistGames()
      setBlacklistGames(games)
    } catch (err) {
      console.error('Error loading blacklisted games:', err)
      setError(t('errors.loadFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBlacklistGames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRemoveFromBlacklist = async (packageName: string): Promise<void> => {
    try {
      setError(null)
      await removeGameFromBlacklist(packageName)
      await loadBlacklistGames()
      setRemoveSuccess(true)

      setTimeout(() => {
        setRemoveSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Error removing game from blacklist:', err)
      setError(t('errors.generic'))
    }
  }

  return (
    <Card className={styles.card}>
      <CardHeader
        description={<Subtitle1 weight="semibold">{t('settings.blacklist')}</Subtitle1>}
      />
      <div className={styles.cardContent}>
        <Text>{t('settings.blacklistDescription')}</Text>

        {isLoading ? (
          <div
            style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalL }}
          >
            <Spinner size="small" label={t('common.loading')} />
          </div>
        ) : (
          <>
            {blacklistGames.length === 0 ? (
              <div className={styles.emptyState}>
                <Text>{t('settings.noBlacklistedGames')}</Text>
              </div>
            ) : (
              <Table className={styles.blacklistTable}>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>{t('settings.packageName')}</TableHeaderCell>
                    <TableHeaderCell>{t('settings.version')}</TableHeaderCell>
                    <TableHeaderCell style={{ width: '100px' }}>
                      {t('settings.actions')}
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blacklistGames.map((game) => (
                    <TableRow key={`${game.packageName}-${game.version}`}>
                      <TableCell>
                        <TableCellLayout>{game.packageName}</TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout>
                          {game.version === 'any' ? t('settings.unlimited') : game.version}
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <Button
                          icon={<DeleteRegular />}
                          appearance="subtle"
                          className={styles.actionButton}
                          onClick={() => handleRemoveFromBlacklist(game.packageName)}
                          aria-label={t('settings.removeFromBlacklist')}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {error && <Text className={styles.error}>{error}</Text>}
            {removeSuccess && (
              <Text className={styles.success}>
                <CheckmarkCircleRegular />
                {t('settings.blacklistRemoveSuccess')}
              </Text>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

const LogUploadSettings: React.FC = () => {
  const styles = useStyles()
  const { t } = useTranslation()
  const {
    isUploading,
    uploadError,
    uploadSuccess,
    shareableUrl,
    password,
    uploadCurrentLog,
    clearUploadState
  } = useLogs()

  const handleUploadLog = async (): Promise<void> => {
    clearUploadState()
    await uploadCurrentLog()
  }

  const handleCopyUrl = (): void => {
    if (shareableUrl) {
      navigator.clipboard.writeText(shareableUrl)
    }
  }

  const handleCopyPassword = (): void => {
    if (password) {
      navigator.clipboard.writeText(password)
    }
  }

  return (
    <Card className={styles.card}>
      <CardHeader
        description={<Subtitle1 weight="semibold">{t('settings.logUpload')}</Subtitle1>}
      />
      <div className={styles.cardContent}>
        <Text>{t('settings.logUploadDescription')}</Text>

        <div className={styles.formRow}>
          <Button
            onClick={handleUploadLog}
            appearance="primary"
            size="large"
            disabled={isUploading}
            icon={<ShareRegular />}
          >
            {isUploading ? t('settings.uploading') : t('settings.uploadLog')}
          </Button>
        </div>

        {uploadError && <Text className={styles.error}>{uploadError}</Text>}

        {uploadSuccess && shareableUrl && (
          <div className={styles.success}>
            <CheckmarkCircleRegular />
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
              <Text>{t('settings.logUploaded')}</Text>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS }}
              >
                <Text weight="semibold">{t('settings.url')}</Text>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}
                >
                  <Input
                    value={shareableUrl}
                    readOnly
                    style={{ flexGrow: 1, fontFamily: 'monospace', fontSize: '12px' }}
                  />
                  <Button onClick={handleCopyUrl} size="small" appearance="secondary">
                    {t('settings.copyUrl')}
                  </Button>
                </div>
              </div>

              {password && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: tokens.spacingVerticalXS
                  }}
                >
                  <Text weight="semibold">{t('settings.password')}</Text>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacingHorizontalS
                    }}
                  >
                    <Input
                      value={password}
                      readOnly
                      style={{
                        width: '200px',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Button onClick={handleCopyPassword} size="small" appearance="secondary">
                      {t('settings.copyPassword')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Text className={styles.hint}>
          <InfoRegular />
          {t('settings.logUploadHint')}
        </Text>
      </div>
    </Card>
  )
}

const Settings: React.FC = () => {
  const styles = useStyles()
  const { t, language } = useTranslation()
  const {
    downloadPath,
    downloadSpeedLimit,
    uploadSpeedLimit,
    colorScheme,
    isLoading,
    error,
    setDownloadPath,
    setDownloadSpeedLimit,
    setUploadSpeedLimit,
    setColorScheme,
    setLanguage
  } = useSettings()
  const [editedDownloadPath, setEditedDownloadPath] = useState(downloadPath)

  // New state for speed input values
  const [downloadSpeedInput, setDownloadSpeedInput] = useState(
    downloadSpeedLimit > 0 ? String(downloadSpeedLimit) : ''
  )
  const [uploadSpeedInput, setUploadSpeedInput] = useState(
    uploadSpeedLimit > 0 ? String(uploadSpeedLimit) : ''
  )
  const [downloadSpeedUnit, setDownloadSpeedUnit] = useState(SPEED_UNITS[0].value)
  const [uploadSpeedUnit, setUploadSpeedUnit] = useState(SPEED_UNITS[0].value)

  // Add refs to store original values in KB/s
  const originalDownloadKbps = useRef<number | null>(null)
  const originalUploadKbps = useRef<number | null>(null)

  const [localError, setLocalError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Update local state when the context values change
  useEffect(() => {
    setEditedDownloadPath(downloadPath)

    // Handle new download/upload speed state
    if (downloadSpeedLimit === 0) {
      setDownloadSpeedInput('')
      originalDownloadKbps.current = null
    } else {
      setDownloadSpeedInput(String(downloadSpeedLimit))
      setDownloadSpeedUnit('kbps') // Always reset to KB/s when loading from settings
      originalDownloadKbps.current = downloadSpeedLimit
    }

    if (uploadSpeedLimit === 0) {
      setUploadSpeedInput('')
      originalUploadKbps.current = null
    } else {
      setUploadSpeedInput(String(uploadSpeedLimit))
      setUploadSpeedUnit('kbps') // Always reset to KB/s when loading from settings
      originalUploadKbps.current = uploadSpeedLimit
    }
  }, [downloadPath, downloadSpeedLimit, uploadSpeedLimit])

  const handleSaveDownloadPath = async (): Promise<void> => {
    if (!editedDownloadPath) {
      setLocalError(t('errors.selectFolder'))
      return
    }

    try {
      setLocalError(null)
      setSaveSuccess(false)
      await setDownloadPath(editedDownloadPath)

      // Show success message
      setSaveSuccess(true)

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Error saving download path:', err)
      setLocalError(t('errors.saveFailed'))
    }
  }

  const handleSaveSpeedLimits = async (): Promise<void> => {
    try {
      setLocalError(null)
      setSaveSuccess(false)

      // Use the stored original KB/s values if available, otherwise calculate
      let downloadLimit: number
      let uploadLimit: number

      if (downloadSpeedInput.trim() === '') {
        downloadLimit = 0
      } else if (originalDownloadKbps.current !== null) {
        downloadLimit = originalDownloadKbps.current
      } else {
        const inputValue = parseFloat(downloadSpeedInput)
        if (isNaN(inputValue)) {
          setLocalError(t('errors.invalidSpeed'))
          return
        }
        const factor = SPEED_UNITS.find((u) => u.value === downloadSpeedUnit)?.factor || 1
        downloadLimit = inputValue * factor
      }

      if (uploadSpeedInput.trim() === '') {
        uploadLimit = 0
      } else if (originalUploadKbps.current !== null) {
        uploadLimit = originalUploadKbps.current
      } else {
        const inputValue = parseFloat(uploadSpeedInput)
        if (isNaN(inputValue)) {
          setLocalError(t('errors.invalidSpeed'))
          return
        }
        const factor = SPEED_UNITS.find((u) => u.value === uploadSpeedUnit)?.factor || 1
        uploadLimit = inputValue * factor
      }

      // Ensure values are non-negative
      downloadLimit = Math.max(0, downloadLimit)
      uploadLimit = Math.max(0, uploadLimit)

      // Round to integer for storage (as the API expects integers)
      const roundedDownloadLimit = Math.round(downloadLimit)
      const roundedUploadLimit = Math.round(uploadLimit)

      await setDownloadSpeedLimit(roundedDownloadLimit)
      await setUploadSpeedLimit(roundedUploadLimit)

      // Show success message
      setSaveSuccess(true)

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Error saving speed limits:', err)
      setLocalError(t('errors.saveFailed'))
    }
  }

  const handleSelectFolder = async (): Promise<void> => {
    try {
      const selectedPath = await window.api.dialog.showDirectoryPicker()
      if (selectedPath) {
        setEditedDownloadPath(selectedPath)
      }
    } catch (err) {
      console.error('Error selecting folder:', err)
      setLocalError(t('errors.selectFolder'))
    }
  }

  // Handle unit conversion when dropdown changes
  const handleDownloadUnitChange = (newUnit: string): void => {
    if (!downloadSpeedInput.trim()) {
      // If input is empty, just change the unit
      setDownloadSpeedUnit(newUnit)
      return
    }

    const currentValue = parseFloat(downloadSpeedInput)
    if (isNaN(currentValue)) {
      // If current input is not a valid number, just change the unit
      setDownloadSpeedUnit(newUnit)
      return
    }

    const currentUnitValue = SPEED_UNITS.find((u) => u.value === downloadSpeedUnit)
    const newUnitValue = SPEED_UNITS.find((u) => u.value === newUnit)

    if (!currentUnitValue || !newUnitValue) {
      setDownloadSpeedUnit(newUnit)
      return
    }

    // If this is the first unit change, store the original KB/s value
    if (originalDownloadKbps.current === null) {
      if (downloadSpeedUnit === 'kbps') {
        originalDownloadKbps.current = currentValue
      } else {
        // Convert from current unit to KB/s
        originalDownloadKbps.current = currentValue * currentUnitValue.factor
      }
    }

    // Use the original KB/s value for conversions to prevent rounding errors
    if (originalDownloadKbps.current !== null) {
      const valueInNewUnit = originalDownloadKbps.current / newUnitValue.factor

      // Format based on the unit
      let formattedValue: string
      if (newUnit === 'mbps') {
        // For MB/s, show up to 2 decimal places, but trim trailing zeros
        formattedValue = valueInNewUnit.toFixed(2).replace(/\.?0+$/, '')
        if (formattedValue.endsWith('.')) formattedValue = formattedValue.slice(0, -1)
      } else {
        // For KB/s, show as integer
        formattedValue = Math.round(valueInNewUnit).toString()
      }

      setDownloadSpeedInput(formattedValue)
    }

    setDownloadSpeedUnit(newUnit)
  }

  const handleUploadUnitChange = (newUnit: string): void => {
    if (!uploadSpeedInput.trim()) {
      // If input is empty, just change the unit
      setUploadSpeedUnit(newUnit)
      return
    }

    const currentValue = parseFloat(uploadSpeedInput)
    if (isNaN(currentValue)) {
      // If current input is not a valid number, just change the unit
      setUploadSpeedUnit(newUnit)
      return
    }

    const currentUnitValue = SPEED_UNITS.find((u) => u.value === uploadSpeedUnit)
    const newUnitValue = SPEED_UNITS.find((u) => u.value === newUnit)

    if (!currentUnitValue || !newUnitValue) {
      setUploadSpeedUnit(newUnit)
      return
    }

    // If this is the first unit change, store the original KB/s value
    if (originalUploadKbps.current === null) {
      if (uploadSpeedUnit === 'kbps') {
        originalUploadKbps.current = currentValue
      } else {
        // Convert from current unit to KB/s
        originalUploadKbps.current = currentValue * currentUnitValue.factor
      }
    }

    // Use the original KB/s value for conversions to prevent rounding errors
    if (originalUploadKbps.current !== null) {
      const valueInNewUnit = originalUploadKbps.current / newUnitValue.factor

      // Format based on the unit
      let formattedValue: string
      if (newUnit === 'mbps') {
        // For MB/s, show up to 2 decimal places, but trim trailing zeros
        formattedValue = valueInNewUnit.toFixed(2).replace(/\.?0+$/, '')
        if (formattedValue.endsWith('.')) formattedValue = formattedValue.slice(0, -1)
      } else {
        // For KB/s, show as integer
        formattedValue = Math.round(valueInNewUnit).toString()
      }

      setUploadSpeedInput(formattedValue)
    }

    setUploadSpeedUnit(newUnit)
  }

  // Update stored KB/s value when input changes
  const handleDownloadInputChange = (value: string): void => {
    setDownloadSpeedInput(value.replace(/[^0-9.]/g, ''))

    // If the input is valid, update the original KB/s value
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      if (downloadSpeedUnit === 'kbps') {
        originalDownloadKbps.current = numValue
      } else {
        const factor = SPEED_UNITS.find((u) => u.value === downloadSpeedUnit)?.factor || 1
        originalDownloadKbps.current = numValue * factor
      }
    } else if (value.trim() === '') {
      originalDownloadKbps.current = null
    }
  }

  const handleUploadInputChange = (value: string): void => {
    setUploadSpeedInput(value.replace(/[^0-9.]/g, ''))

    // If the input is valid, update the original KB/s value
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      if (uploadSpeedUnit === 'kbps') {
        originalUploadKbps.current = numValue
      } else {
        const factor = SPEED_UNITS.find((u) => u.value === uploadSpeedUnit)?.factor || 1
        originalUploadKbps.current = numValue * factor
      }
    } else if (value.trim() === '') {
      originalUploadKbps.current = null
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.contentContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
          <Title2 className={styles.headerTitle}>{t('settings.title')}</Title2>
          {isLoading && <Spinner size="large" label={t('common.loading')} />}
        </div>
        <Text as="p" className={styles.headerSubtitle}>
          {t('settings.subtitle')}
        </Text>

        <Card className={styles.card}>
          <CardHeader
            description={<Subtitle1 weight="semibold">{t('settings.language')}</Subtitle1>}
          />
          <div className={styles.cardContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
              <Text>{t('settings.selectLanguage')}</Text>
              <Dropdown
                style={{ minWidth: '150px' }}
                value={language === 'tr' ? 'Türkçe' : 'English'}
                selectedOptions={[language]}
                onOptionSelect={(_, data) => {
                  if (data.optionValue === 'en' || data.optionValue === 'tr') {
                    setLanguage(data.optionValue)
                  }
                }}
                mountNode={document.getElementById('portal')}
              >
                <Option value="en" text="English">
                  English
                </Option>
                <Option value="tr" text="Türkçe">
                  Türkçe
                </Option>
              </Dropdown>
            </div>
          </div>
        </Card>

        <Card className={styles.card}>
          <CardHeader
            description={<Subtitle1 weight="semibold">{t('settings.appearance')}</Subtitle1>}
          />
          <div className={styles.cardContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
              <Text>{t('settings.theme')}</Text>
              <Dropdown
                style={{ minWidth: '150px' }}
                value={
                  colorScheme === 'auto'
                    ? t('theme.auto')
                    : colorScheme === 'dark'
                      ? t('theme.dark')
                      : t('theme.light')
                }
                selectedOptions={[colorScheme]}
                onOptionSelect={(_, data) => {
                  if (
                    data.optionValue === 'auto' ||
                    data.optionValue === 'light' ||
                    data.optionValue === 'dark'
                  ) {
                    setColorScheme(data.optionValue)
                  }
                }}
                mountNode={document.getElementById('portal')}
              >
                <Option value="auto" text={t('theme.auto')}>
                  {t('theme.auto')}
                </Option>
                <Option value="light" text={t('theme.light')}>
                  {t('theme.light')}
                </Option>
                <Option value="dark" text={t('theme.dark')}>
                  {t('theme.dark')}
                </Option>
              </Dropdown>
            </div>
          </div>
        </Card>

        <LogUploadSettings />

        <Card className={styles.card}>
          <CardHeader
            description={<Subtitle1 weight="semibold">{t('settings.downloadSettings')}</Subtitle1>}
          />
          <div className={styles.cardContent}>
            <Text>{t('settings.downloadSettingsDescription')}</Text>

            <div className={styles.formRow}>
              <Input
                className={styles.input}
                value={editedDownloadPath}
                onChange={(_, data) => setEditedDownloadPath(data.value)}
                placeholder={t('settings.downloadPath')}
                contentAfter={
                  <Button
                    icon={<FolderOpenRegular />}
                    onClick={handleSelectFolder}
                    aria-label={t('settings.browseFolders')}
                  />
                }
                size="large"
              />
              <Button onClick={handleSaveDownloadPath} appearance="primary" size="large">
                {t('settings.savePath')}
              </Button>
            </div>

            <div className={styles.speedLimitSection}>
              <Text>{t('settings.speedLimits')}</Text>

              <div className={styles.speedFormRow}>
                <div className={styles.speedControl}>
                  <Text>{t('settings.downloadSpeedLimit')}</Text>
                  <div className={styles.speedInputGroup}>
                    <Input
                      className={styles.speedInput}
                      value={downloadSpeedInput}
                      onChange={(_, data) => handleDownloadInputChange(data.value)}
                      placeholder={t('settings.unlimited')}
                    />
                    <Dropdown
                      className={styles.unitDropdown}
                      value={SPEED_UNITS.find((u) => u.value === downloadSpeedUnit)?.label}
                      label={t('settings.downloadSpeedLimitUnit')}
                      selectedOptions={[downloadSpeedUnit]}
                      onOptionSelect={(_, data) => {
                        if (data.optionValue) {
                          handleDownloadUnitChange(data.optionValue)
                        }
                      }}
                      mountNode={document.getElementById('portal')}
                    >
                      {SPEED_UNITS.map((unit) => (
                        <Option key={unit.value} value={unit.value} text={unit.label}>
                          {unit.label}
                        </Option>
                      ))}
                    </Dropdown>
                  </div>
                  <Text className={styles.hint}>
                    <InfoRegular />
                    {t('settings.leaveEmptyUnlimited')}
                  </Text>
                </div>

                <div className={styles.speedControl}>
                  <Text>{t('settings.uploadSpeedLimit')}</Text>
                  <div className={styles.speedInputGroup}>
                    <Input
                      className={styles.speedInput}
                      value={uploadSpeedInput}
                      onChange={(_, data) => handleUploadInputChange(data.value)}
                      placeholder={t('settings.unlimited')}
                    />
                    <Dropdown
                      className={styles.unitDropdown}
                      value={SPEED_UNITS.find((u) => u.value === uploadSpeedUnit)?.label}
                      selectedOptions={[uploadSpeedUnit]}
                      onOptionSelect={(_, data) => {
                        if (data.optionValue) {
                          handleUploadUnitChange(data.optionValue)
                        }
                      }}
                      mountNode={document.getElementById('portal')}
                    >
                      {SPEED_UNITS.map((unit) => (
                        <Option key={unit.value} value={unit.value} text={unit.label}>
                          {unit.label}
                        </Option>
                      ))}
                    </Dropdown>
                  </div>
                  <Text className={styles.hint}>
                    <InfoRegular />
                    {t('settings.leaveEmptyUnlimitedUpload')}
                  </Text>
                </div>
              </div>

              <div
                className={styles.formRow}
                style={{ justifyContent: 'flex-end', marginTop: tokens.spacingVerticalM }}
              >
                <Button onClick={handleSaveSpeedLimits} appearance="primary" size="large">
                  {t('settings.saveSpeedLimits')}
                </Button>
              </div>
            </div>

            {(error || localError) && <Text className={styles.error}>{error || localError}</Text>}

            {saveSuccess && (
              <Text className={styles.success}>
                <CheckmarkCircleRegular />
                {t('settings.settingsSaved')}
              </Text>
            )}
          </div>
        </Card>

        <BlacklistSettings />
      </div>
    </div>
  )
}

export default Settings
