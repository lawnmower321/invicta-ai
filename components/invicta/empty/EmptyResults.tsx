import { SearchX } from "lucide-react"
import { EmptyState } from "../EmptyState"

type Props = { query?: string }

export function EmptyResults({ query }: Props) {
  return (
    <EmptyState
      icon={SearchX}
      title="No matches found"
      description={
        query
          ? `No results for "${query}". Try a different search.`
          : "Try a different filter or search term."
      }
      size="sm"
    />
  )
}
