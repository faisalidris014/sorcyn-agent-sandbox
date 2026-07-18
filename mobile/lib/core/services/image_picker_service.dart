import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class ImagePickerService {
  static final _picker = ImagePicker();

  /// Shows a bottom sheet letting the user choose Camera or Gallery,
  /// then returns the selected [File] or null if cancelled.
  static Future<File?> pickImage(
    BuildContext context, {
    int maxWidth = 1200,
    int maxHeight = 1200,
    int imageQuality = 85,
  }) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined),
                title: const Text('Take Photo'),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: const Text('Choose from Gallery'),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );

    if (source == null) return null;

    final xFile = await _picker.pickImage(
      source: source,
      maxWidth: maxWidth.toDouble(),
      maxHeight: maxHeight.toDouble(),
      imageQuality: imageQuality,
    );

    if (xFile == null) return null;
    return File(xFile.path);
  }

  /// Pick multiple images from the gallery.
  static Future<List<File>> pickMultipleImages({
    int maxWidth = 1200,
    int maxHeight = 1200,
    int imageQuality = 85,
  }) async {
    final xFiles = await _picker.pickMultiImage(
      maxWidth: maxWidth.toDouble(),
      maxHeight: maxHeight.toDouble(),
      imageQuality: imageQuality,
    );

    return xFiles.map((xf) => File(xf.path)).toList();
  }

  /// Shows a bottom sheet letting the user choose Camera or Gallery for video,
  /// then returns the selected [File] or null if cancelled.
  /// Accepts mp4 and mov (video/quicktime).
  static Future<File?> pickVideo(BuildContext context) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.videocam_outlined),
                title: const Text('Record Video'),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.video_library_outlined),
                title: const Text('Choose from Library'),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );

    if (source == null) return null;

    final xFile = await _picker.pickVideo(source: source);
    if (xFile == null) return null;
    return File(xFile.path);
  }

  /// Pick multiple images and/or videos from the gallery (mp4, mov, jpeg, png).
  /// Used for portfolio uploads and after-photo/video evidence.
  static Future<List<File>> pickMultipleMedia() async {
    final xFiles = await _picker.pickMultipleMedia();
    return xFiles.map((xf) => File(xf.path)).toList();
  }
}
