import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '~/features/shell/AppLayout'

/** Every screen sits in the shell. */
export const Route = createFileRoute('/_app')({ component: AppLayout })
