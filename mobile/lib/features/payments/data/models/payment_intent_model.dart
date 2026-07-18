import 'package:json_annotation/json_annotation.dart';

part 'payment_intent_model.g.dart';

@JsonSerializable()
class PaymentIntentResult {
  final String clientSecret;
  final String paymentIntentId;

  PaymentIntentResult({
    required this.clientSecret,
    required this.paymentIntentId,
  });

  factory PaymentIntentResult.fromJson(Map<String, dynamic> json) =>
      _$PaymentIntentResultFromJson(json);

  Map<String, dynamic> toJson() => _$PaymentIntentResultToJson(this);
}
