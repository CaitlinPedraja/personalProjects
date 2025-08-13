export default function AccessDenied() {
  return (
    <div className="flex flex-col gap-2 text-center mt-12 text-gray-700 justify-center">
      <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
      <p className="mb-6">You do not have the necessary permissions to access this page.</p>
      <a href="/furniture" className="bg-black text-white p-3 rounded-3xl mx-auto mt-3 w-1/3 inline-block hover:bg-gray-800">
        Return to Home
      </a>
    </div>
  );
}
