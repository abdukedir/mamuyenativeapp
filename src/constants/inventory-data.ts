export type CategorySlug = 'tv' | 'speakers' | 'refrigerators' | 'accessories';

export type CategorySummary = {
  slug: CategorySlug;
  name: string;
  items: number;
  inStock: number;
  symbol: string;
  accent: string;
};

export type ProductItem = {
  id: string;
  category: CategorySlug;
  name: string;
  sku: string;
  stock: number;
  price: string;
  accent: string;
};

export const categorySummaries: CategorySummary[] = [
  { slug: 'tv', name: 'TV', items: 32, inStock: 26, symbol: 'tv', accent: '#1d7cff' },
  { slug: 'speakers', name: 'Speakers', items: 28, inStock: 20, symbol: 'speaker.wave.2', accent: '#263241' },
  {
    slug: 'refrigerators',
    name: 'Refrigerators',
    items: 24,
    inStock: 18,
    symbol: 'refrigerator',
    accent: '#8d99a8',
  },
  { slug: 'accessories', name: 'Accessories', items: 44, inStock: 32, symbol: 'cable.connector', accent: '#151b26' },
];

export const products: ProductItem[] = [
  { id: 'tv-1', category: 'tv', name: 'Samsung 43" Smart TV', sku: 'TV-43-SAM', stock: 12, price: '$299.00', accent: '#2d8cff' },
  { id: 'tv-2', category: 'tv', name: 'LG 55" 4K UHD TV', sku: 'TV-55-LG', stock: 8, price: '$499.00', accent: '#d83b8a' },
  { id: 'tv-3', category: 'tv', name: 'Sony 65" 4K LED TV', sku: 'TV-65-SON', stock: 6, price: '$699.00', accent: '#f15a24' },
  { id: 'tv-4', category: 'tv', name: 'TCL 32" HD TV', sku: 'TV-32-TCL', stock: 10, price: '$189.00', accent: '#4b8a4b' },
  { id: 'speakers-1', category: 'speakers', name: 'JBL Flip 6', sku: 'SP-JBL-FLIP6', stock: 10, price: '$129.00', accent: '#303640' },
  { id: 'speakers-2', category: 'speakers', name: 'Sony SRS-XB23', sku: 'SP-SON-XB23', stock: 7, price: '$99.00', accent: '#1d2836' },
  { id: 'speakers-3', category: 'speakers', name: 'Boat Stone 620', sku: 'SP-BOAT-620', stock: 8, price: '$59.00', accent: '#323232' },
  { id: 'speakers-4', category: 'speakers', name: 'Philips SPA8000B', sku: 'SP-PHI-8000', stock: 5, price: '$89.00', accent: '#1f2937' },
  { id: 'refrigerators-1', category: 'refrigerators', name: 'Samsung 253L Refrigerator', sku: 'REF-SAM-253', stock: 8, price: '$399.00', accent: '#c6ccd3' },
  { id: 'refrigerators-2', category: 'refrigerators', name: 'LG 305L Refrigerator', sku: 'REF-LG-305', stock: 6, price: '$479.00', accent: '#d3d6db' },
  { id: 'refrigerators-3', category: 'refrigerators', name: 'Whirlpool 340L Refrigerator', sku: 'REF-WHP-340', stock: 4, price: '$529.00', accent: '#a7adb7' },
  { id: 'refrigerators-4', category: 'refrigerators', name: 'Haier 190L Refrigerator', sku: 'REF-HAI-190', stock: 10, price: '$279.00', accent: '#b9c0c9' },
  { id: 'accessories-1', category: 'accessories', name: 'HDMI Cable 2m', sku: 'ACC-HDMI-2M', stock: 20, price: '$8.00', accent: '#20242c' },
  { id: 'accessories-2', category: 'accessories', name: 'Remote Control Universal', sku: 'ACC-REMOTE-UNI', stock: 15, price: '$6.00', accent: '#2f3642' },
  { id: 'accessories-3', category: 'accessories', name: 'TV Wall Mount Bracket', sku: 'ACC-MOUNT-TV', stock: 9, price: '$14.00', accent: '#1c2330' },
  { id: 'accessories-4', category: 'accessories', name: 'Power Extension 5m', sku: 'ACC-EXT-5M', stock: 18, price: '$10.00', accent: '#101820' },
];

export function getCategory(slug: string) {
  return categorySummaries.find((category) => category.slug === slug);
}

export function getProductsByCategory(slug: CategorySlug) {
  return products.filter((product) => product.category === slug);
}
