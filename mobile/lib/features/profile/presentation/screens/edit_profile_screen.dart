import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/upload_provider.dart';
import '../../../../core/services/image_picker_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/validators.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../../auth/providers/auth_provider.dart';
import '../widgets/change_password_modal.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _firstNameController;
  late final TextEditingController _lastNameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _bioController;
  late final TextEditingController _cityController;
  late final TextEditingController _stateController;
  late final TextEditingController _zipController;
  bool _isSaving = false;
  bool _isUploadingPhoto = false;

  // Focus states
  bool _firstNameFocused = false;
  bool _lastNameFocused = false;
  bool _phoneFocused = false;
  bool _bioFocused = false;
  bool _zipFocused = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _firstNameController = TextEditingController(text: user?.firstName ?? '');
    _lastNameController = TextEditingController(text: user?.lastName ?? '');
    _phoneController = TextEditingController(text: user?.phone ?? '');
    _bioController = TextEditingController(text: user?.bio ?? '');
    _cityController = TextEditingController(text: user?.locationCity ?? '');
    _stateController = TextEditingController(text: user?.locationState ?? '');
    _zipController = TextEditingController(text: user?.locationZip ?? '');
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _bioController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      final data = <String, dynamic>{
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
      };
      if (_phoneController.text.trim().isNotEmpty) {
        data['phone'] = _phoneController.text.trim();
      }
      if (_bioController.text.trim().isNotEmpty) {
        data['bio'] = _bioController.text.trim();
      }
      if (_cityController.text.trim().isNotEmpty) {
        data['locationCity'] = _cityController.text.trim();
      }
      if (_stateController.text.trim().isNotEmpty) {
        data['locationState'] = _stateController.text.trim();
      }
      if (_zipController.text.trim().isNotEmpty) {
        data['locationZip'] = _zipController.text.trim();
      }

      await ref.read(authProvider.notifier).updateProfile(data);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update profile')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _pickAndUploadPhoto() async {
    final file = await ImagePickerService.pickImage(context);
    if (file == null || !mounted) return;

    setState(() => _isUploadingPhoto = true);
    try {
      final uploadService = ref.read(uploadServiceProvider);
      final result = await uploadService.uploadFile(
        file: file,
        category: 'profile-photos',
      );
      await ref.read(authProvider.notifier).updateProfilePhoto(result.publicUrl);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to upload photo')),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingPhoto = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final initials = user != null
        ? '${user.firstName[0]}${user.lastName[0]}'.toUpperCase()
        : '?';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Edit Profile',
        onBack: () => context.pop(),
        actions: [
          GestureDetector(
            onTap: _isSaving ? null : _save,
            child: _isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text(
                    'Save',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              const SizedBox(height: 16),

              // Avatar
              GestureDetector(
                onTap: _isUploadingPhoto ? null : _pickAndUploadPhoto,
                child: Center(
                  child: Stack(
                    children: [
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: AppColors.primaryGradient,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.35),
                            blurRadius: 24,
                            offset: const Offset(0, 8),
                          ),
                        ],
                        image: user?.profilePhotoUrl != null
                            ? DecorationImage(
                                image: NetworkImage(user!.profilePhotoUrl!),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: user?.profilePhotoUrl == null
                          ? Center(
                              child: Text(
                                initials,
                                style: const TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                  letterSpacing: -0.64,
                                ),
                              ),
                            )
                          : null,
                    ),
                    // Camera button
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.primaryGradient,
                          border:
                              Border.all(color: Colors.white, width: 2.5),
                          boxShadow: [
                            BoxShadow(
                              color:
                                  AppColors.primary.withValues(alpha: 0.4),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.camera_alt,
                          size: 13,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Tap to change photo',
                style: TextStyle(fontSize: 12, color: AppColors.greyMedium),
              ),
              const SizedBox(height: 24),

              // Name row
              Row(
                children: [
                  Expanded(
                    child: _buildField(
                      label: 'First Name',
                      controller: _firstNameController,
                      focused: _firstNameFocused,
                      onFocusChange: (f) =>
                          setState(() => _firstNameFocused = f),
                      icon: Icons.person_outline,
                      validator: (v) => Validators.name(v, 'First name'),
                      capitalization: TextCapitalization.words,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildField(
                      label: 'Last Name',
                      controller: _lastNameController,
                      focused: _lastNameFocused,
                      onFocusChange: (f) =>
                          setState(() => _lastNameFocused = f),
                      icon: Icons.person_outline,
                      validator: (v) => Validators.name(v, 'Last name'),
                      capitalization: TextCapitalization.words,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Email (read-only)
              _buildField(
                label: 'Email',
                controller: TextEditingController(
                    text: user?.email ?? ''),
                focused: false,
                onFocusChange: (_) {},
                icon: Icons.email_outlined,
                readOnly: true,
                suffixIcon: Icons.lock_outline,
              ),
              const SizedBox(height: 16),

              // Phone
              _buildField(
                label: 'Phone',
                controller: _phoneController,
                focused: _phoneFocused,
                onFocusChange: (f) => setState(() => _phoneFocused = f),
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                hint: '(555) 123-4567',
              ),
              const SizedBox(height: 16),

              // ZIP Code
              _buildField(
                label: 'ZIP Code',
                controller: _zipController,
                focused: _zipFocused,
                onFocusChange: (f) => setState(() => _zipFocused = f),
                icon: Icons.location_on_outlined,
                keyboardType: TextInputType.number,
                validator: Validators.zip,
                hint: '75001',
              ),
              const SizedBox(height: 16),

              // Bio
              _buildTextArea(
                label: 'Bio',
                controller: _bioController,
                focused: _bioFocused,
                onFocusChange: (f) => setState(() => _bioFocused = f),
                maxLength: 500,
                hint: 'Tell us about yourself...',
              ),
              const SizedBox(height: 20),

              // Change Password link
              GestureDetector(
                onTap: () => showChangePasswordModal(context),
                child: Container(
                  width: double.infinity,
                  height: 48,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.2),
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.vpn_key_outlined,
                          size: 16, color: AppColors.primary),
                      SizedBox(width: 8),
                      Text(
                        'Change Password',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(Icons.chevron_right,
                          size: 18, color: AppColors.primary),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField({
    required String label,
    required TextEditingController controller,
    required bool focused,
    required ValueChanged<bool> onFocusChange,
    required IconData icon,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    TextCapitalization capitalization = TextCapitalization.none,
    bool readOnly = false,
    IconData? suffixIcon,
    String? hint,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.black,
          ),
        ),
        const SizedBox(height: 8),
        Focus(
          onFocusChange: readOnly ? null : onFocusChange,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            height: 52,
            decoration: BoxDecoration(
              color: readOnly
                  ? AppColors.greyLight
                  : focused
                      ? AppColors.primary.withValues(alpha: 0.03)
                      : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: focused ? AppColors.primary : AppColors.border,
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                const SizedBox(width: 16),
                Icon(
                  icon,
                  size: 18,
                  color: readOnly
                      ? AppColors.greyMedium
                      : focused
                          ? AppColors.primary
                          : AppColors.greyMedium,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: controller,
                    readOnly: readOnly,
                    validator: validator,
                    keyboardType: keyboardType,
                    textCapitalization: capitalization,
                    style: TextStyle(
                      fontSize: 15,
                      color: readOnly ? AppColors.grey : AppColors.black,
                    ),
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      hintText: hint,
                      hintStyle: const TextStyle(
                        fontSize: 15,
                        color: AppColors.greyMedium,
                      ),
                      contentPadding: EdgeInsets.zero,
                      isDense: true,
                    ),
                  ),
                ),
                if (suffixIcon != null) ...[
                  Icon(suffixIcon, size: 16, color: AppColors.greyMedium),
                  const SizedBox(width: 16),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextArea({
    required String label,
    required TextEditingController controller,
    required bool focused,
    required ValueChanged<bool> onFocusChange,
    required int maxLength,
    String? hint,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.black,
              ),
            ),
            Text(
              '${controller.text.length}/$maxLength',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.greyMedium,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Focus(
          onFocusChange: onFocusChange,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            decoration: BoxDecoration(
              color: focused
                  ? AppColors.primary.withValues(alpha: 0.03)
                  : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: focused ? AppColors.primary : AppColors.border,
                width: 1.5,
              ),
            ),
            child: TextFormField(
              controller: controller,
              maxLines: 4,
              maxLength: maxLength,
              onChanged: (_) => setState(() {}),
              textCapitalization: TextCapitalization.sentences,
              style: const TextStyle(
                fontSize: 15,
                color: AppColors.black,
              ),
              decoration: InputDecoration(
                border: InputBorder.none,
                hintText: hint,
                hintStyle: const TextStyle(
                  fontSize: 15,
                  color: AppColors.greyMedium,
                ),
                contentPadding: const EdgeInsets.all(16),
                counterText: '',
              ),
            ),
          ),
        ),
      ],
    );
  }
}
