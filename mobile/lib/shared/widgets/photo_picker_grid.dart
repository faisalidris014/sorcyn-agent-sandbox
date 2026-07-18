import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wechat_assets_picker/wechat_assets_picker.dart';

import '../../core/providers/upload_provider.dart';
import '../../core/theme/app_colors.dart';
import 'numbered_media_picker.dart';

class _MediaEntry {
  final String key;
  final File? file; // null for pre-populated URL-only entries
  final bool isVideo;
  final String? publicUrl;
  final bool isUploading;
  final bool hasError;
  final String? contentHash; // SHA-256 of file bytes for dedup
  // Source gallery asset, when this entry was picked from the library. Kept so
  // the picker can re-open with this item pre-selected (checkmark). Null for
  // camera captures and pre-populated URL entries.
  final AssetEntity? asset;

  const _MediaEntry({
    required this.key,
    this.file,
    this.isVideo = false,
    this.publicUrl,
    this.isUploading = false,
    this.hasError = false,
    this.contentHash,
    this.asset,
  });

  _MediaEntry copyWith({
    String? publicUrl,
    bool? isUploading,
    bool? hasError,
  }) =>
      _MediaEntry(
        key: key,
        file: file,
        isVideo: isVideo,
        publicUrl: publicUrl ?? this.publicUrl,
        isUploading: isUploading ?? this.isUploading,
        hasError: hasError ?? this.hasError,
        contentHash: contentHash,
        asset: asset,
      );
}

/// Photo + video picker / upload grid. Picks up to [maxPhotos] images and
/// [maxVideos] videos, uploads each immediately via UploadService, and notifies
/// [onUrlsChanged] (photos) and [onVideoUrlsChanged] (videos) with the list of
/// successfully uploaded public URLs.
class PhotoPickerGrid extends ConsumerStatefulWidget {
  final ValueChanged<List<String>> onUrlsChanged;
  final ValueChanged<List<String>>? onVideoUrlsChanged;

  /// Fired whenever any picked item is still uploading or has failed, so the
  /// host screen can block submit until uploads resolve and photos aren't
  /// silently dropped from the post (#164).
  final ValueChanged<bool>? onPendingChanged;

  /// Pre-populate the grid with already-uploaded photo URLs (Edit Post).
  /// These appear as finished tiles — no re-upload, but removable.
  final List<String> initialUrls;

  /// Pre-populate the grid with already-uploaded video URLs (Edit Post).
  final List<String> initialVideoUrls;

  final int maxPhotos;
  final int maxVideos;
  final double maxFileSizeMb;
  final double maxVideoFileSizeMb;

  /// R2 upload category for photos — determines storage path + dedup namespace.
  /// Defaults to post uploads; offer-submit passes 'offer-photos'.
  final String photoCategory;

  /// R2 upload category for videos.
  final String videoCategory;

  const PhotoPickerGrid({
    super.key,
    required this.onUrlsChanged,
    this.onVideoUrlsChanged,
    this.onPendingChanged,
    this.initialUrls = const [],
    this.initialVideoUrls = const [],
    this.maxPhotos = 10,
    this.maxVideos = 3,
    this.maxFileSizeMb = 10.0,
    this.maxVideoFileSizeMb = 100.0,
    this.photoCategory = 'post-photos',
    this.videoCategory = 'post-videos',
  });

  @override
  ConsumerState<PhotoPickerGrid> createState() => _PhotoPickerGridState();
}

/// Action chosen from the source bottom sheet.
enum _PickAction { takePhoto, takeVideo, chooseFromGallery }

class _PhotoPickerGridState extends ConsumerState<PhotoPickerGrid> {
  static final _picker = ImagePicker();
  final List<_MediaEntry> _entries = [];
  final Set<String> _seenHashes = {};
  int _nextKey = 0;

  @override
  void initState() {
    super.initState();
    for (final url in widget.initialUrls) {
      _entries.add(_MediaEntry(
        key: (_nextKey++).toString(),
        isVideo: false,
        publicUrl: url,
      ));
    }
    for (final url in widget.initialVideoUrls) {
      _entries.add(_MediaEntry(
        key: (_nextKey++).toString(),
        isVideo: true,
        publicUrl: url,
      ));
    }
  }

  int get _photoCount => _entries.where((e) => !e.isVideo).length;
  int get _videoCount => _entries.where((e) => e.isVideo).length;

  List<String> get _uploadedPhotoUrls => _entries
      .where((e) => !e.isVideo && e.publicUrl != null)
      .map((e) => e.publicUrl!)
      .toList();

  List<String> get _uploadedVideoUrls => _entries
      .where((e) => e.isVideo && e.publicUrl != null)
      .map((e) => e.publicUrl!)
      .toList();

  /// True while any entry is still uploading or has failed — used to gate the
  /// host screen's submit so failed/pending media can't be silently dropped.
  bool get _hasUnfinishedUploads =>
      _entries.any((e) => e.isUploading || e.hasError);

  void _notifyListeners() {
    widget.onUrlsChanged(_uploadedPhotoUrls);
    widget.onVideoUrlsChanged?.call(_uploadedVideoUrls);
    widget.onPendingChanged?.call(_hasUnfinishedUploads);
  }

  Future<void> _pickMedia() async {
    final photosRemaining = widget.maxPhotos - _photoCount;
    final videosRemaining = widget.maxVideos - _videoCount;
    if (photosRemaining <= 0 && videosRemaining <= 0) return;

    final action = await showModalBottomSheet<_PickAction>(
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
              if (photosRemaining > 0)
                ListTile(
                  leading: const Icon(Icons.camera_alt_outlined),
                  title: const Text('Take Photo'),
                  onTap: () => Navigator.pop(ctx, _PickAction.takePhoto),
                ),
              if (videosRemaining > 0)
                ListTile(
                  leading: const Icon(Icons.videocam_outlined),
                  title: const Text('Take Video'),
                  onTap: () => Navigator.pop(ctx, _PickAction.takeVideo),
                ),
              ListTile(
                leading: const Icon(Icons.perm_media_outlined),
                title: const Text('Choose Photo/Video from Gallery'),
                onTap: () => Navigator.pop(ctx, _PickAction.chooseFromGallery),
              ),
            ],
          ),
        ),
      ),
    );

    if (action == null || !mounted) return;

    switch (action) {
      case _PickAction.takePhoto:
        await _takePhoto();
        break;
      case _PickAction.takeVideo:
        await _recordVideo();
        break;
      case _PickAction.chooseFromGallery:
        await _pickFromGallery();
        break;
    }
  }

  /// Capture a single photo with the camera (image_picker) and add it.
  Future<void> _takePhoto() async {
    final xFile = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 85,
    );
    if (xFile == null || !mounted) return;
    await _ingestPhoto(File(xFile.path));
  }

  /// Open the combined photo + video gallery picker, pre-selecting the gallery
  /// items already in the grid (numbered badges), with the per-type caps and a
  /// split counter. The returned list is the full, authoritative gallery
  /// selection — we reconcile it against current entries (add new, drop
  /// deselected). Camera captures / pre-populated URLs aren't gallery assets, so
  /// they're untouched; the per-type caps passed in account for the slots they
  /// already occupy.
  Future<void> _pickFromGallery() async {
    final selected =
        _entries.where((e) => e.asset != null).map((e) => e.asset!).toList();
    final nonAssetPhotos =
        _photoCount - selected.where((a) => a.type != AssetType.video).length;
    final nonAssetVideos =
        _videoCount - selected.where((a) => a.type == AssetType.video).length;

    final result = await pickNumberedMedia(
      context,
      selectedAssets: selected,
      maxPhotos: widget.maxPhotos - nonAssetPhotos,
      maxVideos: widget.maxVideos - nonAssetVideos,
      themeColor: AppColors.primary,
    );
    if (result == null || !mounted) return; // cancelled — leave grid untouched

    await _reconcileGallerySelection(result);
  }

  /// Apply the picker's new (mixed photo + video) selection: remove gallery
  /// entries whose asset was deselected, then ingest assets that weren't in the
  /// grid before. Media type is derived per-asset from [AssetEntity.type].
  Future<void> _reconcileGallerySelection(List<AssetEntity> selection) async {
    final selectedIds = selection.map((a) => a.id).toSet();

    final removedKeys = _entries
        .where((e) => e.asset != null && !selectedIds.contains(e.asset!.id))
        .map((e) => e.key)
        .toList();
    for (final key in removedKeys) {
      _removeEntry(key);
    }

    final existingIds =
        _entries.where((e) => e.asset != null).map((e) => e.asset!.id).toSet();
    for (final asset in selection) {
      if (existingIds.contains(asset.id)) continue;
      if (!mounted) return;
      await _ingestGalleryAsset(asset, isVideo: asset.type == AssetType.video);
    }
  }

  /// Resolve a gallery [asset] to a file and ingest. Photos are compressed to
  /// match the camera path; videos are taken as-is.
  Future<void> _ingestGalleryAsset(AssetEntity asset,
      {required bool isVideo}) async {
    final origin = await asset.file; // may download from iCloud
    if (origin == null) {
      _showSnack('Couldn\'t load a selected ${isVideo ? 'video' : 'photo'}');
      return;
    }
    if (isVideo) {
      await _ingestVideo(origin, asset: asset);
    } else {
      final file = await _compressImage(origin) ?? origin;
      await _ingestPhoto(file, asset: asset);
    }
  }

  /// Shared photo intake: size-check, hash-dedup, then add + upload.
  Future<void> _ingestPhoto(File file, {AssetEntity? asset}) async {
    if (!await _withinSizeLimit(file, widget.maxFileSizeMb)) return;
    if (!mounted) return;

    final bytes = await file.readAsBytes();
    final hash = sha256.convert(bytes).toString();
    if (_seenHashes.contains(hash)) {
      _showSnack('Photo already added');
      return;
    }
    _seenHashes.add(hash);
    _addEntry(file, isVideo: false, contentHash: hash, asset: asset);
  }

  /// Compress to ~1200px / q85 (matching the old image_picker behavior) so
  /// full-resolution library photos don't trip the size limit. Returns null on
  /// failure so the caller falls back to the original file.
  Future<File?> _compressImage(File source) async {
    try {
      final target =
          '${source.parent.path}/cmp_${DateTime.now().microsecondsSinceEpoch}.jpg';
      final result = await FlutterImageCompress.compressAndGetFile(
        source.absolute.path,
        target,
        minWidth: 1200,
        minHeight: 1200,
        quality: 85,
      );
      return result == null ? null : File(result.path);
    } catch (_) {
      return null;
    }
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      duration: const Duration(seconds: 2),
    ));
  }

  /// Record a single video with the camera (image_picker) and add it.
  Future<void> _recordVideo() async {
    final xFile = await _picker.pickVideo(source: ImageSource.camera);
    if (xFile == null || !mounted) return;
    await _ingestVideo(File(xFile.path));
  }

  /// Shared video intake: size-check, then add + upload. Videos aren't
  /// content-hashed (the picker's pre-selection already blocks re-adding the
  /// same asset, and hashing large files is costly).
  Future<void> _ingestVideo(File file, {AssetEntity? asset}) async {
    if (!await _withinSizeLimit(file, widget.maxVideoFileSizeMb)) return;
    if (!mounted) return;
    _addEntry(file, isVideo: true, asset: asset);
  }

  /// Returns true if [file] is within [limitMb]; otherwise shows a snackbar
  /// and returns false.
  Future<bool> _withinSizeLimit(File file, double limitMb) async {
    final sizeBytes = await file.length();
    if (sizeBytes <= limitMb * 1024 * 1024) return true;
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: AppColors.error,
        content: Text(
            '${file.path.split('/').last} exceeds ${limitMb.toInt()} MB.'),
      ));
    }
    return false;
  }

  void _addEntry(File file,
      {required bool isVideo, String? contentHash, AssetEntity? asset}) {
    final key = (_nextKey++).toString();
    setState(() => _entries.add(_MediaEntry(
          key: key,
          file: file,
          isVideo: isVideo,
          isUploading: true,
          contentHash: contentHash,
          asset: asset,
        )));
    _notifyListeners();
    _uploadEntry(key);
  }

  Future<void> _uploadEntry(String key) async {
    try {
      final index = _entries.indexWhere((e) => e.key == key);
      if (index < 0) return;

      final entry = _entries[index];
      if (entry.file == null) return; // pre-populated URL entry — no upload needed

      final result = await ref.read(uploadServiceProvider).uploadFile(
            file: entry.file!,
            category: entry.isVideo ? widget.videoCategory : widget.photoCategory,
            contentHash: entry.contentHash,
          );

      if (!mounted) return;
      setState(() {
        final idx = _entries.indexWhere((e) => e.key == key);
        if (idx >= 0) {
          _entries[idx] = _entries[idx].copyWith(
            publicUrl: result.publicUrl,
            isUploading: false,
          );
        }
      });
      _notifyListeners();
    } catch (error) {
      debugPrint('[PhotoPickerGrid] upload failed: $error');
      if (!mounted) return;
      setState(() {
        final idx = _entries.indexWhere((e) => e.key == key);
        if (idx >= 0) {
          _entries[idx] = _entries[idx].copyWith(isUploading: false, hasError: true);
        }
      });
      _notifyListeners();
    }
  }

  void _retryEntry(String key) {
    setState(() {
      final idx = _entries.indexWhere((e) => e.key == key);
      if (idx >= 0) {
        _entries[idx] = _entries[idx].copyWith(isUploading: true, hasError: false);
      }
    });
    _notifyListeners();
    _uploadEntry(key);
  }

  void _removeEntry(String key) {
    setState(() {
      final idx = _entries.indexWhere((e) => e.key == key);
      if (idx >= 0) {
        final hash = _entries[idx].contentHash;
        if (hash != null) _seenHashes.remove(hash);
        _entries.removeAt(idx);
      }
    });
    _notifyListeners();
  }

  @override
  Widget build(BuildContext context) {
    final atCapacity =
        _photoCount >= widget.maxPhotos && _videoCount >= widget.maxVideos;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final entry in _entries) _buildMediaTile(entry),
        if (!atCapacity) _buildAddTile(),
      ],
    );
  }

  Widget _buildMediaTile(_MediaEntry entry) {
    return SizedBox(
      width: 80,
      height: 80,
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: entry.isVideo
                ? _buildVideoThumb()
                : entry.file != null
                    ? Image.file(
                        entry.file!,
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                      )
                    : Image.network(
                        entry.publicUrl!,
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _buildBrokenImageThumb(),
                      ),
          ),
          if (entry.isUploading)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Center(
                  child: SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation(Colors.white),
                    ),
                  ),
                ),
              ),
            ),
          if (!entry.isUploading && entry.hasError)
            Positioned.fill(
              child: GestureDetector(
                onTap: () => _retryEntry(entry.key),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.75),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.refresh, color: Colors.white, size: 20),
                      SizedBox(height: 2),
                      Text(
                        'Retry',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          if (!entry.isUploading)
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: () => _removeEntry(entry.key),
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close, size: 12, color: Colors.white),
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// Play-icon placeholder tile for a picked video (no thumbnail decode).
  Widget _buildVideoThumb() {
    return Container(
      width: 80,
      height: 80,
      color: Colors.black87,
      child: const Center(
        child: Icon(Icons.play_circle_outline, color: Colors.white, size: 30),
      ),
    );
  }

  Widget _buildBrokenImageThumb() {
    return Container(
      width: 80,
      height: 80,
      color: AppColors.surfaceVariant,
      child: const Icon(Icons.broken_image_outlined, color: AppColors.greyMedium),
    );
  }

  Widget _buildAddTile() {
    return GestureDetector(
      onTap: _pickMedia,
      child: Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.perm_media_outlined,
                size: 24, color: AppColors.primary),
            const SizedBox(height: 4),
            Text(
              'Add Photo / Video',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
