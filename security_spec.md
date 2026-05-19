# Security Specification for PoultryPro ERP

## Data Invariants
1.  **User Profiles**: Every user must have a profile. Only admins can assign roles. Users can read their own profiles.
2.  **Products**: Only admins can create, update, or delete products. Staff and admins can read product list for POS/Inventory view.
3.  **Sales**: Any authenticated user (Staff or Admin) can create a sale. Sales are immutable once created (no updates or deletes). Users can read all sales for reporting.

## The Dirty Dozen Payloads (Negative Tests)
1.  **Identity Spoofing**: Attempting to create a product as a non-admin.
2.  **Privilege Escalation**: A staff user trying to update their own role to 'admin'.
3.  **Inventory Tampering**: A non-admin trying to update product stock levels outside of a sale transaction (wait, in this simple ERP, maybe staff can update stock if they receive goods, but user request says "Admin, Staff" roles, usually Admin manages inventory). Let's say only Admin manages inventory.
4.  **Sales Erasure**: Attempting to delete a sale record.
5.  **Sales Modification**: Attempting to change the total amount of a past sale.
6.  **Unauthenticated Access**: Trying to read products or sales without being logged in.
7.  **Resource Poisoning**: Creating a product with a 1MB name.
8.  **Orphaned Sale**: Creating a sale referencing a non-existent product ID (hard to enforce strictly with rules if products are many, but we can check if POS is the one doing it).
9.  **Timestamp Faking**: Providing a manual `timestamp` for a sale instead of using server time.
10. **ID Hijacking**: Trying to write a user profile with a UID that doesn't match the authenticated user.
11. **Negative Price**: Creating a product with a negative price.
12. **Ghost Fields**: Adding `isVerified: true` to a Sale document.

## Test Runner (Conceptual)
The `firestore.rules.test.ts` would verify:
- `db.collection('products').add({...})` fails for staff.
- `db.collection('sales').doc(id).delete()` fails for everyone.
- `db.collection('users').doc(uid).update({role: 'admin'})` fails if the request user is not an admin.
