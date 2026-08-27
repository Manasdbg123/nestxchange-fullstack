package com.rentnest.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.rentnest.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    @Override
    public String uploadImage(MultipartFile file) throws IOException {
        log.info("Uploading image to Cloudinary: {}", file.getOriginalFilename());

        // Generate a unique public ID to prevent file overwrites
        String publicId = "rentnest/properties/" + UUID.randomUUID().toString();

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "public_id", publicId,
                "folder", "rentnest"
        ));

        return uploadResult.get("secure_url").toString();
    }
}