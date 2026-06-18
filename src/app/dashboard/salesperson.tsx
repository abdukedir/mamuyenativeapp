import { Redirect } from 'expo-router';

export default function SalespersonDashboardRoute() {
  return <Redirect href={'/sales' as never} />;
}
