import { AdminNav } from "@/components/admin/AdminNav";
import { OrderList } from "@/components/admin/OrderList";
import { OrdersSubNav } from "@/components/admin/OrdersSubNav";
import { getOrders } from "@/lib/data/orders";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const orders = await getOrders(supabase);

  return (
    <div>
      <AdminNav />
      <OrdersSubNav />
      <h1 className="p-4 text-xl font-bold">주문 목록</h1>
      <OrderList orders={orders} />
    </div>
  );
}
