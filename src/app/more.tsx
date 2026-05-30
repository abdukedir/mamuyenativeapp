import { ActionScreen } from '@/components/inventory/action-screen';

export default function MoreScreen() {
  return (
    <ActionScreen
      title="More"
      description="Profile, settings, suppliers, inventory, and app administration shortcuts will be grouped here."
      activeTab="more"
    />
  );
}
