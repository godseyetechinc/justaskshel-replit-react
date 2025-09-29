import DashboardLayout from "@/components/dashboard-layout";
import NotificationCenter from "@/components/notifications/NotificationCenter";

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <NotificationCenter />
      </div>
    </DashboardLayout>
  );
}