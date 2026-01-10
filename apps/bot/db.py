import os
from packages.database.src.models import Base, User, AuthToken, create_db_engine, get_session_factory

engine = create_db_engine(os.getenv("DATABASE_URL", "postgresql://marka:marka_pass@localhost:5433/zachot"))
SessionLocal = get_session_factory(engine)
