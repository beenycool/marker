import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { AdminNav } from '@/components/admin/admin-nav';
import { Toaster } from 'react-hot-toast';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}