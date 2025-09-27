#!/bin/bash

# =============================================
# JustAskShel Database Scripts Execution Runner
# =============================================
# Description: Execute all database scripts in correct order
# Usage: ./run_scripts.sh [environment] [operation]
# Example: ./run_scripts.sh development create
#          ./run_scripts.sh development drop

set -e  # Exit on any error

# Configuration
DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
DB_NAME="${PGDATABASE:-justaskshel_db}"
DB_USER="${PGUSER:-postgres}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if psql is available
check_dependencies() {
    if ! command -v psql &> /dev/null; then
        log_error "psql is not installed or not in PATH"
        exit 1
    fi
}

# Execute SQL script
execute_sql() {
    local script_path="$1"
    local script_name=$(basename "$script_path")
    
    log_info "Executing: $script_name"
    
    if [[ ! -f "$script_path" ]]; then
        log_error "Script not found: $script_path"
        return 1
    fi
    
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$script_path"
    
    if [[ $? -eq 0 ]]; then
        log_success "Completed: $script_name"
    else
        log_error "Failed: $script_name"
        return 1
    fi
}

# Create database schema and populate with data
create_database() {
    log_info "Starting database creation process..."
    
    # 1. Schema initialization
    log_info "=== PHASE 1: Schema Initialization ==="
    execute_sql "schema/00_init.sql"
    execute_sql "schema/01_create_schema.sql"
    
    # 2. Table creation
    log_info "=== PHASE 2: Table Creation ==="
    execute_sql "tables/10_create_core_tables.sql"
    execute_sql "tables/20_create_insurance_tables.sql"
    execute_sql "tables/30_create_policy_claims_tables.sql"
    execute_sql "tables/40_create_association_tables.sql"
    
    # 3. Objects creation
    log_info "=== PHASE 3: Database Objects ==="
    execute_sql "objects/10_create_indexes.sql"
    
    # 4. Data seeding
    log_info "=== PHASE 4: Data Seeding ==="
    execute_sql "seed/10_base_seed.sql"
    execute_sql "seed/20_test_accounts_seed.sql"
    execute_sql "seed/30_sample_data_seed.sql"
    
    log_success "Database creation completed successfully!"
}

# Drop database schema
drop_database() {
    log_warning "=== WARNING: This will destroy all data permanently! ==="
    read -p "Are you sure you want to drop all tables? (type 'yes' to confirm): " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        log_info "Operation cancelled."
        return 0
    fi
    
    log_info "Starting database drop process..."
    execute_sql "tables/90_drop_all_tables.sql"
    execute_sql "schema/99_drop_schema.sql"
    
    log_success "Database drop completed successfully!"
}

# Show usage information
show_usage() {
    echo "Usage: $0 [environment] [operation]"
    echo ""
    echo "Environments:"
    echo "  development   - Development database"
    echo "  production    - Production database (use with caution)"
    echo ""
    echo "Operations:"
    echo "  create        - Create database schema and seed data"
    echo "  drop          - Drop all database objects (DESTRUCTIVE)"
    echo "  help          - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development create"
    echo "  $0 development drop"
    echo ""
    echo "Environment Variables:"
    echo "  PGHOST        - Database host (default: localhost)"
    echo "  PGPORT        - Database port (default: 5432)"
    echo "  PGDATABASE    - Database name (default: justaskshel_db)"
    echo "  PGUSER        - Database user (default: postgres)"
    echo "  PGPASSWORD    - Database password"
}

# Main execution
main() {
    local environment="$1"
    local operation="$2"
    
    # Change to script directory
    cd "$(dirname "$0")"
    
    # Check dependencies
    check_dependencies
    
    # Validate arguments
    if [[ -z "$environment" || -z "$operation" ]]; then
        show_usage
        exit 1
    fi
    
    # Environment validation
    if [[ "$environment" != "development" && "$environment" != "production" ]]; then
        log_error "Invalid environment: $environment"
        show_usage
        exit 1
    fi
    
    # Production safety check
    if [[ "$environment" == "production" ]]; then
        log_warning "Operating on PRODUCTION environment!"
        read -p "Are you sure? (type 'PRODUCTION' to confirm): " confirm
        if [[ "$confirm" != "PRODUCTION" ]]; then
            log_info "Operation cancelled."
            exit 0
        fi
    fi
    
    # Execute operation
    case "$operation" in
        "create")
            create_database
            ;;
        "drop")
            drop_database
            ;;
        "help")
            show_usage
            ;;
        *)
            log_error "Invalid operation: $operation"
            show_usage
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"
