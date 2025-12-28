# Prompt: Implémenter le système de chat en temps réel dans Flutter

## Contexte

Votre backend API TravelCI a maintenant un système de chat en temps réel complet avec les endpoints suivants :

**Base URL API :** `https://travelci-backend.vercel.app` (ou votre URL locale)

## Endpoints disponibles

### Conversations
- `GET /api/conversations?role=client|owner&page=1&limit=20` - Liste des conversations
- `GET /api/conversations/:id` - Détails d'une conversation
- `POST /api/conversations` - Créer une conversation (body: `{ "booking_id": "uuid" }`)

### Messages
- `GET /api/conversations/:id/messages?page=1&limit=50` - Messages d'une conversation (pagination)
- `POST /api/conversations/:id/messages` - Envoyer un message (body: `{ "content": "texte" }`)
- `PUT /api/messages/:id/read` - Marquer un message comme lu
- `GET /api/conversations/:id/unread-count` - Nombre de messages non lus

### Authentification
Tous les endpoints nécessitent un header :
```
Authorization: Bearer <votre_jwt_token>
```

## Modèles de données

### Conversation
```dart
class Conversation {
  final String id;
  final String bookingId;
  final String clientId;
  final String ownerId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? lastMessageAt;
  
  // Détails supplémentaires (optionnels)
  final UserInfo? client;
  final UserInfo? owner;
  final Message? lastMessage;
  final int? unreadCount;
}

class UserInfo {
  final String id;
  final String fullName;
  final String email;
}
```

### Message
```dart
class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final bool isRead;
  final String messageType; // 'user' or 'system'
  final DateTime createdAt;
  
  // Détails supplémentaires (optionnels)
  final UserInfo? sender;
}
```

**Note**: Les messages de type `system` sont créés automatiquement lors des changements de statut de réservation (acceptée, refusée, annulée, etc.). Ces messages ne doivent pas être affichés comme des messages normaux mais plutôt comme des notifications dans l'interface.

## Structure à implémenter

### 1. Service API (REST)

Créer `lib/services/chat_api_service.dart` :

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/conversation.dart';
import '../models/message.dart';
import '../config/api_config.dart';
import '../services/auth_service.dart';

class ChatApiService {
  final String baseUrl = ApiConfig.baseUrl;
  
  // Récupérer les conversations
  Future<List<Conversation>> getConversations({
    String? role,
    int page = 1,
    int limit = 20,
  }) async {
    final token = await AuthService.getToken();
    final roleParam = role ?? 'client'; // ou déterminer depuis le user role
    
    final uri = Uri.parse('$baseUrl/api/conversations')
        .replace(queryParameters: {
          'role': roleParam,
          'page': page.toString(),
          'limit': limit.toString(),
        });
    
    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> conversationsJson = data['data']['conversations'];
      return conversationsJson
          .map((json) => Conversation.fromJson(json))
          .toList();
    } else {
      throw Exception('Erreur lors de la récupération des conversations');
    }
  }
  
  // Récupérer une conversation par ID
  Future<Conversation> getConversationById(String id) async {
    final token = await AuthService.getToken();
    final uri = Uri.parse('$baseUrl/api/conversations/$id');
    
    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return Conversation.fromJson(data['data']['conversation']);
    } else {
      throw Exception('Erreur lors de la récupération de la conversation');
    }
  }
  
  // Récupérer les messages d'une conversation
  Future<PaginatedMessages> getMessages({
    required String conversationId,
    int page = 1,
    int limit = 50,
  }) async {
    final token = await AuthService.getToken();
    final uri = Uri.parse('$baseUrl/api/conversations/$conversationId/messages')
        .replace(queryParameters: {
          'page': page.toString(),
          'limit': limit.toString(),
        });
    
    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return PaginatedMessages.fromJson(data);
    } else {
      throw Exception('Erreur lors de la récupération des messages');
    }
  }
  
  // Envoyer un message
  Future<Message> sendMessage({
    required String conversationId,
    required String content,
  }) async {
    final token = await AuthService.getToken();
    final uri = Uri.parse('$baseUrl/api/conversations/$conversationId/messages');
    
    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({'content': content}),
    );
    
    if (response.statusCode == 201) {
      final data = json.decode(response.body);
      return Message.fromJson(data['data']['message']);
    } else {
      throw Exception('Erreur lors de l\'envoi du message');
    }
  }
  
  // Marquer un message comme lu
  Future<void> markMessageAsRead(String messageId) async {
    final token = await AuthService.getToken();
    final uri = Uri.parse('$baseUrl/api/messages/$messageId/read');
    
    final response = await http.put(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode != 200) {
      throw Exception('Erreur lors du marquage du message comme lu');
    }
  }
  
  // Récupérer le nombre de messages non lus
  Future<int> getUnreadCount(String conversationId) async {
    final token = await AuthService.getToken();
    final uri = Uri.parse('$baseUrl/api/conversations/$conversationId/unread-count');
    
    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data']['unread_count'] ?? 0;
    } else {
      throw Exception('Erreur lors de la récupération du nombre de messages non lus');
    }
  }
  
  // Créer une conversation
  Future<Conversation> createConversation(String bookingId) async {
    final token = await AuthService.getToken();
    final uri = Uri.parse('$baseUrl/api/conversations');
    
    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({'booking_id': bookingId}),
    );
    
    if (response.statusCode == 201) {
      final data = json.decode(response.body);
      return Conversation.fromJson(data['data']['conversation']);
    } else {
      throw Exception('Erreur lors de la création de la conversation');
    }
  }
}

class PaginatedMessages {
  final List<Message> messages;
  final PaginationMeta pagination;
  
  PaginatedMessages({
    required this.messages,
    required this.pagination,
  });
  
  factory PaginatedMessages.fromJson(Map<String, dynamic> json) {
    return PaginatedMessages(
      messages: (json['data'] as List)
          .map((m) => Message.fromJson(m))
          .toList(),
      pagination: PaginationMeta.fromJson(json['pagination']),
    );
  }
}

class PaginationMeta {
  final int page;
  final int limit;
  final int total;
  final int pages;
  
  PaginationMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.pages,
  });
  
  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      page: json['page'],
      limit: json['limit'],
      total: json['total'],
      pages: json['pages'],
    );
  }
}
```

### 2. Service Realtime (Supabase)

Créer `lib/services/chat_realtime_service.dart` :

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/message.dart';
import '../models/conversation.dart';

class ChatRealtimeService {
  final SupabaseClient supabase;
  RealtimeChannel? _messagesChannel;
  RealtimeChannel? _conversationsChannel;
  
  ChatRealtimeService(this.supabase);
  
  // S'abonner aux nouveaux messages d'une conversation
  Stream<Message> subscribeToMessages(String conversationId) {
    _messagesChannel?.unsubscribe();
    
    _messagesChannel = supabase
        .channel('messages:$conversationId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversation_id',
            value: conversationId,
          ),
          callback: (payload) {
            // Convertir le payload en Message
            final messageData = payload.newRecord;
            // Retourner le message via le stream
          },
        )
        .subscribe();
    
    // Retourner un stream qui écoute les changements
    // Note: Vous devrez adapter cela selon votre implémentation Supabase
    return Stream.periodic(Duration(seconds: 1), (_) {
      // Cette partie nécessite une implémentation personnalisée
      // pour convertir les événements Supabase en Message
      throw UnimplementedError('Implémentez la conversion des événements');
    });
  }
  
  // S'abonner aux mises à jour de conversations (nouveau message, etc.)
  Stream<Conversation> subscribeToConversations(String userId) {
    _conversationsChannel?.unsubscribe();
    
    _conversationsChannel = supabase
        .channel('conversations:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'conversations',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.or,
            filters: [
              PostgresChangeFilter(
                type: PostgresChangeFilterType.eq,
                column: 'client_id',
                value: userId,
              ),
              PostgresChangeFilter(
                type: PostgresChangeFilterType.eq,
                column: 'owner_id',
                value: userId,
              ),
            ],
          ),
          callback: (payload) {
            // Convertir le payload en Conversation
          },
        )
        .subscribe();
    
    return Stream.periodic(Duration(seconds: 1), (_) {
      throw UnimplementedError('Implémentez la conversion des événements');
    });
  }
  
  // Se désabonner
  void unsubscribe() {
    _messagesChannel?.unsubscribe();
    _conversationsChannel?.unsubscribe();
  }
}
```

### 3. Modèles de données

Créer `lib/models/conversation.dart` :

```dart
class Conversation {
  final String id;
  final String bookingId;
  final String clientId;
  final String ownerId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? lastMessageAt;
  
  final UserInfo? client;
  final UserInfo? owner;
  final Message? lastMessage;
  final int? unreadCount;
  
  Conversation({
    required this.id,
    required this.bookingId,
    required this.clientId,
    required this.ownerId,
    required this.createdAt,
    required this.updatedAt,
    this.lastMessageAt,
    this.client,
    this.owner,
    this.lastMessage,
    this.unreadCount,
  });
  
  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'],
      bookingId: json['booking_id'],
      clientId: json['client_id'],
      ownerId: json['owner_id'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
      lastMessageAt: json['last_message_at'] != null
          ? DateTime.parse(json['last_message_at'])
          : null,
      client: json['client'] != null
          ? UserInfo.fromJson(json['client'])
          : null,
      owner: json['owner'] != null
          ? UserInfo.fromJson(json['owner'])
          : null,
      lastMessage: json['last_message'] != null
          ? Message.fromJson(json['last_message'])
          : null,
      unreadCount: json['unread_count'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'booking_id': bookingId,
      'client_id': clientId,
      'owner_id': ownerId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'last_message_at': lastMessageAt?.toIso8601String(),
      'client': client?.toJson(),
      'owner': owner?.toJson(),
      'last_message': lastMessage?.toJson(),
      'unread_count': unreadCount,
    };
  }
}

class UserInfo {
  final String id;
  final String fullName;
  final String email;
  
  UserInfo({
    required this.id,
    required this.fullName,
    required this.email,
  });
  
  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'],
      fullName: json['full_name'],
      email: json['email'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'email': email,
    };
  }
}
```

Créer `lib/models/message.dart` :

```dart
class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final bool isRead;
  final DateTime createdAt;
  
  final UserInfo? sender;
  
  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.isRead,
    required this.createdAt,
    this.sender,
  });
  
  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'],
      conversationId: json['conversation_id'],
      senderId: json['sender_id'],
      content: json['content'],
      isRead: json['is_read'] ?? false,
      messageType: json['message_type'] ?? 'user',
      createdAt: DateTime.parse(json['created_at']),
      sender: json['sender'] != null
          ? UserInfo.fromJson(json['sender'])
          : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversation_id': conversationId,
      'sender_id': senderId,
      'content': content,
      'is_read': isRead,
      'created_at': createdAt.toIso8601String(),
      'sender': sender?.toJson(),
    };
  }
}
```

### 4. Provider/State Management

Créer `lib/providers/chat_provider.dart` (si vous utilisez Provider) :

```dart
import 'package:flutter/foundation.dart';
import '../models/conversation.dart';
import '../models/message.dart';
import '../services/chat_api_service.dart';
import '../services/chat_realtime_service.dart';

class ChatProvider with ChangeNotifier {
  final ChatApiService _apiService;
  final ChatRealtimeService _realtimeService;
  
  List<Conversation> _conversations = [];
  Map<String, List<Message>> _messages = {};
  bool _isLoading = false;
  
  List<Conversation> get conversations => _conversations;
  bool get isLoading => _isLoading;
  
  List<Message> getMessages(String conversationId) {
    return _messages[conversationId] ?? [];
  }
  
  ChatProvider(this._apiService, this._realtimeService);
  
  // Charger les conversations
  Future<void> loadConversations({String? role}) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _conversations = await _apiService.getConversations(role: role);
    } catch (e) {
      print('Erreur lors du chargement des conversations: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Charger les messages d'une conversation
  Future<void> loadMessages(String conversationId) async {
    try {
      final result = await _apiService.getMessages(conversationId: conversationId);
      _messages[conversationId] = result.messages;
      notifyListeners();
    } catch (e) {
      print('Erreur lors du chargement des messages: $e');
    }
  }
  
  // Envoyer un message
  Future<void> sendMessage(String conversationId, String content) async {
    try {
      final message = await _apiService.sendMessage(
        conversationId: conversationId,
        content: content,
      );
      
      // Ajouter le message à la liste locale
      _messages[conversationId] ??= [];
      _messages[conversationId]!.add(message);
      notifyListeners();
    } catch (e) {
      print('Erreur lors de l\'envoi du message: $e');
      rethrow;
    }
  }
  
  // S'abonner aux nouveaux messages en temps réel
  void subscribeToMessages(String conversationId) {
    _realtimeService.subscribeToMessages(conversationId).listen((message) {
      _messages[conversationId] ??= [];
      if (!_messages[conversationId]!.any((m) => m.id == message.id)) {
        _messages[conversationId]!.add(message);
        notifyListeners();
      }
    });
  }
  
  // Marquer un message comme lu
  Future<void> markAsRead(String messageId) async {
    try {
      await _apiService.markMessageAsRead(messageId);
      // Mettre à jour localement
      _messages.forEach((conversationId, messages) {
        final index = messages.indexWhere((m) => m.id == messageId);
        if (index != -1) {
          messages[index] = Message(
            id: messages[index].id,
            conversationId: messages[index].conversationId,
            senderId: messages[index].senderId,
            content: messages[index].content,
            isRead: true,
            createdAt: messages[index].createdAt,
            sender: messages[index].sender,
          );
          notifyListeners();
        }
      });
    } catch (e) {
      print('Erreur lors du marquage du message comme lu: $e');
    }
  }
}
```

### 5. Écrans UI

#### Liste des conversations (`lib/screens/conversations_list_screen.dart`)

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/chat_provider.dart';
import '../models/conversation.dart';
import 'chat_screen.dart';

class ConversationsListScreen extends StatefulWidget {
  @override
  _ConversationsListScreenState createState() => _ConversationsListScreenState();
}

class _ConversationsListScreenState extends State<ConversationsListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().loadConversations();
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Messages'),
      ),
      body: Consumer<ChatProvider>(
        builder: (context, chatProvider, child) {
          if (chatProvider.isLoading) {
            return Center(child: CircularProgressIndicator());
          }
          
          if (chatProvider.conversations.isEmpty) {
            return Center(child: Text('Aucune conversation'));
          }
          
          return ListView.builder(
            itemCount: chatProvider.conversations.length,
            itemBuilder: (context, index) {
              final conversation = chatProvider.conversations[index];
              final otherUser = _getOtherUser(conversation);
              
              return ListTile(
                leading: CircleAvatar(
                  child: Text(otherUser.fullName[0].toUpperCase()),
                ),
                title: Text(otherUser.fullName),
                subtitle: conversation.lastMessage != null
                    ? Text(conversation.lastMessage!.content)
                    : Text('Aucun message'),
                trailing: conversation.unreadCount != null && conversation.unreadCount! > 0
                    ? Container(
                        padding: EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '${conversation.unreadCount}',
                          style: TextStyle(color: Colors.white),
                        ),
                      )
                    : null,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ChatScreen(conversation: conversation),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
  
  UserInfo _getOtherUser(Conversation conversation) {
    // Déterminer l'autre utilisateur selon le rôle actuel
    // Cette logique dépend de votre système d'authentification
    return conversation.client ?? conversation.owner!;
  }
}
```

#### Écran de chat (`lib/screens/chat_screen.dart`)

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/chat_provider.dart';
import '../models/conversation.dart';
import '../models/message.dart';

class ChatScreen extends StatefulWidget {
  final Conversation conversation;
  
  ChatScreen({required this.conversation});
  
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final chatProvider = context.read<ChatProvider>();
      chatProvider.loadMessages(widget.conversation.id);
      chatProvider.subscribeToMessages(widget.conversation.id);
    });
  }
  
  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
  
  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;
    
    _messageController.clear();
    
    try {
      await context.read<ChatProvider>().sendMessage(
        widget.conversation.id,
        content,
      );
      
      // Scroller vers le bas
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur lors de l\'envoi du message')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final otherUser = widget.conversation.client ?? widget.conversation.owner!;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(otherUser.fullName),
      ),
      body: Column(
        children: [
          Expanded(
            child: Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                final messages = chatProvider.getMessages(widget.conversation.id);
                
                if (messages.isEmpty) {
                  return Center(child: Text('Aucun message'));
                }
                
                return ListView.builder(
                  controller: _scrollController,
                  reverse: false,
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    final isMe = message.senderId == _getCurrentUserId();
                    
                    // Handle system messages differently
                    if (message.messageType == 'system') {
                      return Container(
                        margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.info_outline, size: 16, color: Colors.grey[600]),
                            SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                message.content,
                                style: TextStyle(
                                  color: Colors.grey[800],
                                  fontStyle: FontStyle.italic,
                                  fontSize: 12,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ],
                        ),
                      );
                    }
                    
                    // Regular user messages
                    return Align(
                      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        padding: EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isMe ? Colors.blue : Colors.grey[300],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              message.content,
                              style: TextStyle(
                                color: isMe ? Colors.white : Colors.black,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              _formatTime(message.createdAt),
                              style: TextStyle(
                                color: isMe ? Colors.white70 : Colors.black54,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey[200],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Tapez un message...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                SizedBox(width: 8),
                IconButton(
                  icon: Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  String _getCurrentUserId() {
    // Récupérer l'ID de l'utilisateur actuel depuis votre service d'authentification
    // Exemple: return AuthService.currentUser?.id ?? '';
    return '';
  }
  
  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays == 0) {
      return '${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Hier';
    } else {
      return '${dateTime.day}/${dateTime.month}';
    }
  }
}
```

## Dépendances nécessaires

Ajoutez dans `pubspec.yaml` :

```yaml
dependencies:
  http: ^1.1.0
  supabase_flutter: ^2.0.0  # Pour Realtime
  provider: ^6.0.0  # Si vous utilisez Provider
```

## Configuration Supabase

Pour utiliser Supabase Realtime, vous devez :

1. **Initialiser Supabase dans votre app** :
```dart
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: 'https://votre-projet.supabase.co',
    anonKey: 'votre-anon-key',
  );
  
  runApp(MyApp());
}
```

2. **Obtenir les clés Supabase** :
   - Allez dans Supabase Dashboard → Settings → API
   - Copiez `Project URL` et `anon public` key

## Notes importantes

1. **Realtime** : L'implémentation Supabase Realtime nécessite une configuration spécifique. Adaptez le code selon la version de `supabase_flutter` que vous utilisez.

2. **Gestion des erreurs** : Ajoutez une gestion d'erreurs robuste pour tous les appels API.

3. **Cache local** : Considérez utiliser `sqflite` ou `hive` pour mettre en cache les conversations et messages.

4. **Notifications push** : Pour les notifications de nouveaux messages, intégrez Firebase Cloud Messaging ou un service similaire.

5. **Optimisation** : Implémentez la pagination infinie pour charger les messages au fur et à mesure du scroll.

## Messages système

Le système crée automatiquement des messages système dans les conversations lors des événements suivants :

1. **Création de réservation** : "Une nouvelle réservation pour '[propriété]' a été créée et est en attente de confirmation."
2. **Réservation acceptée** : "Votre réservation pour '[propriété]' a été acceptée."
3. **Réservation refusée** : "Votre réservation pour '[propriété]' a été refusée."
4. **Réservation annulée** : "La réservation a été annulée."

Ces messages sont marqués avec `message_type: 'system'` et doivent être affichés différemment des messages utilisateur (par exemple, comme des notifications centrées avec une icône).

## Test

1. Créez une réservation depuis votre app
2. La conversation devrait être créée automatiquement avec un message système
3. Ouvrez la liste des conversations
4. Cliquez sur une conversation pour voir les messages (incluant le message système)
5. Envoyez un message et vérifiez qu'il apparaît en temps réel
6. Changez le statut de la réservation (acceptée/refusée) et vérifiez qu'un nouveau message système apparaît

## Support

Si vous rencontrez des problèmes :
- Vérifiez que la migration SQL a été exécutée sur Supabase
- Vérifiez que Realtime est activé dans Supabase Dashboard
- Vérifiez les logs de l'API backend
- Testez les endpoints avec Postman/cURL d'abord

