import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/upload_service.dart';

final uploadServiceProvider = Provider<UploadService>((ref) => UploadService());
