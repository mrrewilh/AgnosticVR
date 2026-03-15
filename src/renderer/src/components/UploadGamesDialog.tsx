import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHeaderCell,
  TableRow,
  TableCell,
  Checkbox,
  Text
} from '@fluentui/react-components'
import { useGames } from '../hooks/useGames'
import { useAdb } from '@renderer/hooks/useAdb'
import { useUpload } from '@renderer/hooks/useUpload'
import { useTranslation } from '../hooks/useTranslation'

const UploadGamesDialog: React.FC = () => {
  const { t } = useTranslation()
  const { uploadCandidates, addGameToBlacklist } = useGames()
  const { selectedDevice } = useAdb()
  const { addToQueue } = useUpload()
  const [showUploadDialog, setShowUploadDialog] = useState<boolean>(false)
  const [selectedCandidates, setSelectedCandidates] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (uploadCandidates && uploadCandidates.length > 0) {
      // Initialize all candidates as selected
      const initialSelected = uploadCandidates.reduce(
        (acc, candidate) => {
          acc[candidate.packageName] = true
          return acc
        },
        {} as Record<string, boolean>
      )

      setSelectedCandidates(initialSelected)
      setShowUploadDialog(true)
    }
  }, [uploadCandidates])

  const handleCandidateToggle = (packageName: string): void => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [packageName]: !prev[packageName]
    }))
  }

  const handleSelectAll = (checked: boolean): void => {
    const updatedSelection = uploadCandidates.reduce(
      (acc, candidate) => {
        acc[candidate.packageName] = checked
        return acc
      },
      {} as Record<string, boolean>
    )
    setSelectedCandidates(updatedSelection)
  }

  const getHeaderCheckboxState = (): { checked: boolean; indeterminate: boolean } => {
    if (!uploadCandidates?.length) return { checked: false, indeterminate: false }

    const selectedCount = Object.values(selectedCandidates).filter(Boolean).length
    return {
      checked: selectedCount > 0 && selectedCount === uploadCandidates.length,
      indeterminate: selectedCount > 0 && selectedCount < uploadCandidates.length
    }
  }

  const handleUpload = async (): Promise<void> => {
    const selectedForUpload = uploadCandidates.filter(
      (candidate) => selectedCandidates[candidate.packageName]
    )
    console.log('Games selected for upload:', selectedForUpload)

    setShowUploadDialog(false)

    for (const candidate of selectedForUpload) {
      await addToQueue(
        candidate.packageName,
        candidate.gameName,
        candidate.versionCode,
        selectedDevice!
      )
    }
  }

  const handleBlacklist = (): void => {
    const selectedForBlacklist = uploadCandidates.filter(
      (candidate) => selectedCandidates[candidate.packageName]
    )
    console.log('Games selected for blacklist:', selectedForBlacklist)

    const closeAfterBlacklist = uploadCandidates.length === selectedForBlacklist.length

    for (const candidate of selectedForBlacklist) {
      addGameToBlacklist(candidate.packageName, candidate.versionCode)
    }
    // if the list is empy now, close the dialog
    if (closeAfterBlacklist) {
      setShowUploadDialog(false)
    }
  }

  const headerCheckboxState = getHeaderCheckboxState()

  return (
    <Dialog open={showUploadDialog} onOpenChange={(_, data) => setShowUploadDialog(data.open)}>
      <DialogSurface
        mountNode={document.getElementById('portal')}
        style={{
          maxWidth: '1020px'
        }}
      >
        <DialogBody>
          <DialogTitle>{t('uploadGames.title')}</DialogTitle>
          <DialogContent>
            <Text>{t('uploadGames.description')}</Text>

            <Table style={{ marginTop: '16px' }}>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell style={{ width: '80px' }}>
                    <Checkbox
                      checked={headerCheckboxState.checked}
                      indeterminate={headerCheckboxState.indeterminate}
                      onChange={(_event, data) => handleSelectAll(!!data.checked)}
                    />
                    {t('common.upload')}
                  </TableHeaderCell>
                  <TableHeaderCell>{t('uploadGames.game')}</TableHeaderCell>
                  <TableHeaderCell>{t('uploadGames.package')}</TableHeaderCell>
                  <TableHeaderCell style={{ width: '100px' }}>
                    {t('uploadGames.version')}
                  </TableHeaderCell>
                  <TableHeaderCell>{t('uploadGames.status')}</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadCandidates
                  .sort((a, b) => a.reason.localeCompare(b.reason))
                  .map((candidate) => (
                    <TableRow key={candidate.packageName}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCandidates[candidate.packageName] || false}
                          onChange={() => handleCandidateToggle(candidate.packageName)}
                        />
                      </TableCell>
                      <TableCell>{candidate.gameName}</TableCell>
                      <TableCell>{candidate.packageName}</TableCell>
                      <TableCell>{candidate.versionCode}</TableCell>
                      <TableCell>
                        {candidate.reason === 'missing'
                          ? t('uploadGames.missingFromDb')
                          : t('uploadGames.newerThanDb', { version: candidate.storeVersion })}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">{t('common.cancel')}</Button>
            </DialogTrigger>
            <Button
              appearance="secondary"
              onClick={handleBlacklist}
              disabled={Object.values(selectedCandidates).every((value) => value === false)}
            >
              {t('uploadGames.blacklistSelected')}
            </Button>
            <Button
              appearance="primary"
              onClick={handleUpload}
              disabled={Object.values(selectedCandidates).every((value) => value === false)}
            >
              {t('uploadGames.uploadSelected')}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

export default UploadGamesDialog
