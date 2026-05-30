import { ActionScreen } from '@/components/inventory/action-screen';

export default function AddProductScreen() {
  return (
    <ActionScreen
      title="Add Item"
      description="Product creation will open here with image upload, barcode, pricing, category, and stock fields."
      activeTab="products"
    />
  );
}
