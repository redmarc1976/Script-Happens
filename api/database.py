import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


_password = quote_plus(os.getenv("SQL_PASSWORD", ""))

engine = create_engine(
    f"mssql+pyodbc://{os.getenv('SQL_USERNAME')}:{_password}"
    f"@{os.getenv('SQL_SERVER')}/{os.getenv('SQL_DATABASE')}"
    f"?driver=ODBC+Driver+18+for+SQL+Server"
)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


