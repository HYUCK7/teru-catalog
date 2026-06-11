import { DEFAULT_CONTACT_LABELS } from "@/components/customer/contact-labels";
import { getSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ amount?: string }>;
}) {
  const supabase = await createClient();
  const [settings, params] = await Promise.all([
    getSettings(supabase),
    searchParams,
  ]);
  const amount = Number(params.amount ?? 0);
  const hasAmount = Number.isFinite(amount) && amount > 0;

  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="my-4 text-lg">주문이 접수되었습니다</h1>
      <p className="space-y-1 text-gray-600">
        <span className="block">
          테루디저트에서는 노쇼 방지를 위해 선입금 후 예약이 확정되오니
          양해부탁드립니다.
        </span>
        <span className="block">
          카드 재결제나 현금영수증 원하시면 픽업시 진행가능하니 편하게
          말씀해주세요.
        </span>
      </p>
      <div className="mt-6 space-y-2">
        <p>계좌 및 금액 안내</p>
        {hasAmount && (
          <p className="rounded border bg-gray-50 py-3">
            ₩ {amount.toLocaleString("ko-KR")}
          </p>
        )}
        <p className="space-y-1">
          <span className="block">카카오뱅크 3333-36-7385245</span>
          <span className="block">김민진(테루디저트)</span>
        </p>
      </div>
      <div className="mt-8 space-y-2">
        {settings.kakao_channel_url && (
          <a
            href={settings.kakao_channel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded bg-black py-3 text-white"
          >
            {settings.kakao_label ?? DEFAULT_CONTACT_LABELS.kakao}
          </a>
        )}
        <Link href="/menu" className="block rounded border py-3">
          메뉴로 돌아가기
        </Link>
      </div>
    </main>
  );
}
