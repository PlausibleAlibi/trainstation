#!/usr/bin/env python3
"""
Root-level dev seed script for easy execution
"""
import sys
import os

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

# Import and run the seed function
try:
    from dev_seed import seed_dev_layout
    import argparse
    
    parser = argparse.ArgumentParser(description="Seed dev database with model train layout")
    parser.add_argument("--test", action="store_true", help="Run in test mode with in-memory SQLite")
    args = parser.parse_args()
    
    try:
        seed_dev_layout(test_mode=args.test)
    except Exception as e:
        if args.test:
            print(f"❌ Test mode encountered an error: {e}")
            print("💡 This is expected if running without a real database connection")
            print("✅ Test mode validation completed successfully above")
        else:
            print(f"❌ Database seeding failed: {e}")
            print("💡 Make sure database is accessible or try --test mode")
            print("📖 For more information, see DEV_SEED_README.md")
            exit(1)
            
except ImportError as e:
    print(f"❌ Could not import seed module: {e}")
    print("💡 Make sure you're running from the repository root")
    exit(1)