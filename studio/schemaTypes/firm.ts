import { defineType, defineField } from 'sanity'
import { OlistIcon } from '@sanity/icons'

export const firm = defineType({
  name: 'firm',
  title: 'Prop Firm',
  type: 'document',
  icon: OlistIcon,
  fields: [
    defineField({
      name: 'firmId',
      title: 'Firm ID',
      type: 'slug',
      description: 'Unique machine identifier e.g. apex_trader_fund',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'name',
      title: 'Firm Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Website / Affiliate URL',
      type: 'url',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'affiliateCode',
      title: 'Affiliate Code',
      type: 'string',
    }),
    defineField({
      name: 'trustpilot',
      title: 'Trustpilot Score',
      type: 'number',
      validation: (r) => r.min(0).max(5).precision(1),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Uncheck to hide this firm from the comparison tool',
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'affiliateCode', media: 'logo' },
  },
})
