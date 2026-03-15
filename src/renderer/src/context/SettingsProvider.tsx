import React, { ReactNode, useEffect, useState, useCallback, useMemo } from 'react'
import { SettingsContext, SettingsContextType, Language, ColorScheme } from './SettingsContext'

interface SettingsProviderProps {
  children: ReactNode
}

const getSystemColorScheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [downloadPath, setDownloadPathState] = useState<string>('')
  const [downloadSpeedLimit, setDownloadSpeedLimitState] = useState<number>(0)
  const [uploadSpeedLimit, setUploadSpeedLimitState] = useState<number>(0)
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('auto')
  const [language, setLanguageState] = useState<Language>('en')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>(() =>
    getSystemColorScheme()
  )

  const resolvedColorScheme = useMemo((): 'light' | 'dark' => {
    if (colorScheme === 'auto') {
      return systemColorScheme
    }
    return colorScheme
  }, [colorScheme, systemColorScheme])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent): void => {
      setSystemColorScheme(e.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Load initial settings when component mounts
  useEffect(() => {
    let isMounted = true

    const loadSettings = async (): Promise<void> => {
      try {
        const [path, downloadLimit, uploadLimit, colorScheme, language] = await Promise.all([
          window.api.settings.getDownloadPath(),
          window.api.settings.getDownloadSpeedLimit(),
          window.api.settings.getUploadSpeedLimit(),
          window.api.settings.getColorScheme(),
          window.api.settings.getLanguage()
        ])

        if (isMounted) {
          console.log('Fetched initial download path:', path)
          console.log('Fetched initial download speed limit:', downloadLimit)
          console.log('Fetched initial upload speed limit:', uploadLimit)
          console.log('Fetched initial language:', language)
          setDownloadPathState(path)
          setDownloadSpeedLimitState(downloadLimit)
          setUploadSpeedLimitState(uploadLimit)
          setColorSchemeState(colorScheme as ColorScheme)
          setLanguageState(language)
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
        if (isMounted) {
          setError('Failed to load settings')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [])

  // Function to update download path
  const setDownloadPath = useCallback(async (path: string): Promise<void> => {
    try {
      setIsLoading(true)
      await window.api.settings.setDownloadPath(path)
      setDownloadPathState(path)
      setError(null)
    } catch (err) {
      console.error('Error setting download path:', err)
      setError('Failed to update download path')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Function to update download speed limit
  const setDownloadSpeedLimit = useCallback(async (limit: number): Promise<void> => {
    try {
      setIsLoading(true)
      await window.api.settings.setDownloadSpeedLimit(limit)
      setDownloadSpeedLimitState(limit)
      setError(null)
    } catch (err) {
      console.error('Error setting download speed limit:', err)
      setError('Failed to update download speed limit')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Function to update upload speed limit
  const setUploadSpeedLimit = useCallback(async (limit: number): Promise<void> => {
    try {
      setIsLoading(true)
      await window.api.settings.setUploadSpeedLimit(limit)
      setUploadSpeedLimitState(limit)
      setError(null)
    } catch (err) {
      console.error('Error setting upload speed limit:', err)
      setError('Failed to update upload speed limit')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setColorScheme = useCallback(async (scheme: ColorScheme): Promise<void> => {
    try {
      setIsLoading(true)
      await window.api.settings.setColorScheme(scheme)
      setColorSchemeState(scheme)
      setError(null)
    } catch (err) {
      console.error('Error setting color scheme:', err)
      setError('Failed to update color scheme')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setLanguage = useCallback(async (lang: Language): Promise<void> => {
    try {
      setIsLoading(true)
      await window.api.settings.setLanguage(lang)
      setLanguageState(lang)
      setError(null)
    } catch (err) {
      console.error('Error setting language:', err)
      setError('Failed to update language')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value: SettingsContextType = {
    downloadPath,
    downloadSpeedLimit,
    uploadSpeedLimit,
    colorScheme,
    resolvedColorScheme,
    language,
    isLoading,
    error,
    setDownloadPath,
    setDownloadSpeedLimit,
    setUploadSpeedLimit,
    setColorScheme,
    setLanguage
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
