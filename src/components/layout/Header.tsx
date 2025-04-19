"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loading } from "@/components/ui/loading";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BookOpen,
  Home,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 画像URLの検証関数
const isValidImageUrl = (url: string | null): boolean => {
  if (!url) return false;
  const allowedDomains = [
    "lh3.googleusercontent.com",
    "avatars.githubusercontent.com",
    "localhost",
    window.location.hostname,
    "supabase.co",
  ];
  try {
    const urlObj = new URL(url);
    return allowedDomains.some((domain) => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

export function Header() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // パスが変更されたらローディング状態をリセット
  useEffect(() => {
    setIsLoading(false);
    setLoadingLink(null);
  }, [pathname]);

  const handleLinkClick = (href: string) => {
    // 現在のパスと同じ場合は何もしない
    if (href === pathname) return;

    setIsLoading(true);
    setLoadingLink(href);
  };

  const navigationItems = [
    {
      href: "/",
      icon: Home,
      label: "ホーム",
    },
    {
      href: "/units",
      icon: BookOpen,
      label: "ユニット",
    },
    {
      href: "/users",
      icon: Search,
      label: "ユーザー検索",
    },
  ];

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[100]">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <Loading text="読み込み中..." />
            <p className="mt-2 text-sm text-gray-600">
              ページに移動しています...
            </p>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-2 md:px-4">
          <div className="flex items-center -ml-2 md:ml-0">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => handleLinkClick("/")}
            >
              <img
                src="/logo.png"
                alt="Learning Journal"
                className="h-28 w-auto sm:h-32 md:h-36 lg:h-40"
              />
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-foreground/80 text-foreground flex items-center gap-1"
                  onClick={() => handleLinkClick(item.href)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <ThemeToggle />

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[280px]">
                <SheetHeader>
                  <SheetTitle>メニュー</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-4">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setIsOpen(false);
                        handleLinkClick(item.href);
                      }}
                      className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground/80"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          session.user?.image || "/images/default-avatar.png"
                        }
                        alt={session.user?.name || ""}
                      />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/users/${session.user?.id}`}
                      onClick={() =>
                        handleLinkClick(`/users/${session.user?.id}`)
                      }
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>プロフィール</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/account"
                      onClick={() => handleLinkClick("/settings")}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>設定</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/api/auth/signout"
                      onClick={() => handleLinkClick("/api/auth/logout")}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>ログアウト</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link
                  href="/auth/login"
                  onClick={() => handleLinkClick("/auth/login")}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>ログイン</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
