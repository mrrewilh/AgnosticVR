import React, { useMemo, useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  FilterFn,
  ColumnFiltersState,
  Row,
  ColumnSizingState
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { GameInfo } from '@shared/types'
import placeholderImage from '../assets/images/game-placeholder.png'
import { tokens, makeStyles, Badge, ProgressBar } from '@fluentui/react-components'
import { ArrowSyncRegular, CheckmarkCircleRegular } from '@fluentui/react-icons'
import GameGrid from './GameGrid'
import GameList from './GameList'
import GameDetailsDialog from './GameDetailsDialog'

const COLUMN_WIDTHS = {
  STATUS: 60,
  THUMBNAIL: 90,
  VERSION: 180,
  POPULARITY: 120,
  SIZE: 90,
  LAST_UPDATED: 180,
  MIN_NAME_PACKAGE: 300
}

const FIXED_COLUMNS_WIDTH =
  COLUMN_WIDTHS.STATUS +
  COLUMN_WIDTHS.THUMBNAIL +
  COLUMN_WIDTHS.VERSION +
  COLUMN_WIDTHS.POPULARITY +
  COLUMN_WIDTHS.SIZE +
  COLUMN_WIDTHS.LAST_UPDATED

const filterGameNameAndPackage: FilterFn<GameInfo> = (row, _columnId, filterValue) => {
  const searchStr = String(filterValue).toLowerCase()
  const gameName = String(row.original.name ?? '').toLowerCase()
  const packageName = String(row.original.packageName ?? '').toLowerCase()
  const releaseName = String(row.original.releaseName ?? '').toLowerCase()
  return (
    gameName.includes(searchStr) ||
    packageName.includes(searchStr) ||
    releaseName.includes(searchStr)
  )
}

declare module '@tanstack/react-table' {
  interface FilterFns {
    gameNameAndPackageFilter: FilterFn<GameInfo>
  }
}

const useStyles = makeStyles({
  tableWrapper: {
    flexGrow: 1,
    overflow: 'auto',
    position: 'relative'
  },
  resizer: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: '100%',
    width: '5px',
    background: 'rgba(0, 0, 0, 0.1)',
    cursor: 'col-resize',
    userSelect: 'none',
    touchAction: 'none',
    opacity: 0,
    transition: 'opacity 0.2s ease-in-out',
    ':hover': {
      opacity: 1
    }
  },
  isResizing: {
    background: tokens.colorBrandBackground,
    opacity: 1
  },
  statusIconCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  }
})

interface GamesViewContentProps {
  filteredGames: GameInfo[]
  downloadStatusMap: Map<string, { status: string; progress: number }>
  tableWidth: number
  tableContainerRef: React.RefObject<HTMLDivElement | null>
  columnSizing: ColumnSizingState
  setColumnSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  isConnected: boolean
  isBusy: boolean
  onGameClick: (game: GameInfo) => void
  onInstall: (game: GameInfo) => void | Promise<void>
  onUninstall: (game: GameInfo) => void | Promise<void>
  onReinstall: (game: GameInfo) => void | Promise<void>
  onUpdate: (game: GameInfo) => void | Promise<void>
  onRetry: (game: GameInfo) => void | Promise<void>
  onCancelDownload: (game: GameInfo) => void
  onDeleteDownloaded: (game: GameInfo) => void | Promise<void>
  onInstallFromCompleted: (game: GameInfo) => void | Promise<void>
  getNote: (releaseName: string) => string | Promise<string>
  viewMode: 'grid' | 'list' | 'table'
}

const GamesViewContent: React.FC<GamesViewContentProps> = ({
  filteredGames,
  downloadStatusMap,
  tableWidth,
  tableContainerRef,
  columnSizing,
  setColumnSizing,
  globalFilter,
  setGlobalFilter,
  isConnected,
  isBusy,
  onGameClick,
  onInstall,
  onUninstall,
  onReinstall,
  onUpdate,
  onRetry,
  onCancelDownload,
  onDeleteDownloaded,
  onInstallFromCompleted,
  getNote,
  viewMode
}) => {
  const styles = useStyles()
  const [dialogGame, setDialogGame] = useState<GameInfo | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const columns = useMemo<ColumnDef<GameInfo>[]>(() => {
    const nameColumnWidth = Math.max(
      COLUMN_WIDTHS.MIN_NAME_PACKAGE,
      tableWidth - FIXED_COLUMNS_WIDTH - 5
    )

    return [
      {
        id: 'downloadStatus',
        header: '',
        size: COLUMN_WIDTHS.STATUS,
        enableResizing: false,
        enableSorting: false,
        cell: ({ row }) => {
          const game = row.original
          const downloadInfo = game.releaseName
            ? downloadStatusMap.get(game.releaseName)
            : undefined
          const isDownloaded = downloadInfo?.status === 'Completed'
          const isInstalled = game.isInstalled
          const isUpdateAvailable = game.hasUpdate

          return (
            <div className={styles.statusIconCell}>
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalXXS }}>
                {isDownloaded && (
                  <CheckmarkCircleRegular
                    fontSize={16}
                    color={tokens.colorNeutralForeground3}
                    aria-label="Downloaded"
                  />
                )}
                {isInstalled && (
                  <CheckmarkCircleRegular
                    fontSize={16}
                    color={tokens.colorPaletteGreenForeground1}
                    aria-label="Installed"
                  />
                )}
                {isUpdateAvailable && (
                  <ArrowSyncRegular
                    fontSize={16}
                    color={tokens.colorPaletteGreenForeground1}
                    aria-label="Update Available"
                  />
                )}
              </div>
            </div>
          )
        }
      },
      {
        accessorKey: 'thumbnailPath',
        header: ' ',
        size: COLUMN_WIDTHS.THUMBNAIL,
        enableResizing: false,
        cell: ({ getValue }) => {
          const pathValue = getValue()
          const imagePath = typeof pathValue === 'string' ? pathValue : ''
          return (
            <div className="game-thumbnail-cell">
              <img
                src={imagePath ? `file://${imagePath}` : placeholderImage}
                alt="Thumbnail"
                className="game-thumbnail-img"
              />
            </div>
          )
        },
        enableSorting: false
      },
      {
        accessorKey: 'name',
        header: 'Name / Package',
        size: nameColumnWidth > 0 ? nameColumnWidth : COLUMN_WIDTHS.MIN_NAME_PACKAGE,
        cell: ({ row }) => {
          const game = row.original
          const downloadInfo = game.releaseName
            ? downloadStatusMap.get(game.releaseName)
            : undefined
          const isDownloading = downloadInfo?.status === 'Downloading'
          const isExtracting = downloadInfo?.status === 'Extracting'
          const isQueued = downloadInfo?.status === 'Queued'
          const isInstalling = downloadInfo?.status === 'Installing'
          const isInstallError = downloadInfo?.status === 'InstallError'

          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                position: 'relative',
                paddingBottom: '8px'
              }}
            >
              <div style={{ marginBottom: tokens.spacingVerticalXS }}>
                {' '}
                <div className="game-name-main">{game.name}</div>
                <div className="game-package-sub">{game.releaseName}</div>
                <div className="game-package-sub">{game.packageName}</div>
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}
              >
                {isQueued && (
                  <Badge shape="rounded" color="informative" appearance="outline">
                    Queued
                  </Badge>
                )}
                {isInstalling && (
                  <Badge shape="rounded" color="warning" appearance="filled">
                    Installing
                  </Badge>
                )}
                {isDownloading && (
                  <Badge shape="rounded" color="informative" appearance="filled">
                    Downloading ({downloadInfo?.progress}%)
                  </Badge>
                )}
                {isExtracting && (
                  <Badge shape="rounded" color="informative" appearance="filled">
                    Extracting ({downloadInfo?.progress}%)
                  </Badge>
                )}
                {isInstallError && (
                  <Badge shape="rounded" color="danger" appearance="filled">
                    Install Failed
                  </Badge>
                )}
              </div>
              {downloadInfo &&
                downloadInfo.status !== 'Completed' &&
                downloadInfo.status !== 'Queued' && (
                  <div className={styles.statusIconCell} style={{ marginTop: '4px' }}>
                    <ProgressBar value={downloadInfo.progress / 100} style={{ width: '80%' }} />
                  </div>
                )}
            </div>
          )
        }
      },
      {
        accessorKey: 'version',
        header: 'Version',
        size: COLUMN_WIDTHS.VERSION,
        cell: ({ getValue }) => {
          const version = getValue() as string
          return <div className="game-version-cell">{version}</div>
        }
      },
      {
        accessorKey: 'popularity',
        header: 'Popularity',
        size: COLUMN_WIDTHS.POPULARITY,
        cell: ({ getValue }) => {
          const popularity = getValue() as number
          return <div className="game-popularity-cell">{popularity ? `${popularity}%` : '-'}</div>
        }
      },
      {
        accessorKey: 'size',
        header: 'Size',
        size: COLUMN_WIDTHS.SIZE,
        cell: ({ getValue }) => {
          const size = getValue() as string
          return <div className="game-size-cell">{size || '-'}</div>
        }
      },
      {
        accessorKey: 'lastUpdated',
        header: 'Last Updated',
        size: COLUMN_WIDTHS.LAST_UPDATED,
        cell: ({ getValue }) => {
          const lastUpdated = getValue() as string
          return <div className="game-last-updated-cell">{lastUpdated || '-'}</div>
        }
      }
    ]
  }, [tableWidth, downloadStatusMap, styles])

  const [tableSorting, setTableSorting] = useState<SortingState>([])
  const [tableColumnFilters, setTableColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data: filteredGames,
    columns,
    state: {
      sorting: tableSorting,
      globalFilter,
      columnFilters: tableColumnFilters,
      columnSizing
    },
    onSortingChange: setTableSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setTableColumnFilters,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    filterFns: {
      gameNameAndPackageFilter: filterGameNameAndPackage
    }
  })

  const rowModel = table.getRowModel()
  const rows = rowModel.rows

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 80,
    overscan: 10,
    gap: 4
  })

  const handleRowClick = useCallback(
    (_e: React.MouseEvent<HTMLTableRowElement>, row: Row<GameInfo>) => {
      const game = row.original
      setDialogGame(game)
      setIsDialogOpen(true)
    },
    []
  )

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false)
    setDialogGame(null)
  }, [])

  const handleDownload = useCallback(
    (game: GameInfo) => {
      onGameClick(game)
    },
    [onGameClick]
  )

  if (viewMode === 'grid') {
    return (
      <GameGrid
        games={filteredGames}
        downloadStatusMap={downloadStatusMap}
        onGameClick={(game) => {
          setDialogGame(game)
          setIsDialogOpen(true)
        }}
        onDownload={handleDownload}
      />
    )
  }

  if (viewMode === 'list') {
    return (
      <GameList
        games={filteredGames}
        downloadStatusMap={downloadStatusMap}
        onGameClick={(game) => {
          setDialogGame(game)
          setIsDialogOpen(true)
        }}
        onDownload={handleDownload}
      />
    )
  }

  return (
    <>
      <div className="table-wrapper" ref={tableContainerRef}>
        <table className="games-table" style={{ width: table.getTotalSize() }}>
          <thead
            style={{
              display: 'grid',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize(), position: 'relative' }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                          onClick: header.column.getToggleSortingHandler()
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽'
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`${styles.resizer} ${header.column.getIsResizing() ? styles.isResizing : ''}`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index] as Row<GameInfo>
              const rowClasses = [
                row.original.isInstalled ? 'row-installed' : 'row-not-installed',
                row.original.hasUpdate ? 'row-update-available' : ''
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <tr
                  key={row.id}
                  className={rowClasses}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                  onClick={(e) => handleRowClick(e, row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        maxWidth: cell.column.getSize()
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {dialogGame && (
        <GameDetailsDialog
          game={dialogGame}
          open={isDialogOpen}
          onClose={handleCloseDialog}
          downloadStatusMap={downloadStatusMap}
          onInstall={async (game) => {
            await onInstall(game)
          }}
          onUninstall={async (game) => {
            await onUninstall(game)
          }}
          onReinstall={async (game) => {
            await onReinstall(game)
          }}
          onUpdate={async (game) => {
            await onUpdate(game)
          }}
          onRetry={async (game) => {
            await onRetry(game)
          }}
          onCancelDownload={onCancelDownload}
          onDeleteDownloaded={async (game) => {
            await onDeleteDownloaded(game)
          }}
          onInstallFromCompleted={async (game) => {
            await onInstallFromCompleted(game)
          }}
          getNote={async (releaseName) => {
            const note = await getNote(releaseName)
            return note ?? null
          }}
          isConnected={isConnected}
          isBusy={isBusy}
        />
      )}
    </>
  )
}

export default GamesViewContent
