import { AdminNav } from "@/components/admin/AdminNav";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { getCategories } from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const categories = await getCategories(supabase);

  return (
    <div>
      <AdminNav />
      <h1 className="p-4 text-xl font-bold">카테고리 관리</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
