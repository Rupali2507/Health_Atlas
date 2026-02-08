import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from pathlib import Path

from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Text, 
    DateTime, Boolean, JSON, Index, ForeignKey, CheckConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.exc import IntegrityError, OperationalError
from dotenv import load_dotenv

load_dotenv()

# ============================================
# DATABASE CONNECTION
# ============================================

def get_database_url() -> str:
    """Get PostgreSQL connection URL from environment."""
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("❌ ERROR: DATABASE_URL not found in .env file!")
        print("\n📝 Please create a .env file with:")
        print("DATABASE_URL=postgresql://postgres:your_password@localhost:5432/healthcare_providers")
        print("\nReplace 'your_password' with your actual PostgreSQL password")
        raise ValueError("DATABASE_URL not configured")
    
    print(f"✅ Connected to database: {db_url.split('@')[1] if '@' in db_url else 'configured'}")
    return db_url


# Create database engine
try:
    DATABASE_URL = get_database_url()
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # Set to True to see SQL queries (useful for debugging!)
        pool_pre_ping=True,  # Test connections before using
        pool_size=10,  # Number of connections to keep
        max_overflow=20  # Extra connections when busy
    )
    print("✅ Database engine created successfully")
except Exception as e:
    print(f"❌ Failed to create database engine: {e}")
    raise

# Session factory (this is how you talk to the database)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all tables
Base = declarative_base()


# ============================================
# TABLE 1: VALIDATED PROVIDERS (Main Storage)
# ============================================

class ValidatedProvider(Base):
    """
    📋 MAIN TABLE: Stores all validated healthcare providers
    
    This is your "golden record" - verified provider data that passed QA.
    Think of each row as a complete provider profile.
    """
    __tablename__ = 'validated_providers'
    
    # === PRIMARY KEY ===
    id = Column(Integer, primary_key=True, autoincrement=True)
    npi = Column(String(10), unique=True, nullable=False, index=True)
    
    # === BASIC INFO ===
    provider_name = Column(String(200), nullable=False, index=True)
    specialty = Column(String(100))
    
    # === CONTACT INFO ===
    address = Column(String(300))
    city = Column(String(100))
    state = Column(String(2), index=True)
    zip_code = Column(String(10))
    phone = Column(String(20))
    website = Column(String(500))
    
    # === LICENSE & VERIFICATION ===
    license_status = Column(String(50))
    license_number = Column(String(50))
    license_state = Column(String(2))
    license_expiration = Column(DateTime, nullable=True)
    oig_excluded = Column(Boolean, default=False)
    
    # === QUALITY SCORES ===
    confidence_score = Column(Float)
    confidence_tier = Column(String(20))  # PLATINUM, GOLD, QUESTIONABLE
    digital_footprint_score = Column(Float)
    risk_score = Column(Float, default=0.0)
    
    # === ENRICHMENT DATA (JSON) ===
    education = Column(JSON)
    certifications = Column(JSON)
    languages = Column(JSON)
    insurance_accepted = Column(JSON)
    
    # === QA FLAGS ===
    qa_flags = Column(JSON)
    fraud_indicators = Column(JSON)
    
    # === TIMESTAMPS ===
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                       onupdate=lambda: datetime.now(timezone.utc))
    last_verified = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # === METADATA ===
    validation_metadata = Column(JSON)
    data_sources = Column(JSON)
    
    # === RELATIONSHIPS ===
    verification_history = relationship("VerificationHistory", back_populates="provider", 
                                       cascade="all, delete-orphan")
    
    # === INDEXES FOR FAST SEARCHES ===
    __table_args__ = (
        Index('idx_provider_search', 'provider_name', 'state', 'specialty'),
        Index('idx_confidence', 'confidence_score', 'confidence_tier'),
        Index('idx_verification_date', 'last_verified'),
        CheckConstraint('confidence_score >= 0 AND confidence_score <= 1'),
    )
    
    def to_dict(self) -> dict:
        """Convert database record to dictionary."""
        return {
            'id': self.id,
            'npi': self.npi,
            'provider_name': self.provider_name,
            'specialty': self.specialty,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'phone': self.phone,
            'website': self.website,
            'license_status': self.license_status,
            'oig_excluded': self.oig_excluded,
            'confidence_score': self.confidence_score,
            'confidence_tier': self.confidence_tier,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_verified': self.last_verified.isoformat() if self.last_verified else None
        }


# ============================================
# TABLE 2: VERIFICATION HISTORY (Audit Trail)
# ============================================

class VerificationHistory(Base):
    """
    📜 AUDIT TRAIL: Track every time a provider is re-verified
    
    Useful for:
    - Seeing what changed over time
    - Compliance and auditing
    - Detecting patterns
    """
    __tablename__ = 'verification_history'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey('validated_providers.id', ondelete='CASCADE'))
    
    verification_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    confidence_score = Column(Float)
    changes_detected = Column(JSON)
    verification_result = Column(JSON)
    
    # Relationship
    provider = relationship("ValidatedProvider", back_populates="verification_history")
    
    __table_args__ = (
        Index('idx_verification_history', 'provider_id', 'verification_date'),
    )


# ============================================
# TABLE 3: REVIEW QUEUE (Human Review)
# ============================================

class ReviewQueue(Base):
    """
    🔴 REVIEW QUEUE: Providers that need human review
    
    RED path providers come here. A human reviewer must check them
    before they can be approved.
    """
    __tablename__ = 'review_queue'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Provider info
    provider_name = Column(String(200))
    npi = Column(String(10), index=True)
    
    # Review details
    confidence_score = Column(Float)
    review_reason = Column(Text)
    flags = Column(JSON)
    fraud_indicators = Column(JSON)
    
    # Status tracking
    status = Column(String(20), default='PENDING', index=True)  # PENDING, APPROVED, REJECTED
    priority = Column(String(20), default='NORMAL')  # HIGH, NORMAL, LOW
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime, nullable=True)
    
    # Reviewer info
    reviewer_name = Column(String(100), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    reviewer_decision = Column(String(20), nullable=True)
    
    # Full data
    original_data = Column(JSON)
    validation_result = Column(JSON)
    
    __table_args__ = (
        Index('idx_review_status', 'status', 'created_at'),
        Index('idx_review_priority', 'priority', 'status'),
    )
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'provider_name': self.provider_name,
            'npi': self.npi,
            'confidence_score': self.confidence_score,
            'review_reason': self.review_reason,
            'status': self.status,
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None
        }


# ============================================
# TABLE 4: DATA SOURCE LOGS (API Tracking)
# ============================================

class DataSourceLog(Base):
    """
    📊 API USAGE TRACKING: Log every external API call
    
    Track:
    - Which APIs were called
    - How long they took
    - Success/failure rates
    - Cost tracking
    """
    __tablename__ = 'data_source_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    provider_npi = Column(String(10), index=True)
    source_name = Column(String(50), index=True)  # NPPES, OIG, etc.
    
    request_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    response_time_ms = Column(Float)
    
    success = Column(Boolean)
    error_message = Column(Text, nullable=True)
    
    # Cache the response
    response_data = Column(JSON)
    
    __table_args__ = (
        Index('idx_source_logs', 'source_name', 'request_timestamp'),
        Index('idx_provider_logs', 'provider_npi', 'source_name'),
    )


# ============================================
# DATABASE HELPER FUNCTIONS
# ============================================

def get_db_session() -> Session:
    """
    Get a database session.
    
    Usage:
        with get_db_session() as db:
            # Do database stuff
            db.query(ValidatedProvider).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
    """
    🏗️ CREATE ALL TABLES
    
    Run this once to set up your database!
    """
    print("\n" + "="*60)
    print("🏗️  INITIALIZING DATABASE")
    print("="*60)
    
    try:
        # Test connection
        with engine.connect() as conn:
            print("✅ Database connection successful!")
        
        # Create all tables
        print("\n📋 Creating tables...")
        Base.metadata.create_all(bind=engine)
        
        print("✅ validated_providers table")
        print("✅ verification_history table")
        print("✅ review_queue table")
        print("✅ data_source_logs table")
        
        print("\n" + "="*60)
        print("✅ DATABASE INITIALIZED SUCCESSFULLY!")
        print("="*60)
        print("\n💡 Your database is ready to use!")
        
        return True
        
    except OperationalError as e:
        print(f"\n❌ DATABASE CONNECTION FAILED!")
        print(f"\nError: {e}")
        print("\n🔧 TROUBLESHOOTING:")
        print("1. Make sure PostgreSQL is running")
        print("2. Check your DATABASE_URL in .env file")
        print("3. Verify your PostgreSQL password")
        print("4. Make sure the database 'healthcare_providers' exists")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False


def save_validated_provider(golden_record: dict, state: dict) -> Optional[int]:
    """
    💾 SAVE VALIDATED PROVIDER TO DATABASE
    
    This is called by your agent when a provider passes validation (GREEN/YELLOW path).
    
    Args:
        golden_record: The final validated provider data
        state: The full agent state with all metadata
    
    Returns:
        Database ID of the saved provider, or None if failed
    """
    db = SessionLocal()
    try:
        # Check if provider already exists
        existing = db.query(ValidatedProvider).filter_by(npi=golden_record.get('npi')).first()
        
        if existing:
            # UPDATE existing record
            print(f"📝 Updating existing provider NPI: {golden_record.get('npi')}")
            
            # Update fields
            existing.provider_name = golden_record.get('provider_name')
            existing.specialty = golden_record.get('specialty')
            existing.address = golden_record.get('address')
            existing.city = golden_record.get('city', '')
            existing.state = golden_record.get('state', '')
            existing.zip_code = golden_record.get('zip_code', '')
            existing.phone = golden_record.get('phone')
            existing.website = golden_record.get('website')
            
            existing.license_status = golden_record.get('license_status')
            existing.license_number = golden_record.get('license_number', '')
            existing.license_state = golden_record.get('license_state', '')
            existing.oig_excluded = golden_record.get('oig_excluded', False)
            
            existing.confidence_score = state.get('confidence_score')
            existing.confidence_tier = state.get('quality_metrics', {}).get('confidence_tier')
            existing.digital_footprint_score = golden_record.get('digital_footprint_score', 0)
            existing.risk_score = state.get('quality_metrics', {}).get('risk_score', 0)
            
            existing.education = golden_record.get('education', [])
            existing.certifications = golden_record.get('certifications', [])
            existing.languages = golden_record.get('languages', [])
            existing.insurance_accepted = golden_record.get('insurance_accepted', [])
            
            existing.qa_flags = state.get('qa_flags', [])
            existing.fraud_indicators = state.get('fraud_indicators', [])
            
            existing.updated_at = datetime.now(timezone.utc)
            existing.last_verified = datetime.now(timezone.utc)
            
            existing.validation_metadata = {
                'execution_metadata': state.get('execution_metadata', {}),
                'quality_metrics': state.get('quality_metrics', {})
            }
            existing.data_sources = golden_record.get('data_sources', {})
            
            provider_id = existing.id
            
        else:
            # CREATE new record
            print(f"✨ Creating new provider NPI: {golden_record.get('npi')}")
            
            new_provider = ValidatedProvider(
                npi=golden_record.get('npi'),
                provider_name=golden_record.get('provider_name'),
                specialty=golden_record.get('specialty'),
                address=golden_record.get('address'),
                city=golden_record.get('city', ''),
                state=golden_record.get('state', ''),
                zip_code=golden_record.get('zip_code', ''),
                phone=golden_record.get('phone'),
                website=golden_record.get('website'),
                
                license_status=golden_record.get('license_status'),
                license_number=golden_record.get('license_number', ''),
                license_state=golden_record.get('license_state', ''),
                oig_excluded=golden_record.get('oig_excluded', False),
                
                confidence_score=state.get('confidence_score'),
                confidence_tier=state.get('quality_metrics', {}).get('confidence_tier'),
                digital_footprint_score=golden_record.get('digital_footprint_score', 0),
                risk_score=state.get('quality_metrics', {}).get('risk_score', 0),
                
                education=golden_record.get('education', []),
                certifications=golden_record.get('certifications', []),
                languages=golden_record.get('languages', []),
                insurance_accepted=golden_record.get('insurance_accepted', []),
                
                qa_flags=state.get('qa_flags', []),
                fraud_indicators=state.get('fraud_indicators', []),
                
                validation_metadata={
                    'execution_metadata': state.get('execution_metadata', {}),
                    'quality_metrics': state.get('quality_metrics', {})
                },
                data_sources=golden_record.get('data_sources', {})
            )
            
            db.add(new_provider)
            db.flush()  # Get the ID
            provider_id = new_provider.id
        
        # Save to history
        history = VerificationHistory(
            provider_id=provider_id,
            confidence_score=state.get('confidence_score'),
            changes_detected={},  # You can track changes here
            verification_result=state.get('quality_metrics', {})
        )
        db.add(history)
        
        db.commit()
        print(f"✅ Provider saved successfully! ID: {provider_id}")
        return provider_id
        
    except IntegrityError as e:
        db.rollback()
        print(f"❌ Database integrity error: {e}")
        return None
    except Exception as e:
        db.rollback()
        print(f"❌ Error saving provider: {e}")
        return None
    finally:
        db.close()


def save_to_review_queue(provider_data: dict, state: dict) -> Optional[int]:
    """
    🔴 SAVE TO REVIEW QUEUE

    Called when a provider needs human review (RED path).
    """
    db = SessionLocal()
    try:
        # -----------------------------
        # PRIORITY CALCULATION LOGIC
        # -----------------------------
        confidence = state.get("confidence_score", 1)
        fraud = state.get("fraud_indicators", [])
        risk_score = state.get("quality_metrics", {}).get("risk_score", 0)

        if fraud:
            priority = "HIGH"
        elif confidence < 0.5:
            priority = "HIGH"
        elif risk_score >= 10:
            priority = "HIGH"
        elif confidence < 0.65:
            priority = "NORMAL"
        else:
            priority = "LOW"

        # -----------------------------
        # CREATE REVIEW ENTRY
        # -----------------------------
        review_entry = ReviewQueue(
            provider_name=provider_data.get("full_name"),
            npi=provider_data.get("NPI"),
            confidence_score=confidence,
            review_reason=state.get("review_reason"),
            flags=state.get("qa_flags", []),
            fraud_indicators=fraud,
            status="PENDING",
            priority=priority,
            original_data=provider_data,
            validation_result=state.get("quality_metrics", {})
        )

        db.add(review_entry)
        db.commit()

        review_id = review_entry.id
        print(f"📋 Added to review queue! ID: {review_id} | Priority: {priority}")
        return review_id

    except Exception as e:
        db.rollback()
        print(f"❌ Error saving to review queue: {e}")
        return None
    finally:
        db.close()


def get_pending_reviews(limit: int = 50) -> List[dict]:
    """
    📋 GET PENDING REVIEWS
    
    Get providers waiting for human review.
    
    Returns:
        List of review queue entries
    """
    db = SessionLocal()
    try:
        reviews = db.query(ReviewQueue).filter_by(status='PENDING').order_by(
            ReviewQueue.priority.desc(),
            ReviewQueue.created_at.asc()
        ).limit(limit).all()
        
        return [r.to_dict() for r in reviews]
    finally:
        db.close()


def search_providers(
    name: str = None,
    state: str = None,
    specialty: str = None,
    min_confidence: float = 0.0
) -> List[dict]:
    """
    🔍 SEARCH VALIDATED PROVIDERS
    
    Search your validated provider database.
    
    Example:
        providers = search_providers(name="Smith", state="CA", min_confidence=0.8)
    """
    db = SessionLocal()
    try:
        query = db.query(ValidatedProvider).filter(
            ValidatedProvider.confidence_score >= min_confidence
        )
        
        if name:
            query = query.filter(ValidatedProvider.provider_name.ilike(f"%{name}%"))
        if state:
            query = query.filter_by(state=state)
        if specialty:
            query = query.filter(ValidatedProvider.specialty.ilike(f"%{specialty}%"))
        
        providers = query.order_by(ValidatedProvider.confidence_score.desc()).limit(100).all()
        return [p.to_dict() for p in providers]
    finally:
        db.close()


# ============================================
# MAIN: INITIALIZE DATABASE
# ============================================

if __name__ == "__main__":
    print("\n" + "🏥"*30)
    print("HEALTHCARE PROVIDER DATABASE SETUP")
    print("🏥"*30)
    
    success = init_database()
    
    if success:
        print("\n🎉 SUCCESS! Your database is ready!")
        print("\n📝 Next steps:")
        print("1. Your database tables are created")
        print("2. Update your agent.py to use these functions")
        print("3. Start validating providers!")
        
        # Show example usage
        print("\n💡 Example usage:")
        print("```python")
        print("from database_setup import save_validated_provider, get_pending_reviews")
        print("")
        print("# In your agent.py auto_approve_node:")
        print("save_validated_provider(golden_record, state)")
        print("")
        print("# Get pending reviews:")
        print("reviews = get_pending_reviews()")
        print("```")
    else:
        print("\n❌ Setup failed. Please check the error messages above.")