import Link from "next/link";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function AdminNav() {
  return (
    <nav className="flex flex-wrap items-center gap-4 border-b p-4 text-sm">
      <Link href="/admin/settings" className="font-medium">
        사이트 설정
      </Link>
      <Link href="/admin/categories">카테고리</Link>
      <Link href="/admin/products">상품</Link>
      <form action={logout} className="ml-auto">
        <Button type="submit" variant="outline" size="sm">
          로그아웃
        </Button>
      </form>
    </nav>
  );
}
