import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/validators.dart';
import '../../../../shared/widgets/app_input_field.dart';
import '../../../../shared/widgets/app_logo.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/social_auth_button.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _rememberMe = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      await ref.read(authProvider.notifier).login(
            email: _emailController.text.trim(),
            password: _passwordController.text,
            rememberMe: _rememberMe,
          );
      // Router redirect handles navigation
    } catch (_) {
      if (mounted) {
        final error = ref.read(authProvider).error;
        if (error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(error),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),

                // Logo
                const Center(child: AppLogo(size: 72)),
                const SizedBox(height: 32),

                // Heading
                Text(
                  'Welcome Back',
                  style: GoogleFonts.inter(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: AppColors.black,
                    letterSpacing: -0.56,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Sign in to continue your momentum',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    color: AppColors.grey,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 32),

                // Email field
                AppInputField(
                  controller: _emailController,
                  label: 'Email Address',
                  hint: 'you@example.com',
                  prefixIcon: Icons.mail_outline_rounded,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  validator: Validators.email,
                ),
                const SizedBox(height: 16),

                // Password field
                AppInputField(
                  controller: _passwordController,
                  label: 'Password',
                  hint: '••••••••',
                  prefixIcon: Icons.lock_outline_rounded,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  validator: (v) => Validators.required(v, 'Password'),
                  suffixWidget: GestureDetector(
                    onTap: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                    child: Icon(
                      _obscurePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      size: 20,
                      color: AppColors.greyMedium,
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Remember me + Forgot password
                Row(
                  children: [
                    GestureDetector(
                      onTap: () =>
                          setState(() => _rememberMe = !_rememberMe),
                      child: Row(
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              color: _rememberMe
                                  ? AppColors.primary
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: _rememberMe
                                    ? AppColors.primary
                                    : AppColors.greyMedium,
                                width: 1.5,
                              ),
                            ),
                            child: _rememberMe
                                ? const Icon(Icons.check,
                                    size: 13, color: Colors.white)
                                : null,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Remember me',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: const Color(0xFF4B5563),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => context.push('/auth/forgot-password'),
                      child: Text(
                        'Forgot Password?',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Sign In Button
                GradientButton(
                  text: 'Sign In',
                  onPressed: _handleLogin,
                  isLoading: authState.isLoading,
                ),
                const SizedBox(height: 32),

                // Divider
                Row(
                  children: [
                    const Expanded(
                      child: Divider(color: AppColors.border, height: 1),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        'or continue with',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.greyMedium,
                        ),
                      ),
                    ),
                    const Expanded(
                      child: Divider(color: AppColors.border, height: 1),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Social buttons
                Row(
                  children: [
                    Expanded(
                      child: SocialAuthButton(
                        provider: SocialProvider.google,
                        onPressed: () {
                          // TODO: Google sign-in
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SocialAuthButton(
                        provider: SocialProvider.apple,
                        onPressed: () {
                          // TODO: Apple sign-in
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Sign up prompt
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Don't have an account? ",
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppColors.grey,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.push('/register'),
                      child: Text(
                        'Sign Up',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
