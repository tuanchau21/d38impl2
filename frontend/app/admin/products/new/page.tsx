import { AdminProductForm } from "@/components/admin/AdminProductForm";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        New product
      </h1>
      <AdminProductForm />
    </div>
  );
}
