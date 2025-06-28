"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mark onboarding as completed
      await user?.update({
        unsafeMetadata: {
          onboardingCompleted: true,
        },
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Intrlink
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You're all set! Let's get you started with managing your SOPs.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              You now have full access to all features:
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Upload and manage SOPs
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Chat with AI about your procedures
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Get intelligent improvement suggestions
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                View analytics and insights
              </li>
            </ul>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Setting up..." : "Get Started"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 