import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api";
import { AdminProductForm } from "@/components/admin/AdminProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);
  if (Number.isNaN(numId)) notFound();

  let product;
  try {
    product = await getProduct(id);
  } catch (err) {
    console.error("[admin edit] Failed to load product", { id, error: err });
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Edit: {product.name}
      </h1>
      <AdminProductForm product={product} />
    </div>
  );
}
