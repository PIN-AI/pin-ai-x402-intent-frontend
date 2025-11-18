import { Header } from '@/components/Header';
import { IntentForm } from '@/components/IntentForm';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-fuchsia-50 to-purple-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <IntentForm />
      </main>

      <footer className="text-center py-8 text-sm text-gray-600">
        <p>
          Powered by{' '}
          <a
            href="https://www.pinai.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-fuchsia-600 transition-colors"
          >
            PIN AI
          </a>
          {' & '}
          <a
            href="https://x402.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-fuchsia-600 transition-colors"
          >
            x402 Protocol
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
