# Advanced Retrieval Queries

## Overview
This section implements 10 real-world retrieval queries using JOINs across multiple tables. These queries simulate actual system behavior and are designed to support UI operations.

---

## UI Support

Each query is designed to support a specific UI feature:

- Query 1: View all orders with user details
- Query 2: Display products with categories
- Query 3: View items in an order
- Query 4: Search orders by user email
- Query 5: Show top-selling products
- Query 6: Display user wishlist
- Query 7: Show most expensive products per category
- Query 8: Identify active users
- Query 9: Show number of items per order
- Query 10: Filter users by product category

---

## Edge Cases

### Edge Case 1
Scenario: Searching for a non-existing user email  
Result: Query returns no rows  

### Edge Case 2
Scenario: Querying an order that has no items  
Result: No results returned (or prevented by constraints)  

### Edge Case 3
Scenario: Filtering by a category that does not exist  
Result: Empty result set  

### Edge Case 4
Scenario: Products that were never ordered  
Result: They do not appear in sales-related queries  

---

## Business Rules Reflected

### Rule 1
Only registered users can place orders  
  Enforced via JOIN between users and orders  

### Rule 2
Every order must contain valid products  
  Enforced via JOIN between order_items and product  

### Rule 3
Products must belong to a category  
  Enforced via JOIN between product and category  

### Rule 4
Users can only interact with existing data  
  Queries return results only for valid foreign key relationships  

### Rule 5
Orders must contain at least one item  
  Reflected in Query 9 (item count per order)  

---

## Notes
All queries use JOIN operations and reflect realistic system usage scenarios such as user activity tracking, product analysis, and order management.
