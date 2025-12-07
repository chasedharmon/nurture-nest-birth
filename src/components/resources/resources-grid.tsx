import { ResourceCard, type Resource } from './resource-card'

/**
 * Resources Grid Component
 *
 * Displays a grid of downloadable resources organized by category.
 */

interface ResourcesGridProps {
  resources: Resource[]
  columns?: 1 | 2 | 3
  className?: string
}

export function ResourcesGrid({
  resources,
  columns = 3,
  className = '',
}: ResourcesGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }

  return (
    <div className={`grid gap-6 ${gridCols[columns]} ${className}`}>
      {resources.map((resource, index) => (
        <ResourceCard key={index} resource={resource} />
      ))}
    </div>
  )
}
