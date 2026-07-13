import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Clothing Items
export const fetchClothingItems = (callback: (items: any[]) => void) => {
  if (!auth.currentUser) return;
  const q = query(collection(db, 'clothingItems'), where('userId', '==', auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'clothingItems'));
};

export const addClothingItem = async (item: any) => {
  try {
    return await addDoc(collection(db, 'clothingItems'), {
      ...item,
      userId: auth.currentUser?.uid,
      isDirty: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'clothingItems');
  }
};

export const updateItemLaundry = async (id: string, isDirty: boolean) => {
  try {
    const docRef = doc(db, 'clothingItems', id);
    await updateDoc(docRef, { isDirty });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `clothingItems/${id}`);
  }
};

// Events
export const fetchEvents = (callback: (events: any[]) => void) => {
  if (!auth.currentUser) return;
  const q = query(collection(db, 'events'), where('userId', '==', auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(events);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'events'));
};

export const addEvent = async (event: any) => {
  try {
    return await addDoc(collection(db, 'events'), {
      ...event,
      userId: auth.currentUser?.uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'events');
  }
};

// Outfits
export const fetchOutfits = (callback: (outfits: any[]) => void) => {
  if (!auth.currentUser) return;
  const q = query(collection(db, 'outfits'), where('userId', '==', auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    const outfits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(outfits);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'outfits'));
};

export const saveOutfit = async (outfit: any) => {
  try {
    // If saving an outfit, mark items as dirty
    if (outfit.itemIds) {
      for (const itemId of outfit.itemIds) {
        await updateItemLaundry(itemId, true);
      }
    }
    
    return await addDoc(collection(db, 'outfits'), {
      ...outfit,
      userId: auth.currentUser?.uid,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'outfits');
  }
};
