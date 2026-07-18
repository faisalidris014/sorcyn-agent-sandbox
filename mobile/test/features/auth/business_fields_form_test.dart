// Widget tests for the BusinessFieldsForm shared widget.
//
// Verifies that the form renders all four required fields (EIN, business
// name, business type dropdown, sales-tax certificate upload tile) and that
// the EIN validator rejects malformed input and accepts XX-XXXXXXX format.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:reverse_marketplace/features/auth/presentation/widgets/business_fields_form.dart';

Widget _harness({
  required TextEditingController einController,
  required TextEditingController businessNameController,
  required GlobalKey<FormState> formKey,
  String? businessType,
  String? salesTaxCertificateUrl,
}) {
  String? bt = businessType;
  String? cert = salesTaxCertificateUrl;
  return ProviderScope(
    child: MaterialApp(
      home: Scaffold(
        body: StatefulBuilder(
          builder: (context, setState) => SingleChildScrollView(
            child: Form(
              key: formKey,
              child: BusinessFieldsForm(
                einController: einController,
                businessNameController: businessNameController,
                businessType: bt,
                onBusinessTypeChanged: (v) => setState(() => bt = v),
                salesTaxCertificateUrl: cert,
                onSalesTaxCertificateChanged: (v) => setState(() => cert = v),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  testWidgets('renders EIN, business name, business type, and cert upload',
      (tester) async {
    final ein = TextEditingController();
    final name = TextEditingController();
    final formKey = GlobalKey<FormState>();
    await tester.pumpWidget(_harness(
      einController: ein,
      businessNameController: name,
      formKey: formKey,
    ));
    await tester.pumpAndSettle();

    expect(find.text('EIN (Employer ID)'), findsOneWidget);
    expect(find.text('Business Name'), findsOneWidget);
    expect(find.text('Business Type'), findsOneWidget);
    expect(find.text('Sales Tax Certificate'), findsOneWidget);
    expect(
      find.text('Upload sales tax certificate (image)'),
      findsOneWidget,
    );

    ein.dispose();
    name.dispose();
  });

  testWidgets('EIN validator rejects empty and malformed values',
      (tester) async {
    final ein = TextEditingController(text: '1234');
    final name = TextEditingController(text: 'X');
    final formKey = GlobalKey<FormState>();
    await tester.pumpWidget(_harness(
      einController: ein,
      businessNameController: name,
      formKey: formKey,
    ));
    await tester.pumpAndSettle();

    final isValid = formKey.currentState!.validate();
    await tester.pump();
    expect(isValid, isFalse,
        reason: 'Malformed EIN + missing business type should fail validation');
    expect(find.text('EIN must be XX-XXXXXXX'), findsOneWidget);
    expect(find.text('Business type is required'), findsOneWidget);

    ein.dispose();
    name.dispose();
  });

  testWidgets(
      'deferred mode shows selected filename instead of upload prompt',
      (tester) async {
    final ein = TextEditingController();
    final name = TextEditingController();
    final formKey = GlobalKey<FormState>();
    await tester.pumpWidget(ProviderScope(
      child: MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: BusinessFieldsForm(
                einController: ein,
                businessNameController: name,
                businessType: 'llc',
                onBusinessTypeChanged: (_) {},
                salesTaxCertificateUrl: null,
                onSalesTaxCertificateChanged: (_) {},
                // Registration mode: cert picked locally, uploaded post-auth.
                onCertFilePicked: (_) {},
                selectedCertName: 'cert.png',
              ),
            ),
          ),
        ),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.text('Selected: cert.png — tap to replace'), findsOneWidget);
    expect(find.text('Upload sales tax certificate (image)'), findsNothing);
    // The "required" helper hint disappears once a cert is selected.
    expect(
      find.text('A sales-tax certificate is required for business accounts.'),
      findsNothing,
    );

    ein.dispose();
    name.dispose();
  });

  testWidgets('EIN validator accepts XX-XXXXXXX format', (tester) async {
    final ein = TextEditingController(text: '12-3456789');
    final name = TextEditingController(text: 'Acme Resale LLC');
    final formKey = GlobalKey<FormState>();
    await tester.pumpWidget(_harness(
      einController: ein,
      businessNameController: name,
      formKey: formKey,
      businessType: 'llc',
      salesTaxCertificateUrl: 'https://r2.example.com/cert.pdf',
    ));
    await tester.pumpAndSettle();

    final isValid = formKey.currentState!.validate();
    expect(isValid, isTrue,
        reason: 'Valid EIN + name + type + cert should pass form validation');

    ein.dispose();
    name.dispose();
  });
}
