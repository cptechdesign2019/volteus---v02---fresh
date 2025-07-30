export default function LoggedOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          You have been signed out
        </h2>
        <p className="text-gray-600 mb-6">
          You can now safely close this window or sign in again.
        </p>
        <a 
          href="/login"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          Sign In
        </a>
      </div>
    </div>
  )
}