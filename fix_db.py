import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load .env from apps/api
load_dotenv('/home/deploy/zachot/apps/api/.env')

# Database URL from env or fallback
db_url = os.getenv("DATABASE_URL", "postgresql://marka:marka_pass@localhost:5433/zachot")
print(f"Using database URL: {db_url}")

engine = create_engine(db_url)

def add_column(conn, table, column, type_def):
    try:
        # Check if column exists
        res = conn.execute(text(f"SELECT 1 FROM information_schema.columns WHERE table_name='{table}' AND column_name='{column}'"))
        if res.fetchone():
            print(f"Column '{column}' already exists in table '{table}'.")
            return

        print(f"Adding '{column}' to table '{table}'...")
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}"))
        conn.commit()
        print(f"Successfully added '{column}'.")
    except Exception as e:
        print(f"Error adding '{column}': {e}")
        conn.rollback()

def fix_db():
    with engine.connect() as conn:
        print("--- Updating 'users' table ---")
        add_column(conn, 'users', 'credits_balance', 'INTEGER DEFAULT 5')
        add_column(conn, 'users', 'credits_used', 'INTEGER DEFAULT 0')

        print("\n--- Updating 'payments' table ---")
        add_column(conn, 'payments', 'period', 'VARCHAR')
        add_column(conn, 'payments', 'rebill_id', 'VARCHAR')
        add_column(conn, 'payments', 'recurrent_parent_id', 'UUID')
        add_column(conn, 'payments', 'is_recurrent', 'INTEGER DEFAULT 0')
        add_column(conn, 'payments', 'customer_email', 'VARCHAR')
        add_column(conn, 'payments', 'customer_key', 'VARCHAR')
        add_column(conn, 'payments', 'confirmed_at', 'TIMESTAMP')

        print("\n--- Ensuring all tables exist ---")
        sys.path.append('/home/deploy/zachot')
        from packages.database.src.models import Base
        # This will create missing tables like 'subscriptions' and 'credit_transactions'
        Base.metadata.create_all(bind=engine)
        print("Done.")

if __name__ == "__main__":
    fix_db()

        add_column(conn, 'payments', 'rebill_id', 'VARCHAR')
        add_column(conn, 'payments', 'recurrent_parent_id', 'UUID')
        add_column(conn, 'payments', 'is_recurrent', 'INTEGER DEFAULT 0')
        add_column(conn, 'payments', 'customer_email', 'VARCHAR')
        add_column(conn, 'payments', 'customer_key', 'VARCHAR')
        add_column(conn, 'payments', 'confirmed_at', 'TIMESTAMP')

        print("\n--- Ensuring all tables exist ---")
        sys.path.append('/home/deploy/zachot')
        from packages.database.src.models import Base
        # This will create missing tables like 'subscriptions' and 'credit_transactions'
        Base.metadata.create_all(bind=engine)
        print("Done.")

if __name__ == "__main__":
    fix_db()
