import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 - Page not found | Fortress LOS",
  description:
    "Sorry, we couldn’t find the page you’re looking for in the Loan Origination System.",
};

export default function Error404() {
  return (
    <div className="grid h-screen items-center bg-background pb-8 lg:grid-cols-2 lg:pb-0">
      <div className="text-center px-4">
        <p className="text-base font-semibold text-muted-foreground">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl lg:text-7xl">
          Page not found
        </h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/">
            <Button size="lg">Go back home</Button>
          </Link>
          <Button size="lg" variant="ghost">
            Contact support <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="hidden lg:flex lg:justify-center lg:items-center p-8">
        <img
          src={`/images/404.svg`}
          alt="404 visual"
          className="object-contain max-h-[80vh]"
        />
      </div>
    </div>
  );
}
