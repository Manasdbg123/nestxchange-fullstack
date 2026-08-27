package com.rentnest.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface CloudinaryService {
    String uploadImage(MultipartFile file) throws IOException;
}