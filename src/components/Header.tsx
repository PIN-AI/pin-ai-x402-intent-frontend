import logoImage from '../../media/PINAI_400x400.jpg';

export function Header() {
  return (
    <header className="border-b border-pink-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="PIN AI Logo" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
                PIN AI x402
              </h1>
              <p className="text-xs text-gray-500">Intent Protocol</p>
            </div>
          </div>

          {/* Connect Button (AppKit automatically provides the button) */}
          <appkit-button />
        </div>
      </div>
    </header>
  );
}
