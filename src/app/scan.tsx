import { ActionScreen } from '@/components/inventory/action-screen';

export default function ScanScreen() {
  return (
    <ActionScreen
      title="Scan"
      description="Barcode scanning action is ready for camera integration."
      activeTab="products"
    />
  );
}
