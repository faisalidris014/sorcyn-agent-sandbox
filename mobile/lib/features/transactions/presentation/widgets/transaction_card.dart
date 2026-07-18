import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../data/models/transaction_model.dart';

class TransactionCard extends StatelessWidget {
  final Transaction transaction;
  final VoidCallback? onTap;

  const TransactionCard({
    super.key,
    required this.transaction,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title + status
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      transaction.postTitle.isNotEmpty
                          ? transaction.postTitle
                          : 'Transaction',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusBadge(status: transaction.status),
                ],
              ),
              const SizedBox(height: 8),

              // Seller
              Row(
                children: [
                  CircleAvatar(
                    radius: 14,
                    backgroundColor: AppColors.primarySurface,
                    child: Text(
                      transaction.sellerName[0].toUpperCase(),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    transaction.sellerName,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.grey,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Amount + date
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    formatCurrency(transaction.buyerTotal),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  Text(
                    formatRelativeDate(transaction.createdAt),
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.greyMedium,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
