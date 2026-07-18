import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:wechat_assets_picker/wechat_assets_picker.dart';

/// Opens a combined photo + video gallery picker with three customizations
/// over the stock [wechat_assets_picker]:
///
///  1. The selection badge inside the circle shows the **selection number**
///     (1, 2, 3…) instead of a checkmark, and the duplicate top-left number is
///     removed.
///  2. The bottom bar shows a **split counter** — `Photos x/max · Videos y/max`.
///  3. **Per-type caps** are enforced live (max [maxPhotos] photos AND
///     [maxVideos] videos) — the package itself only supports a single total
///     cap, so we enforce sub-caps via a select predicate.
///
/// Returns the full selection (already-added + newly picked), or null if the
/// user cancelled. Pass the assets already in the draft as [selectedAssets] so
/// they appear pre-selected.
///
/// NOTE: This subclasses the package's internal [DefaultAssetPickerBuilderDelegate]
/// and overrides UI methods, so it is coupled to the pinned `wechat_assets_picker`
/// version. Re-verify these overrides when bumping the package.
Future<List<AssetEntity>?> pickNumberedMedia(
  BuildContext context, {
  required List<AssetEntity> selectedAssets,
  required int maxPhotos,
  required int maxVideos,
  required Color themeColor,
}) async {
  // Capture the app locale before the async gap so the picker localizes its
  // built-in labels (Preview/Confirm/etc.) to match the app instead of falling
  // back to the package default (Chinese).
  final locale = Localizations.maybeLocaleOf(context);

  const permissionOption = PermissionRequestOption(
    androidPermission: AndroidPermission(
      type: RequestType.common,
      mediaLocation: false,
    ),
  );
  final ps = await AssetPicker.permissionCheck(requestOption: permissionOption);

  final provider = DefaultAssetPickerProvider(
    maxAssets: maxPhotos + maxVideos,
    selectedAssets: selectedAssets,
    requestType: RequestType.common,
  );

  bool capPredicate(BuildContext _, AssetEntity asset, bool isSelected) {
    if (isSelected) return true; // de-selecting is always allowed
    final pickingVideo = asset.type == AssetType.video;
    final cap = pickingVideo ? maxVideos : maxPhotos;
    final current = provider.selectedAssets
        .where((a) => (a.type == AssetType.video) == pickingVideo)
        .length;
    return current < cap;
  }

  final delegate = _NumberedAssetPickerBuilderDelegate(
    provider: provider,
    initialPermission: ps,
    themeColor: themeColor,
    locale: locale,
    maxPhotos: maxPhotos,
    maxVideos: maxVideos,
    selectPredicate: capPredicate,
  );

  if (!context.mounted) return null;
  return AssetPicker.pickAssetsWithDelegate(
    context,
    delegate: delegate,
    permissionRequestOption: permissionOption,
  );
}

class _NumberedAssetPickerBuilderDelegate
    extends DefaultAssetPickerBuilderDelegate {
  _NumberedAssetPickerBuilderDelegate({
    required super.provider,
    required super.initialPermission,
    required super.themeColor,
    required this.maxPhotos,
    required this.maxVideos,
    super.locale,
    super.selectPredicate,
  });

  final int maxPhotos;
  final int maxVideos;

  /// Selection badge: a numbered circle (selection order) instead of a check.
  @override
  Widget selectIndicator(BuildContext context, int index, AssetEntity asset) {
    final double indicatorSize =
        MediaQuery.sizeOf(context).width / gridCount / 3;
    final Duration duration = switchingPathDuration * 0.75;
    return Selector<DefaultAssetPickerProvider, String>(
      selector: (_, p) => p.selectedDescriptions,
      builder: (context, descriptions, _) {
        final bool selected = descriptions.contains(asset.toString());
        final int selectedNumber = provider.selectedAssets.indexOf(asset) + 1;
        final Widget innerSelector = AnimatedContainer(
          duration: duration,
          width: indicatorSize / (isAppleOS(context) ? 1.25 : 1.5),
          height: indicatorSize / (isAppleOS(context) ? 1.25 : 1.5),
          padding: EdgeInsets.all(indicatorSize / 10),
          decoration: BoxDecoration(
            border: !selected
                ? Border.all(
                    color: Theme.of(context).unselectedWidgetColor,
                    width: indicatorSize / 25,
                  )
                : null,
            color: selected ? themeColor : null,
            shape: BoxShape.circle,
          ),
          child: FittedBox(
            child: AnimatedSwitcher(
              duration: duration,
              reverseDuration: duration,
              child: selected
                  ? Text(
                      '$selectedNumber',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        height: 1,
                      ),
                    )
                  : const SizedBox.shrink(),
            ),
          ),
        );
        final Widget selectorWidget = GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => selectAsset(context, asset, index, selected),
          child: Container(
            margin: EdgeInsets.all(indicatorSize / 4),
            width: isPreviewEnabled ? indicatorSize : null,
            height: isPreviewEnabled ? indicatorSize : null,
            alignment: AlignmentDirectional.topEnd,
            child: (!isPreviewEnabled && isSingleAssetMode && !selected)
                ? const SizedBox.shrink()
                : innerSelector,
          ),
        );
        if (isPreviewEnabled) {
          return PositionedDirectional(top: 0, end: 0, child: selectorWidget);
        }
        return selectorWidget;
      },
    );
  }

  /// Selected overlay: keep the dim, but drop the top-left number (it now lives
  /// in the selection circle).
  @override
  Widget selectedBackdrop(BuildContext context, int index, AssetEntity asset) {
    final double indicatorSize =
        MediaQuery.sizeOf(context).width / gridCount / 3;
    return Positioned.fill(
      child: GestureDetector(
        onTap: isPreviewEnabled ? () => viewAsset(context, index, asset) : null,
        child: Consumer<DefaultAssetPickerProvider>(
          builder: (_, p, _) {
            final bool selected = p.selectedAssets.contains(asset);
            return AnimatedContainer(
              duration: switchingPathDuration,
              padding: EdgeInsets.all(indicatorSize * .35),
              color: selected
                  ? theme.colorScheme.primary.withValues(alpha: .45)
                  : theme.colorScheme.surface.withValues(alpha: .1),
            );
          },
        ),
      ),
    );
  }

  /// Confirm button without the `(n/max)` suffix — the split counter covers it.
  @override
  Widget confirmButton(BuildContext context) {
    return Consumer<DefaultAssetPickerProvider>(
      builder: (_, p, _) {
        final bool allow =
            p.isSelectedNotEmpty || p.previousSelectedAssets.isNotEmpty;
        return MaterialButton(
          minWidth: allow ? 48 : 20,
          height: appBarItemHeight,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          color: theme.colorScheme.secondary,
          disabledColor: theme.splashColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(3)),
          onPressed: allow
              ? () => Navigator.maybeOf(context)?.maybePop(p.selectedAssets)
              : null,
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          child: Text(
            textDelegate.confirm,
            style: TextStyle(
              color: allow
                  ? theme.textTheme.bodyLarge?.color
                  : theme.textTheme.bodySmall?.color,
              fontSize: 17,
            ),
          ),
        );
      },
    );
  }

  /// Bottom bar: preview · split counter · confirm.
  @override
  Widget bottomActionBar(BuildContext context) {
    final double bottomPad = MediaQuery.paddingOf(context).bottom;
    Widget bar = Container(
      height: bottomActionBarHeight + bottomPad,
      padding: const EdgeInsets.symmetric(horizontal: 20)
          .copyWith(bottom: bottomPad),
      color: theme.bottomAppBarTheme.color,
      child: Row(
        children: <Widget>[
          previewButton(context),
          const Spacer(),
          _counter(context),
          const Spacer(),
          confirmButton(context),
        ],
      ),
    );
    if (isAppleOS(context)) {
      bar = ClipRect(
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(
            sigmaX: appleOSBlurRadius,
            sigmaY: appleOSBlurRadius,
          ),
          child: bar,
        ),
      );
    }
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        if (isPermissionLimited) accessLimitedBottomTip(context),
        bar,
      ],
    );
  }

  Widget _counter(BuildContext context) {
    return Consumer<DefaultAssetPickerProvider>(
      builder: (_, p, _) {
        final int photos =
            p.selectedAssets.where((a) => a.type != AssetType.video).length;
        final int videos =
            p.selectedAssets.where((a) => a.type == AssetType.video).length;
        return Text(
          'Photos $photos/$maxPhotos · Videos $videos/$maxVideos',
          style: TextStyle(
            color: theme.textTheme.bodyLarge?.color,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        );
      },
    );
  }
}
