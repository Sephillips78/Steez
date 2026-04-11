-- Advanced Retrieval Queries

-- Query 1: Find all orders with user email and total amount
SELECT o.order_id, u.email, o.total_amount, o.created_at
FROM orders o
JOIN users u ON o.user_id = u.user_id;


-- Query 2: Get all products with their category names
SELECT p.product_id, p.name AS product_name, c.name AS category_name, p.price
FROM product p
JOIN category c ON p.category_id = c.category_id;


-- Query 3: Find all items in a specific order (Example: order_id = 1)
SELECT oi.order_id, p.name AS product_name, oi.quantity, p.price
FROM order_items oi
JOIN product p ON oi.product_id = p.product_id
WHERE oi.order_id = 1;


-- Query 4: Find all orders made by a specific user (by email)
SELECT o.order_id, o.total_amount, o.created_at
FROM orders o
JOIN users u ON o.user_id = u.user_id
WHERE u.email = 'example@email.com';


-- Query 5: Find total quantity sold for each product
SELECT p.name AS product_name, SUM(oi.quantity) AS total_sold
FROM order_items oi
JOIN product p ON oi.product_id = p.product_id
GROUP BY p.name;


-- Query 6: Find all users and the products in their wishlist
SELECT u.email, p.name AS product_name, w.created_at
FROM wishlist w
JOIN users u ON w.user_id = u.user_id
JOIN product p ON w.product_id = p.product_id;


-- Query 7: Find the most expensive product in each category
SELECT c.name AS category_name, p.name AS product_name, p.price
FROM product p
JOIN category c ON p.category_id = c.category_id
WHERE p.price = (
    SELECT MAX(p2.price)
    FROM product p2
    WHERE p2.category_id = p.category_id
);


-- Query 8: Find users who have placed at least one order
SELECT DISTINCT u.user_id, u.email
FROM users u
JOIN orders o ON u.user_id = o.user_id;


-- Query 9: Find all orders with number of items in each order
SELECT o.order_id, COUNT(oi.product_id) AS item_count
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id;


-- Query 10: Find users who ordered products from a specific category
SELECT DISTINCT u.email
FROM users u
JOIN orders o ON u.user_id = o.user_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN product p ON oi.product_id = p.product_id
JOIN category c ON p.category_id = c.category_id
WHERE c.name = 'Electronics';
