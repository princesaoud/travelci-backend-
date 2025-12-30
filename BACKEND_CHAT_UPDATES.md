# Backend Chat Updates Required

## Modifications nécessaires dans `/src/services/chat.service.ts`

### 1. Modifier le message d'annulation pour inclure le titre de la propriété

Ligne 722-727, remplacer :
```typescript
case 'cancelled':
  messageContent = 'La réservation a été annulée.';
  // For cancelled, determine who cancelled based on context
  // Default to owner for now
  senderId = conversationDetails.owner_id;
  break;
```

Par :
```typescript
case 'cancelled':
  messageContent = propertyTitle
    ? `La réservation pour "${propertyTitle}" a été annulée.`
    : 'La réservation a été annulée.';
  // For cancelled, determine who cancelled based on context
  // Default to owner for now
  senderId = conversationDetails.owner_id;
  break;
```

### 2. Modifier le message par défaut pour inclure le titre de la propriété

Ligne 728-730, remplacer :
```typescript
default:
  messageContent = `Le statut de la réservation a été mis à jour : ${status}`;
  senderId = conversationDetails.owner_id;
```

Par :
```typescript
default:
  messageContent = propertyTitle
    ? `Le statut de la réservation pour "${propertyTitle}" a été mis à jour : ${status}`
    : `Le statut de la réservation a été mis à jour : ${status}`;
  senderId = conversationDetails.owner_id;
```

## Notes

- Le backend passe déjà `property.title` à `createSystemMessageForBookingStatus` pour l'annulation (voir `booking.service.ts` ligne 300)
- Tous les autres statuts incluent déjà le titre de la propriété
- Ces modifications garantissent que tous les messages système incluent le titre de la propriété

