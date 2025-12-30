# Prompt pour mettre à jour l'URL API dans Flutter

## 🔄 Remplacez l'URL de base locale par l'URL Vercel

Dans votre projet Flutter, trouvez le fichier où l'URL de base API est définie (ex: `lib/config/api_config.dart`, `lib/services/api_service.dart`, ou similaire).

**Remplacez :**
- `http://localhost:3000`
- `http://192.168.x.x:3000`
- `http://10.0.2.2:3000`

**Par :**
```dart
const String baseUrl = 'https://travelci-backend.vercel.app';
```

---

## 📝 Exemple de changement

**Avant :**
```dart
class ApiConfig {
  static const String baseUrl = 'http://192.168.100.32:3000';
}
```

**Après :**
```dart
class ApiConfig {
  static const String baseUrl = 'https://travelci-backend.vercel.app';
}
```

---

## ⚠️ Important

- Utilisez **HTTPS** (pas HTTP)
- Aucun autre changement nécessaire - tous les endpoints (`/api/auth/login`, etc.) fonctionnent de la même manière

---

**C'est tout ! Juste cette URL à changer.**


