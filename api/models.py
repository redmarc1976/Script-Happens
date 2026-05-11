from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

# Association table for many-to-many relationship between desks and preferences
desk_preference_association = Table(
    'desk_preferences',
    Base.metadata,
    Column('desk_id', String(100), ForeignKey('desks.id'), primary_key=True),
    Column('preference_id', String(100), ForeignKey('preferences.id'), primary_key=True)
)

# Association table for many-to-many relationship between users and preferences
user_preference_association = Table(
    'user_preferences',
    Base.metadata,
    Column('user_id', String(100), ForeignKey('users.id'), primary_key=True),
    Column('preference_id', String(100), ForeignKey('preferences.id'), primary_key=True)
)


class Desk(Base):
    __tablename__ = "desks"

    id = Column(String(100), primary_key=True)
    name = Column(String(100), nullable=False)
    location = Column(String(100), nullable=False)
    floor = Column(String(20), nullable=False)  # 'ground' or 'first'
    neighbourhood = Column(String(100), nullable=False)
    x = Column(Float, nullable=False)  # % of image width
    y = Column(Float, nullable=False)  # % of image height

    bookings = relationship("Booking", back_populates="desk")
    preferences = relationship("Preference", secondary=desk_preference_association)


class User(Base):
    __tablename__ = "users"

    id = Column(String(100), primary_key=True)
    employee_id = Column(Integer, unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    upn = Column(String(255), unique=True, nullable=True)  # Azure AD UPN
    location = Column(String(100), nullable=False)
    team = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    line_manager_name = Column(String(255))
    line_manager_email = Column(String(255))
    anchor_days = Column(JSON, nullable=True)  # List of days
    default_working_pattern = Column(JSON, nullable=True)  # Dict of day: office/remote
    preferred_neighbourhood = Column(String(100), nullable=True)
    desk_preferences = Column(JSON, nullable=True)  # List of preferences
    booking_window_days = Column(Integer, default=14)

    bookings = relationship("Booking", back_populates="user")
    holidays = relationship("Holiday", back_populates="user")
    preferences = relationship("Preference", secondary=user_preference_association)
    working_pattern = relationship("WorkingPattern", back_populates="user", uselist=False)


class Preference(Base):
    __tablename__ = "preferences"

    id = Column(String(100), primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    desks = relationship("Desk", secondary=desk_preference_association)
    users = relationship("User", secondary=user_preference_association)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(100), primary_key=True)
    user_id = Column(String(100), ForeignKey("users.id"), nullable=False)
    desk_id = Column(String(100), ForeignKey("desks.id"), nullable=False)
    booking_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookings")
    desk = relationship("Desk", back_populates="bookings")


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(String(100), primary_key=True)
    user_id = Column(String(100), ForeignKey("users.id"), nullable=False)
    start_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    end_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    holiday_type = Column(String(50), nullable=False)  # vacation, sick, personal, etc.
    approved = Column(Integer, default=1)  # 1 = approved, 0 = pending
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="holidays")


class WorkingPattern(Base):
    __tablename__ = "working_patterns"

    user_id = Column(String(100), ForeignKey("users.id"), primary_key=True)
    monday = Column(String(20), nullable=False)     # 'anchor day' or 'hybrid'
    tuesday = Column(String(20), nullable=False)
    wednesday = Column(String(20), nullable=False)
    thursday = Column(String(20), nullable=False)
    friday = Column(String(20), nullable=False)

    user = relationship("User", back_populates="working_pattern", uselist=False)
