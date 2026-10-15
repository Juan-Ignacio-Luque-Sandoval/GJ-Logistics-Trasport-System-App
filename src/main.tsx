import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { ThemeProvider, ToastProvider } from '@zp/ui'
import '@zp/ui/styles.css'
import './globals.css'
import { router } from './router'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('index.html has no #root element')

// `.zp` scopes the design system's component styles; the theme itself is `data-theme` on <html>,
// set by ThemeProvider (and before load by the script in index.html).
createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <div className="zp">
          <RouterProvider router={router} />
        </div>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
