"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Props = {
  initials: string;
  avatarUrl?: string | null;
};

export function UserMenu({ initials, avatarUrl }: Props) {
  const t = useTranslations("header");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-9 w-9 rounded-full overflow-hidden border-2 border-brand-salmon/60 hover:border-brand-salmon transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-salmon"
          aria-label={t("my_area")}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-brand-lavender text-brand-navy text-xs font-sora font-bold">
              {initials}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44 mt-2">
        <DropdownMenuItem asChild>
          <Link href="/hub" className="flex items-center gap-2 cursor-pointer">
            <LayoutDashboard className="h-4 w-4" />
            {t("my_area")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <form action="/api/auth/signout" method="POST" className="w-full">
            <button
              type="submit"
              className="flex w-full items-center gap-2 text-red-600 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              {t("sign_out")}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
