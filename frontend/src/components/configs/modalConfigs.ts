/**
 * Modal configurations for each entity type
 */

import type { ModalConfig } from '../types';

export const createSectionModalConfig = (trackLines: Array<{id: number; name: string}>): ModalConfig => ({
  title: 'Section',
  maxWidth: 'sm',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter section name',
    },
    {
      name: 'trackLineId',
      label: 'Track Line',
      type: 'select',
      required: true,
      options: trackLines.map(tl => ({
        value: tl.id,
        label: tl.name
      })),
    },
    {
      name: 'length',
      label: 'Length (feet)',
      type: 'number',
      placeholder: 'Optional length in feet',
    },
    {
      name: 'positionX',
      label: 'Position X',
      type: 'number',
      placeholder: 'Optional X coordinate',
    },
    {
      name: 'positionY',
      label: 'Position Y',
      type: 'number',
      placeholder: 'Optional Y coordinate',
    },
    {
      name: 'positionZ',
      label: 'Position Z',
      type: 'number',
      placeholder: 'Optional Z coordinate',
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'checkbox',
    },
  ],
});

export const createSwitchModalConfig = (
  accessories: Array<{id: number; name: string; address: string}>,
  sections: Array<{id: number; name: string}>
): ModalConfig => ({
  title: 'Switch',
  maxWidth: 'sm',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter switch name',
    },
    {
      name: 'accessoryId',
      label: 'Accessory',
      type: 'select',
      required: true,
      options: accessories.map(acc => ({
        value: acc.id,
        label: `${acc.name} (${acc.address})`
      })),
    },
    {
      name: 'sectionId',
      label: 'Section',
      type: 'select',
      required: true,
      options: sections.map(section => ({
        value: section.id,
        label: section.name
      })),
    },
    {
      name: 'position',
      label: 'Position',
      type: 'select',
      options: [
        { value: 'straight', label: 'Straight' },
        { value: 'divergent', label: 'Divergent' },
        { value: 'unknown', label: 'Unknown' },
      ],
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'checkbox',
    },
  ],
});

export const createConnectionModalConfig = (
  sections: Array<{id: number; name: string}>,
  switches: Array<{id: number; name: string}>
): ModalConfig => ({
  title: 'Connection',
  maxWidth: 'sm',
  fields: [
    {
      name: 'fromSectionId',
      label: 'From Section',
      type: 'select',
      required: true,
      options: sections.map(section => ({
        value: section.id,
        label: section.name
      })),
    },
    {
      name: 'toSectionId',
      label: 'To Section', 
      type: 'select',
      required: true,
      options: sections.map(section => ({
        value: section.id,
        label: section.name
      })),
    },
    {
      name: 'connectionType',
      label: 'Connection Type',
      type: 'select',
      options: [
        { value: 'direct', label: 'Direct' },
        { value: 'switch', label: 'Switch' },
        { value: 'junction', label: 'Junction' },
      ],
    },
    {
      name: 'switchId',
      label: 'Switch',
      type: 'select',
      options: [
        { value: 0, label: 'None' },
        ...switches.map(switchItem => ({
          value: switchItem.id,
          label: switchItem.name
        }))
      ],
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'checkbox',
    },
  ],
});

export const createAccessoryModalConfig = (
  categories: Array<{id: number; name: string}>
): ModalConfig => ({
  title: 'Accessory',
  maxWidth: 'sm',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter accessory name',
    },
    {
      name: 'categoryId',
      label: 'Category',
      type: 'select',
      required: true,
      options: categories.map(cat => ({
        value: cat.id,
        label: cat.name
      })),
    },
    {
      name: 'controlType',
      label: 'Control Type',
      type: 'select',
      required: true,
      options: [
        { value: 'onOff', label: 'On/Off' },
        { value: 'toggle', label: 'Toggle' },
        { value: 'timed', label: 'Timed' },
      ],
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      required: true,
      placeholder: 'Enter hardware address',
    },
    {
      name: 'timedMs',
      label: 'Timed Duration (ms)',
      type: 'number',
      placeholder: 'Optional duration in milliseconds',
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'checkbox',
    },
  ],
});

export const categoryModalConfig: ModalConfig = {
  title: 'Category',
  maxWidth: 'sm',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter category name',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional description',
      multiline: true,
      rows: 3,
    },
    {
      name: 'sortOrder',
      label: 'Sort Order',
      type: 'number',
      placeholder: 'Optional sort order (default: 0)',
    },
  ],
};