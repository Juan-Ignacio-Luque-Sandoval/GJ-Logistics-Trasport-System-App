import { createFileRoute } from '@tanstack/react-router'
import { appById } from '~/ecosystem/registry'
import { AppHost } from '~/features/app-host/AppHost'

/**
 * Renders the prototype for every path below it; the splat child exists so a prototype's own
 * sub-routes (`#/apps/example-app/items/42`) match here instead of falling to not-found.
 */
export const Route = createFileRoute('/_app/apps/$appId')({
  component: AppHost,
  staticData: { crumb: (p) => appById(p.appId ?? '')?.title ?? 'App' },
})
