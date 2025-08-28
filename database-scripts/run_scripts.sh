#!/bin/bash

# =====================================================
# JustAskShel Database Scripts Execution Helper
# =====================================================
# This script provides easy execution of database operations
# Usage: ./run_scripts.sh [operation] [database_url]
# =====================================================

set -e  # Exit on any error

# Default database URL (uses environment variable if set)
DB_URL="${DATABASE_URL:-postgresql://localhost:5432/justaskshel}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to execute SQL file
execute_sql() {
    local file_path="$1"
    local description="$2"
    
    print_status "Executing: $description"
    print_status "File: $file_path"
    print_status "Database: $DB_URL"
    
    if [ ! -f "$file_path" ]; then
        print_error "SQL file not found: $file_path"
        exit 1
    fi
    
    if psql "$DB_URL" -f "$file_path"; then
        print_success "$description completed successfully"
    else
        print_error "$description failed"
        exit 1
    fi
}

# Function to confirm destructive operations
confirm_operation() {
    local operation="$1"
    echo
    print_warning "⚠️  DESTRUCTIVE OPERATION WARNING ⚠️"
    print_warning "You are about to perform: $operation"
    print_warning "This will permanently remove all data from the database!"
    print_warning "Database: $DB_URL"
    echo
    read -p "Are you absolutely sure? Type 'yes' to continue: " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_status "Operation cancelled by user"
        exit 0
    fi
}

# Function to check database connectivity
check_database() {
    print_status "Checking database connectivity..."
    
    if psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection successful"
    else
        print_error "Cannot connect to database: $DB_URL"
        print_error "Please check your connection string and database availability"
        exit 1
    fi
}

# Function to display usage
show_usage() {
    echo
    echo "JustAskShel Database Scripts Execution Helper"
    echo
    echo "Usage: $0 [OPERATION] [DATABASE_URL]"
    echo
    echo "Operations:"
    echo "  create      - Create complete database schema (01_create_schema.sql)"
    echo "  seed        - Populate database with initial data (02_seed_data.sql)"
    echo "  setup       - Full setup: create schema + seed data"
    echo "  drop        - Drop all database objects (03_drop_schema.sql) [DESTRUCTIVE]"
    echo "  reset       - Complete reset: drop + create + seed [DESTRUCTIVE]"
    echo "  utility     - Run utility and monitoring queries (04_utility_queries.sql)"
    echo "  check       - Check database connectivity and show basic stats"
    echo
    echo "Examples:"
    echo "  $0 setup                                    # Full setup with default DB"
    echo "  $0 create postgresql://user:pass@host/db   # Create schema with custom DB"
    echo "  $0 reset                                    # Complete database reset"
    echo "  $0 utility                                  # Run monitoring queries"
    echo
    echo "Environment Variables:"
    echo "  DATABASE_URL  - Default database connection string"
    echo "                  Current: ${DATABASE_URL:-'not set'}"
    echo
}

# Main script logic
main() {
    local operation="$1"
    local custom_db_url="$2"
    
    # Use custom database URL if provided
    if [ -n "$custom_db_url" ]; then
        DB_URL="$custom_db_url"
    fi
    
    # Validate operation parameter
    if [ -z "$operation" ]; then
        show_usage
        exit 1
    fi
    
    # Get script directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    case "$operation" in
        "create")
            check_database
            execute_sql "$SCRIPT_DIR/sql/01_create_schema.sql" "Database schema creation"
            ;;
            
        "seed")
            check_database
            execute_sql "$SCRIPT_DIR/sql/02_seed_data.sql" "Database seed data population"
            ;;
            
        "setup")
            print_status "Starting complete database setup..."
            check_database
            execute_sql "$SCRIPT_DIR/sql/01_create_schema.sql" "Database schema creation"
            execute_sql "$SCRIPT_DIR/sql/02_seed_data.sql" "Database seed data population"
            print_success "Complete database setup finished successfully!"
            ;;
            
        "drop")
            confirm_operation "DROP ALL DATABASE OBJECTS"
            check_database
            execute_sql "$SCRIPT_DIR/sql/03_drop_schema.sql" "Database schema removal"
            ;;
            
        "reset")
            confirm_operation "COMPLETE DATABASE RESET (Drop + Create + Seed)"
            check_database
            execute_sql "$SCRIPT_DIR/sql/03_drop_schema.sql" "Database schema removal"
            execute_sql "$SCRIPT_DIR/sql/01_create_schema.sql" "Database schema creation"
            execute_sql "$SCRIPT_DIR/sql/02_seed_data.sql" "Database seed data population"
            print_success "Complete database reset finished successfully!"
            ;;
            
        "utility")
            check_database
            print_status "Executing utility and monitoring queries..."
            print_status "Output will show database statistics and analytics"
            execute_sql "$SCRIPT_DIR/sql/04_utility_queries.sql" "Utility queries execution"
            ;;
            
        "check")
            check_database
            print_status "Running basic database checks..."
            
            # Check tables exist
            table_count=$(psql "$DB_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')
            
            if [ "$table_count" -gt 0 ]; then
                print_success "Database has $table_count tables"
                
                # Show table list
                print_status "Tables in database:"
                psql "$DB_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;" | sed 's/^/ - /'
            else
                print_warning "Database appears to be empty (no tables found)"
            fi
            ;;
            
        "help"|"-h"|"--help")
            show_usage
            ;;
            
        *)
            print_error "Unknown operation: $operation"
            show_usage
            exit 1
            ;;
    esac
}

# Check if script is being executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi