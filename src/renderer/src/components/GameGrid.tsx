import React, { useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button, Badge, ProgressBar } from '@fluentui/react-components'
import { GameInfo } from '@shared/types'
import { useTranslation } from '../hooks/useTranslation'
import { ArrowDownloadRegular } from '@fluentui/react-icons'
import placeholderImage from '../assets/images/game-placeholder.png'

interface GameGridProps {
  games: GameInfo[]
  downloadStatusMap: Map<string, { status: string; progress: number }>
  onGameClick: (game: GameInfo) => void
  onDownload: (game: GameInfo) => void
}

const GameGrid: React.FC<GameGridProps> = ({
  games,
  downloadStatusMap,
  onGameClick,
  onDownload
}) => {
  const { t } = useTranslation()
  const parentRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(4)

  useEffect(() => {
    const updateColumns = () => {
      if (parentRef.current) {
        const width = parentRef.current.clientWidth - 32 // minus padding
        const colCount = Math.max(1, Math.floor(width / 220))
        setColumns(colCount)
      }
    }
    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  const rowCount = Math.ceil(games.length / columns)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 268, // 220 + 16px gap + 16px margin + 16px padding
    overscan: 3
  })

  const getStatusBadge = (
    game: GameInfo,
    downloadStatus: { status: string; progress: number } | undefined
  ) => {
    if (downloadStatus) {
      return (
        <Badge appearance="filled" color="informative">
          {downloadStatus.status} ({downloadStatus.progress}%)
        </Badge>
      )
    }
    if (game.hasUpdate) {
      return (
        <Badge appearance="filled" color="warning">
          {t('games.updateAvailable')}
        </Badge>
      )
    }
    if (game.isInstalled) {
      return (
        <Badge appearance="filled" color="success">
          {t('games.installed')}
        </Badge>
      )
    }
    return null
  }

  const virtualRows = rowVirtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className="game-grid-scroll">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualRows.map((virtualRow) => {
          const rowIndex = virtualRow.index
          const startIndex = rowIndex * columns
          const rowGames = games.slice(startIndex, startIndex + columns)

          return (
            <div
              key={rowIndex}
              className="game-grid-row"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: '16px',
                padding: '0 16px',
                boxSizing: 'border-box'
              }}
            >
              {rowGames.map((game) => {
                const downloadStatus = downloadStatusMap.get(game.releaseName)

                return (
                  <div
                    key={`${game.id}-${game.releaseName}`}
                    className="game-grid-card"
                    onClick={() => onGameClick(game)}
                  >
                    <img
                      src={game.thumbnailPath ? `file://${game.thumbnailPath}` : placeholderImage}
                      alt={game.name}
                      className="game-grid-image"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = placeholderImage
                      }}
                    />
                    <div className="game-grid-content">
                      <span className="game-grid-title">{game.name}</span>
                      <div className="game-grid-meta">
                        <span>{game.version}</span>
                        <span>•</span>
                        <span>{game.size}</span>
                      </div>
                      <div className="game-grid-status">{getStatusBadge(game, downloadStatus)}</div>
                      {downloadStatus && (
                        <div className="game-grid-progress">
                          <ProgressBar value={downloadStatus.progress / 100} />
                        </div>
                      )}
                      <div className="game-grid-button">
                        {!game.isInstalled && !downloadStatus && (
                          <Button
                            size="small"
                            appearance="primary"
                            icon={<ArrowDownloadRegular />}
                            onClick={(e) => {
                              e.stopPropagation()
                              onDownload(game)
                            }}
                          >
                            {t('common.download')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GameGrid
