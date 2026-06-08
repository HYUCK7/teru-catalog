"use client";

import { useActionState, useState } from "react";
import type { SiteSettings } from "@/lib/supabase/types";
import { saveSettings } from "@/actions/settings";
import { DEFAULT_CONTACT_LABELS } from "@/components/customer/contact-labels";
import { ImageUploader } from "./ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(initial.banner_url ?? "");

  return (
    <form action={action} className="max-w-lg space-y-4 p-4">
      <div>
        <Label>로고</Label>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="로고" className="my-2 h-16 object-contain" />
        )}
        <ImageUploader
          bucket="public-assets"
          pathPrefix="logo"
          onUploaded={setLogoUrl}
        />
        <input type="hidden" name="logo_url" value={logoUrl} />
      </div>
      <div>
        <Label>대표 배너</Label>
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt="대표 배너"
            className="my-2 h-24 w-full object-cover"
          />
        )}
        <ImageUploader
          bucket="public-assets"
          pathPrefix="banner"
          onUploaded={setBannerUrl}
        />
        <input type="hidden" name="banner_url" value={bannerUrl} />
      </div>
      <Field
        name="shop_name"
        label="가게명"
        defaultValue={initial.shop_name}
        error={state?.errors?.shop_name}
      />
      <div>
        <Label htmlFor="intro">소개 문구</Label>
        <Textarea id="intro" name="intro" defaultValue={initial.intro} />
      </div>
      <Field
        name="kakao_channel_url"
        label="카톡 채널 링크"
        defaultValue={initial.kakao_channel_url ?? ""}
      />
      <Field
        name="kakao_label"
        label="카톡 버튼 라벨"
        defaultValue={initial.kakao_label ?? ""}
        placeholder={DEFAULT_CONTACT_LABELS.kakao}
      />
      <Field name="phone" label="전화번호" defaultValue={initial.phone ?? ""} />
      <Field
        name="phone_label"
        label="전화 버튼 라벨"
        defaultValue={initial.phone_label ?? ""}
        placeholder={DEFAULT_CONTACT_LABELS.phone}
      />
      <Field
        name="instagram"
        label="인스타 계정"
        defaultValue={initial.instagram ?? ""}
      />
      <Field
        name="instagram_label"
        label="인스타 버튼 라벨"
        defaultValue={initial.instagram_label ?? ""}
        placeholder={DEFAULT_CONTACT_LABELS.instagram}
      />
      {state?.ok && <p className="text-sm text-green-600">저장되었습니다.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "저장 중..." : "저장"}
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  error,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
