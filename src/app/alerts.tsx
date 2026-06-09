import { ActionScreen } from '@/components/inventory/action-screen';

export default function AlertsScreen() {
  return (
    <ActionScreen
      title="Alerts"
      description="Low-stock alerts and new-sale notifications will appear here."
      activeTab="more"
    />
  );
}
