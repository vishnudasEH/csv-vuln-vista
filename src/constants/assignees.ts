export const DEFAULT_ASSIGNEES = [
  'vishnu',
  'gopi', 
  'elan',
  'nihar',
  'ruben',
  'kartik',
  'aditya'
] as const;

export type DefaultAssignee = typeof DEFAULT_ASSIGNEES[number];