"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function OnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const onboardingCompleted = user.unsafeMetadata?.onboardingCompleted as boolean;
      
      if (!onboardingCompleted && pathname !== "/onboarding") {
        router.push("/onboarding");
      } else if (onboardingCompleted && pathname === "/onboarding") {
        router.push("/dashboard");
      }
    }
    
    setIsChecking(false);
  }, [user, isLoaded, pathname, router]);

  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
} 