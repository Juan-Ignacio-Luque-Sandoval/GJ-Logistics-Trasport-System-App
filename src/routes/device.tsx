import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { Spinner } from '@zp/ui'

const Device = lazy(() => import('~/apps/driver-app/Device'))

/** The driver app alone, without the shell: what a driver would open on a real phone. */
export const Route = createFileRoute('/device')({
  component: () => (
    <Suspense fallback={<Spinner label="Loading the driver app" />}>
      <Device />
    </Suspense>
  ),
})
