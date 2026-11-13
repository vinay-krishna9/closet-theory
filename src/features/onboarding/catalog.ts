export const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;
export type Season = (typeof seasons)[number];
export const formalities = ['Casual', 'Smart-casual', 'Formal'] as const;
export type Formality = (typeof formalities)[number];
export const groups = ['Tops', 'Bottoms', 'Shoes', 'Outerwear'] as const;
export type Group = (typeof groups)[number];
export const patterns = ['Solid', 'Striped', 'Checked', 'Printed'] as const;
export type Pattern = (typeof patterns)[number];

export const colors = {
  white: { name: 'White', hex: '#e9e9e4' },
  'off-white': { name: 'Off-white', hex: '#dcd5bd' },
  black: { name: 'Black', hex: '#29292d' },
  navy: { name: 'Navy', hex: '#27394f' },
  grey: { name: 'Grey', hex: '#909193' },
  'dark-grey': { name: 'Dark grey', hex: '#515359' },
  olive: { name: 'Olive', hex: '#727751' },
  beige: { name: 'Beige', hex: '#c4ae8e' },
  burgundy: { name: 'Burgundy', hex: '#763a48' },
  'light-blue': { name: 'Light blue', hex: '#91afc5' },
  pink: { name: 'Pink', hex: '#d5a2ac' },
  oatmeal: { name: 'Oatmeal', hex: '#c8bea8' },
  brown: { name: 'Brown', hex: '#795b45' },
  indigo: { name: 'Indigo', hex: '#426483' },
  khaki: { name: 'Khaki', hex: '#a59467' },
} as const;
export type ColorId = keyof typeof colors;
export type Neckline = 'Crew neck' | 'V-neck' | 'Polo collar' | 'Collared';
export type Sleeves = 'Sleeveless' | 'Short sleeves' | 'Long sleeves';
export type TypeId =
  | 'tshirt'
  | 'shirt'
  | 'sweater'
  | 'jeans'
  | 'chinos'
  | 'shorts'
  | 'sneakers'
  | 'jacket';
export type CatalogType = {
  id: TypeId;
  name: string;
  group: Group;
  colors: readonly ColorId[];
  formality: Formality;
  seasons: readonly Season[];
  necklines: readonly Neckline[];
  sleeves: readonly Sleeves[];
  patterns: readonly Pattern[];
};
const allPatterns = patterns;
export const catalog: readonly CatalogType[] = [
  {
    id: 'tshirt',
    name: 'T-shirt',
    group: 'Tops',
    colors: [
      'white',
      'black',
      'navy',
      'grey',
      'olive',
      'beige',
      'burgundy',
      'light-blue',
    ],
    formality: 'Casual',
    seasons,
    necklines: ['Crew neck', 'V-neck', 'Polo collar'],
    sleeves: ['Short sleeves', 'Long sleeves', 'Sleeveless'],
    patterns: allPatterns,
  },
  {
    id: 'shirt',
    name: 'Shirt',
    group: 'Tops',
    colors: [
      'white',
      'light-blue',
      'navy',
      'black',
      'grey',
      'beige',
      'pink',
      'olive',
    ],
    formality: 'Smart-casual',
    seasons,
    necklines: ['Collared'],
    sleeves: ['Long sleeves', 'Short sleeves'],
    patterns: allPatterns,
  },
  {
    id: 'sweater',
    name: 'Sweater',
    group: 'Tops',
    colors: [
      'oatmeal',
      'grey',
      'navy',
      'black',
      'beige',
      'brown',
      'burgundy',
      'olive',
    ],
    formality: 'Smart-casual',
    seasons: ['Spring', 'Autumn', 'Winter'],
    necklines: ['Crew neck', 'V-neck'],
    sleeves: ['Long sleeves'],
    patterns: allPatterns,
  },
  {
    id: 'jeans',
    name: 'Jeans',
    group: 'Bottoms',
    colors: [
      'indigo',
      'light-blue',
      'black',
      'grey',
      'dark-grey',
      'white',
      'beige',
      'brown',
    ],
    formality: 'Casual',
    seasons,
    necklines: [],
    sleeves: [],
    patterns: allPatterns,
  },
  {
    id: 'chinos',
    name: 'Chinos',
    group: 'Bottoms',
    colors: [
      'khaki',
      'navy',
      'olive',
      'black',
      'grey',
      'beige',
      'brown',
      'white',
    ],
    formality: 'Smart-casual',
    seasons,
    necklines: [],
    sleeves: [],
    patterns: allPatterns,
  },
  {
    id: 'shorts',
    name: 'Shorts',
    group: 'Bottoms',
    colors: [
      'khaki',
      'navy',
      'olive',
      'black',
      'grey',
      'beige',
      'white',
      'light-blue',
    ],
    formality: 'Casual',
    seasons: ['Spring', 'Summer'],
    necklines: [],
    sleeves: [],
    patterns: allPatterns,
  },
  {
    id: 'sneakers',
    name: 'Sneakers',
    group: 'Shoes',
    colors: [
      'white',
      'off-white',
      'black',
      'grey',
      'navy',
      'beige',
      'brown',
      'burgundy',
    ],
    formality: 'Casual',
    seasons,
    necklines: [],
    sleeves: [],
    patterns: ['Solid', 'Printed'],
  },
  {
    id: 'jacket',
    name: 'Simple jacket',
    group: 'Outerwear',
    colors: [
      'olive',
      'navy',
      'black',
      'beige',
      'grey',
      'brown',
      'khaki',
      'burgundy',
    ],
    formality: 'Casual',
    seasons: ['Autumn', 'Winter'],
    necklines: [],
    sleeves: ['Long sleeves'],
    patterns: allPatterns,
  },
];

export function getType(id: TypeId): CatalogType {
  const type = catalog.find((type) => type.id === id);
  if (!type) throw new Error('Unknown garment type');
  return type;
}
export const catalogImageRevision = 'v2';
export function catalogImage(typeId: TypeId, color: ColorId) {
  return `/catalog/${catalogImageRevision}/${typeId}-${color}.png`;
}
