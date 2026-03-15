import React, { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Text, Button, Badge, ProgressBar } from '@fluentui/react-components'
import { GameInfo } from '@shared/types'
import { useTranslation } from '../hooks/useTranslation'
import { ArrowDownloadRegular } from '@fluentui/react-icons'
import placeholderImage from '../assets/images/game-placeholder.png'

interface GameListProps {
  games: GameInfo[]
  downloadStatusMap: Map<string, { status: string; progress: number }>
  onGameClick: (game: GameInfo) => void
  onDownload: (game: GameInfo) => void
}

const GameList: React.FC<GameListProps> = ({
  games,
  downloadStatusMap,
  onGameClick,
  onDownload
}) => {
  const { t } = useTranslation()
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: games.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 74, // 70px + 4px gap
    overscan: 10,
    gap: 4
  })

  const getStatusBadge = (
    game: GameInfo,
    downloadStatus: { status: string; progress: number } | undefined
  ) => {
    if (downloadStatus) {
      return (
        <Badge appearance="filled" color="informative" size="small">
          {downloadStatus.status} ({downloadStatus.progress}%)
        </Badge>
      )
    }
    if (game.hasUpdate) {
      return (
        <Badge appearance="filled" color="warning" size="small">
          {t('games.updateAvailable')}
        </Badge>
      )
    }
    if (game.isInstalled) {
      return (
        <Badge appearance="filled" color="success" size="small">
          {t('games.installed')}
        </Badge>
      )
    }
    return null
  }

  const virtualItems = rowVirtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className="game-list-scroll">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualItems.map((virtualItem) => {
          const game = games[virtualItem.index]
          const downloadStatus = downloadStatusMap.get(game.releaseName)

          return (
            <div
              key={`${game.id}-${game.releaseName}`}
              className="game-list-item"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 'calc(100% - 14px)',
                height: `${virtualItem.size - 4}px`,
                transform: `translateY(${virtualItem.start}px)`
              }}
              onClick={() => onGameClick(game)}
            >
              <img
                src={game.thumbnailPath ? `file://${game.thumbnailPath}` : placeholderImage}
                alt={game.name}
                className="game-list-image"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = placeholderImage
                }}
              />
              <div className="game-list-content">
                <Text className="game-list-title">{game.name}</Text>
                <div className="game-list-meta">
                  <Text size={200}>{game.version}</Text>
                  <Text size={200}>•</Text>
                  <Text size={200}>{game.size}</Text>
                  <Text size={200}>•</Text>
                  <Text size={200}>{game.lastUpdated}</Text>
                </div>
              </div>
              <div className="game-list-actions">
                {getStatusBadge(game, downloadStatus)}
                {downloadStatus && (
                  <div className="game-list-progress">
                    <ProgressBar value={downloadStatus.progress / 100} />
                  </div>
                )}
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
          )
        })}
      </div>
    </div>
  )
}

export default GameList
