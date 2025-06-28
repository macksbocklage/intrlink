import { auth, currentUser } from "@clerk/nextjs/server";
import { User } from "@clerk/nextjs/server";

export interface UserMetadata {
  onboardingCompleted: boolean;
}

export async function getCurrentUser(): Promise<User | null> {
  return await currentUser();
}

export async function getCurrentUserMetadata(): Promise<UserMetadata | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return {
    onboardingCompleted: user.unsafeMetadata?.onboardingCompleted as boolean || false,
  };
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
} 