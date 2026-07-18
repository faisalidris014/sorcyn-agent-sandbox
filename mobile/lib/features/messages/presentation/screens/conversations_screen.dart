import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../data/models/conversation_model.dart';
import '../../providers/conversations_provider.dart';
import '../widgets/conversation_tile.dart';

class ConversationsScreen extends ConsumerStatefulWidget {
  const ConversationsScreen({super.key});

  @override
  ConsumerState<ConversationsScreen> createState() =>
      _ConversationsScreenState();
}

class _ConversationsScreenState extends ConsumerState<ConversationsScreen> {
  final _scrollController = ScrollController();
  String _activeFilter = 'all';
  final _searchController = TextEditingController();
  ConversationsNotifier? _conversationsNotifier;

  // Edit / multi-select mode
  bool _editMode = false;
  final Set<String> _selected = {};

  static const _filters = [
    ('all', 'All'),
    ('unread', 'Unread'),
    ('buyers', 'Buyers'),
    ('sellers', 'Sellers'),
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _conversationsNotifier = ref.read(conversationsProvider.notifier);
      _conversationsNotifier!.loadConversations();
      _conversationsNotifier!.startSocketListening();
      _conversationsNotifier!.startPolling();
    });
  }

  @override
  void dispose() {
    _conversationsNotifier?.stopPolling();
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(conversationsProvider.notifier).loadMore();
    }
  }

  // ── Edit-mode helpers ──

  void _enterEditMode([String? initialId]) {
    setState(() {
      _editMode = true;
      _selected.clear();
      if (initialId != null) _selected.add(initialId);
    });
  }

  void _exitEditMode() {
    setState(() {
      _editMode = false;
      _selected.clear();
    });
  }

  void _toggleSelected(String id) {
    setState(() {
      if (!_selected.add(id)) _selected.remove(id);
    });
  }

  void _toggleSelectAll(List<dynamic> visible) {
    setState(() {
      final ids = visible.map((c) => c.id as String).toSet();
      final allSelected = _selected.containsAll(ids) && ids.isNotEmpty;
      _selected
        ..clear()
        ..addAll(allSelected ? <String>{} : ids);
    });
  }

  Future<void> _applyBulk(String action) async {
    final notifier = ref.read(conversationsProvider.notifier);
    final ids = Set<String>.from(_selected);
    if (ids.isEmpty) return;

    if (action == 'delete') {
      final confirmed = await _confirmDelete(ids.length);
      if (confirmed != true) return;
      await notifier.deleteConversations(ids);
    } else if (action == 'read') {
      await notifier.markConversationsRead(ids);
    } else if (action == 'unread') {
      await notifier.markConversationsUnread(ids);
    }
    if (mounted) _exitEditMode();
  }

  Future<bool?> _confirmDelete(int count) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete $count ${count == 1 ? 'conversation' : 'conversations'}?'),
        content: const Text(
            'They will be removed from your inbox. The other person keeps their copy, and a new message will bring the chat back.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(conversationsProvider);
    final unreadCount =
        state.conversations.where((c) => c.hasUnread).length;
    final visible = _filteredConversations(state);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(unreadCount, visible),
            const SizedBox(height: 8),
            _buildSearchBar(),
            const SizedBox(height: 10),
            const Divider(height: 1, color: AppColors.greyLight),

            // Conversation list
            Expanded(
              child: state.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : state.error != null
                      ? _buildError(state.error!)
                      : visible.isEmpty
                          ? _buildEmptyState(state.conversations.isNotEmpty)
                          : RefreshIndicator(
                              onRefresh: () => ref
                                  .read(conversationsProvider.notifier)
                                  .loadConversations(refresh: true),
                              child: ListView.separated(
                                controller: _scrollController,
                                itemCount:
                                    visible.length + (state.isLoadingMore ? 1 : 0),
                                separatorBuilder: (_, _) => Padding(
                                  padding:
                                      const EdgeInsets.only(left: 82, right: 18),
                                  child: Divider(
                                    height: 1,
                                    color: AppColors.border
                                        .withValues(alpha: 0.5),
                                  ),
                                ),
                                itemBuilder: (context, index) {
                                  if (index == visible.length) {
                                    return const Padding(
                                      padding: EdgeInsets.all(16),
                                      child: Center(
                                          child: CircularProgressIndicator()),
                                    );
                                  }
                                  final conversation = visible[index];
                                  final selected =
                                      _selected.contains(conversation.id);
                                  return ConversationTile(
                                    conversation: conversation,
                                    editMode: _editMode,
                                    selected: selected,
                                    onLongPress: () =>
                                        _enterEditMode(conversation.id),
                                    onTap: () {
                                      if (_editMode) {
                                        _toggleSelected(conversation.id);
                                      } else {
                                        context.push('/chat/${conversation.id}');
                                      }
                                    },
                                  );
                                },
                              ),
                            ),
            ),

            // Edit-mode action bar
            if (_editMode) _buildSelectionBar(),
          ],
        ),
      ),
    );
  }

  // ── Header ──

  Widget _buildHeader(int unreadCount, List<dynamic> visible) {
    if (_editMode) {
      final allSelected = visible.isNotEmpty &&
          _selected.containsAll(visible.map((c) => c.id as String));
      return Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: Row(
          children: [
            SizedBox(
              width: 84,
              child: GestureDetector(
                onTap: () => _toggleSelectAll(visible),
                child: Text(
                  allSelected ? 'Deselect all' : 'Select all',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
            Expanded(
              child: Text(
                _selected.isEmpty ? 'Select' : '${_selected.length} selected',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.black,
                ),
              ),
            ),
            SizedBox(
              width: 84,
              child: GestureDetector(
                onTap: _exitEditMode,
                child: const Text(
                  'Done',
                  textAlign: TextAlign.right,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          SizedBox(
            width: 64,
            child: GestureDetector(
              onTap: () => _enterEditMode(),
              child: const Text(
                'Edit',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
          const Expanded(
            child: Text(
              'Messages',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.black,
                letterSpacing: -0.3,
              ),
            ),
          ),
          SizedBox(
            width: 64,
            child: Align(
              alignment: Alignment.centerRight,
              child: _buildFilterButton(unreadCount),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterButton(int unreadCount) {
    final hasActiveFilter = _activeFilter != 'all';
    return PopupMenuButton<String>(
      tooltip: 'Filter',
      offset: const Offset(0, 44),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      onSelected: (key) {
        setState(() => _activeFilter = key);
        ref.read(conversationsProvider.notifier).setStatusFilter(null);
      },
      itemBuilder: (context) => _filters.map((f) {
        final (key, label) = f;
        final active = _activeFilter == key;
        return PopupMenuItem<String>(
          value: key,
          child: Row(
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                  color: active ? AppColors.primary : AppColors.black,
                ),
              ),
              if (key == 'unread' && unreadCount > 0) ...[
                const SizedBox(width: 6),
                Text('$unreadCount',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.greyMedium)),
              ],
              const Spacer(),
              if (active)
                const Icon(Icons.check, size: 16, color: AppColors.primary),
            ],
          ),
        );
      }).toList(),
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(11),
          color: AppColors.surfaceVariant,
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(Icons.tune_rounded, size: 19, color: AppColors.black),
            if (hasActiveFilter)
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.primary,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ── Search (always visible, purple outline) ──

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: TextField(
        controller: _searchController,
        style: const TextStyle(fontSize: 14.5, color: AppColors.black),
        onChanged: (_) => setState(() {}),
        decoration: InputDecoration(
          hintText: 'Search conversations...',
          hintStyle:
              const TextStyle(fontSize: 14.5, color: AppColors.greyMedium),
          prefixIcon:
              const Icon(Icons.search, size: 19, color: AppColors.greyMedium),
          suffixIcon: _searchController.text.isNotEmpty
              ? GestureDetector(
                  onTap: () {
                    _searchController.clear();
                    setState(() {});
                  },
                  child: const Icon(Icons.clear,
                      size: 17, color: AppColors.grey),
                )
              : null,
          filled: true,
          fillColor: Colors.white,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.8),
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          isDense: true,
        ),
      ),
    );
  }

  // ── Edit-mode bottom action bar ──

  Widget _buildSelectionBar() {
    final enabled = _selected.isNotEmpty;
    return Material(
      elevation: 8,
      color: Colors.white,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _selAction(
                icon: Icons.mark_email_read_outlined,
                label: 'Mark read',
                enabled: enabled,
                onTap: () => _applyBulk('read'),
              ),
              _selAction(
                icon: Icons.mark_email_unread_outlined,
                label: 'Mark unread',
                enabled: enabled,
                onTap: () => _applyBulk('unread'),
              ),
              _selAction(
                icon: Icons.delete_outline,
                label: 'Delete',
                enabled: enabled,
                danger: true,
                onTap: () => _applyBulk('delete'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _selAction({
    required IconData icon,
    required String label,
    required bool enabled,
    required VoidCallback onTap,
    bool danger = false,
  }) {
    final color = !enabled
        ? AppColors.greyMedium
        : danger
            ? AppColors.error
            : AppColors.black;
    return Expanded(
      child: GestureDetector(
        onTap: enabled ? onTap : null,
        behavior: HitTestBehavior.opaque,
        child: Opacity(
          opacity: enabled ? 1 : 0.5,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 22, color: color),
              const SizedBox(height: 4),
              Text(label,
                  style: TextStyle(
                      fontSize: 11, fontWeight: FontWeight.w600, color: color)),
            ],
          ),
        ),
      ),
    );
  }

  List<Conversation> _filteredConversations(ConversationsState state) {
    var convos = state.conversations.toList();

    if (_searchController.text.isNotEmpty) {
      final query = _searchController.text.toLowerCase();
      convos = convos
          .where((c) =>
              c.otherParticipant.fullName.toLowerCase().contains(query) ||
              (c.lastMessage?.text.toLowerCase().contains(query) ?? false))
          .toList();
    }

    switch (_activeFilter) {
      case 'unread':
        convos = convos.where((c) => c.hasUnread).toList();
        break;
      case 'buyers':
        convos = convos.where((c) => c.otherRole == 'buyer').toList();
        break;
      case 'sellers':
        convos = convos.where((c) => c.otherRole == 'seller').toList();
        break;
    }

    return convos;
  }

  /// [hasConversations] is true when the user has threads that are simply
  /// filtered/searched out — distinguishes "nothing here" from "no matches".
  Widget _buildEmptyState(bool hasConversations) {
    final searching = _searchController.text.isNotEmpty;
    final filtering = _activeFilter != 'all';
    final filteredOut = hasConversations && (searching || filtering);

    String title;
    String subtitle;
    IconData icon;
    if (searching) {
      icon = Icons.search_off;
      title = 'No matches';
      subtitle = 'Try a different name or keyword.';
    } else if (filteredOut) {
      final label = _filters.firstWhere((f) => f.$1 == _activeFilter).$2;
      icon = Icons.filter_alt_off_outlined;
      title = 'No $label conversations';
      subtitle = 'Nothing matches this filter right now. Tap Filter to switch back to All.';
    } else {
      icon = Icons.chat_bubble_outline;
      title = 'No messages yet';
      subtitle = 'Your conversations with buyers and sellers will appear here.';
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.08),
              ),
              child: Icon(icon, size: 28, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.black,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.grey,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            if (filteredOut) ...[
              const SizedBox(height: 16),
              GestureDetector(
                onTap: () {
                  setState(() {
                    _activeFilter = 'all';
                    _searchController.clear();
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 9),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    'Show all',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildError(String error) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(error,
              style: const TextStyle(fontSize: 14, color: AppColors.grey)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => ref
                .read(conversationsProvider.notifier)
                .loadConversations(refresh: true),
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Retry',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
