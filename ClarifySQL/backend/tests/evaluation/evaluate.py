import asyncio
import re
from app.providers import get_provider
from app.services.schema_service import SchemaService
from app.services.intent_service import IntentService
from app.services.clarification_service import ClarificationService
from app.services.sql_generator import SQLGeneratorService
from app.services.sql_validator import SQLValidatorService
from tests.evaluation.dataset import EVALUATION_DATASET

async def evaluate():
    print("Starting evaluation...")
    
    # Initialize services
    provider = get_provider()
    schema_service = SchemaService()
    intent_service = IntentService(provider)
    clarification_service = ClarificationService(provider)
    sql_generator = SQLGeneratorService(provider)
    
    schema_context = await schema_service.get_schema_context()
    validator = SQLValidatorService(schema_context=schema_context)
    
    results = {
        "total": len(EVALUATION_DATASET),
        "sql_accuracy_matches": 0,
        "clarification_accuracy_matches": 0,
        "execution_successes": 0,
        "invalid_sql_count": 0,
        "total_clarification_questions": 0,
        "ambiguous_queries_count": 0
    }
    
    for item in EVALUATION_DATASET:
        print(f"\nEvaluating: {item['id']} - {item['question']}")
        try:
            # 1. Parse intent
            intent = await intent_service.parse_intent(item["question"], schema_context)
            
            # 2. Clarification
            clarification_req = await clarification_service.detect_ambiguities(intent, schema_context)
            
            needs_clarification = clarification_req is not None and len(clarification_req.questions) > 0
            
            # Check clarification accuracy
            if needs_clarification == item["should_clarify"]:
                results["clarification_accuracy_matches"] += 1
            
            if needs_clarification:
                results["ambiguous_queries_count"] += 1
                results["total_clarification_questions"] += len(clarification_req.questions)
                
                # Provide default answers
                for q in clarification_req.questions:
                    intent.original_question += f" [{q.options[0] if q.options else 'default'}]"
            
            # 3. SQL Generation
            sql_result = await sql_generator.generate_sql(intent, schema_context)
            
            # 4. Validation
            val_result = validator.validate(sql_result.sql)
            
            if not val_result.is_valid:
                results["invalid_sql_count"] += 1
                print(f"  Invalid SQL generated: {val_result.errors}")
            else:
                results["execution_successes"] += 1
            
            # Check SQL accuracy using regex pattern
            if item["expected_sql_pattern"]:
                if re.search(item["expected_sql_pattern"], sql_result.sql, re.IGNORECASE | re.DOTALL):
                    results["sql_accuracy_matches"] += 1
                else:
                    print(f"  SQL pattern mismatch: Expected {item['expected_sql_pattern']}, got {sql_result.sql}")
                    
        except Exception as e:
            print(f"  Error evaluating {item['id']}: {e}")
            
    # Calculate final metrics
    sql_accuracy = (results["sql_accuracy_matches"] / sum(1 for i in EVALUATION_DATASET if i["expected_sql_pattern"])) * 100 if sum(1 for i in EVALUATION_DATASET if i["expected_sql_pattern"]) else 0
    clarification_accuracy = (results["clarification_accuracy_matches"] / results["total"]) * 100
    execution_success_rate = (results["execution_successes"] / results["total"]) * 100
    invalid_sql_rate = (results["invalid_sql_count"] / results["total"]) * 100
    avg_questions = (results["total_clarification_questions"] / results["ambiguous_queries_count"]) if results["ambiguous_queries_count"] > 0 else 0
    
    print("\n--- Evaluation Report ---")
    print(f"Total Cases: {results['total']}")
    print(f"SQL Accuracy: {sql_accuracy:.2f}%")
    print(f"Clarification Accuracy: {clarification_accuracy:.2f}%")
    print(f"Execution Success Rate: {execution_success_rate:.2f}%")
    print(f"Invalid SQL Rate: {invalid_sql_rate:.2f}%")
    print(f"Avg Clarification Questions: {avg_questions:.2f}")

if __name__ == "__main__":
    asyncio.run(evaluate())
