# Flutter – Log blocked-dates API result in console

When the disponibilité (availability) view fetches blocked dates, add logging like this:

## Option 1: After the API call

```dart
// After your blocked-dates API call (e.g. in your service or provider)
final response = await dio.get('/api/properties/blocked-dates/$propertyId');
// Log the full result
debugPrint('[blocked-dates] API response: ${response.data}');
// Or with pretty print
print('[blocked-dates] dates: ${response.data['data']?['dates']}');
```

## Option 2: In a try-catch

```dart
try {
  final res = await apiService.getBlockedDates(propertyId);
  debugPrint('[blocked-dates] Success: $res');
  debugPrint('[blocked-dates] Dates: ${res['data']?['dates'] ?? res['dates']}');
} catch (e, st) {
  debugPrint('[blocked-dates] Error: $e');
  debugPrint('[blocked-dates] Stack: $st');
}
```

## Option 3: Wrap your existing call

Wherever you call the blocked-dates endpoint, add:

```dart
// Before: your existing call
// After: wrap with logging
final result = await getBlockedDates(propertyId);
print('[blocked-dates] propertyId=$propertyId result=$result');
return result;
```

---

**Backend:** The API controller also logs to the server console when `getBlockedDates` is called:
```
[blocked-dates] GET result { propertyId: '...', dates: [...], count: N }
```
