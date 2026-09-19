from sqlalchemy import inspect
from app.models.database import async_engine

class SchemaService:
    async def get_schema_context(self) -> dict:
        """Inspect PostgreSQL and return full schema context for LLM prompts."""
        def _inspect_schema(connection):
            inspector = inspect(connection)
            tables = []
            relationships = []
            schema_text_lines = []
            
            for table_name in inspector.get_table_names():
                columns = inspector.get_columns(table_name)
                fks = inspector.get_foreign_keys(table_name)
                pk = inspector.get_pk_constraint(table_name)
                uniques = inspector.get_unique_constraints(table_name)
                
                table_cols = []
                col_texts = []
                for col in columns:
                    col_name = col['name']
                    col_type = str(col['type'])
                    is_pk = pk and col_name in pk.get('constrained_columns', [])
                    is_fk = False
                    fk_ref = ""
                    for fk in fks:
                        if col_name in fk['constrained_columns']:
                            is_fk = True
                            idx = fk['constrained_columns'].index(col_name)
                            fk_ref = f"{fk['referred_table']}.{fk['referred_columns'][idx]}"
                            relationships.append({
                                'source_table': table_name,
                                'source_column': col_name,
                                'target_table': fk['referred_table'],
                                'target_column': fk['referred_columns'][idx]
                            })
                            break
                    
                    is_unique = False
                    for u in uniques:
                        if col_name in u.get('column_names', []):
                            is_unique = True
                            break
                    
                    table_cols.append({
                        'name': col_name,
                        'type': col_type,
                        'nullable': col['nullable'],
                        'primary_key': is_pk,
                        'default': str(col.get('default')) if col.get('default') else None,
                        'foreign_key': fk_ref if is_fk else None
                    })
                    
                    props = []
                    if is_pk: props.append("PK")
                    if is_fk: props.append(f"FK->{fk_ref}")
                    if is_unique: props.append("UNIQUE")
                    if not col['nullable']: props.append("NOT NULL")
                    prop_str = f", {', '.join(props)}" if props else ""
                    col_texts.append(f"{col_name} ({col_type}{prop_str})")
                
                tables.append({'name': table_name, 'columns': table_cols})
                schema_text_lines.append(f"Table: {table_name}\n  Columns: {', '.join(col_texts)}\n")
            
            schema_text = "\n".join(schema_text_lines)
            return {
                'tables': tables,
                'relationships': relationships,
                'schema_text': schema_text
            }

        async with async_engine.connect() as conn:
            return await conn.run_sync(_inspect_schema)
    
    async def get_tables_list(self) -> list[dict]:
        """Return list of tables with their columns for the schema explorer UI."""
        context = await self.get_schema_context()
        return context['tables']
    
    async def get_relationships(self) -> list[dict]:
        """Return list of FK relationships."""
        context = await self.get_schema_context()
        return context['relationships']
