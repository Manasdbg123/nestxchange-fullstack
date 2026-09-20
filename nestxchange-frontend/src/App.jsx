import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import ErrorBoundary from './components/layout/ErrorBoundary';
import AuthModal from './components/auth/AuthModal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ToastViewport from './components/ui/ToastViewport';
import AssistantWidget from './components/assistant/AssistantWidget';
import { Spinner } from './components/ui/Primitives';

import Home from './pages/Home';
import ListingSearch from './pages/ListingSearch';

/*
 * Routes a visitor is unlikely to open on their first visit are split out of
 * the initial bundle. The old build shipped every page, plus Leaflet, to
 * someone who only wanted to look at the home page.
 */
const Properties = lazy(() => import('./pages/Properties'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const CreateListing = lazy(() => import('./pages/CreateListing'));
const EditListing = lazy(() => import('./pages/EditListing'));
const MyListings = lazy(() => import('./pages/MyListings'));
const ListingFavorites = lazy(() => import('./pages/ListingFavorites'));
const SentInquiries = lazy(() => import('./pages/SentInquiries'));
const ListingDetails = lazy(() => import('./pages/ListingDetails'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
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
                            {/* The unified search page: one component for every
                                category (PROPERTY/VEHICLE), driven by the
                                category/mode query params the landing page's
                                selector sets. Replaces the old property-only
                                Search page as the target of /search. */}
                            <Route path="/search" element={<ListingSearch />} />
                            {/* The two dedicated marketplace experiences the
                                brand is actually built around - separate
                                browsing/filter UI per category, sharing the
                                same unified backend underneath. */}
                            <Route path="/properties" element={<Properties />} />
                            <Route path="/vehicles" element={<Vehicles />} />
                            {/* Listing pages are public - no visitor has to sign up
                                to see one, and owner contact details are gated
                                on the detail page itself, not the route. */}
                            <Route path="/listings/:id" element={<ListingDetails />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="/terms-of-use" element={<TermsOfUse />} />

                            {/* Requires an account */}
                            <Route
                                path="/create-listing"
                                element={
                                    <ProtectedRoute>
                                        <CreateListing />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/my-listings"
                                element={
                                    <ProtectedRoute>
                                        <MyListings />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/my-listings/:id/edit"
                                element={
                                    <ProtectedRoute>
                                        <EditListing />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/listing-shortlist"
                                element={
                                    <ProtectedRoute>
                                        <ListingFavorites />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/my-inquiries"
                                element={
                                    <ProtectedRoute>
                                        <SentInquiries />
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
            <AssistantWidget />
        </div>
    );
}
