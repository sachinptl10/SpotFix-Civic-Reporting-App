import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy import select
from app.models.database import async_session_factory
from app.models.tables import Customer, Product, Order, OrderItem, Payment

# Fixed seed for reproducibility
random.seed(42)

async def seed_data():
    async with async_session_factory() as session:
        # Check if data exists
        result = await session.execute(select(Customer))
        if result.scalars().first():
            print("Data already exists. Skipping seed.")
            return

        print("Generating mock data...")

        # --- Customers (50) ---
        segments = ['enterprise', 'mid-market', 'small-business', 'consumer']
        cities_countries = [
            ('New York', 'US'), ('San Francisco', 'US'), ('Austin', 'US'),
            ('London', 'UK'), ('Manchester', 'UK'),
            ('Berlin', 'Germany'), ('Munich', 'Germany')
        ]

        first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
        
        customers = []
        # specific requested
        customers.append(Customer(name="Tim Cook", email="tim@apple.inc", company="Apple Inc.", segment="enterprise", city="San Francisco", country="US"))
        customers.append(Customer(name="John Appleseed", email="john@apple.farm", company="Apple Farm Co.", segment="small-business", city="Austin", country="US"))
        
        for i in range(3, 51):
            fname = random.choice(first_names)
            lname = random.choice(last_names)
            city, country = random.choice(cities_countries)
            customers.append(
                Customer(
                    name=f"{fname} {lname}",
                    email=f"{fname.lower()}.{lname.lower()}{i}@example.com",
                    company=f"Company {i}" if random.random() > 0.3 else None,
                    segment=random.choice(segments),
                    city=city,
                    country=country
                )
            )
        session.add_all(customers)
        await session.commit()
        
        # --- Products (40) ---
        products = []
        electronics = [
            ("iPhone 15", "Electronics", "Smartphones", "Apple", 799.00, 400.00),
            ("MacBook Pro", "Electronics", "Laptops", "Apple", 1299.00, 800.00),
            ("iPad Air", "Electronics", "Tablets", "Apple", 599.00, 300.00),
            ("Galaxy S24", "Electronics", "Smartphones", "Samsung", 899.00, 450.00),
            ("Pixel 8", "Electronics", "Smartphones", "Google", 699.00, 350.00),
        ]
        food_bev = [
            ("Apple Juice", "Food & Beverage", "Juices", "Tropicana", 4.99, 1.50),
            ("Apple Cider Vinegar", "Food & Beverage", "Pantry", "Bragg", 6.99, 2.00),
            ("Orange Juice", "Food & Beverage", "Juices", "Tropicana", 5.99, 1.80),
        ]
        software = [
            ("Microsoft 365", "Software", "Productivity", "Microsoft", 99.00, 10.00),
            ("Adobe Creative Suite", "Software", "Design", "Adobe", 599.00, 50.00),
            ("Slack Pro", "Software", "Communication", "Slack", 144.00, 20.00),
        ]
        clothing = [
            ("Cotton T-Shirt", "Clothing", "Shirts", "Hanes", 15.00, 5.00),
            ("Jeans", "Clothing", "Pants", "Levi's", 60.00, 20.00),
            ("Sneakers", "Clothing", "Shoes", "Nike", 120.00, 40.00)
        ]
        all_prods = electronics + food_bev + software + clothing
        
        # padding to 40
        while len(all_prods) < 40:
            all_prods.append((
                f"Generic Product {len(all_prods)}", 
                "Misc", "Misc", "Generic", 
                random.uniform(10.0, 100.0), 
                random.uniform(1.0, 10.0)
            ))
            
        for p in all_prods:
            products.append(Product(name=p[0], category=p[1], subcategory=p[2], brand=p[3], unit_price=p[4], cost_price=p[5]))
        
        session.add_all(products)
        await session.commit()
        
        # --- Orders (~300) ---
        statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned']
        customer_ids = [c.id for c in customers]
        product_objs = products
        
        orders = []
        order_items = []
        payments = []
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        
        for i in range(300):
            o_date = start_date + timedelta(days=random.randint(0, 365), hours=random.randint(0, 23))
            o_status = random.choices(statuses, weights=[10, 10, 20, 50, 5, 5])[0]
            
            order = Order(
                customer_id=random.choice(customer_ids),
                order_date=o_date,
                status=o_status,
                total_amount=0,  # will update
                created_at=o_date
            )
            orders.append(order)
        
        session.add_all(orders)
        await session.commit()
        
        # --- Order Items (~600) ---
        for order in orders:
            num_items = random.randint(1, 5)
            order_total = 0
            
            selected_products = random.sample(product_objs, num_items)
            for prod in selected_products:
                qty = random.randint(1, 5)
                discount = random.choice([0, 0, 0, 5.0, 10.0])
                total = float(prod.unit_price) * qty * (1 - discount/100)
                order_total += total
                
                order_items.append(
                    OrderItem(
                        order_id=order.id,
                        product_id=prod.id,
                        quantity=qty,
                        unit_price=prod.unit_price,
                        discount=discount,
                        total=total
                    )
                )
            
            order.total_amount = order_total
            
            # --- Payments (~280) ---
            if random.random() < 0.95 and order.status != 'cancelled':
                methods = ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'crypto']
                pay_status = 'completed' if order.status in ['shipped', 'delivered'] else random.choice(['pending', 'completed', 'failed'])
                if order.status == 'returned':
                    pay_status = 'refunded'
                
                payments.append(
                    Payment(
                        order_id=order.id,
                        payment_date=order.order_date + timedelta(hours=random.randint(1, 48)),
                        amount=order_total,
                        method=random.choice(methods),
                        status=pay_status,
                        transaction_id=f"TXN-{random.randint(100000, 999999)}"
                    )
                )

        session.add_all(order_items)
        session.add_all(payments)
        await session.commit()
        
        print(f"Seeded: {len(customers)} customers, {len(products)} products, {len(orders)} orders, {len(order_items)} items, {len(payments)} payments.")

if __name__ == "__main__":
    asyncio.run(seed_data())
