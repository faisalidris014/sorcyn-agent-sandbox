/// Client-side fee calculator for display purposes.
/// Mirrors backend/src/common/utils/fees.ts logic.
/// Actual fees are computed server-side on the transaction.
class FeeBreakdown {
  final double quoteAmount;
  final double shippingCost;
  final double buyerFee;
  final double stripeFee;
  final double totalCharged;
  final double platformFeePercentage;

  const FeeBreakdown({
    required this.quoteAmount,
    required this.shippingCost,
    required this.buyerFee,
    required this.stripeFee,
    required this.totalCharged,
    required this.platformFeePercentage,
  });

  bool get isFree => buyerFee == 0 && stripeFee == 0;
}

double _round(double n) => (n * 100).roundToDouble() / 100;

FeeBreakdown calculateBuyerFees(
  String transactionType,
  double quoteAmount, {
  double shippingCost = 0,
}) {
  switch (transactionType) {
    case 'service':
    case 'job_milestone':
      final buyerFee = _round(quoteAmount * 0.05);
      final subtotal = _round(quoteAmount + buyerFee);
      final stripeFee = _round(subtotal * 0.029 + 0.30);
      final totalCharged = _round(subtotal + stripeFee);
      return FeeBreakdown(
        quoteAmount: quoteAmount,
        shippingCost: 0,
        buyerFee: buyerFee,
        stripeFee: stripeFee,
        totalCharged: totalCharged,
        platformFeePercentage: 5,
      );

    case 'product_shipped':
      final base = quoteAmount + shippingCost;
      final buyerFee = _round(base * 0.05);
      final subtotal = _round(base * 1.05);
      final stripeFee = _round(subtotal * 0.029 + 0.30);
      final totalCharged = _round(subtotal + stripeFee);
      return FeeBreakdown(
        quoteAmount: quoteAmount,
        shippingCost: shippingCost,
        buyerFee: buyerFee,
        stripeFee: stripeFee,
        totalCharged: totalCharged,
        platformFeePercentage: 5,
      );

    case 'product_local_cash':
      return FeeBreakdown(
        quoteAmount: quoteAmount,
        shippingCost: 0,
        buyerFee: 0,
        stripeFee: 0,
        totalCharged: quoteAmount,
        platformFeePercentage: 0,
      );

    case 'product_local_platform':
      final buyerFee = _round(quoteAmount * 0.05);
      final subtotal = _round(quoteAmount + buyerFee);
      final stripeFee = _round(subtotal * 0.029 + 0.30);
      final totalCharged = _round(subtotal + stripeFee);
      return FeeBreakdown(
        quoteAmount: quoteAmount,
        shippingCost: 0,
        buyerFee: buyerFee,
        stripeFee: stripeFee,
        totalCharged: totalCharged,
        platformFeePercentage: 5,
      );

    case 'inventory':
      final buyerFee = _round(quoteAmount * 0.03);
      final subtotal = _round(quoteAmount * 1.03);
      final stripeFee = _round(subtotal * 0.029 + 0.30);
      final totalCharged = _round(subtotal + stripeFee);
      return FeeBreakdown(
        quoteAmount: quoteAmount,
        shippingCost: 0,
        buyerFee: buyerFee,
        stripeFee: stripeFee,
        totalCharged: totalCharged,
        platformFeePercentage: 3,
      );

    default:
      // Fallback: 5% buyer fee
      final buyerFee = _round(quoteAmount * 0.05);
      final subtotal = _round(quoteAmount + buyerFee);
      final stripeFee = _round(subtotal * 0.029 + 0.30);
      final totalCharged = _round(subtotal + stripeFee);
      return FeeBreakdown(
        quoteAmount: quoteAmount,
        shippingCost: 0,
        buyerFee: buyerFee,
        stripeFee: stripeFee,
        totalCharged: totalCharged,
        platformFeePercentage: 5,
      );
  }
}
