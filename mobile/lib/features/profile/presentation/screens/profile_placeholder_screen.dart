import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';

class ProfilePlaceholderScreen extends ConsumerWidget {
  const ProfilePlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User info card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: AppColors.primarySurface,
                    child: Text(
                      user != null
                          ? '${user.firstName[0]}${user.lastName[0]}'
                          : '?',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.fullName ?? 'User',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user?.email ?? '',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Coming soon
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                children: [
                  Icon(Icons.construction, size: 48, color: AppColors.greyMedium),
                  SizedBox(height: 12),
                  Text(
                    'Profile Settings Coming Soon',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.black,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Edit profile, manage settings, and more.',
                    style: TextStyle(fontSize: 14, color: AppColors.grey),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Logout
          OutlinedButton.icon(
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout, color: AppColors.error),
            label: const Text(
              'Log Out',
              style: TextStyle(color: AppColors.error),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.error),
              minimumSize: const Size.fromHeight(48),
            ),
          ),
        ],
      ),
    );
  }
}
