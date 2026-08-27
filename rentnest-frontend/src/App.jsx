import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import ErrorBoundary from './components/layout/ErrorBoundary';
import AuthModal from './components/auth/AuthModal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ToastViewport from './components/ui/ToastViewport';
import { Spinner } from './components/ui/Primitives';

import Home from './pages/Home';
import Search from './pages/Search';

/*
 * Routes a visitor is unlikely to open on their first visit are split out of
 * the initial bundle. The old build shipped every page, plus Leaflet, to
 * someone who only wanted to look at the home page.
 */
const PropertyDetails = lazy(() => import('./pages/PropertyDetails'));
const ListYourProperty = lazy(() => import('./pages/ListYourProperty'));
const PostProperty = lazy(() => import('./pages/PostProperty'));
const EditProperty = lazy(() => import('./pages/EditProperty'));
const MyProperties = lazy(() => import('./pages/MyProperties'));
const Shortlist = lazy(() => import('./pages/Shortlist'));
const Visits = lazy(() => import('./pages/Visits'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteFallback() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center" role="status">
            <Spinner className="h-8 w-8 text-brand-500" />
            <span className="sr-only">Loading page</span>
        </div>
    );
}

export default function App() {
    return (
        <div className="flex min-h-screen flex-col">
            <ScrollToTop />
            <Navbar />

            {/* Target of the "skip to content" link in the navigation. */}
            <main id="main" className="flex-1">
                <ErrorBoundary>
                    <Suspense fallback={<RouteFallback />}>
                        <Routes>
                            {/* Public */}
                            <Route path="/" element={<Home />} />
                            <Route path="/search" element={<Search />} />
                            {/* Listing pages are public. They used to sit behind a
                                login wall, which meant no visitor could see a
                                property before signing up and no search engine
                                could index one. Owner contact details are still
                                gated on the detail page itself. */}
                            <Route path="/property/:id" element={<PropertyDetails />} />
                            <Route path="/list-your-property" element={<ListYourProperty />} />

                            {/* Requires an account */}
                            <Route
                                path="/post-property"
                                element={
                                    <ProtectedRoute>
                                        <PostProperty />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/property/:id/edit"
                                element={
                                    <ProtectedRoute>
                                        <EditProperty />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/my-properties"
                                element={
                                    <ProtectedRoute>
                                        <MyProperties />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/shortlist"
                                element={
                                    <ProtectedRoute>
                                        <Shortlist />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/visits"
                                element={
                                    <ProtectedRoute>
                                        <Visits />
                                    </ProtectedRoute>
                                }
                            />

                            {/* An unknown URL previously rendered a blank page. */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </main>

            <Footer />
            <AuthModal />
            <ToastViewport />
        </div>
    );
}
