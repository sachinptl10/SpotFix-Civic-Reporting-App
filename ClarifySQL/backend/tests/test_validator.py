import pytest
from app.services.sql_validator import SQLValidatorService

@pytest.fixture
def schema_context():
    return {
        "tables": {
            "customers": {
                "columns": {
                    "id": {"type": "INTEGER", "primary_key": True, "nullable": False},
                    "name": {"type": "VARCHAR(100)", "primary_key": False, "nullable": False},
                    "email": {"type": "VARCHAR(255)", "primary_key": False, "nullable": False},
                    "company": {"type": "VARCHAR(100)", "primary_key": False, "nullable": True},
                    "segment": {"type": "VARCHAR(50)", "primary_key": False, "nullable": True},
                    "city": {"type": "VARCHAR(100)", "primary_key": False, "nullable": True},
                    "country": {"type": "VARCHAR(100)", "primary_key": False, "nullable": True},
                    "created_at": {"type": "TIMESTAMP", "primary_key": False, "nullable": True}
                }
            },
            "products": {
                "columns": {
                    "id": {"type": "INTEGER", "primary_key": True, "nullable": False},
                    "name": {"type": "VARCHAR(200)", "primary_key": False, "nullable": False},
                    "category": {"type": "VARCHAR(100)", "primary_key": False, "nullable": True},
                    "subcategory": {"type": "VARCHAR(100)", "primary_key": False, "nullable": True},
                    "brand": {"type": "VARCHAR(100)", "primary_key": False, "nullable": True},
                    "unit_price": {"type": "NUMERIC(10,2)", "primary_key": False, "nullable": False},
                    "cost_price": {"type": "NUMERIC(10,2)", "primary_key": False, "nullable": True},
                    "is_active": {"type": "BOOLEAN", "primary_key": False, "nullable": True},
                    "created_at": {"type": "TIMESTAMP", "primary_key": False, "nullable": True}
                }
            },
            "orders": {
                "columns": {
                    "id": {"type": "INTEGER", "primary_key": True, "nullable": False},
                    "customer_id": {"type": "INTEGER", "primary_key": False, "nullable": True},
                    "order_date": {"type": "TIMESTAMP", "primary_key": False, "nullable": False},
                    "status": {"type": "VARCHAR(50)", "primary_key": False, "nullable": True},
                    "shipping_address": {"type": "TEXT", "primary_key": False, "nullable": True},
                    "total_amount": {"type": "NUMERIC(12,2)", "primary_key": False, "nullable": True},
                    "created_at": {"type": "TIMESTAMP", "primary_key": False, "nullable": True}
                }
            },
            "order_items": {
                "columns": {
                    "id": {"type": "INTEGER", "primary_key": True, "nullable": False},
                    "order_id": {"type": "INTEGER", "primary_key": False, "nullable": True},
                    "product_id": {"type": "INTEGER", "primary_key": False, "nullable": True},
                    "quantity": {"type": "INTEGER", "primary_key": False, "nullable": False},
                    "unit_price": {"type": "NUMERIC(10,2)", "primary_key": False, "nullable": False},
                    "discount": {"type": "NUMERIC(5,2)", "primary_key": False, "nullable": True},
                    "total": {"type": "NUMERIC(12,2)", "primary_key": False, "nullable": False}
                }
            },
            "payments": {
                "columns": {
                    "id": {"type": "INTEGER", "primary_key": True, "nullable": False},
                    "order_id": {"type": "INTEGER", "primary_key": False, "nullable": True},
                    "payment_date": {"type": "TIMESTAMP", "primary_key": False, "nullable": False},
                    "amount": {"type": "NUMERIC(12,2)", "primary_key": False, "nullable": False},
                    "method": {"type": "VARCHAR(50)", "primary_key": False, "nullable": True},
                    "status": {"type": "VARCHAR(50)", "primary_key": False, "nullable": True},
                    "transaction_id": {"type": "VARCHAR(100)", "primary_key": False, "nullable": True}
                }
            }
        },
        "relationships": [
            {"from_table": "orders", "from_column": "customer_id", "to_table": "customers", "to_column": "id"},
            {"from_table": "order_items", "from_column": "order_id", "to_table": "orders", "to_column": "id"},
            {"from_table": "order_items", "from_column": "product_id", "to_table": "products", "to_column": "id"},
            {"from_table": "payments", "from_column": "order_id", "to_table": "orders", "to_column": "id"}
        ]
    }

@pytest.fixture
def validator(schema_context):
    return SQLValidatorService(schema_context=schema_context)

def test_simple_select(validator):
    result = validator.validate("SELECT name, email FROM customers")
    assert result.is_valid
    assert result.is_read_only
    assert result.query_type == "SELECT"

def test_select_with_where(validator):
    result = validator.validate("SELECT id, name FROM products WHERE category = 'Electronics'")
    assert result.is_valid
    assert result.is_read_only

def test_select_with_join(validator):
    result = validator.validate("SELECT c.name, o.order_date FROM customers c JOIN orders o ON c.id = o.customer_id")
    assert result.is_valid
    assert result.is_read_only
    assert "customers" in result.tables_referenced
    assert "orders" in result.tables_referenced

def test_select_with_group_by(validator):
    result = validator.validate("SELECT category, COUNT(id) FROM products GROUP BY category")
    assert result.is_valid
    assert result.is_read_only

def test_select_with_order_by(validator):
    result = validator.validate("SELECT name FROM customers ORDER BY created_at DESC")
    assert result.is_valid
    assert result.is_read_only

def test_select_with_limit(validator):
    result = validator.validate("SELECT name FROM customers LIMIT 10")
    assert result.is_valid
    assert result.is_read_only

def test_select_with_subquery(validator):
    result = validator.validate("SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders)")
    assert result.is_valid
    assert result.is_read_only

def test_select_with_cte(validator):
    result = validator.validate("WITH recent_orders AS (SELECT * FROM orders WHERE order_date > '2023-01-01') SELECT * FROM recent_orders")
    assert result.is_valid
    assert result.is_read_only

def test_select_with_aggregation(validator):
    result = validator.validate("SELECT MAX(total_amount), MIN(total_amount), AVG(total_amount) FROM orders")
    assert result.is_valid
    assert result.is_read_only

def test_reject_insert(validator):
    result = validator.validate("INSERT INTO customers (name) VALUES ('test')")
    assert not result.is_valid
    assert not result.is_read_only
    assert result.query_type == "INSERT"

def test_reject_update(validator):
    result = validator.validate("UPDATE customers SET name = 'hacked'")
    assert not result.is_valid
    assert not result.is_read_only

def test_reject_delete(validator):
    result = validator.validate("DELETE FROM customers")
    assert not result.is_valid
    assert not result.is_read_only

def test_reject_drop_table(validator):
    result = validator.validate("DROP TABLE customers")
    assert not result.is_valid
    assert not result.is_read_only

def test_reject_alter_table(validator):
    result = validator.validate("ALTER TABLE customers ADD COLUMN hack VARCHAR(100)")
    assert not result.is_valid
    assert not result.is_read_only

def test_reject_truncate(validator):
    result = validator.validate("TRUNCATE TABLE customers")
    assert not result.is_valid
    assert not result.is_read_only

def test_reject_create_table(validator):
    result = validator.validate("CREATE TABLE hackers (id INT)")
    assert not result.is_valid
    assert not result.is_read_only

def test_malformed_query(validator):
    result = validator.validate("SELECT FROM WHERE id =")
    assert not result.is_valid

def test_nonexistent_table(validator):
    result = validator.validate("SELECT * FROM non_existent_table")
    assert not result.is_valid

def test_nonexistent_column(validator):
    result = validator.validate("SELECT imaginary_column FROM customers")
    assert not result.is_valid

def test_select_star_warning(validator):
    result = validator.validate("SELECT * FROM customers WHERE id = 1")
    assert result.is_valid
    assert len(result.warnings) > 0

def test_missing_where_warning(validator):
    result = validator.validate("SELECT name FROM customers")
    assert result.is_valid

def test_empty_string(validator):
    result = validator.validate("")
    assert not result.is_valid

def test_multiple_statements(validator):
    result = validator.validate("SELECT * FROM customers; DROP TABLE orders;")
    assert not result.is_valid

def test_comments_in_query(validator):
    result = validator.validate("SELECT name FROM customers -- This is a comment")
    assert result.is_valid
    assert result.is_read_only
