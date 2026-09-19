EVALUATION_DATASET = [
    {
        "id": "simple_list",
        "question": "List all customers",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"SELECT.*FROM\s+customers",
        "should_clarify": False,
        "category": "simple"
    },
    {
        "id": "ambiguous_apple",
        "question": "Show me Apple's sales",
        "expected_ambiguities": ["ambiguous_entity", "ambiguous_terminology", "missing_date_range"],
        "expected_sql_pattern": None,
        "should_clarify": True,
        "category": "ambiguous"
    },
    {
        "id": "time_trend",
        "question": "Show monthly revenue for this year",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"SELECT.*SUM.*GROUP BY",
        "should_clarify": False,
        "category": "aggregation"
    },
    {
        "id": "filter_by_city",
        "question": "Customers in New York",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"SELECT.*FROM\s+customers.*WHERE\s+city\s*=\s*'New York'",
        "should_clarify": False,
        "category": "filter"
    },
    {
        "id": "join_orders_customers",
        "question": "Show orders with customer names",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"SELECT.*JOIN",
        "should_clarify": False,
        "category": "join"
    },
    {
        "id": "ambiguous_metric_only",
        "question": "What is the total?",
        "expected_ambiguities": ["missing_metric"],
        "expected_sql_pattern": None,
        "should_clarify": True,
        "category": "ambiguous"
    },
    {
        "id": "comparison_ambiguous",
        "question": "Compare Q1 and Q2",
        "expected_ambiguities": ["missing_metric", "ambiguous_comparison"],
        "expected_sql_pattern": None,
        "should_clarify": True,
        "category": "ambiguous"
    },
    {
        "id": "top_n",
        "question": "Top 5 products by revenue",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"ORDER BY.*DESC.*LIMIT 5",
        "should_clarify": False,
        "category": "ranking"
    },
    {
        "id": "bottom_n",
        "question": "Worst 3 selling products",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"ORDER BY.*ASC.*LIMIT 3",
        "should_clarify": False,
        "category": "ranking"
    },
    {
        "id": "count_aggregation",
        "question": "How many orders were placed?",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"SELECT\s+COUNT",
        "should_clarify": False,
        "category": "aggregation"
    },
    {
        "id": "ambiguous_time",
        "question": "Show sales recently",
        "expected_ambiguities": ["missing_date_range"],
        "expected_sql_pattern": None,
        "should_clarify": True,
        "category": "ambiguous"
    },
    {
        "id": "complex_join",
        "question": "List all products bought by John Doe",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"JOIN.*JOIN.*WHERE",
        "should_clarify": False,
        "category": "join"
    },
    {
        "id": "grouping",
        "question": "Revenue by product category",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"GROUP BY\s+category",
        "should_clarify": False,
        "category": "aggregation"
    },
    {
        "id": "missing_entity",
        "question": "Show their orders",
        "expected_ambiguities": ["ambiguous_entity"],
        "expected_sql_pattern": None,
        "should_clarify": True,
        "category": "ambiguous"
    },
    {
        "id": "average_metric",
        "question": "Average order value",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"SELECT\s+AVG",
        "should_clarify": False,
        "category": "aggregation"
    },
    {
        "id": "date_filter",
        "question": "Orders placed in 2023",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"WHERE.*2023",
        "should_clarify": False,
        "category": "filter"
    },
    {
        "id": "multi_filter",
        "question": "Active products under $50",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"WHERE.*is_active.*AND.*unit_price\s*<\s*50",
        "should_clarify": False,
        "category": "filter"
    },
    {
        "id": "ambiguous_acronym",
        "question": "Show MRR",
        "expected_ambiguities": ["ambiguous_terminology"],
        "expected_sql_pattern": None,
        "should_clarify": True,
        "category": "ambiguous"
    },
    {
        "id": "distinct_list",
        "question": "List unique cities we have customers in",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"SELECT\s+DISTINCT",
        "should_clarify": False,
        "category": "simple"
    },
    {
        "id": "nested_query",
        "question": "Customers who haven't placed an order",
        "expected_ambiguities": [],
        "expected_sql_pattern": r"NOT IN|LEFT JOIN.*IS NULL",
        "should_clarify": False,
        "category": "join"
    }
]
