import { StructureBuilder } from 'sanity/structure'
import { BuildingIcon, TagIcon } from '@sanity/icons'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('MoxApp Content')
    .items([
      S.listItem()
        .title('Prop Firms')
        .icon(BuildingIcon)
        .child(
          S.documentTypeList('firm')
            .title('Prop Firms')
            .defaultOrdering([{ field: 'name', direction: 'asc' }])
        ),
      S.divider(),
      S.listItem()
        .title('All Plans')
        .icon(TagIcon)
        .child(
          S.documentTypeList('plan')
            .title('All Plans')
            .defaultOrdering([{ field: 'totalCostToFunded', direction: 'asc' }])
        ),
      S.divider(),
      // Plans grouped by firm for easy editing
      S.listItem()
        .title('Plans by Firm')
        .icon(BuildingIcon)
        .child(
          S.documentTypeList('firm')
            .title('Select a Firm')
            .defaultOrdering([{ field: 'name', direction: 'asc' }])
            .child((firmId: string) =>
              S.documentList()
                .title('Plans')
                .filter('_type == "plan" && firm._ref == $firmId')
                .params({ firmId })
                .defaultOrdering([{ field: 'accountSize', direction: 'asc' }])
            )
        ),
    ])
