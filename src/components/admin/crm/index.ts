/**
 * CRM Components
 *
 * This module exports all CRM-related components for the metadata-driven
 * object model. These components work with the object_definitions and
 * field_definitions tables to render dynamic forms and list views.
 */

// Form Components
export {
  DynamicRecordForm,
  type DynamicRecordFormProps,
} from './dynamic-record-form'

// List View Components
export { DynamicListView, type DynamicListViewProps } from './dynamic-list-view'

// Page Components
export {
  RecordDetailPage,
  type RecordDetailPageProps,
} from './record-detail-page'
export { NewRecordPage, type NewRecordPageProps } from './new-record-page'

// Related Records
export {
  RelatedRecordsList,
  type RelatedRecordsListProps,
} from './related-records-list'

// Activity Components
export {
  ActivityTimeline,
  type ActivityTimelineProps,
} from './activity-timeline'

// Field Renderers (re-exported from fields/)
export * from './fields'
