class Validators {
  static final _emailRegex = RegExp(r'^[\w\-.]+@([\w\-]+\.)+[\w\-]{2,}$');
  static final _zipRegex = RegExp(r'^\d{5}(-\d{4})?$');
  static final _uppercaseRegex = RegExp(r'[A-Z]');
  static final _lowercaseRegex = RegExp(r'[a-z]');
  static final _digitRegex = RegExp(r'\d');
  static final _specialCharRegex = RegExp(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]');

  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Email is required';
    }
    if (!_emailRegex.hasMatch(value.trim())) {
      return 'Enter a valid email address';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!_uppercaseRegex.hasMatch(value)) {
      return 'Password must contain an uppercase letter';
    }
    if (!_lowercaseRegex.hasMatch(value)) {
      return 'Password must contain a lowercase letter';
    }
    if (!_digitRegex.hasMatch(value)) {
      return 'Password must contain a number';
    }
    if (!_specialCharRegex.hasMatch(value)) {
      return 'Password must contain a special character';
    }
    return null;
  }

  static String? required(String? value, [String fieldName = 'This field']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  static String? name(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    if (value.trim().length > 100) {
      return '$fieldName must be 100 characters or less';
    }
    return null;
  }

  static String? zip(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Optional field
    }
    if (!_zipRegex.hasMatch(value.trim())) {
      return 'Enter a valid ZIP code (12345 or 12345-6789)';
    }
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Optional field
    }
    if (value.trim().length > 20) {
      return 'Phone number is too long';
    }
    return null;
  }

  static String? confirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != password) {
      return 'Passwords do not match';
    }
    return null;
  }

  /// Returns a score 0-4 for password strength visualization.
  static int passwordStrength(String value) {
    if (value.isEmpty) return 0;
    int score = 0;
    if (value.length >= 8) score++;
    if (_uppercaseRegex.hasMatch(value) && _lowercaseRegex.hasMatch(value)) {
      score++;
    }
    if (_digitRegex.hasMatch(value)) score++;
    if (_specialCharRegex.hasMatch(value)) score++;
    return score;
  }

  Validators._();
}
