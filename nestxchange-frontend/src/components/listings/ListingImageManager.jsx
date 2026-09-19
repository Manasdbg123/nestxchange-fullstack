import { useRef, useState } from 'react';

import Icon from '../ui/Icon';
import { Alert, Spinner } from '../ui/Primitives';
import { listingApi } from '../../api/endpoints';
import { toErrorMessage } from '../../api/client';

const MAX_IMAGES = 12;

/**
 * Owner-only photo management for a listing: upload, delete, set cover
 * image. Shown on the listing detail page when the viewer is the owner, and
 * on the edit page. Talks straight to POST/DELETE/PATCH
 * /listings/{id}/images - there's no local "pending upload" staging step
 * since a listing must already exist for images to attach to (unlike the
 * legacy Property flow, which uploads alongside creation in one multipart
 * request).
 */
export default function ListingImageManager({ listingId, images, onChange }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [busyImageId, setBusyImageId] = useState(null);
    const [error, setError] = useState('');

    const remainingSlots = MAX_IMAGES - images.length;

    const handleFilesSelected = (event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (files.length === 0) return;

        setUploading(true);
        setError('');
        listingApi
            .uploadImages(listingId, files)
            .then((updatedImages) => onChange(updatedImages))
            .catch((requestError) => setError(toErrorMessage(requestError, 'Could not upload those images.')))
            .finally(() => setUploading(false));
    };

    const handleDelete = (imageId) => {
        setBusyImageId(imageId);
        setError('');
        listingApi
            .deleteImage(listingId, imageId)
            .then(() => onChange(images.filter((image) => image.id !== imageId)))
            .catch((requestError) => setError(toErrorMessage(requestError, 'Could not remove that photo.')))
            .finally(() => setBusyImageId(null));
    };

    const handleSetPrimary = (imageId) => {
        setBusyImageId(imageId);
        setError('');
        listingApi
            .setPrimaryImage(listingId, imageId)
            .then((updatedImages) => onChange(updatedImages))
            .catch((requestError) => setError(toErrorMessage(requestError, 'Could not set that as the cover photo.')))
            .finally(() => setBusyImageId(null));
    };

    return (
        <div>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                    Photos ({images.length}/{MAX_IMAGES})
                </h3>
                {remainingSlots > 0 ? (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="btn-secondary btn-sm"
                    >
                        {uploading ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="upload" className="h-3.5 w-3.5" />}
                        {uploading ? 'Uploading…' : 'Add photos'}
                    </button>
                ) : null}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={handleFilesSelected}
                />
            </div>

            {error ? (
                <div className="mt-3">
                    <Alert tone="error" onDismiss={() => setError('')}>
                        {error}
                    </Alert>
                </div>
            ) : null}

            {images.length === 0 ? (
                <p className="mt-3 text-sm text-ink-400">
                    No photos yet - listings with photos get far more interest.
                </p>
            ) : (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {images.map((image) => (
                        <div key={image.id} className="group relative overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
                            <img src={image.imageUrl} alt="" className="h-28 w-full object-cover" />

                            {image.isPrimary ? (
                                <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    Cover
                                </span>
                            ) : null}

                            <div className="absolute inset-0 flex items-end justify-center gap-1.5 bg-ink-950/0 p-1.5 opacity-0 transition-opacity group-hover:bg-ink-950/40 group-hover:opacity-100">
                                {!image.isPrimary ? (
                                    <button
                                        type="button"
                                        onClick={() => handleSetPrimary(image.id)}
                                        disabled={busyImageId === image.id}
                                        title="Set as cover photo"
                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-700 hover:bg-white"
                                    >
                                        <Icon name="heart" className="h-3.5 w-3.5" />
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => handleDelete(image.id)}
                                    disabled={busyImageId === image.id}
                                    title="Delete photo"
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-accent-600 hover:bg-white"
                                >
                                    <Icon name="trash" className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
