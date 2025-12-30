# 🚀 Mettre à jour Flutter pour utiliser l'API Vercel

## ✅ Simple : Changez seulement l'URL de base

### URL de production Vercel

```
https://travelci-backend.vercel.app
```

---

## 📝 Dans votre app Flutter

### Option 1 : Fichier de configuration API

Trouvez votre fichier de configuration API (ex: `lib/config/api_config.dart` ou `lib/services/api_service.dart`) et changez :

**AVANT (URL locale) :**
```dart
const String baseUrl = 'http://192.168.100.32:3000';
// ou
const String baseUrl = 'http://localhost:3000';
// ou
const String baseUrl = 'http://10.0.2.2:3000';
```

**APRÈS (URL Vercel) :**
```dart
const String baseUrl = 'https://travelci-backend.vercel.app';
```

### Option 2 : Variables d'environnement

Si vous utilisez des variables d'environnement (`.env` ou config files) :

```dart
// lib/config/env.dart ou similaire
class ApiConfig {
  static const String baseUrl = 'https://travelci-backend.vercel.app';
  // ou depuis une variable d'environnement
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://travelci-backend.vercel.app',
  );
}
```

---

## 🔧 Exemple complet

### Avant (Local)
```dart
class ApiService {
  static const String baseUrl = 'http://192.168.100.32:3000';
  
  static String get apiUrl => '$baseUrl/api';
  
  // Endpoints
  static String get registerUrl => '$apiUrl/auth/register';
  static String get loginUrl => '$apiUrl/auth/login';
  static String get propertiesUrl => '$apiUrl/properties';
}
```

### Après (Vercel)
```dart
class ApiService {
  static const String baseUrl = 'https://travelci-backend.vercel.app';
  
  static String get apiUrl => '$baseUrl/api';
  
  // Endpoints
  static String get registerUrl => '$apiUrl/auth/register';
  static String get loginUrl => '$apiUrl/auth/login';
  static String get propertiesUrl => '$apiUrl/properties';
}
```

---

## 📋 Endpoints complets avec Vercel

Tous vos endpoints seront maintenant :

- **Health Check**: `https://travelci-backend.vercel.app/health`
- **Register**: `https://travelci-backend.vercel.app/api/auth/register`
- **Login**: `https://travelci-backend.vercel.app/api/auth/login`
- **Get User**: `https://travelci-backend.vercel.app/api/auth/me`
- **Properties**: `https://travelci-backend.vercel.app/api/properties`
- **Bookings**: `https://travelci-backend.vercel.app/api/bookings`

---

## ⚠️ Points importants

### 1. HTTPS
- L'API Vercel utilise **HTTPS** (pas HTTP)
- Assurez-vous que votre client HTTP Flutter supporte HTTPS (dio, http, etc. le supportent par défaut)

### 2. Pas de CORS
- L'API est configurée pour accepter les requêtes depuis les apps mobiles
- Pas besoin de configuration CORS spéciale

### 3. Authentification
- L'authentification fonctionne exactement pareil
- Le token JWT est inclus dans le header `Authorization: Bearer <token>`

### 4. Tests
Testez d'abord avec un simple appel :
```dart
// Test health check
final response = await http.get(
  Uri.parse('https://travelci-backend.vercel.app/health'),
);
print(response.body); // Devrait retourner {"status":"ok",...}
```

---

## 🔄 Basculement entre Local et Vercel

Si vous voulez pouvoir basculer facilement :

```dart
class ApiConfig {
  static const bool isProduction = bool.fromEnvironment('PROD', defaultValue: false);
  
  static String get baseUrl => isProduction
      ? 'https://travelci-backend.vercel.app'
      : 'http://192.168.100.32:3000'; // ou votre IP locale
}
```

Puis compilez avec :
```bash
# Production (Vercel)
flutter run --dart-define=PROD=true

# Local
flutter run
```

---

## ✅ Checklist

- [ ] Trouvez votre fichier de configuration API
- [ ] Remplacez l'URL locale par `https://travelci-backend.vercel.app`
- [ ] Vérifiez que l'URL utilise **HTTPS** (pas HTTP)
- [ ] Testez avec un appel simple (health check)
- [ ] Testez la connexion/login

---

**C'est tout ! Juste changer l'URL de base. Rien d'autre à modifier.** 🎉


