import React from 'react';
import ServiceExample from '../../components/examples/ServiceExample';

export const metadata = {
    title: 'Service Example | Royal Blackjack Casino',
    description: 'Demonstration of service integration in the Royal Blackjack Casino application.',
};

export default function ServicesExamplePage() {
    return (
        <div className="container mx-auto py-12">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Services Integration Example</h1>
                <p className="text-muted-foreground mt-2">
                    This page demonstrates how to use the various services in the application.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Available Services</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>AuthService</strong>: User authentication and session management</li>
                        <li><strong>GameService</strong>: Game state and operations</li>
                        <li><strong>UserService</strong>: User profile and preferences</li>
                        <li><strong>AudioService</strong>: Sound effects and music playback</li>
                        <li><strong>AnalyticsService</strong>: Event tracking and analytics</li>
                        <li><strong>LocalStorageService</strong>: Browser storage operations</li>
                    </ul>

                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold">How To Use</h2>
                        <div className="mt-2 bg-gray-800 p-4 rounded-md">
                            <pre className="text-sm text-gray-300">
                                {`
// Import the service provider hook
import { useServiceProvider } from '../hooks';

// Use the services in your component
function MyComponent() {
  const { services } = useServiceProvider();

  // Example: Play a sound
  const handleClick = () => {
    services.audio.playSound('button_click');
  };

  return (
    <button onClick={handleClick}>
      Click Me
    </button>
  );
}
                `.trim()}
                            </pre>
                        </div>
                    </div>
                </div>

                <div>
                    <ServiceExample />
                </div>
            </div>
        </div>
    );
}