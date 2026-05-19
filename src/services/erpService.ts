import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Sale, SaleItem } from '../types/erp';

export const erpService = {
  // Products
  subscribeToProducts: (callback: (products: Product[]) => void) => {
    return onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'products')
    );
  },

  addProduct: async (product: Omit<Product, 'id' | 'updatedAt'>) => {
    try {
      await addDoc(collection(db, 'products'), {
        ...product,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  },

  updateProduct: async (id: string, updates: Partial<Omit<Product, 'id'>>) => {
    try {
      await updateDoc(doc(db, 'products', id), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  },

  // Sales
  subscribeToSales: (callback: (sales: Sale[]) => void, daysLimit = 7) => {
    const q = query(
      collection(db, 'sales'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        callback(sales);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'sales')
    );
  },

  processSale: async (sale: Omit<Sale, 'id' | 'timestamp'>) => {
    const batch = writeBatch(db);
    const saleRef = doc(collection(db, 'sales'));
    
    // Add sale record
    batch.set(saleRef, {
      ...sale,
      timestamp: Timestamp.now()
    });

    // Update inventory levels (decremental)
    sale.items.forEach((item) => {
      const productRef = doc(db, 'products', item.productId);
      batch.update(productRef, {
        stock: increment(-item.quantity),
        updatedAt: Timestamp.now()
      });
    });

    try {
      await batch.commit();
      return saleRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales/batch');
    }
  }
};
