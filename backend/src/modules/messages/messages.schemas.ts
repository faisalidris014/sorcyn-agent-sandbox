import { z } from 'zod';

export const listConversationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  status: z.enum(['active', 'archived', 'closed']).optional().describe('Filter by conversation status'),
});

export const conversationIdParamsSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID').describe('Conversation UUID'),
});

export const postIdParamsSchema = z.object({
  postId: z.string().uuid('Invalid post ID').describe('Post UUID'),
});

export const getConversationMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(100).default(50).describe('Messages per page (max 100)'),
});

export const sendMessageSchema = z.object({
  messageText: z.string().min(1, 'Message cannot be empty').max(2000).describe('Message text (e.g. Hi, I have a question about your offer)'),
  attachments: z.array(z.string().url()).max(5).default([]).describe('Attachment URLs (max 5)'),
});

export const reportConversationSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500).describe('Reason for reporting (min 10 chars)'),
});

export type PostIdParams = z.infer<typeof postIdParamsSchema>;
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
export type GetConversationMessagesQuery = z.infer<typeof getConversationMessagesQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ReportConversationInput = z.infer<typeof reportConversationSchema>;
