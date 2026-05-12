import { Inbox } from "lucide-react"
import { EmptyState } from "../EmptyState"

type Props = { onAdd?: () => void }

export function EmptyLeads({ onAdd }: Props) {
  return (
    <EmptyState
      icon={Inbox}
      title="No leads in pool"
      description="Add leads via scraper or paste import to start working deals."
      action={onAdd ? { label: "+ Add lead", onClick: onAdd } : undefined}
      secondaryAction={!onAdd ? { label: "Import from scraper", href: "/scraper" } : undefined}
    />
  )
}
