import { createContext } from 'react'

export type Language = 'en' | 'tr'
export type ColorScheme = 'light' | 'dark' | 'auto'

export interface SettingsContextType {
  downloadPath: string
  downloadSpeedLimit: number
  uploadSpeedLimit: number
  colorScheme: ColorScheme
  resolvedColorScheme: 'light' | 'dark'
  language: Language
  isLoading: boolean
  error: string | null
  setDownloadPath: (path: string) => Promise<void>
  setDownloadSpeedLimit: (limit: number) => Promise<void>
  setUploadSpeedLimit: (limit: number) => Promise<void>
  setColorScheme: (scheme: ColorScheme) => Promise<void>
  setLanguage: (lang: Language) => Promise<void>
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)
