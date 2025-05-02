"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="relative min-h-[80vh] flex items-center from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            学習の記録を、
            <br />
            もっとスマートに
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
            Learning Journalで学習記録を管理し、
            <br className="hidden md:inline" />
            あなたの成長を可視化しましょう
          </p>
          <div className="flex gap-4">
            {session ? (
              <>
                <Button asChild size="lg">
                  <Link href="/units">学習を始める</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href={`/users/${session.user.id}`}>プロフィールへ</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/auth/login">無料で始める</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/users/cm9pij88r0000bogga3i0qogr">
                    デモを見る
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
