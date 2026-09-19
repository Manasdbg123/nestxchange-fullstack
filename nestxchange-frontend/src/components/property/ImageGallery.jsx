import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1400';

/** Remote listing photos can 404; fall back rather than showing a blank frame. */
function handleImageError(event) {
    const image = event.currentTarget;
    if (image.src !== FALLBACK_IMAGE) {
        image.src = FALLBACK_IMAGE;
    }
}

/**
 * Photo grid with a full-screen lightbox.
 *
 * The old detail page padded every listing out to five tiles with the same
 * stock photograph, so a one-photo listing appeared to have five - and its
 * "Show all photos" button did nothing at all.
 */
export default function ImageGallery({ images = [], title }) {
    const photos = images.length ? images.map((image) => image.imageUrl) : [FALLBACK_IMAGE];
    const [lightboxIndex, setLightboxIndex] = useState(null);

    const open = lightboxIndex !== null;

    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') setLightboxIndex(null);
            if (event.key === 'ArrowRight') setLightboxIndex((index) => (index + 1) % photos.length);
            if (event.key === 'ArrowLeft')
                setLightboxIndex((index) => (index - 1 + photos.length) % photos.length);
        };

        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = overflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, photos.length]);

    // Only offer the mosaic when there are genuinely enough photos to fill it.
    const showMosaic = photos.length >= 3;

    return (
        <>
            <div className="grid gap-2 overflow-hidden rounded-2xl md:grid-cols-4 md:grid-rows-2">
                <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className={`group relative h-64 overflow-hidden bg-ink-100 md:h-full dark:bg-ink-800 ${
                        showMosaic ? 'md:col-span-2 md:row-span-2' : 'md:col-span-4 md:row-span-2'
                    }`}
                >
                    <img
                        src={photos[0]}
                        alt={`${title} - main photo`}
                        onError={handleImageError}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </button>

                {showMosaic
                    ? photos.slice(1, 5).map((photo, index) => (
                          <button
                              key={photo + index}
                              type="button"
                              onClick={() => setLightboxIndex(index + 1)}
                              className="group relative hidden h-full min-h-32 overflow-hidden bg-ink-100 md:block dark:bg-ink-800"
                          >
                              <img
                                  src={photo}
                                  alt={`${title} - photo ${index + 2}`}
                                  loading="lazy"
                                  onError={handleImageError}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              {index === 3 && photos.length > 5 ? (
                                  <span className="absolute inset-0 flex items-center justify-center bg-ink-950/55 text-sm font-bold text-white">
                                      +{photos.length - 5} more
                                  </span>
                              ) : null}
                          </button>
                      ))
                    : null}
            </div>

            <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-ink-500 dark:text-ink-400">
                    {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                    {images.length === 0 ? ' (placeholder — the owner has not uploaded any yet)' : ''}
                </p>
                <button type="button" onClick={() => setLightboxIndex(0)} className="btn-secondary btn-sm">
                    <Icon name="photo" className="h-4 w-4" />
                    View all photos
                </button>
            </div>

            {open ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${title} photo viewer`}
                    className="fixed inset-0 z-[150] flex items-center justify-center bg-ink-950/95 p-4"
                >
                    <button
                        type="button"
                        onClick={() => setLightboxIndex(null)}
                        className="absolute right-5 top-5 rounded-full p-2.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <Icon name="close" className="h-5 w-5" strokeWidth={2} />
                        <span className="sr-only">Close photo viewer</span>
                    </button>

                    <p className="absolute left-5 top-6 text-sm font-medium text-white/70">
                        {lightboxIndex + 1} / {photos.length}
                    </p>

                    {photos.length > 1 ? (
                        <button
                            type="button"
                            onClick={() =>
                                setLightboxIndex((index) => (index - 1 + photos.length) % photos.length)
                            }
                            className="absolute left-4 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                        >
                            <Icon name="chevronLeft" className="h-5 w-5" strokeWidth={2.5} />
                            <span className="sr-only">Previous photo</span>
                        </button>
                    ) : null}

                    <img
                        src={photos[lightboxIndex]}
                        alt={`${title} - photo ${lightboxIndex + 1}`}
                        onError={handleImageError}
                        className="max-h-[85vh] max-w-full rounded-xl object-contain"
                    />

                    {photos.length > 1 ? (
                        <button
                            type="button"
                            onClick={() => setLightboxIndex((index) => (index + 1) % photos.length)}
                            className="absolute right-4 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                        >
                            <Icon name="chevronRight" className="h-5 w-5" strokeWidth={2.5} />
                            <span className="sr-only">Next photo</span>
                        </button>
                    ) : null}
                </div>
            ) : null}
        </>
    );
}
