import sqlglot
from sqlglot import exp
from app.schemas.sql import ValidationResult


class SQLValidatorService:
    FORBIDDEN_TYPES = {
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER',
        'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE'
    }

    def __init__(self, schema_context: dict | None = None):
        self.schema_context = schema_context or {}
        self._valid_tables = self._extract_valid_tables()

    def _extract_valid_tables(self) -> set[str]:
        """Extract valid table names from schema_context (handles both list and dict formats)."""
        tables_data = self.schema_context.get('tables', [])
        if isinstance(tables_data, dict):
            return {t.lower() for t in tables_data.keys()}
        elif isinstance(tables_data, list):
            return {t['name'].lower() for t in tables_data if isinstance(t, dict) and 'name' in t}
        return set()

    def _extract_valid_columns(self, table_name: str) -> set[str]:
        """Extract valid column names for a given table."""
        tables_data = self.schema_context.get('tables', [])
        if isinstance(tables_data, dict):
            table_info = tables_data.get(table_name, {})
            cols = table_info.get('columns', {})
            if isinstance(cols, dict):
                return {c.lower() for c in cols.keys()}
            elif isinstance(cols, list):
                return {c['name'].lower() for c in cols if isinstance(c, dict)}
        elif isinstance(tables_data, list):
            for t in tables_data:
                if isinstance(t, dict) and t.get('name', '').lower() == table_name.lower():
                    cols = t.get('columns', [])
                    if isinstance(cols, list):
                        return {c['name'].lower() for c in cols if isinstance(c, dict)}
                    elif isinstance(cols, dict):
                        return {c.lower() for c in cols.keys()}
        return set()

    def validate(self, sql: str) -> ValidationResult:
        """Validate SQL for safety and correctness."""
        errors: list[str] = []
        warnings: list[str] = []
        query_type = ""
        tables_referenced: list[str] = []
        is_read_only = True

        if not sql or not sql.strip():
            return ValidationResult(
                is_valid=False, errors=["Empty SQL statement"],
                warnings=[], query_type="", tables_referenced=[], is_read_only=True
            )

        try:
            parsed = sqlglot.parse(sql, dialect='postgres')
            if not parsed or not parsed[0]:
                return ValidationResult(
                    is_valid=False, errors=["Empty or invalid SQL"],
                    warnings=[], query_type="", tables_referenced=[], is_read_only=True
                )

            # Reject multiple statements
            if len(parsed) > 1 and parsed[1] is not None:
                errors.append("Multiple SQL statements are not allowed.")
                return ValidationResult(
                    is_valid=False, errors=errors, warnings=warnings,
                    query_type="MULTI", tables_referenced=[], is_read_only=False
                )

            ast = parsed[0]
            query_type = ast.key.upper()

            # Walk tree for forbidden statement types
            for node in ast.walk():
                node_type = node.key.upper()
                if node_type in self.FORBIDDEN_TYPES:
                    is_read_only = False
                    errors.append(f"Forbidden statement type: {node_type}")
                    return ValidationResult(
                        is_valid=False, errors=errors, warnings=warnings,
                        query_type=query_type, tables_referenced=tables_referenced,
                        is_read_only=False
                    )

            if query_type in self.FORBIDDEN_TYPES:
                is_read_only = False
                errors.append(f"Only SELECT statements are allowed. Got: {query_type}")
            elif query_type != 'SELECT':
                errors.append(f"Only SELECT statements are allowed. Got: {query_type}")

            # Extract referenced tables
            tables_referenced = list({
                table.name.lower()
                for table in ast.find_all(exp.Table)
                if table.name
            })

            # Validate tables exist in schema
            if self._valid_tables:
                for t in tables_referenced:
                    if t not in self._valid_tables:
                        errors.append(f"Table '{t}' does not exist in the database schema.")

            # Validate columns exist (best-effort)
            if self._valid_tables:
                for col_node in ast.find_all(exp.Column):
                    col_name = col_node.name.lower() if col_node.name else None
                    col_table = col_node.table.lower() if col_node.table else None
                    if col_name and col_table and col_table in self._valid_tables:
                        valid_cols = self._extract_valid_columns(col_table)
                        if valid_cols and col_name not in valid_cols:
                            errors.append(
                                f"Column '{col_name}' does not exist in table '{col_table}'."
                            )

            # Warnings
            if ast.find(exp.Star):
                warnings.append("SELECT * is discouraged; consider selecting specific columns.")

            if not ast.find(exp.Where):
                warnings.append("Query has no WHERE clause; may return many rows.")

            if len(list(ast.find_all(exp.Select))) > 1:
                warnings.append("Query contains subqueries or CTEs.")

        except sqlglot.errors.ParseError as e:
            errors.append(f"SQL syntax error: {str(e)}")
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            query_type=query_type,
            tables_referenced=tables_referenced,
            is_read_only=is_read_only,
        )
