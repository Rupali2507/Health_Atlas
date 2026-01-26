import sys
from datetime import datetime
from database_setup import (
    SessionLocal, ValidatedProvider, ReviewQueue, 
    VerificationHistory, DataSourceLog, search_providers, get_pending_reviews
)


def clear_screen():
    """Clear the terminal screen."""
    import os
    os.system('cls' if os.name == 'nt' else 'clear')


def show_menu():
    """Display main menu."""
    clear_screen()
    print("\n" + "="*60)
    print("🏥 HEALTHCARE PROVIDER DATABASE MANAGER")
    print("="*60)
    print("\n📊 DATABASE OPERATIONS:")
    print("  1. View Recent Providers")
    print("  2. Search Providers")
    print("  3. View Review Queue")
    print("  4. View Statistics")
    print("  5. Export to CSV")
    print("  6. Approve/Reject Review")
    print("  7. Delete Provider")
    print("  8. View Provider Details")
    print("  9. Exit")
    print("\n" + "="*60)


def view_recent_providers():
    """View most recently added providers."""
    db = SessionLocal()
    try:
        providers = db.query(ValidatedProvider).order_by(
            ValidatedProvider.created_at.desc()
        ).limit(20).all()
        
        print("\n📋 RECENT PROVIDERS (Last 20)")
        print("="*100)
        print(f"{'ID':<6} {'NPI':<12} {'Name':<30} {'State':<6} {'Tier':<10} {'Confidence':<12} {'Created':<20}")
        print("-"*100)
        
        for p in providers:
            created = p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else "N/A"
            print(f"{p.id:<6} {p.npi:<12} {p.provider_name[:28]:<30} {p.state:<6} "
                  f"{p.confidence_tier:<10} {p.confidence_score:>6.2%}      {created:<20}")
        
        print("-"*100)
        print(f"Total: {len(providers)} providers shown")
        
    finally:
        db.close()
    
    input("\nPress Enter to continue...")


def search_providers_interactive():
    """Interactive provider search."""
    print("\n🔍 SEARCH PROVIDERS")
    print("="*60)
    
    name = input("Provider name (or press Enter to skip): ").strip()
    state = input("State (e.g., CA, TX, or press Enter to skip): ").strip().upper()
    specialty = input("Specialty (or press Enter to skip): ").strip()
    min_conf = input("Minimum confidence (0-1, or press Enter for 0): ").strip()
    
    try:
        min_conf = float(min_conf) if min_conf else 0.0
    except:
        min_conf = 0.0
    
    results = search_providers(
        name=name if name else None,
        state=state if state else None,
        specialty=specialty if specialty else None,
        min_confidence=min_conf
    )
    
    print(f"\n📊 SEARCH RESULTS: {len(results)} providers found")
    print("="*100)
    
    if results:
        print(f"{'ID':<6} {'NPI':<12} {'Name':<30} {'Specialty':<20} {'Tier':<10} {'Confidence':<12}")
        print("-"*100)
        
        for p in results:
            spec = p.get('specialty', '')[:18] if p.get('specialty') else ''
            print(f"{p['id']:<6} {p['npi']:<12} {p['provider_name'][:28]:<30} {spec:<20} "
                  f"{p['confidence_tier']:<10} {p['confidence_score']:>6.2%}")
    
    input("\nPress Enter to continue...")


def view_review_queue():
    """View providers in review queue."""
    db = SessionLocal()
    try:
        reviews = db.query(ReviewQueue).filter_by(status='PENDING').order_by(
            ReviewQueue.priority.desc(),
            ReviewQueue.created_at.asc()
        ).all()
        
        print("\n🔴 REVIEW QUEUE (Pending Human Review)")
        print("="*120)
        print(f"{'ID':<6} {'NPI':<12} {'Name':<30} {'Reason':<35} {'Confidence':<12} {'Priority':<10} {'Created':<20}")
        print("-"*120)
        
        for r in reviews:
            created = r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "N/A"
            reason = r.review_reason[:33] if r.review_reason else ""
            print(f"{r.id:<6} {r.npi:<12} {r.provider_name[:28]:<30} {reason:<35} "
                  f"{r.confidence_score:>6.2%}      {r.priority:<10} {created:<20}")
        
        print("-"*120)
        print(f"Total: {len(reviews)} providers awaiting review")
        
    finally:
        db.close()
    
    input("\nPress Enter to continue...")


def view_statistics():
    """View database statistics."""
    db = SessionLocal()
    try:
        # Total providers
        total = db.query(ValidatedProvider).count()
        
        # By tier
        platinum = db.query(ValidatedProvider).filter_by(confidence_tier='PLATINUM').count()
        gold = db.query(ValidatedProvider).filter_by(confidence_tier='GOLD').count()
        questionable = db.query(ValidatedProvider).filter_by(confidence_tier='QUESTIONABLE').count()
        
        # By state (top 10)
        from sqlalchemy import func
        state_counts = db.query(
            ValidatedProvider.state, 
            func.count(ValidatedProvider.id)
        ).group_by(ValidatedProvider.state).order_by(
            func.count(ValidatedProvider.id).desc()
        ).limit(10).all()
        
        # Review queue
        pending_reviews = db.query(ReviewQueue).filter_by(status='PENDING').count()
        approved_reviews = db.query(ReviewQueue).filter_by(status='APPROVED').count()
        rejected_reviews = db.query(ReviewQueue).filter_by(status='REJECTED').count()
        
        # Average confidence
        avg_conf = db.query(func.avg(ValidatedProvider.confidence_score)).scalar()
        
        print("\n📊 DATABASE STATISTICS")
        print("="*60)
        print(f"\n🏥 VALIDATED PROVIDERS:")
        print(f"  Total Providers: {total}")
        print(f"  🟢 Platinum Tier: {platinum} ({platinum/total*100:.1f}%)" if total else "  🟢 Platinum Tier: 0")
        print(f"  🟡 Gold Tier: {gold} ({gold/total*100:.1f}%)" if total else "  🟡 Gold Tier: 0")
        print(f"  🔴 Questionable: {questionable} ({questionable/total*100:.1f}%)" if total else "  🔴 Questionable: 0")
        print(f"  Average Confidence: {avg_conf:.2%}" if avg_conf else "  Average Confidence: N/A")
        
        print(f"\n📋 REVIEW QUEUE:")
        print(f"  Pending: {pending_reviews}")
        print(f"  Approved: {approved_reviews}")
        print(f"  Rejected: {rejected_reviews}")
        
        print(f"\n🗺️ TOP STATES:")
        for state, count in state_counts:
            print(f"  {state or 'N/A'}: {count} providers ({count/total*100:.1f}%)" if total else f"  {state}: {count}")
        
    finally:
        db.close()
    
    input("\nPress Enter to continue...")


def export_to_csv():
    """Export providers to CSV."""
    import csv
    
    db = SessionLocal()
    try:
        providers = db.query(ValidatedProvider).all()
        
        filename = f"providers_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Header
            writer.writerow([
                'ID', 'NPI', 'Name', 'Specialty', 'Address', 'City', 'State', 'Zip',
                'Phone', 'License Status', 'Confidence Score', 'Confidence Tier',
                'OIG Excluded', 'Created At'
            ])
            
            # Data
            for p in providers:
                writer.writerow([
                    p.id, p.npi, p.provider_name, p.specialty, p.address, p.city,
                    p.state, p.zip_code, p.phone, p.license_status,
                    p.confidence_score, p.confidence_tier, p.oig_excluded,
                    p.created_at.isoformat() if p.created_at else ''
                ])
        
        print(f"\n✅ Exported {len(providers)} providers to: {filename}")
        
    finally:
        db.close()
    
    input("\nPress Enter to continue...")


def approve_reject_review():
    """Approve or reject a provider from review queue."""
    review_id = input("\nEnter Review ID: ").strip()
    
    if not review_id.isdigit():
        print("❌ Invalid ID")
        input("Press Enter to continue...")
        return
    
    db = SessionLocal()
    try:
        review = db.query(ReviewQueue).filter_by(id=int(review_id)).first()
        
        if not review:
            print(f"❌ Review ID {review_id} not found")
            input("Press Enter to continue...")
            return
        
        print(f"\n📋 Review Details:")
        print(f"  Provider: {review.provider_name}")
        print(f"  NPI: {review.npi}")
        print(f"  Reason: {review.review_reason}")
        print(f"  Confidence: {review.confidence_score:.2%}")
        
        decision = input("\n Approve (A) or Reject (R)? ").strip().upper()
        
        if decision not in ['A', 'R']:
            print("❌ Invalid choice")
            input("Press Enter to continue...")
            return
        
        reviewer_name = input("Your name: ").strip()
        notes = input("Notes (optional): ").strip()
        
        review.status = 'APPROVED' if decision == 'A' else 'REJECTED'
        review.reviewed_at = datetime.now()
        review.reviewer_name = reviewer_name
        review.reviewer_notes = notes
        review.reviewer_decision = 'APPROVE' if decision == 'A' else 'REJECT'
        
        db.commit()
        
        print(f"\n✅ Review {review_id} {'APPROVED' if decision == 'A' else 'REJECTED'}")
        
        if decision == 'A':
            print("\n💡 Tip: You may want to manually add this provider to validated_providers table")
        
    finally:
        db.close()
    
    input("\nPress Enter to continue...")


def delete_provider():
    """Delete a provider."""
    provider_id = input("\nEnter Provider ID to delete: ").strip()
    
    if not provider_id.isdigit():
        print("❌ Invalid ID")
        input("Press Enter to continue...")
        return
    
    db = SessionLocal()
    try:
        provider = db.query(ValidatedProvider).filter_by(id=int(provider_id)).first()
        
        if not provider:
            print(f"❌ Provider ID {provider_id} not found")
            input("Press Enter to continue...")
            return
        
        print(f"\n⚠️  DELETE PROVIDER:")
        print(f"  ID: {provider.id}")
        print(f"  Name: {provider.provider_name}")
        print(f"  NPI: {provider.npi}")
        
        confirm = input("\nType 'DELETE' to confirm: ").strip()
        
        if confirm == 'DELETE':
            db.delete(provider)
            db.commit()
            print(f"\n✅ Provider {provider_id} deleted")
        else:
            print("\n❌ Deletion cancelled")
        
    finally:
        db.close()
    
    input("\nPress Enter to continue...")


def view_provider_details():
    """View detailed information about a provider."""
    provider_id = input("\nEnter Provider ID: ").strip()
    
    if not provider_id.isdigit():
        print("❌ Invalid ID")
        input("Press Enter to continue...")
        return
    
    db = SessionLocal()
    try:
        provider = db.query(ValidatedProvider).filter_by(id=int(provider_id)).first()
        
        if not provider:
            print(f"❌ Provider ID {provider_id} not found")
            input("Press Enter to continue...")
            return
        
        print("\n" + "="*60)
        print(f"📋 PROVIDER DETAILS - ID {provider.id}")
        print("="*60)
        
        print(f"\n🏥 BASIC INFO:")
        print(f"  Name: {provider.provider_name}")
        print(f"  NPI: {provider.npi}")
        print(f"  Specialty: {provider.specialty}")
        
        print(f"\n📍 CONTACT:")
        print(f"  Address: {provider.address}")
        print(f"  City: {provider.city}, {provider.state} {provider.zip_code}")
        print(f"  Phone: {provider.phone}")
        print(f"  Website: {provider.website}")
        
        print(f"\n📜 LICENSE:")
        print(f"  Status: {provider.license_status}")
        print(f"  Number: {provider.license_number}")
        print(f"  OIG Excluded: {'❌ YES' if provider.oig_excluded else '✅ NO'}")
        
        print(f"\n📊 QUALITY METRICS:")
        print(f"  Confidence: {provider.confidence_score:.2%}")
        print(f"  Tier: {provider.confidence_tier}")
        print(f"  Digital Footprint: {provider.digital_footprint_score:.2%}")
        print(f"  Risk Score: {provider.risk_score}")
        
        if provider.qa_flags:
            print(f"\n⚠️  QA FLAGS: {len(provider.qa_flags)}")
            for flag in provider.qa_flags[:5]:
                print(f"    • {flag}")
        
        if provider.fraud_indicators:
            print(f"\n🚨 FRAUD INDICATORS: {len(provider.fraud_indicators)}")
            for indicator in provider.fraud_indicators:
                print(f"    • {indicator}")
        
        print(f"\n📅 TIMESTAMPS:")
        print(f"  Created: {provider.created_at}")
        print(f"  Last Updated: {provider.updated_at}")
        print(f"  Last Verified: {provider.last_verified}")
        
        # Verification history
        history_count = db.query(VerificationHistory).filter_by(provider_id=provider.id).count()
        print(f"\n📜 VERIFICATION HISTORY: {history_count} records")
        
    finally:
        db.close()
    
    input("\nPress Enter to continue...")


def main():
    """Main program loop."""
    while True:
        show_menu()
        choice = input("\nSelect option (1-9): ").strip()
        
        if choice == '1':
            view_recent_providers()
        elif choice == '2':
            search_providers_interactive()
        elif choice == '3':
            view_review_queue()
        elif choice == '4':
            view_statistics()
        elif choice == '5':
            export_to_csv()
        elif choice == '6':
            approve_reject_review()
        elif choice == '7':
            delete_provider()
        elif choice == '8':
            view_provider_details()
        elif choice == '9':
            print("\n👋 Goodbye!")
            sys.exit(0)
        else:
            print("\n❌ Invalid option. Please try again.")
            input("Press Enter to continue...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)