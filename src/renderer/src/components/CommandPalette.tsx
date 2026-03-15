import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { makeStyles, tokens, Text, Button, Divider } from '@fluentui/react-components'
import {
  SearchRegular,
  DesktopRegular,
  PhoneRegular,
  ArrowDownloadRegular,
  ArrowUploadRegular,
  SettingsRegular,
  ArrowLeftRegular,
  ArrowRightRegular,
  DismissRegular
} from '@fluentui/react-icons'
import { useTranslation } from '../hooks/useTranslation'

export type CommandAction =
  | 'navigate-games'
  | 'navigate-devices'
  | 'navigate-downloads'
  | 'navigate-uploads'
  | 'navigate-settings'
  | 'toggle-dark-mode'
  | 'toggle-sidebar'
  | 'refresh-games'
  | 'open-upload-dialog'

interface Command {
  id: CommandAction
  label: string
  shortcut?: string
  icon: React.ReactNode
  category: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onExecute: (command: CommandAction) => void
  darkMode: boolean
}

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '15vh',
    zIndex: 1000
  },
  container: {
    width: '560px',
    maxHeight: '400px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: tokens.spacingHorizontalM,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`
  },
  searchIcon: {
    marginRight: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    backgroundColor: 'transparent'
  },
  commandsList: {
    flex: 1,
    overflowY: 'auto',
    padding: tokens.spacingVerticalS
  },
  commandCategory: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    textTransform: 'uppercase'
  },
  commandItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    cursor: 'pointer',
    borderRadius: tokens.borderRadiusMedium,
    margin: `0 ${tokens.spacingHorizontalXS}`,
    transition: 'background-color 0.1s ease',
    border: 'none',
    background: 'transparent',
    width: 'calc(100% - 8px)',
    textAlign: 'left'
  },
  commandItemHover: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2
    }
  },
  commandItemSelected: {
    backgroundColor: tokens.colorBrandBackground2
  },
  commandLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM
  },
  commandIcon: {
    fontSize: '18px',
    color: tokens.colorNeutralForeground2
  },
  shortcut: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    fontFamily: 'monospace',
    backgroundColor: tokens.colorNeutralBackground2,
    padding: `2px 6px`,
    borderRadius: tokens.borderRadiusSmall
  },
  emptyState: {
    padding: tokens.spacingVerticalXL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3
  },
  hint: {
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  }
})

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, onExecute, darkMode }) => {
  const styles = useStyles()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'navigate-games',
        label: t('nav.games'),
        shortcut: 'Ctrl+G',
        icon: <DesktopRegular />,
        category: t('commandPalette.navigation')
      },
      {
        id: 'navigate-devices',
        label: t('nav.devices'),
        shortcut: 'Ctrl+D',
        icon: <PhoneRegular />,
        category: t('commandPalette.navigation')
      },
      {
        id: 'navigate-downloads',
        label: t('nav.downloads'),
        shortcut: 'Ctrl+Shift+D',
        icon: <ArrowDownloadRegular />,
        category: t('commandPalette.navigation')
      },
      {
        id: 'navigate-uploads',
        label: t('nav.uploads'),
        shortcut: 'Ctrl+Shift+U',
        icon: <ArrowUploadRegular />,
        category: t('commandPalette.navigation')
      },
      {
        id: 'navigate-settings',
        label: t('nav.settings'),
        shortcut: 'Ctrl+,',
        icon: <SettingsRegular />,
        category: t('commandPalette.navigation')
      },
      {
        id: 'toggle-dark-mode',
        label: darkMode ? t('theme.light') : t('theme.dark'),
        shortcut: 'Ctrl+Shift+M',
        icon: darkMode ? <ArrowRightRegular /> : <ArrowLeftRegular />,
        category: t('commandPalette.actions')
      },
      {
        id: 'toggle-sidebar',
        label: t('commandPalette.toggleSidebar'),
        shortcut: 'Ctrl+B',
        icon: <ArrowLeftRegular />,
        category: t('commandPalette.actions')
      },
      {
        id: 'refresh-games',
        label: t('common.refresh'),
        shortcut: 'F5',
        icon: <ArrowRightRegular />,
        category: t('commandPalette.actions')
      },
      {
        id: 'open-upload-dialog',
        label: t('nav.uploadGames'),
        shortcut: 'Ctrl+U',
        icon: <ArrowUploadRegular />,
        category: t('commandPalette.actions')
      }
    ],
    [t, darkMode]
  )

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands
    const lowerQuery = query.toLowerCase()
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.category.toLowerCase().includes(lowerQuery)
    )
  }, [commands, query])

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = []
      }
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [filteredCommands])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            onExecute(filteredCommands[selectedIndex].id)
            onClose()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [open, filteredCommands, selectedIndex, onExecute, onClose]
  )

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  let flatIndex = 0

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchContainer}>
          <SearchRegular className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={t('commandPalette.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={onClose}
            aria-label="Close"
          />
        </div>

        <div className={styles.commandsList}>
          {filteredCommands.length === 0 ? (
            <div className={styles.emptyState}>
              <Text>{t('commandPalette.noResults')}</Text>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className={styles.commandCategory}>{category}</div>
                {cmds.map((cmd) => {
                  const currentIndex = flatIndex++
                  return (
                    <button
                      key={cmd.id}
                      className={`${styles.commandItem} ${styles.commandItemHover} ${
                        currentIndex === selectedIndex ? styles.commandItemSelected : ''
                      }`}
                      onClick={() => {
                        onExecute(cmd.id)
                        onClose()
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <div className={styles.commandLabel}>
                        <span className={styles.commandIcon}>{cmd.icon}</span>
                        <Text>{cmd.label}</Text>
                      </div>
                      {cmd.shortcut && <span className={styles.shortcut}>{cmd.shortcut}</span>}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <Divider />

        <div className={styles.hint}>
          <Text size={200}>
            <ArrowUpRegular /> <ArrowDownRegular /> to navigate
          </Text>
          <Text size={200}>•</Text>
          <Text size={200}>{t('common.enterToSelect')}</Text>
          <Text size={200}>•</Text>
          <Text size={200}>{t('common.escToClose')}</Text>
        </div>
      </div>
    </div>
  )
}

const ArrowUpRegular = () => <span style={{ fontSize: '10px' }}>↑</span>
const ArrowDownRegular = () => <span style={{ fontSize: '10px' }}>↓</span>

export default CommandPalette
