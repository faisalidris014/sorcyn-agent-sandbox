// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment_intent_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PaymentIntentResult _$PaymentIntentResultFromJson(Map<String, dynamic> json) =>
    PaymentIntentResult(
      clientSecret: json['clientSecret'] as String,
      paymentIntentId: json['paymentIntentId'] as String,
    );

Map<String, dynamic> _$PaymentIntentResultToJson(
  PaymentIntentResult instance,
) => <String, dynamic>{
  'clientSecret': instance.clientSecret,
  'paymentIntentId': instance.paymentIntentId,
};
