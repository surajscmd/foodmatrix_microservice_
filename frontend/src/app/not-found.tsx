export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070a13] text-white flex items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-sm text-zinc-400">The requested route does not exist in the FoodMatrix operations portal.</p>
      </div>
    </div>
  );
}
