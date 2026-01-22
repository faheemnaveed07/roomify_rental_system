import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Placeholder page components (to be implemented later)
const HomePage: React.FC = () => (
    <div className="container py-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Roomify</h1>
        <p className="text-lg text-neutral-600">
            Find your perfect rental property or roommate in Pakistan.
        </p>
    </div>
);

const SearchPage: React.FC = () => (
    <div className="container py-8">
        <h1 className="text-4xl font-bold mb-4">Search Properties</h1>
        <p className="text-lg text-neutral-600">
            Search for properties and roommates in your area.
        </p>
    </div>
);

const AuthPage: React.FC = () => (
    <div className="container py-8">
        <h1 className="text-4xl font-bold mb-4">Sign In / Sign Up</h1>
        <p className="text-lg text-neutral-600">
            Access your Roomify account.
        </p>
    </div>
);

const NotFoundPage: React.FC = () => (
    <div className="container py-8 text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-lg text-neutral-600">Page not found</p>
    </div>
);

const App: React.FC = () => {
    return (
        <Router>
            <div className="min-h-screen bg-neutral-50">
                {/* Navigation placeholder */}
                <nav className="bg-white shadow-sm border-b border-neutral-200">
                    <div className="container">
                        <div className="flex items-center justify-between h-16">
                            <a href="/" className="text-xl font-bold text-primary-500">
                                Roomify
                            </a>
                            <div className="flex items-center gap-4">
                                <a href="/search" className="text-neutral-600 hover:text-primary-500">
                                    Search
                                </a>
                                <a href="/auth" className="btn btn-primary">
                                    Sign In
                                </a>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main content */}
                <main>
                    <Routes>
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>

                {/* Footer placeholder */}
                <footer className="bg-neutral-800 text-white py-8 mt-auto">
                    <div className="container text-center">
                        <p className="text-neutral-400">
                            © 2024 Roomify. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </Router>
    );
};

export default App;
