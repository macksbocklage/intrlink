import { getCurrentUserMetadata } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const userMetadata = await getCurrentUserMetadata();
  
  if (!userMetadata) {
    redirect("/");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to Intrlink - Your AI-powered SOP management platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
          <p className="text-2xl font-bold text-indigo-600">0</p>
          <p className="text-sm text-gray-500">Uploaded SOPs</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Conversations</h3>
          <p className="text-2xl font-bold text-indigo-600">0</p>
          <p className="text-sm text-gray-500">AI chats</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Analyses</h3>
          <p className="text-2xl font-bold text-indigo-600">0</p>
          <p className="text-sm text-gray-500">SOP improvements</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/documents"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900">Upload Documents</h3>
            <p className="text-sm text-gray-500 mt-1">
              Add your SOPs and procedures
            </p>
          </a>

          <a
            href="/chat"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900">Chat with AI</h3>
            <p className="text-sm text-gray-500 mt-1">
              Ask questions about your procedures
            </p>
          </a>

          <a
            href="/analysis"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900">Analyze SOPs</h3>
            <p className="text-sm text-gray-500 mt-1">
              Get improvement suggestions
            </p>
          </a>

          <a
            href="/settings"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900">Settings</h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage your account
            </p>
          </a>
        </div>
      </div>
    </div>
  );
} 