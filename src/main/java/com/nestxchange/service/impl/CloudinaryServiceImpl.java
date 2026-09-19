package com.nestxchange.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.nestxchange.exception.BusinessValidationException;
import com.nestxchange.service.CloudinaryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Uploads to Cloudinary when credentials are configured; otherwise falls
 * back to writing the file to a local, git-ignored `uploads/` directory
 * served at {@code /uploads/**} (see WebMvcConfig) - documented in
 * `.env.example` as "leave blank to run with the no-op local image store",
 * which nothing previously actually implemented.
 */
@Service
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    private final Cloudinary cloudinary;
    private final String cloudName;
    private final String publicBaseUrl;
    private final Path localUploadDir;

    public CloudinaryServiceImpl(
            Cloudinary cloudinary,
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${app.public-base-url:http://localhost:8081}") String publicBaseUrl,
            @Value("${app.upload.local-dir:uploads}") String localUploadDir) {
        this.cloudinary = cloudinary;
        this.cloudName = cloudName;
        this.publicBaseUrl = publicBaseUrl;
        this.localUploadDir = Path.of(localUploadDir).toAbsolutePath().normalize();
    }

    @Override
    public String uploadImage(MultipartFile file) throws IOException {
        validate(file);
        return StringUtils.hasText(cloudName) ? uploadToCloudinary(file) : uploadLocally(file);
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessValidationException("The image file is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BusinessValidationException("Only image files are accepted");
        }
        if (extensionOf(file).isEmpty()) {
            throw new BusinessValidationException("Unsupported image type - use JPG, PNG, WEBP or GIF");
        }
    }

    private String uploadToCloudinary(MultipartFile file) throws IOException {
        log.info("Uploading image to Cloudinary: {}", file.getOriginalFilename());

        // Generate a unique public ID to prevent file overwrites
        String publicId = "nestxchange/properties/" + UUID.randomUUID();

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "public_id", publicId,
                "folder", "nestxchange"
        ));

        return uploadResult.get("secure_url").toString();
    }

    /**
     * Never trust {@code file.getOriginalFilename()} for the on-disk name -
     * it's client-supplied and a path-traversal vector (`../../evil`). The
     * stored filename is always a fresh UUID; only the extension, checked
     * against a fixed allow-list, comes from the client.
     */
    private String uploadLocally(MultipartFile file) throws IOException {
        Files.createDirectories(localUploadDir);

        String extension = extensionOf(file).orElseThrow();
        String filename = UUID.randomUUID() + "." + extension;
        Path target = localUploadDir.resolve(filename).normalize();
        if (!target.startsWith(localUploadDir)) {
            throw new BusinessValidationException("Invalid file name");
        }

        file.transferTo(target);
        log.info("Stored image locally (no Cloudinary credentials configured): {}", target);

        return publicBaseUrl + "/uploads/" + filename;
    }

    private static Optional<String> extensionOf(MultipartFile file) {
        String name = file.getOriginalFilename();
        if (name == null || !name.contains(".")) {
            return Optional.empty();
        }
        String extension = name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        return ALLOWED_EXTENSIONS.contains(extension) ? Optional.of(extension) : Optional.empty();
    }
}
